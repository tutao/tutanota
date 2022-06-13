package de.tutao.tutanota.alarms

import de.tutao.tutanota.Crypto
import de.tutao.tutanota.decryptString
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.json.JSONException
import org.json.JSONObject

@Serializable
class EncryptedAlarmInfo(
		val trigger: String,
		@SerialName("alarmIdentifier")
		val identifier: String,
) {

	override fun equals(other: Any?): Boolean {
		if (this === other) return true
		if (javaClass != other?.javaClass) return false

		other as EncryptedAlarmInfo

		if (identifier != other.identifier) return false

		return true
	}

	override fun hashCode(): Int {
		return identifier.hashCode()
	}
}

fun EncryptedAlarmInfo.decrypt(crypto: Crypto, sessionKey: ByteArray) = AlarmInfo(
		alarmIdentifer = identifier,
		trigger = AlarmTrigger.get(crypto.decryptString(trigger, sessionKey)),
)