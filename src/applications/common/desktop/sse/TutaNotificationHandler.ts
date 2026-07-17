import type { WindowManager } from "../DesktopWindowManager"
import { NativeCredentialsFacade, UnencryptedCredentials } from "@tutao/native-bridge/generatedIpc/types"
import { ExtendedNotificationMode } from "@tutao/native-bridge/generatedIpc/enums"
import { DesktopNotifier } from "../notifications/DesktopNotifier"
import { LanguageViewModel } from "../../../../ui/utils/LanguageViewModel"
import { elementIdPart, isSameSingleId } from "@tutao/meta"
import { CredentialEncryptionMode } from "@tutao/app-env"
import { assert, assertNotNull, base64ToBase64Url, getFirstOrThrow, groupBy, neverNull, promiseMap } from "@tutao/utils"
import { log } from "../DesktopLog"
import { DesktopAlarmScheduler } from "./DesktopAlarmScheduler.js"
import { DesktopAlarmStorage } from "./DesktopAlarmStorage.js"
import { SseInfo } from "./SseInfo.js"
import { SseStorage } from "./SseStorage.js"
import { FetchImpl } from "../net/NetAgent"
import { ClientOnlyTypeModelResolver, EncryptedParsedInstance, InstancePipeline } from "@tutao/instance-pipeline"
import { handleRestError } from "@tutao/rest-client/error"
import { IdTupleWrapper, NotificationInfoParams } from "@tutao/entities/sys"
import { MailTypeRef, tutanotaModelInfo } from "@tutao/entities/tutanota"
import { IncomingServerJson } from "../../../../platform-kit/instance-pipeline/TypeMapper"

const TAG = "[notifications]"

export type MailMetadata = {
	senderAddress: string
	firstRecipientAddress: string | null
	id: IdTuple
	notificationInfo: NotificationInfoParams
}

class TutaNotificationHandler {
	constructor(
		private readonly windowManager: WindowManager,
		private readonly nativeCredentialFacade: NativeCredentialsFacade,
		private readonly sseStorage: SseStorage,
		private readonly notifier: DesktopNotifier,
		private readonly alarmScheduler: DesktopAlarmScheduler,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly lang: LanguageViewModel,
		private readonly fetch: FetchImpl,
		private readonly appVersion: string,
		private readonly nativeInstancePipeline: InstancePipeline,
	) {
		assert(
			this.nativeInstancePipeline.typeModelResolver instanceof ClientOnlyTypeModelResolver,
			"NativeInstancePipeline expected in TutaNotificationHandler",
		)
	}

	async onMailNotification(sseInfo: SseInfo, notificationInfos: Array<NotificationInfoParams>) {
		const infosByListId = groupBy(notificationInfos, (ni) => assertNotNull(ni.mailId).listId)
		for (const [listId, infos] of infosByListId.entries()) {
			const firstNotificationInfo = getFirstOrThrow(infos)
			const appWindow = this.windowManager.getAll().find((window) => window.getUserId() === firstNotificationInfo.userId)

			if (appWindow && appWindow.isFocused()) {
				// no need for notification if user is looking right at the window
				continue
			}

			// we can't download the email if we don't have access to credentials
			const canShowExtendedNotification =
				(await this.nativeCredentialFacade.getCredentialEncryptionMode()) === CredentialEncryptionMode.DEVICE_LOCK &&
				(await this.sseStorage.getExtendedNotificationConfig(firstNotificationInfo.userId)) !== ExtendedNotificationMode.NoSenderOrSubject
			if (!canShowExtendedNotification) {
				for (const info of infos) {
					this.notifier.showCountedUserNotification({
						title: this.lang.get("pushNewMail_msg"),
						body: info.mailAddress,
						userId: info.userId,
						onClick: () => this.onMailNotificationClick(firstNotificationInfo),
					})
				}
			} else {
				const credentials = await this.nativeCredentialFacade.loadByUserId(firstNotificationInfo.userId)
				if (credentials == null) {
					log.warn(`Not found credentials to download notification, userId ${firstNotificationInfo.userId}`)
					continue
				}
				const infosToFetch = infos.slice(0, 100) // don't show notifications for more than a hundred mails at a time
				const mailMetadata = await this.downloadMailMetadata(sseInfo, listId, infosToFetch, credentials)
				for (const mailMeta of mailMetadata) {
					this.notifier.showCountedUserNotification({
						title: mailMeta.senderAddress,
						body: mailMeta.firstRecipientAddress ?? "",
						userId: mailMeta.notificationInfo.userId,
						onClick: () => this.onMailNotificationClick(mailMeta.notificationInfo),
					})
				}
			}
		}
	}

