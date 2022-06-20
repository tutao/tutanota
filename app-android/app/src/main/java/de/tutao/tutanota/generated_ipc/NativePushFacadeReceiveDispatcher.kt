/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class NativePushFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: NativePushFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"getPushIdentifier" -> {
				val userId: String = json.decodeFromString(arg[0])
				val mailAddress: String = json.decodeFromString(arg[1])
				val result: String? = this.facade.getPushIdentifier(
					userId,
					mailAddress,
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
			else -> throw Error("unknown method for NativePushFacade: $method")
		}
	}
}
