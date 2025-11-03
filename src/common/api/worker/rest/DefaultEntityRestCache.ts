import {
	EntityRestClient,
	EntityRestClientEraseOptions,
	EntityRestClientLoadOptions,
	EntityRestClientSetupOptions,
	EntityRestInterface,
	getCacheModeBehavior,
	OwnerEncSessionKeyProvider,
} from "./EntityRestClient"
import { OperationType } from "../../common/TutanotaConstants"
import { assertNotNull, downcast, getFirstOrThrow, getTypeString, isNotEmpty, isSameTypeRef, lastThrow, Nullable, TypeRef } from "@tutao/tutanota-utils"
import {
	AuditLogEntryTypeRef,
	BucketPermissionTypeRef,
	EntityEventBatchTypeRef,
	GroupKeyTypeRef,
	GroupTypeRef,
	KeyRotationTypeRef,
	PermissionTypeRef,
	RecoverCodeTypeRef,
	RejectedSenderTypeRef,
	SecondFactorTypeRef,
	SessionTypeRef,
	UserGroupKeyDistributionTypeRef,
	UserGroupRootTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { ValueType } from "../../common/EntityConstants.js"
import {
	CalendarEventUidIndexTypeRef,
	ClientSpamTrainingDatumIndexEntryTypeRef,
	ClientSpamTrainingDatumTypeRef,
	MailDetailsBlobTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../entities/tutanota/TypeRefs.js"
import {
	CUSTOM_MAX_ID,
	CUSTOM_MIN_ID,
	elementIdPart,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	get_IdValue,
	isCustomIdType,
	listIdPart,
} from "../../common/utils/EntityUtils"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { assertWorkerOrNode } from "../../common/Env"
import type { Entity, ListElementEntity, ServerModelParsedInstance, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { ENTITY_EVENT_BATCH_EXPIRE_MS } from "../EventBusClient"
import { CustomCacheHandlerMap } from "./cacheHandler/CustomCacheHandler.js"
import { EntityUpdateData, isUpdateForTypeRef, PrefetchStatus } from "../../common/utils/EntityUpdateUtils.js"
import { TypeModelResolver } from "../../common/EntityFunctions"
import { AttributeModel } from "../../common/AttributeModel"
import { collapseId, expandId } from "./RestClientIdUtils"
import { PatchMerger } from "../offline/PatchMerger"
import { hasError, isExpectedErrorForSynchronization } from "../../common/utils/ErrorUtils"
import { SpamClassificationModel } from "../../../../mail-app/workerUtils/spamClassification/SpamClassifier"

assertWorkerOrNode()

/**
 *
 * The minimum size of a range request when extending an existing range
 * Because we extend by making (potentially) many range requests until we reach the startId
 * We want to avoid that the requests are too small
 */
export const EXTEND_RANGE_MIN_CHUNK_SIZE = 40
const IGNORED_TYPES = [
	EntityEventBatchTypeRef,
	PermissionTypeRef,
	BucketPermissionTypeRef,
	SessionTypeRef,
	SecondFactorTypeRef,
	RecoverCodeTypeRef,
	RejectedSenderTypeRef,
	// when doing automatic calendar updates, we will miss uid index entity updates if we're using the cache.
	// this is mainly caused by some calendaring apps sending the same update multiple times in the same mail.
	// the earliest place where we could deduplicate would be in entityEventsReceived on the calendarModel.
	CalendarEventUidIndexTypeRef,
	KeyRotationTypeRef,
	UserGroupRootTypeRef,
	UserGroupKeyDistributionTypeRef,
	AuditLogEntryTypeRef, // Should not be part of cached data because there are errors inside entity event processing after rotating the admin group key
	ClientSpamTrainingDatumTypeRef,
	ClientSpamTrainingDatumIndexEntryTypeRef,
] as const

/**
 * List of types containing a customId that we want to explicitly enable caching for.
 * CustomId types are not cached by default because their id is using base64UrlEncoding while GeneratedUId types are using base64Ext encoding.
 * base64Url encoding results in a different sort order of elements that we have on the server, this is problematic for caching LET and their ranges.
 * When enabling caching for customId types we convert the id that we store in cache from base64Url to base64Ext so we have the same sort order. (see function
 * OfflineStorage.ensureBase64Ext). In theory, we can try to enable caching for all types but as of now we enable it for a limited amount of types because there
 * are other ways to cache customId types (see implementation of CustomCacheHandler)
 */
const CACHEABLE_CUSTOMID_TYPES = [MailSetEntryTypeRef, GroupKeyTypeRef] as const

export interface EntityRestCache extends EntityRestInterface {
	/**
	 * Clear out the contents of the cache.
	 */
	purgeStorage(): Promise<void>

	/**
	 * Get the batch id of the most recently processed batch for the given group.
	 */
	getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null>

	/**
	 * Saved tha batch id of the most recently processed batch manually.
	 *
	 * Is needed when the cache is new but we want to make sure that the next time we will download from this moment, even if we don't receive any events.
	 */
	setLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void>

	/**
	 * Persist the last time client downloaded event batches. This is not the last *processed* item, merely when things were *downloaded*. We use it to
	 * detect out-of-sync.
	 */
	recordSyncTime(): Promise<void>

	/**
	 * Fetch the time since last time we downloaded event batches.
	 */
	timeSinceLastSyncMs(): Promise<number | null>

	/**
	 * Detect if out of sync based on stored "lastUpdateTime" and the current server time
	 */
	isOutOfSync(): Promise<boolean>

	/**
	 * Delete a cached entity. Sometimes this is necessary to do to ensure you always load the new version
	 */
	deleteFromCacheIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Iterable<Id>): Promise<void>
}

// todo: remove this and use from offlineStorage.ts/Range
export type Range = { lower: Id; upper: Id }

export type LastUpdateTime = { type: "recorded"; time: number } | { type: "never" } | { type: "uninitialized" }

/**
 * Part of the cache storage only with subset of CacheStorage functionality
 *
 * Separate from the rest of the cache as a narrow interface to not expose the whole storage for cases where we want to only get the cached part of the list to
 * display it even if we can't load the full page from the server or need some metadata.
 *
 * also exposes functions to repair an outdated cache in case we can't access the server without getting a new version of a cached entity
 * (mainly password changes)
 */
export interface ExposedCacheStorage {
	get<T extends Entity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null>

	/**
	 * Load range of entities. Does not include {@param start}.
	 * If {@param reverse} is false then returns entities newer than {@param start} in ascending order sorted by
	 * elementId.
	 * If {@param reverse} is true then returns entities older than {@param start} in descending order sorted by
	 * elementId.
	 */
	provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]>

	/**
	 * Load a set of entities by id. Missing elements are not returned, no error is thrown.
	 */
	provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Nullable<Id>, elementIds: Id[]): Promise<Array<T>>

	/**
	 * retrieve all list elements that are in the cache
	 * @param typeRef
	 * @param listId
	 */
	getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>>

	getLastUpdateTime(): Promise<LastUpdateTime>

	/**
	 * Clear the contents of the cache.
	 *
	 * Tables unrelated to cache will not be deleted.
	 */
	purgeStorage(): Promise<void>

	clearExcludedData(timeRangeDate: Date): Promise<void>

	/**
	 * remove an ElementEntity from the cache by typeRef and Id.
	 * the exposed interface is intentionally more narrow than the internal cacheStorage because
	 * we must maintain the integrity of our list ranges.
	 * */
	deleteIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<void>
}

