import { ContactListTypeRef, ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { lazyMemoized, promiseMap } from "@tutao/tutanota-utils"
import { OperationType } from "../../../common/api/common/TutanotaConstants.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { EntityUpdateData } from "../../../common/api/common/utils/EntityUpdateUtils"
import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { collapseId } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import { UserFacade } from "../../../common/api/worker/facades/UserFacade"

export class ContactIndexer {
	constructor(private readonly entityClient: EntityClient, private readonly userFacade: UserFacade, private readonly backend: ContactIndexerBackend) {}

	async init() {
		await this.backend.init()
	}

	async getIndexTimestamp(): Promise<number> {
		return this.backend.getIndexTimestamp(await this.userContactList())
	}

	/**
	 * Indexes the contact list if it is not yet indexed.
	 */
	async indexFullContactList(): Promise<any> {
		await this.backend.indexContactList(await this.userContactList())
	}

	async processEntityEvents(events: readonly EntityUpdateData[], _groupId: Id, _batchId: Id): Promise<void> {
		await promiseMap(events, async (event) => {
			const contactId = collapseId(event.instanceListId, event.instanceId) as IdTuple
			if (event.operation === OperationType.CREATE) {
				const contact = await this.entityClient.load(ContactTypeRef, contactId)
				await this.backend.onContactCreated(contact)
			} else if (event.operation === OperationType.UPDATE) {
				const contact = await this.entityClient.load(ContactTypeRef, contactId)
				await this.backend.onContactUpdated(contact)
			} else if (event.operation === OperationType.DELETE) {
				await this.backend.onContactDeleted(contactId)
			}
		})
	}

	private userContactList = lazyMemoized(() => {
		const user = this.userFacade.getLoggedInUser()

		// this should not fail, since we are not an external user and are fully logged in
		return this.entityClient.loadRoot(ContactListTypeRef, user.userGroup.group)
	})
}
