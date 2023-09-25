import {
	assert,
	clone,
	downcast,
	filterInt,
	findAllAndRemove,
	findAndRemove,
	getFromMap,
	getStartOfDay,
	incrementDate,
	insertIntoSortedArray,
	isSameDay,
	isSameDayOfDate,
	isValidDate,
	neverNull,
	numberRange,
	TIMESTAMP_ZERO_YEAR,
	typedValues,
} from "@tutao/tutanota-utils"
import {
	AccountType,
	CalendarAttendeeStatus,
	defaultCalendarColor,
	EndType,
	EventTextTimeOption,
	getWeekStart,
	RepeatPeriod,
	ShareCapability,
	TimeFormat,
	WeekStart,
} from "../../api/common/TutanotaConstants"
import { DateTime, Duration, DurationLikeObject, FixedOffsetZone, IANAZone } from "luxon"
import {
	CalendarEvent,
	CalendarEventTypeRef,
	CalendarGroupRoot,
	CalendarRepeatRule,
	createCalendarRepeatRule,
	UserSettingsGroupRoot,
} from "../../api/entities/tutanota/TypeRefs.js"
import {
	CalendarEventTimes,
	cleanMailAddress,
	DAYS_SHIFTED_MS,
	generateEventElementId,
	isAllDayEvent,
	isAllDayEventByTimes,
} from "../../api/common/utils/CommonCalendarUtils"
import { lang } from "../../misc/LanguageViewModel"
import { formatDateTime, formatDateWithMonth, formatTime, timeStringFromParts } from "../../misc/Formatter"
import { size } from "../../gui/size"
import type { DateWrapper, RepeatRule } from "../../api/entities/sys/TypeRefs.js"
import { createDateWrapper, User } from "../../api/entities/sys/TypeRefs.js"
import { isColorLight } from "../../gui/base/Color"
import type { GroupColors } from "../view/CalendarView"
import { isSameId } from "../../api/common/utils/EntityUtils"
import type { Time } from "./Time.js"
import type { SelectorItemList } from "../../gui/base/DropDownSelector.js"
import type { CalendarInfo } from "../model/CalendarModel"
import { assertMainOrNode } from "../../api/common/Env"
import { ChildArray, Children } from "mithril"
import { DateProvider } from "../../api/common/DateProvider"
import { AllIcons } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { EventType } from "./eventeditor/CalendarEventModel.js"
import { hasCapabilityOnGroup } from "../../sharing/GroupUtils.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { CalendarEventUidIndexEntry } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"

assertMainOrNode()
export const CALENDAR_EVENT_HEIGHT: number = size.calendar_line_height + 2
export const TEMPORARY_EVENT_OPACITY = 0.7
export type CalendarTimeRange = {
	start: number
	end: number
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
	return `${groupId}${timestamp}@tuta.com`
}

export function timeString(date: Date, amPm: boolean): string {
	return timeStringFromParts(date.getHours(), date.getMinutes(), amPm)
}

export function timeStringInZone(date: Date, amPm: boolean, zone: string): string {
	const { hour, minute } = DateTime.fromJSDate(date, {
		zone,
	})
	return timeStringFromParts(hour, minute, amPm)
}

export function shouldDefaultToAmPmTimeFormat(): boolean {
	return lang.code === "en"
}

/** get the timestamps of the start date and end date of the month the given date is in. */
export function getMonthRange(date: Date, zone: string): CalendarTimeRange {
	const startDateTime = DateTime.fromJSDate(date, {
		zone,
	}).set({
		day: 1,
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
	})
	const start = startDateTime.toJSDate().getTime()
	const end = startDateTime
		.plus({
			month: 1,
		})
		.toJSDate()
		.getTime()
	return {
		start,
		end,
	}
}

/**
 * @param date a date object representing a calendar date (like 1st of May 2023 15:15) in {@param zone}
 * @param zone the time zone to calculate which calendar date {@param date} represents.
 * @returns a date object representing the beginning of the given day in local time, like 1st of May 2023 00:00)
 */
export function getStartOfDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate()
}

/** @param date a date object representing some time on some calendar date (like 1st of May 2023) in {@param zone}
 * @param zone the time zone for which to calculate the calendar date that {@param date} represents
 * @returns a date object representing the start of the next calendar date (2nd of May 2023 00:00) in {@param zone} */
export function getStartOfNextDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).plus({ day: 1 }).toJSDate()
}

export function calculateAlarmTime(date: Date, interval: AlarmInterval, ianaTimeZone?: string): Date {
	const diff = alarmIntervalToLuxonDurationLikeObject(interval)

	return DateTime.fromJSDate(date, {
		zone: ianaTimeZone,
	})
		.minus(diff)
		.toJSDate()
}

/** takes a date which encodes the day in UTC and produces a date that encodes the same date but in local time zone. All times must be 0. */
export function getAllDayDateForTimezone(utcDate: Date, zone: string): Date {
	return DateTime.fromJSDate(utcDate, { zone: "utc" })
		.setZone(zone, { keepLocalTime: true })
		.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
		.toJSDate()
}

