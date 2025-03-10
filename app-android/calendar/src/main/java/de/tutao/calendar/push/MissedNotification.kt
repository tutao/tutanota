package de.tutao.calendar.push

import de.tutao.tutashared.alarms.EncryptedAlarmNotification
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MissedNotification(
	@SerialName("1702")
	val notificationInfos: List<NotificationInfo>,
	@SerialName("1703")
	val alarmNotifications: List<EncryptedAlarmNotification>,
	@SerialName("1722")
	val lastProcessedNotificationId: String,
)