import type { RestClient, SuspensionBehavior } from "./RestClient"
import { CryptoFacade } from "../crypto/CryptoFacade"
import { _verifyType, HttpMethod, MediaType, TypeModelResolver } from "../../common/EntityFunctions"
import { SessionKeyNotFoundError } from "../../common/error/SessionKeyNotFoundError"
import {
	ConnectionError,
	InternalServerError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	PayloadTooLargeError,
} from "../../common/error/RestError"
import { assertNotNull, downcast, KeyVersion, lazy, Mapper, ofClass, promiseMap, splitInChunks, TypeRef } from "@tutao/tutanota-utils"
import { assertWorkerOrNode } from "../../common/Env"
import type {
	ClientModelUntypedInstance,
	ClientTypeModel,
	Entity,
	ListElementEntity,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	ServerModelUntypedInstance,
	ServerTypeModel,
	SomeEntity,
	TypeModel,
	UntypedInstance,
} from "../../common/EntityTypes"
import { elementIdPart, LOAD_MULTIPLE_LIMIT, POST_MULTIPLE_LIMIT } from "../../common/utils/EntityUtils"
import { Type } from "../../common/EntityConstants.js"
import { SetupMultipleError } from "../../common/error/SetupMultipleError"
import { AuthDataProvider } from "../facades/UserFacade"
import { LoginIncompleteError } from "../../common/error/LoginIncompleteError.js"
import { BlobServerUrl } from "../../entities/storage/TypeRefs.js"
import { BlobAccessTokenFacade } from "../facades/BlobAccessTokenFacade.js"
import { AesKey } from "@tutao/tutanota-crypto"
import { isOfflineError } from "../../common/utils/ErrorUtils.js"
import { VersionedEncryptedKey, VersionedKey } from "../crypto/CryptoWrapper.js"
import { Nullable } from "@tutao/tutanota-utils"
import { InstancePipeline } from "../crypto/InstancePipeline"
import { EntityAdapter } from "../crypto/EntityAdapter"
import { AttributeModel } from "../../common/AttributeModel"
import { PersistenceResourcePostReturnTypeRef } from "../../entities/base/TypeRefs"
import { EntityUpdateData } from "../../common/utils/EntityUpdateUtils"
import { PatchListTypeRef } from "../../entities/sys/TypeRefs"
import { parseKeyVersion } from "../facades/KeyLoaderFacade.js"
import { expandId } from "./RestClientIdUtils"
import { Category, syncMetrics } from "../utils/SyncMetrics"
import { computePatchPayload } from "../../common/utils/PatchGenerator"

assertWorkerOrNode()

