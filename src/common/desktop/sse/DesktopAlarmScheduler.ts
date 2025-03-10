import { AlarmNotification } from "../../api/entities/sys/TypeRefs.js"
import type { DesktopNotifier } from "../DesktopNotifier"
import { NotificationResult } from "../DesktopNotifier"
import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import { log } from "../DesktopLog"
import type { AlarmScheduler } from "../../calendar/date/AlarmScheduler.js"
import { isSameDay } from "@tutao/tutanota-utils"
import { formatDateWithWeekdayAndTime, formatTime } from "../../misc/Formatter"
import { AesKey } from "@tutao/tutanota-crypto"

export class DesktopAlarmScheduler {
	constructor(
		private readonly wm: WindowManager,
		private readonly notifier: DesktopNotifier,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly alarmScheduler: AlarmScheduler,
	) {}

	async unscheduleAllAlarms(userId: Id | null = null): Promise<void> {
		const alarms = await this.alarmStorage.getScheduledAlarms()
		for (const alarm of alarms) {
			if (userId == null || alarm.user === userId) {
				this.cancelAlarms(alarm.alarmInfo.alarmIdentifier)
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

	async handleDeleteAlarm(alarmIdentifier: string) {
		this.cancelAlarms(alarmIdentifier)

		await this.alarmStorage.deleteAlarm(alarmIdentifier)
	}

	async handleCreateAlarm(an: AlarmNotification, newDeviceSessionKey: AesKey | null) {
		log.debug("creating alarm notification!")
		this.scheduleAlarms(an)
		await this.alarmStorage.storeAlarm(an, newDeviceSessionKey)
	}

	private cancelAlarms(alarmIdentifier: string): void {
		this.alarmScheduler.cancelAlarm(alarmIdentifier)
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