export function incrementByRepeatPeriod(date: Date, repeatPeriod: RepeatPeriod, interval: number, ianaTimeZone: string): Date {
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					days: interval,
				})
				.toJSDate()

		case RepeatPeriod.WEEKLY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					weeks: interval,
				})
				.toJSDate()

		case RepeatPeriod.MONTHLY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					months: interval,
				})
				.toJSDate()

		case RepeatPeriod.ANNUALLY:
			return DateTime.fromJSDate(date, {
				zone: ianaTimeZone,
			})
				.plus({
					years: interval,
				})
				.toJSDate()

		default:
			throw new Error("Unknown repeat period")
	}
}

export function getValidTimeZone(zone: string, fallback?: string): string {
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

export class DefaultDateProvider implements DateProvider {
	now(): number {
		return Date.now()
	}

	timeZone(): string {
		return getTimeZone()
	}
}

export function createRepeatRuleWithValues(frequency: RepeatPeriod, interval: number, timeZone: string = getTimeZone()): CalendarRepeatRule {
	const rule = createCalendarRepeatRule()
	rule.timeZone = timeZone
	rule.frequency = frequency
	rule.interval = String(interval)
	return rule
}

export function colorForBg(color: string): string {
	return isColorLight(color) ? "black" : "white"
}

export const enum EventLayoutMode {
	/** Take event start and end times into account when laying out. */
	TimeBasedColumn,
	/** Each event is treated as if it would take the whole day when laying out. */
	DayBasedColumn,
}

/**
 * Function which sorts events into the "columns" and "rows" and renders them using {@param renderer}.
 * Columns are abstract and can be actually the rows. A single column progresses in time while multiple columns can happen in parallel.
 * in one column on a single day (it will "stretch" events from the day start until the next day).
 */
export function layOutEvents(
	events: Array<CalendarEvent>,
	zone: string,
	renderer: (columns: Array<Array<CalendarEvent>>) => ChildArray,
	layoutMode: EventLayoutMode,
): ChildArray {
	events.sort((e1, e2) => {
		const e1Start = getEventStart(e1, zone)
		const e2Start = getEventStart(e2, zone)
		if (e1Start < e2Start) return -1
		if (e1Start > e2Start) return 1
		const e1End = getEventEnd(e1, zone)
		const e2End = getEventEnd(e2, zone)
		if (e1End < e2End) return -1
		if (e1End > e2End) return 1
		return 0
	})
	let lastEventEnding: Date | null = null
	let lastEventStart: Date | null = null
	let columns: Array<Array<CalendarEvent>> = []
	const children: Array<Children> = []
	// Cache for calculation events
	const calcEvents = new Map()
	for (const e of events) {
		const calcEvent = getFromMap(calcEvents, e, () => getCalculationEvent(e, zone, layoutMode))
		// Check if a new event group needs to be started
		if (
			lastEventEnding != null &&
			lastEventStart != null &&
			lastEventEnding <= calcEvent.startTime.getTime() &&
			(layoutMode === EventLayoutMode.DayBasedColumn || !visuallyOverlaps(lastEventStart, lastEventEnding, calcEvent.startTime))
		) {
			// The latest event is later than any of the event in the
			// current group. There is no overlap. Output the current
			// event group and start a new event group.
			children.push(...renderer(columns))
			columns = [] // This starts new event group.

			lastEventEnding = null
			lastEventStart = null
		}

		// Try to place the event inside the existing columns
		let placed = false

		for (let i = 0; i < columns.length; i++) {
			const col = columns[i]
			const lastEvent = col[col.length - 1]
			const lastCalcEvent = getFromMap(calcEvents, lastEvent, () => getCalculationEvent(lastEvent, zone, layoutMode))

			if (
				!collidesWith(lastCalcEvent, calcEvent) &&
				(layoutMode === EventLayoutMode.DayBasedColumn || !visuallyOverlaps(lastCalcEvent.startTime, lastCalcEvent.endTime, calcEvent.startTime))
			) {
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

		// Remember the latest event end time and start time of the current group.
		// This is later used to determine if a new groups starts.
		if (lastEventEnding == null || lastEventEnding.getTime() < calcEvent.endTime.getTime()) {
			lastEventEnding = calcEvent.endTime
		}
		if (lastEventStart == null || lastEventStart.getTime() < calcEvent.startTime.getTime()) {
			lastEventStart = calcEvent.startTime
		}
	}
	children.push(...renderer(columns))
	return children
}

/** get an event that can be rendered to the screen. in day view, the event is returned as-is, otherwise it's stretched to cover each day
 * it occurs on completely. */
function getCalculationEvent(event: CalendarEvent, zone: string, eventLayoutMode: EventLayoutMode): CalendarEvent {
	if (eventLayoutMode === EventLayoutMode.DayBasedColumn) {
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

/**
 * This function checks whether two events collide based on their start and end time
 * Assuming vertical columns with time going top-to-bottom, this would be true in these cases:
 *
 * case 1:
 * +-----------+
 * |           |
 * |           |   +----------+
 * +-----------+   |          |
 *                 |          |
 *                 +----------+
 * case 2:
 * +-----------+
 * |           |   +----------+
 * |           |   |          |
 * |           |   +----------+
 * +-----------+
 *
 * There could be a case where they are flipped vertically, but we don't have them because earlier events will be always first. so the "left" top edge will
 * always be "above" the "right" top edge.
 */
function collidesWith(a: CalendarEvent, b: CalendarEvent): boolean {
	return a.endTime.getTime() > b.startTime.getTime() && a.startTime.getTime() < b.endTime.getTime()
}

/**
 * Due to the minimum height for events they overlap if a short event is directly followed by another event,
 * therefore, we check whether the event height is less than the minimum height.
 *
 * This does not cover all the cases but handles the case when the second event starts right after the first one.
 */
function visuallyOverlaps(firstEventStart: Date, firstEventEnd: Date, secondEventStart: Date): boolean {
	// We are only interested in the height on the last day of the event because an event ending later will take up the whole column until the next day anyway.
	const firstEventStartOnSameDay = isSameDay(firstEventStart, firstEventEnd) ? firstEventStart.getTime() : getStartOfDay(firstEventEnd).getTime()
	const eventDurationMs = firstEventEnd.getTime() - firstEventStartOnSameDay
	const eventDurationHours = eventDurationMs / (1000 * 60 * 60)
	const height = eventDurationHours * size.calendar_hour_height - size.calendar_event_border
	return firstEventEnd.getTime() === secondEventStart.getTime() && height < size.calendar_line_height
}

export function formatEventTime(event: CalendarEvent, showTime: EventTextTimeOption): string {
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
	let colSpan = 1

	for (let i = columnIndex + 1; i < columns.length; i++) {
		let col = columns[i]

		for (let j = 0; j < col.length; j++) {
			let ev1 = col[j]

			if (collidesWith(ev, ev1) || visuallyOverlaps(ev.startTime, ev.endTime, ev1.startTime)) {
				return colSpan
			}
		}

		colSpan++
	}

	return colSpan
}

/**
 * difference in whole 24-hour-intervals between two dates, not anticommutative.
 * Result is positive or 0 if b > a, result is negative or 0 otherwise
 */
export function getDiffIn24hIntervals(a: Date, b: Date, zone?: string): number {
	return Math.floor(DateTime.fromJSDate(b, { zone }).diff(DateTime.fromJSDate(a, { zone }), "day").days)
}

/**
 * difference in whole 60 minute intervals between two dates
 * result is 0 if the diff is less than 60 minutes, otherwise
 * positive if b is after a, otherwise negative.
 *
 * not anticommutative.
 */
export function getDiffIn60mIntervals(a: Date, b: Date): number {
	return Math.floor(DateTime.fromJSDate(b).diff(DateTime.fromJSDate(a), "hours").hours)
}

export function getEventColor(event: CalendarEvent, groupColors: GroupColors): string {
	return (event._ownerGroup && groupColors.get(event._ownerGroup)) ?? defaultCalendarColor
}

export function getStartOfWeek(date: Date, firstDayOfWeekFromOffset: number): Date {
	let firstDay

	if (firstDayOfWeekFromOffset > date.getDay()) {
		firstDay = date.getDay() + 7 - firstDayOfWeekFromOffset
	} else {
		firstDay = date.getDay() - firstDayOfWeekFromOffset
	}

	return incrementDate(getStartOfDay(date), -firstDay)
}

export function getRangeOfDays(startDay: Date, numDays: number): Array<Date> {
	let calculationDate = startDay
	const days: Date[] = []

	for (let i = 0; i < numDays; i++) {
		days.push(calculationDate)
		calculationDate = incrementDate(new Date(calculationDate), 1)
	}

	return days
}

/** Start of the week offset relative to Sunday (forward). */
export function getStartOfTheWeekOffset(weekStart: WeekStart): number {
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

/** {@see getStartOfTheWeekOffset} */
export function getStartOfTheWeekOffsetForUser(userSettingsGroupRoot: UserSettingsGroupRoot): number {
	return getStartOfTheWeekOffset(getWeekStart(userSettingsGroupRoot))
}

export function getTimeFormatForUser(userSettingsGroupRoot: UserSettingsGroupRoot): TimeFormat {
	// it's saved as a string, but is a const enum.
	return userSettingsGroupRoot.timeFormat as TimeFormat
}

export function getWeekNumber(startOfTheWeek: Date): number {
	// Currently it doesn't support US-based week numbering system with partial weeks.
	return DateTime.fromJSDate(startOfTheWeek).weekNumber
}

export function getEventEnd(event: CalendarEventTimes, timeZone: string): Date {
	if (isAllDayEvent(event)) {
		return getAllDayDateForTimezone(event.endTime, timeZone)
	} else {
		return event.endTime
	}
}

export function getEventStart({ startTime, endTime }: CalendarEventTimes, timeZone: string): Date {
	return getEventStartByTimes(startTime, endTime, timeZone)
}

export function getEventStartByTimes(startTime: Date, endTime: Date, timeZone: string): Date {
	if (isAllDayEventByTimes(startTime, endTime)) {
		return getAllDayDateForTimezone(startTime, timeZone)
	} else {
		return startTime
	}
}

/** @param date encodes some calendar date in {@param zone} (like the 1st of May 2023)
 * @returns {Date} encodes the same calendar date in UTC */
export function getAllDayDateUTCFromZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone }).setZone("utc", { keepLocalTime: true }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate()
}

export function isLongEvent(event: CalendarEvent, zone: string): boolean {
	// long events are longer than the event ID randomization range. we need to distinguish them
	// to be able to still load and display the ones overlapping the query range even though their
	// id might not be contained in the query timerange +- randomization range.
	// this also applies to events that repeat.
	return event.repeatRule != null || getEventEnd(event, zone).getTime() - getEventStart(event, zone).getTime() > DAYS_SHIFTED_MS
}

/** create an event id depending on the calendar it is in and on its length */
export function assignEventId(event: CalendarEvent, zone: string, groupRoot: CalendarGroupRoot): void {
	const listId = isLongEvent(event, zone) ? groupRoot.longEvents : groupRoot.shortEvents
	event._id = [listId, generateEventElementId(event.startTime.getTime())]
}

/** predicate that tells us if two CalendarEvent objects refer to the same instance or different ones.*/
export function isSameEventInstance(left: Pick<CalendarEvent, "_id" | "startTime">, right: Pick<CalendarEvent, "_id" | "startTime">): boolean {
	// in addition to the id we compare the start time equality to be able to distinguish repeating events. They have the same id but different start time.
	// altered events with recurrenceId never have the same Id as another event instance, but might start at the same time.
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

/**
 * we don't want to deal with some calendar event edge cases,
 * like pre-1970 events that would have negative timestamps.
 * during import, we can also get faulty events that are
 * impossible to create through the interface.
 */
export const enum CalendarEventValidity {
	InvalidContainsInvalidDate,
	InvalidEndBeforeStart,
	InvalidPre1970,
	Valid,
}

/**
 * check if a given event should be allowed to be created in a tutanota calendar.
 * @param event
 * @returns Enum describing the reason to reject the event, if any.
 */
export function checkEventValidity(event: CalendarEvent): CalendarEventValidity {
	if (!isValidDate(event.startTime) || !isValidDate(event.endTime)) {
		return CalendarEventValidity.InvalidContainsInvalidDate
	} else if (event.endTime.getTime() <= event.startTime.getTime()) {
		return CalendarEventValidity.InvalidEndBeforeStart
	} else if (event.startTime.getTime() < TIMESTAMP_ZERO_YEAR) {
		return CalendarEventValidity.InvalidPre1970
	}
	return CalendarEventValidity.Valid
}

const MAX_EVENT_ITERATIONS = 10000

/**
 * add the days the given {@param event} is happening on during the given {@param range} to {@param daysToEvents}.
 *
 * ignores repeat rules.
 * @param zone
 */
export function addDaysForEventInstance(daysToEvents: Map<number, Array<CalendarEvent>>, event: CalendarEvent, range: CalendarTimeRange, zone: string) {
	const { start: rangeStart, end: rangeEnd } = range
	const clippedRange = clipRanges(getEventStart(event, zone).getTime(), getEventEnd(event, zone).getTime(), rangeStart, rangeEnd)
	// the event and range do not intersect
	if (clippedRange == null) return
	const { start: eventStartInRange, end: eventEndInRange } = clippedRange
	let calculationDate = getStartOfDayWithZone(new Date(eventStartInRange), zone)
	let calculationTime = calculationDate.getTime()
	let iterations = 0

	while (calculationTime < rangeEnd) {
		assertDateIsValid(calculationDate)
		assert(iterations <= MAX_EVENT_ITERATIONS, "Run into the infinite loop, addDaysForEvent")
		if (calculationTime < eventEndInRange) {
			const eventsForCalculationDate = getFromMap(daysToEvents, calculationTime, () => [])
			insertIntoSortedArray(event, eventsForCalculationDate, eventComparator, isSameEventInstance)
		} else {
			// If the duration of the original event instance was reduced, we also have to delete the remaining days of the previous event instance.
			const removed = findAllAndRemove(
				getFromMap(daysToEvents, calculationTime, () => []),
				(e) => isSameEventInstance(e, event),
			)
			if (!removed) {
				// no further days this event instance occurred on
				break
			}
		}

		calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone)
		calculationTime = calculationDate.getTime()
		iterations++
	}
}

/** add the days a repeating {@param event} occurs on during {@param range} to {@param daysToEvents} by calling addDaysForEventInstance() for each of its
 * non-excluded instances.
 * @param timeZone
 */
export function addDaysForRecurringEvent(
	daysToEvents: Map<number, Array<CalendarEvent>>,
	event: CalendarEvent,
	range: CalendarTimeRange,
	timeZone: string = getTimeZone(),
) {
	const repeatRule = event.repeatRule

	if (repeatRule == null) {
		throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(event))
	}
	const allDay = isAllDayEvent(event)
	const exclusions = allDay
		? repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateForTimezone(date, timeZone) }))
		: repeatRule.excludedDates

	for (const { startTime, endTime } of generateEventOccurrences(event, timeZone)) {
		if (startTime.getTime() > range.end) break
		if (endTime.getTime() < range.start) continue
		if (isExcludedDate(startTime, exclusions)) {
			const eventsOnExcludedDay = daysToEvents.get(getStartOfDayWithZone(startTime, timeZone).getTime())
			if (!eventsOnExcludedDay) continue
			const eventOnThisDay = { _id: event._id, startTime }
			findAndRemove(eventsOnExcludedDay, (e) => isSameEventInstance(e, eventOnThisDay))
		} else {
			const eventClone = clone(event)
			if (allDay) {
				eventClone.startTime = getAllDayDateUTCFromZone(startTime, timeZone)
				eventClone.endTime = getAllDayDateUTCFromZone(endTime, timeZone)
			} else {
				eventClone.startTime = new Date(startTime)
				eventClone.endTime = new Date(endTime)
			}
			addDaysForEventInstance(daysToEvents, eventClone, range, timeZone)
		}
	}
}

