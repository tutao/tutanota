/* generated file, don't edit. */

import {EncryptedAlarmNotification} from "./EncryptedAlarmNotification.js"
import {NativePushFacade} from "./NativePushFacade.js"

export class NativePushFacadeReceiveDispatcher {
	constructor(private readonly facade: NativePushFacade) {}
	async dispatch(method: string, arg: Array<any>) : Promise<any> {
		switch(method) {
			case "getPushIdentifier": {
				const userId: string = arg[0]
				const mailAddress: string = arg[1]
				return this.facade.getPushIdentifier(
					userId,
					mailAddress,
				)
			}
			case "storePushIdentifierLocally": {
				const identifier: string = arg[0]
				const userId: string = arg[1]
				const sseOrigin: string = arg[2]
				const pushIdentifierId: string = arg[3]
				const pushIdentifierSessionKeyB64: string = arg[4]
				return this.facade.storePushIdentifierLocally(
					identifier,
					userId,
					sseOrigin,
					pushIdentifierId,
					pushIdentifierSessionKeyB64,
				)
			}
			case "initPushNotifications": {
				return this.facade.initPushNotifications(
				)
			}
			case "closePushNotifications": {
				const addressesArray: ReadonlyArray<string> = arg[0]
				return this.facade.closePushNotifications(
					addressesArray,
				)
			}
			case "scheduleAlarms": {
				const alarms: ReadonlyArray<EncryptedAlarmNotification> = arg[0]
				return this.facade.scheduleAlarms(
					alarms,
				)
			}
		}
	}
}
