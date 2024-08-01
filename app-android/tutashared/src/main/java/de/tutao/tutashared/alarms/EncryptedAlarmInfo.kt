package de.tutao.tutashared.alarms

import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.decryptString
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

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

fun EncryptedAlarmInfo.decrypt(crypto: AndroidNativeCryptoFacade, sessionKey: ByteArray) = AlarmInfo(
	alarmIdentifier = identifier,
	trigger = AlarmInterval.fromString(crypto.decryptString(trigger, sessionKey)),
)