/**
 * Returns the end date of a repeating rule that can be used to display in the ui.
 *
 * The actual end date that is stored on the repeat rule is always one day behind the displayed end date:
 * * for all-day events:
 *   - displayed end date: 2023-05-18
 *   - last occurrence can be: 2023-05-18
 *   - exported end date: 2023-05-18
 *   - actual timestamp on the entity: Midnight UTC 2023-05-19 (start of day)
 * * normal events behave the same except:
 *   - actual timestamp on the entity is Midnight local timezone 2023-05-19 (start of day)
 * @returns {Date}
 */
export function getRepeatEndTimeForDisplay(repeatRule: RepeatRule, isAllDay: boolean, timeZone: string): Date {
	if (repeatRule.endType !== EndType.UntilDate) {
		throw new Error("Event has no repeat rule end type is not UntilDate: " + JSON.stringify(repeatRule))
	}

	const rawEndDate = new Date(filterInt(repeatRule.endValue ?? "0"))
	const localDate = isAllDay ? getAllDayDateForTimezone(rawEndDate, timeZone) : rawEndDate
	// Shown date is one day behind the actual end (but it is still excluded)
	return incrementByRepeatPeriod(localDate, RepeatPeriod.DAILY, -1, timeZone)
}

/**
 * generates all event occurrences in chronological order
 * @param event the event to iterate occurrences on. must have a repeat rule
 * @param timeZone
 * the end condition of the repeat rule is hit or the callback returns false.
 */
