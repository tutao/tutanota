package de.tutao.tutanota.push

import de.tutao.tutanota.alarms.AlarmNotification
import org.json.JSONObject

class MissedNotification private constructor(
		val alarmNotifications: List<AlarmNotification>,
		val notificationInfos: List<NotificationInfo>,
		val lastProcessedNotificationId: String,
) {
	companion object {
		fun fromJson(jsonObject: JSONObject): MissedNotification {
			val alarmNotificationsJson = jsonObject.getJSONArray("alarmNotifications")
			val alarmNotifications: MutableList<AlarmNotification> = ArrayList(alarmNotificationsJson.length())
			for (i in 0 until alarmNotificationsJson.length()) {
				alarmNotifications.add(
						AlarmNotification.fromJson(
								alarmNotificationsJson.getJSONObject(i),
								emptyList<String>()
						)
				)
			}
			val notificationInfosJson = jsonObject.getJSONArray("notificationInfos")
			val notificationInfos: MutableList<NotificationInfo> = ArrayList(notificationInfosJson.length())
			for (i in 0 until notificationInfosJson.length()) {
				notificationInfos.add(NotificationInfo.fromJson(notificationInfosJson.getJSONObject(i), "mailAddress"))
			}
			val lastProcessedNotificationId = jsonObject.getString("lastProcessedNotificationId")
			return MissedNotification(alarmNotifications, notificationInfos, lastProcessedNotificationId)
		}
	}
}