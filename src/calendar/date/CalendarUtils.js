//@flow
import {
	clone,
	downcast,
	filterInt,
	findAllAndRemove,
	getEndOfDay,
	getFromMap,
	getStartOfDay,
	incrementDate,
	insertIntoSortedArray,
	isSameDay,
	isSameDayOfDate,
	isValidDate,
	neverNull
} from "@tutao/tutanota-utils"
import type {
	AlarmIntervalEnum,
	CalendarAttendeeStatusEnum,
	EndTypeEnum,
	EventTextTimeOptionEnum,
	RepeatPeriodEnum,
	WeekStartEnum
} from "../../api/common/TutanotaConstants"
import {
	AlarmInterval,
	CalendarAttendeeStatus,
	defaultCalendarColor,
	EndType,
	EventTextTimeOption,
	getWeekStart,
	RepeatPeriod,
	WeekStart
} from "../../api/common/TutanotaConstants"
import {DateTime, FixedOffsetZone, IANAZone} from "luxon"
import type {CalendarRepeatRule} from "../../api/entities/tutanota/CalendarRepeatRule"
import {createCalendarRepeatRule} from "../../api/entities/tutanota/CalendarRepeatRule"
import {DAYS_SHIFTED_MS, generateEventElementId, isAllDayEvent, isAllDayEventByTimes} from "../../api/common/utils/CommonCalendarUtils"
import {lang} from "../../misc/LanguageViewModel"
import {formatDateTime, formatDateWithMonth, formatTime, timeStringFromParts} from "../../misc/Formatter"
import {size} from "../../gui/size"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import type {CalendarGroupRoot} from "../../api/entities/tutanota/CalendarGroupRoot"
import type {User} from "../../api/entities/sys/User"
import {isColorLight} from "../../gui/base/Color"
import type {GroupColors} from "../view/CalendarView"
import {isSameId} from "../../api/common/utils/EntityUtils";
import type {UserSettingsGroupRoot} from "../../api/entities/tutanota/UserSettingsGroupRoot"
import type {Time} from "../../api/common/utils/Time"
import type {SelectorItemList} from "../../gui/base/DropDownSelectorN"
import type {RepeatRule} from "../../api/entities/sys/RepeatRule"
import type {CalendarInfo} from "../model/CalendarModel";
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export const CALENDAR_EVENT_HEIGHT: number = size.calendar_line_height + 2
export const TEMPORARY_EVENT_OPACITY = 0.7

export type CalendarMonthTimeRange = {
	start: Date,
	end: Date
}


export function eventStartsBefore(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventStart(event, zone).getTime() < currentDate.getTime()
}

export function eventEndsBefore(date: Date, zone: string, event: CalendarEvent): boolean {
	return getEventEnd(event, zone).getTime() < date.getTime()
}

export function eventStartsAfter(date: Date, zone: string, event: CalendarEvent): boolean {
	return getEventStart(event, zone).getTime() > date.getTime()
}

export function eventEndsAfterDay(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventEnd(event, zone).getTime() > getStartOfNextDayWithZone(currentDate, zone).getTime()
}

export function eventEndsAfterOrOn(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventEnd(event, zone).getTime() >= getStartOfNextDayWithZone(currentDate, zone).getTime()
}

export function generateUid(groupId: Id, timestamp: number): string {
	return `${groupId}${timestamp}@tutanota.com`
}


export function timeString(date: Date, amPm: boolean): string {
	return timeStringFromParts(date.getHours(), date.getMinutes(), amPm)
}

export function timeStringInZone(date: Date, amPm: boolean, zone: string): string {
	const {hour, minute} = DateTime.fromJSDate(date, {zone})
	return timeStringFromParts(hour, minute, amPm)
}

export function shouldDefaultToAmPmTimeFormat(): boolean {
	return lang.code === "en"
}


export function getMonth(date: Date, zone: string): CalendarMonthTimeRange {
	const startDateTime = DateTime.fromJSDate(date, {zone})
	                              .set({day: 1, hour: 0, minute: 0, second: 0, millisecond: 0})
	const start = startDateTime.toJSDate()
	const end = startDateTime.plus({month: 1}).toJSDate()
	return {start, end}
}

