import { DesktopConfig } from "../config/DesktopConfig.js"
import { DesktopConfigEncKey, DesktopConfigKey } from "../config/ConfigKeys.js"
import { remove } from "@tutao/tutanota-utils"
import { SseInfo } from "./SseInfo.js"
import { ExtendedNotificationMode } from "../../native/common/generatedipc/ExtendedNotificationMode.js"

const DEFAULT_EXTENDED_NOTIFICATION_MODE = ExtendedNotificationMode.NoSenderOrSubject

export class SseStorage {
	constructor(private readonly conf: DesktopConfig) {}

	async getSseInfo(): Promise<SseInfo | null> {
		return (await this.conf.getVar(DesktopConfigEncKey.sseInfo)) as SseInfo | null
	}

	async storePushIdentifier(identifier: string, userId: Id, sseOrigin: string) {
		const previousSseInfo = await this.getSseInfo()
		let newSseInfo: SseInfo
		if (!previousSseInfo) {
			newSseInfo = {
				identifier,
				userIds: [userId],
				sseOrigin,
			}
		} else {
			newSseInfo = previousSseInfo
			newSseInfo.identifier = identifier
			newSseInfo.sseOrigin = sseOrigin
			if (!newSseInfo.userIds.includes(userId)) {
				newSseInfo.userIds.push(userId)
			}
		}
		await this.conf.setVar(DesktopConfigEncKey.sseInfo, newSseInfo)
		// Provide right defaults for extended notification mode.
		//  - Start with "nothing" as a conservative default
		//  - If notifications were not used before, enable extended notifications
		if (previousSseInfo == null || !previousSseInfo.userIds.includes(userId)) {
			await this.setExtendedNotificationConfig(userId, ExtendedNotificationMode.OnlySender)
		}
	}

	async removeUser(userId: Id): Promise<SseInfo | null> {
		const sseInfo = await this.getSseInfo()
		if (sseInfo != null) {
			remove(sseInfo.userIds, userId)
			await this.conf.setVar(DesktopConfigEncKey.sseInfo, sseInfo)
			return sseInfo
		} else {
			return null
		}
	}

	async getMissedNotificationCheckTime(): Promise<number | null> {
		const value = await this.conf.getVar(DesktopConfigKey.lastMissedNotificationCheckTime)
		return value ?? null
	}

	async recordMissedNotificationCheckTime() {
		await this.conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, Date.now())
	}

	async getLastProcessedNotificationId(): Promise<Id | null> {
		const value = await this.conf.getVar(DesktopConfigKey.lastProcessedNotificationId)
		return value ?? null
	}

	async setLastProcessedNotificationId(id: Id) {
		await this.conf.setVar(DesktopConfigKey.lastProcessedNotificationId, id)
	}

	async getHeartbeatTimeoutSec(): Promise<number | null> {
		const value = await this.conf.getVar(DesktopConfigKey.heartbeatTimeoutInSeconds)
		return value ?? null
	}

	async setHeartbeatTimeoutSec(timeout: number) {
		await this.conf.setVar(DesktopConfigKey.heartbeatTimeoutInSeconds, timeout)
	}

	async getExtendedNotificationConfig(userId: string): Promise<ExtendedNotificationMode> {
		const object = (await this.conf.getVar(DesktopConfigKey.extendedNotificationMode)) ?? {}
		return object[userId] ?? DEFAULT_EXTENDED_NOTIFICATION_MODE
	}

	async setExtendedNotificationConfig(userId: string, mode: ExtendedNotificationMode): Promise<void> {
		const object = (await this.conf.getVar(DesktopConfigKey.extendedNotificationMode)) ?? {}
		object[userId] = mode
		return this.conf.setVar(DesktopConfigKey.extendedNotificationMode, object)
	}

	async clear() {
		await this.conf.setVar(DesktopConfigKey.lastMissedNotificationCheckTime, null)
		await this.conf.setVar(DesktopConfigKey.lastProcessedNotificationId, null)
		await this.conf.setVar(DesktopConfigKey.heartbeatTimeoutInSeconds, null)
		await this.conf.setVar(DesktopConfigEncKey.sseInfo, null)
	}
}
