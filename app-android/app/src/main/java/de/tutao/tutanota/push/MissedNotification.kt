package de.tutao.tutanota.push

import de.tutao.tutanota.alarms.EncryptedAlarmNotification
import kotlinx.serialization.Serializable

@Serializable
data class MissedNotification(
		val alarmNotifications: List<EncryptedAlarmNotification>,
		val notificationInfos: List<NotificationInfo>,
		val lastProcessedNotificationId: String,
)