import { SseClient, SseEventHandler } from "./SseClient.js"
import TutaNotificationHandler from "./TutaNotificationHandler.js"
import { makeTaggedLogger } from "../DesktopLog.js"
import { elementIdPart, hasError, OperationType } from "@tutao/meta"
import {
	assertNotNull,
	base64ToBase64Url,
	DateProvider,
	downcast,
	filterInt,
	neverNull,
	stringToUtf8Uint8Array,
	throttleStart,
	uint8ArrayToBase64,
} from "@tutao/utils"
import { SseStorage } from "./SseStorage.js"
import { SseInfo } from "./SseInfo.js"
import { FetchImpl } from "../net/NetAgent"
import { InstancePipeline } from "../../../../platform-kit/instance-pipeline"
import { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import { EncryptedMissedNotification } from "../../../../app-kit/native-bridge/common/EncryptedMissedNotification"
import { EncryptedAlarmNotification } from "../../../../app-kit/native-bridge/common/EncryptedAlarmNotification"
import { DesktopAlarmScheduler } from "./DesktopAlarmScheduler"
import { CryptoError } from "@tutao/crypto/error"
import { handleRestError } from "@tutao/rest-client/error"
import {
	AlarmNotification,
	createGeneratedIdWrapper,
	createSseConnectData,
	MissedNotificationTypeRef,
	NotificationInfo,
	SseConnectDataTypeRef,
	sysTypeModels,
} from "@tutao/entities/sys"
import { IncomingServerJson, OutgoingServerJson } from "../../../../platform-kit/instance-pipeline/TypeMapper"

const log = makeTaggedLogger("[SSEFacade]")

export const MISSED_NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

const NOTIFICATION_HANDLER_THROTTLE_MS = 10_000

export class TutaSseFacade implements SseEventHandler {
	private currentSseInfo: SseInfo | null = null

	constructor(
		private readonly sseStorage: SseStorage,
		private readonly notificationHandler: TutaNotificationHandler,
		private readonly sseClient: SseClient,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly alarmScheduler: DesktopAlarmScheduler,
		private readonly appVersion: string,
		private readonly fetch: FetchImpl,
		private readonly date: DateProvider,
		private readonly nativeInstancePipeline: InstancePipeline,
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
		const url = await this.getSseUrl(sseInfo, sseInfo.userIds[0])
		const headers = {
			v: sysTypeModels[MissedNotificationTypeRef.typeId].version,
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
	 * We remember the last time we connected or fetched missed notification and if since the last time we did the TTL time has
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

	private async getSseUrl(sseInfo: SseInfo, userId: string): Promise<URL> {
		const url = new URL(sseInfo.sseOrigin)
		url.pathname = "sse"
		url.searchParams.append("_body", (await this.requestJson(sseInfo.identifier, userId)).getJsonRepresentation())
		return url
	}

	private async requestJson(identifier: string, userId: string): Promise<OutgoingServerJson> {
		const connectData = createSseConnectData({
			identifier: identifier,
			userIds: [
				createGeneratedIdWrapper({
					value: userId,
				}),
			],
		})
		const encryptedConnectData = await this.nativeInstancePipeline.mapAndEncryptToParsedInstance(SseConnectDataTypeRef, connectData, null)
		return this.nativeInstancePipeline.typeMapper.makeServerJson(encryptedConnectData)
	}

	/**
	 * Throttled to avoid needless download requests for notifications when we rapidly receive notification messages,
	 * since every request downloads all the available data.
	 *
	 * This also has an effect of serializing all the requests, which is important to make suspension work.
	 */
	private onNotification = throttleStart(NOTIFICATION_HANDLER_THROTTLE_MS, async () => {
		if ((await this.sseStorage.getMissedNotificationCheckTime()) == null) {
			// We set default value for  the case when Push identifier was added but no notifications were received. Then more than
			// MISSED_NOTIFICATION_TTL has passed and notifications has expired
			await this.sseStorage.recordMissedNotificationCheckTime()
		}
		if (await this.hasNotificationTTLExpired()) {
			await this.notificationHandler.onLocalDataInvalidated()
			return
		}
		let encryptedMissedNotification: EncryptedMissedNotification
		try {
			encryptedMissedNotification = await this.downloadMissedNotification()
		} catch (e) {
			log.warn("Failed to download missed notification", e)
			return
		}

		await this.sseStorage.setLastProcessedNotificationId(assertNotNull(encryptedMissedNotification.lastProcessedNotificationId))
		await this.sseStorage.recordMissedNotificationCheckTime()

		const sseInfo = this.currentSseInfo
		if (sseInfo == null) {
			return
		}

		const notificationInfos = encryptedMissedNotification.notificationInfos.map(async (notificationInfoUntyped) => {
			return await this.nativeInstancePipeline.decryptAndMapEncryptedInstance<NotificationInfo>(notificationInfoUntyped, null)
		})

		await this.notificationHandler.onMailNotification(sseInfo, await Promise.all(notificationInfos))
		await this.handleAlarmNotification(encryptedMissedNotification)
	})

	/**
	 * Decrypt alarms and schedule notifications
	 */
	// VisibleForTesting
	async handleAlarmNotification(encryptedMissedNotification: EncryptedMissedNotification) {
		for (const alarmNotificationUntyped of encryptedMissedNotification.alarmNotifications) {
			const encryptedAlarmNotification = new EncryptedAlarmNotification(alarmNotificationUntyped)
			const alarmIdentifier = encryptedAlarmNotification.getAlarmId()
			const operation = downcast<OperationType>(encryptedAlarmNotification.getOperation())
			if (operation === OperationType.CREATE) {
				while (true) {
					const sk = await this.alarmStorage.getNotificationSessionKey(encryptedMissedNotification.getNotificationSessionKeys())
					if (!sk) {
						// none of the NotificationSessionKeys in the AlarmNotification worked.
						// this is indicative of a serious problem with the stored keys.
						// therefore, we should invalidate the sseInfo and throw away
						// our pushEncSessionKeys.
						throw new CryptoError("could not find session key to decrypt alarm notification")
					}
					const alarmNotification = await this.nativeInstancePipeline.decryptAndMapEncryptedInstance<AlarmNotification>(
						alarmNotificationUntyped,
						assertNotNull(sk).sessionKey,
					)
					if (hasError(alarmNotification)) {
						// some property of the AlarmNotification couldn't be decrypted with the selected key
						// throw away the key that caused the error and try the next one
						await this.alarmStorage.removePushIdentifierKey(elementIdPart(sk.notificationSessionKey.pushIdentifier))
						continue
					}
					return await this.alarmScheduler.handleCreateAlarm(alarmNotification)
				}
			} else if (operation === OperationType.DELETE) {
				await this.alarmScheduler.handleDeleteAlarm(alarmIdentifier)
			} else {
				console.warn(`received AlarmNotification (alarmInfo identifier ${alarmIdentifier}) with unsupported operation ${alarmIdentifier}, ignoring`)
			}
		}
	}

	private async downloadMissedNotification(): Promise<EncryptedMissedNotification> {
		const sseInfo = assertNotNull(this.currentSseInfo)
		const url = this.makeMissedNotificationUrl(sseInfo)

		log.debug("downloading missed notification", url)
		const headers: Record<string, string> = {
			userIds: sseInfo.userIds[0],
			v: sysTypeModels[MissedNotificationTypeRef.typeId].version,
			cv: this.appVersion,
		}
		const lastProcessedId = await this.sseStorage.getLastProcessedNotificationId()

		if (lastProcessedId) {
			headers["lastProcessedNotificationId"] = lastProcessedId
		}

		const res = await this.fetch(url, { headers })

		if (!res.ok) {
			throw handleRestError(neverNull(res.status), url, res.headers.get("error-id") as string, null)
		} else {
			const typeModel = await this.nativeInstancePipeline.typeModelResolver.resolveServerTypeReference(MissedNotificationTypeRef)
			const incomingJson = IncomingServerJson.expectSingleInstance(await res.text(), typeModel)
			const encryptedInstance = await this.nativeInstancePipeline.typeMapper.parseServerJson(incomingJson)
			log.debug("downloaded missed notification")
			return new EncryptedMissedNotification(encryptedInstance)
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