export interface CacheStorage extends ExposedCacheStorage {
	/**
	 * Get a given entity from the cache, expects that you have already checked for existence
	 */
	getParsed(typeRef: TypeRef<unknown>, listId: Id | null, id: Id): Promise<ServerModelParsedInstance | null>

	/**
	 * Load range of entities. Does not include {@param start}.
	 * If {@param reverse} is false then returns entities newer than {@param start} in ascending order sorted by
	 * elementId.
	 * If {@param reverse} is true then returns entities older than {@param start} in descending order sorted by
	 * elementId.
	 */
	provideFromRangeParsed(typeRef: TypeRef<unknown>, listId: Id, start: Id, count: number, reverse: boolean): Promise<ServerModelParsedInstance[]>

	/**
	 * Load a set of by id. Missing elements are not returned, no error is thrown.
	 */
	provideMultipleParsed(typeRef: TypeRef<unknown>, listId: Nullable<Id>, elementIds: Id[]): Promise<Array<ServerModelParsedInstance>>

	/**
	 * retrieve all list elements that are in the cache
	 * @param typeRef
	 * @param listId
	 */
	getWholeListParsed(typeRef: TypeRef<unknown>, listId: Id): Promise<Array<ServerModelParsedInstance>>

	/**
	 * get a map with cache handlers for the customId types this storage implementation supports
	 * customId types that don't have a custom handler don't get served from the cache
	 */
	getCustomCacheHandlerMap(): CustomCacheHandlerMap

	isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<boolean>

	put(typeRef: TypeRef<unknown>, instance: ServerModelParsedInstance): Promise<void>

	putMultiple(typeRef: TypeRef<unknown>, instances: ServerModelParsedInstance[]): Promise<void>

	getRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Range | null>

	setUpperRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void>

	setLowerRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<void>

