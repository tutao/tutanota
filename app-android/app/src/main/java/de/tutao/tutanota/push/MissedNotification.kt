package de.tutao.tutanota.push

import de.tutao.tutanota.alarms.EncryptedAlarmNotification
import kotlinx.serialization.Serializable

@Serializable
data class MissedNotification(
	val notificationInfos: List<NotificationInfo>,
	val alarmNotifications: List<EncryptedAlarmNotification>,
	val lastProcessedNotificationId: String,
)