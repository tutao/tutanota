package de.tutao.tutanota.alarms;

import de.tutao.tutanota.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

public class AlarmNotification {

	private OperationType operation;
	private String summary;
	private String eventStart;
	private String eventEnd;
	private AlarmInfo alarmInfo;
	private RepeatRule repeatRule;
	private List<NotificationSessionKey> notificationSessionKeys;
	private String user;

	private JSONObject originalJson;

	public AlarmNotification(OperationType operation, String summaryEnc, String eventStart, String eventEnd,
							 AlarmInfo alarmInfo,
							 RepeatRule repeatRule,
							 List<NotificationSessionKey> notificationSessionKeys,
							 String user,
							 JSONObject originalJson) {
		this.operation = operation;
		this.summary = summaryEnc;
		this.eventStart = eventStart;
		this.eventEnd = eventEnd;
		this.alarmInfo = alarmInfo;
		this.repeatRule = repeatRule;
		this.notificationSessionKeys = notificationSessionKeys;
		this.user = user;
		this.originalJson = originalJson;
	}

	public static AlarmNotification fromJson(JSONObject jsonObject) throws JSONException {
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
		List<NotificationSessionKey> notificationSessionKeys = new ArrayList<>();
		for (int i = 0; i < notificationSessionKeysJSON.length(); i++) {
			notificationSessionKeys.add(NotificationSessionKey.fromJson(notificationSessionKeysJSON.getJSONObject(i)));
		}
		String user = jsonObject.getString("user");
		return new AlarmNotification(operationType, summaryEnc, eventStartEnc, eventEndEnc, alarmInfo,
				repeatRule, notificationSessionKeys, user, jsonObject);
	}

	public JSONObject toJSON() {
		return originalJson;
	}

	public OperationType getOperation() {
		return operation;
	}

	public Date getEventStart(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return EncryptionUtils.decryptDate(this.eventStart, crypto, sessionKey);

	}

	public Date getEventEnd(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return EncryptionUtils.decryptDate(this.eventEnd, crypto, sessionKey);

	}

	public String getSummary(Crypto crypto, byte[] sessionKey) throws CryptoError {
		return EncryptionUtils.decryptString(this.summary, crypto, sessionKey);
	}

	public RepeatRule getRepeatRule() {
		return repeatRule;
	}

	public AlarmInfo getAlarmInfo() {
		return alarmInfo;
	}

	public List<NotificationSessionKey> getNotificationSessionKeys() {
		return notificationSessionKeys;
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
}
