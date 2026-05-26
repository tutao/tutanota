import { ListElementEntity, SomeEntity, TypeRef } from "@tutao/meta"
import { OwnerEncSessionKeyProvider } from "@tutao/instance-pipeline"
import { EntityUpdateData } from "../instance-pipeline/utils/EntityUpdateUtils"
import { EntityRestClientEraseOptions, EntityRestClientLoadOptions, EntityRestClientSetupOptions, EntityRestClientUpdateOptions } from "./EntityRestClient"

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
