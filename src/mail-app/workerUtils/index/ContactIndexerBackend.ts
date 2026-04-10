import { tutanotaTypeRefs } from "@tutao/typeRefs"

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

	indexContactList(contactList: tutanotaTypeRefs.ContactList): Promise<void>

	onContactCreated(contact: tutanotaTypeRefs.Contact): Promise<void>

	onContactUpdated(contact: tutanotaTypeRefs.Contact): Promise<void>

	onContactDeleted(contact: IdTuple): Promise<void>

	areContactsIndexed(contactList: tutanotaTypeRefs.ContactList): Promise<boolean>
}
