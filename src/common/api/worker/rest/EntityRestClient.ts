import type { RestClient } from "./RestClient"
import type { CryptoFacade } from "../crypto/CryptoFacade"
import { _verifyType, HttpMethod, MediaType, resolveTypeReference } from "../../common/EntityFunctions"
import { SessionKeyNotFoundError } from "../../common/error/SessionKeyNotFoundError"
import type { EntityUpdate } from "../../entities/sys/TypeRefs.js"
import { PushIdentifierTypeRef } from "../../entities/sys/TypeRefs.js"
import {
	ConnectionError,
	InternalServerError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	PayloadTooLargeError,
} from "../../common/error/RestError"
import type { lazy } from "@tutao/tutanota-utils"
import { isSameTypeRef, Mapper, ofClass, promiseMap, splitInChunks, TypeRef } from "@tutao/tutanota-utils"
import { assertWorkerOrNode } from "../../common/Env"
import type { ListElementEntity, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { getElementId, LOAD_MULTIPLE_LIMIT, POST_MULTIPLE_LIMIT } from "../../common/utils/EntityUtils"
import { Type } from "../../common/EntityConstants.js"
import { SetupMultipleError } from "../../common/error/SetupMultipleError"
import { expandId } from "./DefaultEntityRestCache.js"
import { InstanceMapper } from "../crypto/InstanceMapper"
import { QueuedBatch } from "../EventQueue.js"
import { AuthDataProvider } from "../facades/UserFacade"
import { LoginIncompleteError } from "../../common/error/LoginIncompleteError.js"
import { BlobServerUrl } from "../../entities/storage/TypeRefs.js"
import { BlobAccessTokenFacade } from "../facades/BlobAccessTokenFacade.js"
import { AesKey } from "@tutao/tutanota-crypto"
import { isOfflineError } from "../../common/utils/ErrorUtils.js"
import { VersionedEncryptedKey, VersionedKey } from "../crypto/CryptoWrapper.js"

assertWorkerOrNode()

export function typeRefToPath(typeRef: TypeRef<any>): string {
	return `/rest/${typeRef.app}/${typeRef.type.toLowerCase()}`
}

export interface EntityRestClientSetupOptions {
	baseUrl?: string
	/** Use this key to encrypt session key instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKey?: VersionedKey
}

export interface EntityRestClientUpdateOptions {
	baseUrl?: string
	/** Use the key provided by this to decrypt the existing ownerEncSessionKey instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKeyProvider?: OwnerKeyProvider
}

/**
 * Whether to use the cache to fetch the entity
 */
export const enum CacheMode {
	/** Prefer cached value if it's there or fall back to network. */
	Cache,
	/** Prefer the value from network, do not fetch from cache. The entity will still be cached upon loading. */
	Bypass,
}

export interface EntityRestClientLoadOptions {
	queryParams?: Dict
	extraHeaders?: Dict
	/** Use the key provided by this to decrypt the existing ownerEncSessionKey instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKeyProvider?: OwnerKeyProvider
	/** Defaults to {@link CacheMode.Cache }*/
	cacheMode?: CacheMode
}

export interface OwnerEncSessionKeyProvider {
	(instanceElementId: Id): Promise<VersionedEncryptedKey>
}

export interface OwnerKeyProvider {
	(ownerKeyVersion: number): Promise<AesKey>
}

/**
 * The EntityRestInterface provides a convenient interface for invoking server side REST services.
 */
export interface EntityRestInterface {
	/**
	 * Reads a single element from the server (or cache). Entities are decrypted before they are returned.
	 * @param ownerKey Use this key to decrypt session key instead of trying to resolve the owner key based on the ownerGroup.
	 */
	load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, loadOptions?: EntityRestClientLoadOptions): Promise<T>

	/**
	 * Reads a range of elements from the server (or cache). Entities are decrypted before they are returned.
	 */
	loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]>

	/**
	 * Reads multiple elements from the server (or cache). Entities are decrypted before they are returned.
	 * @param ownerEncSessionKeyProvider use this to resolve the instances session key in case instance.ownerEncSessionKey is not defined (which might be undefined for MailDetails / Files)
	 */
	loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<Array<T>>

	/**
	 * Creates a single element on the server. Entities are encrypted before they are sent.
	 */
	setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict, options?: EntityRestClientSetupOptions): Promise<Id>

	/**
	 * Creates multiple elements on the server. Entities are encrypted before they are sent.
	 */
	setupMultiple<T extends SomeEntity>(listId: Id | null, instances: ReadonlyArray<T>): Promise<Array<Id>>

	/**
	 * Modifies a single element on the server. Entities are encrypted before they are sent.
	 * @param instance
	 * @param options
	 */
	update<T extends SomeEntity>(instance: T, options?: EntityRestClientUpdateOptions): Promise<void>

	/**
	 * Deletes a single element on the server.
	 */
	erase<T extends SomeEntity>(instance: T): Promise<void>

	/**
	 * Must be called when entity events are received.
	 * @param batch The entity events that were received.
	 * @return Similar to the events in the data parameter, but reduced by the events which are obsolete.
	 */
	entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>>
}

