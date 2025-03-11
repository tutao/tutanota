package de.tutao.tutanota.push

import de.tutao.tutashared.alarms.EncryptedAlarmNotification
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonNames

@Serializable
data class MissedNotification(
	@SerialName("1702")
	val notificationInfos: List<NotificationInfo>,
	@SerialName("1703")
	val alarmNotifications: List<EncryptedAlarmNotification>,
	@SerialName("1722")
	val lastProcessedNotificationId: String,
)