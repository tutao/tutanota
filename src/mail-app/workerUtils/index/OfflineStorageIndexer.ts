import { UserFacade } from "../../../common/api/worker/facades/UserFacade"
import { MailIndexer } from "./MailIndexer"
import { assertNotNull, difference, noOp, ofClass } from "@tutao/tutanota-utils"
import { filterIndexMemberships } from "../../../common/api/worker/search/IndexUtils"
import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"
import { GroupType, NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { Indexer } from "./Indexer"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler"
import { ContactIndexer } from "./ContactIndexer"
import { CancelledError } from "../../../common/api/common/error/CancelledError"

export class OfflineStorageIndexer implements Indexer {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly persistence: OfflineStoragePersistence,
		private readonly mailIndexer: MailIndexer,
		private readonly infoMessageHandler: InfoMessageHandler,
		private readonly contactIndexer: ContactIndexer,
	) {}

	async init() {
		const user = assertNotNull(this.userFacade.getUser())
		await this.persistence.init()
		await this.mailIndexer.init(user)

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

		// Added mail groups will be indexed when extendMailIndex() will be called later

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

	async enableMailIndexing() {
		const user = assertNotNull(this.userFacade.getUser(), "enableMailIndexing user")
		await this.mailIndexer.enableMailIndexing()
		this.mailIndexer.doInitialMailIndexing(user).catch(ofClass(CancelledError, noOp))
	}

	async disableMailIndexing() {
		await this.mailIndexer.disableMailIndexing()
	}

	async processEntityEvents(updates: readonly EntityUpdateData[], batchId: Id, groupId: Id) {
		// FIXME: dispatch events, but not while indexing
		await this.mailIndexer.processEntityEvents(updates, groupId, batchId)
		await this.contactIndexer.processEntityEvents(updates, groupId, batchId)
	}

	async extendMailIndex(time: number) {
		await this.mailIndexer.indexMailboxes(assertNotNull(this.userFacade.getUser(), "extendMailIndex user"), time)
	}

	async deleteIndex(userId: string) {
		/* no-op */
	}

	cancelMailIndexing() {
		this.mailIndexer.cancelMailIndexing()
	}
}