function* generateEventOccurrences(event: CalendarEvent, timeZone: string): Generator<{ startTime: Date; endTime: Date }> {
	const { repeatRule } = event

	if (repeatRule == null) {
		throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(event))
	}

	const frequency: RepeatPeriod = downcast(repeatRule.frequency)
	const interval = Number(repeatRule.interval)
	let eventStartTime = getEventStart(event, timeZone)
	let eventEndTime = getEventEnd(event, timeZone)
	// Loop by the frequency step
	let repeatEndTime: Date | null = null
	let endOccurrences: number | null = null
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
	const calcDuration = allDay ? getDiffIn24hIntervals(eventStartTime, eventEndTime, timeZone) : eventEndTime.getTime() - eventStartTime.getTime()
	let calcEndTime = eventEndTime
	let iteration = 1

	while ((endOccurrences == null || iteration <= endOccurrences) && (repeatEndTime == null || calcStartTime.getTime() < repeatEndTime.getTime())) {
		assertDateIsValid(calcStartTime)
		assertDateIsValid(calcEndTime)
		yield { startTime: calcStartTime, endTime: calcEndTime }

		calcStartTime = incrementByRepeatPeriod(eventStartTime, frequency, interval * iteration, repeatTimeZone)
		calcEndTime = allDay
			? incrementByRepeatPeriod(calcStartTime, RepeatPeriod.DAILY, calcDuration, repeatTimeZone)
			: DateTime.fromJSDate(calcStartTime).plus(calcDuration).toJSDate()
		iteration++
	}
}

