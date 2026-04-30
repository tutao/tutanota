package de.tutao.drive

import de.tutao.tutashared.ipc.ContactBook
import de.tutao.tutashared.ipc.ContactSuggestion
import de.tutao.tutashared.ipc.ContactSyncResult
import de.tutao.tutashared.ipc.MobileContactsFacade
import de.tutao.tutashared.ipc.StructuredContact

object AndroidMobileContactsFacadeStub : MobileContactsFacade {
	override suspend fun findSuggestions(query: String): List<ContactSuggestion> {
		TODO("Not yet implemented")
	}

	override suspend fun saveContacts(username: String, contacts: List<StructuredContact>) {
		TODO("Not yet implemented")
	}

	override suspend fun syncContacts(username: String, contacts: List<StructuredContact>): ContactSyncResult {
		TODO("Not yet implemented")
	}

	override suspend fun getContactBooks(): List<ContactBook> {
		TODO("Not yet implemented")
	}

	override suspend fun getContactsInContactBook(bookId: String, username: String): List<StructuredContact> {
		TODO("Not yet implemented")
	}

	override suspend fun deleteContacts(username: String, contactId: String?) {
		TODO("Not yet implemented")
	}

	override suspend fun isLocalStorageAvailable(): Boolean {
		TODO("Not yet implemented")
	}

	override suspend fun findLocalMatches(contacts: List<StructuredContact>): List<String> {
		TODO("Not yet implemented")
	}

	override suspend fun deleteLocalContacts(contacts: List<String>) {
		TODO("Not yet implemented")
	}
}