/**
 * Provides a date representing the beginning of the given date in local time.
 */
export function getStartOfDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, {zone}).set({hour: 0, minute: 0, second: 0, millisecond: 0}).toJSDate()
}

export function getStartOfNextDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, {zone}).set({hour: 0, minute: 0, second: 0, millisecond: 0}).plus({day: 1}).toJSDate()
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
			diff = {minutes: 5}
	}
	return DateTime.fromJSDate(date, {zone: ianaTimeZone}).minus(diff).toJSDate()
}

export function getAllDayDateForTimezone(utcDate: Date, timeZone: string): Date {
	return DateTime.fromObject({
		year: utcDate.getUTCFullYear(),
		month: utcDate.getUTCMonth() + 1,
		day: utcDate.getUTCDate(),
		zone: timeZone
	}).toJSDate()
}

export function incrementByRepeatPeriod(date: Date, repeatPeriod: RepeatPeriodEnum, interval: number, ianaTimeZone: string): Date {
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({days: interval}).toJSDate()
		case RepeatPeriod.WEEKLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({weeks: interval}).toJSDate()
		case RepeatPeriod.MONTHLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({months: interval}).toJSDate()
		case RepeatPeriod.ANNUALLY:
			return DateTime.fromJSDate(date, {zone: ianaTimeZone}).plus({years: interval}).toJSDate()
		default:
			throw new Error("Unknown repeat period")
	}
}

export function getEventStartByTimes(startTime: Date, endTime: Date, timeZone: string): Date {
	if (isAllDayEventByTimes(startTime, endTime)) {
		return getAllDayDateForTimezone(startTime, timeZone)
	} else {
		return startTime
	}
}

export function getValidTimeZone(zone: string, fallback: ?string): string {
	if (IANAZone.isValidZone(zone)) {
		return zone
	} else {
		if (fallback && IANAZone.isValidZone(fallback)) {
			console.warn(`Time zone ${zone} is not valid, falling back to ${fallback}`)
			return fallback
		} else {
			const actualFallback = FixedOffsetZone.instance(new Date().getTimezoneOffset()).name
			console.warn(`Fallback time zone ${zone} is not valid, falling back to ${actualFallback}`)
			return actualFallback
		}
	}
}

export function getTimeZone(): string {
	return DateTime.local().zoneName
}

export interface DateProvider {
	now(): number;

	timeZone(): string;
}

export class DateProviderImpl implements DateProvider {
	now(): number {
		return Date.now()
	}

	timeZone(): string {
		return getTimeZone()
	}
}

export function createRepeatRuleWithValues(frequency: RepeatPeriodEnum, interval: number): CalendarRepeatRule {
	const rule = createCalendarRepeatRule()
	rule.timeZone = getTimeZone()
	rule.frequency = frequency
	rule.interval = String(interval)
	return rule
}


export function colorForBg(color: string): string {
	return isColorLight(color) ? "black" : "white"
}


