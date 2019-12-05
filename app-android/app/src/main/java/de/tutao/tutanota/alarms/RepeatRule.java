package de.tutao.tutanota.alarms;

import android.support.annotation.Nullable;
import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.EncryptionUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.TimeZone;

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


	public RepeatPeriod getFrequency(Crypto crypto, byte[] sessionKey) throws CryptoError {
		long frequencyNumber = EncryptionUtils.decryptNumber(frequency, crypto, sessionKey);
		return RepeatPeriod.get(frequencyNumber);
	}

	public int getInterval(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return (int) EncryptionUtils.decryptNumber(interval, crypto, sessionKey);
	}

	public TimeZone getTimeZone(Crypto crypto, byte[] sessionKey) throws CryptoError {
		String timeZoneString = EncryptionUtils.decryptString(timeZone, crypto, sessionKey);
		return TimeZone.getTimeZone(timeZoneString);
	}

	@Nullable
	public EndType getEndType(Crypto crypto, byte[] sesionKey) throws CryptoError {
		if (this.endType == null) {
			return null;
		}
		long endTypeNumber = EncryptionUtils.decryptNumber(endType, crypto, sesionKey);
		return EndType.get(endTypeNumber);
	}

	public long getEndValue(Crypto crypto, byte[] sessionKey) throws CryptoError {
		if (this.endValue == null) {
			return 0;
		}
		return EncryptionUtils.decryptNumber(endValue, crypto, sessionKey);
	}
}



