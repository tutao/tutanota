package de.tutao.tutanota.alarms

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import de.tutao.tutanota.*
import de.tutao.tutanota.alarms.AlarmNotification.OperationTypeConverter
import org.json.JSONException
import org.json.JSONObject
import java.util.*

@Entity(primaryKeys = ["identifier"])
@TypeConverters(OperationTypeConverter::class)
class AlarmNotification(
	val operation: OperationType,
	val summary: String,
	val eventStart: String,
	val eventEnd: String,
	@field:Embedded val alarmInfo: AlarmInfo,
	@field:Embedded val repeatRule: RepeatRule?,
		// in case of a delete operation there is no session key
	@field:Embedded(prefix = "key") val notificationSessionKey: NotificationSessionKey?,
	val user: String,
) {

	@Throws(CryptoError::class)
	fun getEventStartDec(crypto: Crypto, sessionKey: ByteArray): Date {
		return EncryptionUtils.decryptDate(eventStart, crypto, sessionKey)
	}

	@Throws(CryptoError::class)
	fun getEventEndDec(crypto: Crypto, sessionKey: ByteArray): Date {
		return EncryptionUtils.decryptDate(eventEnd, crypto, sessionKey)
	}

	@Throws(CryptoError::class)
	fun getSummaryDec(crypto: Crypto, sessionKey: ByteArray): String {
		return EncryptionUtils.decryptString(summary, crypto, sessionKey)
	}

	override fun equals(other: Any?): Boolean {
		if (this === other) return true
		if (other == null || javaClass != other.javaClass) return false
		val that = other as AlarmNotification
		return alarmInfo.identifier == that.alarmInfo.identifier
	}

	override fun hashCode(): Int {
		return Objects.hash(alarmInfo.identifier)
	}

	class NotificationSessionKey(
		@field:Embedded val pushIdentifier: IdTuple,
		val pushIdentifierSessionEncSessionKey: String,
	) {

		companion object {
			@Throws(JSONException::class)
			fun fromJson(jsonObject: JSONObject): NotificationSessionKey {
				val id = jsonObject.getJSONArray("pushIdentifier")
				return NotificationSessionKey(
						IdTuple(id.getString(0), id.getString(1)),
						jsonObject.getString("pushIdentifierSessionEncSessionKey")
				)
			}
		}
	}

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

	companion object {
		@Throws(JSONException::class)
		fun fromJson(jsonObject: JSONObject, pushIdentifierIds: Collection<String?>): AlarmNotification {
			val operationType = OperationType.values()[jsonObject.getInt("operation")]
			val summaryEnc = jsonObject.getString("summary")
			val eventStartEnc = jsonObject.getString("eventStart")
			val eventEndEnc = jsonObject.getString("eventEnd")
			val repeatRule: RepeatRule? = if (jsonObject.isNull("repeatRule")) {
				null
			} else {
				RepeatRule.fromJson(jsonObject.getJSONObject("repeatRule"))
			}
			val alarmInfo: AlarmInfo = AlarmInfo.fromJson(jsonObject.getJSONObject("alarmInfo"))
			val notificationSessionKeysJSON = jsonObject.getJSONArray("notificationSessionKeys")
			var notificationSessionKey: NotificationSessionKey? = null
			if (notificationSessionKeysJSON.length() == 1) {
				notificationSessionKey = NotificationSessionKey.fromJson(notificationSessionKeysJSON.getJSONObject(0))
			} else {
				for (i in 0 until notificationSessionKeysJSON.length()) {
					val sessionKey = NotificationSessionKey.fromJson(notificationSessionKeysJSON.getJSONObject(i))
					if (pushIdentifierIds.contains(sessionKey.pushIdentifier.elementId)) {
						notificationSessionKey = sessionKey
						break
					}
				}
			}
			val user = jsonObject.getString("user")
			return AlarmNotification(operationType, summaryEnc, eventStartEnc, eventEndEnc, alarmInfo,
					repeatRule, notificationSessionKey, user)
		}
	}
}