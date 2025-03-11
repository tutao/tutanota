package de.tutao.tutashared.alarms

import androidx.room.TypeConverter
import androidx.room.TypeConverters
import de.tutao.tutasdk.ByRule
import de.tutao.tutasdk.ByRuleType
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.decryptDate
import de.tutao.tutashared.decryptNumber
import de.tutao.tutashared.decryptString
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.util.TimeZone

@Serializable
class EncryptedDateWrapper(
	@SerialName("2075")
	val date: String
)

@Serializable
class EncryptedByRuleWrapper(
	@SerialName("2524")
	val interval: String,
	@SerialName("2523")
	val ruleType: String
)

@Serializable
@TypeConverters(
	EncryptedRepeatRule.ExcludedDateWrapperConverter::class,
	EncryptedRepeatRule.ByRuleWrapperConverter::class
)
class EncryptedRepeatRule(
	@SerialName("1559")
	val frequency: String,
	@SerialName("1562")
	val interval: String,
	@SerialName("1563")
	val timeZone: String,
	@SerialName("1560")
	val endType: String,
	@SerialName("1561")
	val endValue: String?,
	@SerialName("2076")
	val excludedDates: List<EncryptedDateWrapper>,
	@SerialName("2525")
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
		0 -> ByRuleType.BY_MINUTE
		1 -> ByRuleType.BY_HOUR
		2 -> ByRuleType.BY_DAY
		3 -> ByRuleType.BY_MONTHDAY
		4 -> ByRuleType.BY_YEAR_DAY
		5 -> ByRuleType.BY_WEEK_NO
		6 -> ByRuleType.BY_MONTH
		7 -> ByRuleType.BY_SET_POS
		8 -> ByRuleType.WKST

		else -> {
			throw Exception("Invalid rule type")
		}
	}
}