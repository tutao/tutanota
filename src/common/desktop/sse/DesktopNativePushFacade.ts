import { NativePushFacade } from "../../native/common/generatedipc/NativePushFacade.js"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification.js"
import { NativeAlarmScheduler } from "./DesktopAlarmScheduler.js"
import { DesktopAlarmStorage } from "./DesktopAlarmStorage.js"
import { ExtendedNotificationMode } from "../../native/common/generatedipc/ExtendedNotificationMode.js"
import { SseStorage } from "./SseStorage.js"
import { TutaSseFacade } from "./TutaSseFacade.js"

export class DesktopNativePushFacade implements NativePushFacade {
	constructor(
		private readonly sse: TutaSseFacade,
		private readonly alarmScheduler: NativeAlarmScheduler,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly sseStorage: SseStorage,
	) {}

	setReceiveCalendarNotificationConfig(userId: string, value: boolean): Promise<void> {
		throw new Error("Desktop App should NOT deal with this config")
	}

	getReceiveCalendarNotificationConfig(userId: string): Promise<boolean> {
		return Promise.resolve(true)
	}

	getExtendedNotificationConfig(userId: string): Promise<ExtendedNotificationMode> {
		return this.sseStorage.getExtendedNotificationConfig(userId)
	}

	setExtendedNotificationConfig(userId: string, mode: ExtendedNotificationMode): Promise<void> {
		return this.sseStorage.setExtendedNotificationConfig(userId, mode)
	}

	async closePushNotifications(addressesArray: ReadonlyArray<string>): Promise<void> {
		// only gets called in the app
		// the desktop client closes notifications on window focus
	}

	async getPushIdentifier(): Promise<string | null> {
		const sseInfo = await this.sseStorage.getSseInfo()
		return sseInfo?.identifier ?? null
	}

	async initPushNotifications(): Promise<void> {
		// make sure that we are connected if we just received new push datap
		await this.sse.connect()
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
		await this.sseStorage.storePushIdentifier(identifier, userId, sseOrigin)
		await this.alarmStorage.storePushIdentifierSessionKey(pushIdentifierId, pushIdentifierSessionKey)
	}

	async removeUser(userId: string): Promise<void> {
		await this.sse.removeUser(userId)
	}

	async invalidateAlarmsForUser(userId: string): Promise<void> {
		await this.alarmScheduler.unscheduleAllAlarms(userId)
	}

	async resetStoredState() {
		await this.sse.disconnect()
		await this.alarmScheduler.unscheduleAllAlarms()
		await this.sseStorage.clear()
	}
}
