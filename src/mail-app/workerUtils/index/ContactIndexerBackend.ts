import { Contact, ContactList } from "../../../common/api/entities/tutanota/TypeRefs"

/**
 * Indexer backend for the contact list on the user.
 *
 * Each User group only has one ContactList.
 *
 * This is not to be confused with ContactList groups which do not have actual, full contacts but rather ContactListEntry
 * instances.
 */
export interface ContactIndexerBackend {
	init(): Promise<void>

	indexContactList(contactList: ContactList): Promise<void>

	onContactCreated(contact: Contact): Promise<void>

	onContactUpdated(contact: Contact): Promise<void>

	onContactDeleted(contact: IdTuple): Promise<void>

	getIndexTimestamp(contactList: ContactList): Promise<number>
}
