package de.tutao.tutanota

import android.Manifest
import android.accounts.Account
import android.accounts.AccountManager
import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.content.ContentUris
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import android.provider.ContactsContract.RawContacts
import android.util.Log
import de.tutao.tutashared.contacts.AndroidAddress
import de.tutao.tutashared.contacts.AndroidContact
import de.tutao.tutashared.contacts.AndroidCustomDate
import de.tutao.tutashared.contacts.AndroidEmailAddress
import de.tutao.tutashared.contacts.AndroidPhoneNumber
import de.tutao.tutashared.contacts.AndroidRelationship
import de.tutao.tutashared.contacts.AndroidWebsite
import de.tutao.tutashared.contacts.toAndroidType
import de.tutao.tutashared.forEachRow
import de.tutao.tutashared.ipc.*
import de.tutao.tutashared.mapTo
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Created by mpfau on 4/12/17.
 */
class AndroidMobileContactsFacade(private val activity: MainActivity) : MobileContactsFacade {
	private val resolver: ContentResolver
		get() = activity.applicationContext.contentResolver

	override suspend fun findSuggestions(query: String): List<ContactSuggestion> {
		activity.getPermission(Manifest.permission.READ_CONTACTS)

		val selectionParam = "%$query%"
		val selection = "${ContactsContract.CommonDataKinds.Email.ADDRESS} LIKE ? OR ${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} LIKE ?"
		val cursor = resolver.query(ContactsContract.CommonDataKinds.Email.CONTENT_URI, PROJECTION, selection, arrayOf(selectionParam, selectionParam), "${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} ASC ")
				?: return listOf()

		return cursor.use {
			cursor.mapTo(mutableListOf()) {
				ContactSuggestion(name = cursor.getString(1), mailAddress = cursor.getString(2))
			}
		}
	}

	override suspend fun deleteContacts(username: String, contactId: String?) {
		checkContactPermissions()
		checkSyncPermission()

		retrieveRawContacts(username, contactId).use { cursor ->
			cursor?.forEachRow {
				val rawContactId = cursor.getLong(0)
				deleteRawContact(rawContactId)
			}
		}

		// No contactId means that we triggered the clear function
		if (contactId == null) {
			val account = Account(username, TUTA_ACCOUNT_TYPE)
			val accountManager = AccountManager.get(activity)
			accountManager.removeAccountExplicitly(account)
		}
	}

	// no need to check on Android - this is just for iOS
	override suspend fun isLocalStorageAvailable(): Boolean = true

	// findLocalMatches and deleteLocalContacts only matter on iOS
	override suspend fun findLocalMatches(contacts: List<StructuredContact>): List<String> {
		Log.d(TAG, "findLocalMatches() is a no-op on Android; returning empty list...")
		return listOf()
	}

	override suspend fun deleteLocalContacts(contacts: List<String>) {
		Log.w(TAG, "deleteLocalContacts() is a no-op out on Android")
	}

	override suspend fun getContactBooks(): List<ContactBook> {
		checkContactPermissions()

		return resolver.query(RawContacts.CONTENT_URI,
				arrayOf(
						RawContacts.ACCOUNT_TYPE,
						RawContacts.ACCOUNT_NAME,
				), null, null, null).use { cursor ->
			val accounts = mutableMapOf<ContactBookId, ContactBook>()
			cursor!!.forEachRow {
				val accountType = cursor.getString(0)
				val accountName = cursor.getString(1)

				val bookId = ContactBookId(accountType, accountName)

				accounts[bookId] = ContactBook(bookId.toJson(), accountName)
			}
			accounts.values.toList()
		}
	}

	private fun buildQuery(accountType: String?, accountName: String?): String {
		if (accountType == null && accountName == null) {
			return "${RawContacts.ACCOUNT_TYPE} IS NULL AND ${RawContacts.ACCOUNT_NAME} IS NULL"
		} else if (accountType == null) {
			return "${RawContacts.ACCOUNT_TYPE} IS NULL AND ${RawContacts.ACCOUNT_NAME} = ?"
		} else if (accountName == null) {
			return "${RawContacts.ACCOUNT_TYPE} = ? AND ${RawContacts.ACCOUNT_NAME} IS NULL"
		}

		return "${RawContacts.ACCOUNT_TYPE} = ? AND ${RawContacts.ACCOUNT_NAME} = ?"
	}