	private onMailNotificationClick(notificationInfo: NotificationInfoParams) {
		let requestedPath: string | null
		if (notificationInfo.mailId) {
			const mailIdParam = encodeURIComponent(`${notificationInfo.mailId.listId},${notificationInfo.mailId.listElementId}`)
			requestedPath = `?mail=${mailIdParam}`
		} else {
			requestedPath = null
		}
		this.windowManager.openMailBox(
			{
				userId: notificationInfo.userId,
				mailAddress: notificationInfo.mailAddress,
			},
			requestedPath,
		)
	}

	private async downloadMailMetadata(
		sseInfo: SseInfo,
		listId: Id,
		notificationInfos: Array<NotificationInfoParams>,
		credentials: UnencryptedCredentials,
	): Promise<Array<MailMetadata>> {
		const result: Array<MailMetadata> = []
		// decrypt access token
		const first = notificationInfos[0]

		const url = this.makeMailMetadataUrl(
			sseInfo,
			assertNotNull(listId),
			notificationInfos.map((ni) => assertNotNull(ni.mailId)),
		)

		log.debug(TAG, "downloading mail notification metadata")
		const headers: Record<string, string> = {
			v: tutanotaModelInfo.version.toString(),
			cv: this.appVersion,
			accessToken: credentials.accessToken,
		}

		try {
			const response = await this.fetch(url, { headers })
			if (!response.ok) {
				throw handleRestError(neverNull(response.status), url.toString(), response.headers.get("Error-Id"), null)
			}

			const mailTypeModel = await this.nativeInstancePipeline.typeModelResolver.resolveServerTypeReference(MailTypeRef)
			const mailResponses = IncomingServerJson.expectMultipleInstance(await response.text(), mailTypeModel)
			const notificationParsedInstances = await promiseMap(
				mailResponses,
				async (json) => await this.nativeInstancePipeline.typeMapper.parseServerJson(json),
			)

			result.push(
				...(await Promise.all(
					notificationParsedInstances.map(async (encParsedInstance) => {
						const notificationInfo = notificationInfos.filter((info) => {
							const mailElementId = assertNotNull(info.mailId).listElementId
							const alarmElementId = elementIdPart(encParsedInstance.getAttributeByName("_id").asIdTuple())
							return isSameSingleId(mailElementId, alarmElementId)
						})[0]
						return this.encryptedMailToMailMetaData(encParsedInstance, notificationInfo)
					}),
				)),
			)
		} catch (e) {
			log.debug(TAG, "Error fetching mail metadata, " + (e as Error).message)
		}
		return result
	}

	private encryptedMailToMailMetaData(mailInstance: EncryptedParsedInstance, notificationInfo: NotificationInfoParams): MailMetadata {
		const mailId = mailInstance.getAttributeByName("_id").asIdTuple()

		const sender = mailInstance.getAttributeByName("sender").asNestedObjList()[0]
		const senderAddress = sender.getAttributeByName("address").asId()
		const firstRecipient = mailInstance.getAttributeByName("firstRecipient").asNestedObjList()
		const firstRecipientAddress = firstRecipient.at(0)?.getAttributeByName("address").getNullWhenNull()?.asString() ?? null

		return {
			id: mailId,
			senderAddress,
			firstRecipientAddress,
			notificationInfo,
		} satisfies MailMetadata
	}

	private makeMailMetadataUrl(sseInfo: SseInfo, listId: Id, mailIds: Array<IdTupleWrapper>): URL {
		const url = new URL(sseInfo.sseOrigin)
		const listElementIds = mailIds.map((mailId) => base64ToBase64Url(mailId.listElementId)).join(",")
		url.pathname = `rest/tutanota/mail/${base64ToBase64Url(listId)}`
		url.searchParams.set("ids", listElementIds)
		return url
	}

	async onUserRemoved(userId: Id) {
		await this.alarmScheduler.unscheduleAllAlarms(userId)
	}

	async onLocalDataInvalidated() {
		await this.alarmScheduler.unscheduleAllAlarms()
		await this.alarmStorage.removeAllPushIdentifierKeys()
		await this.windowManager.invalidateAlarms()
	}
}

export default TutaNotificationHandler
