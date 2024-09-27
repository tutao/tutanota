/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Push notifications and alarms operations
 */
interface NativePushFacade {
	suspend fun getPushIdentifier(
	): String?
	suspend fun storePushIdentifierLocally(
		identifier: String,
		userId: String,
		sseOrigin: String,
		pushIdentifierId: String,
		pushIdentifierSessionKey: DataWrapper,
	): Unit
	suspend fun removeUser(
		userId: String,
	): Unit
	/**
	 * Called at some point after login to initialize push notifications.
	 */
	suspend fun initPushNotifications(
	): Unit
	suspend fun closePushNotifications(
		addressesArray: List<String>,
	): Unit
	suspend fun scheduleAlarms(
		alarms: List<EncryptedAlarmNotification>,
	): Unit
	/**
	 * Unschedule and remove alarms belonging to a specific user from the persistent storage
	 */
	suspend fun invalidateAlarmsForUser(
		userId: String,
	): Unit
	suspend fun setExtendedNotificationConfig(
		userId: String,
		mode: ExtendedNotificationMode,
	): Unit
	suspend fun getExtendedNotificationConfig(
		userId: String,
	): ExtendedNotificationMode
	/**
	 * Set user preference for receiving calendar notifications in the mail app using pushIdentifier since it represents the device of a user.
	 */
	suspend fun setReceiveCalendarNotificationConfig(
		pushIdentifier: String,
		value: Boolean,
	): Unit
	suspend fun getReceiveCalendarNotificationConfig(
		pushIdentifier: String,
	): Boolean
}
