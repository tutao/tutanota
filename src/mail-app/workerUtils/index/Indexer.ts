import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"
import type { User } from "../../../common/api/entities/sys/TypeRefs"
import { KeyLoaderFacade } from "../../../common/api/worker/facades/KeyLoaderFacade"
import { CacheInfo } from "../../../common/api/worker/facades/LoginFacade"
import { MailIndexer } from "./MailIndexer"

export interface IndexerInitParams {
	user: User
	keyLoaderFacade: KeyLoaderFacade
	retryOnError?: boolean
	cacheInfo?: CacheInfo
}

export interface Indexer {
	init(params: IndexerInitParams): Promise<void>

	enableMailIndexing(): Promise<void>

	disableMailIndexing(): Promise<void>

	processEntityEvents(updates: readonly EntityUpdateData[], batchId: Id, groupId: Id): Promise<void>

	extendMailIndex(time: number): Promise<void>

	deleteIndex(userId: string): Promise<void>

	cancelMailIndexing(): Promise<void>
}