export function typeModelToRestPath(typeModel: TypeModel): string {
	return `/rest/${typeModel.app}/${typeModel.name.toLowerCase()}`
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

export interface EntityRestClientEraseOptions {
	extraHeaders?: Dict
}

/**
 * Determines how to handle caching behavior (i.e. reading/writing).
 *
 * Use {@link getCacheModeBehavior} to programmatically check the behavior of the cache mode.
 */
export const enum CacheMode {
	/** Prefer cached value if it's there, or fall back to network and write it to cache. */
	ReadAndWrite,

	/**
	 * Always retrieve from the network, but still save to cache.
	 *
	 * NOTE: This cannot be used with ranged requests.
	 */
	WriteOnly,

	/** Prefer cached value, but in case of a cache miss, retrieve the value from network without writing it to cache. */
	ReadOnly,
}

/**
 * Get the behavior of the cache mode for the options
 * @param cacheMode cache mode to check, or if `undefined`, check the default cache mode ({@link CacheMode.ReadAndWrite})
 */
export function getCacheModeBehavior(cacheMode: CacheMode | undefined): {
	readsFromCache: boolean
	writesToCache: boolean
} {
	switch (cacheMode ?? CacheMode.ReadAndWrite) {
		case CacheMode.ReadAndWrite:
			return { readsFromCache: true, writesToCache: true }
		case CacheMode.WriteOnly:
			return { readsFromCache: false, writesToCache: true }
		case CacheMode.ReadOnly:
			return { readsFromCache: true, writesToCache: false }
	}
}

export interface EntityRestClientLoadOptions {
	queryParams?: Dict
	extraHeaders?: Dict
	/** Use the key provided by this to decrypt the existing ownerEncSessionKey instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKeyProvider?: OwnerKeyProvider
	/** Defaults to {@link CacheMode.ReadAndWrite }*/
	cacheMode?: CacheMode
	baseUrl?: string
	suspensionBehavior?: SuspensionBehavior
}

export interface OwnerEncSessionKeyProvider {
	(instanceElementId: Id, entity: Entity): Promise<VersionedEncryptedKey>
}

export interface OwnerKeyProvider {
	(ownerKeyVersion: KeyVersion): Promise<AesKey>
}

/**
 * The EntityRestInterface provides a convenient interface for invoking server side REST services.
 */
export interface EntityRestInterface {
	/**
	 * Reads a single element from the server (or cache). Entities are decrypted before they are returned.
	 * @param typeRef
	 * @param id
	 * @param loadOptions
	 */
	load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, loadOptions?: EntityRestClientLoadOptions): Promise<T>

	/**
	 * Reads a range of elements from the server (or cache). Entities are decrypted before they are returned.
	 */
	loadRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		loadOptions?: EntityRestClientLoadOptions,
	): Promise<T[]>

	/**
	 * Reads multiple elements from the server (or cache). Entities are decrypted before they are returned.
	 * @param typeRef
	 * @param listId
	 * @param elementIds
	 * @param ownerEncSessionKeyProvider use this to resolve the instances session key in case instance.ownerEncSessionKey is not defined (which might be undefined for MailDetails / Files)
	 * @param loadOptions
	 */
	loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		loadOptions?: EntityRestClientLoadOptions,
	): Promise<Array<T>>

	/**
	 * Creates a single element on the server. Entities are encrypted before they are sent.
	 * @return the element id generated on the server side or null if it is a custom id
	 */
	setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict, options?: EntityRestClientSetupOptions): Promise<Id | null>

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
	erase<T extends SomeEntity>(instance: T, options?: EntityRestClientEraseOptions): Promise<void>

	/**
	 * Deletes multiple elements on the server.
	 */
	eraseMultiple<T extends SomeEntity>(listId: Id, instances: Array<T>, options?: EntityRestClientEraseOptions): Promise<void>

	/**
	 * Must be called when entity events are received.
	 * @return Similar to the events in the data parameter, but reduced by the events which are obsolete.
	 */
	entityEventsReceived(events: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<readonly EntityUpdateData[]>
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
		public readonly instancePipeline: InstancePipeline,
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
		private readonly typeModelResolver: TypeModelResolver,
	) {}

	async loadParsedInstance<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		id: PropertyType<T, "_id">,
		opts: EntityRestClientLoadOptions = {},
	): Promise<ServerModelParsedInstance> {
		const tm = syncMetrics?.beginMeasurement(Category.LoadRest)
		const { listId, elementId } = expandId(id)
		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(
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
			baseUrl: opts.baseUrl,
		})
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const untypedInstance = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(JSON.parse(json))

		const encryptedParsedInstance = await this.instancePipeline.typeMapper.applyJsTypes(serverTypeModel, untypedInstance)
		const entityAdapter = await EntityAdapter.from(serverTypeModel, encryptedParsedInstance, this.instancePipeline)
		const migratedEntity = await this._crypto.applyMigrations(typeRef, entityAdapter)
		const sessionKey = await this.resolveSessionKey(opts.ownerKeyProvider, migratedEntity)
		const decrypted = await this.instancePipeline.cryptoMapper.decryptParsedInstance(
			serverTypeModel,
			migratedEntity.encryptedParsedInstance as ServerModelEncryptedParsedInstance,
			sessionKey,
		)
		tm?.endMeasurement()
		return decrypted
	}

	async load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, opts: EntityRestClientLoadOptions = {}): Promise<T> {
		const parsedInstance = await this.loadParsedInstance(typeRef, id, opts)
		return await this.mapInstanceToEntity(typeRef, parsedInstance)
	}

	async mapInstanceToEntity<T extends SomeEntity>(typeRef: TypeRef<T>, parsedInstance: ServerModelParsedInstance): Promise<T> {
		const instance = downcast<T>(await this.instancePipeline.modelMapper.mapToInstance(typeRef, parsedInstance))
		return instance
	}

	async mapInstancesToEntity<T extends SomeEntity>(typeRef: TypeRef<T>, parsedInstances: Array<ServerModelParsedInstance>): Promise<T[]> {
		return await promiseMap(
			parsedInstances,
			async (parsedInstance) => {
				return this.mapInstanceToEntity(typeRef, parsedInstance)
			},
			{
				concurrency: 5,
			},
		)
	}

	private async resolveSessionKey(ownerKeyProvider: OwnerKeyProvider | undefined, migratedEntity: Entity): Promise<Nullable<AesKey>> {
		try {
			if (ownerKeyProvider && migratedEntity._ownerEncSessionKey) {
				const ownerKey = await ownerKeyProvider(parseKeyVersion(migratedEntity._ownerKeyVersion ?? "0"))
				return this._crypto.decryptSessionKeyWithOwnerKey(migratedEntity._ownerEncSessionKey, ownerKey)
			} else {
				return await this._crypto.resolveSessionKey(migratedEntity)
			}
		} catch (e) {
			if (e instanceof SessionKeyNotFoundError) {
				console.log(`could not resolve session key for instance of type ${migratedEntity._type.app}/${migratedEntity._type.typeId}`, e)
				return null
			} else {
				throw e
			}
		}
	}

	async loadParsedInstancesRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions = {},
	): Promise<ServerModelParsedInstance[]> {
		const rangeRequestParams = {
			start: String(start),
			count: String(count),
			reverse: String(reverse),
		}
		const { path, headers, clientTypeModel, queryParams } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			null,
			Object.assign(rangeRequestParams, opts.queryParams),
			opts.extraHeaders,
			opts.ownerKeyProvider,
		)
		// This should never happen if type checking is not bypassed with any
		if (clientTypeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		const json = await this.restClient.request(path, HttpMethod.GET, {
			queryParams,
			headers,
			responseType: MediaType.Json,
			baseUrl: opts.baseUrl,
			suspensionBehavior: opts.suspensionBehavior,
		})
		const parsedResponse: Array<ServerModelUntypedInstance> = JSON.parse(json)
		return await this._handleLoadResult(typeRef, parsedResponse)
	}

	async loadRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions = {},
	): Promise<T[]> {
		const parsedInstances = await this.loadParsedInstancesRange(typeRef, listId, start, count, reverse, opts)
		return this.mapInstancesToEntity(typeRef, parsedInstances)
	}

	async loadMultipleParsedInstances<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		opts: EntityRestClientLoadOptions = {},
	): Promise<Array<ServerModelParsedInstance>> {
		const { path, headers } = await this._validateAndPrepareRestRequest(typeRef, listId, null, opts.queryParams, opts.extraHeaders, opts.ownerKeyProvider)
		const idChunks = splitInChunks(LOAD_MULTIPLE_LIMIT, elementIds)
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)

		const loadedChunks = await promiseMap(idChunks, async (idChunk) => {
			const tm = syncMetrics?.beginMeasurement(Category.LoadMultipleRest)
			let queryParams = {
				ids: idChunk.join(","),
			}
			let json: string
			if (typeModel.type === Type.BlobElement) {
				json = await this.loadMultipleBlobElements(listId, queryParams, headers, path, typeRef, opts)
			} else {
				json = await this.restClient.request(path, HttpMethod.GET, {
					queryParams,
					headers,
					responseType: MediaType.Json,
					baseUrl: opts.baseUrl,
					suspensionBehavior: opts.suspensionBehavior,
				})
			}
			tm?.endMeasurement()
			return this._handleLoadResult(typeRef, JSON.parse(json), ownerEncSessionKeyProvider)
		})
		return loadedChunks.flat()
	}

	async loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		opts: EntityRestClientLoadOptions = {},
	): Promise<Array<T>> {
		const parsedInstances = await this.loadMultipleParsedInstances(typeRef, listId, elementIds, ownerEncSessionKeyProvider, opts)
		return await this.mapInstancesToEntity(typeRef, parsedInstances)
	}

	private async loadMultipleBlobElements(
		archiveId: Id | null,
		queryParams: { ids: string },
		headers: Dict | undefined,
		path: string,
		typeRef: TypeRef<any>,
		opts: EntityRestClientLoadOptions = {},
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

			let serversToTry = blobServerAccessInfo.servers
			if (opts.baseUrl) {
				const preferredServer = blobServerAccessInfo.servers.find((server) => server.url === opts.baseUrl)

				if (preferredServer) {
					// preferredServer takes precedence over the rest
					serversToTry = [preferredServer].concat(blobServerAccessInfo.servers.filter((server) => server.url !== opts.baseUrl))
				}
			}

			return tryServers(
				serversToTry,
				async (serverUrl) =>
					this.restClient.request(path, HttpMethod.GET, {
						queryParams: allParams,
						headers: {}, // prevent CORS request due to non standard header usage
						responseType: MediaType.Json,
						baseUrl: serverUrl,
						noCORS: true,
						suspensionBehavior: opts.suspensionBehavior,
					}),
				`can't load instances from server `,
			)
		}
		const doEvictToken = () => this.blobAccessTokenFacade.evictArchiveToken(archiveId)

		return doBlobRequestWithRetry(doBlobRequest, doEvictToken)
	}

	async _handleLoadResult<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		loadedEntities: Array<ServerModelUntypedInstance>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<Array<ServerModelParsedInstance>> {
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		return await promiseMap(
			loadedEntities,
			async (instance) => {
				const noNetworkDebugInstance = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(instance)
				const encryptedParsedInstance = await this.instancePipeline.typeMapper.applyJsTypes(serverTypeModel, noNetworkDebugInstance)
				let entityAdapter = await EntityAdapter.from(serverTypeModel, encryptedParsedInstance, this.instancePipeline)
				return this._decryptAndMap(serverTypeModel, entityAdapter, ownerEncSessionKeyProvider)
			},
			{
				concurrency: 5,
			},
		)
	}

	async _decryptAndMap(
		serverTypeModel: ServerTypeModel,
		entityAdapter: EntityAdapter,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<ServerModelParsedInstance> {
		let sessionKey: AesKey | null
		if (ownerEncSessionKeyProvider) {
			const id = entityAdapter._id
			const elementId = typeof id === "string" ? id : elementIdPart(id)

			const ownerEncSessionKey = await ownerEncSessionKeyProvider(elementId, entityAdapter)
			const ownerGroup = assertNotNull(entityAdapter._ownerGroup)

			sessionKey = await this._crypto.decryptSessionKey(ownerGroup, ownerEncSessionKey)
		} else {
			try {
				sessionKey = await this._crypto.resolveSessionKey(entityAdapter)
			} catch (e) {
				if (e instanceof SessionKeyNotFoundError) {
					console.log("could not resolve session key", e, e.message, e.stack)
					sessionKey = null // will result in _errors being set on the instance
				} else {
					throw e
				}
			}
		}
		return await this.instancePipeline.cryptoMapper.decryptParsedInstance(
			serverTypeModel,
			entityAdapter.encryptedParsedInstance as ServerModelEncryptedParsedInstance,
			sessionKey,
		)
	}

	async setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict, options?: EntityRestClientSetupOptions): Promise<Id | null> {
		const typeRef = instance._type
		const { clientTypeModel, path, headers, queryParams } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			null,
			undefined,
			extraHeaders,
			options?.ownerKey,
		)

		if (clientTypeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}
		const sk: Nullable<AesKey> = await this._crypto.setNewOwnerEncSessionKey(clientTypeModel, instance, options?.ownerKey)
		const untypedInstance = await this.instancePipeline.mapAndEncrypt(downcast<TypeRef<Entity>>(instance._type), instance, sk)
		const persistencePostReturn: string = await this.restClient.request(path, HttpMethod.POST, {
			baseUrl: options?.baseUrl,
			queryParams,
			headers,
			body: JSON.stringify(untypedInstance),
			responseType: MediaType.Json,
		})
		const postReturnTypeModel = await this.typeModelResolver.resolveClientTypeReference(PersistenceResourcePostReturnTypeRef)
		const untypedPersistencePostReturn = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ClientModelUntypedInstance>(JSON.parse(persistencePostReturn))
		return AttributeModel.getAttributeorNull<Id>(untypedPersistencePostReturn, "generatedId", postReturnTypeModel)
	}

	async setupMultiple<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		const count = instances.length

		if (count < 1) {
			return []
		}

		const instanceChunks = splitInChunks(POST_MULTIPLE_LIMIT, instances)
		const typeRef = instances[0]._type
		const { clientTypeModel, path, headers } = await this._validateAndPrepareRestRequest(typeRef, listId, null, undefined, undefined, undefined)

		if (clientTypeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}

		const errors: Error[] = []
		const failedInstances: T[] = []
		const idChunks: Array<Array<Id>> = await promiseMap(instanceChunks, async (instanceChunk) => {
			try {
				const encryptedEntities = await promiseMap(instanceChunk, async (instance) => {
					const sk = await this._crypto.setNewOwnerEncSessionKey(clientTypeModel, instance)
					return await this.instancePipeline.mapAndEncrypt(downcast<TypeRef<Entity>>(instance._type), instance, sk)
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
				const untypedPersistencePostReturn = JSON.parse(persistencePostReturn)
				return await this.parseSetupMultiple(untypedPersistencePostReturn)
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
		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(
			instance._type,
			listId,
			elementId,
			undefined,
			undefined,
			options?.ownerKeyProvider,
		)
		const sessionKey = await this.resolveSessionKey(options?.ownerKeyProvider, instance)
		// map and encrypt instance._original and the instance
		const originalParsedInstance = await this.instancePipeline.modelMapper.mapToClientModelParsedInstance(instance._type, assertNotNull(instance._original))
		const parsedInstance = await this.instancePipeline.modelMapper.mapToClientModelParsedInstance(instance._type as TypeRef<any>, instance)
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(instance._type)
		const typeReferenceResolver = this.typeModelResolver.resolveClientTypeReference.bind(this.typeModelResolver)
		const encryptedParsedInstance = await this.instancePipeline.cryptoMapper.encryptParsedInstance(typeModel, parsedInstance, sessionKey)
		const untypedInstance = await this.instancePipeline.typeMapper.applyDbTypes(typeModel, encryptedParsedInstance)
		// figure out differing fields and build the PATCH request payload
		const patchList = await computePatchPayload(
			originalParsedInstance,
			parsedInstance,
			untypedInstance,
			typeModel,
			typeReferenceResolver,
			env.networkDebugging,
		)
		// PatchList has no encrypted fields (sk == null)
		const patchPayload = await this.instancePipeline.mapAndEncrypt(PatchListTypeRef, patchList, null)
		await this.restClient.request(path, HttpMethod.PATCH, {
			baseUrl: options?.baseUrl,
			queryParams,
			headers,
			body: JSON.stringify(patchPayload),
			responseType: MediaType.Json,
		})
	}

	async erase<T extends SomeEntity>(instance: T, options?: EntityRestClientEraseOptions): Promise<void> {
		const { listId, elementId } = expandId(instance._id)
		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(
			instance._type,
			listId,
			elementId,
			undefined,
			options?.extraHeaders,
			undefined,
		)
		await this.restClient.request(path, HttpMethod.DELETE, {
			queryParams,
			headers,
		})
	}

	async eraseMultiple<T extends SomeEntity>(listId: string, instances: T[], options?: EntityRestClientEraseOptions | undefined): Promise<void> {
		if (instances.length === 0) {
			return
		}

		const instancesIdsString = instances.map((it) => expandId(it._id).elementId).join(",")
		const type = instances[0]._type

		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(
			type,
			listId,
			null,
			{ ids: instancesIdsString },
			options?.extraHeaders,
			undefined,
		)

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
		clientTypeModel: ClientTypeModel
	}> {
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)

		_verifyType(clientTypeModel)

		if (ownerKey == null && !this.authDataProvider.isFullyLoggedIn() && clientTypeModel.encrypted) {
			// Short-circuit before we do an actual request which we can't decrypt
			throw new LoginIncompleteError(`Trying to do a network request with encrypted entity but is not fully logged in yet, type: ${clientTypeModel.name}`)
		}

		let path = typeModelToRestPath(clientTypeModel)

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

		headers.v = String(clientTypeModel.version)
		return {
			path,
			queryParams,
			headers,
			clientTypeModel,
		}
	}

	/**
	 * for the admin area (no cache available)
	 */
	entityEventsReceived(events: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<readonly EntityUpdateData[]> {
		return Promise.resolve(events)
	}

	getRestClient(): RestClient {
		return this.restClient
	}

	private async parseSetupMultiple(result: Array<UntypedInstance>): Promise<Array<Id>> {
		try {
			return await promiseMap(Array.from(result), async (untypedPostReturn: any) => {
				const sanitisedUntypedPostReturn = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(untypedPostReturn)
				const parsedInstance = await this.instancePipeline.decryptAndMap(PersistenceResourcePostReturnTypeRef, sanitisedUntypedPostReturn, null)
				return parsedInstance.generatedId as Id // is null for customIds
			})
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
		ofClass(NotAuthorizedError, (_) => {
			doEvictTokenBeforeRetry()
			return doBlobRequest()
		}),
	)
}
