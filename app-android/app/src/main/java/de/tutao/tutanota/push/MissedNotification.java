package de.tutao.tutanota.push;

import de.tutao.tutanota.alarms.AlarmNotification;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public final class MissedNotification {
	private final List<AlarmNotification> alarmNotifications;
	private final List<PushMessage.NotificationInfo> notificationInfos;
	private final String changeTime;
	private final String confirmationId;

	public static MissedNotification fromJson(JSONObject jsonObject) throws JSONException {
		JSONArray alarmNotificationsJson = jsonObject.getJSONArray("alarmNotifications");
		List<AlarmNotification> alarmNotifications = new ArrayList<>(alarmNotificationsJson.length());
		for (int i = 0; i < alarmNotificationsJson.length(); i++) {
			alarmNotifications.add(AlarmNotification.fromJson(alarmNotificationsJson.getJSONObject(i)));
		}
		JSONArray notificationInfosJson = jsonObject.getJSONArray("notificationInfos");
		List<PushMessage.NotificationInfo> notificationInfos = new ArrayList<>(notificationInfosJson.length());
		for (int i = 0; i < notificationInfosJson.length(); i++) {
			notificationInfos.add(PushMessage.NotificationInfo.fromJson(notificationInfosJson.getJSONObject(i)));
		}
		String changeTime = jsonObject.getString("changeTime");
		String confirmationId = jsonObject.getString("confirmationId");
		return new MissedNotification(alarmNotifications, notificationInfos, changeTime, confirmationId);
	}

	private MissedNotification(List<AlarmNotification> alarmNotifications,
							   List<PushMessage.NotificationInfo> notificationInfos, String changeTime, String confirmationId) {
		this.alarmNotifications = alarmNotifications;
		this.notificationInfos = notificationInfos;
		this.changeTime = changeTime;
		this.confirmationId = confirmationId;
	}

	public List<AlarmNotification> getAlarmNotifications() {
		return alarmNotifications;
	}

	public List<PushMessage.NotificationInfo> getNotificationInfos() {
		return notificationInfos;
	}

	public String getChangeTime() {
		return changeTime;
	}

	public String getConfirmationId() {
		return confirmationId;
	}
}
