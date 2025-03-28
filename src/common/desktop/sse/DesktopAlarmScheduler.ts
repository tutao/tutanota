import { OperationType } from "../../api/common/TutanotaConstants"
import { AlarmNotification } from "../../api/entities/sys/TypeRefs.js"
import type { DesktopNotifier } from "../DesktopNotifier"
import { NotificationResult } from "../DesktopNotifier"
import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import type { DesktopNativeCryptoFacade } from "../DesktopNativeCryptoFacade"
import { log } from "../DesktopLog"
import type { AlarmScheduler } from "../../calendar/date/AlarmScheduler.js"
import { downcast, isSameDay } from "@tutao/tutanota-utils"
import { formatDateWithWeekdayAndTime, formatTime } from "../../misc/Formatter"
import { InstancePipeline } from "../../api/worker/crypto/InstancePipeline"

export interface NativeAlarmScheduler {
	handleAlarmNotification(an: AlarmNotification): Promise<void>

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
	async handleAlarmNotification(an: AlarmNotification): Promise<void> {
		if (an.operation === OperationType.CREATE) {
			await this.handleCreateAlarm(an)
		} else if (an.operation === OperationType.DELETE) {
			log.debug(`deleting alarm notifications for ${an.alarmInfo.alarmIdentifier}!`)

			this.handleDeleteAlarm(an)
		} else {
			console.warn(
				`received AlarmNotification (alarmInfo identifier ${an.alarmInfo.alarmIdentifier}) with unsupported operation ${an.alarmInfo.alarmIdentifier}, ignoring`,
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
			this.scheduleAlarms(alarm)
		}
	}

	private handleDeleteAlarm(an: AlarmNotification) {
		this.cancelAlarms(an)

		this.alarmStorage.deleteAlarm(an.alarmInfo.alarmIdentifier)
	}

	private async handleCreateAlarm(an: AlarmNotification) {
		log.debug("creating alarm notification!")
		// await this.decryptAndSchedule(an)
		this.scheduleAlarms(an)
		await this.alarmStorage.storeAlarm(an)
	}

	private cancelAlarms(an: AlarmNotification): void {
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
