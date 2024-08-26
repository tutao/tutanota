package de.tutao.calendar

import android.Manifest
import android.content.ContentResolver
import android.provider.ContactsContract
import de.tutao.tutashared.ipc.ContactBook
import de.tutao.tutashared.ipc.ContactSuggestion
import de.tutao.tutashared.ipc.ContactSyncResult
import de.tutao.tutashared.ipc.MobileContactsFacade
import de.tutao.tutashared.ipc.StructuredContact
import de.tutao.tutashared.mapTo

class AndroidMobileContactsFacade(private val activity: MainActivity) : MobileContactsFacade {
	private val resolver: ContentResolver
		get() = activity.applicationContext.contentResolver

	override suspend fun findSuggestions(query: String): List<ContactSuggestion> {
		activity.getPermission(Manifest.permission.READ_CONTACTS)

		val selectionParam = "%$query%"
		val selection =
			"${ContactsContract.CommonDataKinds.Email.ADDRESS} LIKE ? OR ${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} LIKE ?"
		val cursor = resolver.query(
			ContactsContract.CommonDataKinds.Email.CONTENT_URI,
			PROJECTION,
			selection,
			arrayOf(selectionParam, selectionParam),
			"${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} ASC "
		)
			?: return listOf()

		return cursor.use {
			cursor.mapTo(mutableListOf()) {
				ContactSuggestion(name = cursor.getString(1), mailAddress = cursor.getString(2))
			}
		}
	}

	override suspend fun saveContacts(username: String, contacts: List<StructuredContact>) {
		throw Exception("Save contact isn't available on Calendar app")
	}

	override suspend fun syncContacts(username: String, contacts: List<StructuredContact>): ContactSyncResult {
		throw Exception("syncContacts isn't available on Calendar app")
	}

	override suspend fun getContactBooks(): List<ContactBook> {
		throw Exception("Contact book listing isn't available on Calendar app")
	}

	override suspend fun getContactsInContactBook(bookId: String, username: String): List<StructuredContact> {
		throw Exception("Contact book reading isn't available on Calendar app")
	}

	override suspend fun deleteContacts(username: String, contactId: String?) {
		throw Exception("Contact deletion isn't available on Calendar app")
	}

	// no need to check on Android - this is just for iOS
	override suspend fun isLocalStorageAvailable(): Boolean {
		throw Exception("Contact sync isn't available on Calendar app")
	}

	override suspend fun findLocalMatches(contacts: List<StructuredContact>): List<String> {
		throw Exception("Contact sync isn't available on Calendar app")
	}

	override suspend fun deleteLocalContacts(contacts: List<String>) {
		throw Exception("Contact sync isn't available on Calendar app")
	}

	companion object {
		private val PROJECTION = arrayOf(
			ContactsContract.Contacts._ID, ContactsContract.Contacts.DISPLAY_NAME_PRIMARY,
			ContactsContract.CommonDataKinds.Email.ADDRESS
		)
		const val TAG = "Contact"
	}
}