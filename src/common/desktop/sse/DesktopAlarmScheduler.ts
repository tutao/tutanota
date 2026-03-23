import { AlarmNotification } from "../../api/entities/sys/TypeRefs.js"
import type { DesktopNotifier } from "../notifications/DesktopNotifier"
import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopAlarmStorage } from "./DesktopAlarmStorage"
import { log } from "../DesktopLog"
import type { AlarmScheduler } from "../../calendar/date/AlarmScheduler.js"
import { ClientModelUntypedInstance } from "../../api/common/EntityTypes"

import { formatNotificationForDisplay } from "../../misc/Formatter"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"

export class DesktopAlarmScheduler {
	constructor(
		private readonly wm: WindowManager,
		private readonly notifier: DesktopNotifier,
		private readonly alarmStorage: DesktopAlarmStorage,
		private readonly alarmScheduler: AlarmScheduler,
	) {}

	async unscheduleAllAlarms(userId: Id | null = null): Promise<void> {
		try {
			const alarms = await this.alarmStorage.getScheduledAlarms()
			for (const alarm of alarms) {
				if (userId == null || alarm.getUser() === userId) {
					this.cancelAlarms(alarm.getAlarmId())
				}
			}
			return this.alarmStorage.deleteAllAlarms(userId)
		} catch (e) {
			log.info("failed to cancel alarm " + e.stack)
			return this.alarmStorage.deleteAllAlarms(null)
		}
	}

	/**
	 * read all stored alarms and reschedule the notifications
	 */
	async rescheduleAll(): Promise<void> {
		log.info("Rescheduling alarms...")
		const alarms = await this.alarmStorage.getScheduledAlarms()
		const decryptedAlarms = await Promise.all(
			alarms.map((alarm) => this.alarmStorage.decryptAlarmNotification(alarm.untypedInstance as unknown as ClientModelUntypedInstance)),
		)
		for (const alarm of decryptedAlarms) {
			this.scheduleAlarms(alarm)
		}
	}

	async handleDeleteAlarm(alarmIdentifier: string) {
		this.cancelAlarms(alarmIdentifier)

		await this.alarmStorage.deleteAlarm(alarmIdentifier)
	}

	async handleCreateAlarm(an: AlarmNotification) {
		log.debug("creating alarm notification!")
		this.scheduleAlarms(an)
		await this.alarmStorage.storeAlarm(an)
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
			const { title, body } = formatNotificationForDisplay(eventTime, summary, isAllDayEvent(eventInfo))
			this.notifier.showCountedUserNotification({
				title,
				body,
				userId: decAn.user,
				onClick: () => {
					this.wm.openCalendar({
						userId: decAn.user,
					})
				},
			})
		})
	}
}
