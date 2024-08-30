import {
	assert,
	clone,
	downcast,
	filterInt,
	findAllAndRemove,
	getFirstOrThrow,
	getFromMap,
	getStartOfDay,
	incrementDate,
	insertIntoSortedArray,
	isNotNull,
	isSameDayOfDate,
	isValidDate,
	neverNull,
	TIMESTAMP_ZERO_YEAR,
} from "@tutao/tutanota-utils"
import { EndType, EventTextTimeOption, getWeekStart, RepeatPeriod, TimeFormat, WeekStart } from "../../api/common/TutanotaConstants"
import { DateTime, DurationLikeObject, FixedOffsetZone, IANAZone } from "luxon"
import {
	CalendarEvent,
	CalendarEventTypeRef,
	CalendarGroupRoot,
	CalendarRepeatRule,
	createCalendarRepeatRule,
	UserSettingsGroupRoot,
} from "../../api/entities/tutanota/TypeRefs.js"
import { CalendarEventTimes, DAYS_SHIFTED_MS, generateEventElementId, isAllDayEvent, isAllDayEventByTimes } from "../../api/common/utils/CommonCalendarUtils"
import { createDateWrapper, DateWrapper, RepeatRule, User } from "../../api/entities/sys/TypeRefs.js"
import { isSameId } from "../../api/common/utils/EntityUtils"
import type { Time } from "./Time.js"
import { CalendarInfo } from "../../../calendar-app/calendar/model/CalendarModel"
import { DateProvider } from "../../api/common/DateProvider"
import { EntityClient } from "../../api/common/EntityClient.js"
import { CalendarEventUidIndexEntry } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"

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

export function getDayRange(date: Date, zone: string): CalendarTimeRange {
	const startDateTime = DateTime.fromJSDate(date, {
		zone,
	}).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
	})
	const start = startDateTime.toJSDate().getTime()
	const end = startDateTime
		.plus({
			day: 1,
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

export function getEndOfDayWithZone(date: Date, zone: string): Date {
	return DateTime.fromJSDate(date, { zone }).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).toJSDate()
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
	return createCalendarRepeatRule({
		timeZone: timeZone,
		frequency: frequency,
		interval: String(interval),
		endValue: null,
		endType: "0",
		excludedDates: [],
	})
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
 * get all instances of all series in a list of event series progenitors that intersect with the given range.
 * will return a sorted array of instances (by start time), interleaving the series if necessary.
 *
 */
export function generateCalendarInstancesInRange(
	progenitors: ReadonlyArray<CalendarEvent>,
	range: CalendarTimeRange,
	max: number = Infinity,
	timeZone: string = getTimeZone(),
): Array<CalendarEvent> {
	const ret: Array<CalendarEvent> = []

	const getNextCandidate = (
		previousCandidate: CalendarEvent,
		generator: Generator<{
			startTime: Date
			endTime: Date
		}>,
		excludedDates: Array<DateWrapper>,
	) => {
		const allDay = isAllDayEvent(previousCandidate)
		const exclusions = allDay ? excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateForTimezone(date, timeZone) })) : excludedDates
		let current

		// not using for-of because that automatically closes the generator
		// when breaking or returning, and we want to suspend and resume iteration.
		while (ret.length < max) {
			current = generator.next()

			if (current.done) break

			let { startTime, endTime } = current.value
			if (startTime.getTime() > range.end) break
			// using "<=" because an all-day-event that lasts n days spans n+1 days,
			// ending at midnight utc on the day after. So they seem to intersect
			// the range if it starts on the day after the event ends.
			if (endTime.getTime() <= range.start) continue

			if (!isExcludedDate(startTime, exclusions)) {
				const nextCandidate = clone(previousCandidate)
				if (allDay) {
					nextCandidate.startTime = getAllDayDateUTCFromZone(startTime, timeZone)
					nextCandidate.endTime = getAllDayDateUTCFromZone(endTime, timeZone)
				} else {
					nextCandidate.startTime = new Date(startTime)
					nextCandidate.endTime = new Date(endTime)
				}
				return nextCandidate
			}
		}

		return null
	}

	// we need to have one candidate for each series and then check which one gets added first.
	// if we added one, we advance the generator that generated it to the next candidate and repeat.
	const generators: Array<{
		generator: Generator<{ startTime: Date; endTime: Date }>
		excludedDates: Array<DateWrapper>
		nextCandidate: CalendarEvent
	}> = progenitors
		.map((p) => {
			const generator = generateEventOccurrences(p, timeZone)
			const excludedDates = p.repeatRule?.excludedDates ?? []
			const nextCandidate = getNextCandidate(p, generator, excludedDates)
			if (nextCandidate == null) return null
			return {
				excludedDates,
				generator,
				nextCandidate,
			}
		})
		.filter(isNotNull)

	while (generators.length > 0) {
		// performance: put the smallest nextCandidate in front. we only change the first item in each iteration, so this should be quick to re-sort.
		// still O(n²) in the best case >:(
		// we might improve runtime here by re-inserting the new nextCandidate into the list manually using a linear or binary search instead of invoking
		// sort.
		// we can then also maintain an index to the first still-open generator instead of splicing out the first generator when it stops yielding instances.
		generators.sort((a, b) => (a.nextCandidate?.startTime.getTime() ?? 0) - (b.nextCandidate?.startTime.getTime() ?? 0))
		const first = getFirstOrThrow(generators)
		const newNext = getNextCandidate(first.nextCandidate, first.generator, first.excludedDates)

		ret.push(first.nextCandidate)

		if (newNext == null) {
			generators.splice(0, 1)
			continue
		}

		first.nextCandidate = newNext
	}
	return ret
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
 * generates all event occurrences in chronological order, including the progenitor.
 * terminates once the end condition of the repeat rule is hit.
 * @param event the event to iterate occurrences on.
 * @param timeZone
 */
