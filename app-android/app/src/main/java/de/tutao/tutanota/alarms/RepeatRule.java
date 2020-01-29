package de.tutao.tutanota.alarms;

import androidx.annotation.Nullable;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.TimeZone;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.EncryptionUtils;

public final class RepeatRule {
	private final String frequency;
	private final String interval;
	private final String timeZone;
	@Nullable
	private String endType;
	@Nullable
	private String endValue;

	static RepeatRule fromJson(JSONObject jsonObject) throws JSONException {
		return new RepeatRule(
				jsonObject.getString("frequency"),
				jsonObject.getString("interval"),
				jsonObject.getString("timeZone"),
				jsonObject.getString("endType"),
				jsonObject.isNull("endValue") ? null : jsonObject.getString("endValue")
		);
	}

	public RepeatRule(String frequency, String interval, String timeZone, @Nullable String endType,
					  @Nullable String endValue) {
		this.frequency = frequency;
		this.interval = interval;
		this.timeZone = timeZone;
		this.endType = endType;
		this.endValue = endValue;
	}


	public RepeatPeriod getFrequencyDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
		long frequencyNumber = EncryptionUtils.decryptNumber(frequency, crypto, sessionKey);
		return RepeatPeriod.get(frequencyNumber);
	}

	public int getIntervalDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return (int) EncryptionUtils.decryptNumber(interval, crypto, sessionKey);
	}

	public TimeZone getTimeZoneDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
		String timeZoneString = EncryptionUtils.decryptString(timeZone, crypto, sessionKey);
		return TimeZone.getTimeZone(timeZoneString);
	}

	@Nullable
	public EndType getEndTypeDec(Crypto crypto, byte[] sesionKey) throws CryptoError {
		if (this.endType == null) {
			return null;
		}
		long endTypeNumber = EncryptionUtils.decryptNumber(endType, crypto, sesionKey);
		return EndType.get(endTypeNumber);
	}

	public long getEndValueDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
		if (this.endValue == null) {
			return 0;
		}
		return EncryptionUtils.decryptNumber(endValue, crypto, sessionKey);
	}

	public String getFrequency() {
		return frequency;
	}

	public String getInterval() {
		return interval;
	}

	public String getTimeZone() {
		return timeZone;
	}

	@Nullable
	public String getEndType() {
		return endType;
	}

	@Nullable
	public String getEndValue() {
		return endValue;
	}
}



