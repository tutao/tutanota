package de.tutao.drive

import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.ExtendedNotificationMode
import de.tutao.tutashared.ipc.NativePushFacade

object AndroidNativePushFacadeStub : NativePushFacade {
	override suspend fun getPushIdentifier(): String? {
		TODO("Not yet implemented")
	}

	override suspend fun storePushIdentifierLocally(
		identifier: String,
		userId: String,
		sseOrigin: String,
		pushIdentifierId: String,
		pushIdentifierSessionKey: DataWrapper
	) {
		TODO("Not yet implemented")
	}

	override suspend fun removeUser(userId: String) {
		TODO("Not yet implemented")
	}

	override suspend fun initPushNotifications() {
		TODO("Not yet implemented")
	}

	override suspend fun closePushNotifications(addressesArray: List<String>) {
		TODO("Not yet implemented")
	}

	override suspend fun scheduleAlarms(alarmNotificationsWireFormat: String, newDeviceSessionKey: String) {
		TODO("Not yet implemented")
	}

	override suspend fun invalidateAlarmsForUser(userId: String) {
		TODO("Not yet implemented")
	}

	override suspend fun setExtendedNotificationConfig(userId: String, mode: ExtendedNotificationMode) {
		TODO("Not yet implemented")
	}

	override suspend fun getExtendedNotificationConfig(userId: String): ExtendedNotificationMode {
		TODO("Not yet implemented")
	}

	override suspend fun setReceiveCalendarNotificationConfig(pushIdentifier: String, value: Boolean) {
		TODO("Not yet implemented")
	}

	override suspend fun getReceiveCalendarNotificationConfig(pushIdentifier: String): Boolean {
		TODO("Not yet implemented")
	}
}