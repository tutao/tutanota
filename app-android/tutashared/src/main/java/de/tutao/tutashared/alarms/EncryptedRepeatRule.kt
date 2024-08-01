package de.tutao.tutashared.alarms

import androidx.room.TypeConverter
import androidx.room.TypeConverters
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.decryptDate
import de.tutao.tutashared.decryptNumber
import de.tutao.tutashared.decryptString
import kotlinx.serialization.Serializable
import java.util.*

@Serializable
class EncryptedDateWrapper(
		val date: String
)

@Serializable
@TypeConverters(EncryptedRepeatRule.ExcludedDateWrapperConverter::class)
class EncryptedRepeatRule(
	val frequency: String,
	val interval: String,
	val timeZone: String,
	val endType: String,
	val endValue: String?,
	val excludedDates: List<EncryptedDateWrapper>,
) {
	internal class ExcludedDateWrapperConverter {
		@TypeConverter
		fun listToString(excludedDatesList: List<EncryptedDateWrapper>) =
			excludedDatesList.joinToString(",") { it.date }

		@TypeConverter
		fun stringToList(string: String?) = if (string != null && string.isNotEmpty()) string.split(",").map { EncryptedDateWrapper(it) } else emptyList()
	}
}

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
			excludedDates = excludedDates.map { crypto.decryptDate(it.date, sessionKey) },
	)
}