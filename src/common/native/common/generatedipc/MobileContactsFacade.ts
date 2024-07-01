/* generated file, don't edit. */

import { ContactSuggestion } from "./ContactSuggestion.js"
import { StructuredContact } from "./StructuredContact.js"
import { ContactSyncResult } from "./ContactSyncResult.js"
import { ContactBook } from "./ContactBook.js"
/**
 * Contact-related funcionality on mobile.
 */
export interface MobileContactsFacade {
	/**
	 * Find suggestions in the OS contact provider.
	 */
	findSuggestions(query: string): Promise<ReadonlyArray<ContactSuggestion>>

	/**
	 * Store one or more contacts in system's contact book
	 */
	saveContacts(username: string, contacts: ReadonlyArray<StructuredContact>): Promise<void>

	/**
	 * Sync all Tuta contacts with system's contact book, this operation includes Inserts, Updates and Deletions
	 */
	syncContacts(username: string, contacts: ReadonlyArray<StructuredContact>): Promise<ContactSyncResult>

	/**
	 * Get all contact books on the device.
	 */
	getContactBooks(): Promise<ReadonlyArray<ContactBook>>

	/**
	 * Get all contacts in the specified contact book.
	 */
	getContactsInContactBook(bookId: string, username: string): Promise<ReadonlyArray<StructuredContact>>

	/**
	 * Delete all or a specific Tuta contact from system's contact book
	 */
	deleteContacts(username: string, contactId: string | null): Promise<void>
}
