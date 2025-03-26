import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { Contact, ContactList } from "../../../common/api/entities/tutanota/TypeRefs"

// FIXME
export class OfflineStorageContactIndexerBackend implements ContactIndexerBackend {
	async init(): Promise<void> {
		return Promise.resolve(undefined)
	}

	async getIndexTimestamp(contactList: ContactList): Promise<number | null> {
		return null
	}

	async indexContactList(contactList: ContactList): Promise<void> {
		return Promise.resolve(undefined)
	}

	async onContactCreated(contact: Contact): Promise<void> {
		return Promise.resolve(undefined)
	}

	async onContactDeleted(contact: IdTuple): Promise<void> {
		return Promise.resolve(undefined)
	}

	async onContactUpdated(contact: Contact): Promise<void> {
		return Promise.resolve(undefined)
	}
}
