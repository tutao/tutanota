import { Nullable } from "@tutao/utils"
import { CustomCacheHandlerMap } from "./CustomCacheHandler"
import { GetOrPutInstance } from "@tutao/instance-pipeline"
import { Range } from "./OfflineStorage"
import { Entity, ListElementEntity, ServerModelParsedInstance, SomeEntity } from "@tutao/meta"
import { TypeRef } from "@tutao/meta"

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
export interface ExposedCacheStorage extends GetOrPutInstance {
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

	/**
	 * remove a complete range for a ListElementEntity from the cache by typeRef and listId.
	 * deleting an entire range is helpful, when the instances should be explicitly reloaded the
	 * next time a loadRange call is executed, but keeps already downloaded instances in cache,
	 * when e.g. querying them explicitly with loadMultiple.
	 *
	 * This interface is exposed mainly to allow deleting the range of MailSetEntries for a
	 * respective targetFolder when importing mails. This makes sure, that we keep already downloaded
	 * MailSetEntries in cache, but still show all mails inside the targetFolder correctly.
	 *
	 */
	deleteRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: string): Promise<void>
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

	deleteIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, id: Id): Promise<void>

	/**
	 * remove a complete range for a ListElementEntity from the cache by typeRef and listId.
	 * deleting an entire range is helpful, when the instances should be explicitly reloaded the
	 * next time a loadRange call is executed, but keeps already downloaded instances in cache,
	 * when e.g. querying them explicitly with loadMultiple.
	 *
	 * This interface is exposed mainly to allow deleting the range of MailSetEntries for a
	 * respective targetFolder when importing mails. This makes sure, that we keep already downloaded
	 * MailSetEntries in cache, but still show all mails inside the targetFolder correctly.
	 */
	deleteRange<T extends ListElementEntity>(typeRef: TypeRef<T>, listId: string): Promise<void>

	putLastUpdateTime(value: number): Promise<void>

	getUserId(): Id

	deleteAllOwnedBy(owner: Id): Promise<void>

	isInitialized(): boolean
}
