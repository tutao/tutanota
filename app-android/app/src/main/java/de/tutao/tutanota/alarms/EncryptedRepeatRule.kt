package de.tutao.tutanota.alarms

import de.tutao.tutanota.Crypto
import de.tutao.tutanota.decryptNumber
import de.tutao.tutanota.decryptString
import kotlinx.serialization.Serializable
import java.util.*

@Serializable
class EncryptedRepeatRule(
		val frequency: String,
		val interval: String,
		val timeZone: String,
		val endType: String,
		val endValue: String?,
)

fun EncryptedRepeatRule.decrypt(crypto: Crypto, sessionKey: ByteArray): RepeatRule {
	val repeatPeriodNumber = crypto.decryptNumber(frequency, sessionKey)
	val repeatPeriod = RepeatPeriod.get(repeatPeriodNumber)

	val endTypeNumber = crypto.decryptNumber(endType, sessionKey)
	val endType = EndType.get(endTypeNumber)
	return RepeatRule(
			frequency = repeatPeriod,
			interval = crypto.decryptNumber(interval, sessionKey).toInt(),
			timeZone = TimeZone.getTimeZone(crypto.decryptString(timeZone, sessionKey)),
			endValue = crypto.decryptNumber(endValue!!, sessionKey),
			endType = endType,
	)
}