	/**
	 * Creates a new list cache if there is none. Resets everything but elements.
	 * @param typeRef
	 * @param listId
	 * @param lower
	 * @param upper
	 */
	setNewRangeForList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, lower: Id, upper: Id): Promise<void>

	getIdsInRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<Id>>

	/**
	 * Persist the last processed batch for a given group id.
	 */
	putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void>

	/**
	 * Retrieve the least processed batch id for a given group.
	 */
	getLastBatchIdForGroup(groupId: Id): Promise<Id | null>

	deleteIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<void>

	putLastUpdateTime(value: number): Promise<void>

	getLastTrainingDataIndexId(): Promise<Id>

	setLastTrainingDataIndexId(id: Id): Promise<void>

	getLastTrainedFromScratchTime(): Promise<number>

	setLastTrainedFromScratchTime(value: number): Promise<void>

	getSpamClassificationModel(ownerGroup: Id): Promise<Nullable<SpamClassificationModel>>

	setSpamClassificationModel(model: SpamClassificationModel): Promise<void>

	getUserId(): Id

	deleteAllOwnedBy(owner: Id): Promise<void>
}

/**
 * This implementation provides a caching mechanism to the rest chain.
 * It forwards requests to the entity rest client.
 * The cache works as follows:
 * If a read from the target fails, the request fails.
 * If a read from the target is successful, the cache is written and the element returned.
 * For LETs the cache stores one range per list id. if a range is requested starting in the stored range or at the range ends the missing elements are loaded from the server.
 * Only ranges with elements with generated ids are stored in the cache. Custom id elements are only stored as single element currently. If needed this has to be extended for ranges.
 * Range requests starting outside the stored range are only allowed if the direction is away from the stored range. In this case we load from the range end to avoid gaps in the stored range.
 * Requests for creating or updating elements are always forwarded and not directly stored in the cache.
 * On EventBusClient notifications updated elements are stored in the cache if the element already exists in the cache.
 * On EventBusClient notifications new elements are only stored in the cache if they are LETs and in the stored range.
 * On EventBusClient notifications deleted elements are removed from the cache.
 *
 * Range handling:
 * |          <|>        c d e f g h i j k      <|>             |
 * MIN_ID  lowerRangeId     ids in range    upperRangeId    MAX_ID
 * lowerRangeId may be anything from MIN_ID to c, upperRangeId may be anything from k to MAX_ID
 */
export class DefaultEntityRestCache implements EntityRestCache {
	constructor(
		private readonly entityRestClient: EntityRestClient,
		private readonly storage: CacheStorage,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly patchMerger: PatchMerger,
	) {}

