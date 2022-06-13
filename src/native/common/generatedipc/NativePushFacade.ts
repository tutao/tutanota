/* generated file, don't edit. */

import {EncryptedAlarmNotification} from "./EncryptedAlarmNotification.js"
export interface NativePushFacade {

	getPushIdentifier(
		userId: string,
		mailAddress: string,
	): Promise<string | null>
	
	storePushIdentifierLocally(
		identifier: string,
		userId: string,
		sseOrigin: string,
		pushIdentifierId: string,
		pushIdentifierSessionKeyB64: string,
	): Promise<void>
	
	initPushNotifications(
	): Promise<void>
	
	closePushNotifications(
		addressesArray: ReadonlyArray<string>,
	): Promise<void>
	
	scheduleAlarms(
		alarms: ReadonlyArray<EncryptedAlarmNotification>,
	): Promise<void>
	
}
