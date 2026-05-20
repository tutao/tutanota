import { collapseId, OperationType } from "../../../../platform-kit/meta"
import { lazyMemoized } from "../../../../platform-kit/utils"
import { EntityClient } from "../../../../platform-kit/network/EntityClient.js"
import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade"
import { ContactListTypeRef, ContactTypeRef } from "@tutao/entities/tutanota"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

export class ContactIndexer {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly userFacade: UserFacade,
		private readonly backend: ContactIndexerBackend,
	) {}

	async init() {
		await this.backend.init()
	}

	async areContactsIndexed(): Promise<boolean> {
		return this.backend.areContactsIndexed(await this.userContactList())
	}

	/**
	 * Indexes the contact list if it is not yet indexed.
	 */
	async indexFullContactList(): Promise<void> {
		await this.backend.indexContactList(await this.userContactList())
	}

	async processEntityEvents(events: readonly EntityUpdateData[], _groupId: Id, _batchId: Id): Promise<void> {
		for (const event of events) {
			if (!isUpdateForTypeRef(ContactTypeRef, event)) {
				continue
			}
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
		}
	}

	private userContactList = lazyMemoized(() => {
		const user = this.userFacade.getLoggedInUser()

		// this should not fail, since we are not an external user and are fully logged in
		return this.entityClient.loadRoot(ContactListTypeRef, user.userGroup.group)
	})
}
