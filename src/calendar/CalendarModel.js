//@flow
import type {CalendarMonthTimeRange} from "./CalendarUtils"
import {getAllDayDateUTC, getTimeZone} from "./CalendarUtils"
import {getStartOfDay, incrementDate} from "../api/common/utils/DateUtils"
import {getFromMap} from "../api/common/utils/MapUtils"
import type {DeferredObject} from "../api/common/utils/Utils"
import {clone, defer, downcast} from "../api/common/utils/Utils"
import type {AlarmIntervalEnum, EndTypeEnum, RepeatPeriodEnum} from "../api/common/TutanotaConstants"
import {AlarmInterval, EndType, FeatureType, OperationType, RepeatPeriod} from "../api/common/TutanotaConstants"
import {DateTime} from "luxon"
import {getAllDayDateLocal, getEventEnd, getEventStart, isAllDayEvent, isAllDayEventByTimes, isLongEvent} from "../api/common/utils/CommonCalendarUtils"
import {Notifications} from "../gui/Notifications"
import type {EntityUpdateData} from "../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../api/main/EventController"
import {locator} from "../api/main/MainLocator"
import {worker} from "../api/main/WorkerClient"
import {getElementId} from "../api/common/EntityFunctions"
import {load} from "../api/main/Entity"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {formatTime} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {isApp} from "../api/Env"
import {logins} from "../api/main/LoginController"
import {NotFoundError} from "../api/common/error/RestError"

export function addDaysForEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange) {
	const calculationDate = getStartOfDay(getEventStart(event))
	const eventEndDate = getEventEnd(event);

	// only add events when the start time is inside this month
	if (getEventStart(event).getTime() < month.start.getTime() || getEventStart(event).getTime() >= month.end.getTime()) {
		return
	}

	// if start time is in current month then also add events for subsequent months until event ends
	while (calculationDate.getTime() < eventEndDate.getTime()) {
		if (eventEndDate.getTime() >= month.start.getTime()) {
			getFromMap(events, calculationDate.getTime(), () => []).push(event)
		}
		incrementDate(calculationDate, 1)
	}
}

export function addDaysForRecurringEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange) {
	const repeatRule = event.repeatRule
	if (repeatRule == null) {
		throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(event))
	}
	const frequency: RepeatPeriodEnum = downcast(repeatRule.frequency)
	const interval = Number(repeatRule.interval)
	const isLong = isLongEvent(event)
	let eventStartTime = new Date(getEventStart(event))
	let eventEndTime = new Date(getEventEnd(event))
	// Loop by the frequency step
	let repeatEndTime = null
	let endOccurrences = null
	const allDay = isAllDayEvent(event)
	if (repeatRule.endType === EndType.Count) {
		endOccurrences = Number(repeatRule.endValue)
	} else if (repeatRule.endType === EndType.UntilDate) {
		// See CalendarEventDialog for an explanation why it's needed
		if (allDay) {
			repeatEndTime = getAllDayDateLocal(new Date(Number(repeatRule.endValue)))
		} else {
			repeatEndTime = new Date(Number(repeatRule.endValue))
		}
	}
	let calcStartTime = eventStartTime
	let calcEndTime = eventEndTime
	let iteration = 1
	while ((endOccurrences == null || iteration <= endOccurrences)
	&& (repeatEndTime == null || calcStartTime.getTime() < repeatEndTime)
	&& calcStartTime.getTime() < month.end.getTime()) {
		if (calcEndTime.getTime() >= month.start.getTime()) {
			const eventClone = clone(event)
			if (allDay) {
				eventClone.startTime = getAllDayDateUTC(calcStartTime)
				eventClone.endTime = getAllDayDateUTC(calcEndTime)
			} else {
				eventClone.startTime = new Date(calcStartTime)
				eventClone.endTime = new Date(calcEndTime)
			}
			if (isLong) {
				addDaysForLongEvent(events, eventClone, month)
			} else {
				addDaysForEvent(events, eventClone, month)
			}
		}
		calcStartTime = incrementByRepeatPeriod(eventStartTime, frequency, interval * iteration, repeatRule.timeZone)
		calcEndTime = incrementByRepeatPeriod(eventEndTime, frequency, interval * iteration, repeatRule.timeZone)
		iteration++
	}
}

