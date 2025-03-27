import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { Contact, ContactList } from "../../../common/api/entities/tutanota/TypeRefs"
import { OfflineStoragePersistence } from "./OfflineStoragePersistence"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

export class OfflineStorageContactIndexerBackend implements ContactIndexerBackend {
	constructor(private readonly persistence: OfflineStoragePersistence) {}

	async init(): Promise<void> {
		return Promise.resolve(undefined)
	}

	async getIndexTimestamp(contactList: ContactList): Promise<number> {
		// FIXME
		throw new ProgrammingError("TODO: getIndexTimestamp")
	}

	async indexContactList(contactList: ContactList): Promise<void> {
		// FIXME
		throw new ProgrammingError("TODO: getIndexTimestamp")
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
