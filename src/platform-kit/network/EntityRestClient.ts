import { type RestClient } from "@tutao/rest-client"
import { HttpMethod, MediaType, SuspensionBehavior } from "../rest-client/types"
import { AttributeModel, elementIdPart, expandId, LOAD_MULTIPLE_LIMIT, POST_MULTIPLE_LIMIT, Type, TypeRef } from "../meta"
import { SessionKeyNotFoundError } from "@tutao/crypto/error"
import { assertNotNull, Category, downcast, lazy, Mapper, Nullable, ofClass, promiseMap, splitInChunks, syncMetrics } from "@tutao/utils"
import { assertWorkerOrNode, ProgrammingError } from "@tutao/app-env"
import { SetupMultipleError } from "./error/SetupMultipleError"
import { BlobAccessTokenFacade } from "./BlobAccessTokenFacade.js"
import {
	_verifyType,
	EntityAdapter,
	InstancePipeline,
	LoggedInUserProvider,
	OwnerEncSessionKeyProvider,
	OwnerKeyProvider,
	SessionKeyResolver,
	TypeModelResolver,
	typeModelToRestPath,
} from "@tutao/instance-pipeline"
import { CryptoNetworkHelper } from "./CryptoNetworkHelper"
import {
	ClientModelUntypedInstance,
	ClientTypeModel,
	Entity,
	ListElementEntity,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	ServerModelUntypedInstance,
	ServerTypeModel,
	SomeEntity,
	UntypedInstance,
} from "@tutao/meta"
import { PersistenceResourcePostReturnTypeRef } from "@tutao/entities/base"
import { computePatchPayload } from "../instance-pipeline/PatchGenerator"
import { createInstanceKdfNonce, createTypeInfo, PatchListTypeRef } from "@tutao/entities/sys"
import { EntityUpdateData } from "../instance-pipeline/utils/EntityUpdateUtils"
import { BlobServerUrl } from "@tutao/entities/storage"
import { EntityRestInterface } from "./EntityRestCacheInterface"
import {
	ConnectionError,
	InternalServerError,
	isOfflineError,
	LoginIncompleteError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	PayloadTooLargeError,
} from "@tutao/rest-client/error"
import {
	AesKey,
	generateKdfNonce,
	KdfNonce,
	SubKeyInfo,
	SymmetricCipherVersion,
	SymmetricEncryptionScheme,
	validateKdfNonceLength,
	VersionedKey,
} from "@tutao/crypto"

assertWorkerOrNode()

