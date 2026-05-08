package de.tutao.drive

import de.tutao.tutashared.ipc.ContactBook
import de.tutao.tutashared.ipc.ContactSuggestion
import de.tutao.tutashared.ipc.ContactSyncResult
import de.tutao.tutashared.ipc.MobileContactsFacade
import de.tutao.tutashared.ipc.StructuredContact

object AndroidMobileContactsFacadeStub : MobileContactsFacade {
	override suspend fun findSuggestions(query: String): List<ContactSuggestion> {
		throw NotImplementedError()
	}

	override suspend fun saveContacts(username: String, contacts: List<StructuredContact>) {
		throw NotImplementedError()
	}

	override suspend fun syncContacts(username: String, contacts: List<StructuredContact>): ContactSyncResult {
		throw NotImplementedError()
	}

	override suspend fun getContactBooks(): List<ContactBook> {
		throw NotImplementedError()
	}

	override suspend fun getContactsInContactBook(bookId: String, username: String): List<StructuredContact> {
		throw NotImplementedError()
	}

	override suspend fun deleteContacts(username: String, contactId: String?) {
		throw NotImplementedError()
	}

	override suspend fun isLocalStorageAvailable(): Boolean {
		throw NotImplementedError()
	}

	override suspend fun findLocalMatches(contacts: List<StructuredContact>): List<String> {
		throw NotImplementedError()
	}

	override suspend fun deleteLocalContacts(contacts: List<String>) {
		throw NotImplementedError()
	}
}