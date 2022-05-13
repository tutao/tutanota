package de.tutao.tutanota.push

import org.json.JSONException
import org.json.JSONObject

data class NotificationInfo(val address: String, val counter: Int, val userId: String) {

	companion object {
		private const val COUNTER_KEY = "counter"
		private const val USER_ID_KEY = "userId"

		// We pass in mailAddressKey because of the incompatibility between the entity passed with SSE message and the one inside MissedNotification
		@Throws(JSONException::class)
		fun fromJson(jsonObject: JSONObject, mailAddressKey: String): NotificationInfo {
			val address = jsonObject.getString(mailAddressKey)
			val counter = jsonObject.getInt(COUNTER_KEY)
			val userId = jsonObject.getString(USER_ID_KEY)
			return NotificationInfo(address, counter, userId)
		}
	}
}
