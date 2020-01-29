package de.tutao.tutanota.push;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import de.tutao.tutanota.alarms.AlarmNotification;

public final class MissedNotification {
	private final List<AlarmNotification> alarmNotifications;
	private final List<PushMessage.NotificationInfo> notificationInfos;
	private final String lastProcessedNotificationId;

	public static MissedNotification fromJson(JSONObject jsonObject) throws JSONException {
		JSONArray alarmNotificationsJson = jsonObject.getJSONArray("alarmNotifications");
		List<AlarmNotification> alarmNotifications = new ArrayList<>(alarmNotificationsJson.length());
		for (int i = 0; i < alarmNotificationsJson.length(); i++) {
			alarmNotifications.add(AlarmNotification.fromJson(alarmNotificationsJson.getJSONObject(i)));
		}
		JSONArray notificationInfosJson = jsonObject.getJSONArray("notificationInfos");
		List<PushMessage.NotificationInfo> notificationInfos = new ArrayList<>(notificationInfosJson.length());
		for (int i = 0; i < notificationInfosJson.length(); i++) {
			notificationInfos.add(PushMessage.NotificationInfo.fromJson(notificationInfosJson.getJSONObject(i), "mailAddress"));
		}
		String lastProcessedNotificationId = jsonObject.getString("lastProcessedNotificationId");
		return new MissedNotification(alarmNotifications, notificationInfos, lastProcessedNotificationId);
	}

	private MissedNotification(List<AlarmNotification> alarmNotifications,
							   List<PushMessage.NotificationInfo> notificationInfos,
							   String lastProcessedNotificationId) {
		this.alarmNotifications = alarmNotifications;
		this.notificationInfos = notificationInfos;
		this.lastProcessedNotificationId = lastProcessedNotificationId;
	}

	public List<AlarmNotification> getAlarmNotifications() {
		return alarmNotifications;
	}

	public List<PushMessage.NotificationInfo> getNotificationInfos() {
		return notificationInfos;
	}

	public String getLastProcessedNotificationId() {
		return lastProcessedNotificationId;
	}
}