export interface EntityRestClientSetupOptions {
	baseUrl?: string
	/** Use this key to encrypt session key instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKey?: VersionedKey
}

export interface EntityRestClientUpdateOptions {
	baseUrl?: string
	/** Use this key to encrypt session key instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKey?: VersionedKey
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
	get _crypto(): CryptoNetworkHelper {
		return this.lazyCrypto()
	}

	constructor(
		private readonly authDataProvider: LoggedInUserProvider,
		private readonly restClient: RestClient,
		private readonly lazyCrypto: lazy<CryptoNetworkHelper>,
		public readonly instancePipeline: InstancePipeline,
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly sessionKeyResolver: lazy<SessionKeyResolver>,
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
		const entityAdapter = await EntityAdapter.from(serverTypeModel, encryptedParsedInstance, this.instancePipeline.modelMapper)
		const migratedEntity = await this._crypto.applyMigrations(typeRef, entityAdapter)
		const sessionKey = await this.sessionKeyResolver().resolveSessionKeyWithOwnerKeyProvider(opts.ownerKeyProvider, migratedEntity)
		const decrypted = await this.instancePipeline.cryptoMapper.decryptParsedInstance(
			serverTypeModel,
			migratedEntity.encryptedParsedInstance as ServerModelEncryptedParsedInstance,
			sessionKey,
			validateKdfNonceLength(migratedEntity._kdfNonce),
			opts.ownerKeyProvider ?? this.instancePipeline.cryptoMapper.makeOwnerKeyProvider(migratedEntity._ownerGroup),
		)
		tm?.endMeasurement()
		return decrypted
	}

	async load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, opts: EntityRestClientLoadOptions = {}): Promise<T> {
		const parsedInstance = await this.loadParsedInstance(typeRef, id, opts)
		return await this.mapInstanceToEntity(typeRef, parsedInstance)
	}

	async mapInstanceToEntity<T extends SomeEntity>(typeRef: TypeRef<T>, parsedInstance: ServerModelParsedInstance): Promise<T> {
		return downcast<T>(await this.instancePipeline.modelMapper.mapToInstance(typeRef, parsedInstance))
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
		return await this._handleLoadResult(typeRef, parsedResponse, opts.ownerKeyProvider ?? null)
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
			return this._handleLoadResult(typeRef, JSON.parse(json), opts.ownerKeyProvider ?? null, ownerEncSessionKeyProvider)
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
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<Array<ServerModelParsedInstance>> {
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		return await promiseMap(
			loadedEntities,
			async (instance) => {
				const noNetworkDebugInstance = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(instance)
				const encryptedParsedInstance = await this.instancePipeline.typeMapper.applyJsTypes(serverTypeModel, noNetworkDebugInstance)
				let entityAdapter = await EntityAdapter.from(serverTypeModel, encryptedParsedInstance, this.instancePipeline.modelMapper)
				return this._decryptAndMap(
					serverTypeModel,
					entityAdapter,
					ownerKeyProvider ?? this.instancePipeline.cryptoMapper.makeOwnerKeyProvider(entityAdapter._ownerGroup),
					ownerEncSessionKeyProvider,
				)
			},
			{
				concurrency: 5,
			},
		)
	}

	async _decryptAndMap(
		serverTypeModel: ServerTypeModel,
		entityAdapter: EntityAdapter,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
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
				sessionKey = await this.sessionKeyResolver().resolveSessionKey(entityAdapter)
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
			validateKdfNonceLength(entityAdapter._kdfNonce),
			ownerKeyProvider,
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
		const subKeyInfo = await this.getSubKeyInfoOnSetup(options?.ownerKey, instance, clientTypeModel)
		const untypedInstance = await this.instancePipeline.mapAndEncrypt(downcast<TypeRef<Entity>>(instance._type), instance, subKeyInfo)
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
					const returnedIds = await promiseMap(instanceChunk, async (instance) => {
						try {
							return await this.setup(listId, instance)
						} catch (e) {
							errors.push(e)
							failedInstances.push(instance)
						}
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
		const { path, queryParams, clientTypeModel, headers } = await this._validateAndPrepareRestRequest(
			instance._type,
			listId,
			elementId,
			undefined,
			undefined,
			options?.ownerKey,
		)
		// map and encrypt instance._original and the instance
		const originalParsedInstance = await this.instancePipeline.modelMapper.mapToClientModelParsedInstance(instance._type, assertNotNull(instance._original))
		const subKeyInfo = await this.getSubKeyInfoOnUpdate(options?.ownerKey, instance)
		const parsedInstance = await this.instancePipeline.modelMapper.mapToClientModelParsedInstance(instance._type as TypeRef<any>, instance)
		const typeReferenceResolver = this.typeModelResolver.resolveClientTypeReference.bind(this.typeModelResolver)
		const encryptedParsedInstance = await this.instancePipeline.cryptoMapper.encryptParsedInstance(clientTypeModel, parsedInstance, subKeyInfo)
		const untypedInstance = await this.instancePipeline.typeMapper.applyDbTypes(clientTypeModel, encryptedParsedInstance)
		// figure out differing fields and build the PATCH request payload
		const patchList = await computePatchPayload(
			originalParsedInstance,
			parsedInstance,
			untypedInstance,
			clientTypeModel,
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

	private async getSubKeyInfoOnSetup<T extends SomeEntity>(
		ownerKey: VersionedKey | undefined,
		instance: T,
		clientTypeModel: ClientTypeModel,
	): Promise<SubKeyInfo> {
		if (this.authDataProvider.getDefaultSymmetricEncryptionScheme() === SymmetricEncryptionScheme.AesCbc) {
			const sessionKey: Nullable<AesKey> = await this._crypto.setNewOwnerEncSessionKey(clientTypeModel, instance, ownerKey)
			return { cipherVersion: SymmetricCipherVersion.AesCbcThenHmac, sessionKey }
		} else {
			if (ownerKey == null) {
				if (instance._ownerGroup == null) {
					throw new ProgrammingError("This instance has no owner group")
				}
				ownerKey = await this._crypto.getCurrentSymGroupKey(instance._ownerGroup)
			}
			if (instance._kdfNonce != null) {
				// why do you have a KDF nonce at this point? is the instance a deep copy?
				console.log(`overwriting KDF nonce previously found on instance of type ${instance._type} with ID ${instance._id}`)
			}

			const kdfNonce: KdfNonce = generateKdfNonce()
			instance._kdfNonce = kdfNonce
			return { cipherVersion: SymmetricCipherVersion.AeadWithGroupKey, groupKey: ownerKey, kdfNonce }
		}
	}

	private async getSubKeyInfoOnUpdate<T extends SomeEntity>(ownerKey: VersionedKey | undefined, instance: T): Promise<SubKeyInfo> {
		if (this.authDataProvider.getDefaultSymmetricEncryptionScheme() === SymmetricEncryptionScheme.AesCbc) {
			const sessionKey: Nullable<AesKey> = await this.sessionKeyResolver().resolveSessionKeyWithOwnerKey(ownerKey?.object, instance)
			return { cipherVersion: SymmetricCipherVersion.AesCbcThenHmac, sessionKey }
		} else {
			if (!ownerKey) {
				if (instance._ownerGroup == null) {
					throw new ProgrammingError("This instance has no owner group")
				}
				ownerKey = await this._crypto.getCurrentSymGroupKey(instance._ownerGroup)
			}
			let kdfNonce: KdfNonce
			if (instance._kdfNonce == null) {
				let instanceList: Nullable<Id> = null
				let instanceId: Id
				if (instance._id instanceof Array) {
					instanceList = instance._id[0]
					instanceId = instance._id[1]
				} else {
					instanceId = instance._id
				}
				const application = instance._type.app
				const typeId = instance._type.typeId.toString()
				const typeInfo = createTypeInfo({ application, typeId })
				const out = await this._crypto.postUpdateKdfNonceService(
					createInstanceKdfNonce({ kdfNonce: generateKdfNonce(), instanceId, instanceList, typeInfo }),
				)
				kdfNonce = validateKdfNonceLength(out.kdfNonce)
				instance._kdfNonce = kdfNonce
			} else {
				kdfNonce = validateKdfNonceLength(instance._kdfNonce)
			}
			return { cipherVersion: SymmetricCipherVersion.AeadWithGroupKey, groupKey: ownerKey, kdfNonce }
		}
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
		if (clientTypeModel.dependsOnVersion) {
			headers.dv = String(clientTypeModel.dependsOnVersion)
		}

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
	entityEventsReceived(events: readonly EntityUpdateData[], _batchId: Id, _groupId: Id): Promise<readonly EntityUpdateData[]> {
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
