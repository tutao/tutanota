import { OperationType } from "../../api/common/TutanotaConstants"
import { AlarmNotification, AlarmNotificationTypeRef } from "../../api/entities/sys/TypeRefs.js"
import type { DesktopNotifier } from "../DesktopNotifier"
import { NotificationResult } from "../DesktopNotifier"
import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import type { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { log } from "../DesktopLog"
import type { AlarmScheduler } from "../../calendar/date/AlarmScheduler.js"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { EncryptedAlarmNotification } from "../../native/common/EncryptedAlarmNotification.js"
import { downcast, isSameDay } from "@tutao/tutanota-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { hasError } from "../../api/common/utils/ErrorUtils.js"
import { formatDateWithWeekdayAndTime, formatTime } from "../../misc/Formatter"
import { InstancePipeline } from "../../api/worker/crypto/InstancePipeline"
import { uint8ArrayToKey } from "@tutao/tutanota-crypto"

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
		private readonly instancePipeline: InstancePipeline,
	) {}

	/**
	 * stores, deletes and schedules alarm notifications
	 * @param an the AlarmNotification to handle
	 */
	async handleAlarmNotification(an: EncryptedAlarmNotification): Promise<void> {
		if (an.getOperation() === OperationType.CREATE) {
			await this.handleCreateAlarm(an)
		} else if (an.getOperation() === OperationType.DELETE) {
			log.debug(`deleting alarm notifications for ${an.getAlarmId()}!`)

			this.handleDeleteAlarm(an)
		} else {
			console.warn(`received AlarmNotification (alarmInfo identifier ${an.getAlarmId()}) with unsupported operation ${an.getOperation()}, ignoring`)
		}
	}

	async unscheduleAllAlarms(userId: Id | null = null): Promise<void> {
		const alarms = await this.alarmStorage.getScheduledAlarms()
		for (const alarm of alarms) {
			if (userId == null || alarm.getUser() === userId) {
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
		const pushIdentifier = await an.getPushIdentifier()
		for (const current of pushIdentifier) {
			const pushIdentifierSessionKey = await this.alarmStorage.getPushIdentifierSessionKey(current.pushIdentifier)

			if (!pushIdentifierSessionKey) {
				// this key is either not for us (we don't have the right PushIdentifierSessionKey in our local storage)
				// or we couldn't decrypt the NotificationSessionKey for some reason
				// either way, we probably can't use it.
				continue
			}

			const sk = this.desktopCrypto.decryptKey(pushIdentifierSessionKey, current.pushIdentifierSessionEncSessionKey)

			const decAn: AlarmNotification = await this.instancePipeline.decryptAndMapToInstance(AlarmNotificationTypeRef, an.untypedInstance, sk)

			if (hasError(decAn)) {
				// some property of the AlarmNotification couldn't be decrypted with the selected key
				// throw away the key that caused the error and try the next one
				await this.alarmStorage.removePushIdentifierKey(elementIdPart(current.pushIdentifier))
				continue
			}

			// we just want to keep the key that can decrypt the AlarmNotification
			an.discardOtherNotificationSessionKeys(current.pushIdentifier)
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

		this.alarmStorage.deleteAlarm(an.getAlarmId())
	}

	private async handleCreateAlarm(an: EncryptedAlarmNotification) {
		log.debug("creating alarm notification!")
		await this.decryptAndSchedule(an)
		await this.alarmStorage.storeAlarm(an)
	}

	private cancelAlarms(an: AlarmNotification | EncryptedAlarmNotification): void {
		if (typeof downcast(an)["alarmInfo"] !== "undefined") {
			this.alarmScheduler.cancelAlarm(downcast<AlarmNotification>(an).alarmInfo.alarmIdentifier)
		} else {
			this.alarmScheduler.cancelAlarm(downcast<EncryptedAlarmNotification>(an).getAlarmId())
		}
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

export function formatNotificationForDisplay(eventTime: Date, summary: string): { title: string; body: string } {
	let dateString: string

	if (isSameDay(eventTime, new Date())) {
		dateString = formatTime(eventTime)
	} else {
		dateString = formatDateWithWeekdayAndTime(eventTime)
	}

	const body = `${dateString} ${summary}`

	return { body, title: body }
}