	async load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, opts: EntityRestClientLoadOptions = {}): Promise<T> {
		const useCache = this.shouldUseCache(typeRef, opts)
		if (!useCache) {
			return await this.entityRestClient.load(typeRef, id, opts)
		}

		const { listId, elementId } = expandId(id)
		const cachingBehavior = getCacheModeBehavior(opts.cacheMode)
		const cachedEntity = cachingBehavior.readsFromCache ? await this.storage.getParsed(typeRef, listId, elementId) : null

		if (cachedEntity == null) {
			const parsedInstance = await this.entityRestClient.loadParsedInstance(typeRef, id, opts)
			if (cachingBehavior.writesToCache && !hasError(parsedInstance)) {
				await this.storage.put(typeRef, parsedInstance)
			}

			return await this.entityRestClient.mapInstanceToEntity(typeRef, parsedInstance)
		} else {
			return await this.entityRestClient.mapInstanceToEntity(typeRef, cachedEntity)
		}
	}

	async loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		ids: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		opts: EntityRestClientLoadOptions = {},
	): Promise<Array<T>> {
		const useCache = this.shouldUseCache(typeRef, opts)
		if (!useCache) {
			return await this.entityRestClient.loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts)
		}
		return await this._loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts)
	}

	setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict, options?: EntityRestClientSetupOptions): Promise<Id | null> {
		return this.entityRestClient.setup(listId, instance, extraHeaders, options)
	}

	setupMultiple<T extends SomeEntity>(listId: Id | null, instances: Array<T>): Promise<Array<Id>> {
		return this.entityRestClient.setupMultiple(listId, instances)
	}

	update<T extends SomeEntity>(instance: T): Promise<void> {
		return this.entityRestClient.update(instance)
	}

	erase<T extends SomeEntity>(instance: T, options?: EntityRestClientEraseOptions): Promise<void> {
		return this.entityRestClient.erase(instance, options)
	}

	eraseMultiple<T extends SomeEntity>(listId: Id, instances: Array<T>, options?: EntityRestClientEraseOptions): Promise<void> {
		return this.entityRestClient.eraseMultiple(listId, instances, options)
	}

	getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null> {
		return this.storage.getLastBatchIdForGroup(groupId)
	}

	setLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void> {
		return this.storage.putLastBatchIdForGroup(groupId, batchId)
	}

	purgeStorage(): Promise<void> {
		console.log("Purging the user's offline database")
		return this.storage.purgeStorage()
	}

	async isOutOfSync(): Promise<boolean> {
		const timeSinceLastSync = await this.timeSinceLastSyncMs()
		return timeSinceLastSync != null && timeSinceLastSync > ENTITY_EVENT_BATCH_EXPIRE_MS
	}

	async recordSyncTime(): Promise<void> {
		const timestamp = this.getServerTimestampMs()
		await this.storage.putLastUpdateTime(timestamp)
	}

	async timeSinceLastSyncMs(): Promise<number | null> {
		const lastUpdate = await this.storage.getLastUpdateTime()
		let lastUpdateTime: number
		switch (lastUpdate.type) {
			case "recorded":
				lastUpdateTime = lastUpdate.time
				break
			case "never":
				return null
			case "uninitialized":
				throw new ProgrammingError("Offline storage is not initialized")
		}
		const now = this.getServerTimestampMs()
		return now - lastUpdateTime
	}

	private getServerTimestampMs(): number {
		return this.entityRestClient.getRestClient().getServerTimestampMs()
	}

	async deleteFromCacheIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void> {
		return this.storage.deleteIfExists(typeRef, listId, elementId)
	}

	private async _loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		ids: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		opts: EntityRestClientLoadOptions = {},
	): Promise<Array<T>> {
		const cachingBehavior = getCacheModeBehavior(opts.cacheMode)
		let entitiesInCache: ServerModelParsedInstance[] = []

		let idsToLoad: Id[]
		if (cachingBehavior.readsFromCache) {
			const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
			const cached = await this.storage.provideMultipleParsed(typeRef, listId, ids)
			entitiesInCache.push(...cached)
			const loadedIds = new Set(
				entitiesInCache.map((e) => {
					if (listId) {
						return elementIdPart(downcast<IdTuple>(AttributeModel.getAttribute(e, "_id", typeModel)))
					} else {
						return downcast<Id>(AttributeModel.getAttribute(e, "_id", typeModel))
					}
				}),
			)
			idsToLoad = ids.filter((id) => !loadedIds.has(id))
		} else {
			idsToLoad = ids
		}

		if (idsToLoad.length > 0) {
			const entitiesFromServer = await this.entityRestClient.loadMultipleParsedInstances(typeRef, listId, idsToLoad, ownerEncSessionKeyProvider, opts)
			if (cachingBehavior.writesToCache) {
				await this.storage.putMultiple(typeRef, entitiesFromServer)
			}
			entitiesInCache = entitiesFromServer.concat(entitiesInCache)
		}
		return await this.entityRestClient.mapInstancesToEntity(typeRef, entitiesInCache)
	}

	async loadRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions = {},
	): Promise<T[]> {
		const customHandler = this.storage.getCustomCacheHandlerMap().get(typeRef)
		if (customHandler && customHandler.loadRange) {
			return await customHandler.loadRange(this.storage, listId, start, count, reverse)
		}

		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const useCache = this.shouldUseCache(typeRef, opts) && isCachedRangeType(typeModel, typeRef)

		if (!useCache) {
			return await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse, opts)
		}

		const behavior = getCacheModeBehavior(opts.cacheMode)
		if (!behavior.readsFromCache) {
			throw new ProgrammingError("cannot write to cache without reading with range requests")
		}

		const range = await this.storage.getRangeForList(typeRef, listId)

		if (behavior.writesToCache) {
			if (range == null) {
				await this.populateNewListWithRange(typeRef, listId, start, count, reverse, opts)
			} else if (isStartIdWithinRange(range, start, typeModel)) {
				await this.extendFromWithinRange(typeRef, listId, start, count, reverse, opts)
			} else if (isRangeRequestAwayFromExistingRange(range, reverse, start, typeModel)) {
				await this.extendAwayFromRange(typeRef, listId, start, count, reverse, opts)
			} else {
				await this.extendTowardsRange(typeRef, listId, start, count, reverse, opts)
			}
			return await this.storage.provideFromRange(typeRef, listId, start, count, reverse)
		} else {
			if (range && isStartIdWithinRange(range, start, typeModel)) {
				const provided = await this.storage.provideFromRange(typeRef, listId, start, count, reverse)
				const { newStart, newCount } = await this.recalculateRangeRequest(typeRef, listId, start, count, reverse)
				const newElements = newCount > 0 ? await this.entityRestClient.loadRange(typeRef, listId, newStart, newCount, reverse) : []
				return provided.concat(newElements)
			} else {
				// Since our starting ID is not in our range, we can't use the cache because we don't know exactly what
				// elements are missing.
				//
				// This can result in us re-retrieving elements we already have. Since we anyway must do a request,
				// this is fine.
				return await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse, opts)
			}
		}
	}

	/**
	 * Creates a new list range, reading everything from the server that it can
	 * range:         (none)
	 * request:       *--------->
	 * range becomes: |---------|
	 * @private
	 */
	private async populateNewListWithRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions,
	) {
		// Create a new range and load everything
		const parsedInstances = await this.entityRestClient.loadParsedInstancesRange(typeRef, listId, start, count, reverse, opts)

		// Initialize a new range for this list
		await this.storage.setNewRangeForList(typeRef, listId, start, start)

		// The range bounds will be updated in here
		await this.updateRangeInStorage(typeRef, listId, count, reverse, parsedInstances)
	}

	/**
	 * Returns part of a request from the cache, and the remainder is loaded from the server
	 * range:          |---------|
	 * request:             *-------------->
	 * range becomes: |--------------------|
	 */
	private async extendFromWithinRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions,
	) {
		const { newStart, newCount } = await this.recalculateRangeRequest(typeRef, listId, start, count, reverse)
		if (newCount > 0) {
			// We will be able to provide some entities from the cache, so we just want to load the remaining entities from the server
			const parsedInstances = await this.entityRestClient.loadParsedInstancesRange(typeRef, listId, newStart, newCount, reverse, opts)
			await this.updateRangeInStorage(typeRef, listId, newCount, reverse, parsedInstances)
		}
	}

	/**
	 * Start was outside the range, and we are loading away from the range
	 * Keeps loading elements from the end of the range in the direction of the startId.
	 * Returns once all available elements have been loaded or the requested number is in cache
	 * range:          |---------|
	 * request:                     *------->
	 * range becomes:  |--------------------|
	 */
	private async extendAwayFromRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions,
	) {
		// Start is outside the range, and we are loading away from the range, so we grow until we are able to provide enough
		// entities starting at startId
		while (true) {
			const range = assertNotNull(await this.storage.getRangeForList(typeRef, listId))

			// Which end of the range to start loading from
			const loadStartId = reverse ? range.lower : range.upper

			const requestCount = Math.max(count, EXTEND_RANGE_MIN_CHUNK_SIZE)

			// Load some entities
			const parsedInstances = await this.entityRestClient.loadParsedInstancesRange(typeRef, listId, loadStartId, requestCount, reverse, opts)
			await this.updateRangeInStorage(typeRef, listId, requestCount, reverse, parsedInstances)

			// If we exhausted the entities from the server
			if (parsedInstances.length < requestCount) {
				break
			}

			// Try to get enough entities from cache
			const entitiesFromCache = await this.storage.provideFromRange(typeRef, listId, start, count, reverse)

			// If cache is now capable of providing the whole request
			if (entitiesFromCache.length === count) {
				break
			}
		}
	}

	/**
	 * Loads all elements from the startId in the direction of the range
	 * Once complete, returns as many elements as it can from the original request
	 * range:         |---------|
	 * request:                     <------*
	 * range becomes: |--------------------|
	 * or
	 * range:              |---------|
	 * request:       <-------------------*
	 * range becomes: |--------------------|
	 */
	private async extendTowardsRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions,
	) {
		while (true) {
			const range = assertNotNull(await this.storage.getRangeForList(typeRef, listId))

			const loadStartId = reverse ? range.upper : range.lower

			const requestCount = Math.max(count, EXTEND_RANGE_MIN_CHUNK_SIZE)

			const parsedInstances = await this.entityRestClient.loadParsedInstancesRange(typeRef, listId, loadStartId, requestCount, !reverse, opts)

			await this.updateRangeInStorage(typeRef, listId, requestCount, !reverse, parsedInstances)

			// The call to `updateRangeInStorage` will have set the range bounds to GENERATED_MIN_ID/GENERATED_MAX_ID
			// in the case that we have exhausted all elements from the server, so if that happens, we will also end up breaking here
			if (await this.storage.isElementIdInCacheRange(typeRef, listId, start)) {
				break
			}
		}

		await this.extendFromWithinRange(typeRef, listId, start, count, reverse, opts)
	}

	/**
	 * Given the parameters and result of a range request,
	 * Inserts the result into storage, and updates the range bounds
	 * based on number of entities requested and the actual amount that were received
	 */
	private async updateRangeInStorage<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		countRequested: number,
		wasReverseRequest: boolean,
		receivedEntities: ServerModelParsedInstance[],
	) {
		// Filter out parsed instances after the first instances with SessionKeyNotFoundErrors in _errors,
		// because we should NEVER store instances in the storage that have a temporary decryption error
		// for example because the session key was not found. This is usually happening e.g. for attachments (file type)
		// where the _ownerEncSessionKey has not been written to the instance yet.
		// Since this is only a temporary error, we do not want to update the full range yet, leading the client to think the instance is already cached.
		// Entities with permanent errors (_errors but not SessionKeyNotFoundErrors) are written to the offline storage.
		// The corrupted fields in such cases are replace with default values and causes therefore not UI issues (See CryptoMapper.decryptParsedInstance).

		let allInstances = wasReverseRequest ? receivedEntities.reverse() : receivedEntities

		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)

		const ownerEncSessionKeyAttributeId = AttributeModel.getAttributeId(typeModel, "_ownerEncSessionKey")

		// look for first instance with a SessionKeyNotFoundError. See CryptoMapper.decryptParsedInstance.
		const errorRangeBound = allInstances.findIndex((instance) => hasError(instance, ownerEncSessionKeyAttributeId))

		const instancesWithoutSessionKeyNotFoundErrors = errorRangeBound !== -1 ? allInstances.slice(0, errorRangeBound) : allInstances
		const instancesWithoutErrors = instancesWithoutSessionKeyNotFoundErrors.filter((instance) => true)

		await this.storage.putMultiple(typeRef, instancesWithoutErrors)

		const isCustomId = isCustomIdType(await this.typeModelResolver.resolveClientTypeReference(typeRef))

		const isFinishedLoading = instancesWithoutErrors.length === receivedEntities.length && receivedEntities.length < countRequested
		if (wasReverseRequest) {
			// Ensure that elements are cached in ascending (not reverse) order

			if (isFinishedLoading) {
				console.log("finished loading, setting min id")
				await this.storage.setLowerRangeForList(typeRef, listId, isCustomId ? CUSTOM_MIN_ID : GENERATED_MIN_ID)
			} else if (isNotEmpty(instancesWithoutSessionKeyNotFoundErrors)) {
				// When all receivedEntities have SessionKeyNotFound errors, and therefore instancesWithoutSessionKeyNotFoundErrors is empty, do nothing

				// After reversing the list the first element in the list is the lower range limit
				await this.storage.setLowerRangeForList(
					typeRef,
					listId,
					elementIdPart(AttributeModel.getAttribute(getFirstOrThrow(instancesWithoutSessionKeyNotFoundErrors), "_id", typeModel)),
				)
			}
		} else {
			// When all receivedEntities have SessionKeyNotFound errors, and therefore instancesWithoutSessionKeyNotFoundErrors is empty, do nothing

			// Last element in the list is the upper range limit
			if (isFinishedLoading) {
				// all elements have been loaded, so the upper range must be set to MAX_ID
				console.log("finished loading, setting max id")
				await this.storage.setUpperRangeForList(typeRef, listId, isCustomId ? CUSTOM_MAX_ID : GENERATED_MAX_ID)
			} else if (isNotEmpty(instancesWithoutSessionKeyNotFoundErrors)) {
				await this.storage.setUpperRangeForList(
					typeRef,
					listId,
					elementIdPart(AttributeModel.getAttribute(lastThrow(instancesWithoutSessionKeyNotFoundErrors), "_id", typeModel)),
				)
			}
		}
	}

	/**
	 * Calculates the new start value for the getElementRange request and the number of elements to read in
	 * order to read no duplicate values.
	 * @return returns the new start and count value. Important: count can be negative if everything is cached
	 */
	private async recalculateRangeRequest<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
	): Promise<{ newStart: string; newCount: number }> {
		let allRangeList = await this.storage.getIdsInRange(typeRef, listId)
		let elementsToRead = count
		let startElementId = start
		const range = await this.storage.getRangeForList(typeRef, listId)
		if (range == null) {
			return { newStart: start, newCount: count }
		}
		const { lower, upper } = range
		let indexOfStart = allRangeList.indexOf(start)

		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const isCustomId = isCustomIdType(typeModel)
		if (
			(!reverse && (isCustomId ? upper === CUSTOM_MAX_ID : upper === GENERATED_MAX_ID)) ||
			(reverse && (isCustomId ? lower === CUSTOM_MIN_ID : lower === GENERATED_MIN_ID))
		) {
			// we have already loaded the complete range in the desired direction, so we do not have to load from server
			elementsToRead = 0
		} else if (allRangeList.length === 0) {
			// Element range is empty, so read all elements
			elementsToRead = count
		} else if (indexOfStart !== -1) {
			// Start element is located in allRange read only elements that are not in allRange.
			if (reverse) {
				elementsToRead = count - indexOfStart
				startElementId = allRangeList[0] // use the lowest id in allRange as start element
			} else {
				elementsToRead = count - (allRangeList.length - 1 - indexOfStart)
				startElementId = allRangeList[allRangeList.length - 1] // use the  highest id in allRange as start element
			}
		} else if (lower === start || (firstBiggerThanSecond(start, lower, typeModel) && firstBiggerThanSecond(allRangeList[0], start, typeModel))) {
			// Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MIN_ID, or start is between lower range id and lowest element in range
			if (!reverse) {
				// if not reverse read only elements that are not in allRange
				startElementId = allRangeList[allRangeList.length - 1] // use the  highest id in allRange as start element
				elementsToRead = count - allRangeList.length
			}
			// if reverse read all elements
		} else if (
			upper === start ||
			(firstBiggerThanSecond(start, allRangeList[allRangeList.length - 1], typeModel) && firstBiggerThanSecond(upper, start, typeModel))
		) {
			// Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MAX_ID, or start is between upper range id and highest element in range
			if (reverse) {
				// if not reverse read only elements that are not in allRange
				startElementId = allRangeList[0] // use the  highest id in allRange as start element
				elementsToRead = count - allRangeList.length
			}
			// if not reverse read all elements
		}
		return { newStart: startElementId, newCount: elementsToRead }
	}

	/**
	 * Resolves when the entity is loaded from the server if necessary
	 * @pre The last call of this function must be resolved. This is needed to avoid that e.g. while
	 * loading a created instance from the server we receive an update of that instance and ignore it because the instance is not in the cache yet.
	 *
	 * @return Promise, which resolves to the array of valid events (if response is NotFound or NotAuthorized we filter it out)
	 */
	async entityEventsReceived(events: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<readonly EntityUpdateData[]> {
		await this.recordSyncTime()

		// we do not want to process entityUpdates where the prefetchStatus is PrefetchStatus.NotAvailable
		// PrefetchStatus.NotAvailable indicates that we failed to fetch the instance because of 404 NotFound, 403 NotAuthorized
		const regularUpdates = events.filter((u) => u.typeRef.app !== "monitor" && u.prefetchStatus !== PrefetchStatus.NotAvailable)
		// we need an array of UpdateEntityData
		const filteredUpdateEvents: EntityUpdateData[] = []
		for (let update of regularUpdates) {
			if (!this.shouldUseCache(update.typeRef)) {
				filteredUpdateEvents.push(update)
				continue
			}

			switch (update.operation) {
				case OperationType.UPDATE: {
					const handledUpdate = await this.processUpdateEvent(update)
					if (handledUpdate) {
						filteredUpdateEvents.push(handledUpdate)
					}
					break // do break instead of continue to avoid ide warnings
				}
				case OperationType.DELETE: {
					if (isUpdateForTypeRef(MailTypeRef, update)) {
						// delete mailDetails if they are available (as we don't send an event for this type)
						const mail = await this.storage.get(update.typeRef, update.instanceListId, update.instanceId)
						if (mail) {
							let mailDetailsId = mail.mailDetails
							await this.storage.deleteIfExists(update.typeRef, update.instanceListId, update.instanceId)
							if (mailDetailsId != null) {
								await this.storage.deleteIfExists(MailDetailsBlobTypeRef, listIdPart(mailDetailsId), elementIdPart(mailDetailsId))
							}
						}
					} else {
						await this.storage.deleteIfExists(update.typeRef, update.instanceListId, update.instanceId)
					}
					filteredUpdateEvents.push(update)
					break // do break instead of continue to avoid ide warnings
				}
				case OperationType.CREATE: {
					const handledUpdate = await this.processCreateEvent(update.typeRef, update)
					if (handledUpdate) {
						filteredUpdateEvents.push(handledUpdate)
					}
					break // do break instead of continue to avoid ide warnings
				}
				default:
					throw new ProgrammingError("Unknown operation type: " + update.operation)
			}
		}

		// Pass these events to their respective handlers before writing batch ID to ensure that certain methods are not
		// missed before batch ID is written
		for (const update of filteredUpdateEvents) {
			const { operation, typeRef } = update

			const handler = this.storage.getCustomCacheHandlerMap().get(typeRef)
			if (handler == null) {
				continue
			}

			const id = collapseId(update.instanceListId, update.instanceId)

			try {
				switch (operation) {
					case OperationType.CREATE:
						await handler.onEntityEventCreate?.(id, filteredUpdateEvents)
						break
					case OperationType.UPDATE:
						await handler.onEntityEventUpdate?.(id, filteredUpdateEvents)
						break
					case OperationType.DELETE:
						await handler.onEntityEventDelete?.(id)
						break
				}
			} catch (e) {
				if (isExpectedErrorForSynchronization(e)) {
					continue
				} else {
					throw e
				}
			}
		}

		// the whole batch has been written successfully
		await this.storage.putLastBatchIdForGroup(groupId, batchId)
		// merge the results
		return filteredUpdateEvents
	}

	private async processCreateEvent(typeRef: TypeRef<any>, update: EntityUpdateData): Promise<EntityUpdateData | null> {
		// if entityUpdate has been Prefetched or is NotAvailable, we do not need to do anything
		if (update.prefetchStatus === PrefetchStatus.NotPrefetched) {
			// we put new instances into cache only when it's a new instance in the cached range which is only for the list instances
			if (update.instanceListId != null) {
				// if there is a custom handler we follow its decision
				let shouldUpdateDb = this.storage.getCustomCacheHandlerMap().get(typeRef)?.shouldLoadOnCreateEvent?.(update)
				// otherwise, we do a range check to see if we need to keep the range up-to-date. No need to load anything out of range
				shouldUpdateDb = shouldUpdateDb ?? (await this.storage.isElementIdInCacheRange(typeRef, update.instanceListId, update.instanceId))

				if (shouldUpdateDb) {
					try {
						return await this.loadAndStoreInstanceFromUpdate(update)
					} catch (e) {
						if (isExpectedErrorForSynchronization(e)) {
							return null
						} else {
							throw e
						}
					}
				}
			}
		}
		return update
	}

	/** Returns {null} when the update should be skipped. */
	private async processUpdateEvent(update: EntityUpdateData): Promise<EntityUpdateData | null> {
		if (isSameTypeRef(update.typeRef, GroupTypeRef)) {
			console.log("DefaultEntityRestCache - processUpdateEvent of type Group:" + update.instanceId)
		}

		try {
			if (update.prefetchStatus === PrefetchStatus.NotPrefetched) {
				if (update.patches) {
					const patchAppliedInstance = await this.patchMerger.patchAndStoreInstance(update)
					if (patchAppliedInstance == null) {
						return await this.loadAndStoreInstanceFromUpdate(update)
					}
				} else {
					const cached = await this.storage.getParsed(update.typeRef, update.instanceListId, update.instanceId)
					if (cached != null) {
						return await this.loadAndStoreInstanceFromUpdate(update)
					}
				}
			}
			return update
		} catch (e) {
			// If the entity is not there anymore we should evict it from the cache and not keep the outdated/nonexistent instance around.
			// Even for list elements this should be safe as the instance is not there anymore.
			if (isExpectedErrorForSynchronization(e)) {
				console.log(`instance not found when processing update for ${JSON.stringify(update)}, deleting from the cache`)
				await this.storage.deleteIfExists(update.typeRef, update.instanceListId, update.instanceId)
				return null
			} else {
				throw e
			}
		}
	}

	/**
	 * Loads and stores an instance from an entityUpdate. If no instance is available on the entityUpdate
	 * or the instance has _errors, the instance is re-loaded from the server.
	 */
	private async loadAndStoreInstanceFromUpdate(update: EntityUpdateData) {
		const instanceOnUpdate = update.instance
		if (instanceOnUpdate != null && !hasError(instanceOnUpdate)) {
			// we do not want to put the instance in the offline storage if there are _errors (when decrypting)
			await this.storage.put(update.typeRef, instanceOnUpdate)
			return update
		} else {
			console.log("re-downloading instance from entity event, due to error : ", getTypeString(update.typeRef), update.instanceListId, update.instanceId)
			const instanceFromServer = await this.entityRestClient.loadParsedInstance(update.typeRef, collapseId(update.instanceListId, update.instanceId))
			if (!hasError(instanceFromServer)) {
				// we do not want to put the instance in the offline storage if there are _errors (when decrypting)
				await this.storage.put(update.typeRef, instanceFromServer)
				return update
			} else {
				return null
			}
		}
	}

	/**
	 * Check if the given request should use the cache
	 * @param typeRef typeref of the type
	 * @param opts entity rest client options, if any
	 * @return true if the cache can be used, false if a direct network request should be performed
	 */
	private shouldUseCache(typeRef: TypeRef<any>, opts?: EntityRestClientLoadOptions): boolean {
		// some types won't be cached
		if (isIgnoredType(typeRef)) {
			return false
		}

		// if a specific version is requested we have to load again and do not want to store it in the cache
		return opts?.queryParams?.version == null
	}
}

