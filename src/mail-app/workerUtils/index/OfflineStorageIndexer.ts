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

function TODO(message = "(empty)"): never {
	throw new Error(`FIXME: not implemented: ${message}`)
}

export class OfflineStorageIndexer implements Indexer {
	constructor(private readonly userFacade: UserFacade, private readonly persistence: OfflineStoragePersistence, private readonly mailIndexer: MailIndexer) {}

	async init() {
		const user = assertNotNull(this.userFacade.getUser())
		await this.persistence.init()

		const indexedGroups = await this.persistence.getIndexedGroups()
		const userGroups = filterIndexMemberships(user).map((membership) => membership.group)
		const removedGroups = difference(indexedGroups, userGroups)
		for (const removedGroup of removedGroups) {
			await this.persistence.removeIndexedGroup(removedGroup)
			TODO("remove group from index")
		}
		const addedGroups = difference(userGroups, indexedGroups)
		for (const addedGroup of addedGroups) {
			const membership = this.userFacade.getMembership(addedGroup)
			const groupType = assertNotNull(membership.groupType) as GroupType
			await this.persistence.addIndexedGroup(addedGroup, groupType, NOTHING_INDEXED_TIMESTAMP)
		}
		// FIXME: start indexing process for groups
	}

	async enableMailIndexing() {
		const user = assertNotNull(this.userFacade.getUser())
		await this.persistence.setMailIndexingEnabled(true)
		await this.mailIndexer.enableMailIndexing(user)
	}

	async disableMailIndexing() {
		await this.persistence.setMailIndexingEnabled(true)
		await this.mailIndexer.disableMailIndexing()
	}

	async processEntityEvents(updates: readonly EntityUpdateData[], eventOwnerGroupId: Id) {
		TODO("dispatch events, but not while indexing")
	}
}
