package de.tutao.tutanota

import android.Manifest
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.Email
import org.json.JSONArray
import org.json.JSONObject

/**
 * Created by mpfau on 4/12/17.
 */
class Contact(private val activity: MainActivity) {
	suspend fun findSuggestions(queryString: String): JSONArray {

		activity.getPermission(Manifest.permission.READ_CONTACTS)

		val query = "%$queryString%"
		val resolver = activity.applicationContext.contentResolver
		val selection = Email.ADDRESS + " LIKE ? OR " + ContactsContract.Contacts.DISPLAY_NAME_PRIMARY + " LIKE ?"
		val cursor = resolver.query(Email.CONTENT_URI, PROJECTION, selection, arrayOf(query, query), ContactsContract.Contacts.DISPLAY_NAME_PRIMARY + " ASC ")
		val result = JSONArray()

		return if (cursor == null) {
			result
		} else {
			try {
				while (cursor.moveToNext()) {
					val c = JSONObject()
					c.put("name", cursor.getString(1))
					c.put("mailAddress", cursor.getString(2))
					result.put(c)
				}
			} finally {
				cursor.close()
			}
			result
		}
	}

	companion object {
		private val PROJECTION = arrayOf(
				ContactsContract.Contacts._ID,
				ContactsContract.Contacts.DISPLAY_NAME_PRIMARY,
				Email.ADDRESS)
	}
}