/**
 * return true if an event has more than one visible occurrence according to its repeat rule and excluded dates
 *
 * will compare exclusion time stamps with the exact date-time value of the occurrences startTime
 *
 * @param event the calendar event to check. to get correct results, this must be the progenitor.
 */
export function calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, alteredInstances }: CalendarEventUidIndexEntry): boolean {
	if (progenitor == null) {
		// this may happen if we accept multiple invites to altered instances without ever getting the progenitor.
		return alteredInstances.length > 1
	}
	const { repeatRule } = progenitor
	if (repeatRule == null) {
		return false
	}

	const { endType, endValue, excludedDates } = repeatRule
	if (endType === EndType.Never) {
		// there are infinite occurrences
		return true
	} else if (endType === EndType.Count && Number(endValue ?? "0") + alteredInstances.length > excludedDates.length + 1) {
		// if there are not enough exclusions to delete all but one occurrence, we can return true
		return true
	} else if (alteredInstances.length > 1) {
		return true
	} else {
		// we need to count occurrences and match them up against altered instances & exclusions.
		const excludedTimestamps = excludedDates.map(({ date }) => date.getTime())
		let i = 0
		// in our model, we have an extra exclusion for each altered instance. this code
		// assumes that this invariant is upheld here and does not match each recurrenceId
		// against an exclusion, but only tallies them up.
		let occurrencesFound = alteredInstances.length
		for (const { startTime } of generateEventOccurrences(progenitor, getTimeZone())) {
			const startTimestamp = startTime.getTime()
			while (i < excludedTimestamps.length && startTimestamp > excludedTimestamps[i]) {
				// exclusions are sorted
				i++
			}

			if (startTimestamp !== excludedTimestamps[i]) {
				// we found the place in the array where the startTimestamp would
				// be if it were in the array
				occurrencesFound += 1
				if (occurrencesFound > 1) return true
			}
		}

		return false
	}
}

/**
 * find out if a given date is in a list of excluded dates
 * @param currentDate the date to check
 * @param excludedDates a sorted list of excluded dates, earliest to latest
 */
function isExcludedDate(currentDate: Date, excludedDates: ReadonlyArray<DateWrapper> = []): boolean {
	return excludedDates.some((dw) => dw.date.getTime() === currentDate.getTime())
}

