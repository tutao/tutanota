import { ArchiveDataType, BlobAccessTokenKind } from "../../common/TutanotaConstants"
import { assertWorkerOrNode } from "../../common/Env"
import { BlobAccessTokenService } from "../../entities/storage/Services"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { BlobServerAccessInfo, createBlobAccessTokenPostIn, createBlobReadData, createBlobWriteData, createInstanceId } from "../../entities/storage/TypeRefs"
import { DateProvider } from "../../common/DateProvider.js"
import { resolveTypeReference } from "../../common/EntityFunctions.js"
import { AuthDataProvider } from "./UserFacade.js"
import { deduplicate, first, isEmpty, lazyMemoized, TypeRef } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { BlobLoadOptions } from "./lazy/BlobFacade.js"
import { BlobReferencingInstance } from "../../common/utils/BlobUtils.js"

assertWorkerOrNode()

/**
 * The BlobAccessTokenFacade requests blobAccessTokens from the BlobAccessTokenService to get or post to the BlobService (binary blobs)
 * or DefaultBlobElementResource (instances).
 *
 * All tokens are cached.
 */
export class BlobAccessTokenFacade {
	// cache for blob access tokens that are valid for the whole archive (key:<archiveId>)
	// cache for blob access tokens that are valid for blobs from a given instance were the user does not own the archive (key:<instanceElementId>).
	private readonly readCache: BlobAccessTokenCache
	// cache for upload requests are valid for the whole archive (key:<ownerGroup + archiveDataType>).
	private readonly writeCache: BlobAccessTokenCache

	constructor(private readonly serviceExecutor: IServiceExecutor, private readonly authDataProvider: AuthDataProvider, dateProvider: DateProvider) {
		this.readCache = new BlobAccessTokenCache(dateProvider)
		this.writeCache = new BlobAccessTokenCache(dateProvider)
	}

	/**
	 * Requests a token that allows uploading blobs for the given ArchiveDataType and ownerGroup.
	 * @param archiveDataType The type of data that should be stored.
	 * @param ownerGroupId The ownerGroup were the data belongs to (e.g. group of type mail)
	 */
	async requestWriteToken(archiveDataType: ArchiveDataType, ownerGroupId: Id): Promise<BlobServerAccessInfo> {
		const requestNewToken = async () => {
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType,
				write: createBlobWriteData({
					archiveOwnerGroup: ownerGroupId,
				}),
				read: null,
			})
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest)
			return blobAccessInfo
		}
		const key = this.makeWriteCacheKey(ownerGroupId, archiveDataType)
		return this.writeCache.getToken(key, [], requestNewToken)
	}

	private makeWriteCacheKey(ownerGroupId: string, archiveDataType: ArchiveDataType) {
		return ownerGroupId + archiveDataType
	}

	/**
	 * Remove a given write token from the cache.
	 * @param archiveDataType
	 * @param ownerGroupId
	 */
	evictWriteToken(archiveDataType: ArchiveDataType, ownerGroupId: Id): void {
		const key = this.makeWriteCacheKey(ownerGroupId, archiveDataType)
		this.writeCache.evictArchiveOrGroupKey(key)
	}

	/**
	 * Requests a token that grants read access to all blobs that are referenced by the given instances.
	 * A user must be owner of the instance but must not be owner of the archive where the blobs are stored in.
	 *
	 * @param archiveDataType specify the data type
	 * @param referencingInstances the instances that references the blobs
	 * @param blobLoadOptions load options when loading blobs
	 * @throws ProgrammingError if instances are not part of the same list or blobs are not part of the same archive.
	 */
	async requestReadTokenMultipleInstances(
		archiveDataType: ArchiveDataType,
		referencingInstances: readonly BlobReferencingInstance[],
		blobLoadOptions: BlobLoadOptions,
	): Promise<BlobServerAccessInfo> {
		if (isEmpty(referencingInstances)) {
			throw new ProgrammingError("Must pass at least one referencing instance")
		}
		const instanceListId = referencingInstances[0].listId
		if (!referencingInstances.every((instance) => instance.listId === instanceListId)) {
			throw new ProgrammingError("All referencing instances must be part of the same list")
		}

		const archiveId = this.getArchiveId(referencingInstances)

		const requestNewToken = lazyMemoized(async () => {
			const instanceIds = referencingInstances.map(({ elementId }) => createInstanceId({ instanceId: elementId }))
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType,
				read: createBlobReadData({
					archiveId,
					instanceListId,
					instanceIds,
				}),
				write: null,
			})
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest, blobLoadOptions)
			return blobAccessInfo
		})

		return this.readCache.getToken(
			archiveId,
			referencingInstances.map((instance) => instance.elementId),
			requestNewToken,
		)
	}

	/**
	 * Requests a token that grants read access to all blobs that are referenced by the given instance.
	 * A user must be owner of the instance but must not be owner of the archive were the blobs are stored in.
	 * @param archiveDataType specify the data type
	 * @param referencingInstance the instance that references the blobs
	 * @param blobLoadOptions load options when loading blobs
	 */
	async requestReadTokenBlobs(
		archiveDataType: ArchiveDataType,
		referencingInstance: BlobReferencingInstance,
		blobLoadOptions: BlobLoadOptions,
	): Promise<BlobServerAccessInfo> {
		const archiveId = this.getArchiveId([referencingInstance])
		const requestNewToken = async () => {
			const instanceListId = referencingInstance.listId
			const instanceId = referencingInstance.elementId
			const instanceIds = [createInstanceId({ instanceId })]
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType,
				read: createBlobReadData({
					archiveId,
					instanceListId,
					instanceIds,
				}),
				write: null,
			})
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest, blobLoadOptions)
			return blobAccessInfo
		}
		return this.readCache.getToken(archiveId, [referencingInstance.elementId], requestNewToken)
	}

	/**
	 * Remove a given read blobs token from the cache.
	 * @param referencingInstance
	 */
	evictReadBlobsToken(referencingInstance: BlobReferencingInstance): void {
		this.readCache.evictInstanceId(referencingInstance.elementId)
		const archiveId = this.getArchiveId([referencingInstance])
		this.readCache.evictArchiveOrGroupKey(archiveId)
	}

	/**
	 * Remove a given read blobs token from the cache.
	 * @param referencingInstances
	 */
	evictReadBlobsTokenMultipleBlobs(referencingInstances: BlobReferencingInstance[]): void {
		this.readCache.evictAll(referencingInstances.map((instance) => instance.elementId))
		const archiveId = this.getArchiveId(referencingInstances)
		this.readCache.evictArchiveOrGroupKey(archiveId)
	}

	/**
	 * Requests a token that grants access to all blobs stored in the given archive. The user must own the archive (member of group)
	 * @param archiveId ID for the archive to read blobs from
	 */
	async requestReadTokenArchive(archiveId: Id): Promise<BlobServerAccessInfo> {
		const requestNewToken = async () => {
			const tokenRequest = createBlobAccessTokenPostIn({
				archiveDataType: null,
				read: createBlobReadData({
					archiveId,
					instanceIds: [],
					instanceListId: null,
				}),
				write: null,
			})
			const { blobAccessInfo } = await this.serviceExecutor.post(BlobAccessTokenService, tokenRequest)
			return blobAccessInfo
		}
		return this.readCache.getToken(archiveId, [], requestNewToken)
	}

	/**
	 * Remove a given read archive token from the cache.
	 * @param archiveId
	 */
	evictArchiveToken(archiveId: Id): void {
		this.readCache.evictArchiveOrGroupKey(archiveId)
	}

	private getArchiveId(referencingInstances: readonly BlobReferencingInstance[]): Id {
		if (isEmpty(referencingInstances)) {
			throw new ProgrammingError("Must pass at least one referencing instance")
		}
		const archiveIds = new Set<Id>()
		for (const referencingInstance of referencingInstances) {
			if (isEmpty(referencingInstance.blobs)) {
				throw new ProgrammingError("must pass blobs")
			}
			for (const blob of referencingInstance.blobs) {
				archiveIds.add(blob.archiveId)
			}
		}

		if (archiveIds.size != 1) {
			throw new Error(`only one archive id allowed, but was ${archiveIds}`)
		}
		return referencingInstances[0].blobs[0].archiveId
	}

	/**
	 *
	 * @param blobServerAccessInfo
	 * @param additionalRequestParams
	 * @param typeRef the typeRef that shall be used to determine the correct model version
	 */
	public async createQueryParams(blobServerAccessInfo: BlobServerAccessInfo, additionalRequestParams: Dict, typeRef: TypeRef<any>): Promise<Dict> {
		const typeModel = await resolveTypeReference(typeRef)
		return Object.assign(
			additionalRequestParams,
			{
				blobAccessToken: blobServerAccessInfo.blobAccessToken,
				v: typeModel.version,
			},
			this.authDataProvider.createAuthHeaders(),
		)
	}
}

