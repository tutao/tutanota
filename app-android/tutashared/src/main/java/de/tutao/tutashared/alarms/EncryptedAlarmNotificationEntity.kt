package de.tutao.tutashared.alarms

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import de.tutao.tutasdk.ByRule
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.IdTuple
import de.tutao.tutashared.IdTupleOneAssociationSerializer
import de.tutao.tutashared.OneAssociationSerializer
import de.tutao.tutashared.OperationType
import de.tutao.tutashared.ZeroOrOneAssociationSerializer
import de.tutao.tutashared.alarms.EncryptedAlarmNotificationEntity.OperationTypeConverter
import de.tutao.tutashared.decryptDate
import de.tutao.tutashared.decryptString
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.serializer
import java.util.Date
import java.util.TimeZone

class RepeatRule(
	val frequency: RepeatPeriod,
	val interval: Int,
	val timeZone: TimeZone,
	val endValue: Long?,
	val endType: EndType,
	val excludedDates: List<Date>,
	val advancedRules: List<ByRule>
)

class AlarmInfo(
	val alarmIdentifier: String,
	val trigger: AlarmInterval,
)

/**
 * used for actual scheduling
 */
class AlarmNotification(
	val summary: String,
	val eventStart: Date,
	val eventEnd: Date,
	val alarmInfo: AlarmInfo,
	val repeatRule: RepeatRule?,
	val user: String,
)

/**
 * this is an UntypedInstance passed over IPC or downloaded from the server
 */
@Serializable
class EncryptedAlarmNotification(
	@SerialName("1566")
	val operation: OperationType,
	@SerialName("1567")
	val summary: String,
	@SerialName("1568")
	val eventStart: String,
	@SerialName("1569")
	val eventEnd: String,
	@SerialName("1570")
	@Serializable(with = EncryptedAlarmInfoOneAssociationSerializer::class)
	val alarmInfo: EncryptedAlarmInfo,
	@SerialName("1571")
	@Serializable(with = EncryptedRepeatRuleZeroOrOneAssociationSerializer::class)
	val repeatRule: EncryptedRepeatRule?,
	@SerialName("1572")
	val notificationSessionKeys: List<EncryptedAlarmNotificationEntity.NotificationSessionKey>,
	@SerialName("1573")
	@Serializable(with = UserOneAssociationSerializer::class)
	val user: String,
)

object EncryptedAlarmInfoOneAssociationSerializer : OneAssociationSerializer<EncryptedAlarmInfo>(serializer())
object EncryptedRepeatRuleZeroOrOneAssociationSerializer :
	ZeroOrOneAssociationSerializer<EncryptedRepeatRule>(serializer())

object UserOneAssociationSerializer : OneAssociationSerializer<String>(serializer())


/**
 * stored in the database
 */
@Entity(primaryKeys = ["identifier"], tableName = "AlarmNotification")
@TypeConverters(OperationTypeConverter::class)
class EncryptedAlarmNotificationEntity(
	val operation: OperationType?,
	val summary: String?,
	val eventStart: String?,
	val eventEnd: String?,
	@field:Embedded val alarmInfo: EncryptedAlarmInfo,
	@field:Embedded val repeatRule: EncryptedRepeatRule?,
	// in case of a delete operation there is no session key
	@field:Embedded(prefix = "key") val notificationSessionKey: NotificationSessionKey?,
	val user: String?,
) {
	override fun equals(other: Any?): Boolean {
		if (this === other) return true
		if (javaClass != other?.javaClass) return false

		other as EncryptedAlarmNotificationEntity

		if (alarmInfo != other.alarmInfo) return false

		return true
	}

	override fun hashCode(): Int {
		return alarmInfo.hashCode()
	}

	@Serializable
	class NotificationSessionKey(
		@SerialName("1555")
		@Serializable(with = IdTupleOneAssociationSerializer::class)
		@field:Embedded val pushIdentifier: IdTuple,
		@SerialName("1556")
		val pushIdentifierSessionEncSessionKey: String,
	)

	class OperationTypeConverter {
		@TypeConverter
		fun fromNumber(number: Int): OperationType {
			return OperationType.values()[number]
		}

		@TypeConverter
		fun numberToOperationType(operationType: OperationType): Int {
			return operationType.ordinal
		}
	}
}

fun EncryptedAlarmNotification.toEntity(): EncryptedAlarmNotificationEntity {
	// Server aggregate still has an array but it is always a single element (they are filtered before we get them
	// here)
	require(notificationSessionKeys.size == 1) {
		"Invalid notificationSessionKeys, must have exactly one key, has ${notificationSessionKeys.size}"
	}
	val notificationSessionKey = notificationSessionKeys.first()
	return EncryptedAlarmNotificationEntity(
		operation = operation,
		summary = summary,
		eventStart = eventStart,
		eventEnd = eventEnd,
		alarmInfo = alarmInfo,
		repeatRule = repeatRule,
		notificationSessionKey = notificationSessionKey,
		user = user,
	)
}

fun EncryptedAlarmNotificationEntity.decrypt(
	crypto: AndroidNativeCryptoFacade,
	sessionKey: ByteArray
): AlarmNotification {
	return AlarmNotification(
		summary = crypto.decryptString(summary!!, sessionKey),
		eventStart = crypto.decryptDate(eventStart!!, sessionKey),
		eventEnd = crypto.decryptDate(eventEnd!!, sessionKey),
		alarmInfo = alarmInfo.decrypt(crypto, sessionKey),
		repeatRule = repeatRule?.decrypt(crypto, sessionKey),
		user = user!!,
	)
}