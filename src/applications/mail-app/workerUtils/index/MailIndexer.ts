import { User } from "@tutao/entities/sys"
import { EntityUpdateData } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

export interface MailIndexer {
	readonly currentIndexTimestamp: number
	readonly mailIndexingEnabled: boolean
	readonly mailboxIndexingPromise: Promise<void>

	init(user: User): Promise<void>
	enableMailIndexing(): Promise<boolean>
	cancelMailIndexing(): void
	doInitialMailIndexing(user: User): Promise<void>
	indexMailboxes(user: User, oldestTimestamp: number): Promise<void>
	extendIndexIfNeeded(user: User, newOldestTimestamp: number): Promise<void>
	resizeMailIndex(user: User, newTimestamp: number): Promise<void>
	updateCurrentIndexTimestamp(user: User): Promise<void>
	processEntityEvents(events: readonly EntityUpdateData[], groupId: Id, batchId: Id): Promise<void>
	beforeMailDeleted(mailid: IdTuple): Promise<void>
	afterMailDeleted(mailid: IdTuple): Promise<void>
	afterMailCreated(mailid: IdTuple): Promise<void>
	afterMailUpdated(mailid: IdTuple): Promise<void>
	rebuildIndex(user: User): Promise<void>
}
