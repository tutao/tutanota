// FIXME: this file is a clean room, top-down sketch of what a top-level of offline-based
//   indexer would look like.

import { UserFacade } from "../../../common/api/worker/facades/UserFacade"
import { MailIndexer } from "./MailIndexer"
import { assertNotNull, difference } from "@tutao/tutanota-utils"
import { filterIndexMemberships } from "../../../common/api/worker/search/IndexUtils"
import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"
import { GroupType, NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { Indexer } from "./Indexer"
import { InfoMessageHandler } from "../../../common/gui/InfoMessageHandler"

function TODO(message = "(empty)"): never {
	throw new Error(`FIXME: not implemented: ${message}`)
}

export class OfflineStorageIndexer implements Indexer {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly persistence: OfflineStoragePersistence,
		private readonly mailIndexer: MailIndexer,
		private readonly infoMessageHandler: InfoMessageHandler,
	) {}

	async init() {
		const user = assertNotNull(this.userFacade.getUser())
		await this.persistence.init()
		await this.mailIndexer.init(user._id)

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
		// Added mail groups will be indexed when extendMailIndex() will be called later

		// FIXME: start indexing process for non-mail groups

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
		const user = assertNotNull(this.userFacade.getUser())
		await this.mailIndexer.enableMailIndexing(user)
	}

	async disableMailIndexing() {
		await this.mailIndexer.disableMailIndexing()
	}

	async processEntityEvents(updates: readonly EntityUpdateData[], batchId: Id, groupId: Id) {
		// FIXME: dispatch events, but not while indexing
		await this.mailIndexer.processEntityEvents(updates, groupId, batchId)
		// FIXME: contact indexer
	}

	async extendMailIndex(time: number) {
		TODO("extendMailIndex")
	}

	async deleteIndex(userId: string) {
		// FIXME: do we need to do anything?
	}

	async cancelMailIndexing() {
		TODO("cancelMailIndexing")
	}
}