export function layOutEvents(events: Array<CalendarEvent>, zone: string,
                             renderer: (columns: Array<Array<CalendarEvent>>) => ChildArray, handleAsAllDay: boolean): ChildArray {
	events.sort((e1, e2) => {
		const e1Start = getEventStart(e1, zone)
		const e2Start = getEventStart(e2, zone)
		if (e1Start < e2Start) return -1;
		if (e1Start > e2Start) return 1;
		const e1End = getEventEnd(e1, zone)
		const e2End = getEventEnd(e2, zone)
		if (e1End < e2End) return -1;
		if (e1End > e2End) return 1;
		return 0;
	})
	let lastEventEnding: ?number = null
	let columns: Array<Array<CalendarEvent>> = []
	const children = []
	// Cache for calculation events
	const calcEvents = new Map()
	events.forEach((e) => {
		const calcEvent = getFromMap(calcEvents, e, () => getCalculationEvent(e, zone, handleAsAllDay))

		// Check if a new event group needs to be started
		if (lastEventEnding != null && lastEventEnding <= calcEvent.startTime.getTime()) {
			// The latest event is later than any of the event in the
			// current group. There is no overlap. Output the current
			// event group and start a new event group.
			children.push(...renderer(columns))
			columns = [];  // This starts new event group.
			lastEventEnding = null;
		}

		// Try to place the event inside the existing columns
		let placed = false
		for (let i = 0; i < columns.length; i++) {
			const col = columns[i]
			const lastEvent = col[col.length - 1]
			const lastCalcEvent = getFromMap(calcEvents, lastEvent, () => getCalculationEvent(lastEvent, zone, handleAsAllDay))
			if (!collidesWith(lastCalcEvent, calcEvent)) {
				col.push(e) // push real event here not calc event
				placed = true
				break
			}
		}

		// It was not possible to place the event. Add a new column
		// for the current event group.
		if (!placed) {
			columns.push([e])
		}

		// Remember the latest event end time of the current group.
		// This is later used to determine if a new groups starts.
		if (lastEventEnding == null || lastEventEnding < calcEvent.endTime.getTime()) {
			lastEventEnding = calcEvent.endTime.getTime()
		}
	})
	children.push(...renderer(columns))
	return children
}


function getCalculationEvent(event: CalendarEvent, zone: string, handleAsAllDay: boolean): CalendarEvent {
	if (handleAsAllDay) {
		const calcEvent = clone(event)
		if (isAllDayEvent(event)) {
			calcEvent.startTime = getAllDayDateForTimezone(event.startTime, zone)
			calcEvent.endTime = getAllDayDateForTimezone(event.endTime, zone)
		} else {
			calcEvent.startTime = getStartOfDayWithZone(event.startTime, zone)
			calcEvent.endTime = getStartOfNextDayWithZone(event.endTime, zone)
		}
		return calcEvent
	} else {
		return event
	}
}


function collidesWith(a: CalendarEvent, b: CalendarEvent): boolean {
	return a.endTime.getTime() > b.startTime.getTime() && a.startTime.getTime() < b.endTime.getTime()
}


