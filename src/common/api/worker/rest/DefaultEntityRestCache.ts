import {
	CacheMode,
	EntityRestClient,
	EntityRestClientEraseOptions,
	EntityRestClientLoadOptions,
	EntityRestClientSetupOptions,
	EntityRestInterface,
	getCacheModeBehavior,
	OwnerEncSessionKeyProvider,
} from "./EntityRestClient"
import { resolveTypeReference } from "../../common/EntityFunctions"
import { OperationType } from "../../common/TutanotaConstants"
import { assertNotNull, difference, getFirstOrThrow, getTypeId, groupBy, isSameTypeRef, lastThrow, TypeRef } from "@tutao/tutanota-utils"
import {
	AuditLogEntryTypeRef,
	BucketPermissionTypeRef,
	EntityEventBatchTypeRef,
	EntityUpdate,
	GroupKeyTypeRef,
	KeyRotationTypeRef,
	PermissionTypeRef,
	RecoverCodeTypeRef,
	RejectedSenderTypeRef,
	SecondFactorTypeRef,
	SessionTypeRef,
	User,
	UserGroupKeyDistributionTypeRef,
	UserGroupRootTypeRef,
	UserTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { ValueType } from "../../common/EntityConstants.js"
import { NotAuthorizedError, NotFoundError } from "../../common/error/RestError"
import { CalendarEventUidIndexTypeRef, MailDetailsBlobTypeRef, MailSetEntry, MailSetEntryTypeRef, MailTypeRef } from "../../entities/tutanota/TypeRefs.js"
import {
	CUSTOM_MAX_ID,
	CUSTOM_MIN_ID,
	firstBiggerThanSecond,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	get_IdValue,
	getElementId,
} from "../../common/utils/EntityUtils"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { assertWorkerOrNode } from "../../common/Env"
import type { ListElementEntity, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { QueuedBatch } from "../EventQueue.js"
import { ENTITY_EVENT_BATCH_EXPIRE_MS } from "../EventBusClient"
import { CustomCacheHandlerMap } from "./CustomCacheHandler.js"
import { containsEventOfType, entityUpateToUpdateData, getEventOfType, isUpdateForTypeRef } from "../../common/utils/EntityUpdateUtils.js"
import { isCustomIdType } from "../offline/OfflineStorage.js"

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
}

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
	get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null>

	/**
	 * Load range of entities. Does not include {@param start}.
	 * If {@param reverse} is false then returns entities newer than {@param start} in ascending order sorted by
	 * elementId.
	 * If {@param reverse} is true then returns entities older than {@param start} in descending order sorted by
	 * elementId.
	 */
	provideFromRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean): Promise<T[]>

	/**
	 * Load a set of list element entities by id. Missing elements are not returned, no error is thrown.
	 */
	provideMultiple<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, elementIds: Id[]): Promise<Array<T>>

	/**
	 * retrieve all list elements that are in the cache
	 * @param typeRef
	 * @param listId
	 */
	getWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<Array<T>>

	getLastUpdateTime(): Promise<LastUpdateTime>

	clearExcludedData(): Promise<void>

	/**
	 * remove an ElementEntity from the cache by typeRef and Id.
	 * the exposed interface is intentionally more narrow than the internal cacheStorage because
	 * we must maintain the integrity of our list ranges.
	 * */
	deleteIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<void>

	/** delete all instances of the given type that share {@param listId}. also deletes the range of that list. */
	deleteWholeList<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id): Promise<void>
}

export interface CacheStorage extends ExposedCacheStorage {
	/**
	 * Get a given entity from the cache, expects that you have already checked for existence
	 */
	get<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<T | null>

	/**
	 * get a map with cache handlers for the customId types this storage implementation supports
	 * customId types that don't have a custom handler don't get served from the cache
	 */
	getCustomCacheHandlerMap(entityRestClient: EntityRestClient): CustomCacheHandlerMap

	isElementIdInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, id: Id): Promise<boolean>

	put(originalEntity: SomeEntity): Promise<void>

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

	purgeStorage(): Promise<void>

	putLastUpdateTime(value: number): Promise<void>

	getUserId(): Id

	deleteAllOwnedBy(owner: Id): Promise<void>

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the
	 * offline available mail list ranges for each mail list (referenced using the listId)
	 * @param listId the mail list that we want to lock
	 */
	lockRangesDbAccess(listId: Id): Promise<void>

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 * @param listId the mail list that we want to unlock
	 */
	unlockRangesDbAccess(listId: Id): Promise<void>
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
	constructor(private readonly entityRestClient: EntityRestClient, private readonly storage: CacheStorage) {}

	async load<T extends SomeEntity>(typeRef: TypeRef<T>, id: PropertyType<T, "_id">, opts: EntityRestClientLoadOptions = {}): Promise<T> {
		const useCache = await this.shouldUseCache(typeRef, opts)
		if (!useCache) {
			return await this.entityRestClient.load(typeRef, id, opts)
		}

		const { listId, elementId } = expandId(id)
		const cachingBehavior = getCacheModeBehavior(opts.cacheMode)
		const cachedEntity = cachingBehavior.readsFromCache ? await this.storage.get(typeRef, listId, elementId) : null

		if (cachedEntity == null) {
			const entity = await this.entityRestClient.load(typeRef, id, opts)
			if (cachingBehavior.writesToCache) {
				await this.storage.put(entity)
			}
			return entity
		}

		return cachedEntity
	}

	async loadMultiple<T extends SomeEntity>(
		typeRef: TypeRef<T>,
		listId: Id | null,
		ids: Array<Id>,
		ownerEncSessionKeyProvider?: OwnerEncSessionKeyProvider,
		opts: EntityRestClientLoadOptions = {},
	): Promise<Array<T>> {
		const useCache = await this.shouldUseCache(typeRef, opts)
		if (!useCache) {
			return await this.entityRestClient.loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts)
		}
		return await this._loadMultiple(typeRef, listId, ids, ownerEncSessionKeyProvider, opts)
	}

	setup<T extends SomeEntity>(listId: Id | null, instance: T, extraHeaders?: Dict, options?: EntityRestClientSetupOptions): Promise<Id> {
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

	/**
	 * Delete a cached entity. Sometimes this is necessary to do to ensure you always load the new version
	 */
	deleteFromCacheIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void> {
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
		const entitiesInCache: T[] = []

		let idsToLoad: Id[]
		if (cachingBehavior.readsFromCache) {
			idsToLoad = []
			for (const id of ids) {
				const cachedEntity = await this.storage.get(typeRef, listId, id)
				if (cachedEntity != null) {
					entitiesInCache.push(cachedEntity)
				} else {
					idsToLoad.push(id)
				}
			}
		} else {
			idsToLoad = ids
		}

		if (idsToLoad.length > 0) {
			const entitiesFromServer = await this.entityRestClient.loadMultiple(typeRef, listId, idsToLoad, ownerEncSessionKeyProvider, opts)
			if (cachingBehavior.writesToCache) {
				for (const entity of entitiesFromServer) {
					await this.storage.put(entity)
				}
			}
			return entitiesFromServer.concat(entitiesInCache)
		} else {
			return entitiesInCache
		}
	}

	async loadRange<T extends ListElementEntity>(
		typeRef: TypeRef<T>,
		listId: Id,
		start: Id,
		count: number,
		reverse: boolean,
		opts: EntityRestClientLoadOptions = {},
	): Promise<T[]> {
		const customHandler = this.storage.getCustomCacheHandlerMap(this.entityRestClient).get(typeRef)
		if (customHandler && customHandler.loadRange) {
			return await customHandler.loadRange(this.storage, listId, start, count, reverse)
		}

		const typeModel = await resolveTypeReference(typeRef)
		const useCache = (await this.shouldUseCache(typeRef, opts)) && isCachedRangeType(typeModel, typeRef)

		if (!useCache) {
			return await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse, opts)
		}

		const behavior = getCacheModeBehavior(opts.cacheMode)
		if (!behavior.readsFromCache) {
			throw new ProgrammingError("cannot write to cache without reading with range requests")
		}

		// We lock access to the "ranges" db here in order to prevent race conditions when accessing the ranges database.
		await this.storage.lockRangesDbAccess(listId)

		try {
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
		} finally {
			// We unlock access to the "ranges" db here. We lock it in order to prevent race conditions when accessing the "ranges" database.
			await this.storage.unlockRangesDbAccess(listId)
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
		const entities = await this.entityRestClient.loadRange(typeRef, listId, start, count, reverse, opts)

		// Initialize a new range for this list
		await this.storage.setNewRangeForList(typeRef, listId, start, start)

		// The range bounds will be updated in here
		await this.updateRangeInStorage(typeRef, listId, count, reverse, entities)
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
			const entities = await this.entityRestClient.loadRange(typeRef, listId, newStart, newCount, reverse, opts)
			await this.updateRangeInStorage(typeRef, listId, newCount, reverse, entities)
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
			const entities = await this.entityRestClient.loadRange(typeRef, listId, loadStartId, requestCount, reverse, opts)
			await this.updateRangeInStorage(typeRef, listId, requestCount, reverse, entities)

			// If we exhausted the entities from the server
			if (entities.length < requestCount) {
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

			const entities = await this.entityRestClient.loadRange(typeRef, listId, loadStartId, requestCount, !reverse, opts)

			await this.updateRangeInStorage(typeRef, listId, requestCount, !reverse, entities)

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
		receivedEntities: T[],
	) {
		const isCustomId = isCustomIdType(await resolveTypeReference(typeRef))
		let elementsToAdd = receivedEntities
		if (wasReverseRequest) {
			// Ensure that elements are cached in ascending (not reverse) order
			elementsToAdd = receivedEntities.reverse()
			if (receivedEntities.length < countRequested) {
				console.log("finished loading, setting min id")
				await this.storage.setLowerRangeForList(typeRef, listId, isCustomId ? CUSTOM_MIN_ID : GENERATED_MIN_ID)
			} else {
				// After reversing the list the first element in the list is the lower range limit
				await this.storage.setLowerRangeForList(typeRef, listId, getElementId(getFirstOrThrow(receivedEntities)))
			}
		} else {
			// Last element in the list is the upper range limit
			if (receivedEntities.length < countRequested) {
				// all elements have been loaded, so the upper range must be set to MAX_ID
				console.log("finished loading, setting max id")
				await this.storage.setUpperRangeForList(typeRef, listId, isCustomId ? CUSTOM_MAX_ID : GENERATED_MAX_ID)
			} else {
				await this.storage.setUpperRangeForList(typeRef, listId, getElementId(lastThrow(receivedEntities)))
			}
		}

		await Promise.all(elementsToAdd.map((element) => this.storage.put(element)))
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

		const typeModel = await resolveTypeReference(typeRef)
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
	async entityEventsReceived(batch: QueuedBatch): Promise<Array<EntityUpdate>> {
		await this.recordSyncTime()

		// we handle post multiple create operations separately to optimize the number of requests with getMultiple
		const createUpdatesForLETs: EntityUpdate[] = []
		const regularUpdates: EntityUpdate[] = [] // all updates not resulting from post multiple requests
		const updatesArray = batch.events
		for (const update of updatesArray) {
			// monitor application is ignored
			if (update.application === "monitor") continue
			// mailSetEntries are ignored because move operations are handled as a special event (and no post multiple is possible)
			if (
				update.operation === OperationType.CREATE &&
				getUpdateInstanceId(update).instanceListId != null &&
				!isUpdateForTypeRef(MailTypeRef, update) &&
				!isUpdateForTypeRef(MailSetEntryTypeRef, update)
			) {
				createUpdatesForLETs.push(update)
			} else {
				regularUpdates.push(update)
			}
		}

		const createUpdatesForLETsPerList = groupBy(createUpdatesForLETs, (update) => update.instanceListId)

		const postMultipleEventUpdates: EntityUpdate[][] = []
		// we first handle potential post multiple updates in get multiple requests
		for (let [instanceListId, updates] of createUpdatesForLETsPerList) {
			const firstUpdate = updates[0]
			const typeRef = new TypeRef<ListElementEntity>(firstUpdate.application, parseInt(firstUpdate.typeId))
			const ids = updates.map((update) => update.instanceId)

			// We only want to load the instances that are in cache range
			const customHandler = this.storage.getCustomCacheHandlerMap(this.entityRestClient).get(typeRef)
			const idsInCacheRange =
				customHandler && customHandler.getElementIdsInCacheRange
					? await customHandler.getElementIdsInCacheRange(this.storage, instanceListId, ids)
					: await this.getElementIdsInCacheRange(typeRef, instanceListId, ids)

			if (idsInCacheRange.length === 0) {
				postMultipleEventUpdates.push(updates)
			} else {
				const updatesNotInCacheRange =
					idsInCacheRange.length === updates.length ? [] : updates.filter((update) => !idsInCacheRange.includes(update.instanceId))

				try {
					// loadMultiple is only called to cache the elements and check which ones return errors
					const returnedInstances = await this._loadMultiple(typeRef, instanceListId, idsInCacheRange, undefined, { cacheMode: CacheMode.WriteOnly })
					//We do not want to pass updates that caused an error
					if (returnedInstances.length !== idsInCacheRange.length) {
						const returnedIds = returnedInstances.map((instance) => getElementId(instance))
						postMultipleEventUpdates.push(updates.filter((update) => returnedIds.includes(update.instanceId)).concat(updatesNotInCacheRange))
					} else {
						postMultipleEventUpdates.push(updates)
					}
				} catch (e) {
					if (e instanceof NotAuthorizedError) {
						// return updates that are not in cache Range if NotAuthorizedError (for those updates that are in cache range)
						postMultipleEventUpdates.push(updatesNotInCacheRange)
					} else {
						throw e
					}
				}
			}
		}

		const otherEventUpdates: EntityUpdate[] = []
		// we need an array of UpdateEntityData
		for (let update of regularUpdates) {
			const { operation, typeId, application } = update
			const { instanceListId, instanceId } = getUpdateInstanceId(update)
			const typeRef = new TypeRef<SomeEntity>(application, parseInt(typeId))

			switch (operation) {
				case OperationType.UPDATE: {
					const handledUpdate = await this.processUpdateEvent(typeRef, update)
					if (handledUpdate) {
						otherEventUpdates.push(handledUpdate)
					}
					break // do break instead of continue to avoid ide warnings
				}
				case OperationType.DELETE: {
					if (
						isSameTypeRef(MailSetEntryTypeRef, typeRef) &&
						containsEventOfType(
							updatesArray.map((e) => entityUpateToUpdateData(e)),
							OperationType.CREATE,
							instanceId,
						)
					) {
						// move for mail is handled in create event.
					} else if (isSameTypeRef(MailTypeRef, typeRef)) {
						// delete mailDetails if they are available (as we don't send an event for this type)
						const mail = await this.storage.get(MailTypeRef, instanceListId, instanceId)
						await this.storage.deleteIfExists(typeRef, instanceListId, instanceId)
						if (mail?.mailDetails != null) {
							await this.storage.deleteIfExists(MailDetailsBlobTypeRef, mail.mailDetails[0], mail.mailDetails[1])
						}
					} else {
						await this.storage.deleteIfExists(typeRef, instanceListId, instanceId)
					}
					otherEventUpdates.push(update)
					break // do break instead of continue to avoid ide warnings
				}
				case OperationType.CREATE: {
					const handledUpdate = await this.processCreateEvent(typeRef, update, updatesArray)
					if (handledUpdate) {
						otherEventUpdates.push(handledUpdate)
					}
					break // do break instead of continue to avoid ide warnings
				}
				default:
					throw new ProgrammingError("Unknown operation type: " + operation)
			}
		}
		// the whole batch has been written successfully
		await this.storage.putLastBatchIdForGroup(batch.groupId, batch.batchId)
		// merge the results
		return otherEventUpdates.concat(postMultipleEventUpdates.flat())
	}

	/** Returns {null} when the update should be skipped. */
	private async processCreateEvent(typeRef: TypeRef<any>, update: EntityUpdate, batch: ReadonlyArray<EntityUpdate>): Promise<EntityUpdate | null> {
		// do not return undefined to avoid implicit returns
		const { instanceId, instanceListId } = getUpdateInstanceId(update)

		// We put new instances into cache only when it's a new instance in the cached range which is only for the list instances.
		if (instanceListId != null) {
			const deleteEvent = getEventOfType(batch, OperationType.DELETE, instanceId)
			const mailSetEntry =
				deleteEvent && isSameTypeRef(MailSetEntryTypeRef, typeRef)
					? await this.storage.get(MailSetEntryTypeRef, deleteEvent.instanceListId, instanceId)
					: null
			// avoid downloading new mailSetEntry in case of move event (DELETE + CREATE)
			if (deleteEvent != null && mailSetEntry != null) {
				// It is a move event for cached mailSetEntry
				await this.storage.deleteIfExists(typeRef, deleteEvent.instanceListId, instanceId)
				await this.updateListIdOfMailSetEntryAndUpdateCache(mailSetEntry, instanceListId, instanceId)
				return update
			} else {
				// If there is a custom handler we follow its decision.
				// Otherwise, we do a range check to see if we need to keep the range up-to-date.
				const shouldLoad =
					(await this.storage.getCustomCacheHandlerMap(this.entityRestClient).get(typeRef)?.shouldLoadOnCreateEvent?.(update)) ??
					(await this.storage.isElementIdInCacheRange(typeRef, instanceListId, instanceId))
				if (shouldLoad) {
					// No need to try to download something that's not there anymore
					// We do not consult custom handlers here because they are only needed for list elements.
					console.log("downloading create event for", getTypeId(typeRef), instanceListId, instanceId)
					return this.entityRestClient
						.load(typeRef, [instanceListId, instanceId])
						.then((entity) => this.storage.put(entity))
						.then(() => update)
						.catch((e) => {
							if (isExpectedErrorForSynchronization(e)) {
								return null
							} else {
								throw e
							}
						})
				} else {
					return update
				}
			}
		} else {
			return update
		}
	}

	/**
	 * Updates the given mailSetEntry with the new list id and add it to the cache.
	 */
	private async updateListIdOfMailSetEntryAndUpdateCache(mailSetEntry: MailSetEntry, newListId: Id, elementId: Id) {
		// In case of a move operation we have to replace the list id always, as the mailSetEntry is stored in another folder.
		mailSetEntry._id = [newListId, elementId]
		await this.storage.put(mailSetEntry)
	}

	/** Returns {null} when the update should be skipped. */
	private async processUpdateEvent(typeRef: TypeRef<SomeEntity>, update: EntityUpdate): Promise<EntityUpdate | null> {
		const { instanceId, instanceListId } = getUpdateInstanceId(update)
		const cached = await this.storage.get(typeRef, instanceListId, instanceId)
		// No need to try to download something that's not there anymore
		if (cached != null) {
			try {
				// in case this is an update for the user instance: if the password changed we'll be logged out at this point
				// if we don't catch the expected NotAuthenticated Error that results from trying to load anything with
				// the old user.
				// Letting the NotAuthenticatedError propagate to the main thread instead of trying to handle it ourselves
				// or throwing out the update drops us onto the login page and into the session recovery flow if the user
				// clicks their saved credentials again, but lets them still use offline login if they try to use the
				// outdated credentials while not connected to the internet.
				const newEntity = await this.entityRestClient.load(typeRef, collapseId(instanceListId, instanceId))
				if (isSameTypeRef(typeRef, UserTypeRef)) {
					await this.handleUpdatedUser(cached, newEntity)
				}
				await this.storage.put(newEntity)
				return update
			} catch (e) {
				// If the entity is not there anymore we should evict it from the cache and not keep the outdated/nonexisting instance around.
				// Even for list elements this should be safe as the instance is not there anymore and is definitely not in this version
				if (isExpectedErrorForSynchronization(e)) {
					console.log(`Instance not found when processing update for ${JSON.stringify(update)}, deleting from the cache.`)
					await this.storage.deleteIfExists(typeRef, instanceListId, instanceId)
					return null
				} else {
					throw e
				}
			}
		}
		return update
	}

	private async handleUpdatedUser(cached: SomeEntity, newEntity: SomeEntity) {
		// When we are removed from a group we just get an update for our user
		// with no membership on it. We need to clean up all the entities that
		// belong to that group since we shouldn't be able to access them anymore
		// and we won't get any update or another chance to clean them up.
		const oldUser = cached as User
		if (oldUser._id !== this.storage.getUserId()) {
			return
		}
		const newUser = newEntity as User
		const removedShips = difference(oldUser.memberships, newUser.memberships, (l, r) => l._id === r._id)
		for (const ship of removedShips) {
			console.log("Lost membership on ", ship._id, ship.groupType)
			await this.storage.deleteAllOwnedBy(ship.group)
		}
	}

	/**
	 *
	 * @returns {Array<Id>} the ids that are in cache range and therefore should be cached
	 */
	private async getElementIdsInCacheRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: Id, ids: Id[]): Promise<Id[]> {
		const ret: Id[] = []
		for (let i = 0; i < ids.length; i++) {
			if (await this.storage.isElementIdInCacheRange(typeRef, listId, ids[i])) {
				ret.push(ids[i])
			}
		}
		return ret
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
 * Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
 * for the instance that was already deleted. Normally this would be optimized away but it might still happen due to timing.
 */
function isExpectedErrorForSynchronization(e: Error): boolean {
	return e instanceof NotFoundError || e instanceof NotAuthorizedError
}

export function expandId(id: Id | IdTuple): { listId: Id | null; elementId: Id } {
	if (typeof id === "string") {
		return {
			listId: null,
			elementId: id,
		}
	} else {
		const [listId, elementId] = id
		return {
			listId,
			elementId,
		}
	}
}

export function collapseId(listId: Id | null, elementId: Id): Id | IdTuple {
	if (listId != null) {
		return [listId, elementId]
	} else {
		return elementId
	}
}

export function getUpdateInstanceId(update: EntityUpdate): { instanceListId: Id | null; instanceId: Id } {
	let instanceListId
	if (update.instanceListId === "") {
		instanceListId = null
	} else {
		instanceListId = update.instanceListId
	}
	return { instanceListId, instanceId: update.instanceId }
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
