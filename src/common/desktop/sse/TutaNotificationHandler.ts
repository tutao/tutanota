import type { WindowManager } from "../DesktopWindowManager"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade"
import { DesktopNotifier, NotificationResult } from "../DesktopNotifier"
import { LanguageViewModel } from "../../misc/LanguageViewModel"
import { Agent, fetch as undiciFetch } from "undici"
import { IdTupleWrapper, NotificationInfo } from "../../api/entities/sys/TypeRefs"
import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode.js"
import { ExtendedNotificationMode } from "../../native/common/generatedipc/ExtendedNotificationMode"
import { assertNotNull, base64ToBase64Url, neverNull } from "@tutao/tutanota-utils"
import { log } from "../DesktopLog"
import tutanotaModelInfo from "../../api/entities/tutanota/ModelInfo"
import { handleRestError } from "../../api/common/error/RestError"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification"
import { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { NativeAlarmScheduler } from "./DesktopAlarmScheduler.js"
import { DesktopAlarmStorage } from "./DesktopAlarmStorage.js"
import { SseInfo } from "./SseInfo.js"
import { SseStorage } from "./SseStorage.js"

const TAG = "[notifications]"

export type MailMetadata = Pick<Mail, "sender" | "firstRecipient" | "_id">

export class TutaNotificationHandler {
	constructor(
		private readonly windowManager: WindowManager,
		private readonly nativeCredentialFacade: NativeCredentialsFacade,
		private readonly sseStorage: SseStorage,
		private readonly notifier: DesktopNotifier,
		private readonly alarmScheduler: NativeAlarmScheduler,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly lang: LanguageViewModel,
		private readonly fetch: typeof undiciFetch,
		private readonly appVersion: string,
	) {}

	async onMailNotification(sseInfo: SseInfo, notificationInfo: NotificationInfo) {
		const appWindow = this.windowManager.getAll().find((window) => window.getUserId() === notificationInfo.userId)

		if (appWindow && appWindow.isFocused()) {
			// no need for notification if user is looking right at the window
			return
		}

		// we can't download the email if we don't have access to credentials
		const canShowExtendedNotification =
			(await this.nativeCredentialFacade.getCredentialEncryptionMode()) === CredentialEncryptionMode.DEVICE_LOCK &&
			(await this.sseStorage.getExtendedNotificationConfig(notificationInfo.userId)) !== ExtendedNotificationMode.NoSenderOrSubject
		if (!canShowExtendedNotification) {
			const notificationId = notificationInfo.mailId
				? `${notificationInfo.mailId.listId},${notificationInfo.mailId?.listElementId}`
				: notificationInfo.userId
			this.notifier.submitGroupedNotification(this.lang.get("pushNewMail_msg"), notificationInfo.mailAddress, notificationId, (res) =>
				this.onMailNotificationClick(res, notificationInfo),
			)
			return
		}
		const mailMetadata = await this.downloadMailMetadata(sseInfo, notificationInfo)
		if (mailMetadata == null) return
		this.notifier.submitGroupedNotification(mailMetadata.sender.address, mailMetadata.firstRecipient?.address ?? "", mailMetadata._id.join(","), (res) =>
			this.onMailNotificationClick(res, notificationInfo),
		)
	}

	private onMailNotificationClick(res: NotificationResult, notificationInfo: NotificationInfo) {
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

	private async downloadMailMetadata(sseInfo: SseInfo, ni: NotificationInfo): Promise<MailMetadata | null> {
		const url = this.makeMailMetadataUrl(sseInfo, assertNotNull(ni.mailId))

		// decrypt access token
		const credentials = await this.nativeCredentialFacade.loadByUserId(ni.userId)
		if (credentials == null) {
			log.warn(`Not found credentials to download notification, userId ${ni.userId}`)
			return null
		}

		log.debug(TAG, "downloading mail notification metadata")
		const headers: Record<string, string> = {
			v: tutanotaModelInfo.version.toString(),
			cv: this.appVersion,
			accessToken: credentials.accessToken,
		}

		try {
			const response = await this.fetch(url, {
				headers: headers,
				dispatcher: new Agent({ connectTimeout: 20000 }),
			})
			if (!response.ok) {
				throw handleRestError(neverNull(response.status), url.toString(), response.headers.get("Error-Id"), null)
			}

			const parsedResponse = await response.json()
			return parsedResponse as MailMetadata
		} catch (e) {
			log.debug(TAG, "Error fetching mail metadata, " + (e as Error).message)
			return null
		}
	}

	private makeMailMetadataUrl(sseInfo: SseInfo, mailId: IdTupleWrapper): URL {
		const url = new URL(sseInfo.sseOrigin)
		url.pathname = `rest/tutanota/mail/${base64ToBase64Url(mailId.listId)}/${base64ToBase64Url(mailId.listElementId)}`
		return url
	}

	async onAlarmNotification(alarmNotification: EncryptedAlarmNotification) {
		await this.alarmScheduler.handleAlarmNotification(alarmNotification)
	}

	async onUserRemoved(userId: Id) {
		await this.alarmScheduler.unscheduleAllAlarms(userId)
	}

	async onLocalDataInvalidated() {
		await this.alarmScheduler.unscheduleAllAlarms()
		await this.alarmStorage.removePushIdentifierKeys()
		await this.windowManager.invalidateAlarms()
	}
}
