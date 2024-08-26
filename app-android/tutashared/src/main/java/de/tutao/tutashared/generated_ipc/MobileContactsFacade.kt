/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Contact-related funcionality on mobile.
 */
interface MobileContactsFacade {
	/**
	 * Find suggestions in the OS contact provider.
	 */
	suspend fun findSuggestions(
		query: String,
	): List<ContactSuggestion>
	/**
	 * Store one or more contacts in system's contact book
	 */
	suspend fun saveContacts(
		username: String,
		contacts: List<StructuredContact>,
	): Unit
	/**
	 * Sync all Tuta contacts with system's contact book, this operation includes Inserts, Updates and Deletions
	 */
	suspend fun syncContacts(
		username: String,
		contacts: List<StructuredContact>,
	): ContactSyncResult
	/**
	 * Get all contact books on the device.
	 */
	suspend fun getContactBooks(
	): List<ContactBook>
	/**
	 * Get all contacts in the specified contact book.
	 */
	suspend fun getContactsInContactBook(
		bookId: String,
		username: String,
	): List<StructuredContact>
	/**
	 * Delete all or a specific Tuta contact from system's contact book
	 */
	suspend fun deleteContacts(
		username: String,
		contactId: String?,
	): Unit
	/**
	 * Whether contacts can be persisted locally
	 */
	suspend fun isLocalStorageAvailable(
	): Boolean
	/**
	 * Find all contacts that match the list, returning their raw IDs.
	 */
	suspend fun findLocalMatches(
		contacts: List<StructuredContact>,
	): List<String>
	/**
	 * Erase all native contacts with the given raw IDs.
	 */
	suspend fun deleteLocalContacts(
		contacts: List<String>,
	): Unit
}
