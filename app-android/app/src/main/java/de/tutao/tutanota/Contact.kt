package de.tutao.tutanota

import android.Manifest
import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.content.ContentUris
import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import android.provider.ContactsContract.RawContacts
import android.util.Log
import de.tutao.tutanota.ipc.*
import kotlinx.serialization.SerialName


/**
 * Created by mpfau on 4/12/17.
 */
class Contact(private val activity: MainActivity) {

	private val resolver: ContentResolver
		get() = activity.applicationContext.contentResolver

	suspend fun findSuggestions(queryString: String): List<NativeContact> {

		activity.getPermission(Manifest.permission.READ_CONTACTS)

		val query = "%$queryString%"
		val selection =
				ContactsContract.CommonDataKinds.Email.ADDRESS + " LIKE ? OR " + ContactsContract.Contacts.DISPLAY_NAME_PRIMARY + " LIKE ?"
		val cursor = resolver.query(
				ContactsContract.CommonDataKinds.Email.CONTENT_URI,
				PROJECTION,
				selection,
				arrayOf(query, query),
				ContactsContract.Contacts.DISPLAY_NAME_PRIMARY + " ASC "
		)
		val result = mutableListOf<NativeContact>()

		return if (cursor == null) {
			result
		} else {
			try {
				while (cursor.moveToNext()) {
					val c = NativeContact(
							name = cursor.getString(1),
							mailAddress = cursor.getString(2)
					)
					result.add(c)
				}
			} finally {
				cursor.close()
			}
			result
		}
	}

	suspend fun saveContacts(userId: String, contacts: List<StructuredContact>) {
		activity.getPermission(Manifest.permission.READ_CONTACTS)
		activity.getPermission(Manifest.permission.WRITE_CONTACTS)

		/** map from sourceId to id */
		val alreadyStoredContacts = mutableMapOf<String, StoredContact>()

		readRawContacts(userId).use { cursor ->
			while (cursor!!.moveToNext()) {
				val rawContactId = cursor.getLong(0)
				val sourceId = cursor.getString(1)

				val storedContact = readContact(rawContactId, sourceId)
				alreadyStoredContacts[storedContact.sourceId] = storedContact
			}
		}

		Log.d(TAG, "already stored contacts: ${alreadyStoredContacts.size}")

		val ops = arrayListOf<ContentProviderOperation>()
		for (contact in contacts) {
			if (alreadyStoredContacts.contains(contact.id)) {
				Log.d(TAG, "Already has contact ${contact.id}")
				continue
			}
			Log.d(TAG, "Inserting contact ${contact.id}")

			createContact(ops, userId, contact)
		}

		val serverContactsById = contacts.groupBy { it.id }.mapValues { it.value[0] }
		for ((storedContactId, storedContact) in alreadyStoredContacts) {
			val serverContact = serverContactsById[storedContactId]
			if (serverContact == null) {
				val deletedRows = deleteRawContact(storedContact)
				Log.d(TAG, "Deleted contact $storedContactId with raw id $storedContact $deletedRows")
			} else {
				updateContact(storedContact, serverContact)
			}
		}

		val result = resolver.applyBatch(ContactsContract.AUTHORITY, ops)
		Log.d(TAG, "save contact result: $result")
	}

	private fun deleteRawContact(storedContact: StoredContact): Int {
		val uri = ContentUris.withAppendedId(RawContacts.CONTENT_URI, storedContact.rawId).buildUpon()
				.appendQueryParameter(ContactsContract.CALLER_IS_SYNCADAPTER, "true").build()
		return resolver.delete(uri, null, null)
	}

	private fun readRawContacts(userId: String): Cursor? {
		val rawContactUri = RawContacts.CONTENT_URI.buildUpon()
				.appendQueryParameter(RawContacts.ACCOUNT_NAME, userId)
				.appendQueryParameter(RawContacts.ACCOUNT_TYPE, "tuta")
				.build()

		return resolver.query(
				rawContactUri,
				arrayOf(
						RawContacts._ID,
						RawContacts.SOURCE_ID
				), null, null, null
		)
	}

	private fun checkDeletedContact(storedContact: StoredContact, ops: ArrayList<ContentProviderOperation>) {
		if (storedContact.isDeleted) {
			val updateDeletedStatusOp = ContentProviderOperation.newUpdate(RawContacts.CONTENT_URI)
					.withSelection("${ContactsContract.RawContacts._ID} = ?", arrayOf(storedContact.rawId.toString()))
					.withValue(RawContacts.DELETED, 0)
					.build()
			ops += updateDeletedStatusOp
			Log.d(TAG, "Undeleted contact for ${storedContact.sourceId}")
		} else {
			Log.d(TAG, "Contact isn't deleted, continuing...")
		}
	}