/**
 * Checks if the given access token can be used for another blob service requests.
 * @param blobServerAccessInfo
 * @param dateProvider
 */
function canBeUsedForAnotherRequest(blobServerAccessInfo: BlobServerAccessInfo, dateProvider: DateProvider): boolean {
	return blobServerAccessInfo.expires.getTime() > dateProvider.now()
}

class BlobAccessTokenCache {
	private readonly instanceMap: Map<Id, BlobServerAccessInfo> = new Map()
	private readonly archiveMap: Map<Id, BlobServerAccessInfo> = new Map()

	constructor(private readonly dateProvider: DateProvider) {}

	/**
	 * Get a token from the cache or from {@param loader}.
	 * First will try to use the token keyed by {@param archiveOrGroupKey}, otherwise it will try to find a token valid for all of {@param instanceIds}.
	 */
	public async getToken(
		archiveOrGroupKey: Id | null,
		instanceIds: readonly Id[],
		loader: () => Promise<BlobServerAccessInfo>,
	): Promise<BlobServerAccessInfo> {
		const archiveToken = archiveOrGroupKey ? this.archiveMap.get(archiveOrGroupKey) : null
		if (archiveToken != null && canBeUsedForAnotherRequest(archiveToken, this.dateProvider)) {
			return archiveToken
		}

		const tokens = deduplicate(instanceIds.map((id) => this.instanceMap.get(id) ?? null))
		const firstTokenFound = first(tokens)
		if (tokens.length != 1 || firstTokenFound == null || !canBeUsedForAnotherRequest(firstTokenFound, this.dateProvider)) {
			const newToken = await loader()
			if (archiveOrGroupKey != null && newToken.tokenKind === BlobAccessTokenKind.Archive) {
				this.archiveMap.set(archiveOrGroupKey, newToken)
			} else {
				for (const id of instanceIds) {
					this.instanceMap.set(id, newToken)
				}
			}
			return newToken
		} else {
			return firstTokenFound
		}
	}

	public evictInstanceId(id: Id): void {
		this.evictAll([id])
	}

	public evictArchiveOrGroupKey(id: Id): void {
		this.archiveMap.delete(id)
	}

	public evictAll(ids: Id[]): void {
		for (const id of ids) {
			this.instanceMap.delete(id)
		}
	}
}