export function addDaysForLongEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange) {
	// for long running events we create events for the month only

	// first start of event is inside month
	const eventStart = getEventStart(event).getTime()
	const eventEnd = getEventEnd(event).getTime()

	let calculationDate
	let eventEndInMonth

	if (eventStart >= month.start.getTime() && eventStart < month.end.getTime()) { // first: start of event is inside month
		calculationDate = getStartOfDay(new Date(eventStart))
		//eventEndInMonth = new Date(eventStart)
	} else if (eventStart < month.start.getTime()) { // start is before month
		calculationDate = new Date(month.start)
	} else {
		return // start date is after month end
	}

	if (eventEnd > month.start.getTime() && eventEnd <= month.end.getTime()) { //end is inside month
		eventEndInMonth = new Date(eventEnd)
	} else if (eventEnd > month.end.getTime()) { // end is after month end
		eventEndInMonth = new Date(month.end)
	} else {
		return // end is before start of month
	}

	while (calculationDate.getTime() < eventEndInMonth) {
		getFromMap(events, calculationDate.getTime(), () => []).push(event)
		incrementDate(calculationDate, 1)
	}

}


export function incrementByRepeatPeriod(date: Date, repeatPeriod: RepeatPeriodEnum, interval: number, ianaTimeZone: string): Date {
	const calculationDate = new Date(date)
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({days: interval}).toJSDate()
		case RepeatPeriod.WEEKLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({weeks: interval}).toJSDate()
		case RepeatPeriod.MONTHLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({months: interval}).toJSDate()
		case RepeatPeriod.ANNUALLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({years: interval}).toJSDate()
	}
	return calculationDate
}

const OCCURRENCES_SCHEDULED_AHEAD = 10

export function iterateEventOccurrences(
	now: Date,
	timeZone: string,
	eventStart: Date,
	eventEnd: Date,
	frequency: RepeatPeriodEnum,
	interval: number,
	endType: EndTypeEnum,
	endValue: number,
	alarmTrigger: AlarmIntervalEnum,
	localTimeZone: string,
	callback: (time: Date, occurrence: number) => mixed) {


	let occurrences = 0
	let futureOccurrences = 0

	const isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd)
	const calcEventStart = isAllDayEvent ? getAllDayDateLocal(eventStart) : eventStart
	const endDate = endType === EndType.UntilDate
		? isAllDayEvent
			? getAllDayDateLocal(new Date(endValue))
			: new Date(endValue)
		: null

	while (futureOccurrences < OCCURRENCES_SCHEDULED_AHEAD && (endType !== EndType.Count || occurrences < endValue)) {
		const occurrenceDate = incrementByRepeatPeriod(calcEventStart, frequency, interval * occurrences, isAllDayEvent ? localTimeZone : timeZone);

		if (endDate && occurrenceDate.getTime() >= endDate.getTime()) {
			break;
		}

		const alarmTime = calculateAlarmTime(occurrenceDate, alarmTrigger, localTimeZone);

		if (alarmTime >= now) {
			callback(alarmTime, occurrences);
			futureOccurrences++;
		}
		occurrences++;
	}
}

export function calculateAlarmTime(date: Date, interval: AlarmIntervalEnum, ianaTimeZone?: string): Date {
	let diff
	switch (interval) {
		case AlarmInterval.FIVE_MINUTES:
			diff = {minutes: 5}
			break
		case AlarmInterval.TEN_MINUTES:
			diff = {minutes: 10}
			break
		case AlarmInterval.THIRTY_MINUTES:
			diff = {minutes: 30}
			break
		case AlarmInterval.ONE_HOUR:
			diff = {hours: 1}
			break
		case AlarmInterval.ONE_DAY:
			diff = {days: 1}
			break
		case AlarmInterval.TWO_DAYS:
			diff = {days: 2}
			break
		case AlarmInterval.THREE_DAYS:
			diff = {days: 3}
			break
		case AlarmInterval.ONE_WEEK:
			diff = {weeks: 1}
			break
		default:
			diff = {}
	}
	return DateTime.fromJSDate(date, {zone: ianaTimeZone}).minus(diff).toJSDate()
}

class CalendarModel {
	_notifications: Notifications;
	_scheduledNotifications: Map<string, TimeoutID>;
	/**
	 * Map from calendar event element id to the deferred object with a promise of getting CREATE event for this calendar event
	 */
	_pendingAlarmRequests: Map<string, DeferredObject<void>>;