	private fun checkContactDetails(storedContact: StoredContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		if (storedContact.birthday != serverContact.birthday) {
			checkContactBirthday(storedContact, ops, serverContact)
		}

		if (storedContact.company != serverContact.company) {
			checkContactCompany(storedContact, ops, serverContact)
		}

		if (storedContact.displayName != serverContact.name) {
			val updateNameOp = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
					.withSelection(
							"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
							arrayOf(storedContact.rawId.toString())
					)
					.withValue(ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME, serverContact.name)
					.build()
			ops += updateNameOp
			Log.d(TAG, "Updated name for ${serverContact.id}")
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
			Log.d(TAG, "Updated nickname for ${serverContact.id} Stored: ${storedContact.nickname} Server: ${serverContact.nickname}")
		}
	}

	private fun checkContactBirthday(storedContact: StoredContact, ops: ArrayList<ContentProviderOperation>, serverContact: StructuredContact) {
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
			ops.add(ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
					.withSelection(
							"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
							arrayOf(storedContact.rawId.toString())
					)
					.withValue(ContactsContract.CommonDataKinds.Event.TYPE, ContactsContract.CommonDataKinds.Event.TYPE_BIRTHDAY)
					.withValue(ContactsContract.CommonDataKinds.Event.START_DATE, serverContact.birthday)
					.build())
		}
		Log.d(TAG, "Updated birthday for ${serverContact.id} Stored: ${storedContact.birthday} Server: ${serverContact.birthday}")
	}

	private fun checkContactCompany(storedContact: StoredContact, ops: ArrayList<ContentProviderOperation>, serverContact: StructuredContact) {
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
							.withValue(ContactsContract.CommonDataKinds.Organization.TYPE, ContactsContract.CommonDataKinds.Organization.TYPE_WORK)
							.build()
			)
		} else {
			ops.add(ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
					.withSelection(
							"${ContactsContract.Data.MIMETYPE} = \"${ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE}\" AND ${ContactsContract.Data.RAW_CONTACT_ID} = ?",
							arrayOf(storedContact.rawId.toString())
					)
					.withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, serverContact.company)
					.withValue(ContactsContract.CommonDataKinds.Organization.TYPE, ContactsContract.CommonDataKinds.Organization.TYPE_WORK)
					.build())
		}
		Log.d(TAG, "Updated organization/company for ${serverContact.id} Stored: ${storedContact.company} Server: ${serverContact.company} Branch: ${storedContact.company == ""}")
	}

	private fun checkContactMailAddresses(storedContact: StoredContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverMailAddress in serverContact.mailAddresses) {
			val storedAddress = storedContact.emailAddresses.find { it.address == serverMailAddress.address }
			if (storedAddress != null) {
				if (storedAddress.type != serverMailAddress.type.toAndroidType()) {
					Log.d(
							TAG,
							"Different mail address types for $storedAddress. Stored: ${storedAddress.type}, server: ${serverMailAddress.type.toAndroidType()} (as entity type: ${serverMailAddress.type})"
					)
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
					Log.d(
							TAG,
							"Updated type for ${serverContact.id} $serverMailAddress ${serverMailAddress.type.toAndroidType()}"
					)
				} else {
					Log.d(
							TAG,
							"No type changes for ${serverContact.id} $serverMailAddress ${serverMailAddress.type.toAndroidType()}"
					)
				}
				if (storedAddress.customTypeName != serverMailAddress.customTypeName) {
					Log.d(
							TAG,
							"Different mail address custom type name for $storedAddress. Stored: ${storedAddress.customTypeName}, server: ${serverMailAddress.customTypeName}"
					)
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
					Log.d(
							TAG,
							"Updated custom type name for ${serverContact.id} $serverMailAddress ${serverMailAddress.customTypeName}"
					)
				} else {
					Log.d(
							TAG,
							"No custom type name changes for ${serverContact.id} $serverMailAddress ${serverMailAddress.customTypeName}"
					)
				}
			} else {
				// it's a new mail address
				val createEmailAddressOp = insertMailAddressOperation(serverMailAddress)
						.withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
						.build()
				ops += createEmailAddressOp
				Log.d(TAG, "Created address ${serverContact.id} ${serverMailAddress.address}")
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
				Log.d(TAG, "Deleted address ${serverContact.id} ${storedMailAddress.address}")
			}
		}
	}

	private fun checkContactAddresses(storedContact: StoredContact, serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverAddress in serverContact.addresses) {
			val storedAddress = storedContact.addresses.find { it.address == serverAddress.address }
			if (storedAddress != null) {
				if (storedAddress.type != serverAddress.type.toAndroidType()) {
					Log.d(
							TAG,
							"Different address types for $storedAddress. Stored: ${storedAddress.type}, server: ${serverAddress.type.toAndroidType()} (as entity type: ${serverAddress.type})"
					)
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
					Log.d(
							TAG,
							"Updated type for ${serverContact.id} $serverAddress ${serverAddress.type.toAndroidType()}"
					)
				} else {
					Log.d(
							TAG,
							"No type changes for ${serverContact.id} $serverAddress ${serverAddress.type.toAndroidType()}"
					)
				}
				if (storedAddress.customTypeName != serverAddress.customTypeName) {
					Log.d(
							TAG,
							"Different address custom type name for $storedAddress. Stored: ${storedAddress.customTypeName}, server: ${serverAddress.customTypeName}"
					)
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
					Log.d(
							TAG,
							"Updated custom type name for ${serverContact.id} $serverAddress ${serverAddress.customTypeName}"
					)
				} else {
					Log.d(
							TAG,
							"No custom type name changes for ${serverContact.id} $serverAddress ${serverAddress.customTypeName}"
					)
				}
			} else {
				// it's a new address
				val createAddressOp = insertAddressOperation(serverAddress)
						.withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
						.build()
				ops += createAddressOp
				Log.d(TAG, "Created address ${serverContact.id} ${serverAddress.address}")
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
				Log.d(TAG, "Deleted address ${serverContact.id} ${storedAddress.address}")
			}
		}
	}

	private fun checkContactPhonesNumbers(storedContact: StoredContact,
										  serverContact: StructuredContact, ops: ArrayList<ContentProviderOperation>) {
		for (serverPhoneNumber in serverContact.phoneNumbers) {
			val storedNumber = storedContact.phoneNumbers.find { it.number == serverPhoneNumber.number }
			if (storedNumber != null) {
				if (storedNumber.type != serverPhoneNumber.type.toAndroidType()) {
					Log.d(
							TAG,
							"Different phone number types for $storedNumber. Stored: ${storedNumber.type}, server: ${serverPhoneNumber.type.toAndroidType()} (as entity type: ${serverPhoneNumber.type})"
					)
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
					Log.d(
							TAG,
							"Updated type for ${serverContact.id} $serverPhoneNumber ${serverPhoneNumber.type.toAndroidType()}"
					)
				} else {
					Log.d(
							TAG,
							"No type changes for ${serverContact.id} $serverPhoneNumber ${serverPhoneNumber.type.toAndroidType()}"
					)
				}
				if (storedNumber.customTypeName != serverPhoneNumber.customTypeName) {
					Log.d(
							TAG,
							"Different phone number custom type name for $storedNumber. Stored: ${storedNumber.customTypeName}, server: ${serverPhoneNumber.customTypeName}"
					)
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
					Log.d(
							TAG,
							"Updated custom type name for ${serverContact.id} $serverPhoneNumber ${serverPhoneNumber.customTypeName}"
					)
				} else {
					Log.d(
							TAG,
							"No custom label changes for ${serverContact.id} $serverPhoneNumber ${serverPhoneNumber.type.toAndroidType()}"
					)
				}
			} else {
				// it's a new phone number
				val createEmailAddressOp = insertPhoneNumberOperations(serverPhoneNumber)
						.withValue(ContactsContract.Data.RAW_CONTACT_ID, storedContact.rawId)
						.build()
				ops += createEmailAddressOp
				Log.d(TAG, "Created phone number ${serverContact.id} ${serverPhoneNumber.number}")
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
				Log.d(TAG, "Deleted phone number ${serverContact.id} ${storedPhoneNumber.number}")
			}
		}
	}

	private fun updateContact(
			storedContact: StoredContact,
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
			ops: ArrayList<ContentProviderOperation>,
			userId: String,
			contact: StructuredContact
	) {
		val index = ops.size
		ops.add(
				ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
						.withValue(RawContacts.ACCOUNT_TYPE, "tuta")
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
						.withValue(ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME, contact.name)
						.build()
		)

		ops.add(
				ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
						.withValueBackReference(RawContacts.Data.RAW_CONTACT_ID, index)
						.withValue(
								RawContacts.Data.MIMETYPE,
								ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE
						)
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
	}

	private fun readContact(
			rawContactId: Long,
			sourceId: String
	): StoredContact {
		Log.d(TAG, "raw contact id $rawContactId  $sourceId")
		val storedContact = StoredContact(rawContactId, sourceId)

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
			while (entityCursor!!.moveToNext()) {
				val sourceId = entityCursor.getString(0)

				if (entityCursor.getInt(1) == 1) {
					Log.d(TAG, "Deleted raw contact $sourceId")
					storedContact.isDeleted = true
				}

				if (entityCursor.isNull(2)) {
					Log.d(TAG, "Empty raw contact $sourceId")
				} else {
					val mimeType = entityCursor.getString(3)
					val data = entityCursor.getString(4)

					when (mimeType) {
						ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE -> storedContact.displayName =
								data
						ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE -> storedContact.emailAddresses.add(
								StoredEmailAddress(data, entityCursor.getInt(5), if (!entityCursor.isNull(6)) entityCursor.getString(6) else "")
						)
						ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> storedContact.phoneNumbers.add(StoredPhoneNumber(data, entityCursor.getInt(5), if (!entityCursor.isNull(6)) entityCursor.getString(6) else ""))
						ContactsContract.CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE -> storedContact.addresses.add(StoredAddress(data, entityCursor.getInt(5), if (!entityCursor.isNull(6)) entityCursor.getString(6) else ""))
						ContactsContract.CommonDataKinds.Nickname.CONTENT_ITEM_TYPE -> storedContact.nickname = data
						ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> storedContact.company = data
						ContactsContract.CommonDataKinds.Event.CONTENT_ITEM_TYPE -> storedContact.birthday = data
					}
				}
			}
		}
		return storedContact
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
	}
}

