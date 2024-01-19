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
import de.tutao.tutanota.ipc.NativeContact
import de.tutao.tutanota.ipc.StructuredContact
import de.tutao.tutanota.ipc.StructuredMailAddress
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
		val rawContactsCursor = resolver.query(
			rawContactUri,
			arrayOf(
				RawContacts._ID,
				RawContacts.SOURCE_ID,
			), null, null, null
		)
		return rawContactsCursor
	}

	private fun updateContact(
		storedContact: StoredContact,
		serverContact: StructuredContact
	) {
		val ops = arrayListOf<ContentProviderOperation>()
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

		for (mailAddress in contact.mailAddresses) {
			ops.add(
				insertMailAddressOperation(mailAddress)
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
				RawContacts.Entity.DATA_ID,
				RawContacts.Entity.MIMETYPE,
				RawContacts.Entity.DATA1,
				RawContacts.Entity.DATA2,
			), null, null, null
		).use { entityCursor ->
			while (entityCursor!!.moveToNext()) {
				val sourceId = entityCursor.getString(0)
				if (entityCursor.isNull(1)) {
					Log.d(TAG, "Empty raw contact $sourceId")
				} else {
					val mimeType = entityCursor.getString(2)
					val data = entityCursor.getString(3)
//					Log.d(TAG, "Raw contact data $sourceId $mimeType $data")
					when (mimeType) {
						ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE -> storedContact.displayName =
							data
						ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE -> storedContact.emailAddresses.add(
							StoredEmailAddress(data, entityCursor.getInt(4))
						)
					}
				}
			}
		}
		return storedContact
	}

	private fun insertMailAddressOperation(mailAddress: StructuredMailAddress) =
		ContentProviderOperation
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
			// FIXME: grab the right type
			.withValue(
				ContactsContract.CommonDataKinds.Email.TYPE,
				mailAddress.type.toAndroidType(),
			)

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
)

data class StoredContact(
	val rawId: Long,
	val sourceId: String,
	var displayName: String? = null,
	val emailAddresses: MutableList<StoredEmailAddress> = mutableListOf()
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

fun ContactAddressType.toAndroidType() = when (this) {
	ContactAddressType.PRIVATE -> ContactsContract.CommonDataKinds.Email.TYPE_HOME
	ContactAddressType.WORK -> ContactsContract.CommonDataKinds.Email.TYPE_WORK
	ContactAddressType.OTHER -> ContactsContract.CommonDataKinds.Email.TYPE_OTHER
	ContactAddressType.CUSTOM -> ContactsContract.CommonDataKinds.Email.TYPE_CUSTOM
}