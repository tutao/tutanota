import { DEFAULT_REST_CLIENT_OPTIONS, type RestClient } from "@tutao/rest-client"
import { HttpMethod, MediaType, RestTextBody } from "../rest-client/types"
import { ClientTypeModel, expandId, LOAD_MULTIPLE_LIMIT, POST_MULTIPLE_LIMIT, Type, TypeRef } from "../meta"
import { SessionKeyNotFoundError } from "@tutao/crypto/error"
import { assertNotNull, Category, downcast, isNotEmpty, lazy, Mapper, Nullable, ofClass, promiseMap, splitInChunks, syncMetrics } from "@tutao/utils"
import { assertWorkerOrNode, ProgrammingError } from "@tutao/app-env"
import { SetupMultipleError } from "./error/SetupMultipleError"
import { BlobAccessTokenFacade } from "./BlobAccessTokenFacade.js"
import {
	DecryptedParsedInstance,
	ensureIsPersistentType,
	EntityAdapter,
	InstancePipeline,
	LoggedInUserProvider,
	OwnerEncSessionKeyProvider,
	OwnerKeyProvider,
	PatchGenerator,
	SessionKeyResolver,
	TypeModelResolver,
} from "@tutao/instance-pipeline"
import { CryptoNetworkHelper } from "./CryptoNetworkHelper"
import { Entity, ListElementEntity, PersistentEntity, ServerTypeModel } from "@tutao/meta"
import { PersistenceResourcePostReturn, PersistenceResourcePostReturnTypeRef } from "@tutao/entities/base"
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
	makeNullableSubKeyInfoWithSessionKeyCbcThenHmac,
	SubKeyInfo,
	SubKeyInfoWithGroupKeyAead,
	SymmetricEncryptionScheme,
	validateKdfNonceLength,
	VersionedKey,
} from "@tutao/crypto"
import { EntityUtils } from "../instance-pipeline/EntityUtils"
import { IncomingServerJson, OutgoingServerJson } from "../instance-pipeline/TypeMapper"
import {
	DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	EntityRestClientEraseOptions,
	EntityRestClientLoadOptions,
	EntityRestClientSetupOptions,
	EntityRestClientUpdateOptions,
} from "../instance-pipeline/RestClientOptions"

assertWorkerOrNode()

export interface EntityMigrator {
	/**
	 * Takes a freshly JSON-parsed, unmapped object and apply migrations as necessary
	 * @param typeRef
	 * @param data
	 * @return the unmapped and still encrypted instance
	 */
	applyMigrations(typeRef: TypeRef<Entity>, data: EntityAdapter): Promise<EntityAdapter>
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

	private readonly patchGenerator: PatchGenerator
	constructor(
		private readonly authDataProvider: LoggedInUserProvider,
		private readonly restClient: RestClient,
		private readonly lazyCrypto: () => CryptoNetworkHelper,
		public readonly instancePipeline: InstancePipeline,
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly sessionKeyResolver: lazy<SessionKeyResolver>,
		private readonly entityMigrator: lazy<EntityMigrator>,
	) {
		this.patchGenerator = new PatchGenerator(instancePipeline)
	}

	async loadParsedInstance<T extends PersistentEntity>(
		typeRef: TypeRef<T>,
		id: T["_id"],
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<DecryptedParsedInstance> {
		const tm = syncMetrics?.beginMeasurement(Category.LoadRest)
		const { listId, elementId } = expandId(id)
		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			elementId,
			opts.queryParams,
			opts.extraHeaders,
			opts.ownerKeyProvider,
			null,
		)
		const json = await this.restClient.request(path, HttpMethod.GET, {
			...DEFAULT_REST_CLIENT_OPTIONS,
			queryParams,
			headers,
			responseType: MediaType.Json,
			baseUrl: opts.baseUrl,
		})
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const incomingServerJson = IncomingServerJson.expectSingleInstance(json, serverTypeModel)
		const parsedInstance = await this.instancePipeline.typeMapper.parseServerJson(incomingServerJson)

		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(
			parsedInstance,
			this.instancePipeline.modelMapper,
			this.instancePipeline.cryptoMapper,
		)
		const migratedEntity = await this.entityMigrator().applyMigrations(typeRef, entityAdapter)
		const sessionKey = await this.sessionKeyResolver().resolveSessionKeyWithOwnerKeyProvider(opts.ownerKeyProvider, migratedEntity)
		const decrypted = await this.instancePipeline.cryptoMapper.decryptParsedInstance(
			migratedEntity.getWrappedEncryptedInstance(),
			sessionKey,
			validateKdfNonceLength(migratedEntity._kdfNonce),
			opts.ownerKeyProvider ?? this.instancePipeline.cryptoMapper.makeOwnerKeyProvider(migratedEntity._ownerGroup),
		)
		tm?.endMeasurement()
		return decrypted
	}