	override suspend fun getContactsInContactBook(bookId: String, username: String): List<StructuredContact> {
		checkContactPermissions()

		val (accountType, accountName) = ContactBookId.fromJson(bookId)
		val query = buildQuery(accountType, accountName)
		val queryValues = mutableListOf<String>()

		if (accountType != null) queryValues.add(accountType)

		if (accountName != null) queryValues.add(accountName)

		return resolver.query(RawContacts.CONTENT_URI, arrayOf(
				RawContacts._ID,
				RawContacts.SOURCE_ID,
		), query, queryValues.toTypedArray(), null).use { cursor ->
			cursor!!.mapTo(mutableListOf()) {
				val contactId = cursor.getLong(0)
				val sourceId = cursor.getString(1)
				val contact = readContact(contactId, sourceId = sourceId ?: "")
				contact.toStructured()
			}
		}
	}

	override suspend fun saveContacts(username: String, contacts: List<StructuredContact>) {
		checkContactPermissions()
		checkSyncPermission()
		val matchResult = matchStoredContacts(username, contacts, false)
		for (contact in matchResult.newServerContacts) {
			createContact(username, contact)
		}
		for ((androidContact, serverContact) in matchResult.existingServerContacts) {
			updateContact(androidContact, serverContact)
		}
		for (contact in matchResult.editedOnDevice) {
			// If the contact is on this category it HAS a rawId
			resetDirtyState(contact.rawId!!.toLong())
		}
		for (androidContact in matchResult.nativeContactWithoutSourceId) {
			updateSourceId(androidContact.rawId, androidContact.sourceId!!)
			resetDirtyState(androidContact.rawId)
		}
	}

	private fun resetDirtyState(rawId: Long) {
		val updateDirtyStateOp = ContentProviderOperation.newUpdate(RAW_CONTACT_URI).withSelection("${RawContacts._ID} = ?", arrayOf(rawId.toString())).withValue(RawContacts.DIRTY, 0).build()

		resolver.applyBatch(ContactsContract.AUTHORITY, arrayListOf(updateDirtyStateOp))
	}

	private fun updateSourceId(rawId: Long, sourceId: String) {
		val updateSourceIdOp = ContentProviderOperation.newUpdate(RawContacts.CONTENT_URI).withSelection("${RawContacts._ID} = ?", arrayOf(rawId.toString())).withValue(RawContacts.SOURCE_ID, sourceId).build()
		resolver.applyBatch(ContactsContract.AUTHORITY, arrayListOf(updateSourceIdOp))
	}

	private data class MatchContactResult(
		/** do not exist on the device yet but exists on the server */
			val newServerContacts: MutableList<StructuredContact> = mutableListOf(),
		/** exist on the device and the server and are not marked as dirty */
			val existingServerContacts: MutableList<Pair<AndroidContact, StructuredContact>> = mutableListOf(),
		/** contacts that exist on the device and on the server but we did not map them via sourceId yet */
			val nativeContactWithoutSourceId: MutableList<AndroidContact> = mutableListOf(),
		/** exists on native (and is not marked deleted or dirty) but doesn't exist on the server anymore */
			val deletedOnServer: MutableList<StructuredContact> = mutableListOf(),
		/** exist in both but are marked as dirty */
			val editedOnDevice: MutableList<StructuredContact> = mutableListOf(),
		/** exists on the device but not on the server (and marked as dirty) */
			val createdOnDevice: MutableList<StructuredContact> = mutableListOf(),
		/** exists on the server but marked as deleted (and dirty) on the device; server IDs */
			val deletedOnDevice: MutableList<String> = mutableListOf(),
	)

	private fun matchStoredContacts(username: String, serverContacts: List<StructuredContact>, isSync: Boolean): MatchContactResult {
		// Map from server contact id to the contact.
		// We remove from it as we match to find only those that are new
		val serverContactsById = serverContacts.groupBy { it.id }.mapValuesTo(mutableMapOf()) { it.value[0] }
		val result = MatchContactResult()
		retrieveRawContacts(username).use { cursor ->
			cursor!!.forEachRow {
				val rawContactId = cursor.getLong(0)
				val sourceId = cursor.getString(1)

				if (sourceId == null) {
					val serverContactWithMatchingRawId = serverContacts.find { contact -> contact.rawId == rawContactId.toString() }

					if (serverContactWithMatchingRawId?.id != null) {
						serverContactsById.remove(serverContactWithMatchingRawId.id)
						// This will be called when we process the entity event
						// after creating the contact
						result.nativeContactWithoutSourceId.add(readContact(rawContactId, serverContactWithMatchingRawId.id))
					} else {
						val newContact = readContact(rawContactId, null).toStructured()
						result.createdOnDevice.add(newContact)
					}
				} else if (serverContactsById.containsKey(sourceId)) {
					val serverContact = serverContactsById.remove(sourceId)!!
					val matchedContact = readContact(rawContactId, sourceId)
					if (matchedContact.isDirty && matchedContact.isDeleted) {
						result.deletedOnDevice.add(sourceId)
					} else if (matchedContact.isDirty) {
						result.editedOnDevice.add(matchedContact.toStructured())
					} else {
						result.existingServerContacts.add(matchedContact to serverContact)
					}
				} else if (isSync) {
					// If isn't sync, we don't care about deletedOnServer
					// Single deletions should be applied through DeleteContacts
					val unmatchedContact = readContact(rawContactId, sourceId)
					result.deletedOnServer.add(unmatchedContact.toStructured())
				}
			}
		}

		result.newServerContacts.addAll(serverContactsById.values)
		return result
	}