data class StoredEmailAddress(
		val address: String,
		val type: Int,
		val customTypeName: String
)

data class StoredAddress(
		val address: String,
		val type: Int,
		val customTypeName: String
)

data class StoredPhoneNumber(
		val number: String,
		val type: Int,
		val customTypeName: String
)

data class StoredContact(
		val rawId: Long,
		val sourceId: String,
		var displayName: String? = null,
		var company: String = "",
		var nickname: String? = null,
		var birthday: String? = null,
		val emailAddresses: MutableList<StoredEmailAddress> = mutableListOf(),
		val phoneNumbers: MutableList<StoredPhoneNumber> = mutableListOf(),
		val addresses: MutableList<StoredAddress> = mutableListOf(),
		var isDeleted: Boolean = false,
)

@kotlinx.serialization.Serializable
enum class ContactAddressType {
	@SerialName("0")
	PRIVATE,

	@SerialName("1")
	WORK,

	@SerialName("2")
	OTHER,

	@SerialName("3")
	CUSTOM,
}

enum class ContactPhoneNumberType {
	@SerialName("0")
	PRIVATE,

	@SerialName("1")
	WORK,

	@SerialName("2")
	MOBILE,

	@SerialName("3")
	FAX,

	@SerialName("4")
	OTHER,

	@SerialName("5")
	CUSTOM,
}


