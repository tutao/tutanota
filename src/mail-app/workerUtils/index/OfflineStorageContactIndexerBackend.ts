import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { Contact, ContactList, ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { EntityClient } from "../../../common/api/common/EntityClient"

export class OfflineStorageContactIndexerBackend implements ContactIndexerBackend {
	constructor(private readonly entityClient: EntityClient, private readonly persistence: OfflineStoragePersistence) {}

	async init(): Promise<void> {}

	async areContactsIndexed(_contactList: ContactList): Promise<boolean> {
		return this.persistence.areContactsIndexed()
	}

	async indexContactList(contactList: ContactList): Promise<void> {
		if (await this.persistence.areContactsIndexed()) {
			return
		}

		const allContacts = await this.entityClient.loadAll(ContactTypeRef, contactList.contacts)
		await this.persistence.storeContactData(allContacts)
		await this.persistence.setContactsIndexed(true)
	}

	async onContactCreated(contact: Contact): Promise<void> {
		await this.persistence.storeContactData([contact])
	}

	async onContactDeleted(contact: IdTuple): Promise<void> {
		await this.persistence.deleteContactData(contact)
	}

	async onContactUpdated(contact: Contact): Promise<void> {
		await this.persistence.storeContactData([contact])
	}
}
