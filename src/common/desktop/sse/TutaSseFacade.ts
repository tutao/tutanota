import { SseClient, SseEventHandler } from "./SseClient.js"
import { TutaNotificationHandler } from "./TutaNotificationHandler.js"
import { makeTaggedLogger } from "../DesktopLog.js"
import { typeModels } from "../../api/entities/sys/TypeModels.js"
import {
	assertNotNull,
	Base64,
	base64ToBase64Url,
	base64ToUint8Array,
	downcast,
	filterInt,
	neverNull,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import { handleRestError } from "../../api/common/error/RestError.js"
import {
	AlarmInfoTypeRef,
	AlarmNotification,
	AlarmNotificationTypeRef,
	createGeneratedIdWrapper,
	createMissedNotification,
	createNotificationSessionKey,
	createSseConnectData,
	IdTupleWrapper,
	IdTupleWrapperTypeRef,
	MissedNotification,
	MissedNotificationTypeRef,
	NotificationInfo,
	NotificationInfoTypeRef,
	NotificationSessionKeyTypeRef,
	SseConnectDataTypeRef,
} from "../../api/entities/sys/TypeRefs.js"
import { SseStorage } from "./SseStorage.js"
import { DateProvider } from "../../api/common/DateProvider.js"
import { SseInfo } from "./SseInfo.js"
import { FetchImpl } from "../net/NetAgent"
import { EncryptedParsedInstance, TypeModel, UntypedInstance } from "../../api/common/EntityTypes"
import { resolveTypeReference } from "../../api/common/EntityFunctions"
import { elementIdPart, StrippedEntity } from "../../api/common/utils/EntityUtils"
import { AttributeModel } from "../../api/common/AttributeModel"
import { InstancePipeline } from "../../api/worker/crypto/InstancePipeline"
import { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import { decryptKey } from "@tutao/tutanota-crypto"
import { hasError } from "../../api/common/utils/ErrorUtils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

const log = makeTaggedLogger("[SSEFacade]")

export const MISSED_NOTIFICATION_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days
const instancePipeline = new InstancePipeline(resolveTypeReference, resolveTypeReference)

export class TutaSseFacade implements SseEventHandler {
	private currentSseInfo: SseInfo | null = null

	constructor(
		private readonly sseStorage: SseStorage,
		private readonly notificationHandler: TutaNotificationHandler,
		private readonly sseClient: SseClient,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly appVersion: string,
		private readonly fetch: FetchImpl,
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
		const url = await this.getSseUrl(sseInfo, sseInfo.userIds[0])
		const headers = {
			v: typeModels[MissedNotificationTypeRef.typeId].version,
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

	private async getSseUrl(sseInfo: SseInfo, userId: string): Promise<URL> {
		const url = new URL(sseInfo.sseOrigin)
		url.pathname = "sse"
		url.searchParams.append("_body", await this.requestJson(sseInfo.identifier, userId))
		return url
	}

	private async requestJson(identifier: string, userId: string): Promise<string> {
		const connectData = createSseConnectData({
			identifier: identifier,
			userIds: [
				createGeneratedIdWrapper({
					value: userId,
				}),
			],
		})
		const untypedInstance = instancePipeline.encryptAndMapToLiteral(SseConnectDataTypeRef, connectData, null)
		return JSON.stringify(untypedInstance)
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

	private async downloadMissedNotification(): Promise<MissedNotification> {
		const sseInfo = assertNotNull(this.currentSseInfo)
		const url = this.makeMissedNotificationUrl(sseInfo)

		log.debug("downloading missed notification")
		const headers: Record<string, string> = {
			userIds: sseInfo.userIds[0],
			v: typeModels[MissedNotificationTypeRef.typeId].version,
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
			const untypedInstance = (await res.json()) as UntypedInstance
			const missedNotification = await this.parseEncryptedMissedNotification(untypedInstance)

			log.debug("downloaded missed notification")
			return missedNotification
		}
	}

	private async parseEncryptedMissedNotification(untypedInstance: UntypedInstance): Promise<MissedNotification> {
		const missedNotificationTypeModel = await resolveTypeReference(MissedNotificationTypeRef)
		const notificationInfoTypeModel = await resolveTypeReference(NotificationInfoTypeRef)
		const alarmInfoTypeModel = await resolveTypeReference(AlarmInfoTypeRef)

		const encryptedParsedInstance = await instancePipeline.typeMapper.applyJsTypes(missedNotificationTypeModel, untypedInstance)

		const lastProcessedNotificationId = AttributeModel.getAttribute<Id>(encryptedParsedInstance, "lastProcessedNotificationId", missedNotificationTypeModel)
		// decrypt alarmnotifications:
		const encryptedAlarmNotifications = AttributeModel.getAttribute<EncryptedParsedInstance[]>(
			encryptedParsedInstance,
			"alarmNotifications",
			missedNotificationTypeModel,
		)

		const alarmNotifications = await Promise.all(
			encryptedAlarmNotifications.map(async (an) => {
				return await this.alarmStorage.decryptAlarmNotification(an)
			}),
		)
		const notificationInfos = await Promise.all(
			downcast<Array<EncryptedParsedInstance>>(
				AttributeModel.getAttribute(encryptedParsedInstance, "notificationInfos", missedNotificationTypeModel),
			).map(async (ni) => downcast<NotificationInfo>(await this.mapNotificationInfo(notificationInfoTypeModel, ni))),
		)

		return createMissedNotification({ lastProcessedNotificationId, notificationInfos, alarmNotifications })
	}

	private async mapNotificationInfo(typeModel: TypeModel, ni: EncryptedParsedInstance): Promise<StrippedEntity<NotificationInfo>> {
		const idTupleWrapperTypeModel = await resolveTypeReference(IdTupleWrapperTypeRef)
		const mailIdEncryptedParsedInstance = downcast(assertNotNull(AttributeModel.getAttributeorNull(ni, "mailId", typeModel)))[0]
		return {
			mailAddress: assertNotNull(AttributeModel.getAttributeorNull<string>(ni, "mailAddress", typeModel)),
			userId: assertNotNull(AttributeModel.getAttributeorNull<Id>(ni, "userId", typeModel)),
			mailId: {
				_type: IdTupleWrapperTypeRef,
				_id: AttributeModel.getAttribute<Id>(mailIdEncryptedParsedInstance, "_id", idTupleWrapperTypeModel),
				listId: AttributeModel.getAttribute<Id>(mailIdEncryptedParsedInstance, "listId", idTupleWrapperTypeModel),
				listElementId: AttributeModel.getAttribute<Id>(mailIdEncryptedParsedInstance, "listElementId", idTupleWrapperTypeModel),
			} satisfies IdTupleWrapper,
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