/**
 * Retrieves the instances from the backend (db) and converts them to entities.
 *
 * Part of this process is
 * * the decryption for the returned instances (GET) and the encryption of all instances before they are sent (POST, PUT)
 * * the injection of aggregate instances for the returned instances (GET)
 * * caching for retrieved instances (GET)
 *
 */
export class EntityRestClient implements EntityRestInterface {
	get _crypto(): CryptoFacade {
		return this.lazyCrypto()
	}

	constructor(
		private readonly authDataProvider: AuthDataProvider,
		private readonly restClient: RestClient,
		private readonly lazyCrypto: lazy<CryptoFacade>,
		private readonly instanceMapper: InstanceMapper,
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
	) {}

	async load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, opts: EntityRestClientLoadOptions = {}): Promise<T> {
		const { listId, elementId } = expandId(id)
		const { path, queryParams, headers, typeModel } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			elementId,
			opts.queryParams,
			opts.extraHeaders,
			opts.ownerKeyProvider,
		)
		const json = await this.restClient.request(path, HttpMethod.GET, {
			queryParams,
			headers,
			responseType: MediaType.Json,
		})
		const entity = JSON.parse(json)
		const migratedEntity = await this._crypto.applyMigrations(typeRef, entity)
		const sessionKey = await this.resolveSessionKey(opts.ownerKeyProvider, migratedEntity, typeModel)

		const instance = await this.instanceMapper.decryptAndMapToInstance<T>(typeModel, migratedEntity, sessionKey)
		return this._crypto.applyMigrationsForInstance(instance)
	}

	private async resolveSessionKey(ownerKeyProvider: OwnerKeyProvider | undefined, migratedEntity: Record<string, any>, typeModel: TypeModel) {
		try {
			if (ownerKeyProvider && migratedEntity._ownerEncSessionKey) {
				const ownerKey = await ownerKeyProvider(Number(migratedEntity._ownerKeyVersion ?? 0))
				return this._crypto.resolveSessionKeyWithOwnerKey(migratedEntity, ownerKey)
			} else {
				return await this._crypto.resolveSessionKey(typeModel, migratedEntity)
			}
		} catch (e) {
			if (e instanceof SessionKeyNotFoundError) {
				console.log(`could not resolve session key for instance of type ${typeModel.app}/${typeModel.name}`, e)
				return null
			} else {
				throw e
			}
		}
	}

	async loadRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]> {
		const rangeRequestParams = {
			start: String(start),
			count: String(count),
			reverse: String(reverse),
		}
		const { path, headers, typeModel, queryParams } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			null,
			rangeRequestParams,
			undefined,
			undefined,
		)
		// This should never happen if type checking is not bypassed with any
		if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		const json = await this.restClient.request(path, HttpMethod.GET, {
			queryParams,
			headers,
			responseType: MediaType.Json,
		})
		return this._handleLoadMultipleResult(typeRef, JSON.parse(json))
	}

	async loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<Array<T>> {
		const { path, headers } = await this._validateAndPrepareRestRequest(typeRef, listId, null, undefined, undefined, undefined)
		const idChunks = splitInChunks(LOAD_MULTIPLE_LIMIT, elementIds)
		const typeModel = await resolveTypeReference(typeRef)

		const loadedChunks = await promiseMap(idChunks, async (idChunk) => {
			let queryParams = {
				ids: idChunk.join(","),
			}
			let json: string
			if (typeModel.type === Type.BlobElement) {
				json = await this.loadMultipleBlobElements(listId, queryParams, headers, path, typeRef)
			} else {
				json = await this.restClient.request(path, HttpMethod.GET, {
					queryParams,
					headers,
					responseType: MediaType.Json,
				})
			}
			return this._handleLoadMultipleResult(typeRef, JSON.parse(json), ownerEncSessionKeyProvider)
		})
		return loadedChunks.flat()
	}

	private async loadMultipleBlobElements(
		archiveId: Id | null,
		queryParams: { ids: string },
		headers: Dict | undefined,
		path: string,
		typeRef: TypeRef<any>,
	): Promise<string> {
		if (archiveId == null) {
			throw new Error("archiveId must be set to load BlobElementTypes")
		}
		const doBlobRequest = async () => {
			const blobServerAccessInfo = await this.blobAccessTokenFacade.requestReadTokenArchive(archiveId)
			const additionalRequestParams = Object.assign(
				{},
				headers, // prevent CORS request due to non standard header usage
				queryParams,
			)
			const allParams = await this.blobAccessTokenFacade.createQueryParams(blobServerAccessInfo, additionalRequestParams, typeRef)
			return tryServers(
				blobServerAccessInfo.servers,
				async (serverUrl) =>
					this.restClient.request(path, HttpMethod.GET, {
						queryParams: allParams,
						headers: {}, // prevent CORS request due to non standard header usage
						responseType: MediaType.Json,
						baseUrl: serverUrl,
						noCORS: true,
					}),
				`can't load instances from server `,
			)
		}
		const doEvictToken = () => this.blobAccessTokenFacade.evictArchiveToken(archiveId)

		return doBlobRequestWithRetry(doBlobRequest, doEvictToken)
	}

	async _handleLoadMultipleResult<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		loadedEntities: Array<any>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<Array<T>> {
		const model = await resolveTypeReference(typeRef)

		// PushIdentifier was changed in the system model v43 to encrypt the name.
		// We check here to check the type only once per array and not for each element.
		if (isSameTypeRef(typeRef, PushIdentifierTypeRef)) {
			await promiseMap(loadedEntities, (instance) => this._crypto.applyMigrations(typeRef, instance), {
				concurrency: 5,
			})
		}

		return promiseMap(
			loadedEntities,
			(instance) => {
				return this._decryptMapAndMigrate(instance, model, ownerEncSessionKeyProvider)
			},
			{ concurrency: 5 },
		)
	}

	async _decryptMapAndMigrate<T>(instance: any, model: TypeModel, ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider): Promise<T> {
		let sessionKey: AesKey | null
		if (ownerEncSessionKeyProvider) {
			sessionKey = await this._crypto.decryptSessionKey(instance, await ownerEncSessionKeyProvider(getElementId(instance)))
		} else {
			try {
				sessionKey = await this._crypto.resolveSessionKey(model, instance)
			} catch (e) {
				if (e instanceof SessionKeyNotFoundError) {
					console.log("could not resolve session key", e, e.message, e.stack)
					sessionKey = null // will result in _errors being set on the instance
				} else {
					throw e
				}
			}
		}
		const decryptedInstance = await this.instanceMapper.decryptAndMapToInstance<T>(model, instance, sessionKey)
		return this._crypto.applyMigrationsForInstance<T>(decryptedInstance)
	}

	async setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict, options?: EntityRestClientSetupOptions): Promise<Id> {
		const typeRef = instance._type
		const { typeModel, path, headers, queryParams } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			null,
			undefined,
			extraHeaders,
			options?.ownerKey,
		)

		if (typeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}

		const sk = await this._crypto.setNewOwnerEncSessionKey(typeModel, instance, options?.ownerKey)

		const encryptedEntity = await this.instanceMapper.encryptAndMapToLiteral(typeModel, instance, sk)
		const persistencePostReturn = await this.restClient.request(path, HttpMethod.POST, {
			baseUrl: options?.baseUrl,
			queryParams,
			headers,
			body: JSON.stringify(encryptedEntity),
			responseType: MediaType.Json,
		})
		return JSON.parse(persistencePostReturn).generatedId
	}

	async setupMultiple<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		const count = instances.length

		if (count < 1) {
			return []
		}

		const instanceChunks = splitInChunks(POST_MULTIPLE_LIMIT, instances)
		const typeRef = instances[0]._type
		const { typeModel, path, headers } = await this._validateAndPrepareRestRequest(typeRef, listId, null, undefined, undefined, undefined)

		if (typeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}

		const errors: Error[] = []
		const failedInstances: T[] = []
		const idChunks: Array<Array<Id>> = await promiseMap(instanceChunks, async (instanceChunk) => {
			try {
				const encryptedEntities = await promiseMap(instanceChunk, async (e) => {
					const sk = await this._crypto.setNewOwnerEncSessionKey(typeModel, e)

					return this.instanceMapper.encryptAndMapToLiteral(typeModel, e, sk)
				})
				// informs the server that this is a POST_MULTIPLE request
				const queryParams = {
					count: String(instanceChunk.length),
				}
				const persistencePostReturn = await this.restClient.request(path, HttpMethod.POST, {
					queryParams,
					headers,
					body: JSON.stringify(encryptedEntities),
					responseType: MediaType.Json,
				})
				return this.parseSetupMultiple(persistencePostReturn)
			} catch (e) {
				if (e instanceof PayloadTooLargeError) {
					// If we try to post too many large instances then we get PayloadTooLarge
					// So we fall back to posting single instances
					const returnedIds = await promiseMap(instanceChunk, (instance) => {
						return this.setup(listId, instance).catch((e) => {
							errors.push(e)
							failedInstances.push(instance)
						})
					})
					return returnedIds.filter(Boolean) as Id[]
				} else {
					errors.push(e)
					failedInstances.push(...instanceChunk)
					return [] as Id[]
				}
			}
		})

		if (errors.length) {
			if (errors.some(isOfflineError)) {
				throw new ConnectionError("Setup multiple entities failed")
			}
			throw new SetupMultipleError<T>("Setup multiple entities failed", errors, failedInstances)
		} else {
			return idChunks.flat()
		}
	}

	async update<T extends SomeEntity>(instance: T, options?: EntityRestClientUpdateOptions): Promise<void> {
		if (!instance._id) throw new Error("Id must be defined")
		const { listId, elementId } = expandId(instance._id)
		const { path, queryParams, headers, typeModel } = await this._validateAndPrepareRestRequest(
			instance._type,
			listId,
			elementId,
			undefined,
			undefined,
			options?.ownerKeyProvider,
		)
		const sessionKey = await this.resolveSessionKey(options?.ownerKeyProvider, instance, typeModel)
		const encryptedEntity = await this.instanceMapper.encryptAndMapToLiteral(typeModel, instance, sessionKey)
		await this.restClient.request(path, HttpMethod.PUT, {
			baseUrl: options?.baseUrl,
			queryParams,
			headers,
			body: JSON.stringify(encryptedEntity),
			responseType: MediaType.Json,
		})
	}

	async erase<T extends SomeEntity>(instance: T): Promise<void> {
		const { listId, elementId } = expandId(instance._id)
		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(instance._type, listId, elementId, undefined, undefined, undefined)
		await this.restClient.request(path, HttpMethod.DELETE, {
			queryParams,
			headers,
		})
	}

	async _validateAndPrepareRestRequest(
		typeRef: TypeRef<any>,
		listId: Id | null,
		elementId: Id | null,
		queryParams: Dict | undefined,
		extraHeaders: Dict | undefined,
		ownerKey: OwnerKeyProvider | VersionedKey | undefined,
	): Promise<{
		path: string
		queryParams: Dict | undefined
		headers: Dict | undefined
		typeModel: TypeModel
	}> {
		const typeModel = await resolveTypeReference(typeRef)

		_verifyType(typeModel)

		if (ownerKey == undefined && !this.authDataProvider.isFullyLoggedIn() && typeModel.encrypted) {
			// Short-circuit before we do an actual request which we can't decrypt
			throw new LoginIncompleteError(`Trying to do a network request with encrypted entity but is not fully logged in yet, type: ${typeModel.name}`)
		}

		let path = typeRefToPath(typeRef)

		if (listId) {
			path += "/" + listId
		}

		if (elementId) {
			path += "/" + elementId
		}

		const headers = Object.assign({}, this.authDataProvider.createAuthHeaders(), extraHeaders)

		if (Object.keys(headers).length === 0) {
			throw new NotAuthenticatedError("user must be authenticated for entity requests")
		}

		headers.v = typeModel.version
		return {
			path,
			queryParams,
			headers,
			typeModel,
		}
	}

	/**
	 * for the admin area (no cache available)
	 */
	entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
		return Promise.resolve(batch.events)
	}

	getRestClient(): RestClient {
		return this.restClient
	}

	private parseSetupMultiple(result: any): Id[] {
		try {
			return JSON.parse(result).map((r: any) => r.generatedId)
		} catch (e) {
			throw new Error(`Invalid response: ${result}, ${e}`)
		}
	}
}

