import { OperationType } from "../../api/common/TutanotaConstants"
import type { AlarmNotification } from "../../api/entities/sys/TypeRefs.js"
import { AlarmNotificationTypeRef } from "../../api/entities/sys/TypeRefs.js"
import type { DesktopNotifier } from "../DesktopNotifier"
import { NotificationResult } from "../DesktopNotifier"
import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import type { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { log } from "../DesktopLog"
import type { AlarmScheduler } from "../../calendar/date/AlarmScheduler.js"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { resolveTypeReference } from "../../api/common/EntityFunctions"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification.js"
import { base64ToUint8Array } from "@tutao/tutanota-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { formatNotificationForDisplay } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { hasError } from "../../api/common/utils/ErrorUtils.js"

export interface NativeAlarmScheduler {
	handleAlarmNotification(an: EncryptedAlarmNotification): Promise<void>

	unscheduleAllAlarms(userId?: Id | null): Promise<void>

	rescheduleAll(): Promise<void>
}

export class DesktopAlarmScheduler implements NativeAlarmScheduler {
	constructor(
		private readonly wm: WindowManager,
		private readonly notifier: DesktopNotifier,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly desktopCrypto: DesktopNativeCryptoFacade,
		private readonly alarmScheduler: AlarmScheduler,
	) {}

	/**
	 * stores, deletes and schedules alarm notifications
	 * @param an the AlarmNotification to handle
	 */
	async handleAlarmNotification(an: EncryptedAlarmNotification): Promise<void> {
		if (an.operation === OperationType.CREATE) {
			await this.handleCreateAlarm(an)
		} else if (an.operation === OperationType.DELETE) {
			log.debug(`deleting alarm notifications for ${an.alarmInfo.alarmIdentifier}!`)

			this.handleDeleteAlarm(an)
		} else {
			console.warn(
				`received AlarmNotification (alarmInfo identifier ${an.alarmInfo.alarmIdentifier}) with unsupported operation ${an.operation}, ignoring`,
			)
		}
	}

	async unscheduleAllAlarms(userId: Id | null = null): Promise<void> {
		const alarms = await this.alarmStorage.getScheduledAlarms()
		for (const alarm of alarms) {
			if (userId == null || alarm.user === userId) {
				this.cancelAlarms(alarm)
			}
		}
		return this.alarmStorage.deleteAllAlarms(userId)
	}

	/**
	 * read all stored alarms and reschedule the notifications
	 */
	async rescheduleAll(): Promise<void> {
		const alarms = await this.alarmStorage.getScheduledAlarms()

		for (const alarm of alarms) {
			await this.decryptAndSchedule(alarm)
		}
	}

	private async decryptAndSchedule(an: EncryptedAlarmNotification): Promise<void> {
		for (const currentKey of an.notificationSessionKeys) {
			const pushIdentifierSessionKey = await this.alarmStorage.getPushIdentifierSessionKey(currentKey)

			if (!pushIdentifierSessionKey) {
				// this key is either not for us (we don't have the right PushIdentifierSessionKey in our local storage)
				// or we couldn't decrypt the NotificationSessionKey for some reason
				// either way, we probably can't use it.
				continue
			}

			const decAn: AlarmNotification = await this.desktopCrypto.decryptAndMapToInstance(
				await resolveTypeReference(AlarmNotificationTypeRef),
				an,
				pushIdentifierSessionKey,
				base64ToUint8Array(currentKey.pushIdentifierSessionEncSessionKey),
			)

			if (hasError(decAn)) {
				// some property of the AlarmNotification couldn't be decrypted with the selected key
				// throw away the key that caused the error and try the next one
				await this.alarmStorage.removePushIdentifierKey(elementIdPart(currentKey.pushIdentifier))
				continue
			}

			// we just want to keep the key that can decrypt the AlarmNotification
			an.notificationSessionKeys = [currentKey]
			return this.scheduleAlarms(decAn)
		}

		// none of the NotificationSessionKeys in the AlarmNotification worked.
		// this is indicative of a serious problem with the stored keys.
		// therefore, we should invalidate the sseInfo and throw away
		// our pushEncSessionKeys.
		throw new CryptoError("could not decrypt alarmNotification")
	}

	private handleDeleteAlarm(an: EncryptedAlarmNotification) {
		this.cancelAlarms(an)

		this.alarmStorage.deleteAlarm(an.alarmInfo.alarmIdentifier)
	}

	private async handleCreateAlarm(an: EncryptedAlarmNotification) {
		log.debug("creating alarm notification!")
		await this.decryptAndSchedule(an)
		await this.alarmStorage.storeAlarm(an)
	}

	private cancelAlarms(an: AlarmNotification | EncryptedAlarmNotification): void {
		this.alarmScheduler.cancelAlarm(an.alarmInfo.alarmIdentifier)
	}

	private scheduleAlarms(decAn: AlarmNotification): void {
		const eventInfo = {
			startTime: decAn.eventStart,
			endTime: decAn.eventEnd,
			summary: decAn.summary,
		}

		this.alarmScheduler.scheduleAlarm(eventInfo, decAn.alarmInfo, decAn.repeatRule, (eventTime, summary) => {
			const { title, body } = formatNotificationForDisplay(eventTime, summary)
			this.notifier.submitGroupedNotification(title, body, decAn.alarmInfo.alarmIdentifier, (res) => {
				if (res === NotificationResult.Click) {
					this.wm.openCalendar({
						userId: decAn.user,
					})
				}
			})
		})
	}
}