	override suspend fun syncContacts(username: String, contacts: List<StructuredContact>): ContactSyncResult {
		checkContactPermissions()
		checkSyncPermission()

		val matchResult = matchStoredContacts(username, contacts, true)
		for (contact in matchResult.newServerContacts) {
			createContact(username, contact)
		}
		for (contact in matchResult.deletedOnServer) {
			deleteRawContact(contact.rawId!!.toLong())
		}
		for ((androidContact, serverContact) in matchResult.existingServerContacts) {
			updateContact(androidContact, serverContact)
		}
		return ContactSyncResult(matchResult.createdOnDevice, matchResult.editedOnDevice, matchResult.deletedOnDevice)
	}

	private suspend fun checkContactPermissions() {
		activity.getPermission(Manifest.permission.READ_CONTACTS)
		activity.getPermission(Manifest.permission.WRITE_CONTACTS)
	}

	private suspend fun checkSyncPermission() {
		activity.getPermission(Manifest.permission.WRITE_SYNC_SETTINGS)
	}

	private fun deleteRawContact(rawId: Long): Int {
		val uri = ContentUris.withAppendedId(RawContacts.CONTENT_URI, rawId).buildUpon().appendQueryParameter(ContactsContract.CALLER_IS_SYNCADAPTER, "true").build()
		return resolver.delete(uri, null, null)
	}

	private fun retrieveRawContacts(username: String, sourceId: String? = null): Cursor? {
		//Check if the account exists
		val accounts = AccountManager.get(activity).getAccountsByType(TUTA_ACCOUNT_TYPE)

		// If there's no account or no account for the referred username, we create a new one
		if (accounts.isEmpty() || !accounts.any { account -> account.name == username }) {
			createSystemAccount(username)
		}

		val rawContactUri = RawContacts.CONTENT_URI.buildUpon().appendQueryParameter(RawContacts.ACCOUNT_NAME, username).appendQueryParameter(RawContacts.ACCOUNT_TYPE, TUTA_ACCOUNT_TYPE).build()

		if (sourceId != null) {
			return resolver.query(rawContactUri, arrayOf(RawContacts._ID, RawContacts.SOURCE_ID), "${RawContacts.SOURCE_ID} = ?", arrayOf(sourceId), null)
		}

		return resolver.query(rawContactUri, arrayOf(RawContacts._ID, RawContacts.SOURCE_ID), null, null, null)
	}

	private fun createSystemAccount(username: String) {
		val userAccount = Account(username, TUTA_ACCOUNT_TYPE)

		// Disable all usage of the stub sync adapter by the OS
		ContentResolver.setSyncAutomatically(userAccount, ContactsContract.AUTHORITY, false)

		val isAccountAdded = AccountManager.get(activity).addAccountExplicitly(userAccount, null, null)
		if (!isAccountAdded) {
			Log.w(TAG, "Failed to create new account?")
		}
	}

