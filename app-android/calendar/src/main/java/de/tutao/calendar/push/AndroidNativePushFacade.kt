package de.tutao.calendar.push

import android.util.Log
import de.tutao.calendar.MainActivity
import de.tutao.calendar.alarms.AlarmNotificationsManager
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.EncryptedAlarmNotification
import de.tutao.tutashared.ipc.ExtendedNotificationMode
import de.tutao.tutashared.ipc.NativePushFacade
import de.tutao.tutashared.push.SseStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AndroidNativePushFacade(
	private val activity: MainActivity,
	private val sseStorage: SseStorage,
	private val alarmNotificationsManager: AlarmNotificationsManager,
	private val localNotificationsFacade: LocalNotificationsFacade,
) : NativePushFacade {

	override suspend fun getPushIdentifier(): String? {
		return sseStorage.getPushIdentifier()
	}

	override suspend fun storePushIdentifierLocally(
		identifier: String,
		userId: String,
		sseOrigin: String,
		pushIdentifierId: String,
		pushIdentifierSessionKey: DataWrapper
	) {
		sseStorage.storePushIdentifier(identifier, sseOrigin)
		sseStorage.storePushIdentifierSessionKey(userId, pushIdentifierId, pushIdentifierSessionKey.data)
	}

	override suspend fun initPushNotifications() {
		withContext(Dispatchers.Main) {
			activity.setupPushNotifications()
		}
	}

	override suspend fun closePushNotifications(addressesArray: List<String>) {
		localNotificationsFacade.dismissNotifications(addressesArray)
	}

	override suspend fun scheduleAlarms(alarms: List<EncryptedAlarmNotification>) {
		alarmNotificationsManager.scheduleNewAlarms(alarms)
	}

	override suspend fun invalidateAlarmsForUser(userId: String) {
		alarmNotificationsManager.unscheduleAlarms(userId)
	}

	override suspend fun setExtendedNotificationConfig(userId: String, mode: ExtendedNotificationMode) {
		this.sseStorage.setExtendedNotificationConfig(userId, mode)
	}

	override suspend fun getExtendedNotificationConfig(userId: String): ExtendedNotificationMode {
		return this.sseStorage.getExtendedNotificationConfig(userId)
	}

	override suspend fun setReceiveCalendarNotificationConfig(pushIdentifier: String, value: Boolean) {
		Log.w(TAG, "Calendar App should NOT deal with this config")
	}

	override suspend fun getReceiveCalendarNotificationConfig(pushIdentifier: String): Boolean {
		return true
	}

	override suspend fun removeUser(userId: String) {
		this.sseStorage.removeUser(userId)
	}

	companion object {
		const val TAG = "NativePushFacade"
	}
}