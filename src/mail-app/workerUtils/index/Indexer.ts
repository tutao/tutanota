import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"
import type { User } from "../../../common/api/entities/sys/TypeRefs"

export interface IndexerInitParams {
	user: User
	retryOnError?: boolean
}

export interface Indexer {
	/** Init upon partial login */
	partialLoginInit(): Promise<void>

	/** Init upon full login */
	fullLoginInit(params: IndexerInitParams): Promise<void>

	enableMailIndexing(): Promise<void>

	disableMailIndexing(): Promise<void>

	processEntityEvents(updates: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<void>

	/**
	 * Extends the mail index to the given timestamp.
	 *
	 * Does nothing if it is already at least as far back as the timestamp.
	 *
	 * @param time timestamp
	 */
	extendMailIndex(time: number): Promise<void>

	/**
	 * Sets the mail index to the given timestamp.
	 *
	 * If the mail index would extend, then this will have the same effect as calling extendMailIndex.
	 *
	 * Otherwise, it sets the current timestamp to the new one.
	 * @param time timestamp
	 */
	resizeMailIndex(time: number): Promise<void>

	deleteIndex(userId: string): Promise<void>

	cancelMailIndexing(): void
}