function* generateEventOccurrences(event: CalendarEvent, timeZone: string): Generator<{ startTime: Date; endTime: Date }> {
	const { repeatRule } = event

	if (repeatRule == null) {
		yield event
		return
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
	weekdays: ReadonlyArray<string>
	weeks: ReadonlyArray<ReadonlyArray<CalendarDay>>
	/** the 1st of the month, might not be the first date in {@link weeks} because of the padding days. */
	beginningOfMonth: Date
}

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

export function findFirstPrivateCalendar(calendarInfo: ReadonlyMap<Id, CalendarInfo>): CalendarInfo | null {
	for (const calendar of calendarInfo.values()) {
		if (calendar.userIsOwner && !calendar.isExternal) return calendar
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

export function getFirstDayOfMonth(d: Date): Date {
	const date = new Date(d)
	date.setDate(1)
	return date
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
export function clipRanges(start: number, end: number, min: number, max: number): CalendarTimeRange | null {
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
	ZERO_MINUTES: { value: 0, unit: AlarmIntervalUnit.MINUTE },
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

/**
 * compare two lists of dates that are sorted from earliest to latest. return true if they are equivalent.
 */
export function areExcludedDatesEqual(e1: ReadonlyArray<DateWrapper>, e2: ReadonlyArray<DateWrapper>): boolean {
	if (e1.length !== e2.length) return false
	return e1.every(({ date }, i) => e2[i].date.getTime() === date.getTime())
}

export function areRepeatRulesEqual(r1: CalendarRepeatRule | null, r2: CalendarRepeatRule | null): boolean {
	return (
		r1 === r2 ||
		(r1?.endType === r2?.endType &&
			r1?.endValue === r2?.endValue &&
			r1?.frequency === r2?.frequency &&
			r1?.interval === r2?.interval &&
			/** r1?.timeZone === r2?.timeZone && we're ignoring time zone because it's not an observable change. */
			areExcludedDatesEqual(r1?.excludedDates ?? [], r2?.excludedDates ?? []))
	)
}

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

export enum CalendarType {
	NORMAL,
	URL, // External calendar
}