export function formatEventTime(event: CalendarEvent, showTime: EventTextTimeOptionEnum): string {
	switch (showTime) {
		case EventTextTimeOption.START_TIME:
			return formatTime(event.startTime)
		case EventTextTimeOption.END_TIME:
			return ` - ${formatTime(event.endTime)}`
		case EventTextTimeOption.START_END_TIME:
			return `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
		default:
			throw new Error("Unknown time option " + showTime)
	}
}

export function expandEvent(ev: CalendarEvent, columnIndex: number, columns: Array<Array<CalendarEvent>>): number {
	let colSpan = 1;
	for (let i = columnIndex + 1; i < columns.length; i++) {
		let col = columns[i];
		for (let j = 0; j < col.length; j++) {
			let ev1 = col[j];
			if (collidesWith(ev, ev1)) {
				return colSpan;
			}
		}
		colSpan++;
	}
	return colSpan;
}

/**
 * Result is positive or 0 if b > a, result is negative or 0 otherwise
 */
export function getDiffInDays(a: Date, b: Date): number {
	// discard the time and time-zone information
	return Math.floor(DateTime.fromJSDate(b).diff(DateTime.fromJSDate(a), 'day').days)
}

/**
 * Result is positive or 0 if b > a, result is negative or 0 otherwise
 */
export function getDiffInHours(a: Date, b: Date): number {
	// discard the time and time-zone information
	return Math.floor(DateTime.fromJSDate(b).diff(DateTime.fromJSDate(a), 'hours').hours)
}

export function getEventColor(event: CalendarEvent, groupColors: GroupColors): string {
	return (event._ownerGroup && groupColors.get(event._ownerGroup)) ?? defaultCalendarColor
}

export function getStartOfWeek(date: Date, firstDayOfWeekFromOffset: number): Date {
	let firstDay
	if (firstDayOfWeekFromOffset > date.getDay()) {
		firstDay = (date.getDay() + 7) - firstDayOfWeekFromOffset
	} else {
		firstDay = date.getDay() - firstDayOfWeekFromOffset
	}
	return incrementDate(getStartOfDay(date), -firstDay)
}

export function getRangeOfDays(startDay: Date, numDays: number): Array<Date> {
	let calculationDate = startDay
	const days = []
	for (let i = 0; i < numDays; i++) {
		days.push(calculationDate)
		calculationDate = incrementDate(new Date(calculationDate), 1)
	}
	return days
}

export function getStartOfTheWeekOffset(weekStart: WeekStartEnum): number {
	switch (weekStart) {
		case WeekStart.SUNDAY:
			return 0
		case WeekStart.SATURDAY:
			return 6
		case WeekStart.MONDAY:
		default:
			return 1
	}
}

export function getStartOfTheWeekOffsetForUser(userSettingsGroupRoot: UserSettingsGroupRoot): number {
	return getStartOfTheWeekOffset(getWeekStart(userSettingsGroupRoot))
}


export function getWeekNumber(startOfTheWeek: Date): number {
	// Currently it doesn't support US-based week numbering system with partial weeks.
	return DateTime.fromJSDate(startOfTheWeek).weekNumber
}


export function getEventEnd(event: CalendarEvent, timeZone: string): Date {
	if (isAllDayEvent(event)) {
		return getAllDayDateForTimezone(event.endTime, timeZone)
	} else {
		return event.endTime
	}
}

export function getEventStart(event: CalendarEvent, timeZone: string): Date {
	return getEventStartByTimes(event.startTime, event.endTime, timeZone)
}

export function getAllDayDateUTCFromZone(date: Date, timeZone: string): Date {
	return DateTime.fromJSDate(date, {zone: timeZone})
	               .setZone('utc', {keepLocalTime: true})
	               .toJSDate()
}

export function isLongEvent(event: CalendarEvent, zone: string): boolean {
	return getEventEnd(event, zone).getTime() - getEventStart(event, zone).getTime() > DAYS_SHIFTED_MS
}

export function assignEventId(event: CalendarEvent, zone: string, groupRoot: CalendarGroupRoot): void {
	const listId = event.repeatRule || isLongEvent(event, zone) ? groupRoot.longEvents : groupRoot.shortEvents
	event._id = [listId, generateEventElementId(event.startTime.getTime())]
}

export function isSameEvent(left: CalendarEvent, right: CalendarEvent): boolean {
	// in addition to the id we compare the start time equality to be able to distinguish repeating events. They have the same id but different start time.
	return isSameId(left._id, right._id) && left.startTime.getTime() === right.startTime.getTime()
}


export function hasAlarmsForTheUser(user: User, event: CalendarEvent): boolean {
	const useAlarmList = neverNull(user.alarmInfoList).alarms
	return event.alarmInfos.some(([listId]) => isSameId(listId, useAlarmList))
}

function eventComparator(l: CalendarEvent, r: CalendarEvent): number {
	return l.startTime.getTime() - r.startTime.getTime()
}

function assertDateIsValid(date: Date) {
	if (!isValidDate(date)) {
		throw new Error("Date is invalid!")
	}
}

const MAX_EVENT_ITERATIONS = 10000

export function addDaysForEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange,
                                zone: string = getTimeZone()) {
	const eventStart = getEventStart(event, zone)
	let calculationDate = getStartOfDayWithZone(eventStart, zone)
	const eventEndDate = getEventEnd(event, zone)

	// only add events when the start time is inside this month
	if (eventStart.getTime() < month.start.getTime() || eventStart.getTime() >= month.end.getTime()) {
		return
	}

	let iterations = 0
	// if start time is in current month then also add events for subsequent months until event ends
	while (calculationDate.getTime() < eventEndDate.getTime()) {
		assertDateIsValid(calculationDate)
		if (iterations > MAX_EVENT_ITERATIONS) {
			throw new Error("Run into the infinite loop, addDaysForEvent")
		}
		if (eventEndDate.getTime() >= month.start.getTime()) {
			insertIntoSortedArray(event, getFromMap(events, calculationDate.getTime(), () => []), eventComparator, isSameEvent)
		}
		calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone)
		iterations++
	}
	// If the duration of the original event was reduced, we also have delete the remaining days of the original event
	const remainingDaysForExistingEvent: ?CalendarEvent = events.get(calculationDate.getTime())?.find(e => isSameEvent(e, event))
	if (remainingDaysForExistingEvent) {
		const existingEventEndDate = getEventEnd(remainingDaysForExistingEvent, zone)
		if (existingEventEndDate.getTime() > eventEndDate.getTime()) {
			while (calculationDate.getTime() < existingEventEndDate.getTime()) {
				assertDateIsValid(calculationDate)
				if (iterations > MAX_EVENT_ITERATIONS) {
					throw new Error("Run into the infinite loop, addDaysForEvent")
				}
				findAllAndRemove(getFromMap(events, calculationDate.getTime(), () => []), (e) => isSameEvent(e, event))
				calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone)
				iterations++
			}
		}
	}
}

/**
 * Returns the end date of a repeating rule that can be used to display in the ui.
 * The actual end date that is stored on the repeat rule is always one day behind the displayed end date. The end date is always excluded
 * but to  display the end date we want show the last date of the period which is included.
 * @returns {Date}
 */
export function getRepeatEndTime(repeatRule: RepeatRule, isAllDay: boolean, timeZone: string): Date {
	if (repeatRule.endType !== EndType.UntilDate) {
		throw new Error("Event has no repeat rule end type is not UntilDate: " + JSON.stringify(repeatRule))
	}
	const rawEndDate = new Date(Number(repeatRule.endValue))
	const localDate = isAllDay ? getAllDayDateForTimezone(rawEndDate, timeZone) : rawEndDate
	// Shown date is one day behind the actual end (for us it's excluded)
	return incrementByRepeatPeriod(localDate, RepeatPeriod.DAILY, -1, timeZone)
}

export function addDaysForRecurringEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange,
                                         timeZone: string) {
	const repeatRule = event.repeatRule
	if (repeatRule == null) {
		throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(event))
	}
	const frequency: RepeatPeriodEnum = downcast(repeatRule.frequency)
	const interval = Number(repeatRule.interval)
	const isLong = isLongEvent(event, timeZone)
	let eventStartTime = new Date(getEventStart(event, timeZone))
	let eventEndTime = new Date(getEventEnd(event, timeZone))
	// Loop by the frequency step
	let repeatEndTime = null
	let endOccurrences = null
	const allDay = isAllDayEvent(event)
	// For all-day events we should rely on the local time zone or at least we must use the same zone as in getAllDayDateUTCFromZone
	// below. If they are not in sync, then daylight saving shifts may cause us to extract wrong UTC date (day in repeat rule zone and in
	// local zone may be different).
	const repeatTimeZone = allDay ? timeZone : getValidTimeZone(repeatRule.timeZone)
	if (repeatRule.endType === EndType.Count) {
		endOccurrences = Number(repeatRule.endValue)
	} else if (repeatRule.endType === EndType.UntilDate) {
		// See CalendarEventDialog for an explanation why it's needed
		if (allDay) {
			repeatEndTime = getAllDayDateForTimezone(new Date(Number(repeatRule.endValue)), timeZone)
		} else {
			repeatEndTime = new Date(Number(repeatRule.endValue))
		}
	}
	let calcStartTime = eventStartTime
	const calcDuration = allDay ? getDiffInDays(eventStartTime, eventEndTime) : eventEndTime - eventStartTime
	let calcEndTime = eventEndTime
	let iteration = 1
	while ((endOccurrences == null || iteration <= endOccurrences)
	&& (repeatEndTime == null || calcStartTime.getTime() < repeatEndTime)
	&& calcStartTime.getTime() < month.end.getTime()) {
		assertDateIsValid(calcStartTime)
		assertDateIsValid(calcEndTime)
		if (iteration > MAX_EVENT_ITERATIONS) {
			throw new Error("Run into the infinite loop, addDaysForRecurringEvent")
		}

		if (calcEndTime.getTime() >= month.start.getTime()) {
			const eventClone = clone(event)
			if (allDay) {
				eventClone.startTime = getAllDayDateUTCFromZone(calcStartTime, timeZone)
				eventClone.endTime = getAllDayDateUTCFromZone(calcEndTime, timeZone)
			} else {
				eventClone.startTime = new Date(calcStartTime)
				eventClone.endTime = new Date(calcEndTime)
			}
			if (isLong) {
				addDaysForLongEvent(events, eventClone, month, timeZone)
			} else {
				addDaysForEvent(events, eventClone, month, timeZone)
			}
		}
		calcStartTime = incrementByRepeatPeriod(eventStartTime, frequency, interval * iteration, repeatTimeZone)
		calcEndTime = allDay
			? incrementByRepeatPeriod(calcStartTime, RepeatPeriod.DAILY, calcDuration, repeatTimeZone)
			: DateTime.fromJSDate(calcStartTime).plus(calcDuration).toJSDate()
		iteration++
	}
}

export function addDaysForLongEvent(events: Map<number, Array<CalendarEvent>>, event: CalendarEvent, month: CalendarMonthTimeRange,
                                    zone: string = getTimeZone()) {
	// for long running events we create events for the month only

	// first start of event is inside month
	const eventStart = getEventStart(event, zone).getTime()
	const eventEnd = getEventEnd(event, zone).getTime()

	let calculationDate
	let eventEndInMonth

	if (eventStart >= month.start.getTime() && eventStart < month.end.getTime()) { // first: start of event is inside month
		calculationDate = getStartOfDayWithZone(new Date(eventStart), zone)
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

	let iterations = 0
	while (calculationDate.getTime() < eventEndInMonth) {
		assertDateIsValid(calculationDate)
		insertIntoSortedArray(event, getFromMap(events, calculationDate.getTime(), () => []), eventComparator, isSameEvent)
		calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone)
		if (iterations++ > MAX_EVENT_ITERATIONS) {
			throw new Error("Run into the infinite loop, addDaysForLongEvent")
		}
	}
}

export type AlarmOccurrence = {alarmTime: Date, occurrenceNumber: number, eventTime: Date}

export function findNextAlarmOccurrence(
	now: Date,
	timeZone: string,
	eventStart: Date,
	eventEnd: Date,
	frequency: RepeatPeriodEnum,
	interval: number,
	endType: EndTypeEnum,
	endValue: number,
	alarmTrigger: AlarmIntervalEnum,
	localTimeZone: string
): ?AlarmOccurrence {
	let occurrenceNumber = 0

	const isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd)
	const calcEventStart = isAllDayEvent ? getAllDayDateForTimezone(eventStart, localTimeZone) : eventStart
	assertDateIsValid(calcEventStart)

	const endDate = endType === EndType.UntilDate
		? isAllDayEvent
			? getAllDayDateForTimezone(new Date(endValue), localTimeZone)
			: new Date(endValue)
		: null

	while (endType !== EndType.Count || occurrenceNumber < endValue) {
		const occurrenceDate = incrementByRepeatPeriod(calcEventStart, frequency, interval * occurrenceNumber,
			isAllDayEvent ? localTimeZone : timeZone
		)

		if (endDate && occurrenceDate.getTime() >= endDate.getTime()) {
			return null
		}

		const alarmTime = calculateAlarmTime(occurrenceDate, alarmTrigger, localTimeZone)

		if (alarmTime >= now) {
			return {alarmTime, occurrenceNumber: occurrenceNumber, eventTime: occurrenceDate}
		}
		occurrenceNumber++
	}
}

export type CalendarDay = {
	date: Date,
	year: number,
	month: number,
	day: number,
	paddingDay: boolean
}
export type CalendarMonth = {
	weekdays: Array<string>,
	weeks: Array<Array<CalendarDay>>
}

/**
 * @param date
 * @param firstDayOfWeekFromOffset
 * @return {{weeks: Array[], weekdays: Array}}
 */
export function getCalendarMonth(date: Date, firstDayOfWeekFromOffset: number, weekdayNarrowFormat: boolean): CalendarMonth {
	const weeks = [[]]
	const calculationDate = getStartOfDay(date)
	calculationDate.setDate(1)
	let currentYear = calculationDate.getFullYear()
	let month = calculationDate.getMonth()
	// add "padding" days
	// getDay returns the day of the week (from 0 to 6) for the specified date (with first one being Sunday)

	let firstDay
	if (firstDayOfWeekFromOffset > calculationDate.getDay()) {
		firstDay = (calculationDate.getDay() + 7) - firstDayOfWeekFromOffset
	} else {
		firstDay = calculationDate.getDay() - firstDayOfWeekFromOffset
	}

	let dayCount

	incrementDate(calculationDate, -firstDay)
	for (dayCount = 0; dayCount < firstDay; dayCount++) {
		weeks[0].push({
			date: new Date(calculationDate),
			day: calculationDate.getDate(),
			month: calculationDate.getMonth(),
			year: calculationDate.getFullYear(),
			paddingDay: true
		})
		incrementDate(calculationDate, 1)
	}

	// add actual days
	while (calculationDate.getMonth() === month) {
		if (weeks[0].length && dayCount % 7 === 0) {
			// start new week
			weeks.push([])
		}
		const dayInfo = {
			date: new Date(currentYear, month, calculationDate.getDate()),
			year: currentYear,
			month: month,
			day: calculationDate.getDate(),
			paddingDay: false
		}
		weeks[weeks.length - 1].push(dayInfo)
		incrementDate(calculationDate, 1)
		dayCount++
	}
	// add remaining "padding" days
	while (dayCount < 42) {
		if (dayCount % 7 === 0) {
			weeks.push([])
		}
		weeks[weeks.length - 1].push({
			day: calculationDate.getDate(),
			year: calculationDate.getFullYear(),
			month: calculationDate.getMonth(),
			date: new Date(calculationDate),
			paddingDay: true
		})
		incrementDate(calculationDate, 1)
		dayCount++
	}
	const weekdays = []
	const weekdaysDate = new Date()
	incrementDate(weekdaysDate, -weekdaysDate.getDay() + firstDayOfWeekFromOffset)// get first day of week
	for (let i = 0; i < 7; i++) {
		weekdays.push(weekdayNarrowFormat ? lang.formats.weekdayNarrow.format(weekdaysDate) : lang.formats.weekdayShort.format(weekdaysDate))
		incrementDate(weekdaysDate, 1)
	}
	return {
		weekdays,
		weeks
	}
}

export function formatEventDuration(event: CalendarEvent, zone: string, includeTimezone: boolean): string {
	if (isAllDayEvent(event)) {
		const startTime = getEventStart(event, zone)
		const startString = formatDateWithMonth(startTime)
		const endTime = incrementByRepeatPeriod(getEventEnd(event, zone), RepeatPeriod.DAILY, -1, zone)
		if (isSameDayOfDate(startTime, endTime)) {
			return `${lang.get("allDay_label")}, ${startString}`
		} else {
			return `${lang.get("allDay_label")}, ${startString} - ${formatDateWithMonth(endTime)}`
		}
	} else {
		const startString = formatDateTime(event.startTime)
		let endString
		if (isSameDay(event.startTime, event.endTime)) {
			endString = formatTime(event.endTime)
		} else {
			endString = formatDateTime(event.endTime)
		}
		return `${startString} - ${endString} ${includeTimezone ? getTimeZone() : ""}`
	}
}

export function calendarAttendeeStatusSymbol(status: CalendarAttendeeStatusEnum): string {
	switch (status) {
		case CalendarAttendeeStatus.ADDED:
		case CalendarAttendeeStatus.NEEDS_ACTION:
			return ""
		case CalendarAttendeeStatus.TENTATIVE:
			return "?"
		case CalendarAttendeeStatus.ACCEPTED:
			return "✓"
		case CalendarAttendeeStatus.DECLINED:
			return "❌"
		default:
			throw new Error("Unknown calendar attendee status: " + status)
	}
}

export function incrementSequence(sequence: string, isOwnEvent: boolean): string {
	const current = filterInt(sequence) || 0
	// Only the organizer should increase sequence numbers
	return String(isOwnEvent ? current + 1 : current)
}

export function getNextHalfHour(): Date {
	let date: Date = new Date()
	if (date.getMinutes() > 30) {
		date.setHours(date.getHours() + 1, 0)
	} else {
		date.setMinutes(30)
	}
	date.setMilliseconds(0)
	return date
}

export function findPrivateCalendar(calendarInfo: Map<Id, CalendarInfo>): ?CalendarInfo {
	for (const calendar of calendarInfo.values()) {
		if (!calendar.shared) {
			return calendar
		}
	}
	return null
}

/**
 * Prepare calendar event description to be shown to the user. Must be called *before* sanitizing.
 *
 * It is needed to fix special format of links from Outlook which otherwise disappear during sanitizing.
 * They look like this:
 * ```
 * text<https://example.com>
 * ```
 */
export function prepareCalendarDescription(description: string): string {
	return description.replace(/<(http|https):\/\/[A-z0-9$-_.+!*‘(),\/?]+>/gi, (possiblyLink) => {
		try {
			const withoutBrackets = possiblyLink.slice(1, -1)
			const url = new URL(withoutBrackets)
			return `<a href="${url.toString()}">${withoutBrackets}</a>`
		} catch (e) {
			return possiblyLink
		}
	})
}

export const DEFAULT_HOUR_OF_DAY = 6

/** Get CSS class for the date element. */
export function getDateIndicator(day: Date, selectedDate: ?Date): string {
	if (isSameDayOfDate(day, selectedDate)) {
		return ".accent-bg.circle"
	} else {
		return ""
	}
}

/**
 * Determine what format the time of an event should be rendered in given a surrounding time period
 */
export function getTimeTextFormatForLongEvent(ev: CalendarEvent, startDay: Date, endDay: Date, zone: string): ?EventTextTimeOptionEnum {
	const startsBefore = eventStartsBefore(startDay, zone, ev)
	const endsAfter = eventEndsAfterOrOn(endDay, zone, ev)

	if (startsBefore && endsAfter || isAllDayEvent(ev)) {
		return null
	} else if (startsBefore && !endsAfter) {
		return EventTextTimeOption.END_TIME
	} else if (!startsBefore && endsAfter) {
		return EventTextTimeOption.START_TIME
	} else {
		return EventTextTimeOption.START_END_TIME
	}
}

/**
 * Creates a new date with the year, month and day from the Date and the hours and minutes from the Time
 * @param date
 * @param time
 */
export function combineDateWithTime(date: Date, time: Time): Date {
	const newDate = new Date(date)
	newDate.setHours(time.hours)
	newDate.setMinutes(time.minutes)

	return newDate

}

/**
 * Check if an event occurs during some time period of days, either partially or entirely
 * Expects that firstDayOfWeek is before lastDayOfWeek, and that event starts before it ends, otherwise result is invalid
 */
export function isEventBetweenDays(event: CalendarEvent, firstDay: Date, lastDay: Date, zone: string): boolean {
	return !(eventEndsBefore(firstDay, zone, event) || eventStartsAfter(getEndOfDay(lastDay), zone, event))
}

export function createRepeatRuleFrequencyValues(): SelectorItemList<?RepeatPeriodEnum> {
	return [
		{name: lang.get("calendarRepeatIntervalNoRepeat_label"), value: null},
		{name: lang.get("calendarRepeatIntervalDaily_label"), value: RepeatPeriod.DAILY},
		{name: lang.get("calendarRepeatIntervalWeekly_label"), value: RepeatPeriod.WEEKLY},
		{name: lang.get("calendarRepeatIntervalMonthly_label"), value: RepeatPeriod.MONTHLY},
		{name: lang.get("calendarRepeatIntervalAnnually_label"), value: RepeatPeriod.ANNUALLY}
	]
}

export function createRepeatRuleEndTypeValues(): SelectorItemList<EndTypeEnum> {
	return [
		{name: lang.get("calendarRepeatStopConditionNever_label"), value: EndType.Never},
		{name: lang.get("calendarRepeatStopConditionOccurrences_label"), value: EndType.Count},
		{name: lang.get("calendarRepeatStopConditionDate_label"), value: EndType.UntilDate}
	]
}

export function getFirstDayOfMonth(d: Date): Date {
	const date = new Date(d)
	date.setDate(1)
	return date
}