	private fun checkContactDetails(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		if (storedContact.birthday != serverContact.birthday) {
			checkContactBirthday(storedContact, ops, serverContact)
		}

		if (storedContact.company != serverContact.company || storedContact.role != serverContact.role || storedContact.department != serverContact.department) {
			checkContactCompany(storedContact, ops, serverContact)
		}

		if (storedContact.givenName != serverContact.firstName) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME, serverContact.firstName).build()
			ops += updateNameOp
		}

		if (storedContact.middleName != serverContact.middleName) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.MIDDLE_NAME, serverContact.middleName).build()
			ops += updateNameOp
		}

		if (storedContact.lastName != serverContact.lastName) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME, serverContact.lastName).build()
			ops += updateNameOp
		}

		if (storedContact.title != serverContact.title) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.PREFIX, serverContact.title).build()
			ops += updateNameOp
		}

		if (storedContact.nameSuffix != serverContact.nameSuffix) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.SUFFIX, serverContact.nameSuffix).build()
			ops += updateNameOp
		}

		if (storedContact.phoneticFirst != serverContact.phoneticFirst) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME, serverContact.phoneticFirst).build()
			ops += updateNameOp
		}

		if (storedContact.phoneticMiddle != serverContact.phoneticMiddle) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME, serverContact.phoneticMiddle).build()
			ops += updateNameOp
		}

		if (storedContact.phoneticLast != serverContact.phoneticLast) {
			val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME, serverContact.phoneticLast).build()
			ops += updateNameOp
		}

		if (storedContact.nickname != serverContact.nickname) {
			val updateNicknameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.Nickname.NAME, serverContact.nickname).build()
			ops += updateNicknameOp
		}

		if (storedContact.notes != serverContact.notes) {
			checkContactNote(storedContact, serverContact, ops)
		}
	}

	private fun checkContactBirthday(storedContact: AndroidContact, ops: ArrayList<ContentProviderOperation>, serverContact: StructuredContact) {
		// If the birthday wasn't added during contact creation, it's
		// necessary to add and not just update it
		if (storedContact.birthday == null) {
			ops.add(ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Event.START_DATE, serverContact.birthday).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Event.TYPE, ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY).build())
		} else {
			ops.add(ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.Event.TYPE, ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY).withValue(ContactsContract.CommonDataKinds.Event.START_DATE, serverContact.birthday).build())
		}
	}

	private fun checkContactNote(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		if (storedContact.notes != serverContact.notes) {
			if (storedContact.notes == "") {
				ops.add(ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Note.NOTE, serverContact.notes).build())
			} else {
				val updateNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.Note.NOTE, serverContact.notes).build()
				ops += updateNameOp
			}
		}
	}

	private fun checkContactCompany(storedContact: AndroidContact, ops: ArrayList<ContentProviderOperation>, serverContact: StructuredContact) {
		// If the company wasn't added during contact creation, it's
		// necessary to add and not just update it

		if (storedContact.company == "") {
			ops.add(ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, serverContact.company).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.TYPE, ContactsContract.CommonDataKinds.Organization.TYPE_WORK).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.DEPARTMENT, serverContact.department).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.TITLE, serverContact.role).build())
		} else {
			ops.add(ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?", arrayOf(storedContact.rawId.toString())).withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, serverContact.company).withValue(ContactsContract.CommonDataKinds.Organization.TYPE, ContactsContract.CommonDataKinds.Organization.TYPE_WORK).withValue(ContactsContract.CommonDataKinds.Organization.DEPARTMENT, serverContact.department).withValue(ContactsContract.CommonDataKinds.Organization.TITLE, serverContact.role).build())
		}
	}

	private fun checkContactMailAddresses(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverMailAddress in serverContact.mailAddresses) {
			val storedAddress = storedContact.emailAddresses.find { it.address == serverMailAddress.address }
			if (storedAddress != null) {
				if (storedAddress.type != serverMailAddress.type.toAndroidType()) {
					val updateTypeOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Email.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedAddress.address)).withValue(ContactsContract.CommonDataKinds.Email.TYPE, serverMailAddress.type.toAndroidType()).build()
					ops += updateTypeOp
				}

				if (storedAddress.customTypeName != serverMailAddress.customTypeName) {
					val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Email.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedAddress.address)).withValue(ContactsContract.CommonDataKinds.Email.LABEL, serverMailAddress.customTypeName).build()
					ops += updateCustomTypeNameOp
				}

			} else {
				// it's a new mail address
				val createEmailAddressOp = insertMailAddressOperation(serverMailAddress).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).build()
				ops += createEmailAddressOp
			}
		}
		for (storedMailAddress in storedContact.emailAddresses) {
			if (serverContact.mailAddresses.none { it.address == storedMailAddress.address }) {
				val deleteOp = ContentProviderOperation.newDelete(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Email.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedMailAddress.address)).build()
				ops += deleteOp
			}
		}
	}

	private fun checkContactAddresses(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverAddress in serverContact.addresses) {
			val storedAddress = storedContact.addresses.find { it.address == serverAddress.address }
			if (storedAddress != null) {
				if (storedAddress.type != serverAddress.type.toAndroidType()) {
					val updateTypeOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.StructuredPostal.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedAddress.address)).withValue(ContactsContract.CommonDataKinds.StructuredPostal.TYPE, serverAddress.type.toAndroidType()).build()
					ops += updateTypeOp
				}

				if (storedAddress.customTypeName != serverAddress.customTypeName) {
					val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.StructuredPostal.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedAddress.address)).withValue(ContactsContract.CommonDataKinds.StructuredPostal.LABEL, serverAddress.customTypeName).build()
					ops += updateCustomTypeNameOp
				}
			} else {
				// it's a new address
				val createAddressOp = insertAddressOperation(serverAddress).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).build()
				ops += createAddressOp
			}
		}

		for (storedAddress in storedContact.addresses) {
			if (serverContact.addresses.none { it.address == storedAddress.address }) {
				val deleteOp = ContentProviderOperation.newDelete(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.StructuredPostal.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedAddress.address)).build()
				ops += deleteOp
			}
		}
	}

	private fun checkContactPhonesNumbers(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverPhoneNumber in serverContact.phoneNumbers) {
			val storedNumber = storedContact.phoneNumbers.find { it.number == serverPhoneNumber.number }
			if (storedNumber != null) {
				if (storedNumber.type != serverPhoneNumber.type.toAndroidType()) {
					val updateTypeOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Phone.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedNumber.number)).withValue(ContactsContract.CommonDataKinds.Phone.TYPE, serverPhoneNumber.type.toAndroidType()).build()
					ops += updateTypeOp
				}
				if (storedNumber.customTypeName != serverPhoneNumber.customTypeName) {
					val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Phone.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedNumber.number)).withValue(ContactsContract.CommonDataKinds.Phone.LABEL, serverPhoneNumber.customTypeName).build()
					ops += updateCustomTypeNameOp
				}
			} else {
				// it's a new phone number
				val createEmailAddressOp = insertPhoneNumberOperations(serverPhoneNumber).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).build()
				ops += createEmailAddressOp
			}
		}

		for (storedPhoneNumber in storedContact.phoneNumbers) {
			if (serverContact.phoneNumbers.none { it.number == storedPhoneNumber.number }) {
				val deleteOp = ContentProviderOperation.newDelete(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Phone.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedPhoneNumber.number)).build()
				ops += deleteOp
			}
		}
	}

	private fun checkContactCustomDates(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverCustomDate in serverContact.customDate) {
			val storedDate = storedContact.customDate.find { it.dateIso == serverCustomDate.dateIso }
			if (storedDate != null) {
				if (storedDate.type != serverCustomDate.type.toAndroidType()) {
					val updateTypeOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Event.DATA} = ?", arrayOf(storedContact.rawId.toString(), serverCustomDate.dateIso)).withValue(ContactsContract.CommonDataKinds.Event.TYPE, serverCustomDate.type.toAndroidType()).build()
					ops += updateTypeOp
				}
				if (storedDate.customTypeName != serverCustomDate.customTypeName) {
					val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Event.DATA} = ?", arrayOf(storedContact.rawId.toString(), serverCustomDate.dateIso)).withValue(ContactsContract.CommonDataKinds.Event.LABEL, serverCustomDate.customTypeName).build()
					ops += updateCustomTypeNameOp
				}
			} else {
				// it's a new custom dte number
				val createCustomDate = insertCustomDateOperation(serverCustomDate).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).build()
				ops += createCustomDate
			}
		}

		for (storedDate in storedContact.customDate) {
			if (serverContact.customDate.none { it.dateIso == storedDate.dateIso }) {
				val deleteOp = ContentProviderOperation.newDelete(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Event.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedDate.dateIso)).build()
				ops += deleteOp
			}
		}
	}

	private fun checkContactWebsites(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverWebsite in serverContact.websites) {
			val storedWebsite = storedContact.websites.find { it.url == serverWebsite.url }
			if (storedWebsite != null) {
				if (storedWebsite.type != serverWebsite.type.toAndroidType()) {
					val updateTypeOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Website.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Website.DATA} = ?", arrayOf(storedContact.rawId.toString(), serverWebsite.url)).withValue(ContactsContract.CommonDataKinds.Website.TYPE, serverWebsite.type.toAndroidType()).build()
					ops += updateTypeOp
				}
				if (storedWebsite.customTypeName != serverWebsite.customTypeName) {
					val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Website.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Website.DATA} = ?", arrayOf(storedContact.rawId.toString(), serverWebsite.url)).withValue(ContactsContract.CommonDataKinds.Website.LABEL, serverWebsite.customTypeName).build()
					ops += updateCustomTypeNameOp
				}
			} else {
				// it's a new custom website
				val createWebsite = insertWebsite(serverWebsite).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).build()
				ops += createWebsite
			}
		}

		for (storedWebsite in storedContact.websites) {
			if (serverContact.websites.none { it.url == storedWebsite.url }) {
				val deleteOp = ContentProviderOperation.newDelete(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Website.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Website.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedWebsite.url)).build()
				ops += deleteOp
			}
		}
	}

	private fun checkContactRelationships(storedContact: AndroidContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverRelation in serverContact.relationships) {
			val storedRelation = storedContact.relationships.find { it.person == serverRelation.person }
			if (storedRelation != null) {
				if (storedRelation.type != serverRelation.type.toAndroidType()) {
					val updateTypeOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Relation.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Relation.DATA} = ?", arrayOf(storedContact.rawId.toString(), serverRelation.person)).withValue(ContactsContract.CommonDataKinds.Relation.TYPE, serverRelation.type.toAndroidType()).build()
					ops += updateTypeOp
				}
				if (storedRelation.customTypeName != serverRelation.customTypeName) {
					val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Relation.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Relation.DATA} = ?", arrayOf(storedContact.rawId.toString(), serverRelation.person)).withValue(ContactsContract.CommonDataKinds.Relation.LABEL, serverRelation.customTypeName).build()
					ops += updateCustomTypeNameOp
				}
			} else {
				// it's a new custom website
				val createRelation = insertRelation(serverRelation).withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId).build()
				ops += createRelation
			}
		}

		for (storedRelation in storedContact.relationships) {
			if (serverContact.relationships.none { it.person == storedRelation.person }) {
				val deleteOp = ContentProviderOperation.newDelete(CONTACT_DATA_URI).withSelection("${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Relation.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Relation.DATA} = ?", arrayOf(storedContact.rawId.toString(), storedRelation.person)).build()
				ops += deleteOp
			}
		}
	}

	private fun updateContact(storedContact: AndroidContact, serverContact: StructuredContact) {
		val ops = arrayListOf<ContentProviderOperation>()

		if (storedContact.isDirty) {
			resetDirtyState(storedContact.rawId)
		} else {
			Log.d(TAG, "Contact isn't dirty, continuing...")
		}

		checkContactDetails(storedContact, serverContact, ops)
		checkContactAddresses(storedContact, serverContact, ops)
		checkContactMailAddresses(storedContact, serverContact, ops)
		checkContactPhonesNumbers(storedContact, serverContact, ops)
		checkContactCustomDates(storedContact, serverContact, ops)
		checkContactWebsites(storedContact, serverContact, ops)
		checkContactRelationships(storedContact, serverContact, ops)
		if (ops.isNotEmpty()) {
			resolver.applyBatch(ContactsContract.AUTHORITY, ops)
		}
	}

	private fun createContact(userId: String, contact: StructuredContact) {
		val ops = ArrayList<ContentProviderOperation>()
		val index = 0
		ops.add(ContentProviderOperation.newInsert(RAW_CONTACT_URI).withValue(RawContacts.ACCOUNT_TYPE, TUTA_ACCOUNT_TYPE).withValue(RawContacts.ACCOUNT_NAME, userId).withValue(RawContacts.SOURCE_ID, contact.id).build())

		ops.add(ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME, contact.firstName).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.MIDDLE_NAME, contact.middleName).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME, contact.lastName).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME, contact.phoneticFirst).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME, contact.phoneticMiddle).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME, contact.phoneticLast).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.PREFIX, contact.title).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredName.SUFFIX, contact.nameSuffix).build())

		ops.add(ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Event.START_DATE, contact.birthday).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Event.TYPE, ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY).build())

		ops.add(ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, contact.company).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.DEPARTMENT, contact.department).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.TITLE, contact.role).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Organization.TYPE, ContactsContract.CommonDataKinds.Organization.TYPE_WORK).build())

		ops.add(ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Nickname.NAME, contact.nickname).build())
		for (mailAddress in contact.mailAddresses) {
			ops.add(insertMailAddressOperation(mailAddress).withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index).build())
		}

		for (phoneNumber in contact.phoneNumbers) {
			ops.add(insertPhoneNumberOperations(phoneNumber).withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index).build())
		}

		for (address in contact.addresses) {
			ops.add(insertAddressOperation(address).withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index).build())
		}

		for (customDate in contact.customDate) {
			ops.add(insertCustomDateOperation(customDate).withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index).build())
		}

		for (website in contact.websites) {
			ops.add(insertWebsite(website).withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index).build())
		}

		for (relationship in contact.relationships) {
			ops.add(insertRelation(relationship).withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index).build())
		}

		val result = resolver.applyBatch(ContactsContract.AUTHORITY, ops)
		Log.d(TAG, "Save result: $result")
	}

	private fun readContact(rawContactId: Long, sourceId: String?): AndroidContact {
		val storedContact = AndroidContact(rawContactId, sourceId)

		val entityUri = Uri.withAppendedPath(ContentUris.withAppendedId(RawContacts.CONTENT_URI, rawContactId), RawContacts.Entity.CONTENT_DIRECTORY)
		resolver.query(entityUri, arrayOf(
				RawContacts.SOURCE_ID,
				RawContacts.DELETED,
				RawContacts.Entity.DATA_ID,
				RawContacts.Entity.MIMETYPE,
				RawContacts.Entity.DATA1,
				RawContacts.Entity.DATA2,
				RawContacts.Entity.DATA3,
				RawContacts.DIRTY,
				RawContacts.Entity.DATA4,
				RawContacts.Entity.DATA5,
				RawContacts.Entity.DATA6,
				RawContacts.Entity.DATA7,
				RawContacts.Entity.DATA8,
				RawContacts.Entity.DATA9,
		), null, null, null).use { entityCursor ->
			entityCursor!!.forEachRow {
				if (entityCursor.getInt(1) == 1) {
					storedContact.isDeleted = true
				}

				if (!entityCursor.isNull(2)) {
					parseStoredContactData(entityCursor, storedContact)
				}

				if (entityCursor.getInt(7) == 1) {
					storedContact.isDirty = true
				}
			}
		}
		return storedContact
	}

	private fun parseStoredContactData(entityCursor: Cursor, storedContact: AndroidContact) {
		val mimeType = entityCursor.getNullableString(3)
		val data1 = entityCursor.getNullableString(4)

		when (mimeType) {
			ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE -> {
				storedContact.givenName = entityCursor.getNullableString(5)
				storedContact.lastName = entityCursor.getNullableString(6)
				storedContact.title = entityCursor.getNullableString(8)
				storedContact.middleName = entityCursor.getNullableString(9)
				storedContact.nameSuffix = entityCursor.getNullableString(10)
				storedContact.phoneticFirst = entityCursor.getNullableString(11)
				storedContact.phoneticMiddle = entityCursor.getNullableString(12)
				storedContact.phoneticLast = entityCursor.getNullableString(13)
			}

			ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE -> storedContact.emailAddresses.add(
				AndroidEmailAddress(data1, entityCursor.getInt(5), entityCursor.getNullableString(6))
			)
			ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> storedContact.phoneNumbers.add(
				AndroidPhoneNumber(data1, entityCursor.getInt(5), entityCursor.getNullableString(6))
			)
			ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE -> storedContact.addresses.add(
				AndroidAddress(data1, entityCursor.getInt(5), entityCursor.getNullableString(6))
			)
			ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE -> storedContact.nickname = data1 ?: ""
			ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> {
				storedContact.company = data1
				storedContact.role = entityCursor.getNullableString(8)
				storedContact.department = entityCursor.getNullableString(9)
			}

			ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE -> {
				val type = entityCursor.getInt(5)
				if (type == ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY) {
					storedContact.birthday = data1
				} else {
					storedContact.customDate.add(AndroidCustomDate(data1, type, entityCursor.getNullableString(6)))
				}
			}

			ContactsContract.CommonDataKinds.Relation.CONTENT_ITEM_TYPE -> storedContact.relationships.add(
				AndroidRelationship(data1, entityCursor.getInt(5), entityCursor.getNullableString(6))
			)
			ContactsContract.CommonDataKinds.Website.CONTENT_ITEM_TYPE -> storedContact.websites.add(AndroidWebsite(data1, entityCursor.getInt(5), entityCursor.getNullableString(6)))
			ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE -> storedContact.notes = data1 ?: ""
		}
	}

	private fun insertAddressOperation(address: StructuredAddress): ContentProviderOperation.Builder {
		val contactInsert = ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredPostal.DATA, address.address).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE).withValue(
				ContactsContract.CommonDataKinds.StructuredPostal.TYPE,
				address.type.toAndroidType(),
		)
		if (address.type == ContactAddressType.CUSTOM) {
			contactInsert.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.StructuredPostal.LABEL, address.customTypeName)
		}
		return contactInsert
	}

	private fun insertMailAddressOperation(mailAddress: StructuredMailAddress): ContentProviderOperation.Builder {

		val contactInsert = ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Email.DATA, mailAddress.address).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE).withValue(
				ContactsContract.CommonDataKinds.Email.TYPE,
				mailAddress.type.toAndroidType(),
		)
		if (mailAddress.type == ContactAddressType.CUSTOM) {
			contactInsert.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Email.LABEL, mailAddress.customTypeName)
		}
		return contactInsert
	}

	private fun insertPhoneNumberOperations(phoneNumber: StructuredPhoneNumber): ContentProviderOperation.Builder {
		val contactInsert = ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Phone.MIMETYPE).withValue(ContactsContract.CommonDataKinds.Phone.DATA, phoneNumber.number).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE).withValue(
				ContactsContract.CommonDataKinds.Phone.TYPE,
				phoneNumber.type.toAndroidType(),
		)
		if (phoneNumber.type == ContactPhoneNumberType.CUSTOM) {
			contactInsert.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Phone.LABEL, phoneNumber.customTypeName)
		}
		return contactInsert
	}

	private fun insertCustomDateOperation(customDate: StructuredCustomDate): ContentProviderOperation.Builder {
		val contactInsert = ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.MIMETYPE).withValue(ContactsContract.CommonDataKinds.Event.DATA, customDate.dateIso).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE).withValue(
				ContactsContract.CommonDataKinds.Event.TYPE,
				customDate.type.toAndroidType(),
		)
		if (customDate.type == ContactCustomDateType.CUSTOM) {
			contactInsert.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Event.LABEL, customDate.customTypeName)
		}
		return contactInsert
	}

	private fun insertWebsite(customWebsite: StructuredWebsite): ContentProviderOperation.Builder {
		val contactInsert = ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Website.MIMETYPE).withValue(ContactsContract.CommonDataKinds.Website.DATA, customWebsite.url).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Website.CONTENT_ITEM_TYPE).withValue(
				ContactsContract.CommonDataKinds.Website.TYPE,
				customWebsite.type.toAndroidType(),
		)

		if (customWebsite.type == ContactWebsiteType.CUSTOM) {
			contactInsert.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Website.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Website.LABEL, customWebsite.customTypeName)
		}
		return contactInsert
	}

	private fun insertRelation(relation: StructuredRelationship): ContentProviderOperation.Builder {
		val contactInsert = ContentProviderOperation.newInsert(CONTACT_DATA_URI).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Relation.MIMETYPE).withValue(ContactsContract.CommonDataKinds.Relation.DATA, relation.person).withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Relation.CONTENT_ITEM_TYPE).withValue(
				ContactsContract.CommonDataKinds.Relation.TYPE,
				relation.type.toAndroidType(),
		)

		if (relation.type == ContactRelationshipType.CUSTOM) {
			contactInsert.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Relation.CONTENT_ITEM_TYPE).withValue(ContactsContract.CommonDataKinds.Relation.LABEL, relation.customTypeName)
		}
		return contactInsert
	}


	companion object {
		private val PROJECTION = arrayOf(ContactsContract.Contacts._ID, ContactsContract.Contacts.DISPLAY_NAME_PRIMARY, ContactsContract.CommonDataKinds.Email.ADDRESS)
		const val TAG = "Contact"
		private const val TUTA_ACCOUNT_TYPE = BuildConfig.APPLICATION_ID
		private val RAW_CONTACT_URI = RawContacts.CONTENT_URI.buildUpon().appendQueryParameter(ContactsContract.CALLER_IS_SYNCADAPTER, "true").build()
		private val CONTACT_DATA_URI = ContactsContract.Data.CONTENT_URI.buildUpon().appendQueryParameter(ContactsContract.CALLER_IS_SYNCADAPTER, "true").build()
	}

	private data class SaveContactsResult(val cleanContacts: Map<String, AndroidContact>, val dirtyContacts: List<StructuredContact>)

	private fun Cursor.getNullableString(index: Int): String {
		if (this.isNull(index)) {
			return ""
		}

		return this.getString(index)
	}
}


/**
 * Android doesn't really have a unique id for account so we use account type and name as a unique id.
 * We serialize it as JSON because both fields can have arbitrary values in them and we don't want to deal with
 * escaping.
 */
@Serializable
private data class ContactBookId(val accountType: String?, val accountName: String?) {
	fun toJson() = Json.encodeToString(this)

	companion object {
		fun fromJson(jsonString: String): ContactBookId = Json.decodeFromString(jsonString)
	}
}