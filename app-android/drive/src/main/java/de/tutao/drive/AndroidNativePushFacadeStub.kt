package de.tutao.drive

import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.ExtendedNotificationMode
import de.tutao.tutashared.ipc.NativePushFacade

object AndroidNativePushFacadeStub : NativePushFacade {
	override suspend fun getPushIdentifier(): String? {
		throw NotImplementedError()
	}

	override suspend fun storePushIdentifierLocally(
		identifier: String,
		userId: String,
		sseOrigin: String,
		pushIdentifierId: String,
		pushIdentifierSessionKey: DataWrapper
	) {
		throw NotImplementedError()
	}

	override suspend fun removeUser(userId: String) {
		throw NotImplementedError()
	}

	override suspend fun initPushNotifications() {
		throw NotImplementedError()
	}

	override suspend fun closePushNotifications(addressesArray: List<String>) {
		throw NotImplementedError()
	}

	override suspend fun scheduleAlarms(alarmNotificationsWireFormat: String, newDeviceSessionKey: String) {
		throw NotImplementedError()
	}

	override suspend fun invalidateAlarmsForUser(userId: String) {
		throw NotImplementedError()
	}

	override suspend fun setExtendedNotificationConfig(userId: String, mode: ExtendedNotificationMode) {
		throw NotImplementedError()
	}

	override suspend fun getExtendedNotificationConfig(userId: String): ExtendedNotificationMode {
		throw NotImplementedError()
	}

	override suspend fun setReceiveCalendarNotificationConfig(pushIdentifier: String, value: Boolean) {
		throw NotImplementedError()
	}

	override suspend fun getReceiveCalendarNotificationConfig(pushIdentifier: String): Boolean {
		throw NotImplementedError()
	}
}