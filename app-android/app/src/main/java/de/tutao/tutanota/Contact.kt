package de.tutao.tutanota

import android.Manifest
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.Email
import org.jdeferred.DoneFilter
import org.jdeferred.Promise
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

/**
 * Created by mpfau on 4/12/17.
 */
class Contact(private val activity: MainActivity) {
	private fun requestContactsPermission(): Promise<ActivityResult?, Exception, Void> {
		return activity.getPermission(Manifest.permission.READ_CONTACTS)
	}

	fun findSuggestions(queryString: String): Promise<Any, Exception, Void> {
		val query = "%$queryString%"
		return requestContactsPermission().then(DoneFilter<ActivityResult?, Any> { nothing: ActivityResult? ->
			val cr = activity.applicationContext.contentResolver
			val selection = Email.ADDRESS + " LIKE ? OR " + ContactsContract.Contacts.DISPLAY_NAME_PRIMARY + " LIKE ?"
			val cursor = cr.query(Email.CONTENT_URI, PROJECTION, selection, arrayOf(query, query), ContactsContract.Contacts.DISPLAY_NAME_PRIMARY + " ASC ")
			val result = JSONArray()
			if (cursor == null) return@DoneFilter result
			try {
				while (cursor.moveToNext()) {
					val c = JSONObject()
					c.put("name", cursor.getString(1))
					c.put("mailAddress", cursor.getString(2))
					result.put(c)
				}
			} catch (e: JSONException) {
				throw RuntimeException(e)
			} finally {
				cursor.close()
			}
			result
		})
	}

	companion object {
		private val PROJECTION = arrayOf(
				ContactsContract.Contacts._ID,
				ContactsContract.Contacts.DISPLAY_NAME_PRIMARY,
				Email.ADDRESS)
	}
}