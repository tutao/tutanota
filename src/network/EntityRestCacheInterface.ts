import { EntityRestInterface } from "./EntityRestClient"
import { SomeEntity, TypeRef } from "@tutao/typerefs"

export interface EntityRestCache extends EntityRestInterface {
	/**
	 * Clear out the contents of the cache.
	 */
	purgeStorage(): Promise<void>

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
	deleteFromCacheIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void>
}
