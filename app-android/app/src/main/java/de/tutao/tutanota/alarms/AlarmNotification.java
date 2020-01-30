package de.tutao.tutanota.alarms;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.Embedded;
import androidx.room.Entity;
import androidx.room.TypeConverter;
import androidx.room.TypeConverters;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collection;
import java.util.Date;
import java.util.Objects;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.EncryptionUtils;
import de.tutao.tutanota.IdTuple;
import de.tutao.tutanota.OperationType;

@Entity(primaryKeys = "identifier")
@TypeConverters(AlarmNotification.OperationTypeConverter.class)
public class AlarmNotification {
	private OperationType operation;
	private String summary;
	private String eventStart;
	private String eventEnd;
	@Embedded
	@NonNull
	private AlarmInfo alarmInfo;
	@Embedded
	private RepeatRule repeatRule;
	@Embedded(prefix = "key")
	private NotificationSessionKey notificationSessionKey;
	private String user;

	public AlarmNotification(OperationType operation, String summary, String eventStart, String eventEnd,
							 AlarmInfo alarmInfo,
							 RepeatRule repeatRule,
							 @Nullable NotificationSessionKey notificationSessionKey, // in case of a delete operation there is no session key
							 String user) {
		this.operation = operation;
		this.summary = summary;
		this.eventStart = eventStart;
		this.eventEnd = eventEnd;
		this.alarmInfo = alarmInfo;
		this.repeatRule = repeatRule;
		this.notificationSessionKey = notificationSessionKey;
		this.user = user;
	}

	public static AlarmNotification fromJson(JSONObject jsonObject, Collection<String> pushIdentifierIds) throws JSONException {
		OperationType operationType = OperationType.values()[jsonObject.getInt("operation")];
		String summaryEnc = jsonObject.getString("summary");
		String eventStartEnc = jsonObject.getString("eventStart");
		String eventEndEnc = jsonObject.getString("eventEnd");
		RepeatRule repeatRule;
		if (jsonObject.isNull("repeatRule")) {
			repeatRule = null;
		} else {
			repeatRule = RepeatRule.fromJson(jsonObject.getJSONObject("repeatRule"));
		}
		AlarmInfo alarmInfo = AlarmInfo.fromJson(jsonObject.getJSONObject("alarmInfo"));
		JSONArray notificationSessionKeysJSON = jsonObject.getJSONArray("notificationSessionKeys");

		NotificationSessionKey notificationSessionKey = null;
		if (notificationSessionKeysJSON.length() == 1) {
			notificationSessionKey = NotificationSessionKey.fromJson(notificationSessionKeysJSON.getJSONObject(0));
		} else {
			for (int i = 0; i < notificationSessionKeysJSON.length(); i++) {
				NotificationSessionKey sessionKey = NotificationSessionKey.fromJson(notificationSessionKeysJSON.getJSONObject(i));
				if (pushIdentifierIds.contains(sessionKey.getPushIdentifier().getElementId())) {
					notificationSessionKey = sessionKey;
					break;
				}
			}
		}

		String user = jsonObject.getString("user");
		return new AlarmNotification(operationType, summaryEnc, eventStartEnc, eventEndEnc, alarmInfo,
				repeatRule, notificationSessionKey, user);
	}

	public OperationType getOperation() {
		return operation;
	}

	public Date getEventStartDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return EncryptionUtils.decryptDate(this.eventStart, crypto, sessionKey);

	}

	public Date getEventEndDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return EncryptionUtils.decryptDate(this.eventEnd, crypto, sessionKey);

	}

	public String getSummaryDec(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return EncryptionUtils.decryptString(this.summary, crypto, sessionKey);
	}

	public RepeatRule getRepeatRule() {
		return repeatRule;
	}

	public AlarmInfo getAlarmInfo() {
		return alarmInfo;
	}

	public String getSummary() {
		return summary;
	}

	public String getEventStart() {
		return eventStart;
	}

	public String getEventEnd() {
		return eventEnd;
	}

	@Nullable
	public NotificationSessionKey getNotificationSessionKey() {
		return notificationSessionKey;
	}

	public String getUser() {
		return user;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		AlarmNotification that = (AlarmNotification) o;
		return Objects.equals(alarmInfo.getIdentifier(), that.alarmInfo.getIdentifier());
	}

	@Override
	public int hashCode() {
		return Objects.hash(alarmInfo.getIdentifier());
	}

	public static class NotificationSessionKey {
		@Embedded
		private final IdTuple pushIdentifier;
		private final String pushIdentifierSessionEncSessionKey;


		public static NotificationSessionKey fromJson(JSONObject jsonObject) throws JSONException {
			JSONArray id = jsonObject.getJSONArray("pushIdentifier");
			return new NotificationSessionKey(
					new IdTuple(id.getString(0), id.getString(1)),
					jsonObject.getString("pushIdentifierSessionEncSessionKey")
			);
		}

		public NotificationSessionKey(IdTuple pushIdentifier,
									  String pushIdentifierSessionEncSessionKey) {
			this.pushIdentifier = pushIdentifier;
			this.pushIdentifierSessionEncSessionKey = pushIdentifierSessionEncSessionKey;
		}

		public IdTuple getPushIdentifier() {
			return pushIdentifier;
		}

		public String getPushIdentifierSessionEncSessionKey() {
			return pushIdentifierSessionEncSessionKey;
		}
	}

	public static class OperationTypeConverter {
		@TypeConverter
		public OperationType fromNumber(int number) {
			return OperationType.values()[number];
		}

		@TypeConverter
		public int numberToOperationType(OperationType operationType) {
			return operationType.ordinal();
		}
	}
}