fun ContactAddressType.toAndroidType() = when (this) {
	ContactAddressType.PRIVATE -> ContactsContract.CommonDataKinds.Email.TYPE_HOME
	ContactAddressType.WORK -> ContactsContract.CommonDataKinds.Email.TYPE_WORK
	ContactAddressType.OTHER -> ContactsContract.CommonDataKinds.Email.TYPE_OTHER
	ContactAddressType.CUSTOM -> ContactsContract.CommonDataKinds.Email.TYPE_CUSTOM
}

fun ContactPhoneNumberType.toAndroidType() = when (this) {
	ContactPhoneNumberType.PRIVATE -> ContactsContract.CommonDataKinds.Phone.TYPE_HOME
	ContactPhoneNumberType.WORK -> ContactsContract.CommonDataKinds.Phone.TYPE_WORK
	ContactPhoneNumberType.MOBILE -> ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE
	ContactPhoneNumberType.FAX -> ContactsContract.CommonDataKinds.Phone.TYPE_OTHER_FAX //fixme Is there any better FAX option?
	ContactPhoneNumberType.OTHER -> ContactsContract.CommonDataKinds.Phone.TYPE_OTHER
	ContactPhoneNumberType.CUSTOM -> ContactsContract.CommonDataKinds.Phone.TYPE_CUSTOM
}