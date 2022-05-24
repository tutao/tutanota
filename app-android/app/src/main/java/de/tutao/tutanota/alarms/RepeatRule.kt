package de.tutao.tutanota.alarms

import de.tutao.tutanota.Crypto
import de.tutao.tutanota.CryptoError
import de.tutao.tutanota.decryptNumber
import de.tutao.tutanota.decryptString
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
		val frequencyNumber = crypto.decryptNumber(frequency, sessionKey)
		return RepeatPeriod[frequencyNumber]
	}

	@Throws(CryptoError::class)
	fun getIntervalDec(crypto: Crypto, sessionKey: ByteArray): Int {
		return crypto.decryptNumber(interval, sessionKey).toInt()
	}

	@Throws(CryptoError::class)
	fun getTimeZoneDec(crypto: Crypto, sessionKey: ByteArray): TimeZone {
		val timeZoneString = crypto.decryptString(timeZone, sessionKey)
		return TimeZone.getTimeZone(timeZoneString)
	}

	@Throws(CryptoError::class)
	fun getEndTypeDec(crypto: Crypto, sessionKey: ByteArray): EndType {
		val endTypeNumber = crypto.decryptNumber(endType, sessionKey)
		return EndType[endTypeNumber]
	}

	@Throws(CryptoError::class)
	fun getEndValueDec(crypto: Crypto, sessionKey: ByteArray): Long {
		return if (endValue == null) {
			0
		} else crypto.decryptNumber(endValue, sessionKey)
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