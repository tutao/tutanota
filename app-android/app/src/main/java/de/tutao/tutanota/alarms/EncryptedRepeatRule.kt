package de.tutao.tutanota.alarms

import de.tutao.tutanota.AndroidNativeCryptoFacade
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

fun EncryptedRepeatRule.decrypt(crypto: AndroidNativeCryptoFacade, sessionKey: ByteArray): RepeatRule {
	val repeatPeriodNumber = crypto.decryptNumber(frequency, sessionKey)
	val repeatPeriod = RepeatPeriod[repeatPeriodNumber]

	val endTypeNumber = crypto.decryptNumber(endType, sessionKey)
	val endType = EndType[endTypeNumber]
	return RepeatRule(
			frequency = repeatPeriod,
			interval = crypto.decryptNumber(interval, sessionKey).toInt(),
			timeZone = TimeZone.getTimeZone(crypto.decryptString(timeZone, sessionKey)),
			endValue = if (endValue != null) crypto.decryptNumber(endValue, sessionKey) else null,
			endType = endType,
	)
}