package de.tutao.tutashared.alarms

import android.util.Log
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import de.tutao.tutasdk.ByRule
import de.tutao.tutasdk.ByRuleType
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.decryptDate
import de.tutao.tutashared.decryptNumber
import de.tutao.tutashared.decryptString
import kotlinx.serialization.Serializable
import java.util.TimeZone

@Serializable
class EncryptedDateWrapper(
	val date: String
)

@Serializable
class EncryptedByRuleWrapper(
	val interval: String,
	val ruleType: String
)

@Serializable
@TypeConverters(
	EncryptedRepeatRule.ExcludedDateWrapperConverter::class,
	EncryptedRepeatRule.ByRuleWrapperConverter::class
)
class EncryptedRepeatRule(
	val frequency: String,
	val interval: String,
	val timeZone: String,
	val endType: String,
	val endValue: String?,
	val excludedDates: List<EncryptedDateWrapper>,
	val advancedRules: List<EncryptedByRuleWrapper>
) {
	internal class ExcludedDateWrapperConverter {
		@TypeConverter
		fun listToString(excludedDatesList: List<EncryptedDateWrapper>) =
			excludedDatesList.joinToString(",") { it.date }

		@TypeConverter
		fun stringToList(string: String?) = if (string != null && string.isNotEmpty()) string.split(",")
			.map { EncryptedDateWrapper(it) } else emptyList()
	}

	internal class ByRuleWrapperConverter {
		@TypeConverter
		fun listToString(rules: List<EncryptedByRuleWrapper>) =
			rules.joinToString(";") { "${it.interval},${it.ruleType}" }

		@TypeConverter
		fun stringToList(string: String?) = if (!string.isNullOrEmpty()) {
			string.split(";").map {
				val (interval, ruleType) = it.split(",")
				EncryptedByRuleWrapper(interval, ruleType)
			}
		} else emptyList<EncryptedByRuleWrapper>()
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
		advancedRules = advancedRules.map {
			val interval = crypto.decryptString(it.interval, sessionKey)
			val rule = ByRuleType.fromValue(crypto.decryptNumber(it.ruleType, sessionKey).toInt())
			ByRule(rule, interval)
		}
	)
}

fun ByRuleType.Companion.fromValue(value: Int) = run {
	when (value) {
		0 -> ByRuleType.BYMINUTE
		1 -> ByRuleType.BYHOUR
		2 -> ByRuleType.BYDAY
		3 -> ByRuleType.BYMONTHDAY
		4 -> ByRuleType.BYYEARDAY
		5 -> ByRuleType.BYWEEKNO
		6 -> ByRuleType.BYMONTH
		7 -> ByRuleType.BYSETPOS
		8 -> ByRuleType.WKST

		else -> {
			throw Exception("Invalid rule type")
		}
	}
}