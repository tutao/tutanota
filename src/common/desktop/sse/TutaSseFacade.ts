import { SseClient, SseEventHandler } from "./SseClient.js"
import { TutaNotificationHandler } from "./TutaNotificationHandler.js"
import { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade.js"
import { Agent, fetch as undiciFetch } from "undici"
import { makeTaggedLogger } from "../DesktopLog.js"
import { typeModels } from "../../api/entities/sys/TypeModels.js"
import { assertNotNull, base64ToBase64Url, filterInt, neverNull, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { handleRestError } from "../../api/common/error/RestError.js"
import { MissedNotification } from "../../api/entities/sys/TypeRefs.js"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification.js"
import { SseStorage } from "./SseStorage.js"
import { DateProvider } from "../../api/common/DateProvider.js"
import { SseInfo } from "./SseInfo.js"

const log = makeTaggedLogger("[SSEFacade]")

export const MISSED_NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days
export type EncryptedMissedNotification = MissedNotification & { alarmNotifications: readonly EncryptedAlarmNotification[] }

export class TutaSseFacade implements SseEventHandler {
	private currentSseInfo: SseInfo | null = null

	constructor(
		private readonly sseStorage: SseStorage,
		private readonly notificationHandler: TutaNotificationHandler,
		private readonly sseClient: SseClient,
		private readonly crypto: DesktopNativeCryptoFacade,
		private readonly appVersion: string,
		private readonly fetch: typeof undiciFetch,
		private readonly date: DateProvider,
	) {
		sseClient.setEventListener(this)
	}

	async connect() {
		if (await this.hasNotificationTTLExpired()) {
			await this.notificationHandler.onLocalDataInvalidated()
			await this.sseStorage.clear()
			return
		}
		if (this.currentSseInfo != null) {
			await this.disconnect()
		}
		const sseInfo = await this.sseStorage.getSseInfo()
		if (sseInfo == null) {
			log.debug("No SSE info")
			return
		}
		const url = this.getSseUrl(sseInfo, sseInfo.userIds[0])
		const headers = {
			v: typeModels.MissedNotification.version,
			cv: this.appVersion,
		}
		const timeout = await this.sseStorage.getHeartbeatTimeoutSec()
		if (timeout != null) {
			this.sseClient.setReadTimeout(timeout)
		}

		await this.sseClient.connect({ url, headers })
		this.currentSseInfo = sseInfo
	}

	/**
	 * We remember the last time we connected or fetched missed notification and if since the last time we did the the TTL time has
	 * expired, we certainly missed some updates.
	 * We need to unschedule all alarms and to tell web part that we would like alarms to be scheduled all over.
	 */
	private async hasNotificationTTLExpired(): Promise<boolean> {
		const lastMissedNotificationCheckTime = await this.sseStorage.getMissedNotificationCheckTime()
		log.debug("last missed notification check:", {
			lastMissedNotificationCheckTime,
		})
		return lastMissedNotificationCheckTime != null && this.date.now() - lastMissedNotificationCheckTime > MISSED_NOTIFICATION_TTL
	}

	private getSseUrl(sseInfo: SseInfo, userId: string): URL {
		const url = new URL(sseInfo.sseOrigin)
		url.pathname = "sse"
		url.searchParams.append("_body", this.requestJson(sseInfo.identifier, userId))
		return url
	}

	private requestJson(identifier: string, userId: string): string {
		return JSON.stringify({
			_format: "0",
			identifier: identifier,
			userIds: [
				{
					_id: this.crypto.generateId(4),
					value: userId,
				},
			],
		})
	}

	private async onNotification() {
		if ((await this.sseStorage.getMissedNotificationCheckTime()) == null) {
			// We set default value for  the case when Push identifier was added but no notifications were received. Then more than
			// MISSED_NOTIFICATION_TTL has passed and notifications has expired
			await this.sseStorage.recordMissedNotificationCheckTime()
		}
		if (await this.hasNotificationTTLExpired()) {
			await this.notificationHandler.onLocalDataInvalidated()
			return
		}
		let missedNotification
		try {
			missedNotification = await this.downloadMissedNotification()
		} catch (e) {
			log.warn("Failed to download missed notification", e)
			return
		}

		await this.sseStorage.setLastProcessedNotificationId(assertNotNull(missedNotification.lastProcessedNotificationId))
		await this.sseStorage.recordMissedNotificationCheckTime()
		const sseInfo = this.currentSseInfo
		if (sseInfo == null) return
		for (const notificationInfo of missedNotification.notificationInfos) {
			await this.notificationHandler.onMailNotification(sseInfo, notificationInfo)
		}
		for (const alarmNotification of missedNotification.alarmNotifications) {
			await this.notificationHandler.onAlarmNotification(alarmNotification)
		}
	}

	private async downloadMissedNotification(): Promise<EncryptedMissedNotification> {
		const sseInfo = assertNotNull(this.currentSseInfo)
		const url = this.makeMissedNotificationUrl(sseInfo)

		log.debug("downloading missed notification")
		const headers: Record<string, string> = {
			userIds: sseInfo.userIds[0],
			v: typeModels.MissedNotification.version,
			cv: this.appVersion,
		}
		const lastProcessedId = await this.sseStorage.getLastProcessedNotificationId()

		if (lastProcessedId) {
			headers["lastProcessedNotificationId"] = lastProcessedId
		}

		const res = await this.fetch(url, { headers, dispatcher: new Agent({ connectTimeout: 20000 }) })

		if (!res.ok) {
			throw handleRestError(neverNull(res.status), url, res.headers.get("error-id") as string, null)
		} else {
			const json = await res.json()
			log.debug("downloaded missed notification")
			return json as EncryptedMissedNotification
		}
	}

	private makeMissedNotificationUrl(sseInfo: SseInfo): string {
		const { identifier, sseOrigin } = sseInfo
		const customId = uint8ArrayToBase64(stringToUtf8Uint8Array(identifier))
		const url = new URL(sseOrigin)
		url.pathname = "rest/sys/missednotification/" + base64ToBase64Url(customId)
		return url.toString()
	}

	async onNewMessage(message: string) {
		if (message === "data: notification") {
			log.debug("notification")
			await this.onNotification()
			// deal with it
		} else if (message.startsWith("data: heartbeatTimeout:")) {
			const timeoutString = message.split(":").at(2)
			log.debug("heartbeatTimeout", timeoutString)
			const timeout = timeoutString == null ? null : filterInt(timeoutString)
			if (timeout != null && !isNaN(timeout)) {
				await this.sseStorage.setHeartbeatTimeoutSec(timeout)
				this.sseClient.setReadTimeout(timeout)
			}
		}
	}

	async onNotAuthenticated() {
		// invalid userids
		log.debug("got NotAuthenticated, deleting userId")
		let lastSseInfo = this.currentSseInfo
		this.currentSseInfo = null
		if (lastSseInfo == null) {
			log.warn("NotAuthorized while not connected?")
			return
		}
		const firstUser = lastSseInfo.userIds.at(0)
		await this.removeUserIdInternal(firstUser)
	}

	async removeUser(userId: Id) {
		await this.removeUserIdInternal(userId)
		await this.connect()
	}

	private async removeUserIdInternal(userId: string | undefined) {
		let sseInfo
		if (userId != null) {
			sseInfo = await this.sseStorage.removeUser(userId)
			await this.notificationHandler.onUserRemoved(userId)
		} else {
			sseInfo = await this.sseStorage.getSseInfo()
		}
		if (sseInfo?.userIds.length === 0) {
			log.debug("No user ids, skipping reconnect")
			await this.notificationHandler.onLocalDataInvalidated()
			await this.sseStorage.clear()
		}
	}

	async reconnect() {
		await this.disconnect()
		await this.connect()
	}

	async disconnect() {
		this.currentSseInfo = null
		await this.sseClient.disconnect()
	}
}
