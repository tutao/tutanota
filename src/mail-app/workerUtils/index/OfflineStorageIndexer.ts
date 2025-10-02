import { UserFacade } from "../../../common/api/worker/facades/UserFacade"
import { MailIndexer } from "./MailIndexer"
import { assertNotNull, difference } from "@tutao/tutanota-utils"
import { filterIndexMemberships } from "../../../common/api/common/utils/IndexUtils"
import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"
import { GroupType, NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { Indexer } from "./Indexer"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler"
import { ContactIndexer } from "./ContactIndexer"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

export class OfflineStorageIndexer implements Indexer {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly persistence: OfflineStoragePersistence,
		private readonly mailIndexer: MailIndexer,
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly contactIndexer: ContactIndexer,
	) {}

	async partialLoginInit() {
		const user = assertNotNull(this.userFacade.getUser())
		await this.mailIndexer.init(user)
		await this.mailIndexer.enableMailIndexing()

		await this.infoMessageHandler.onSearchIndexStateUpdate({
			initializing: false,
			mailIndexEnabled: this.mailIndexer.mailIndexingEnabled,
			progress: 0,
			currentMailIndexTimestamp: this.mailIndexer.currentIndexTimestamp,
			aimedMailIndexTimestamp: this.mailIndexer.currentIndexTimestamp,
			indexedMailCount: 0,
			failedIndexingUpTo: null,
		})
	}

	async fullLoginInit(): Promise<void> {
		const user = assertNotNull(this.userFacade.getUser())
		// Added mail groups will be indexed when extendMailIndex() will be called later
		const indexedGroups = (await this.persistence.getIndexedGroups()).map((data) => data.groupId)
		const userGroups = filterIndexMemberships(user).map((membership) => membership.group)
		const removedGroups = difference(indexedGroups, userGroups)
		for (const removedGroup of removedGroups) {
			await this.persistence.removeIndexedGroup(removedGroup)
		}
		const addedGroups = difference(userGroups, indexedGroups)
		for (const addedGroup of addedGroups) {
			const membership = this.userFacade.getMembership(addedGroup)
			const groupType = assertNotNull(membership.groupType) as GroupType
			await this.persistence.addIndexedGroup(addedGroup, groupType, NOTHING_INDEXED_TIMESTAMP)
		}

		await this.contactIndexer.indexFullContactList()
	}

	async enableMailIndexing() {
		// no-op, mail indexing is always enabled for sqlite search
	}

	async disableMailIndexing() {
		throw new ProgrammingError("Operation not supported for sqlite search index")
	}

	async processEntityEvents(updates: readonly EntityUpdateData[], batchId: Id, groupId: Id) {
		await this.mailIndexer.processEntityEvents(updates, groupId, batchId)
		await this.contactIndexer.processEntityEvents(updates, groupId, batchId)
	}

	async extendMailIndex(time: number) {
		await this.mailIndexer.indexMailboxes(assertNotNull(this.userFacade.getUser(), "extendMailIndex user"), time)
	}

	async resizeMailIndex(time: number): Promise<void> {
		await this.mailIndexer.resizeMailIndex(assertNotNull(this.userFacade.getUser(), "resizeMailIndex user"), time)
	}

	async deleteIndex(userId: string) {
		/* no-op */
	}

	cancelMailIndexing() {
		this.mailIndexer.cancelMailIndexing()
	}
}