/**
 * Tries to run the mapper action against a list of servers. If the action resolves
 * successfully, the result is returned. In case of an ConnectionError and errors
 * that might occur only for a single blob server, the next server is tried.
 * Throws in all other cases.
 */
export async function tryServers<T>(servers: BlobServerUrl[], mapper: Mapper<string, T>, errorMsg: string): Promise<T> {
	let index = 0
	let error: Error | null = null
	for (const server of servers) {
		try {
			return await mapper(server.url, index)
		} catch (e) {
			// InternalServerError is returned when accessing a corrupted archive, so we retry
			if (e instanceof ConnectionError || e instanceof InternalServerError || e instanceof NotFoundError) {
				console.log(`${errorMsg} ${server.url}`, e)
				error = e
			} else {
				throw e
			}
		}
		index++
	}
	throw error
}

/**
 * Do a blob request and retry it in case of a NotAuthorizedError, performing some cleanup before retrying.
 *
 * This is useful for blob requests to handle expired tokens, which cah occur if the requests take a long time, the client gets suspended or paused by the OS.
 * @param doBlobRequest
 * @param doEvictTokenBeforeRetry
 */
export async function doBlobRequestWithRetry<T>(doBlobRequest: () => Promise<T>, doEvictTokenBeforeRetry: () => void): Promise<T> {
	return doBlobRequest().catch(
		// in case one of the chunks could not be uploaded because of an invalid/expired token we upload all chunks again in order to guarantee that they are uploaded to the same archive.
		// we don't have to take care of already uploaded chunks, as they are unreferenced and will be cleaned up by the server automatically.
		ofClass(NotAuthorizedError, (e) => {
			doEvictTokenBeforeRetry()
			return doBlobRequest()
		}),
	)
}

export function getIds(
	instance: any,
	typeModel: TypeModel,
): {
	listId: string | null
	id: string
} {
	if (!instance._id) throw new Error("Id must be defined")
	let listId = null
	let id

	if (typeModel.type === Type.ListElement) {
		listId = instance._id[0]
		id = instance._id[1]
	} else {
		id = instance._id
	}

	return {
		listId,
		id,
	}
}