export type AlarmOccurrence = {
	alarmTime: Date
	occurrenceNumber: number
	eventTime: Date
}

export function findNextAlarmOccurrence(
	now: Date,
	timeZone: string,
	eventStart: Date,
	eventEnd: Date,
	frequency: RepeatPeriod,
	interval: number,
	endType: EndType,
	endValue: number,
	exclusions: Array<Date>,
	alarmTrigger: AlarmInterval,
	localTimeZone: string,
): AlarmOccurrence | null {
	let occurrenceNumber = 0
	const isAllDayEvent = isAllDayEventByTimes(eventStart, eventEnd)
	const calcEventStart = isAllDayEvent ? getAllDayDateForTimezone(eventStart, localTimeZone) : eventStart
	assertDateIsValid(calcEventStart)
	const endDate = endType === EndType.UntilDate ? (isAllDayEvent ? getAllDayDateForTimezone(new Date(endValue), localTimeZone) : new Date(endValue)) : null

	while (endType !== EndType.Count || occurrenceNumber < endValue) {
		const occurrenceDate = incrementByRepeatPeriod(calcEventStart, frequency, interval * occurrenceNumber, isAllDayEvent ? localTimeZone : timeZone)
		if (endDate && occurrenceDate.getTime() >= endDate.getTime()) {
			return null
		}

		if (!exclusions.some((d) => d.getTime() === occurrenceDate.getTime())) {
			const alarmTime = calculateAlarmTime(occurrenceDate, alarmTrigger, localTimeZone)

			if (alarmTime >= now) {
				return {
					alarmTime,
					occurrenceNumber: occurrenceNumber,
					eventTime: occurrenceDate,
				}
			}
		}
		occurrenceNumber++
	}
	return null
}

/** */
export type CalendarDay = {
	date: Date
	year: number
	month: number
	day: number
	/** days that are technically not part of the current month, but are shown to fill the grid. */
	isPaddingDay: boolean
}

export type CalendarMonth = {
	weekdays: Array<string>
	weeks: Array<Array<CalendarDay>>
}

/**
 * get an object representing the calendar month the given date is in.
 * @param date
 * @param firstDayOfWeekFromOffset
 * @return {{weeks: Array[], weekdays: Array}}
 */
export function getCalendarMonth(date: Date, firstDayOfWeekFromOffset: number, weekdayNarrowFormat: boolean): CalendarMonth {
	const weeks: Array<Array<CalendarDay>> = [[]]
	const calculationDate = getStartOfDay(date)
	calculationDate.setDate(1)
	let currentYear = calculationDate.getFullYear()
	let month = calculationDate.getMonth()
	// add "padding" days
	// getDay returns the day of the week (from 0 to 6) for the specified date (with first one being Sunday)
	let firstDay

	if (firstDayOfWeekFromOffset > calculationDate.getDay()) {
		firstDay = calculationDate.getDay() + 7 - firstDayOfWeekFromOffset
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
			isPaddingDay: true,
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
			isPaddingDay: false,
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
			isPaddingDay: true,
		})
		incrementDate(calculationDate, 1)
		dayCount++
	}

	const weekdays: string[] = []
	const weekdaysDate = new Date()
	incrementDate(weekdaysDate, -weekdaysDate.getDay() + firstDayOfWeekFromOffset) // get first day of week

	for (let i = 0; i < 7; i++) {
		weekdays.push(weekdayNarrowFormat ? lang.formats.weekdayNarrow.format(weekdaysDate) : lang.formats.weekdayShort.format(weekdaysDate))
		incrementDate(weekdaysDate, 1)
	}

	return {
		weekdays,
		weeks,
	}
}

