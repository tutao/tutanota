import type { Thunk } from "@tutao/tutanota-utils"
import { downcast, isSameDay } from "@tutao/tutanota-utils"
import { formatDateWithWeekdayAndTime, formatTime } from "../../misc/Formatter"
import { EndType } from "../../api/common/TutanotaConstants"
import type { AlarmInfo, RepeatRule } from "../../api/entities/sys/TypeRefs.js"
import type { ScheduledTimeoutId, Scheduler } from "../../api/common/utils/Scheduler.js"
import { calculateAlarmTime, findNextAlarmOccurrence, getEventStartByTimes, getValidTimeZone } from "./CalendarUtils"
import { DateProvider } from "../../api/common/DateProvider"

type NotificationSender = (title: string, message: string) => void
type EventInfo = {
	startTime: Date
	endTime: Date
	summary: string
}

export interface AlarmScheduler {
	scheduleAlarm(event: EventInfo, alarmInfo: AlarmInfo, repeatRule: RepeatRule | null, notificationSender: NotificationSender): void

	cancelAlarm(alarmIdentifier: string): void
}

export class AlarmSchedulerImpl implements AlarmScheduler {
	readonly _scheduledNotifications: Map<string, ScheduledTimeoutId>
	readonly _scheduler: Scheduler
	readonly _dateProvider: DateProvider

	constructor(dateProvider: DateProvider, scheduler: Scheduler) {
		this._dateProvider = dateProvider
		this._scheduledNotifications = new Map()
		this._scheduler = scheduler
	}

	scheduleAlarm(event: EventInfo, alarmInfo: AlarmInfo, repeatRule: RepeatRule | null, notificationSender: NotificationSender): void {
		const localZone = this._dateProvider.timeZone()

		if (repeatRule) {
			let repeatTimeZone = getValidTimeZone(repeatRule.timeZone, localZone)
			let calculationLocalZone = getValidTimeZone(localZone)
			const nextOccurrence = findNextAlarmOccurrence(
				new Date(this._dateProvider.now()),
				repeatTimeZone,
				event.startTime,
				event.endTime,
				downcast(repeatRule.frequency),
				Number(repeatRule.interval),
				downcast(repeatRule.endType) || EndType.Never,
				Number(repeatRule.endValue),
				repeatRule.excludedDates.map(({ date }) => date),
				downcast(alarmInfo.trigger),
				calculationLocalZone,
			)

			if (nextOccurrence) {
				this._scheduleAction(alarmInfo.alarmIdentifier, nextOccurrence.alarmTime, () => {
					this._sendNotification(nextOccurrence.eventTime, event.summary, notificationSender)

					// Schedule next occurrence
					this.scheduleAlarm(event, alarmInfo, repeatRule, notificationSender)
				})
			}
		} else {
			const eventStart = getEventStartByTimes(event.startTime, event.endTime, localZone)

			if (eventStart.getTime() > this._dateProvider.now()) {
				this._scheduleAction(alarmInfo.alarmIdentifier, calculateAlarmTime(eventStart, downcast(alarmInfo.trigger)), () =>
					this._sendNotification(eventStart, event.summary, notificationSender),
				)
			}
		}
	}

	cancelAlarm(alarmIdentifier: string) {
		// try to cancel single first
		this._cancelOccurrence(alarmIdentifier)
	}

	_cancelOccurrence(alarmIdentifier: string) {
		const timeoutId = this._scheduledNotifications.get(alarmIdentifier)

		if (timeoutId != null) {
			this._scheduler.unscheduleTimeout(timeoutId)
		}
	}

	_scheduleAction(identifier: string, atTime: Date, action: Thunk) {
		const scheduledId = this._scheduler.scheduleAt(action, atTime)

		this._scheduledNotifications.set(identifier, scheduledId)
	}

	_sendNotification(eventTime: Date, summary: string, notificationSender: NotificationSender): void {
		let dateString: string

		if (isSameDay(eventTime, new Date(this._dateProvider.now()))) {
			dateString = formatTime(eventTime)
		} else {
			dateString = formatDateWithWeekdayAndTime(eventTime)
		}

		const body = `${dateString} ${summary}`
		notificationSender(body, body)
	}
}
