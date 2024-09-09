/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class NativePushFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: NativePushFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"getPushIdentifier" -> {
				val result: String? = this.facade.getPushIdentifier(
				)
				return json.encodeToString(result)
			}
			"storePushIdentifierLocally" -> {
				val identifier: String = json.decodeFromString(arg[0])
				val userId: String = json.decodeFromString(arg[1])
				val sseOrigin: String = json.decodeFromString(arg[2])
				val pushIdentifierId: String = json.decodeFromString(arg[3])
				val pushIdentifierSessionKey: DataWrapper = json.decodeFromString(arg[4])
				val result: Unit = this.facade.storePushIdentifierLocally(
					identifier,
					userId,
					sseOrigin,
					pushIdentifierId,
					pushIdentifierSessionKey,
				)
				return json.encodeToString(result)
			}
			"removeUser" -> {
				val userId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.removeUser(
					userId,
				)
				return json.encodeToString(result)
			}
			"initPushNotifications" -> {
				val result: Unit = this.facade.initPushNotifications(
				)
				return json.encodeToString(result)
			}
			"closePushNotifications" -> {
				val addressesArray: List<String> = json.decodeFromString(arg[0])
				val result: Unit = this.facade.closePushNotifications(
					addressesArray,
				)
				return json.encodeToString(result)
			}
			"scheduleAlarms" -> {
				val alarms: List<EncryptedAlarmNotification> = json.decodeFromString(arg[0])
				val result: Unit = this.facade.scheduleAlarms(
					alarms,
				)
				return json.encodeToString(result)
			}
			"invalidateAlarmsForUser" -> {
				val userId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.invalidateAlarmsForUser(
					userId,
				)
				return json.encodeToString(result)
			}
			"setExtendedNotificationConfig" -> {
				val userId: String = json.decodeFromString(arg[0])
				val mode: ExtendedNotificationMode = json.decodeFromString(arg[1])
				val result: Unit = this.facade.setExtendedNotificationConfig(
					userId,
					mode,
				)
				return json.encodeToString(result)
			}
			"getExtendedNotificationConfig" -> {
				val userId: String = json.decodeFromString(arg[0])
				val result: ExtendedNotificationMode = this.facade.getExtendedNotificationConfig(
					userId,
				)
				return json.encodeToString(result)
			}
			"setReceiveCalendarNotificationConfig" -> {
				val pushIdentifier: String = json.decodeFromString(arg[0])
				val value: Boolean = json.decodeFromString(arg[1])
				val result: Unit = this.facade.setReceiveCalendarNotificationConfig(
					pushIdentifier,
					value,
				)
				return json.encodeToString(result)
			}
			"getReceiveCalendarNotificationConfig" -> {
				val pushIdentifier: String = json.decodeFromString(arg[0])
				val result: Boolean = this.facade.getReceiveCalendarNotificationConfig(
					pushIdentifier,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for NativePushFacade: $method")
		}
	}
}
