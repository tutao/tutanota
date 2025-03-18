// FIXME: this file is a clean room, top-down sketch of what a top-level of offline-based
//   indexer would look like.

import { UserFacade } from "../../../common/api/worker/facades/UserFacade"
import { MailIndexer } from "./MailIndexer"
import { assertNotNull, difference } from "@tutao/tutanota-utils"
import { filterIndexMemberships } from "../../../common/api/worker/search/IndexUtils"
import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"

function TODO(message = "(empty)"): never {
	throw new Error(`FIXME: not implemented: ${message}`)
}

class OfflineStoragePersistence {
	isMailIndexingEnabled(): Promise<boolean> {
		TODO()
	}

	setMailIndexingEnabled(enabled: boolean): Promise<void> {
		TODO()
	}

	getIndexedGroups(): Promise<readonly Id[]> {
		TODO()
	}

	addIndexedGroup(id: Id): Promise<void> {
		TODO()
	}

	removeIndexedGroup(id: Id): Promise<void> {
		TODO()
	}
}

class OfflineStorageIndexer {
	constructor(private readonly userFacade: UserFacade, private readonly persistence: OfflineStoragePersistence, private readonly mailIndexer: MailIndexer) {}

	async init() {
		const user = assertNotNull(this.userFacade.getUser())
		const indexedGroups = await this.persistence.getIndexedGroups()
		const userGroups = filterIndexMemberships(user).map((membership) => membership.group)
		const removedGroups = difference(indexedGroups, userGroups)
		for (const removedGroup of removedGroups) {
			TODO("remove group from index")
		}
		const addedGroups = difference(userGroups, indexedGroups)
		for (const addedGroup of addedGroups) {
			TODO("init index for this group")
		}
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

	processEntityEvents(updates: readonly EntityUpdateData[], eventOwnerGroupId: Id) {
		TODO("dispatch events, but not while indexing")
	}
}
