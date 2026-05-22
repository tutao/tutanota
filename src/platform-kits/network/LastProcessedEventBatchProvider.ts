export interface LastProcessedEventBatchProvider {
	getLastEntityEventBatchForGroup(groupId: Id): Promise<Id | null>

	/**
	 * Saves the batch id of the most recently processed batch manually.
	 * Needed when the cache is new but we want to make sure that the next time we will download from this moment,
	 * even if we don't receive any events.
	 */
	putLastEntityEventBatchForGroup(groupId: Id, batchId: Id): Promise<void>
}
