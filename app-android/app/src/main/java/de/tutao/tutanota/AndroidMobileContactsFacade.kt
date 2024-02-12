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
import de.tutao.tutanota.contacts.*
import de.tutao.tutanota.contacts.ContactAddressType
import de.tutao.tutanota.contacts.ContactPhoneNumberType
import de.tutao.tutanota.ipc.*
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
	val selection =
	  "${ContactsContract.CommonDataKinds.Email.ADDRESS} LIKE ? OR ${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} LIKE ?"
	val cursor = resolver.query(
	  ContactsContract.CommonDataKinds.Email.CONTENT_URI,
	  PROJECTION,
	  selection,
	  arrayOf(selectionParam, selectionParam),
	  "${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} ASC "
	) ?: return listOf()

	return cursor.use {
	  cursor.mapTo(mutableListOf()) {
		ContactSuggestion(
		  name = cursor.getString(1),
		  mailAddress = cursor.getString(2)
		)
	  }
	}
  }

  override suspend fun deleteContacts(username: String, contactId: String?) {
	checkContactPermissions()

	retrieveRawContacts(username, contactId).use { cursor ->
	  cursor?.forEachRow {
		val rawContactId = cursor.getLong(0)
		val sourceId = cursor.getString(1)
		deleteRawContact(AndroidContact(rawContactId, sourceId))
	  }
	}

	// No contactId means that we triggered the clear function
	if (contactId == null) {
	  val account = Account(username, TUTA_ACCOUNT_TYPE)
	  val accountManager = AccountManager.get(activity)
	  accountManager.removeAccountExplicitly(account)
	}
  }

  override suspend fun getContactBooks(): List<ContactBook> {
	checkContactPermissions()

	return resolver.query(
	  RawContacts.CONTENT_URI, arrayOf(
		RawContacts.ACCOUNT_TYPE,
		RawContacts.ACCOUNT_NAME
	  ), null, null, null
	).use { cursor ->
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

  override suspend fun getContactsInContactBook(bookId: String): List<StructuredContact> {
	checkContactPermissions()

	val (accountType, accountName) = ContactBookId.fromJson(bookId)
	return resolver.query(
	  RawContacts.CONTENT_URI, arrayOf(
		RawContacts._ID,
		RawContacts.SOURCE_ID,
	  ), "${RawContacts.ACCOUNT_TYPE} = ? AND ${RawContacts.ACCOUNT_NAME} = ?", arrayOf(accountType, accountName), null
	).use { cursor ->
	  cursor!!.mapTo(mutableListOf()) {
		val contactId = cursor.getLong(0)
		val sourceId = cursor.getString(1)
		val contact = readContact(contactId, sourceId = sourceId ?: "")
		StructuredContact(
		  id = contactId.toString(),
		  firstName = contact.givenName ?: "",
		  lastName = contact.lastName ?: "",
		  nickname = contact.nickname,
		  company = contact.company,
		  birthday = contact.birthday,
		  mailAddresses = contact.emailAddresses.map { it.toStructured() },
		  phoneNumbers = contact.phoneNumbers.map { it.toStructured() },
		  addresses = contact.addresses.map { it.toStructured() }
		)
	  }
	}
  }

  override suspend fun saveContacts(username: String, contacts: List<StructuredContact>) {
	checkContactPermissions()
	readAndStoreContacts(username, contacts)
  }

  private fun readAndStoreContacts(username: String, contacts: List<StructuredContact>): Map<String, AndroidContact> {
	/** map from sourceId to id */
	val alreadyStoredContacts = mutableMapOf<String, AndroidContact>()

	retrieveRawContacts(username).use { cursor ->
	  cursor!!.forEachRow {
		val rawContactId = cursor.getLong(0)
		val sourceId = cursor.getString(1)

		if (sourceId == null) {
		  Log.d(TAG, "invalid contact $rawContactId - no source Id")
		} else {
		  val storedContact = readContact(rawContactId, sourceId)
		  alreadyStoredContacts[storedContact.sourceId] = storedContact
		}
	  }
	}

	Log.d(TAG, "already stored contacts: ${alreadyStoredContacts.size}")

	for (contact in contacts) {
	  if (alreadyStoredContacts.contains(contact.id)) {
		Log.d(TAG, "Already has contact ${contact.id}")
		continue
	  }
	  Log.d(TAG, "Inserting contact ${contact.id}")

	  createContact(username, contact)
	}

	val serverContactsById = contacts.groupBy { it.id }.mapValues { it.value[0] }
	for ((storedContactId, storedContact) in alreadyStoredContacts) {
	  val serverContact = serverContactsById[storedContactId]
	  if (serverContact != null) {
		updateContact(storedContact, serverContact)
	  }
	}

	return alreadyStoredContacts
  }

  override suspend fun syncContacts(username: String, contacts: List<StructuredContact>) {
	checkContactPermissions()

	/** map from sourceId to id */
	val alreadyStoredContacts = readAndStoreContacts(username, contacts)

	val serverContactsById = contacts.groupBy { it.id }.mapValues { it.value[0] }
	for ((storedContactId, storedContact) in alreadyStoredContacts) {
	  val serverContact = serverContactsById[storedContactId]
	  if (serverContact == null) {
		deleteRawContact(storedContact)
		Log.d(TAG, "Deleted contact with raw id ${storedContact.rawId}")
	  }
	}

	Log.d(TAG, "Contact synchronization ended")
  }

  private suspend fun checkContactPermissions() {
	activity.getPermission(Manifest.permission.READ_CONTACTS)
	activity.getPermission(Manifest.permission.WRITE_CONTACTS)
  }

  private fun deleteRawContact(storedContact: AndroidContact): Int {
	val uri = ContentUris.withAppendedId(RawContacts.CONTENT_URI, storedContact.rawId).buildUpon()
	  .appendQueryParameter(ContactsContract.CALLER_IS_SYNCADAPTER, "true").build()
	return resolver.delete(uri, null, null)
  }

  private fun retrieveRawContacts(username: String, sourceId: String? = null): Cursor? {
	//Check if the account exists
	val accounts = AccountManager.get(activity).getAccountsByType(TUTA_ACCOUNT_TYPE)

	// If there's no account or no account for the referred username, we create a new one
	if (accounts.isEmpty() || !accounts.any { account -> account.name == username }) {
	  createSystemAccount(username)
	}

	val rawContactUri = RawContacts.CONTENT_URI.buildUpon()
	  .appendQueryParameter(RawContacts.ACCOUNT_NAME, username)
	  .appendQueryParameter(RawContacts.ACCOUNT_TYPE, TUTA_ACCOUNT_TYPE)
	  .build()

	if (sourceId != null) {
	  return resolver.query(
		rawContactUri,
		arrayOf(
		  RawContacts._ID,
		  RawContacts.SOURCE_ID
		), "${RawContacts.SOURCE_ID} = ?", arrayOf(sourceId), null
	  )
	}

	return resolver.query(
	  rawContactUri,
	  arrayOf(
		RawContacts._ID,
		RawContacts.SOURCE_ID
	  ), null, null, null
	)
  }

  private fun createSystemAccount(username: String) {
	val userAccount = Account(username, TUTA_ACCOUNT_TYPE)
	val isAccountAdded = AccountManager.get(activity).addAccountExplicitly(userAccount, null, null)
	if (!isAccountAdded) {
	  Log.w(TAG, "Failed to create new account?")
	}
  }

  private fun checkDeletedContact(storedContact: AndroidContact, ops: ArrayList<ContentProviderOperation>) {
	if (storedContact.isDeleted) {
	  val updateDeletedStatusOp = ContentProviderOperation.newUpdate(RawContacts.CONTENT_URI)
		.withSelection("${RawContacts._ID} = ?", arrayOf(storedContact.rawId.toString()))
		.withValue(RawContacts.DELETED, 0)
		.build()
	  ops += updateDeletedStatusOp
	} else {
	  Log.d(TAG, "Contact isn't deleted, continuing...")
	}
  }

  private fun checkContactDetails(
	storedContact: AndroidContact,
	serverContact: StructuredContact,
	ops: ArrayList<ContentProviderOperation>
  ) {
	if (storedContact.birthday != serverContact.birthday) {
	  checkContactBirthday(storedContact, ops, serverContact)
	}

	if (storedContact.company != serverContact.company) {
	  checkContactCompany(storedContact, ops, serverContact)
	}

	if (storedContact.givenName != serverContact.firstName) {
	  val updateNameOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
		.withSelection(
		  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
		  arrayOf(storedContact.rawId.toString())
		)
		.withValue(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME, serverContact.firstName)
		.build()
	  ops += updateNameOp
	}

	if (storedContact.lastName != serverContact.lastName) {
	  val updateNameOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
		.withSelection(
		  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
		  arrayOf(storedContact.rawId.toString())
		)
		.withValue(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME, serverContact.lastName)
		.build()
	  ops += updateNameOp
	}

	if (storedContact.nickname != serverContact.nickname) {
	  val updateNicknameOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
		.withSelection(
		  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
		  arrayOf(storedContact.rawId.toString())
		)
		.withValue(ContactsContract.CommonDataKinds.Nickname.NAME, serverContact.nickname)
		.build()
	  ops += updateNicknameOp
	}
  }

  private fun checkContactBirthday(
	storedContact: AndroidContact,
	ops: ArrayList<ContentProviderOperation>,
	serverContact: StructuredContact
  ) {
	// If the birthday wasn't added during contact creation, it's
	// necessary to add and not just update it
	if (storedContact.birthday == null) {
	  ops.add(
		ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
		  .withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
		  .withValue(
			RawContacts.Data.MIMETYPE,
			ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE
		  )
		  .withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE)
		  .withValue(ContactsContract.CommonDataKinds.Event.START_DATE, serverContact.birthday)
		  .withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE)
		  .withValue(ContactsContract.CommonDataKinds.Event.TYPE, ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY)
		  .build()
	  )
	} else {
	  ops.add(
		ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
		  .withSelection(
			"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
			arrayOf(storedContact.rawId.toString())
		  )
		  .withValue(ContactsContract.CommonDataKinds.Event.TYPE, ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY)
		  .withValue(ContactsContract.CommonDataKinds.Event.START_DATE, serverContact.birthday)
		  .build()
	  )
	}
  }

  private fun checkContactCompany(
	storedContact: AndroidContact,
	ops: ArrayList<ContentProviderOperation>,
	serverContact: StructuredContact
  ) {
	// If the company wasn't added during contact creation, it's
	// necessary to add and not just update it

	if (storedContact.company == "") {
	  ops.add(
		ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
		  .withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
		  .withValue(
			RawContacts.Data.MIMETYPE,
			ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE
		  )
		  .withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, serverContact.company)
		  .withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
		  .withValue(
			ContactsContract.CommonDataKinds.Organization.TYPE,
			ContactsContract.CommonDataKinds.Organization.TYPE_WORK
		  )
		  .build()
	  )
	} else {
	  ops.add(
		ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
		  .withSelection(
			"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
			arrayOf(storedContact.rawId.toString())
		  )
		  .withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, serverContact.company)
		  .build()
	  )
	}
  }

  private fun checkContactMailAddresses(
	storedContact: AndroidContact,
	serverContact: StructuredContact,
	ops: ArrayList<ContentProviderOperation>
  ) {
	for (serverMailAddress in serverContact.mailAddresses) {
	  val storedAddress = storedContact.emailAddresses.find { it.address == serverMailAddress.address }
	  if (storedAddress != null) {
		if (storedAddress.type != serverMailAddress.type.toAndroidType()) {
		  val updateTypeOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
			.withSelection(
			  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Email.DATA} = ?",
			  arrayOf(storedContact.rawId.toString(), storedAddress.address)
			)
			.withValue(
			  ContactsContract.CommonDataKinds.Email.TYPE,
			  serverMailAddress.type.toAndroidType()
			)
			.build()
		  ops += updateTypeOp
		}

		if (storedAddress.customTypeName != serverMailAddress.customTypeName) {
		  val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
			.withSelection(
			  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Email.DATA} = ?",
			  arrayOf(storedContact.rawId.toString(), storedAddress.address)
			)
			.withValue(
			  ContactsContract.CommonDataKinds.Email.LABEL,
			  serverMailAddress.customTypeName
			)
			.build()
		  ops += updateCustomTypeNameOp
		}

	  } else {
		// it's a new mail address
		val createEmailAddressOp = insertMailAddressOperation(serverMailAddress)
		  .withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
		  .build()
		ops += createEmailAddressOp
	  }
	}
	for (storedMailAddress in storedContact.emailAddresses) {
	  if (serverContact.mailAddresses.none { it.address == storedMailAddress.address }) {
		val deleteOp = ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
		  .withSelection(
			"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Email.DATA} = ?",
			arrayOf(storedContact.rawId.toString(), storedMailAddress.address)
		  )
		  .build()
		ops += deleteOp
	  }
	}
  }

  private fun checkContactAddresses(
	storedContact: AndroidContact,
	serverContact: StructuredContact,
	ops: ArrayList<ContentProviderOperation>
  ) {
	for (serverAddress in serverContact.addresses) {
	  val storedAddress = storedContact.addresses.find { it.address == serverAddress.address }
	  if (storedAddress != null) {
		if (storedAddress.type != serverAddress.type.toAndroidType()) {
		  val updateTypeOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
			.withSelection(
			  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.StructuredPostal.DATA} = ?",
			  arrayOf(storedContact.rawId.toString(), storedAddress.address)
			)
			.withValue(
			  ContactsContract.CommonDataKinds.StructuredPostal.TYPE,
			  serverAddress.type.toAndroidType()
			)
			.build()
		  ops += updateTypeOp
		}

		if (storedAddress.customTypeName != serverAddress.customTypeName) {
		  val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
			.withSelection(
			  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.StructuredPostal.DATA} = ?",
			  arrayOf(storedContact.rawId.toString(), storedAddress.address)
			)
			.withValue(
			  ContactsContract.CommonDataKinds.StructuredPostal.LABEL,
			  serverAddress.customTypeName
			)
			.build()
		  ops += updateCustomTypeNameOp
		}
	  } else {
		// it's a new address
		val createAddressOp = insertAddressOperation(serverAddress)
		  .withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
		  .build()
		ops += createAddressOp
	  }
	}

	for (storedAddress in storedContact.addresses) {
	  if (serverContact.addresses.none { it.address == storedAddress.address }) {
		val deleteOp = ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
		  .withSelection(
			"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.StructuredPostal.DATA} = ?",
			arrayOf(storedContact.rawId.toString(), storedAddress.address)
		  )
		  .build()
		ops += deleteOp
	  }
	}
  }

  private fun checkContactPhonesNumbers(
	storedContact: AndroidContact,
	serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>
  ) {
	for (serverPhoneNumber in serverContact.phoneNumbers) {
	  val storedNumber = storedContact.phoneNumbers.find { it.number == serverPhoneNumber.number }
	  if (storedNumber != null) {
		if (storedNumber.type != serverPhoneNumber.type.toAndroidType()) {
		  val updateTypeOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
			.withSelection(
			  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Phone.DATA} = ?",
			  arrayOf(storedContact.rawId.toString(), storedNumber.number)
			)
			.withValue(
			  ContactsContract.CommonDataKinds.Phone.TYPE,
			  serverPhoneNumber.type.toAndroidType()
			)
			.build()
		  ops += updateTypeOp
		}
		if (storedNumber.customTypeName != serverPhoneNumber.customTypeName) {
		  val updateCustomTypeNameOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
			.withSelection(
			  "${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Phone.DATA} = ?",
			  arrayOf(storedContact.rawId.toString(), storedNumber.number)
			)
			.withValue(
			  ContactsContract.CommonDataKinds.Phone.LABEL,
			  serverPhoneNumber.customTypeName
			)
			.build()
		  ops += updateCustomTypeNameOp
		}
	  } else {
		// it's a new phone number
		val createEmailAddressOp = insertPhoneNumberOperations(serverPhoneNumber)
		  .withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
		  .build()
		ops += createEmailAddressOp
	  }
	}

	for (storedPhoneNumber in storedContact.phoneNumbers) {
	  if (serverContact.phoneNumbers.none { it.number == storedPhoneNumber.number }) {
		val deleteOp = ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
		  .withSelection(
			"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ? AND ${ContactsContract.CommonDataKinds.Phone.DATA} = ?",
			arrayOf(storedContact.rawId.toString(), storedPhoneNumber.number)
		  )
		  .build()
		ops += deleteOp
	  }
	}
  }

  private fun updateContact(
	storedContact: AndroidContact,
	serverContact: StructuredContact
  ) {
	val ops = arrayListOf<ContentProviderOperation>()
	checkDeletedContact(storedContact, ops)
	checkContactDetails(storedContact, serverContact, ops)
	checkContactAddresses(storedContact, serverContact, ops)
	checkContactMailAddresses(storedContact, serverContact, ops)
	checkContactPhonesNumbers(storedContact, serverContact, ops)
	if (ops.isNotEmpty()) {
	  resolver.applyBatch(ContactsContract.AUTHORITY, ops)
	}
  }

  private fun createContact(
	userId: String,
	contact: StructuredContact
  ) {
	val ops = ArrayList<ContentProviderOperation>()
	val index = 0
	ops.add(
	  ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
		.withValue(RawContacts.ACCOUNT_TYPE, TUTA_ACCOUNT_TYPE)
		.withValue(RawContacts.ACCOUNT_NAME, userId)
		.withValue(RawContacts.SOURCE_ID, contact.id)
		.build()
	)

	ops.add(
	  ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
		.withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index)
		.withValue(
		  RawContacts.Data.MIMETYPE,
		  ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE
		)
		.withValue(ContactsContract.CommonDataKinds.StructuredName.GIVEN_NAME, contact.firstName)
		.withValue(
		  RawContacts.Data.MIMETYPE,
		  ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE
		)
		.withValue(ContactsContract.CommonDataKinds.StructuredName.FAMILY_NAME, contact.lastName)
		.build()
	)

	ops.add(
	  ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
		.withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index)
		.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE)
		.withValue(ContactsContract.CommonDataKinds.Event.START_DATE, contact.birthday)
		.withValue(RawContacts.Data.MIMETYPE, ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE)
		.withValue(ContactsContract.CommonDataKinds.Event.TYPE, ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY)
		.build()
	)

	ops.add(
	  ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
		.withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index)
		.withValue(
		  RawContacts.Data.MIMETYPE,
		  ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE
		)
		.withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, contact.company)
		.build()
	)

	ops.add(
	  ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
		.withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index)
		.withValue(
		  RawContacts.Data.MIMETYPE,
		  ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE
		)
		.withValue(ContactsContract.CommonDataKinds.Nickname.NAME, contact.nickname)
		.build()
	)

	for (mailAddress in contact.mailAddresses) {
	  ops.add(
		insertMailAddressOperation(mailAddress)
		  .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index)
		  .build()
	  )
	}

	for (phoneNumber in contact.phoneNumbers) {
	  ops.add(
		insertPhoneNumberOperations(phoneNumber)
		  .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index)
		  .build()
	  )
	}

	for (address in contact.addresses) {
	  ops.add(
		insertAddressOperation(address)
		  .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, index)
		  .build()
	  )
	}

	val result = resolver.applyBatch(ContactsContract.AUTHORITY, ops)
	Log.d(TAG, "Save result: $result")
  }

  private fun readContact(
	rawContactId: Long,
	sourceId: String
  ): AndroidContact {
	val storedContact = AndroidContact(rawContactId, sourceId)

	val entityUri = Uri.withAppendedPath(
	  ContentUris.withAppendedId(RawContacts.CONTENT_URI, rawContactId),
	  RawContacts.Entity.CONTENT_DIRECTORY
	)
	resolver.query(
	  entityUri,
	  arrayOf(
		RawContacts.SOURCE_ID,
		RawContacts.DELETED,
		RawContacts.Entity.DATA_ID,
		RawContacts.Entity.MIMETYPE,
		RawContacts.Entity.DATA1,
		RawContacts.Entity.DATA2,
		RawContacts.Entity.DATA3
	  ), null, null, null
	).use { entityCursor ->
	  entityCursor!!.forEachRow {
		if (entityCursor.getInt(1) == 1) {
		  storedContact.isDeleted = true
		}

		if (!entityCursor.isNull(2)) {
		  parseStoredContactData(entityCursor, storedContact)
		}

	  }
	}
	return storedContact
  }

  private fun parseStoredContactData(entityCursor: Cursor, storedContact: AndroidContact) {
	val mimeType = entityCursor.getString(3)
	val data1 = entityCursor.getString(4)

	when (mimeType) {
	  ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE -> {
		storedContact.givenName = entityCursor.getString(5)
		storedContact.lastName = entityCursor.getString(6)
	  }
	  ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE -> storedContact.emailAddresses.add(
		AndroidEmailAddress(
		  data1,
		  entityCursor.getInt(5),
		  if (!entityCursor.isNull(6)) entityCursor.getString(6) else ""
		)
	  )
	  ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> storedContact.phoneNumbers.add(
		AndroidPhoneNumber(
		  data1,
		  entityCursor.getInt(5),
		  if (!entityCursor.isNull(6)) entityCursor.getString(6) else ""
		)
	  )
	  ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE -> storedContact.addresses.add(
		AndroidAddress(
		  data1,
		  entityCursor.getInt(5),
		  if (!entityCursor.isNull(6)) entityCursor.getString(6) else ""
		)
	  )
	  ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE -> storedContact.nickname = data1
	  ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> storedContact.company = data1
	  ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE -> storedContact.birthday = data1
	}
  }

  private fun insertAddressOperation(address: StructuredAddress): ContentProviderOperation.Builder {
	val contactInsert = ContentProviderOperation
	  .newInsert(ContactsContract.Data.CONTENT_URI)
	  .withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE
	  )
	  .withValue(ContactsContract.CommonDataKinds.StructuredPostal.DATA, address.address)
	  .withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE
	  )
	  .withValue(
		ContactsContract.CommonDataKinds.StructuredPostal.TYPE,
		address.type.toAndroidType(),
	  )
	if (address.type == ContactAddressType.CUSTOM) {
	  contactInsert.withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE
	  )
		.withValue(
		  ContactsContract.CommonDataKinds.StructuredPostal.LABEL,
		  address.customTypeName
		)
	}
	return contactInsert
  }

  private fun insertMailAddressOperation(mailAddress: StructuredMailAddress): ContentProviderOperation.Builder {

	val contactInsert = ContentProviderOperation
	  .newInsert(ContactsContract.Data.CONTENT_URI)
	  .withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE
	  )
	  .withValue(ContactsContract.CommonDataKinds.Email.DATA, mailAddress.address)
	  .withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE
	  )
	  .withValue(
		ContactsContract.CommonDataKinds.Email.TYPE,
		mailAddress.type.toAndroidType(),
	  )
	if (mailAddress.type == ContactAddressType.CUSTOM) {
	  contactInsert.withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE
	  )
		.withValue(
		  ContactsContract.CommonDataKinds.Email.LABEL,
		  mailAddress.customTypeName
		)
	}
	return contactInsert
  }

  private fun insertPhoneNumberOperations(phoneNumber: StructuredPhoneNumber): ContentProviderOperation.Builder {
	val contactInsert = ContentProviderOperation
	  .newInsert(ContactsContract.Data.CONTENT_URI)
	  .withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.Phone.MIMETYPE
	  )
	  .withValue(ContactsContract.CommonDataKinds.Phone.DATA, phoneNumber.number)
	  .withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE
	  )
	  .withValue(
		ContactsContract.CommonDataKinds.Phone.TYPE,
		phoneNumber.type.toAndroidType(),
	  )
	if (phoneNumber.type == ContactPhoneNumberType.CUSTOM) {
	  contactInsert.withValue(
		RawContacts.Data.MIMETYPE,
		ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE
	  )
		.withValue(
		  ContactsContract.CommonDataKinds.Phone.LABEL,
		  phoneNumber.customTypeName
		)
	}
	return contactInsert
  }

  companion object {
	private val PROJECTION = arrayOf(
	  ContactsContract.Contacts._ID,
	  ContactsContract.Contacts.DISPLAY_NAME_PRIMARY,
	  ContactsContract.CommonDataKinds.Email.ADDRESS
	)
	const val TAG = "Contact"
	private const val TUTA_ACCOUNT_TYPE = "de.tutao.tutanota"
  }
}


/**
 * Android doesn't really have a unique id for account so we use account type and name as a unique id.
 * We serialize it as JSON because both fields can have arbitrary values in them and we don't want to deal with
 * escaping.
 */
@Serializable
private data class ContactBookId(val accountType: String, val accountName: String) {
  fun toJson() = Json.encodeToString(this)

  companion object {
	fun fromJson(jsonString: String): ContactBookId = Json.decodeFromString(jsonString)
  }
}