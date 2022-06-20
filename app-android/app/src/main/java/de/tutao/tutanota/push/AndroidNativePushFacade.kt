package de.tutao.tutanota.push

import de.tutao.tutanota.MainActivity
import de.tutao.tutanota.alarms.AlarmNotificationsManager
import de.tutao.tutanota.ipc.DataWrapper
import de.tutao.tutanota.ipc.EncryptedAlarmNotification
import de.tutao.tutanota.ipc.NativePushFacade
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AndroidNativePushFacade(
		private val activity: MainActivity,
		private val sseStorage: SseStorage,
		private val alarmNotificationsManager: AlarmNotificationsManager,
) : NativePushFacade {

	override suspend fun getPushIdentifier(userId: String, mailAddress: String): String? {
		return sseStorage.getPushIdentifier()
	}

	override suspend fun storePushIdentifierLocally(identifier: String, userId: String, sseOrigin: String, pushIdentifierId: String, pushIdentifierSessionKey: DataWrapper) {
		sseStorage.storePushIdentifier(identifier, sseOrigin)
		sseStorage.storePushIdentifierSessionKey(userId, pushIdentifierId, pushIdentifierSessionKey.data)
	}

	override suspend fun initPushNotifications() {
		withContext(Dispatchers.Main) {
			activity.askBatteryOptimizationsIfNeeded()
			activity.setupPushNotifications()
		}
	}

	override suspend fun closePushNotifications(addressesArray: List<String>) {
		activity.startService(
				LocalNotificationsFacade.notificationDismissedIntent(
						activity,
						ArrayList(addressesArray), "Native", false
				)
		)
	}

	override suspend fun scheduleAlarms(alarms: List<EncryptedAlarmNotification>) {
		alarmNotificationsManager.scheduleNewAlarms(alarms)
	}
}