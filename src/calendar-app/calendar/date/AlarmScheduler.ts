import type { Thunk } from "@tutao/tutanota-utils"
import { downcast } from "@tutao/tutanota-utils"
import { EndType } from "../../../common/api/common/TutanotaConstants.js"
import type { AlarmInfo, RepeatRule } from "../../../common/api/entities/sys/TypeRefs.js"
import type { ScheduledTimeoutId, Scheduler } from "../../../common/api/common/utils/Scheduler.js"
import { calculateAlarmTime, findNextAlarmOccurrence, getEventStartByTimes, getValidTimeZone, parseAlarmInterval } from "./CalendarUtils.js"
import { DateProvider } from "../../../common/api/common/DateProvider.js"

type NotificationSender = (eventTime: Date, summary: string) => void
type EventInfo = {
	startTime: Date
	endTime: Date
	summary: string
}

/**
 * knows how to translate a given calendar event with alarms into an
 * actual function call that is executed some time later (and maybe displays a notification).
 *
 * should stay independent of the way the actual notification is sent + rendered
 */
export class AlarmScheduler {
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
				parseAlarmInterval(alarmInfo.trigger),
				calculationLocalZone,
			)

			if (nextOccurrence) {
				this._scheduleAction(alarmInfo.alarmIdentifier, nextOccurrence.alarmTime, () => {
					notificationSender(nextOccurrence.eventTime, event.summary)

					// Schedule next occurrence
					this.scheduleAlarm(event, alarmInfo, repeatRule, notificationSender)
				})
			}
		} else {
			const eventStart = getEventStartByTimes(event.startTime, event.endTime, localZone)

			if (eventStart.getTime() > this._dateProvider.now()) {
				this._scheduleAction(alarmInfo.alarmIdentifier, calculateAlarmTime(eventStart, parseAlarmInterval(alarmInfo.trigger)), () =>
					notificationSender(eventStart, event.summary),
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
}