	async load<T extends PersistentEntity>(
		typeRef: TypeRef<T>,
		id: T["_id"],
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<T> {
		const parsedInstance = await this.loadParsedInstance(typeRef, id, opts)
		return await this.mapInstanceToEntity(parsedInstance)
	}

	async mapInstanceToEntity<T extends PersistentEntity>(parsedInstance: DecryptedParsedInstance): Promise<T> {
		return await this.instancePipeline.modelMapper.mapToInstance<T>(parsedInstance)
	}

	async mapInstancesToEntity<T extends PersistentEntity>(typeRef: TypeRef<T>, parsedInstances: Array<DecryptedParsedInstance>): Promise<T[]> {
		return await promiseMap(
			parsedInstances,
			async (parsedInstance) => {
				return this.mapInstanceToEntity(parsedInstance)
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
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<Array<DecryptedParsedInstance>> {
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
			null,
		)
		// This should never happen if type checking is not bypassed with any
		if (clientTypeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		const json = await this.restClient.request(path, HttpMethod.GET, {
			...DEFAULT_REST_CLIENT_OPTIONS,
			queryParams,
			headers,
			responseType: MediaType.Json,
			baseUrl: opts.baseUrl,
			suspensionBehavior: opts.suspensionBehavior,
		})
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const serverJson = IncomingServerJson.expectMultipleInstance(json, serverTypeModel)
		return await this._handleLoadResult(typeRef, serverJson, opts.ownerKeyProvider ?? null)
	}

	async loadRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<T[]> {
		const parsedInstances = await this.loadParsedInstancesRange(typeRef, listId, start, count, reverse, opts)
		return this.mapInstancesToEntity(typeRef, parsedInstances)
	}

	async loadMultipleParsedInstances<T extends PersistentEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<Array<DecryptedParsedInstance>> {
		const { path, headers } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			null,
			opts.queryParams,
			opts.extraHeaders,
			opts.ownerKeyProvider,
			null,
		)
		const idChunks = splitInChunks(LOAD_MULTIPLE_LIMIT, elementIds)
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)

		const loadedChunks = await promiseMap(idChunks, async (idChunk) => {
			const tm = syncMetrics?.beginMeasurement(Category.LoadMultipleRest)
			let queryParams = {
				ids: idChunk.join(","),
			}
			let json: string
			if (clientTypeModel.type === Type.BlobElement) {
				json = await this.loadMultipleBlobElements(listId, queryParams, headers, path, typeRef, opts)
			} else {
				json = await this.restClient.request(path, HttpMethod.GET, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					queryParams,
					headers,
					responseType: MediaType.Json,
					baseUrl: opts.baseUrl,
					suspensionBehavior: opts.suspensionBehavior,
				})
			}
			tm?.endMeasurement()
			return this._handleLoadResult(
				typeRef,
				IncomingServerJson.expectMultipleInstance(json, serverTypeModel),
				opts.ownerKeyProvider ?? null,
				ownerEncSessionKeyProvider,
			)
		})
		return loadedChunks.flat()
	}

	async loadMultiple<T extends PersistentEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		elementIds: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<Array<T>> {
		const parsedInstances = await this.loadMultipleParsedInstances(typeRef, listId, elementIds, ownerEncSessionKeyProvider, opts)
		return await this.mapInstancesToEntity(typeRef, parsedInstances)
	}

	private async loadMultipleBlobElements(
		archiveId: Id | null,
		queryParams: { ids: string },
		headers: Dict,
		path: string,
		typeRef: TypeRef<any>,
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
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
						...DEFAULT_REST_CLIENT_OPTIONS,
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

	async _handleLoadResult<T extends PersistentEntity>(
		typeRef: TypeRef<T>,
		loadedEntities: Array<IncomingServerJson>,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
	): Promise<Array<DecryptedParsedInstance>> {
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		return await promiseMap(
			loadedEntities,
			async (instance) => {
				const parsedInstance = await this.instancePipeline.typeMapper.parseServerJson(instance)
				let entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(
					parsedInstance,
					this.instancePipeline.modelMapper,
					this.instancePipeline.cryptoMapper,
				)
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
	): Promise<DecryptedParsedInstance> {
		let sessionKey: AesKey | null
		if (ownerEncSessionKeyProvider) {
			const { listId, elementId } = expandId(entityAdapter._id)

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
			entityAdapter.getWrappedEncryptedInstance(),
			sessionKey,
			validateKdfNonceLength(entityAdapter._kdfNonce),
			ownerKeyProvider,
		)
	}

	async setup<T extends PersistentEntity>(
		listId: Id | null,
		instance: T,
		extraHeaders: Nullable<Dict>,
		options: Nullable<EntityRestClientSetupOptions> = null,
	): Promise<Id | null> {
		const typeRef = instance._type
		const { clientTypeModel, path, headers, queryParams } = await this._validateAndPrepareRestRequest(
			typeRef,
			listId,
			null,
			null,
			extraHeaders,
			null,
			options?.ownerKey ?? null,
		)

		if (clientTypeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}
		const subKeyInfo = await this.getSubKeyInfoOnSetup(options?.ownerKey ?? null, instance, clientTypeModel)
		const encryptedParsedInstance = await this.instancePipeline.mapAndEncryptWithSubKeyInfo(instance, subKeyInfo)
		const outgoingJson = await this.instancePipeline.typeMapper.makeServerJson(encryptedParsedInstance)
		const persistencePostReturn: string = await this.restClient.request(path, HttpMethod.POST, {
			...DEFAULT_REST_CLIENT_OPTIONS,
			baseUrl: options?.baseUrl ?? null,
			queryParams,
			headers,
			body: new RestTextBody(outgoingJson.getJsonRepresentation()),
			responseType: MediaType.Json,
		})

		const persistencePostReturnTypeModel = await this.typeModelResolver.resolveServerTypeReference(PersistenceResourcePostReturnTypeRef)
		const postReturnJson = IncomingServerJson.expectSingleInstance(persistencePostReturn, persistencePostReturnTypeModel)
		const parsedPersistencePostReturn = await this.instancePipeline.typeMapper.parseServerJson(postReturnJson)
		return parsedPersistencePostReturn.getAttributeByNameOrNull("generatedId")?.asId() ?? null
	}

	async setupMultiple<T extends PersistentEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		const count = instances.length

		if (count < 1) {
			return []
		}

		const instanceChunks = splitInChunks(POST_MULTIPLE_LIMIT, instances)
		const typeRef = instances[0]._type
		const { clientTypeModel, path, headers } = await this._validateAndPrepareRestRequest(typeRef, listId, null, null, null, null, null)
		const persistencePostReturnTypeModel = await this.typeModelResolver.resolveServerTypeReference(PersistenceResourcePostReturnTypeRef)

		if (clientTypeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}

		const errors: Error[] = []
		const failedInstances: T[] = []
		const idChunks: Array<Array<Id>> = await promiseMap(instanceChunks, async (instanceChunk) => {
			try {
				const outgoingServerJsons = await promiseMap(instanceChunk, async (instance) => {
					const sk = await this._crypto.setNewOwnerEncSessionKey(clientTypeModel, instance, null)
					const encEntity = await this.instancePipeline.mapAndEncryptToParsedInstance(downcast<TypeRef<Entity>>(instance._type), instance, sk)
					return this.instancePipeline.typeMapper.makeServerJson(encEntity)
				})
				// informs the server that this is a POST_MULTIPLE request
				const queryParams = {
					count: String(instanceChunk.length),
				}
				const persistencePostReturn = await this.restClient.request(path, HttpMethod.POST, {
					...DEFAULT_REST_CLIENT_OPTIONS,
					queryParams,
					headers,
					body: new RestTextBody(OutgoingServerJson.getJsonRepresentationOfMultiple(outgoingServerJsons)),
					responseType: MediaType.Json,
				})
				const untypedPersistencePostReturn = IncomingServerJson.expectMultipleInstance(persistencePostReturn, persistencePostReturnTypeModel)
				return await this.parseSetupMultiple(untypedPersistencePostReturn)
			} catch (e) {
				if (e instanceof PayloadTooLargeError) {
					// If we try to post too many large instances then we get PayloadTooLarge
					// So we fall back to posting single instances
					const returnedIds = await promiseMap(instanceChunk, async (instance) => {
						try {
							return await this.setup(listId, instance, null, null)
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

	async update<T extends PersistentEntity>(instance: T, options?: EntityRestClientUpdateOptions): Promise<void> {
		if (!instance._id) throw new Error("Id must be defined")
		const { listId, elementId } = expandId(instance._id)
		const { path, queryParams, clientTypeModel, headers } = await this._validateAndPrepareRestRequest(
			instance._type,
			listId,
			elementId,
			null,
			null,
			null,
			options?.ownerKey ?? null,
		)
		// map and encrypt instance._original and the instance
		const originalParsedInstance = await this.instancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(instance._original))
		const parsedInstance = await this.instancePipeline.modelMapper.mapToDecryptedInstance(instance)
		const subKeyInfo = await this.getSubKeyInfoOnUpdate(options?.ownerKey ?? null, instance)
		const modifiedEncryptedInstance = await this.instancePipeline.cryptoMapper.encryptParsedInstance(parsedInstance, subKeyInfo)

		// figure out differing fields and build the PATCH request payload
		const patchList = await this.patchGenerator.computePatchPayload(originalParsedInstance, parsedInstance, modifiedEncryptedInstance)
		if (isNotEmpty(patchList.patches)) {
			// PatchList has no encrypted fields (sk == null)
			const patchPayload = await this.instancePipeline.mapAndEncrypt(PatchListTypeRef, patchList, null)
			await this.restClient.request(path, HttpMethod.PATCH, {
				...DEFAULT_REST_CLIENT_OPTIONS,
				baseUrl: options?.baseUrl ?? null,
				queryParams,
				headers,
				body: new RestTextBody(patchPayload.getJsonRepresentation()),
				responseType: MediaType.Json,
			})
		}
	}

	private async getSubKeyInfoOnSetup<T extends PersistentEntity>(
		ownerKey: VersionedKey | null,
		instance: T,
		clientTypeModel: ClientTypeModel,
	): Promise<Nullable<SubKeyInfo>> {
		if (this.authDataProvider.getDefaultSymmetricEncryptionScheme() === SymmetricEncryptionScheme.AesCbc) {
			const sessionKey: Nullable<AesKey> = await this._crypto.setNewOwnerEncSessionKey(clientTypeModel, instance, ownerKey)
			return makeNullableSubKeyInfoWithSessionKeyCbcThenHmac(sessionKey)
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
			return new SubKeyInfoWithGroupKeyAead(ownerKey, kdfNonce)
		}
	}

	private async getSubKeyInfoOnUpdate<T extends PersistentEntity>(ownerKey: VersionedKey | null, instance: T): Promise<Nullable<SubKeyInfo>> {
		if (this.authDataProvider.getDefaultSymmetricEncryptionScheme() === SymmetricEncryptionScheme.AesCbc) {
			const sessionKey: Nullable<AesKey> = await this.sessionKeyResolver().resolveSessionKeyWithOwnerKey(
				ownerKey != null ? ownerKey.object : null,
				instance,
			)
			return makeNullableSubKeyInfoWithSessionKeyCbcThenHmac(sessionKey)
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
			return new SubKeyInfoWithGroupKeyAead(ownerKey, kdfNonce)
		}
	}

	async erase<T extends PersistentEntity>(instance: T, options?: EntityRestClientEraseOptions): Promise<void> {
		const { listId, elementId } = expandId(instance._id)
		const { path, queryParams, headers } = await this._validateAndPrepareRestRequest(
			instance._type,
			listId,
			elementId,
			null,
			options?.extraHeaders ?? null,
			null,
			null,
		)
		await this.restClient.request(path, HttpMethod.DELETE, {
			...DEFAULT_REST_CLIENT_OPTIONS,
			queryParams,
			headers,
		})
	}

	async eraseMultiple<T extends PersistentEntity>(listId: string, instances: T[], options?: EntityRestClientEraseOptions): Promise<void> {
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
			options?.extraHeaders ?? null,
			null,
			null,
		)

		await this.restClient.request(path, HttpMethod.DELETE, {
			...DEFAULT_REST_CLIENT_OPTIONS,
			queryParams,
			headers,
		})
	}

	async _validateAndPrepareRestRequest(
		typeRef: TypeRef<any>,
		listId: Id | null,
		elementId: Id | null,
		queryParams: Nullable<Dict>,
		extraHeaders: Nullable<Dict>,
		ownerKeyProvider: OwnerKeyProvider | null,
		ownerKey: VersionedKey | null,
	): Promise<{
		path: string
		queryParams: Nullable<Dict>
		headers: Dict
		clientTypeModel: ClientTypeModel
	}> {
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)

		ensureIsPersistentType(clientTypeModel)

		if (ownerKeyProvider == null && ownerKey == null && !this.authDataProvider.isFullyLoggedIn() && clientTypeModel.encrypted) {
			// Short-circuit before we do an actual request which we can't decrypt
			throw new LoginIncompleteError(`Trying to do a network request with encrypted entity but is not fully logged in yet, type: ${clientTypeModel.name}`)
		}

		let path = EntityUtils.typeModelToRestPath(clientTypeModel)

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

	private async parseSetupMultiple(result: Array<IncomingServerJson>): Promise<Array<Id>> {
		try {
			return await promiseMap(Array.from(result), async (serverJson: IncomingServerJson) => {
				const parsedInstance = await this.instancePipeline.decryptAndMap<PersistenceResourcePostReturn>(serverJson, null)
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