export function formatEventDuration(event: CalendarEventTimes, zone: string, includeTimezone: boolean): string {
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

export function calendarAttendeeStatusSymbol(status: CalendarAttendeeStatus): string {
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

export const iconForAttendeeStatus: Record<CalendarAttendeeStatus, AllIcons> = Object.freeze({
	[CalendarAttendeeStatus.ACCEPTED]: Icons.CircleCheckmark,
	[CalendarAttendeeStatus.TENTATIVE]: Icons.CircleHelp,
	[CalendarAttendeeStatus.DECLINED]: Icons.CircleReject,
	[CalendarAttendeeStatus.NEEDS_ACTION]: Icons.CircleEmpty,
	[CalendarAttendeeStatus.ADDED]: Icons.CircleEmpty,
})

/**
 *
 * https://www.kanzaki.com/docs/ical/sequence.html
 * The "Organizer" includes this property in an iCalendar object that it sends to an
 * "Attendee" to specify the current version of the calendar component.
 *
 * The "Attendee" includes this property in an iCalendar object that it sends to the "Organizer"
 * to specify the version of the calendar component that the "Attendee" is referring to.
 *
 * @param sequence
 */
export function incrementSequence(sequence: string): string {
	const current = filterInt(sequence) || 0
	// Only the organizer should increase sequence numbers
	return String(current + 1)
}

export function findPrivateCalendar(calendarInfo: ReadonlyMap<Id, CalendarInfo>): CalendarInfo | null {
	for (const calendar of calendarInfo.values()) {
		if (!calendar.shared) {
			return calendar
		}
	}

	return null
}

/**
 * Prepare calendar event description to be shown to the user.
 *
 * It is needed to fix special format of links from Outlook which otherwise disappear during sanitizing.
 * They look like this:
 * ```
 * text<https://example.com>
 * ```
 *
 * @param description description to clean up
 * @param sanitizer optional sanitizer to apply after preparing the description
 */
export function prepareCalendarDescription(description: string, sanitizer: (s: string) => string): string {
	const prepared = description.replace(/<(http|https):\/\/[A-z0-9$-_.+!*‘(),\/?]+>/gi, (possiblyLink) => {
		try {
			const withoutBrackets = possiblyLink.slice(1, -1)
			const url = new URL(withoutBrackets)
			return `<a href="${url.toString()}">${withoutBrackets}</a>`
		} catch (e) {
			return possiblyLink
		}
	})

	return sanitizer(prepared)
}

export const DEFAULT_HOUR_OF_DAY = 6

/** Get CSS class for the date element. */
export function getDateIndicator(day: Date, selectedDate: Date | null): string {
	if (isSameDayOfDate(day, selectedDate)) {
		return ".accent-bg.circle"
	} else {
		return ""
	}
}

/**
 * Determine what format the time of an event should be rendered in given a surrounding time period
 */
export function getTimeTextFormatForLongEvent(ev: CalendarEvent, startDay: Date, endDay: Date, zone: string): EventTextTimeOption | null {
	const startsBefore = eventStartsBefore(startDay, zone, ev)
	const endsAfter = eventEndsAfterOrOn(endDay, zone, ev)

	if ((startsBefore && endsAfter) || isAllDayEvent(ev)) {
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
	newDate.setHours(time.hour)
	newDate.setMinutes(time.minute)
	return newDate
}

/**
 * Check if an event occurs during some time period of days, either partially or entirely
 * Expects that firstDayOfWeek is before lastDayOfWeek, and that event starts before it ends, otherwise result is invalid
 */
export function isEventBetweenDays(event: CalendarEvent, firstDay: Date, lastDay: Date, zone: string): boolean {
	const endOfDay = DateTime.fromJSDate(lastDay, { zone }).endOf("day").toJSDate()
	return !(eventEndsBefore(firstDay, zone, event) || eventStartsAfter(endOfDay, zone, event))
}

export const createRepeatRuleFrequencyValues = (): SelectorItemList<RepeatPeriod | null> => {
	return [
		{
			name: lang.get("calendarRepeatIntervalNoRepeat_label"),
			value: null,
		},
		{
			name: lang.get("calendarRepeatIntervalDaily_label"),
			value: RepeatPeriod.DAILY,
		},
		{
			name: lang.get("calendarRepeatIntervalWeekly_label"),
			value: RepeatPeriod.WEEKLY,
		},
		{
			name: lang.get("calendarRepeatIntervalMonthly_label"),
			value: RepeatPeriod.MONTHLY,
		},
		{
			name: lang.get("calendarRepeatIntervalAnnually_label"),
			value: RepeatPeriod.ANNUALLY,
		},
	]
}

export const createRepeatRuleEndTypeValues = (): SelectorItemList<EndType> => {
	return [
		{
			name: lang.get("calendarRepeatStopConditionNever_label"),
			value: EndType.Never,
		},
		{
			name: lang.get("calendarRepeatStopConditionOccurrences_label"),
			value: EndType.Count,
		},
		{
			name: lang.get("calendarRepeatStopConditionDate_label"),
			value: EndType.UntilDate,
		},
	]
}

export const createIntervalValues = (): SelectorItemList<number> => numberRange(1, 256).map((n) => ({ name: String(n), value: n }))

export function humanDescriptionForAlarmInterval<P>(value: AlarmInterval, locale: string): string {
	return Duration.fromObject(alarmIntervalToLuxonDurationLikeObject(value)).reconfigure({ locale: locale }).toHuman()
}

export const createAlarmIntervalItems = (locale: string): SelectorItemList<AlarmInterval> =>
	typedValues(StandardAlarmInterval).map((value) => {
		return {
			value,
			name: humanDescriptionForAlarmInterval(value, locale),
		}
	})

export const createAttendingItems = (): SelectorItemList<CalendarAttendeeStatus> => [
	{
		name: lang.get("yes_label"),
		value: CalendarAttendeeStatus.ACCEPTED,
	},
	{
		name: lang.get("maybe_label"),
		value: CalendarAttendeeStatus.TENTATIVE,
	},
	{
		name: lang.get("no_label"),
		value: CalendarAttendeeStatus.DECLINED,
	},
	{
		name: lang.get("pending_label"),
		value: CalendarAttendeeStatus.NEEDS_ACTION,
		selectable: false,
	},
]

export function getFirstDayOfMonth(d: Date): Date {
	const date = new Date(d)
	date.setDate(1)
	return date
}

/**
 *  find out how we ended up with this event, which determines the capabilities we have with it.
 *  for shared events in calendar where we have read-write access, we can still only view events that have
 *  attendees, because we could not send updates after we edit something
 * @param existingEvent the event in question.
 * @param calendars a list of calendars that this user has access to.
 * @param ownMailAddresses the list of mail addresses this user might be using.
 * @param user the user accessing the event.
 */
export function getEventType(
	existingEvent: Partial<CalendarEvent>,
	calendars: ReadonlyMap<Id, CalendarInfo>,
	ownMailAddresses: ReadonlyArray<string>,
	user: User,
): EventType {
	if (user.accountType === AccountType.EXTERNAL) {
		return EventType.EXTERNAL
	}

	const existingOrganizer = existingEvent.organizer
	const isOrganizer = existingOrganizer != null && ownMailAddresses.some((a) => cleanMailAddress(a) === existingOrganizer.address)

	if (existingEvent._ownerGroup == null) {
		if (existingOrganizer != null && !isOrganizer) {
			// OwnerGroup is not set for events from file, but we also require an organizer to treat it as an invite.
			return EventType.INVITE
		} else {
			// either the organizer exists and it's us, or the organizer does not exist and we can treat this as our event,
			// like for newly created events.
			return EventType.OWN
		}
	}

	const calendarInfoForEvent = calendars.get(existingEvent._ownerGroup) ?? null

	if (calendarInfoForEvent == null) {
		// event has an ownergroup, but it's not in one of our calendars. this might actually be an error.
		return EventType.SHARED_RO
	}

	if (calendarInfoForEvent.shared) {
		const canWrite = hasCapabilityOnGroup(user, calendarInfoForEvent.group, ShareCapability.Write)
		if (canWrite) {
			const organizerAddress = cleanMailAddress(existingOrganizer?.address ?? "")
			const wouldRequireUpdates: boolean =
				existingEvent.attendees != null && existingEvent.attendees.some((a) => cleanMailAddress(a.address.address) !== organizerAddress)
			return wouldRequireUpdates ? EventType.LOCKED : EventType.SHARED_RW
		} else {
			return EventType.SHARED_RO
		}
	}

	//For an event in a personal calendar there are 3 options
	if (existingOrganizer == null || existingEvent.attendees?.length === 0 || isOrganizer) {
		// 1. we are the organizer of the event or the event does not have an organizer yet
		// 2. we are not the organizer and the event does not have guests. it was created by someone we shared our calendar with (also considered our own event)
		return EventType.OWN
	} else {
		// 3. the event is an invitation that has another organizer and/or attendees.
		return EventType.INVITE
	}
}

/**
 * get the "primary" event of a series - the one that contains the repeat rule and is not a repeated or a rescheduled instance.
 * @param calendarEvent
 * @param entityClient
 */
export async function resolveCalendarEventProgenitor(calendarEvent: CalendarEvent, entityClient: EntityClient): Promise<CalendarEvent> {
	return calendarEvent.repeatRule ? await entityClient.load(CalendarEventTypeRef, calendarEvent._id) : calendarEvent
}

/** clip the range start-end to the range given by min-max. if the result would have length 0, null is returned. */
function clipRanges(start: number, end: number, min: number, max: number): CalendarTimeRange | null {
	const res = {
		start: Math.max(start, min),
		end: Math.min(end, max),
	}
	return res.start < res.end ? res : null
}

export enum AlarmIntervalUnit {
	MINUTE = "M",
	HOUR = "H",
	DAY = "D",
	WEEK = "W",
}

export const StandardAlarmInterval = Object.freeze({
	FIVE_MINUTES: { value: 5, unit: AlarmIntervalUnit.MINUTE },
	TEN_MINUTES: { value: 10, unit: AlarmIntervalUnit.MINUTE },
	THIRTY_MINUTES: { value: 30, unit: AlarmIntervalUnit.MINUTE },
	ONE_HOUR: { value: 1, unit: AlarmIntervalUnit.HOUR },
	ONE_DAY: { value: 1, unit: AlarmIntervalUnit.DAY },
	TWO_DAYS: { value: 2, unit: AlarmIntervalUnit.DAY },
	THREE_DAYS: { value: 3, unit: AlarmIntervalUnit.DAY },
	ONE_WEEK: { value: 1, unit: AlarmIntervalUnit.WEEK },
} as const satisfies Record<string, AlarmInterval>)

/**
 * Runtime representation of an alarm interval/alarm trigger.
 * Unlike iCal we only support one unit and alarms in the past
 * (represented here as non-negative numbers).
 */
export type AlarmInterval = Readonly<{
	unit: AlarmIntervalUnit
	value: number
}>

/**
 * Converts db representation of alarm to a runtime one.
 */
export function parseAlarmInterval(serialized: string): AlarmInterval {
	const matched = serialized.match(/^(\d+)([MHDW])$/)
	if (matched) {
		const [_, digits, unit] = matched
		const value = filterInt(digits)
		if (isNaN(value)) {
			throw new ParserError(`Invalid value: ${value}`)
		} else {
			return { value, unit: unit as AlarmIntervalUnit }
		}
	} else {
		throw new ParserError(`Invalid alarm interval: ${serialized}`)
	}
}

/**
 * Converts runtime representation of an alarm into a db one.
 */
export function serializeAlarmInterval(interval: AlarmInterval): string {
	return `${interval.value}${interval.unit}`
}

export function alarmIntervalToLuxonDurationLikeObject(alarmInterval: AlarmInterval): DurationLikeObject {
	switch (alarmInterval.unit) {
		case AlarmIntervalUnit.MINUTE:
			return { minutes: alarmInterval.value }
		case AlarmIntervalUnit.HOUR:
			return { hours: alarmInterval.value }
		case AlarmIntervalUnit.DAY:
			return { days: alarmInterval.value }
		case AlarmIntervalUnit.WEEK:
			return { weeks: alarmInterval.value }
	}
}
