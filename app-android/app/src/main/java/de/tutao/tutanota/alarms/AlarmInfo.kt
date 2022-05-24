package de.tutao.tutanota.alarms

import de.tutao.tutanota.Crypto
import de.tutao.tutanota.CryptoError
import org.json.JSONException
import org.json.JSONObject
import java.nio.charset.StandardCharsets

class AlarmInfo(
		val trigger: String,
		val identifier: String,
) {

	@Throws(CryptoError::class)
	fun getTriggerDec(crypto: Crypto, sessionKey: ByteArray): String {
		return String(crypto.aesDecrypt(sessionKey, trigger), StandardCharsets.UTF_8)
	}

	override fun equals(other: Any?): Boolean {
		if (this === other) return true
		if (javaClass != other?.javaClass) return false

		other as AlarmInfo

		if (identifier != other.identifier) return false

		return true
	}

	override fun hashCode(): Int {
		return identifier.hashCode()
	}


	companion object {
		@Throws(JSONException::class)
		fun fromJson(jsonObject: JSONObject): AlarmInfo {
			val trigger = jsonObject.getString("trigger")
			val alarmIdentifier = jsonObject.getString("alarmIdentifier")
			return AlarmInfo(trigger, alarmIdentifier)
		}
	}
}