	constructor(notifications: Notifications, eventController: EventController) {
		this._notifications = notifications
		this._scheduledNotifications = new Map()
		this._pendingAlarmRequests = new Map()
		if (!isApp()) {
			eventController.addEntityListener((updates: $ReadOnlyArray<EntityUpdateData>) => {
				this._entityEventsReceived(updates)
			})
		}
	}

	scheduleAlarmsLocally(): Promise<void> {
		if (this._localAlarmsEnabled()) {
			return worker.loadAlarmEvents()
			             .then((eventsWithInfos) => {
				             eventsWithInfos.forEach(({event, userAlarmInfo}) => {
					             this.scheduleUserAlarmInfo(event, userAlarmInfo)
				             })
			             })
		} else {
			return Promise.resolve()
		}
	}

	scheduleUserAlarmInfo(event: CalendarEvent, userAlarmInfo: UserAlarmInfo) {
		const repeatRule = event.repeatRule
		if (repeatRule) {
			iterateEventOccurrences(new Date(),
				repeatRule.timeZone,
				event.startTime,
				event.endTime,
				downcast(repeatRule.frequency),
				Number(repeatRule.interval),
				downcast(repeatRule.endType) || EndType.Never,
				Number(repeatRule.endValue),
				downcast(userAlarmInfo.alarmInfo.trigger),
				getTimeZone(), (time, occurrence) => {
					this._scheduleNotification(getElementId(userAlarmInfo) + occurrence, event, time)
				})
		} else {
			if (getEventStart(event).getTime() > Date.now()) {
				this._scheduleNotification(getElementId(userAlarmInfo), event, calculateAlarmTime(event.startTime, downcast(userAlarmInfo.alarmInfo.trigger)))
			}
		}
	}

	_scheduleNotification(identifier: string, event: CalendarEvent, time: Date) {
		this._runAtDate(time, identifier, () => {
			const title = lang.get("reminder_label")
			const body = `${formatTime(getEventStart(event))} ${event.summary}`
			return this._notifications.showNotification(title, {body})
		})
	}

	_runAtDate(date: Date, identifier: string, func: () => mixed) {
		const now = Date.now()
		const then = date.getTime()
		const diff = Math.max((then - now), 0)
		const timeoutId = diff > 0x7FFFFFFF // setTimeout limit is MAX_INT32=(2^31-1)
			? setTimeout(() => this._runAtDate(date, identifier, func), 0x7FFFFFFF)
			: setTimeout(func, diff)
		this._scheduledNotifications.set(identifier, timeoutId)
	}

	_entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>) {
		for (let entityEventData of updates) {
			if (isUpdateForTypeRef(UserAlarmInfoTypeRef, entityEventData)) {
				if (entityEventData.operation === OperationType.CREATE) {
					const userAlarmInfoId = [entityEventData.instanceListId, entityEventData.instanceId]
					// Updates for UserAlarmInfo and CalendarEvent come in a
					// separate batches and there's a race between loading of the
					// UserAlarmInfo and creation of the event.
					// We try to load UserAlarmInfo. Then we wait until the
					// CalendarEvent is there (which might already be true)
					// and load it.
					load(UserAlarmInfoTypeRef, userAlarmInfoId).then((userAlarmInfo) => {
						const {listId, elementId} = userAlarmInfo.alarmInfo.calendarRef
						const deferredEvent = getFromMap(this._pendingAlarmRequests, elementId, defer)
						return deferredEvent.promise.then(() => {
							this._pendingAlarmRequests.delete(elementId)
							return load(CalendarEventTypeRef, [listId, elementId])
								.then(calendarEvent => {
									this.scheduleUserAlarmInfo(calendarEvent, userAlarmInfo)
								})
						})
					}).catch(NotFoundError, (e) => console.log(e, "Event or alarm were not found: ", entityEventData, e))
				} else if (entityEventData.operation === OperationType.DELETE) {
					this._scheduledNotifications.forEach((value, key) => {
						if (key.startsWith(entityEventData.instanceId)) {
							this._scheduledNotifications.delete(key)
							clearTimeout(value)
						}
					})
				}
			} else if (isUpdateForTypeRef(CalendarEventTypeRef, entityEventData)
				&& (entityEventData.operation === OperationType.CREATE || entityEventData.operation === OperationType.UPDATE)) {
				getFromMap(this._pendingAlarmRequests, entityEventData.instanceId, defer).resolve()
			}
		}
	}

	_localAlarmsEnabled(): boolean {
		return !isApp() && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableCalendar)
	}
}

export const calendarModel = new CalendarModel(new Notifications(), locator.eventController)
