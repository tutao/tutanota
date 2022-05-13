package de.tutao.tutanota.alarms

import de.tutao.tutanota.Crypto
import de.tutao.tutanota.CryptoError
import de.tutao.tutanota.EncryptionUtils
import org.json.JSONException
import org.json.JSONObject
import java.util.*

class RepeatRule(
	val frequency: String,
	val interval: String,
	val timeZone: String,
	val endType: String,
	val endValue: String?,
) {
	@Throws(CryptoError::class)
	fun getFrequencyDec(crypto: Crypto, sessionKey: ByteArray): RepeatPeriod {
		val frequencyNumber = EncryptionUtils.decryptNumber(frequency, crypto, sessionKey)
		return RepeatPeriod[frequencyNumber]
	}

	@Throws(CryptoError::class)
	fun getIntervalDec(crypto: Crypto, sessionKey: ByteArray): Int {
		return EncryptionUtils.decryptNumber(interval, crypto, sessionKey).toInt()
	}

	@Throws(CryptoError::class)
	fun getTimeZoneDec(crypto: Crypto, sessionKey: ByteArray): TimeZone {
		val timeZoneString = EncryptionUtils.decryptString(timeZone, crypto, sessionKey)
		return TimeZone.getTimeZone(timeZoneString)
	}

	@Throws(CryptoError::class)
	fun getEndTypeDec(crypto: Crypto, sessionKey: ByteArray): EndType {
		val endTypeNumber = EncryptionUtils.decryptNumber(endType, crypto, sessionKey)
		return EndType[endTypeNumber]
	}

	@Throws(CryptoError::class)
	fun getEndValueDec(crypto: Crypto, sessionKey: ByteArray): Long {
		return if (endValue == null) {
			0
		} else EncryptionUtils.decryptNumber(endValue, crypto, sessionKey)
	}

	companion object {
		@Throws(JSONException::class)
		fun fromJson(jsonObject: JSONObject): RepeatRule {
			return RepeatRule(
					jsonObject.getString("frequency"),
					jsonObject.getString("interval"),
					jsonObject.getString("timeZone"),
					jsonObject.getString("endType"),
					if (jsonObject.isNull("endValue")) null else jsonObject.getString("endValue")
			)
		}
	}
}