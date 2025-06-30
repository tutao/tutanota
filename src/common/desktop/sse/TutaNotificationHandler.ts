import type { WindowManager } from "../DesktopWindowManager"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade"
import { DesktopNotifier, NotificationResult } from "../DesktopNotifier"
import { LanguageViewModel } from "../../misc/LanguageViewModel"
import { IdTupleWrapper, NotificationInfo } from "../../api/entities/sys/TypeRefs"
import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode.js"
import { ExtendedNotificationMode } from "../../native/common/generatedipc/ExtendedNotificationMode"
import { assertNotNull, base64ToBase64Url, getFirstOrThrow, groupBy, neverNull } from "@tutao/tutanota-utils"
import { log } from "../DesktopLog"
import tutanotaModelInfo from "../../api/entities/tutanota/ModelInfo"
import { handleRestError } from "../../api/common/error/RestError"
import { MailAddressTypeRef, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { DesktopAlarmScheduler } from "./DesktopAlarmScheduler.js"
import { DesktopAlarmStorage } from "./DesktopAlarmStorage.js"
import { SseInfo } from "./SseInfo.js"
import { SseStorage } from "./SseStorage.js"
import { FetchImpl } from "../net/NetAgent"
import { StrippedEntity } from "../../api/common/utils/EntityUtils"
import { EncryptedParsedInstance, ServerModelUntypedInstance, TypeModel } from "../../api/common/EntityTypes"
import { AttributeModel } from "../../api/common/AttributeModel"
import { InstancePipeline } from "../../api/worker/crypto/InstancePipeline"
import { ClientTypeModelResolver } from "../../api/common/EntityFunctions"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials"

const TAG = "[notifications]"

export type MailMetadata = {
	senderAddress: string
	firstRecipientAddress: string | null
	id: IdTuple
	notificationInfo: StrippedEntity<NotificationInfo>
}

export class TutaNotificationHandler {
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
		private readonly typeModelResolver: ClientTypeModelResolver,
	) {}

	async onMailNotification(sseInfo: SseInfo, notificationInfos: Array<StrippedEntity<NotificationInfo>>) {
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
				const notificationId = firstNotificationInfo.mailId
					? `${firstNotificationInfo.mailId.listId},${firstNotificationInfo.mailId?.listElementId}`
					: firstNotificationInfo.userId
				this.notifier.submitGroupedNotification(this.lang.get("pushNewMail_msg"), firstNotificationInfo.mailAddress, notificationId, (res) =>
					this.onMailNotificationClick(res, firstNotificationInfo),
				)
			} else {
				const credentials = await this.nativeCredentialFacade.loadByUserId(firstNotificationInfo.userId)
				if (credentials == null) {
					log.warn(`Not found credentials to download notification, userId ${firstNotificationInfo.userId}`)
					continue
				}
				const infosToFetch = infos.slice(0, 5) // don't show notifications for more than five mails at a time
				const mailMetadata = await this.downloadMailMetadata(sseInfo, listId, infosToFetch, credentials)
				for (const mailMeta of mailMetadata) {
					this.notifier.submitGroupedNotification(mailMeta.senderAddress, mailMeta.firstRecipientAddress ?? "", mailMeta.id.join(","), (res) =>
						this.onMailNotificationClick(res, mailMeta.notificationInfo),
					)
				}
			}
		}
	}

	private onMailNotificationClick(res: NotificationResult, notificationInfo: StrippedEntity<NotificationInfo>) {
		if (res === NotificationResult.Click) {
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
	}

	private async downloadMailMetadata(
		sseInfo: SseInfo,
		listId: Id,
		notificationInfos: Array<StrippedEntity<NotificationInfo>>,
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

			const untypedInstances = (await response.json()) as Array<ServerModelUntypedInstance>

			const mailModel = await this.typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const mailAddressModel = await this.typeModelResolver.resolveClientTypeReference(MailAddressTypeRef)

			result.push(
				...(await Promise.all(
					untypedInstances.map(async (untypedInstance) => {
						const mailEncryptedParsedInstance: EncryptedParsedInstance = await this.nativeInstancePipeline.typeMapper.applyJsTypes(
							mailModel,
							untypedInstance,
						)
						const notificationInfo = notificationInfos.filter(
							(info) =>
								assertNotNull(info.mailId).listElementId ===
								AttributeModel.getAttribute<IdTuple>(mailEncryptedParsedInstance, "_id", mailModel)[1],
						)[0]
						return this.encryptedMailToMailMetaData(mailModel, mailAddressModel, mailEncryptedParsedInstance, notificationInfo)
					}),
				)),
			)
		} catch (e) {
			log.debug(TAG, "Error fetching mail metadata, " + (e as Error).message)
		}
		return result
	}

	private encryptedMailToMailMetaData(
		mailModel: TypeModel,
		mailAddressModel: TypeModel,
		mi: EncryptedParsedInstance,
		notificationInfo: StrippedEntity<NotificationInfo>,
	): MailMetadata {
		const mailId = AttributeModel.getAttribute<IdTuple>(mi, "_id", mailModel)

		const firstRecipient = AttributeModel.getAttributeorNull<EncryptedParsedInstance[] | null>(mi, "firstRecipient", mailModel)
		const sender = AttributeModel.getAttribute<EncryptedParsedInstance[]>(mi, "sender", mailModel)[0]

		const senderAddress = AttributeModel.getAttribute<string>(sender, "address", mailAddressModel)
		return {
			id: mailId,
			senderAddress: senderAddress,
			firstRecipientAddress: firstRecipient ? AttributeModel.getAttribute(firstRecipient[0], "address", mailAddressModel) : null,
			notificationInfo,
		}
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
