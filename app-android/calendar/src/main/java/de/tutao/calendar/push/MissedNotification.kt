package de.tutao.calendar.push

import de.tutao.tutashared.alarms.EncryptedAlarmNotification
import kotlinx.serialization.Serializable

@Serializable
data class MissedNotification(
	val notificationInfos: List<NotificationInfo>,
	val alarmNotifications: List<EncryptedAlarmNotification>,
	val lastProcessedNotificationId: String,
)