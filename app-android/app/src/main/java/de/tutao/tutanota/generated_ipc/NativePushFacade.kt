/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface NativePushFacade {
	 suspend fun getPushIdentifier(
		userId: String,
		mailAddress: String,
	): String?
	 suspend fun storePushIdentifierLocally(
		identifier: String,
		userId: String,
		sseOrigin: String,
		pushIdentifierId: String,
		pushIdentifierSessionKey: DataWrapper,
	): Unit
	 suspend fun initPushNotifications(
	): Unit
	 suspend fun closePushNotifications(
		addressesArray: List<String>,
	): Unit
	 suspend fun scheduleAlarms(
		alarms: List<EncryptedAlarmNotification>,
	): Unit
}
