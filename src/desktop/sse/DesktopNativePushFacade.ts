import { NativePushFacade } from "../../native/common/generatedipc/NativePushFacade.js"
import { DesktopSseClient } from "./DesktopSseClient.js"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification.js"
import { NativeAlarmScheduler } from "./DesktopAlarmScheduler.js"
import { DesktopAlarmStorage } from "./DesktopAlarmStorage.js"

export class DesktopNativePushFacade implements NativePushFacade {
	constructor(
		private readonly sse: DesktopSseClient,
		private readonly alarmScheduler: NativeAlarmScheduler,
		private readonly alarmStorage: DesktopAlarmStorage,
	) {}

	async closePushNotifications(addressesArray: ReadonlyArray<string>): Promise<void> {
		// only gets called in the app
		// the desktop client closes notifications on window focus
	}

	async getPushIdentifier(): Promise<string | null> {
		const sseInfo = await this.sse.getSseInfo()
		return sseInfo?.identifier ?? null
	}

	async initPushNotifications(): Promise<void> {
		// Nothing to do here because sse connection is opened when starting the native part.
	}

	async scheduleAlarms(alarms: ReadonlyArray<EncryptedAlarmNotification>): Promise<void> {
		for (const alarm of alarms) {
			await this.alarmScheduler.handleAlarmNotification(alarm)
		}
	}

	async storePushIdentifierLocally(
		identifier: string,
		userId: string,
		sseOrigin: string,
		pushIdentifierId: string,
		pushIdentifierSessionKey: Uint8Array,
	): Promise<void> {
		await this.sse.storePushIdentifier(identifier, userId, sseOrigin)
		await this.alarmStorage.storePushIdentifierSessionKey(pushIdentifierId, pushIdentifierSessionKey)
	}

	removeUser(userId: string): Promise<void> {
		return this.sse.removeUser(userId)
	}

	async invalidateAlarmsForUser(userId: string): Promise<void> {
		await this.alarmScheduler.unscheduleAllAlarms(userId)
	}
}
