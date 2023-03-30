/* generated file, don't edit. */

import { EncryptedAlarmNotification } from "./EncryptedAlarmNotification.js"
/**
 * Push notifications and alarms operations
 */
export interface NativePushFacade {
	getPushIdentifier(): Promise<string | null>

	storePushIdentifierLocally(
		identifier: string,
		userId: string,
		sseOrigin: string,
		pushIdentifierId: string,
		pushIdentifierSessionKey: Uint8Array,
	): Promise<void>

	/**
	 * Called at some point after login to initialize push notifications.
	 */
	initPushNotifications(): Promise<void>

	closePushNotifications(addressesArray: ReadonlyArray<string>): Promise<void>

	scheduleAlarms(alarms: ReadonlyArray<EncryptedAlarmNotification>): Promise<void>

	/**
	 * Unschedule and remove alarms belonging to a specific user from the persistent storage
	 */
	invalidateAlarmsForUser(userId: string): Promise<void>
}