/**
 * Check if a range request begins inside an existing range
 */
function isStartIdWithinRange(range: Range, startId: Id, typeModel: TypeModel): boolean {
	return !firstBiggerThanSecond(startId, range.upper, typeModel) && !firstBiggerThanSecond(range.lower, startId, typeModel)
}

/**
 * Check if a range request is going away from an existing range
 * Assumes that the range request doesn't start inside the range
 */
function isRangeRequestAwayFromExistingRange(range: Range, reverse: boolean, start: string, typeModel: TypeModel) {
	return reverse ? firstBiggerThanSecond(range.lower, start, typeModel) : firstBiggerThanSecond(start, range.upper, typeModel)
}

/**
 * some types are completely ignored by the cache and always served from a request.
 * Note:
 * isCachedRangeType(ref) ---> !isIgnoredType(ref) but
 * isIgnoredType(ref) -/-> !isCachedRangeType(ref) because of opted-in CustomId types.
 */
function isIgnoredType(typeRef: TypeRef<unknown>): boolean {
	return typeRef.app === "monitor" || IGNORED_TYPES.some((ref) => isSameTypeRef(typeRef, ref))
}

/**
 * Checks if for the given type, that contains a customId,  caching is enabled.
 */
function isCachableCustomIdType(typeRef: TypeRef<unknown>): boolean {
	return CACHEABLE_CUSTOMID_TYPES.some((ref) => isSameTypeRef(typeRef, ref))
}

/**
 * Ranges for customId types are normally not cached, but some are opted in.
 * Note:
 * isCachedRangeType(ref) ---> !isIgnoredType(ref) but
 * isIgnoredType(ref) -/-> !isCachedRangeType(ref)
 */
function isCachedRangeType(typeModel: TypeModel, typeRef: TypeRef<unknown>): boolean {
	return (!isIgnoredType(typeRef) && isGeneratedIdType(typeModel)) || isCachableCustomIdType(typeRef)
}

function isGeneratedIdType(typeModel: TypeModel): boolean {
	const _idValue = get_IdValue(typeModel)
	return _idValue !== undefined && _idValue.type === ValueType.GeneratedId
}
