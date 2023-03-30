/* generated file, don't edit. */

import { EncryptedAlarmNotification } from "./EncryptedAlarmNotification.js"
import { NativePushFacade } from "./NativePushFacade.js"

export class NativePushFacadeReceiveDispatcher {
	constructor(private readonly facade: NativePushFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "getPushIdentifier": {
				return this.facade.getPushIdentifier()
			}
			case "storePushIdentifierLocally": {
				const identifier: string = arg[0]
				const userId: string = arg[1]
				const sseOrigin: string = arg[2]
				const pushIdentifierId: string = arg[3]
				const pushIdentifierSessionKey: Uint8Array = arg[4]
				return this.facade.storePushIdentifierLocally(identifier, userId, sseOrigin, pushIdentifierId, pushIdentifierSessionKey)
			}
			case "initPushNotifications": {
				return this.facade.initPushNotifications()
			}
			case "closePushNotifications": {
				const addressesArray: ReadonlyArray<string> = arg[0]
				return this.facade.closePushNotifications(addressesArray)
			}
			case "scheduleAlarms": {
				const alarms: ReadonlyArray<EncryptedAlarmNotification> = arg[0]
				return this.facade.scheduleAlarms(alarms)
			}
			case "invalidateAlarmsForUser": {
				const userId: string = arg[0]
				return this.facade.invalidateAlarmsForUser(userId)
			}
		}
	}
}
