import { lazyMemoized } from "../../../../platform-kit/utils"
import { EntityClient } from "../../../../platform-kit/network/EntityClient.js"
import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade"
import { ContactListTypeRef, ContactTypeRef } from "@tutao/entities/tutanota"

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

	async beforeContactDeleted(contactId: IdTuple): Promise<void> {
		await this.backend.onBeforeContactDeleted(contactId)
	}

	async afterContactDeleted(contactId: IdTuple): Promise<void> {
		await this.backend.onContactDeleted(contactId)
	}

	async afterContactCreated(contactId: IdTuple): Promise<void> {
		const contact = await this.entityClient.load(ContactTypeRef, contactId)
		await this.backend.onContactCreated(contact)
	}

	async afterContactUpdated(contactId: IdTuple): Promise<void> {
		const contact = await this.entityClient.load(ContactTypeRef, contactId)
		await this.backend.onContactUpdated(contact)
	}

	private userContactList = lazyMemoized(() => {
		const user = this.userFacade.getLoggedInUser()

		// this should not fail, since we are not an external user and are fully logged in
		return this.entityClient.loadRoot(ContactListTypeRef, user.userGroup.group)
	})
}
