package de.tutao.tutanota.push

internal data class LocalNotificationInfo(val message: String, val counter: Int, val notificationInfo: NotificationInfo) {
	fun incremented(by: Int): LocalNotificationInfo {
		return LocalNotificationInfo(message, counter + by, notificationInfo)
	}
}