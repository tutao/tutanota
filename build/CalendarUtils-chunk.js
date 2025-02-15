import { TIMESTAMP_ZERO_YEAR, assert, clone, decodeBase64, deepEqual, downcast, filterInt, findAllAndRemove, getFirstOrThrow, getFromMap, getStartOfDay, incrementDate, insertIntoSortedArray, isNotNull, isSameDayOfDate, isValidDate, neverNull } from "./dist2-chunk.js";
import { CLIENT_ONLY_CALENDARS, CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID, EndType, EventTextTimeOption, RepeatPeriod, WeekStart, getWeekStart } from "./TutanotaConstants-chunk.js";
import { DateTime, FixedOffsetZone, IANAZone } from "./luxon-chunk.js";
import { isSameId } from "./EntityUtils-chunk.js";
import { CalendarEventTypeRef, createCalendarRepeatRule } from "./TypeRefs-chunk.js";
import { DAYS_SHIFTED_MS, generateEventElementId, isAllDayEvent, isAllDayEventByTimes } from "./CommonCalendarUtils-chunk.js";
import { createDateWrapper } from "./TypeRefs2-chunk.js";
import { ParserError } from "./ParserCombinator-chunk.js";

//#region src/common/calendar/date/CalendarUtils.ts
function eventStartsBefore(currentDate, zone, event) {
	return getEventStart(event, zone).getTime() < currentDate.getTime();
}
function eventEndsBefore(date, zone, event) {
	return getEventEnd(event, zone).getTime() < date.getTime();
}
function eventStartsAfter(date, zone, event) {
	return getEventStart(event, zone).getTime() > date.getTime();
}
function eventEndsAfterDay(currentDate, zone, event) {
	return getEventEnd(event, zone).getTime() > getStartOfNextDayWithZone(currentDate, zone).getTime();
}
function eventEndsAfterOrOn(currentDate, zone, event) {
	return getEventEnd(event, zone).getTime() >= getStartOfNextDayWithZone(currentDate, zone).getTime();
}
function generateUid(groupId, timestamp) {
	return `${groupId}${timestamp}@tuta.com`;
}
function isBirthdayEvent(uid) {
	return uid?.includes(CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID) ?? false;
}
function getMonthRange(date, zone) {
	const startDateTime = DateTime.fromJSDate(date, { zone }).set({
		day: 1,
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	});
	const start = startDateTime.toJSDate().getTime();
	const end = startDateTime.plus({ month: 1 }).toJSDate().getTime();
	return {
		start,
		end
	};
}
function getDayRange(date, zone) {
	const startDateTime = DateTime.fromJSDate(date, { zone }).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	});
	const start = startDateTime.toJSDate().getTime();
	const end = startDateTime.plus({ day: 1 }).toJSDate().getTime();
	return {
		start,
		end
	};
}
function getStartOfDayWithZone(date, zone) {
	return DateTime.fromJSDate(date, { zone }).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	}).toJSDate();
}
function getStartOfNextDayWithZone(date, zone) {
	return DateTime.fromJSDate(date, { zone }).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	}).plus({ day: 1 }).toJSDate();
}
function getEndOfDayWithZone(date, zone) {
	return DateTime.fromJSDate(date, { zone }).set({
		hour: 23,
		minute: 59,
		second: 59,
		millisecond: 0
	}).toJSDate();
}
function calculateAlarmTime(date, interval, ianaTimeZone) {
	const diff = alarmIntervalToLuxonDurationLikeObject(interval);
	return DateTime.fromJSDate(date, { zone: ianaTimeZone }).minus(diff).toJSDate();
}
function getAllDayDateForTimezone(utcDate, zone) {
	return DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(zone, { keepLocalTime: true }).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	}).toJSDate();
}
function incrementByRepeatPeriod(date, repeatPeriod, interval, ianaTimeZone) {
	switch (repeatPeriod) {
		case RepeatPeriod.DAILY: return DateTime.fromJSDate(date, { zone: ianaTimeZone }).plus({ days: interval }).toJSDate();
		case RepeatPeriod.WEEKLY: return DateTime.fromJSDate(date, { zone: ianaTimeZone }).plus({ weeks: interval }).toJSDate();
		case RepeatPeriod.MONTHLY: return DateTime.fromJSDate(date, { zone: ianaTimeZone }).plus({ months: interval }).toJSDate();
		case RepeatPeriod.ANNUALLY: return DateTime.fromJSDate(date, { zone: ianaTimeZone }).plus({ years: interval }).toJSDate();
		default: throw new Error("Unknown repeat period");
	}
}
function getValidTimeZone(zone, fallback) {
	if (IANAZone.isValidZone(zone)) return zone;
else if (fallback && IANAZone.isValidZone(fallback)) {
		console.warn(`Time zone ${zone} is not valid, falling back to ${fallback}`);
		return fallback;
	} else {
		const actualFallback = FixedOffsetZone.instance(new Date().getTimezoneOffset()).name;
		console.warn(`Fallback time zone ${zone} is not valid, falling back to ${actualFallback}`);
		return actualFallback;
	}
}
function getTimeZone() {
	return DateTime.local().zoneName;
}
var DefaultDateProvider = class {
	now() {
		return Date.now();
	}
	timeZone() {
		return getTimeZone();
	}
};
function createRepeatRuleWithValues(frequency, interval, timeZone = getTimeZone()) {
	return createCalendarRepeatRule({
		timeZone,
		frequency,
		interval: String(interval),
		endValue: null,
		endType: "0",
		excludedDates: [],
		advancedRules: []
	});
}
function getDiffIn24hIntervals(a, b, zone) {
	return Math.floor(DateTime.fromJSDate(b, { zone }).diff(DateTime.fromJSDate(a, { zone }), "day").days);
}
function getDiffIn60mIntervals(a, b) {
	return Math.floor(DateTime.fromJSDate(b).diff(DateTime.fromJSDate(a), "hours").hours);
}
function getStartOfWeek(date, firstDayOfWeekFromOffset) {
	let firstDay;
	if (firstDayOfWeekFromOffset > date.getDay()) firstDay = date.getDay() + 7 - firstDayOfWeekFromOffset;
else firstDay = date.getDay() - firstDayOfWeekFromOffset;
	return incrementDate(getStartOfDay(date), -firstDay);
}
function getRangeOfDays(startDay, numDays) {
	let calculationDate = startDay;
	const days = [];
	for (let i = 0; i < numDays; i++) {
		days.push(calculationDate);
		calculationDate = incrementDate(new Date(calculationDate), 1);
	}
	return days;
}
function getStartOfTheWeekOffset(weekStart) {
	switch (weekStart) {
		case WeekStart.SUNDAY: return 0;
		case WeekStart.SATURDAY: return 6;
		case WeekStart.MONDAY:
		default: return 1;
	}
}
function getStartOfTheWeekOffsetForUser(userSettingsGroupRoot) {
	return getStartOfTheWeekOffset(getWeekStart(userSettingsGroupRoot));
}
function getTimeFormatForUser(userSettingsGroupRoot) {
	return userSettingsGroupRoot.timeFormat;
}
function getWeekNumber(startOfTheWeek) {
	return DateTime.fromJSDate(startOfTheWeek).weekNumber;
}
function getEventEnd(event, timeZone) {
	if (isAllDayEvent(event)) return getAllDayDateForTimezone(event.endTime, timeZone);
else return event.endTime;
}
function getEventStart({ startTime, endTime }, timeZone) {
	return getEventStartByTimes(startTime, endTime, timeZone);
}
function getEventStartByTimes(startTime, endTime, timeZone) {
	if (isAllDayEventByTimes(startTime, endTime)) return getAllDayDateForTimezone(startTime, timeZone);
else return startTime;
}
function getAllDayDateUTCFromZone(date, zone) {
	return DateTime.fromJSDate(date, { zone }).setZone("utc", { keepLocalTime: true }).set({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0
	}).toJSDate();
}
function isLongEvent(event, zone) {
	return event.repeatRule != null || getEventEnd(event, zone).getTime() - getEventStart(event, zone).getTime() > DAYS_SHIFTED_MS;
}
function assignEventId(event, zone, groupRoot) {
	const listId = isLongEvent(event, zone) ? groupRoot.longEvents : groupRoot.shortEvents;
	event._id = [listId, generateEventElementId(event.startTime.getTime())];
}
function isSameEventInstance(left, right) {
	return isSameId(left._id, right._id) && left.startTime.getTime() === right.startTime.getTime();
}
function hasAlarmsForTheUser(user, event) {
	const useAlarmList = neverNull(user.alarmInfoList).alarms;
	return event.alarmInfos.some(([listId]) => isSameId(listId, useAlarmList));
}
function eventComparator(l, r) {
	return l.startTime.getTime() - r.startTime.getTime();
}
function assertDateIsValid(date) {
	if (!isValidDate(date)) throw new Error("Date is invalid!");
}
let CalendarEventValidity = function(CalendarEventValidity$1) {
	CalendarEventValidity$1[CalendarEventValidity$1["InvalidContainsInvalidDate"] = 0] = "InvalidContainsInvalidDate";
	CalendarEventValidity$1[CalendarEventValidity$1["InvalidEndBeforeStart"] = 1] = "InvalidEndBeforeStart";
	CalendarEventValidity$1[CalendarEventValidity$1["InvalidPre1970"] = 2] = "InvalidPre1970";
	CalendarEventValidity$1[CalendarEventValidity$1["Valid"] = 3] = "Valid";
	return CalendarEventValidity$1;
}({});
function checkEventValidity(event) {
	if (!isValidDate(event.startTime) || !isValidDate(event.endTime)) return CalendarEventValidity.InvalidContainsInvalidDate;
else if (event.endTime.getTime() <= event.startTime.getTime()) return CalendarEventValidity.InvalidEndBeforeStart;
else if (event.startTime.getTime() < TIMESTAMP_ZERO_YEAR) return CalendarEventValidity.InvalidPre1970;
	return CalendarEventValidity.Valid;
}
const MAX_EVENT_ITERATIONS = 1e4;
function addDaysForEventInstance(daysToEvents, event, range, zone) {
	const { start: rangeStart, end: rangeEnd } = range;
	const clippedRange = clipRanges(getEventStart(event, zone).getTime(), getEventEnd(event, zone).getTime(), rangeStart, rangeEnd);
	if (clippedRange == null) return;
	const { start: eventStartInRange, end: eventEndInRange } = clippedRange;
	let calculationDate = getStartOfDayWithZone(new Date(eventStartInRange), zone);
	let calculationTime = calculationDate.getTime();
	let iterations = 0;
	while (calculationTime < rangeEnd) {
		assertDateIsValid(calculationDate);
		assert(iterations <= MAX_EVENT_ITERATIONS, "Run into the infinite loop, addDaysForEvent");
		if (calculationTime < eventEndInRange) {
			const eventsForCalculationDate = getFromMap(daysToEvents, calculationTime, () => []);
			insertIntoSortedArray(event, eventsForCalculationDate, eventComparator, isSameEventInstance);
		} else {
			const removed = findAllAndRemove(getFromMap(daysToEvents, calculationTime, () => []), (e) => isSameEventInstance(e, event));
			if (!removed) break;
		}
		calculationDate = incrementByRepeatPeriod(calculationDate, RepeatPeriod.DAILY, 1, zone);
		calculationTime = calculationDate.getTime();
		iterations++;
	}
}
function addDaysForRecurringEvent(daysToEvents, event, range, timeZone = getTimeZone()) {
	const repeatRule = event.repeatRule;
	if (repeatRule == null) throw new Error("Invalid argument: event doesn't have a repeatRule" + JSON.stringify(event));
	const allDay = isAllDayEvent(event);
	const exclusions = allDay ? repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateForTimezone(date, timeZone) })) : repeatRule.excludedDates;
	for (const { startTime, endTime } of generateEventOccurrences(event, timeZone)) {
		if (startTime.getTime() > range.end) break;
		if (endTime.getTime() < range.start) continue;
		if (isExcludedDate(startTime, exclusions)) {
			const eventsOnExcludedDay = daysToEvents.get(getStartOfDayWithZone(startTime, timeZone).getTime());
			if (!eventsOnExcludedDay) continue;
		} else {
			const eventClone = clone(event);
			if (allDay) {
				eventClone.startTime = getAllDayDateUTCFromZone(startTime, timeZone);
				eventClone.endTime = getAllDayDateUTCFromZone(endTime, timeZone);
			} else {
				eventClone.startTime = new Date(startTime);
				eventClone.endTime = new Date(endTime);
			}
			addDaysForEventInstance(daysToEvents, eventClone, range, timeZone);
		}
	}
}
function generateCalendarInstancesInRange(progenitors, range, max = Infinity, timeZone = getTimeZone()) {
	const ret = [];
	const getNextCandidate = (previousCandidate, generator, excludedDates) => {
		const allDay = isAllDayEvent(previousCandidate);
		const exclusions = allDay ? excludedDates.map(({ date }) => createDateWrapper({ date: getAllDayDateForTimezone(date, timeZone) })) : excludedDates;
		let current;
		while (ret.length < max) {
			current = generator.next();
			if (current.done) break;
			let { startTime, endTime } = current.value;
			if (startTime.getTime() > range.end) break;
			if (endTime.getTime() <= range.start) continue;
			if (!isExcludedDate(startTime, exclusions)) {
				const nextCandidate = clone(previousCandidate);
				if (allDay) {
					nextCandidate.startTime = getAllDayDateUTCFromZone(startTime, timeZone);
					nextCandidate.endTime = getAllDayDateUTCFromZone(endTime, timeZone);
				} else {
					nextCandidate.startTime = new Date(startTime);
					nextCandidate.endTime = new Date(endTime);
				}
				return nextCandidate;
			}
		}
		return null;
	};
	const generators = progenitors.map((p) => {
		const generator = generateEventOccurrences(p, timeZone);
		const excludedDates = p.repeatRule?.excludedDates ?? [];
		const nextCandidate = getNextCandidate(p, generator, excludedDates);
		if (nextCandidate == null) return null;
		return {
			excludedDates,
			generator,
			nextCandidate
		};
	}).filter(isNotNull);
	while (generators.length > 0) {
		generators.sort((a, b) => (a.nextCandidate?.startTime.getTime() ?? 0) - (b.nextCandidate?.startTime.getTime() ?? 0));
		const first = getFirstOrThrow(generators);
		const newNext = getNextCandidate(first.nextCandidate, first.generator, first.excludedDates);
		ret.push(first.nextCandidate);
		if (newNext == null) {
			generators.splice(0, 1);
			continue;
		}
		first.nextCandidate = newNext;
	}
	return ret;
}
function getRepeatEndTimeForDisplay(repeatRule, isAllDay, timeZone) {
	if (repeatRule.endType !== EndType.UntilDate) throw new Error("Event has no repeat rule end type is not UntilDate: " + JSON.stringify(repeatRule));
	const rawEndDate = new Date(filterInt(repeatRule.endValue ?? "0"));
	const localDate = isAllDay ? getAllDayDateForTimezone(rawEndDate, timeZone) : rawEndDate;
	return incrementByRepeatPeriod(localDate, RepeatPeriod.DAILY, -1, timeZone);
}
/**
* generates all event occurrences in chronological order, including the progenitor.
* terminates once the end condition of the repeat rule is hit.
* @param event the event to iterate occurrences on.
* @param timeZone
*/
function* generateEventOccurrences(event, timeZone) {
	const { repeatRule } = event;
	if (repeatRule == null) {
		yield event;
		return;
	}
	const frequency = downcast(repeatRule.frequency);
	const interval = Number(repeatRule.interval);
	let eventStartTime = getEventStart(event, timeZone);
	let eventEndTime = getEventEnd(event, timeZone);
	let repeatEndTime = null;
	let endOccurrences = null;
	const allDay = isAllDayEvent(event);
	const repeatTimeZone = allDay ? timeZone : getValidTimeZone(repeatRule.timeZone);
	if (repeatRule.endType === EndType.Count) endOccurrences = Number(repeatRule.endValue);
else if (repeatRule.endType === EndType.UntilDate) if (allDay) repeatEndTime = getAllDayDateForTimezone(new Date(Number(repeatRule.endValue)), timeZone);
else repeatEndTime = new Date(Number(repeatRule.endValue));
	let calcStartTime = eventStartTime;
	const calcDuration = allDay ? getDiffIn24hIntervals(eventStartTime, eventEndTime, timeZone) : eventEndTime.getTime() - eventStartTime.getTime();
	let calcEndTime = eventEndTime;
	let iteration = 1;
	while ((endOccurrences == null || iteration <= endOccurrences) && (repeatEndTime == null || calcStartTime.getTime() < repeatEndTime.getTime())) {
		assertDateIsValid(calcStartTime);
		assertDateIsValid(calcEndTime);
		yield {
			startTime: calcStartTime,
			endTime: calcEndTime
		};
		calcStartTime = incrementByRepeatPeriod(eventStartTime, frequency, interval * iteration, repeatTimeZone);
		calcEndTime = allDay ? incrementByRepeatPeriod(calcStartTime, RepeatPeriod.DAILY, calcDuration, repeatTimeZone) : DateTime.fromJSDate(calcStartTime).plus(calcDuration).toJSDate();
		iteration++;
	}
}
function calendarEventHasMoreThanOneOccurrencesLeft({ progenitor, alteredInstances }) {
	if (progenitor == null) return alteredInstances.length > 1;
	const { repeatRule } = progenitor;
	if (repeatRule == null) return false;
	const { endType, endValue, excludedDates } = repeatRule;
	if (endType === EndType.Never) return true;
else if (endType === EndType.Count && Number(endValue ?? "0") + alteredInstances.length > excludedDates.length + 1) return true;
else if (alteredInstances.length > 1) return true;
else {
		const excludedTimestamps = excludedDates.map(({ date }) => date.getTime());
		let i = 0;
		let occurrencesFound = alteredInstances.length;
		for (const { startTime } of generateEventOccurrences(progenitor, getTimeZone())) {
			const startTimestamp = startTime.getTime();
			while (i < excludedTimestamps.length && startTimestamp > excludedTimestamps[i]) i++;
			if (startTimestamp !== excludedTimestamps[i]) {
				occurrencesFound += 1;
				if (occurrencesFound > 1) return true;
			}
		}
		return false;
	}
}
/**
* find out if a given date is in a list of excluded dates
* @param currentDate the date to check
* @param excludedDates a sorted list of excluded dates, earliest to latest
*/
function isExcludedDate(currentDate, excludedDates = []) {
	return excludedDates.some((dw) => dw.date.getTime() === currentDate.getTime());
}
function findNextAlarmOccurrence(now, timeZone, eventStart, eventEnd, frequency, interval, endType, endValue, exclusions, alarmTrigger, localTimeZone) {
	let occurrenceNumber = 0;
	const isAllDayEvent$1 = isAllDayEventByTimes(eventStart, eventEnd);
	const calcEventStart = isAllDayEvent$1 ? getAllDayDateForTimezone(eventStart, localTimeZone) : eventStart;
	assertDateIsValid(calcEventStart);
	const endDate = endType === EndType.UntilDate ? isAllDayEvent$1 ? getAllDayDateForTimezone(new Date(endValue), localTimeZone) : new Date(endValue) : null;
	while (endType !== EndType.Count || occurrenceNumber < endValue) {
		const occurrenceDate = incrementByRepeatPeriod(calcEventStart, frequency, interval * occurrenceNumber, isAllDayEvent$1 ? localTimeZone : timeZone);
		if (endDate && occurrenceDate.getTime() >= endDate.getTime()) return null;
		if (!exclusions.some((d) => d.getTime() === occurrenceDate.getTime())) {
			const alarmTime = calculateAlarmTime(occurrenceDate, alarmTrigger, localTimeZone);
			if (alarmTime >= now) return {
				alarmTime,
				occurrenceNumber,
				eventTime: occurrenceDate
			};
		}
		occurrenceNumber++;
	}
	return null;
}
function incrementSequence(sequence) {
	const current = filterInt(sequence) || 0;
	return String(current + 1);
}
function findFirstPrivateCalendar(calendarInfo) {
	for (const calendar of calendarInfo.values()) if (calendar.userIsOwner && !calendar.isExternal) return calendar;
	return null;
}
function prepareCalendarDescription(description, sanitizer) {
	const prepared = description.replace(/<(http|https):\/\/[A-z0-9$-_.+!*‘(),/?]+>/gi, (possiblyLink) => {
		try {
			const withoutBrackets = possiblyLink.slice(1, -1);
			const url = new URL(withoutBrackets);
			return `<a href="${url.toString()}">${withoutBrackets}</a>`;
		} catch (e) {
			return possiblyLink;
		}
	});
	return sanitizer(prepared);
}
const DEFAULT_HOUR_OF_DAY = 6;
function getDateIndicator(day, selectedDate) {
	if (isSameDayOfDate(day, selectedDate)) return ".accent-bg.circle";
else return "";
}
function getTimeTextFormatForLongEvent(ev, startDay, endDay, zone) {
	const startsBefore = eventStartsBefore(startDay, zone, ev);
	const endsAfter = eventEndsAfterOrOn(endDay, zone, ev);
	if (startsBefore && endsAfter || isAllDayEvent(ev)) return null;
else if (startsBefore && !endsAfter) return EventTextTimeOption.END_TIME;
else if (!startsBefore && endsAfter) return EventTextTimeOption.START_TIME;
else return EventTextTimeOption.START_END_TIME;
}
function combineDateWithTime(date, time) {
	const newDate = new Date(date);
	newDate.setHours(time.hour);
	newDate.setMinutes(time.minute);
	return newDate;
}
function isEventBetweenDays(event, firstDay, lastDay, zone) {
	const endOfDay = DateTime.fromJSDate(lastDay, { zone }).endOf("day").toJSDate();
	return !(eventEndsBefore(firstDay, zone, event) || eventStartsAfter(endOfDay, zone, event));
}
function getFirstDayOfMonth(d) {
	const date = new Date(d);
	date.setDate(1);
	return date;
}
async function resolveCalendarEventProgenitor(calendarEvent, entityClient) {
	return calendarEvent.repeatRule ? await entityClient.load(CalendarEventTypeRef, calendarEvent._id) : calendarEvent;
}
function clipRanges(start, end, min, max) {
	const res = {
		start: Math.max(start, min),
		end: Math.min(end, max)
	};
	return res.start < res.end ? res : null;
}
let AlarmIntervalUnit = function(AlarmIntervalUnit$1) {
	AlarmIntervalUnit$1["MINUTE"] = "M";
	AlarmIntervalUnit$1["HOUR"] = "H";
	AlarmIntervalUnit$1["DAY"] = "D";
	AlarmIntervalUnit$1["WEEK"] = "W";
	return AlarmIntervalUnit$1;
}({});
const StandardAlarmInterval = Object.freeze({
	ZERO_MINUTES: {
		value: 0,
		unit: AlarmIntervalUnit.MINUTE
	},
	FIVE_MINUTES: {
		value: 5,
		unit: AlarmIntervalUnit.MINUTE
	},
	TEN_MINUTES: {
		value: 10,
		unit: AlarmIntervalUnit.MINUTE
	},
	THIRTY_MINUTES: {
		value: 30,
		unit: AlarmIntervalUnit.MINUTE
	},
	ONE_HOUR: {
		value: 1,
		unit: AlarmIntervalUnit.HOUR
	},
	ONE_DAY: {
		value: 1,
		unit: AlarmIntervalUnit.DAY
	},
	TWO_DAYS: {
		value: 2,
		unit: AlarmIntervalUnit.DAY
	},
	THREE_DAYS: {
		value: 3,
		unit: AlarmIntervalUnit.DAY
	},
	ONE_WEEK: {
		value: 1,
		unit: AlarmIntervalUnit.WEEK
	}
});
function alarmIntervalToLuxonDurationLikeObject(alarmInterval) {
	switch (alarmInterval.unit) {
		case AlarmIntervalUnit.MINUTE: return { minutes: alarmInterval.value };
		case AlarmIntervalUnit.HOUR: return { hours: alarmInterval.value };
		case AlarmIntervalUnit.DAY: return { days: alarmInterval.value };
		case AlarmIntervalUnit.WEEK: return { weeks: alarmInterval.value };
	}
}
function areExcludedDatesEqual(e1, e2) {
	if (e1.length !== e2.length) return false;
	return e1.every(({ date }, i) => e2[i].date.getTime() === date.getTime());
}
function areRepeatRulesEqual(r1, r2) {
	return r1 === r2 || r1?.endType === r2?.endType && r1?.endValue === r2?.endValue && r1?.frequency === r2?.frequency && r1?.interval === r2?.interval && areExcludedDatesEqual(r1?.excludedDates ?? [], r2?.excludedDates ?? []) && deepEqual(r1?.advancedRules, r2?.advancedRules);
}
function parseAlarmInterval(serialized) {
	const matched = serialized.match(/^(\d+)([MHDW])$/);
	if (matched) {
		const [_, digits, unit] = matched;
		const value = filterInt(digits);
		if (isNaN(value)) throw new ParserError(`Invalid value: ${value}`);
else return {
			value,
			unit
		};
	} else throw new ParserError(`Invalid alarm interval: ${serialized}`);
}
let CalendarType = function(CalendarType$1) {
	CalendarType$1[CalendarType$1["NORMAL"] = 0] = "NORMAL";
	CalendarType$1[CalendarType$1["URL"] = 1] = "URL";
	CalendarType$1[CalendarType$1["CLIENT_ONLY"] = 2] = "CLIENT_ONLY";
	return CalendarType$1;
}({});
function isClientOnlyCalendar(calendarId) {
	const clientOnlyId = calendarId.match(/#(.*)/)?.[1];
	return CLIENT_ONLY_CALENDARS.has(clientOnlyId);
}
function isClientOnlyCalendarType(calendarType) {
	return calendarType === CalendarType.CLIENT_ONLY;
}
function isNormalCalendarType(calendarType) {
	return calendarType === CalendarType.NORMAL;
}
function isExternalCalendarType(calendarType) {
	return calendarType === CalendarType.URL;
}
function hasSourceUrl(groupSettings) {
	return isNotNull(groupSettings?.sourceUrl) && groupSettings?.sourceUrl !== "";
}
function getCalendarType(groupSettings, groupInfo) {
	if (hasSourceUrl(groupSettings)) return CalendarType.URL;
	if (isClientOnlyCalendar(groupSettings ? groupSettings._id : groupInfo.group)) return CalendarType.CLIENT_ONLY;
	return CalendarType.NORMAL;
}
function extractYearFromBirthday(birthday) {
	if (!birthday) return null;
	const dateParts = birthday.split("-");
	const partsLength = dateParts.length;
	if (partsLength !== 3) return null;
	return Number.parseInt(dateParts[0]);
}
async function retrieveClientOnlyEventsForUser(logins, events, localEvents) {
	if (!await logins.getUserController().isNewPaidPlan()) return [];
	const clientOnlyEvents = events.filter(([calendarId, _]) => isClientOnlyCalendar(calendarId)).flatMap((event) => event.join("/"));
	const retrievedEvents = [];
	for (const event of Array.from(localEvents.values()).flat()) if (clientOnlyEvents.includes(event.event._id.join("/"))) retrievedEvents.push(event.event);
	return retrievedEvents;
}
function calculateContactsAge(birthYear, currentYear) {
	if (!birthYear) return null;
	return currentYear - birthYear;
}
function extractContactIdFromEvent(id) {
	if (id == null) return null;
	return decodeBase64("utf-8", id);
}

//#endregion
export { AlarmIntervalUnit, CalendarEventValidity, CalendarType, DEFAULT_HOUR_OF_DAY, DefaultDateProvider, StandardAlarmInterval, addDaysForEventInstance, addDaysForRecurringEvent, alarmIntervalToLuxonDurationLikeObject, areExcludedDatesEqual, areRepeatRulesEqual, assignEventId, calculateAlarmTime, calculateContactsAge, calendarEventHasMoreThanOneOccurrencesLeft, checkEventValidity, clipRanges, combineDateWithTime, createRepeatRuleWithValues, eventComparator, eventEndsAfterDay, eventEndsAfterOrOn, eventEndsBefore, eventStartsAfter, eventStartsBefore, extractContactIdFromEvent, extractYearFromBirthday, findFirstPrivateCalendar, findNextAlarmOccurrence, generateCalendarInstancesInRange, generateUid, getAllDayDateForTimezone, getAllDayDateUTCFromZone, getCalendarType, getDateIndicator, getDayRange, getDiffIn24hIntervals, getDiffIn60mIntervals, getEndOfDayWithZone, getEventEnd, getEventStart, getEventStartByTimes, getFirstDayOfMonth, getMonthRange, getRangeOfDays, getRepeatEndTimeForDisplay, getStartOfDayWithZone, getStartOfNextDayWithZone, getStartOfTheWeekOffset, getStartOfTheWeekOffsetForUser, getStartOfWeek, getTimeFormatForUser, getTimeTextFormatForLongEvent, getTimeZone, getValidTimeZone, getWeekNumber, hasAlarmsForTheUser, hasSourceUrl, incrementByRepeatPeriod, incrementSequence, isBirthdayEvent, isClientOnlyCalendar, isClientOnlyCalendarType, isEventBetweenDays, isExternalCalendarType, isLongEvent, isNormalCalendarType, isSameEventInstance, parseAlarmInterval, prepareCalendarDescription, resolveCalendarEventProgenitor, retrieveClientOnlyEventsForUser };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJVdGlscy1jaHVuay5qcyIsIm5hbWVzIjpbImN1cnJlbnREYXRlOiBEYXRlIiwiem9uZTogc3RyaW5nIiwiZXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJkYXRlOiBEYXRlIiwiZ3JvdXBJZDogSWQiLCJ0aW1lc3RhbXA6IG51bWJlciIsInVpZD86IHN0cmluZyB8IG51bGwiLCJpbnRlcnZhbDogQWxhcm1JbnRlcnZhbCIsImlhbmFUaW1lWm9uZT86IHN0cmluZyIsInV0Y0RhdGU6IERhdGUiLCJyZXBlYXRQZXJpb2Q6IFJlcGVhdFBlcmlvZCIsImludGVydmFsOiBudW1iZXIiLCJpYW5hVGltZVpvbmU6IHN0cmluZyIsImZhbGxiYWNrPzogc3RyaW5nIiwiZnJlcXVlbmN5OiBSZXBlYXRQZXJpb2QiLCJ0aW1lWm9uZTogc3RyaW5nIiwiYTogRGF0ZSIsImI6IERhdGUiLCJ6b25lPzogc3RyaW5nIiwiZmlyc3REYXlPZldlZWtGcm9tT2Zmc2V0OiBudW1iZXIiLCJzdGFydERheTogRGF0ZSIsIm51bURheXM6IG51bWJlciIsImRheXM6IERhdGVbXSIsIndlZWtTdGFydDogV2Vla1N0YXJ0IiwidXNlclNldHRpbmdzR3JvdXBSb290OiBVc2VyU2V0dGluZ3NHcm91cFJvb3QiLCJzdGFydE9mVGhlV2VlazogRGF0ZSIsImV2ZW50OiBDYWxlbmRhckV2ZW50VGltZXMiLCJzdGFydFRpbWU6IERhdGUiLCJlbmRUaW1lOiBEYXRlIiwiZ3JvdXBSb290OiBDYWxlbmRhckdyb3VwUm9vdCIsImxlZnQ6IFBpY2s8Q2FsZW5kYXJFdmVudCwgXCJfaWRcIiB8IFwic3RhcnRUaW1lXCI+IiwicmlnaHQ6IFBpY2s8Q2FsZW5kYXJFdmVudCwgXCJfaWRcIiB8IFwic3RhcnRUaW1lXCI+IiwidXNlcjogVXNlciIsImw6IENhbGVuZGFyRXZlbnQiLCJyOiBDYWxlbmRhckV2ZW50IiwiZGF5c1RvRXZlbnRzOiBNYXA8bnVtYmVyLCBBcnJheTxDYWxlbmRhckV2ZW50Pj4iLCJyYW5nZTogQ2FsZW5kYXJUaW1lUmFuZ2UiLCJwcm9nZW5pdG9yczogUmVhZG9ubHlBcnJheTxDYWxlbmRhckV2ZW50PiIsIm1heDogbnVtYmVyIiwicmV0OiBBcnJheTxDYWxlbmRhckV2ZW50PiIsInByZXZpb3VzQ2FuZGlkYXRlOiBDYWxlbmRhckV2ZW50IiwiZ2VuZXJhdG9yOiBHZW5lcmF0b3I8e1xuXHRcdFx0c3RhcnRUaW1lOiBEYXRlXG5cdFx0XHRlbmRUaW1lOiBEYXRlXG5cdFx0fT4iLCJleGNsdWRlZERhdGVzOiBBcnJheTxEYXRlV3JhcHBlcj4iLCJnZW5lcmF0b3JzOiBBcnJheTx7XG5cdFx0Z2VuZXJhdG9yOiBHZW5lcmF0b3I8eyBzdGFydFRpbWU6IERhdGU7IGVuZFRpbWU6IERhdGUgfT5cblx0XHRleGNsdWRlZERhdGVzOiBBcnJheTxEYXRlV3JhcHBlcj5cblx0XHRuZXh0Q2FuZGlkYXRlOiBDYWxlbmRhckV2ZW50XG5cdH0+IiwicmVwZWF0UnVsZTogUmVwZWF0UnVsZSIsImlzQWxsRGF5OiBib29sZWFuIiwicmVwZWF0RW5kVGltZTogRGF0ZSB8IG51bGwiLCJlbmRPY2N1cnJlbmNlczogbnVtYmVyIHwgbnVsbCIsImV4Y2x1ZGVkRGF0ZXM6IFJlYWRvbmx5QXJyYXk8RGF0ZVdyYXBwZXI+Iiwibm93OiBEYXRlIiwiZXZlbnRTdGFydDogRGF0ZSIsImV2ZW50RW5kOiBEYXRlIiwiZW5kVHlwZTogRW5kVHlwZSIsImVuZFZhbHVlOiBudW1iZXIiLCJleGNsdXNpb25zOiBBcnJheTxEYXRlPiIsImFsYXJtVHJpZ2dlcjogQWxhcm1JbnRlcnZhbCIsImxvY2FsVGltZVpvbmU6IHN0cmluZyIsImlzQWxsRGF5RXZlbnQiLCJzZXF1ZW5jZTogc3RyaW5nIiwiY2FsZW5kYXJJbmZvOiBSZWFkb25seU1hcDxJZCwgQ2FsZW5kYXJJbmZvPiIsImRlc2NyaXB0aW9uOiBzdHJpbmciLCJzYW5pdGl6ZXI6IChzOiBzdHJpbmcpID0+IHN0cmluZyIsImRheTogRGF0ZSIsInNlbGVjdGVkRGF0ZTogRGF0ZSB8IG51bGwiLCJldjogQ2FsZW5kYXJFdmVudCIsImVuZERheTogRGF0ZSIsInRpbWU6IFRpbWUiLCJmaXJzdERheTogRGF0ZSIsImxhc3REYXk6IERhdGUiLCJkOiBEYXRlIiwiY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50Iiwic3RhcnQ6IG51bWJlciIsImVuZDogbnVtYmVyIiwibWluOiBudW1iZXIiLCJhbGFybUludGVydmFsOiBBbGFybUludGVydmFsIiwiZTE6IFJlYWRvbmx5QXJyYXk8RGF0ZVdyYXBwZXI+IiwiZTI6IFJlYWRvbmx5QXJyYXk8RGF0ZVdyYXBwZXI+IiwicjE6IENhbGVuZGFyUmVwZWF0UnVsZSB8IG51bGwiLCJyMjogQ2FsZW5kYXJSZXBlYXRSdWxlIHwgbnVsbCIsInNlcmlhbGl6ZWQ6IHN0cmluZyIsImNhbGVuZGFySWQ6IElkIiwiY2FsZW5kYXJUeXBlOiBDYWxlbmRhclR5cGUiLCJncm91cFNldHRpbmdzOiBHcm91cFNldHRpbmdzIHwgbnVsbCB8IHVuZGVmaW5lZCIsImdyb3VwU2V0dGluZ3M6IEdyb3VwU2V0dGluZ3MgfCBudWxsIiwiZ3JvdXBJbmZvOiBHcm91cEluZm8iLCJiaXJ0aGRheTogc3RyaW5nIHwgbnVsbCIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwiZXZlbnRzOiBJZFR1cGxlW10iLCJsb2NhbEV2ZW50czogTWFwPG51bWJlciwgQmlydGhkYXlFdmVudFJlZ2lzdHJ5W10+IiwicmV0cmlldmVkRXZlbnRzOiBDYWxlbmRhckV2ZW50W10iLCJiaXJ0aFllYXI6IG51bWJlciB8IG51bGwiLCJjdXJyZW50WWVhcjogbnVtYmVyIiwiaWQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRhc3NlcnQsXG5cdGNsb25lLFxuXHRkZWNvZGVCYXNlNjQsXG5cdGRlZXBFcXVhbCxcblx0ZG93bmNhc3QsXG5cdGZpbHRlckludCxcblx0ZmluZEFsbEFuZFJlbW92ZSxcblx0Z2V0Rmlyc3RPclRocm93LFxuXHRnZXRGcm9tTWFwLFxuXHRnZXRTdGFydE9mRGF5LFxuXHRpbmNyZW1lbnREYXRlLFxuXHRpbnNlcnRJbnRvU29ydGVkQXJyYXksXG5cdGlzTm90TnVsbCxcblx0aXNTYW1lRGF5T2ZEYXRlLFxuXHRpc1ZhbGlkRGF0ZSxcblx0bmV2ZXJOdWxsLFxuXHRUSU1FU1RBTVBfWkVST19ZRUFSLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdENMSUVOVF9PTkxZX0NBTEVOREFSX0JJUlRIREFZU19CQVNFX0lELFxuXHRDTElFTlRfT05MWV9DQUxFTkRBUlMsXG5cdEVuZFR5cGUsXG5cdEV2ZW50VGV4dFRpbWVPcHRpb24sXG5cdGdldFdlZWtTdGFydCxcblx0UmVwZWF0UGVyaW9kLFxuXHRUaW1lRm9ybWF0LFxuXHRXZWVrU3RhcnQsXG59IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IERhdGVUaW1lLCBEdXJhdGlvbkxpa2VPYmplY3QsIEZpeGVkT2Zmc2V0Wm9uZSwgSUFOQVpvbmUgfSBmcm9tIFwibHV4b25cIlxuaW1wb3J0IHtcblx0Q2FsZW5kYXJFdmVudCxcblx0Q2FsZW5kYXJFdmVudFR5cGVSZWYsXG5cdENhbGVuZGFyR3JvdXBSb290LFxuXHRDYWxlbmRhclJlcGVhdFJ1bGUsXG5cdGNyZWF0ZUNhbGVuZGFyUmVwZWF0UnVsZSxcblx0R3JvdXBTZXR0aW5ncyxcblx0VXNlclNldHRpbmdzR3JvdXBSb290LFxufSBmcm9tIFwiLi4vLi4vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRUaW1lcywgREFZU19TSElGVEVEX01TLCBnZW5lcmF0ZUV2ZW50RWxlbWVudElkLCBpc0FsbERheUV2ZW50LCBpc0FsbERheUV2ZW50QnlUaW1lcyB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHNcIlxuaW1wb3J0IHsgY3JlYXRlRGF0ZVdyYXBwZXIsIERhdGVXcmFwcGVyLCBHcm91cEluZm8sIFJlcGVhdFJ1bGUsIFVzZXIgfSBmcm9tIFwiLi4vLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBpc1NhbWVJZCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzXCJcbmltcG9ydCB0eXBlIHsgVGltZSB9IGZyb20gXCIuL1RpbWUuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJJbmZvIH0gZnJvbSBcIi4uLy4uLy4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9tb2RlbC9DYWxlbmRhck1vZGVsXCJcbmltcG9ydCB7IERhdGVQcm92aWRlciB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0RhdGVQcm92aWRlclwiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnRpdHlDbGllbnQuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFVpZEluZGV4RW50cnkgfSBmcm9tIFwiLi4vLi4vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ2FsZW5kYXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgUGFyc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vbWlzYy9wYXJzaW5nL1BhcnNlckNvbWJpbmF0b3IuanNcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL0xvZ2luQ29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBCaXJ0aGRheUV2ZW50UmVnaXN0cnkgfSBmcm9tIFwiLi9DYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkuanNcIlxuXG5leHBvcnQgdHlwZSBDYWxlbmRhclRpbWVSYW5nZSA9IHtcblx0c3RhcnQ6IG51bWJlclxuXHRlbmQ6IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRTdGFydHNCZWZvcmUoY3VycmVudERhdGU6IERhdGUsIHpvbmU6IHN0cmluZywgZXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBib29sZWFuIHtcblx0cmV0dXJuIGdldEV2ZW50U3RhcnQoZXZlbnQsIHpvbmUpLmdldFRpbWUoKSA8IGN1cnJlbnREYXRlLmdldFRpbWUoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRFbmRzQmVmb3JlKGRhdGU6IERhdGUsIHpvbmU6IHN0cmluZywgZXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBib29sZWFuIHtcblx0cmV0dXJuIGdldEV2ZW50RW5kKGV2ZW50LCB6b25lKS5nZXRUaW1lKCkgPCBkYXRlLmdldFRpbWUoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRTdGFydHNBZnRlcihkYXRlOiBEYXRlLCB6b25lOiBzdHJpbmcsIGV2ZW50OiBDYWxlbmRhckV2ZW50KTogYm9vbGVhbiB7XG5cdHJldHVybiBnZXRFdmVudFN0YXJ0KGV2ZW50LCB6b25lKS5nZXRUaW1lKCkgPiBkYXRlLmdldFRpbWUoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRFbmRzQWZ0ZXJEYXkoY3VycmVudERhdGU6IERhdGUsIHpvbmU6IHN0cmluZywgZXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBib29sZWFuIHtcblx0cmV0dXJuIGdldEV2ZW50RW5kKGV2ZW50LCB6b25lKS5nZXRUaW1lKCkgPiBnZXRTdGFydE9mTmV4dERheVdpdGhab25lKGN1cnJlbnREYXRlLCB6b25lKS5nZXRUaW1lKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV2ZW50RW5kc0FmdGVyT3JPbihjdXJyZW50RGF0ZTogRGF0ZSwgem9uZTogc3RyaW5nLCBldmVudDogQ2FsZW5kYXJFdmVudCk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gZ2V0RXZlbnRFbmQoZXZlbnQsIHpvbmUpLmdldFRpbWUoKSA+PSBnZXRTdGFydE9mTmV4dERheVdpdGhab25lKGN1cnJlbnREYXRlLCB6b25lKS5nZXRUaW1lKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVWlkKGdyb3VwSWQ6IElkLCB0aW1lc3RhbXA6IG51bWJlcik6IHN0cmluZyB7XG5cdHJldHVybiBgJHtncm91cElkfSR7dGltZXN0YW1wfUB0dXRhLmNvbWBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQmlydGhkYXlFdmVudCh1aWQ/OiBzdHJpbmcgfCBudWxsKSB7XG5cdHJldHVybiB1aWQ/LmluY2x1ZGVzKENMSUVOVF9PTkxZX0NBTEVOREFSX0JJUlRIREFZU19CQVNFX0lEKSA/PyBmYWxzZVxufVxuXG4vKiogZ2V0IHRoZSB0aW1lc3RhbXBzIG9mIHRoZSBzdGFydCBkYXRlIGFuZCBlbmQgZGF0ZSBvZiB0aGUgbW9udGggdGhlIGdpdmVuIGRhdGUgaXMgaW4uICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9udGhSYW5nZShkYXRlOiBEYXRlLCB6b25lOiBzdHJpbmcpOiBDYWxlbmRhclRpbWVSYW5nZSB7XG5cdGNvbnN0IHN0YXJ0RGF0ZVRpbWUgPSBEYXRlVGltZS5mcm9tSlNEYXRlKGRhdGUsIHtcblx0XHR6b25lLFxuXHR9KS5zZXQoe1xuXHRcdGRheTogMSxcblx0XHRob3VyOiAwLFxuXHRcdG1pbnV0ZTogMCxcblx0XHRzZWNvbmQ6IDAsXG5cdFx0bWlsbGlzZWNvbmQ6IDAsXG5cdH0pXG5cdGNvbnN0IHN0YXJ0ID0gc3RhcnREYXRlVGltZS50b0pTRGF0ZSgpLmdldFRpbWUoKVxuXHRjb25zdCBlbmQgPSBzdGFydERhdGVUaW1lXG5cdFx0LnBsdXMoe1xuXHRcdFx0bW9udGg6IDEsXG5cdFx0fSlcblx0XHQudG9KU0RhdGUoKVxuXHRcdC5nZXRUaW1lKClcblx0cmV0dXJuIHtcblx0XHRzdGFydCxcblx0XHRlbmQsXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERheVJhbmdlKGRhdGU6IERhdGUsIHpvbmU6IHN0cmluZyk6IENhbGVuZGFyVGltZVJhbmdlIHtcblx0Y29uc3Qgc3RhcnREYXRlVGltZSA9IERhdGVUaW1lLmZyb21KU0RhdGUoZGF0ZSwge1xuXHRcdHpvbmUsXG5cdH0pLnNldCh7XG5cdFx0aG91cjogMCxcblx0XHRtaW51dGU6IDAsXG5cdFx0c2Vjb25kOiAwLFxuXHRcdG1pbGxpc2Vjb25kOiAwLFxuXHR9KVxuXHRjb25zdCBzdGFydCA9IHN0YXJ0RGF0ZVRpbWUudG9KU0RhdGUoKS5nZXRUaW1lKClcblx0Y29uc3QgZW5kID0gc3RhcnREYXRlVGltZVxuXHRcdC5wbHVzKHtcblx0XHRcdGRheTogMSxcblx0XHR9KVxuXHRcdC50b0pTRGF0ZSgpXG5cdFx0LmdldFRpbWUoKVxuXHRyZXR1cm4ge1xuXHRcdHN0YXJ0LFxuXHRcdGVuZCxcblx0fVxufVxuXG4vKipcbiAqIEBwYXJhbSBkYXRlIGEgZGF0ZSBvYmplY3QgcmVwcmVzZW50aW5nIGEgY2FsZW5kYXIgZGF0ZSAobGlrZSAxc3Qgb2YgTWF5IDIwMjMgMTU6MTUpIGluIHtAcGFyYW0gem9uZX1cbiAqIEBwYXJhbSB6b25lIHRoZSB0aW1lIHpvbmUgdG8gY2FsY3VsYXRlIHdoaWNoIGNhbGVuZGFyIGRhdGUge0BwYXJhbSBkYXRlfSByZXByZXNlbnRzLlxuICogQHJldHVybnMgYSBkYXRlIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGJlZ2lubmluZyBvZiB0aGUgZ2l2ZW4gZGF5IGluIGxvY2FsIHRpbWUsIGxpa2UgMXN0IG9mIE1heSAyMDIzIDAwOjAwKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RhcnRPZkRheVdpdGhab25lKGRhdGU6IERhdGUsIHpvbmU6IHN0cmluZyk6IERhdGUge1xuXHRyZXR1cm4gRGF0ZVRpbWUuZnJvbUpTRGF0ZShkYXRlLCB7IHpvbmUgfSkuc2V0KHsgaG91cjogMCwgbWludXRlOiAwLCBzZWNvbmQ6IDAsIG1pbGxpc2Vjb25kOiAwIH0pLnRvSlNEYXRlKClcbn1cblxuLyoqIEBwYXJhbSBkYXRlIGEgZGF0ZSBvYmplY3QgcmVwcmVzZW50aW5nIHNvbWUgdGltZSBvbiBzb21lIGNhbGVuZGFyIGRhdGUgKGxpa2UgMXN0IG9mIE1heSAyMDIzKSBpbiB7QHBhcmFtIHpvbmV9XG4gKiBAcGFyYW0gem9uZSB0aGUgdGltZSB6b25lIGZvciB3aGljaCB0byBjYWxjdWxhdGUgdGhlIGNhbGVuZGFyIGRhdGUgdGhhdCB7QHBhcmFtIGRhdGV9IHJlcHJlc2VudHNcbiAqIEByZXR1cm5zIGEgZGF0ZSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBzdGFydCBvZiB0aGUgbmV4dCBjYWxlbmRhciBkYXRlICgybmQgb2YgTWF5IDIwMjMgMDA6MDApIGluIHtAcGFyYW0gem9uZX0gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdGFydE9mTmV4dERheVdpdGhab25lKGRhdGU6IERhdGUsIHpvbmU6IHN0cmluZyk6IERhdGUge1xuXHRyZXR1cm4gRGF0ZVRpbWUuZnJvbUpTRGF0ZShkYXRlLCB7IHpvbmUgfSkuc2V0KHsgaG91cjogMCwgbWludXRlOiAwLCBzZWNvbmQ6IDAsIG1pbGxpc2Vjb25kOiAwIH0pLnBsdXMoeyBkYXk6IDEgfSkudG9KU0RhdGUoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5kT2ZEYXlXaXRoWm9uZShkYXRlOiBEYXRlLCB6b25lOiBzdHJpbmcpOiBEYXRlIHtcblx0cmV0dXJuIERhdGVUaW1lLmZyb21KU0RhdGUoZGF0ZSwgeyB6b25lIH0pLnNldCh7IGhvdXI6IDIzLCBtaW51dGU6IDU5LCBzZWNvbmQ6IDU5LCBtaWxsaXNlY29uZDogMCB9KS50b0pTRGF0ZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVBbGFybVRpbWUoZGF0ZTogRGF0ZSwgaW50ZXJ2YWw6IEFsYXJtSW50ZXJ2YWwsIGlhbmFUaW1lWm9uZT86IHN0cmluZyk6IERhdGUge1xuXHRjb25zdCBkaWZmID0gYWxhcm1JbnRlcnZhbFRvTHV4b25EdXJhdGlvbkxpa2VPYmplY3QoaW50ZXJ2YWwpXG5cblx0cmV0dXJuIERhdGVUaW1lLmZyb21KU0RhdGUoZGF0ZSwge1xuXHRcdHpvbmU6IGlhbmFUaW1lWm9uZSxcblx0fSlcblx0XHQubWludXMoZGlmZilcblx0XHQudG9KU0RhdGUoKVxufVxuXG4vKiogdGFrZXMgYSBkYXRlIHdoaWNoIGVuY29kZXMgdGhlIGRheSBpbiBVVEMgYW5kIHByb2R1Y2VzIGEgZGF0ZSB0aGF0IGVuY29kZXMgdGhlIHNhbWUgZGF0ZSBidXQgaW4gbG9jYWwgdGltZSB6b25lLiBBbGwgdGltZXMgbXVzdCBiZSAwLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbERheURhdGVGb3JUaW1lem9uZSh1dGNEYXRlOiBEYXRlLCB6b25lOiBzdHJpbmcpOiBEYXRlIHtcblx0cmV0dXJuIERhdGVUaW1lLmZyb21KU0RhdGUodXRjRGF0ZSwgeyB6b25lOiBcInV0Y1wiIH0pXG5cdFx0LnNldFpvbmUoem9uZSwgeyBrZWVwTG9jYWxUaW1lOiB0cnVlIH0pXG5cdFx0LnNldCh7IGhvdXI6IDAsIG1pbnV0ZTogMCwgc2Vjb25kOiAwLCBtaWxsaXNlY29uZDogMCB9KVxuXHRcdC50b0pTRGF0ZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRCeVJlcGVhdFBlcmlvZChkYXRlOiBEYXRlLCByZXBlYXRQZXJpb2Q6IFJlcGVhdFBlcmlvZCwgaW50ZXJ2YWw6IG51bWJlciwgaWFuYVRpbWVab25lOiBzdHJpbmcpOiBEYXRlIHtcblx0c3dpdGNoIChyZXBlYXRQZXJpb2QpIHtcblx0XHRjYXNlIFJlcGVhdFBlcmlvZC5EQUlMWTpcblx0XHRcdHJldHVybiBEYXRlVGltZS5mcm9tSlNEYXRlKGRhdGUsIHtcblx0XHRcdFx0em9uZTogaWFuYVRpbWVab25lLFxuXHRcdFx0fSlcblx0XHRcdFx0LnBsdXMoe1xuXHRcdFx0XHRcdGRheXM6IGludGVydmFsLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudG9KU0RhdGUoKVxuXG5cdFx0Y2FzZSBSZXBlYXRQZXJpb2QuV0VFS0xZOlxuXHRcdFx0cmV0dXJuIERhdGVUaW1lLmZyb21KU0RhdGUoZGF0ZSwge1xuXHRcdFx0XHR6b25lOiBpYW5hVGltZVpvbmUsXG5cdFx0XHR9KVxuXHRcdFx0XHQucGx1cyh7XG5cdFx0XHRcdFx0d2Vla3M6IGludGVydmFsLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudG9KU0RhdGUoKVxuXG5cdFx0Y2FzZSBSZXBlYXRQZXJpb2QuTU9OVEhMWTpcblx0XHRcdHJldHVybiBEYXRlVGltZS5mcm9tSlNEYXRlKGRhdGUsIHtcblx0XHRcdFx0em9uZTogaWFuYVRpbWVab25lLFxuXHRcdFx0fSlcblx0XHRcdFx0LnBsdXMoe1xuXHRcdFx0XHRcdG1vbnRoczogaW50ZXJ2YWwsXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50b0pTRGF0ZSgpXG5cblx0XHRjYXNlIFJlcGVhdFBlcmlvZC5BTk5VQUxMWTpcblx0XHRcdHJldHVybiBEYXRlVGltZS5mcm9tSlNEYXRlKGRhdGUsIHtcblx0XHRcdFx0em9uZTogaWFuYVRpbWVab25lLFxuXHRcdFx0fSlcblx0XHRcdFx0LnBsdXMoe1xuXHRcdFx0XHRcdHllYXJzOiBpbnRlcnZhbCxcblx0XHRcdFx0fSlcblx0XHRcdFx0LnRvSlNEYXRlKClcblxuXHRcdGRlZmF1bHQ6XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHJlcGVhdCBwZXJpb2RcIilcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsaWRUaW1lWm9uZSh6b25lOiBzdHJpbmcsIGZhbGxiYWNrPzogc3RyaW5nKTogc3RyaW5nIHtcblx0aWYgKElBTkFab25lLmlzVmFsaWRab25lKHpvbmUpKSB7XG5cdFx0cmV0dXJuIHpvbmVcblx0fSBlbHNlIHtcblx0XHRpZiAoZmFsbGJhY2sgJiYgSUFOQVpvbmUuaXNWYWxpZFpvbmUoZmFsbGJhY2spKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oYFRpbWUgem9uZSAke3pvbmV9IGlzIG5vdCB2YWxpZCwgZmFsbGluZyBiYWNrIHRvICR7ZmFsbGJhY2t9YClcblx0XHRcdHJldHVybiBmYWxsYmFja1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBhY3R1YWxGYWxsYmFjayA9IEZpeGVkT2Zmc2V0Wm9uZS5pbnN0YW5jZShuZXcgRGF0ZSgpLmdldFRpbWV6b25lT2Zmc2V0KCkpLm5hbWVcblx0XHRcdGNvbnNvbGUud2FybihgRmFsbGJhY2sgdGltZSB6b25lICR7em9uZX0gaXMgbm90IHZhbGlkLCBmYWxsaW5nIGJhY2sgdG8gJHthY3R1YWxGYWxsYmFja31gKVxuXHRcdFx0cmV0dXJuIGFjdHVhbEZhbGxiYWNrXG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUaW1lWm9uZSgpOiBzdHJpbmcge1xuXHRyZXR1cm4gRGF0ZVRpbWUubG9jYWwoKS56b25lTmFtZVxufVxuXG5leHBvcnQgY2xhc3MgRGVmYXVsdERhdGVQcm92aWRlciBpbXBsZW1lbnRzIERhdGVQcm92aWRlciB7XG5cdG5vdygpOiBudW1iZXIge1xuXHRcdHJldHVybiBEYXRlLm5vdygpXG5cdH1cblxuXHR0aW1lWm9uZSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBnZXRUaW1lWm9uZSgpXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlcGVhdFJ1bGVXaXRoVmFsdWVzKGZyZXF1ZW5jeTogUmVwZWF0UGVyaW9kLCBpbnRlcnZhbDogbnVtYmVyLCB0aW1lWm9uZTogc3RyaW5nID0gZ2V0VGltZVpvbmUoKSk6IENhbGVuZGFyUmVwZWF0UnVsZSB7XG5cdHJldHVybiBjcmVhdGVDYWxlbmRhclJlcGVhdFJ1bGUoe1xuXHRcdHRpbWVab25lOiB0aW1lWm9uZSxcblx0XHRmcmVxdWVuY3k6IGZyZXF1ZW5jeSxcblx0XHRpbnRlcnZhbDogU3RyaW5nKGludGVydmFsKSxcblx0XHRlbmRWYWx1ZTogbnVsbCxcblx0XHRlbmRUeXBlOiBcIjBcIixcblx0XHRleGNsdWRlZERhdGVzOiBbXSxcblx0XHRhZHZhbmNlZFJ1bGVzOiBbXSxcblx0fSlcbn1cblxuLyoqXG4gKiBkaWZmZXJlbmNlIGluIHdob2xlIDI0LWhvdXItaW50ZXJ2YWxzIGJldHdlZW4gdHdvIGRhdGVzLCBub3QgYW50aWNvbW11dGF0aXZlLlxuICogUmVzdWx0IGlzIHBvc2l0aXZlIG9yIDAgaWYgYiA+IGEsIHJlc3VsdCBpcyBuZWdhdGl2ZSBvciAwIG90aGVyd2lzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlmZkluMjRoSW50ZXJ2YWxzKGE6IERhdGUsIGI6IERhdGUsIHpvbmU/OiBzdHJpbmcpOiBudW1iZXIge1xuXHRyZXR1cm4gTWF0aC5mbG9vcihEYXRlVGltZS5mcm9tSlNEYXRlKGIsIHsgem9uZSB9KS5kaWZmKERhdGVUaW1lLmZyb21KU0RhdGUoYSwgeyB6b25lIH0pLCBcImRheVwiKS5kYXlzKVxufVxuXG4vKipcbiAqIGRpZmZlcmVuY2UgaW4gd2hvbGUgNjAgbWludXRlIGludGVydmFscyBiZXR3ZWVuIHR3byBkYXRlc1xuICogcmVzdWx0IGlzIDAgaWYgdGhlIGRpZmYgaXMgbGVzcyB0aGFuIDYwIG1pbnV0ZXMsIG90aGVyd2lzZVxuICogcG9zaXRpdmUgaWYgYiBpcyBhZnRlciBhLCBvdGhlcndpc2UgbmVnYXRpdmUuXG4gKlxuICogbm90IGFudGljb21tdXRhdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERpZmZJbjYwbUludGVydmFscyhhOiBEYXRlLCBiOiBEYXRlKTogbnVtYmVyIHtcblx0cmV0dXJuIE1hdGguZmxvb3IoRGF0ZVRpbWUuZnJvbUpTRGF0ZShiKS5kaWZmKERhdGVUaW1lLmZyb21KU0RhdGUoYSksIFwiaG91cnNcIikuaG91cnMpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdGFydE9mV2VlayhkYXRlOiBEYXRlLCBmaXJzdERheU9mV2Vla0Zyb21PZmZzZXQ6IG51bWJlcik6IERhdGUge1xuXHRsZXQgZmlyc3REYXlcblxuXHRpZiAoZmlyc3REYXlPZldlZWtGcm9tT2Zmc2V0ID4gZGF0ZS5nZXREYXkoKSkge1xuXHRcdGZpcnN0RGF5ID0gZGF0ZS5nZXREYXkoKSArIDcgLSBmaXJzdERheU9mV2Vla0Zyb21PZmZzZXRcblx0fSBlbHNlIHtcblx0XHRmaXJzdERheSA9IGRhdGUuZ2V0RGF5KCkgLSBmaXJzdERheU9mV2Vla0Zyb21PZmZzZXRcblx0fVxuXG5cdHJldHVybiBpbmNyZW1lbnREYXRlKGdldFN0YXJ0T2ZEYXkoZGF0ZSksIC1maXJzdERheSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmdlT2ZEYXlzKHN0YXJ0RGF5OiBEYXRlLCBudW1EYXlzOiBudW1iZXIpOiBBcnJheTxEYXRlPiB7XG5cdGxldCBjYWxjdWxhdGlvbkRhdGUgPSBzdGFydERheVxuXHRjb25zdCBkYXlzOiBEYXRlW10gPSBbXVxuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbnVtRGF5czsgaSsrKSB7XG5cdFx0ZGF5cy5wdXNoKGNhbGN1bGF0aW9uRGF0ZSlcblx0XHRjYWxjdWxhdGlvbkRhdGUgPSBpbmNyZW1lbnREYXRlKG5ldyBEYXRlKGNhbGN1bGF0aW9uRGF0ZSksIDEpXG5cdH1cblxuXHRyZXR1cm4gZGF5c1xufVxuXG4vKiogU3RhcnQgb2YgdGhlIHdlZWsgb2Zmc2V0IHJlbGF0aXZlIHRvIFN1bmRheSAoZm9yd2FyZCkuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RhcnRPZlRoZVdlZWtPZmZzZXQod2Vla1N0YXJ0OiBXZWVrU3RhcnQpOiBudW1iZXIge1xuXHRzd2l0Y2ggKHdlZWtTdGFydCkge1xuXHRcdGNhc2UgV2Vla1N0YXJ0LlNVTkRBWTpcblx0XHRcdHJldHVybiAwXG5cblx0XHRjYXNlIFdlZWtTdGFydC5TQVRVUkRBWTpcblx0XHRcdHJldHVybiA2XG5cblx0XHRjYXNlIFdlZWtTdGFydC5NT05EQVk6XG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJldHVybiAxXG5cdH1cbn1cblxuLyoqIHtAc2VlIGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0fSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0Rm9yVXNlcih1c2VyU2V0dGluZ3NHcm91cFJvb3Q6IFVzZXJTZXR0aW5nc0dyb3VwUm9vdCk6IG51bWJlciB7XG5cdHJldHVybiBnZXRTdGFydE9mVGhlV2Vla09mZnNldChnZXRXZWVrU3RhcnQodXNlclNldHRpbmdzR3JvdXBSb290KSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRpbWVGb3JtYXRGb3JVc2VyKHVzZXJTZXR0aW5nc0dyb3VwUm9vdDogVXNlclNldHRpbmdzR3JvdXBSb290KTogVGltZUZvcm1hdCB7XG5cdC8vIGl0J3Mgc2F2ZWQgYXMgYSBzdHJpbmcsIGJ1dCBpcyBhIGNvbnN0IGVudW0uXG5cdHJldHVybiB1c2VyU2V0dGluZ3NHcm91cFJvb3QudGltZUZvcm1hdCBhcyBUaW1lRm9ybWF0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXZWVrTnVtYmVyKHN0YXJ0T2ZUaGVXZWVrOiBEYXRlKTogbnVtYmVyIHtcblx0Ly8gQ3VycmVudGx5IGl0IGRvZXNuJ3Qgc3VwcG9ydCBVUy1iYXNlZCB3ZWVrIG51bWJlcmluZyBzeXN0ZW0gd2l0aCBwYXJ0aWFsIHdlZWtzLlxuXHRyZXR1cm4gRGF0ZVRpbWUuZnJvbUpTRGF0ZShzdGFydE9mVGhlV2Vlaykud2Vla051bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXZlbnRFbmQoZXZlbnQ6IENhbGVuZGFyRXZlbnRUaW1lcywgdGltZVpvbmU6IHN0cmluZyk6IERhdGUge1xuXHRpZiAoaXNBbGxEYXlFdmVudChldmVudCkpIHtcblx0XHRyZXR1cm4gZ2V0QWxsRGF5RGF0ZUZvclRpbWV6b25lKGV2ZW50LmVuZFRpbWUsIHRpbWVab25lKVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBldmVudC5lbmRUaW1lXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV2ZW50U3RhcnQoeyBzdGFydFRpbWUsIGVuZFRpbWUgfTogQ2FsZW5kYXJFdmVudFRpbWVzLCB0aW1lWm9uZTogc3RyaW5nKTogRGF0ZSB7XG5cdHJldHVybiBnZXRFdmVudFN0YXJ0QnlUaW1lcyhzdGFydFRpbWUsIGVuZFRpbWUsIHRpbWVab25lKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXZlbnRTdGFydEJ5VGltZXMoc3RhcnRUaW1lOiBEYXRlLCBlbmRUaW1lOiBEYXRlLCB0aW1lWm9uZTogc3RyaW5nKTogRGF0ZSB7XG5cdGlmIChpc0FsbERheUV2ZW50QnlUaW1lcyhzdGFydFRpbWUsIGVuZFRpbWUpKSB7XG5cdFx0cmV0dXJuIGdldEFsbERheURhdGVGb3JUaW1lem9uZShzdGFydFRpbWUsIHRpbWVab25lKVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBzdGFydFRpbWVcblx0fVxufVxuXG4vKiogQHBhcmFtIGRhdGUgZW5jb2RlcyBzb21lIGNhbGVuZGFyIGRhdGUgaW4ge0BwYXJhbSB6b25lfSAobGlrZSB0aGUgMXN0IG9mIE1heSAyMDIzKVxuICogQHJldHVybnMge0RhdGV9IGVuY29kZXMgdGhlIHNhbWUgY2FsZW5kYXIgZGF0ZSBpbiBVVEMgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxEYXlEYXRlVVRDRnJvbVpvbmUoZGF0ZTogRGF0ZSwgem9uZTogc3RyaW5nKTogRGF0ZSB7XG5cdHJldHVybiBEYXRlVGltZS5mcm9tSlNEYXRlKGRhdGUsIHsgem9uZSB9KS5zZXRab25lKFwidXRjXCIsIHsga2VlcExvY2FsVGltZTogdHJ1ZSB9KS5zZXQoeyBob3VyOiAwLCBtaW51dGU6IDAsIHNlY29uZDogMCwgbWlsbGlzZWNvbmQ6IDAgfSkudG9KU0RhdGUoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMb25nRXZlbnQoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIHpvbmU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHQvLyBsb25nIGV2ZW50cyBhcmUgbG9uZ2VyIHRoYW4gdGhlIGV2ZW50IElEIHJhbmRvbWl6YXRpb24gcmFuZ2UuIHdlIG5lZWQgdG8gZGlzdGluZ3Vpc2ggdGhlbVxuXHQvLyB0byBiZSBhYmxlIHRvIHN0aWxsIGxvYWQgYW5kIGRpc3BsYXkgdGhlIG9uZXMgb3ZlcmxhcHBpbmcgdGhlIHF1ZXJ5IHJhbmdlIGV2ZW4gdGhvdWdoIHRoZWlyXG5cdC8vIGlkIG1pZ2h0IG5vdCBiZSBjb250YWluZWQgaW4gdGhlIHF1ZXJ5IHRpbWVyYW5nZSArLSByYW5kb21pemF0aW9uIHJhbmdlLlxuXHQvLyB0aGlzIGFsc28gYXBwbGllcyB0byBldmVudHMgdGhhdCByZXBlYXQuXG5cdHJldHVybiBldmVudC5yZXBlYXRSdWxlICE9IG51bGwgfHwgZ2V0RXZlbnRFbmQoZXZlbnQsIHpvbmUpLmdldFRpbWUoKSAtIGdldEV2ZW50U3RhcnQoZXZlbnQsIHpvbmUpLmdldFRpbWUoKSA+IERBWVNfU0hJRlRFRF9NU1xufVxuXG4vKiogY3JlYXRlIGFuIGV2ZW50IGlkIGRlcGVuZGluZyBvbiB0aGUgY2FsZW5kYXIgaXQgaXMgaW4gYW5kIG9uIGl0cyBsZW5ndGggKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25FdmVudElkKGV2ZW50OiBDYWxlbmRhckV2ZW50LCB6b25lOiBzdHJpbmcsIGdyb3VwUm9vdDogQ2FsZW5kYXJHcm91cFJvb3QpOiB2b2lkIHtcblx0Y29uc3QgbGlzdElkID0gaXNMb25nRXZlbnQoZXZlbnQsIHpvbmUpID8gZ3JvdXBSb290LmxvbmdFdmVudHMgOiBncm91cFJvb3Quc2hvcnRFdmVudHNcblx0ZXZlbnQuX2lkID0gW2xpc3RJZCwgZ2VuZXJhdGVFdmVudEVsZW1lbnRJZChldmVudC5zdGFydFRpbWUuZ2V0VGltZSgpKV1cbn1cblxuLyoqIHByZWRpY2F0ZSB0aGF0IHRlbGxzIHVzIGlmIHR3byBDYWxlbmRhckV2ZW50IG9iamVjdHMgcmVmZXIgdG8gdGhlIHNhbWUgaW5zdGFuY2Ugb3IgZGlmZmVyZW50IG9uZXMuKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NhbWVFdmVudEluc3RhbmNlKGxlZnQ6IFBpY2s8Q2FsZW5kYXJFdmVudCwgXCJfaWRcIiB8IFwic3RhcnRUaW1lXCI+LCByaWdodDogUGljazxDYWxlbmRhckV2ZW50LCBcIl9pZFwiIHwgXCJzdGFydFRpbWVcIj4pOiBib29sZWFuIHtcblx0Ly8gaW4gYWRkaXRpb24gdG8gdGhlIGlkIHdlIGNvbXBhcmUgdGhlIHN0YXJ0IHRpbWUgZXF1YWxpdHkgdG8gYmUgYWJsZSB0byBkaXN0aW5ndWlzaCByZXBlYXRpbmcgZXZlbnRzLiBUaGV5IGhhdmUgdGhlIHNhbWUgaWQgYnV0IGRpZmZlcmVudCBzdGFydCB0aW1lLlxuXHQvLyBhbHRlcmVkIGV2ZW50cyB3aXRoIHJlY3VycmVuY2VJZCBuZXZlciBoYXZlIHRoZSBzYW1lIElkIGFzIGFub3RoZXIgZXZlbnQgaW5zdGFuY2UsIGJ1dCBtaWdodCBzdGFydCBhdCB0aGUgc2FtZSB0aW1lLlxuXHRyZXR1cm4gaXNTYW1lSWQobGVmdC5faWQsIHJpZ2h0Ll9pZCkgJiYgbGVmdC5zdGFydFRpbWUuZ2V0VGltZSgpID09PSByaWdodC5zdGFydFRpbWUuZ2V0VGltZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNBbGFybXNGb3JUaGVVc2VyKHVzZXI6IFVzZXIsIGV2ZW50OiBDYWxlbmRhckV2ZW50KTogYm9vbGVhbiB7XG5cdGNvbnN0IHVzZUFsYXJtTGlzdCA9IG5ldmVyTnVsbCh1c2VyLmFsYXJtSW5mb0xpc3QpLmFsYXJtc1xuXHRyZXR1cm4gZXZlbnQuYWxhcm1JbmZvcy5zb21lKChbbGlzdElkXSkgPT4gaXNTYW1lSWQobGlzdElkLCB1c2VBbGFybUxpc3QpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZlbnRDb21wYXJhdG9yKGw6IENhbGVuZGFyRXZlbnQsIHI6IENhbGVuZGFyRXZlbnQpOiBudW1iZXIge1xuXHRyZXR1cm4gbC5zdGFydFRpbWUuZ2V0VGltZSgpIC0gci5zdGFydFRpbWUuZ2V0VGltZSgpXG59XG5cbmZ1bmN0aW9uIGFzc2VydERhdGVJc1ZhbGlkKGRhdGU6IERhdGUpIHtcblx0aWYgKCFpc1ZhbGlkRGF0ZShkYXRlKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkRhdGUgaXMgaW52YWxpZCFcIilcblx0fVxufVxuXG4vKipcbiAqIHdlIGRvbid0IHdhbnQgdG8gZGVhbCB3aXRoIHNvbWUgY2FsZW5kYXIgZXZlbnQgZWRnZSBjYXNlcyxcbiAqIGxpa2UgcHJlLTE5NzAgZXZlbnRzIHRoYXQgd291bGQgaGF2ZSBuZWdhdGl2ZSB0aW1lc3RhbXBzLlxuICogZHVyaW5nIGltcG9ydCwgd2UgY2FuIGFsc28gZ2V0IGZhdWx0eSBldmVudHMgdGhhdCBhcmVcbiAqIGltcG9zc2libGUgdG8gY3JlYXRlIHRocm91Z2ggdGhlIGludGVyZmFjZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQ2FsZW5kYXJFdmVudFZhbGlkaXR5IHtcblx0SW52YWxpZENvbnRhaW5zSW52YWxpZERhdGUsXG5cdEludmFsaWRFbmRCZWZvcmVTdGFydCxcblx0SW52YWxpZFByZTE5NzAsXG5cdFZhbGlkLFxufVxuXG4vKipcbiAqIGNoZWNrIGlmIGEgZ2l2ZW4gZXZlbnQgc2hvdWxkIGJlIGFsbG93ZWQgdG8gYmUgY3JlYXRlZCBpbiBhIHR1dGFub3RhIGNhbGVuZGFyLlxuICogQHBhcmFtIGV2ZW50XG4gKiBAcmV0dXJucyBFbnVtIGRlc2NyaWJpbmcgdGhlIHJlYXNvbiB0byByZWplY3QgdGhlIGV2ZW50LCBpZiBhbnkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0V2ZW50VmFsaWRpdHkoZXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBDYWxlbmRhckV2ZW50VmFsaWRpdHkge1xuXHRpZiAoIWlzVmFsaWREYXRlKGV2ZW50LnN0YXJ0VGltZSkgfHwgIWlzVmFsaWREYXRlKGV2ZW50LmVuZFRpbWUpKSB7XG5cdFx0cmV0dXJuIENhbGVuZGFyRXZlbnRWYWxpZGl0eS5JbnZhbGlkQ29udGFpbnNJbnZhbGlkRGF0ZVxuXHR9IGVsc2UgaWYgKGV2ZW50LmVuZFRpbWUuZ2V0VGltZSgpIDw9IGV2ZW50LnN0YXJ0VGltZS5nZXRUaW1lKCkpIHtcblx0XHRyZXR1cm4gQ2FsZW5kYXJFdmVudFZhbGlkaXR5LkludmFsaWRFbmRCZWZvcmVTdGFydFxuXHR9IGVsc2UgaWYgKGV2ZW50LnN0YXJ0VGltZS5nZXRUaW1lKCkgPCBUSU1FU1RBTVBfWkVST19ZRUFSKSB7XG5cdFx0cmV0dXJuIENhbGVuZGFyRXZlbnRWYWxpZGl0eS5JbnZhbGlkUHJlMTk3MFxuXHR9XG5cdHJldHVybiBDYWxlbmRhckV2ZW50VmFsaWRpdHkuVmFsaWRcbn1cblxuY29uc3QgTUFYX0VWRU5UX0lURVJBVElPTlMgPSAxMDAwMFxuXG4vKipcbiAqIGFkZCB0aGUgZGF5cyB0aGUgZ2l2ZW4ge0BwYXJhbSBldmVudH0gaXMgaGFwcGVuaW5nIG9uIGR1cmluZyB0aGUgZ2l2ZW4ge0BwYXJhbSByYW5nZX0gdG8ge0BwYXJhbSBkYXlzVG9FdmVudHN9LlxuICpcbiAqIGlnbm9yZXMgcmVwZWF0IHJ1bGVzLlxuICogQHBhcmFtIHpvbmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZERheXNGb3JFdmVudEluc3RhbmNlKGRheXNUb0V2ZW50czogTWFwPG51bWJlciwgQXJyYXk8Q2FsZW5kYXJFdmVudD4+LCBldmVudDogQ2FsZW5kYXJFdmVudCwgcmFuZ2U6IENhbGVuZGFyVGltZVJhbmdlLCB6b25lOiBzdHJpbmcpIHtcblx0Y29uc3QgeyBzdGFydDogcmFuZ2VTdGFydCwgZW5kOiByYW5nZUVuZCB9ID0gcmFuZ2Vcblx0Y29uc3QgY2xpcHBlZFJhbmdlID0gY2xpcFJhbmdlcyhnZXRFdmVudFN0YXJ0KGV2ZW50LCB6b25lKS5nZXRUaW1lKCksIGdldEV2ZW50RW5kKGV2ZW50LCB6b25lKS5nZXRUaW1lKCksIHJhbmdlU3RhcnQsIHJhbmdlRW5kKVxuXHQvLyB0aGUgZXZlbnQgYW5kIHJhbmdlIGRvIG5vdCBpbnRlcnNlY3Rcblx0aWYgKGNsaXBwZWRSYW5nZSA9PSBudWxsKSByZXR1cm5cblx0Y29uc3QgeyBzdGFydDogZXZlbnRTdGFydEluUmFuZ2UsIGVuZDogZXZlbnRFbmRJblJhbmdlIH0gPSBjbGlwcGVkUmFuZ2Vcblx0bGV0IGNhbGN1bGF0aW9uRGF0ZSA9IGdldFN0YXJ0T2ZEYXlXaXRoWm9uZShuZXcgRGF0ZShldmVudFN0YXJ0SW5SYW5nZSksIHpvbmUpXG5cdGxldCBjYWxjdWxhdGlvblRpbWUgPSBjYWxjdWxhdGlvbkRhdGUuZ2V0VGltZSgpXG5cdGxldCBpdGVyYXRpb25zID0gMFxuXG5cdHdoaWxlIChjYWxjdWxhdGlvblRpbWUgPCByYW5nZUVuZCkge1xuXHRcdGFzc2VydERhdGVJc1ZhbGlkKGNhbGN1bGF0aW9uRGF0ZSlcblx0XHRhc3NlcnQoaXRlcmF0aW9ucyA8PSBNQVhfRVZFTlRfSVRFUkFUSU9OUywgXCJSdW4gaW50byB0aGUgaW5maW5pdGUgbG9vcCwgYWRkRGF5c0ZvckV2ZW50XCIpXG5cdFx0aWYgKGNhbGN1bGF0aW9uVGltZSA8IGV2ZW50RW5kSW5SYW5nZSkge1xuXHRcdFx0Y29uc3QgZXZlbnRzRm9yQ2FsY3VsYXRpb25EYXRlID0gZ2V0RnJvbU1hcChkYXlzVG9FdmVudHMsIGNhbGN1bGF0aW9uVGltZSwgKCkgPT4gW10pXG5cdFx0XHRpbnNlcnRJbnRvU29ydGVkQXJyYXkoZXZlbnQsIGV2ZW50c0ZvckNhbGN1bGF0aW9uRGF0ZSwgZXZlbnRDb21wYXJhdG9yLCBpc1NhbWVFdmVudEluc3RhbmNlKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBJZiB0aGUgZHVyYXRpb24gb2YgdGhlIG9yaWdpbmFsIGV2ZW50IGluc3RhbmNlIHdhcyByZWR1Y2VkLCB3ZSBhbHNvIGhhdmUgdG8gZGVsZXRlIHRoZSByZW1haW5pbmcgZGF5cyBvZiB0aGUgcHJldmlvdXMgZXZlbnQgaW5zdGFuY2UuXG5cdFx0XHRjb25zdCByZW1vdmVkID0gZmluZEFsbEFuZFJlbW92ZShcblx0XHRcdFx0Z2V0RnJvbU1hcChkYXlzVG9FdmVudHMsIGNhbGN1bGF0aW9uVGltZSwgKCkgPT4gW10pLFxuXHRcdFx0XHQoZSkgPT4gaXNTYW1lRXZlbnRJbnN0YW5jZShlLCBldmVudCksXG5cdFx0XHQpXG5cdFx0XHRpZiAoIXJlbW92ZWQpIHtcblx0XHRcdFx0Ly8gbm8gZnVydGhlciBkYXlzIHRoaXMgZXZlbnQgaW5zdGFuY2Ugb2NjdXJyZWQgb25cblx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjYWxjdWxhdGlvbkRhdGUgPSBpbmNyZW1lbnRCeVJlcGVhdFBlcmlvZChjYWxjdWxhdGlvbkRhdGUsIFJlcGVhdFBlcmlvZC5EQUlMWSwgMSwgem9uZSlcblx0XHRjYWxjdWxhdGlvblRpbWUgPSBjYWxjdWxhdGlvbkRhdGUuZ2V0VGltZSgpXG5cdFx0aXRlcmF0aW9ucysrXG5cdH1cbn1cblxuLyoqIGFkZCB0aGUgZGF5cyBhIHJlcGVhdGluZyB7QHBhcmFtIGV2ZW50fSBvY2N1cnMgb24gZHVyaW5nIHtAcGFyYW0gcmFuZ2V9IHRvIHtAcGFyYW0gZGF5c1RvRXZlbnRzfSBieSBjYWxsaW5nIGFkZERheXNGb3JFdmVudEluc3RhbmNlKCkgZm9yIGVhY2ggb2YgaXRzXG4gKiBub24tZXhjbHVkZWQgaW5zdGFuY2VzLlxuICogQHBhcmFtIHRpbWVab25lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREYXlzRm9yUmVjdXJyaW5nRXZlbnQoXG5cdGRheXNUb0V2ZW50czogTWFwPG51bWJlciwgQXJyYXk8Q2FsZW5kYXJFdmVudD4+LFxuXHRldmVudDogQ2FsZW5kYXJFdmVudCxcblx0cmFuZ2U6IENhbGVuZGFyVGltZVJhbmdlLFxuXHR0aW1lWm9uZTogc3RyaW5nID0gZ2V0VGltZVpvbmUoKSxcbikge1xuXHRjb25zdCByZXBlYXRSdWxlID0gZXZlbnQucmVwZWF0UnVsZVxuXG5cdGlmIChyZXBlYXRSdWxlID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGFyZ3VtZW50OiBldmVudCBkb2Vzbid0IGhhdmUgYSByZXBlYXRSdWxlXCIgKyBKU09OLnN0cmluZ2lmeShldmVudCkpXG5cdH1cblx0Y29uc3QgYWxsRGF5ID0gaXNBbGxEYXlFdmVudChldmVudClcblx0Y29uc3QgZXhjbHVzaW9ucyA9IGFsbERheVxuXHRcdD8gcmVwZWF0UnVsZS5leGNsdWRlZERhdGVzLm1hcCgoeyBkYXRlIH0pID0+IGNyZWF0ZURhdGVXcmFwcGVyKHsgZGF0ZTogZ2V0QWxsRGF5RGF0ZUZvclRpbWV6b25lKGRhdGUsIHRpbWVab25lKSB9KSlcblx0XHQ6IHJlcGVhdFJ1bGUuZXhjbHVkZWREYXRlc1xuXG5cdGZvciAoY29uc3QgeyBzdGFydFRpbWUsIGVuZFRpbWUgfSBvZiBnZW5lcmF0ZUV2ZW50T2NjdXJyZW5jZXMoZXZlbnQsIHRpbWVab25lKSkge1xuXHRcdGlmIChzdGFydFRpbWUuZ2V0VGltZSgpID4gcmFuZ2UuZW5kKSBicmVha1xuXHRcdGlmIChlbmRUaW1lLmdldFRpbWUoKSA8IHJhbmdlLnN0YXJ0KSBjb250aW51ZVxuXHRcdGlmIChpc0V4Y2x1ZGVkRGF0ZShzdGFydFRpbWUsIGV4Y2x1c2lvbnMpKSB7XG5cdFx0XHRjb25zdCBldmVudHNPbkV4Y2x1ZGVkRGF5ID0gZGF5c1RvRXZlbnRzLmdldChnZXRTdGFydE9mRGF5V2l0aFpvbmUoc3RhcnRUaW1lLCB0aW1lWm9uZSkuZ2V0VGltZSgpKVxuXHRcdFx0aWYgKCFldmVudHNPbkV4Y2x1ZGVkRGF5KSBjb250aW51ZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBldmVudENsb25lID0gY2xvbmUoZXZlbnQpXG5cdFx0XHRpZiAoYWxsRGF5KSB7XG5cdFx0XHRcdGV2ZW50Q2xvbmUuc3RhcnRUaW1lID0gZ2V0QWxsRGF5RGF0ZVVUQ0Zyb21ab25lKHN0YXJ0VGltZSwgdGltZVpvbmUpXG5cdFx0XHRcdGV2ZW50Q2xvbmUuZW5kVGltZSA9IGdldEFsbERheURhdGVVVENGcm9tWm9uZShlbmRUaW1lLCB0aW1lWm9uZSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGV2ZW50Q2xvbmUuc3RhcnRUaW1lID0gbmV3IERhdGUoc3RhcnRUaW1lKVxuXHRcdFx0XHRldmVudENsb25lLmVuZFRpbWUgPSBuZXcgRGF0ZShlbmRUaW1lKVxuXHRcdFx0fVxuXHRcdFx0YWRkRGF5c0ZvckV2ZW50SW5zdGFuY2UoZGF5c1RvRXZlbnRzLCBldmVudENsb25lLCByYW5nZSwgdGltZVpvbmUpXG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogZ2V0IGFsbCBpbnN0YW5jZXMgb2YgYWxsIHNlcmllcyBpbiBhIGxpc3Qgb2YgZXZlbnQgc2VyaWVzIHByb2dlbml0b3JzIHRoYXQgaW50ZXJzZWN0IHdpdGggdGhlIGdpdmVuIHJhbmdlLlxuICogd2lsbCByZXR1cm4gYSBzb3J0ZWQgYXJyYXkgb2YgaW5zdGFuY2VzIChieSBzdGFydCB0aW1lKSwgaW50ZXJsZWF2aW5nIHRoZSBzZXJpZXMgaWYgbmVjZXNzYXJ5LlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ2FsZW5kYXJJbnN0YW5jZXNJblJhbmdlKFxuXHRwcm9nZW5pdG9yczogUmVhZG9ubHlBcnJheTxDYWxlbmRhckV2ZW50Pixcblx0cmFuZ2U6IENhbGVuZGFyVGltZVJhbmdlLFxuXHRtYXg6IG51bWJlciA9IEluZmluaXR5LFxuXHR0aW1lWm9uZTogc3RyaW5nID0gZ2V0VGltZVpvbmUoKSxcbik6IEFycmF5PENhbGVuZGFyRXZlbnQ+IHtcblx0Y29uc3QgcmV0OiBBcnJheTxDYWxlbmRhckV2ZW50PiA9IFtdXG5cblx0Y29uc3QgZ2V0TmV4dENhbmRpZGF0ZSA9IChcblx0XHRwcmV2aW91c0NhbmRpZGF0ZTogQ2FsZW5kYXJFdmVudCxcblx0XHRnZW5lcmF0b3I6IEdlbmVyYXRvcjx7XG5cdFx0XHRzdGFydFRpbWU6IERhdGVcblx0XHRcdGVuZFRpbWU6IERhdGVcblx0XHR9Pixcblx0XHRleGNsdWRlZERhdGVzOiBBcnJheTxEYXRlV3JhcHBlcj4sXG5cdCkgPT4ge1xuXHRcdGNvbnN0IGFsbERheSA9IGlzQWxsRGF5RXZlbnQocHJldmlvdXNDYW5kaWRhdGUpXG5cdFx0Y29uc3QgZXhjbHVzaW9ucyA9IGFsbERheSA/IGV4Y2x1ZGVkRGF0ZXMubWFwKCh7IGRhdGUgfSkgPT4gY3JlYXRlRGF0ZVdyYXBwZXIoeyBkYXRlOiBnZXRBbGxEYXlEYXRlRm9yVGltZXpvbmUoZGF0ZSwgdGltZVpvbmUpIH0pKSA6IGV4Y2x1ZGVkRGF0ZXNcblx0XHRsZXQgY3VycmVudFxuXG5cdFx0Ly8gbm90IHVzaW5nIGZvci1vZiBiZWNhdXNlIHRoYXQgYXV0b21hdGljYWxseSBjbG9zZXMgdGhlIGdlbmVyYXRvclxuXHRcdC8vIHdoZW4gYnJlYWtpbmcgb3IgcmV0dXJuaW5nLCBhbmQgd2Ugd2FudCB0byBzdXNwZW5kIGFuZCByZXN1bWUgaXRlcmF0aW9uLlxuXHRcdHdoaWxlIChyZXQubGVuZ3RoIDwgbWF4KSB7XG5cdFx0XHRjdXJyZW50ID0gZ2VuZXJhdG9yLm5leHQoKVxuXG5cdFx0XHRpZiAoY3VycmVudC5kb25lKSBicmVha1xuXG5cdFx0XHRsZXQgeyBzdGFydFRpbWUsIGVuZFRpbWUgfSA9IGN1cnJlbnQudmFsdWVcblx0XHRcdGlmIChzdGFydFRpbWUuZ2V0VGltZSgpID4gcmFuZ2UuZW5kKSBicmVha1xuXHRcdFx0Ly8gdXNpbmcgXCI8PVwiIGJlY2F1c2UgYW4gYWxsLWRheS1ldmVudCB0aGF0IGxhc3RzIG4gZGF5cyBzcGFucyBuKzEgZGF5cyxcblx0XHRcdC8vIGVuZGluZyBhdCBtaWRuaWdodCB1dGMgb24gdGhlIGRheSBhZnRlci4gU28gdGhleSBzZWVtIHRvIGludGVyc2VjdFxuXHRcdFx0Ly8gdGhlIHJhbmdlIGlmIGl0IHN0YXJ0cyBvbiB0aGUgZGF5IGFmdGVyIHRoZSBldmVudCBlbmRzLlxuXHRcdFx0aWYgKGVuZFRpbWUuZ2V0VGltZSgpIDw9IHJhbmdlLnN0YXJ0KSBjb250aW51ZVxuXG5cdFx0XHRpZiAoIWlzRXhjbHVkZWREYXRlKHN0YXJ0VGltZSwgZXhjbHVzaW9ucykpIHtcblx0XHRcdFx0Y29uc3QgbmV4dENhbmRpZGF0ZSA9IGNsb25lKHByZXZpb3VzQ2FuZGlkYXRlKVxuXHRcdFx0XHRpZiAoYWxsRGF5KSB7XG5cdFx0XHRcdFx0bmV4dENhbmRpZGF0ZS5zdGFydFRpbWUgPSBnZXRBbGxEYXlEYXRlVVRDRnJvbVpvbmUoc3RhcnRUaW1lLCB0aW1lWm9uZSlcblx0XHRcdFx0XHRuZXh0Q2FuZGlkYXRlLmVuZFRpbWUgPSBnZXRBbGxEYXlEYXRlVVRDRnJvbVpvbmUoZW5kVGltZSwgdGltZVpvbmUpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bmV4dENhbmRpZGF0ZS5zdGFydFRpbWUgPSBuZXcgRGF0ZShzdGFydFRpbWUpXG5cdFx0XHRcdFx0bmV4dENhbmRpZGF0ZS5lbmRUaW1lID0gbmV3IERhdGUoZW5kVGltZSlcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbmV4dENhbmRpZGF0ZVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHQvLyB3ZSBuZWVkIHRvIGhhdmUgb25lIGNhbmRpZGF0ZSBmb3IgZWFjaCBzZXJpZXMgYW5kIHRoZW4gY2hlY2sgd2hpY2ggb25lIGdldHMgYWRkZWQgZmlyc3QuXG5cdC8vIGlmIHdlIGFkZGVkIG9uZSwgd2UgYWR2YW5jZSB0aGUgZ2VuZXJhdG9yIHRoYXQgZ2VuZXJhdGVkIGl0IHRvIHRoZSBuZXh0IGNhbmRpZGF0ZSBhbmQgcmVwZWF0LlxuXHRjb25zdCBnZW5lcmF0b3JzOiBBcnJheTx7XG5cdFx0Z2VuZXJhdG9yOiBHZW5lcmF0b3I8eyBzdGFydFRpbWU6IERhdGU7IGVuZFRpbWU6IERhdGUgfT5cblx0XHRleGNsdWRlZERhdGVzOiBBcnJheTxEYXRlV3JhcHBlcj5cblx0XHRuZXh0Q2FuZGlkYXRlOiBDYWxlbmRhckV2ZW50XG5cdH0+ID0gcHJvZ2VuaXRvcnNcblx0XHQubWFwKChwKSA9PiB7XG5cdFx0XHRjb25zdCBnZW5lcmF0b3IgPSBnZW5lcmF0ZUV2ZW50T2NjdXJyZW5jZXMocCwgdGltZVpvbmUpXG5cdFx0XHRjb25zdCBleGNsdWRlZERhdGVzID0gcC5yZXBlYXRSdWxlPy5leGNsdWRlZERhdGVzID8/IFtdXG5cdFx0XHRjb25zdCBuZXh0Q2FuZGlkYXRlID0gZ2V0TmV4dENhbmRpZGF0ZShwLCBnZW5lcmF0b3IsIGV4Y2x1ZGVkRGF0ZXMpXG5cdFx0XHRpZiAobmV4dENhbmRpZGF0ZSA9PSBudWxsKSByZXR1cm4gbnVsbFxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0ZXhjbHVkZWREYXRlcyxcblx0XHRcdFx0Z2VuZXJhdG9yLFxuXHRcdFx0XHRuZXh0Q2FuZGlkYXRlLFxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LmZpbHRlcihpc05vdE51bGwpXG5cblx0d2hpbGUgKGdlbmVyYXRvcnMubGVuZ3RoID4gMCkge1xuXHRcdC8vIHBlcmZvcm1hbmNlOiBwdXQgdGhlIHNtYWxsZXN0IG5leHRDYW5kaWRhdGUgaW4gZnJvbnQuIHdlIG9ubHkgY2hhbmdlIHRoZSBmaXJzdCBpdGVtIGluIGVhY2ggaXRlcmF0aW9uLCBzbyB0aGlzIHNob3VsZCBiZSBxdWljayB0byByZS1zb3J0LlxuXHRcdC8vIHN0aWxsIE8obsKyKSBpbiB0aGUgYmVzdCBjYXNlID46KFxuXHRcdC8vIHdlIG1pZ2h0IGltcHJvdmUgcnVudGltZSBoZXJlIGJ5IHJlLWluc2VydGluZyB0aGUgbmV3IG5leHRDYW5kaWRhdGUgaW50byB0aGUgbGlzdCBtYW51YWxseSB1c2luZyBhIGxpbmVhciBvciBiaW5hcnkgc2VhcmNoIGluc3RlYWQgb2YgaW52b2tpbmdcblx0XHQvLyBzb3J0LlxuXHRcdC8vIHdlIGNhbiB0aGVuIGFsc28gbWFpbnRhaW4gYW4gaW5kZXggdG8gdGhlIGZpcnN0IHN0aWxsLW9wZW4gZ2VuZXJhdG9yIGluc3RlYWQgb2Ygc3BsaWNpbmcgb3V0IHRoZSBmaXJzdCBnZW5lcmF0b3Igd2hlbiBpdCBzdG9wcyB5aWVsZGluZyBpbnN0YW5jZXMuXG5cdFx0Z2VuZXJhdG9ycy5zb3J0KChhLCBiKSA9PiAoYS5uZXh0Q2FuZGlkYXRlPy5zdGFydFRpbWUuZ2V0VGltZSgpID8/IDApIC0gKGIubmV4dENhbmRpZGF0ZT8uc3RhcnRUaW1lLmdldFRpbWUoKSA/PyAwKSlcblx0XHRjb25zdCBmaXJzdCA9IGdldEZpcnN0T3JUaHJvdyhnZW5lcmF0b3JzKVxuXHRcdGNvbnN0IG5ld05leHQgPSBnZXROZXh0Q2FuZGlkYXRlKGZpcnN0Lm5leHRDYW5kaWRhdGUsIGZpcnN0LmdlbmVyYXRvciwgZmlyc3QuZXhjbHVkZWREYXRlcylcblxuXHRcdHJldC5wdXNoKGZpcnN0Lm5leHRDYW5kaWRhdGUpXG5cblx0XHRpZiAobmV3TmV4dCA9PSBudWxsKSB7XG5cdFx0XHRnZW5lcmF0b3JzLnNwbGljZSgwLCAxKVxuXHRcdFx0Y29udGludWVcblx0XHR9XG5cblx0XHRmaXJzdC5uZXh0Q2FuZGlkYXRlID0gbmV3TmV4dFxuXHR9XG5cdHJldHVybiByZXRcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBlbmQgZGF0ZSBvZiBhIHJlcGVhdGluZyBydWxlIHRoYXQgY2FuIGJlIHVzZWQgdG8gZGlzcGxheSBpbiB0aGUgdWkuXG4gKlxuICogVGhlIGFjdHVhbCBlbmQgZGF0ZSB0aGF0IGlzIHN0b3JlZCBvbiB0aGUgcmVwZWF0IHJ1bGUgaXMgYWx3YXlzIG9uZSBkYXkgYmVoaW5kIHRoZSBkaXNwbGF5ZWQgZW5kIGRhdGU6XG4gKiAqIGZvciBhbGwtZGF5IGV2ZW50czpcbiAqICAgLSBkaXNwbGF5ZWQgZW5kIGRhdGU6IDIwMjMtMDUtMThcbiAqICAgLSBsYXN0IG9jY3VycmVuY2UgY2FuIGJlOiAyMDIzLTA1LTE4XG4gKiAgIC0gZXhwb3J0ZWQgZW5kIGRhdGU6IDIwMjMtMDUtMThcbiAqICAgLSBhY3R1YWwgdGltZXN0YW1wIG9uIHRoZSBlbnRpdHk6IE1pZG5pZ2h0IFVUQyAyMDIzLTA1LTE5IChzdGFydCBvZiBkYXkpXG4gKiAqIG5vcm1hbCBldmVudHMgYmVoYXZlIHRoZSBzYW1lIGV4Y2VwdDpcbiAqICAgLSBhY3R1YWwgdGltZXN0YW1wIG9uIHRoZSBlbnRpdHkgaXMgTWlkbmlnaHQgbG9jYWwgdGltZXpvbmUgMjAyMy0wNS0xOSAoc3RhcnQgb2YgZGF5KVxuICogQHJldHVybnMge0RhdGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXBlYXRFbmRUaW1lRm9yRGlzcGxheShyZXBlYXRSdWxlOiBSZXBlYXRSdWxlLCBpc0FsbERheTogYm9vbGVhbiwgdGltZVpvbmU6IHN0cmluZyk6IERhdGUge1xuXHRpZiAocmVwZWF0UnVsZS5lbmRUeXBlICE9PSBFbmRUeXBlLlVudGlsRGF0ZSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkV2ZW50IGhhcyBubyByZXBlYXQgcnVsZSBlbmQgdHlwZSBpcyBub3QgVW50aWxEYXRlOiBcIiArIEpTT04uc3RyaW5naWZ5KHJlcGVhdFJ1bGUpKVxuXHR9XG5cblx0Y29uc3QgcmF3RW5kRGF0ZSA9IG5ldyBEYXRlKGZpbHRlckludChyZXBlYXRSdWxlLmVuZFZhbHVlID8/IFwiMFwiKSlcblx0Y29uc3QgbG9jYWxEYXRlID0gaXNBbGxEYXkgPyBnZXRBbGxEYXlEYXRlRm9yVGltZXpvbmUocmF3RW5kRGF0ZSwgdGltZVpvbmUpIDogcmF3RW5kRGF0ZVxuXHQvLyBTaG93biBkYXRlIGlzIG9uZSBkYXkgYmVoaW5kIHRoZSBhY3R1YWwgZW5kIChidXQgaXQgaXMgc3RpbGwgZXhjbHVkZWQpXG5cdHJldHVybiBpbmNyZW1lbnRCeVJlcGVhdFBlcmlvZChsb2NhbERhdGUsIFJlcGVhdFBlcmlvZC5EQUlMWSwgLTEsIHRpbWVab25lKVxufVxuXG4vKipcbiAqIGdlbmVyYXRlcyBhbGwgZXZlbnQgb2NjdXJyZW5jZXMgaW4gY2hyb25vbG9naWNhbCBvcmRlciwgaW5jbHVkaW5nIHRoZSBwcm9nZW5pdG9yLlxuICogdGVybWluYXRlcyBvbmNlIHRoZSBlbmQgY29uZGl0aW9uIG9mIHRoZSByZXBlYXQgcnVsZSBpcyBoaXQuXG4gKiBAcGFyYW0gZXZlbnQgdGhlIGV2ZW50IHRvIGl0ZXJhdGUgb2NjdXJyZW5jZXMgb24uXG4gKiBAcGFyYW0gdGltZVpvbmVcbiAqL1xuZnVuY3Rpb24qIGdlbmVyYXRlRXZlbnRPY2N1cnJlbmNlcyhldmVudDogQ2FsZW5kYXJFdmVudCwgdGltZVpvbmU6IHN0cmluZyk6IEdlbmVyYXRvcjx7IHN0YXJ0VGltZTogRGF0ZTsgZW5kVGltZTogRGF0ZSB9PiB7XG5cdGNvbnN0IHsgcmVwZWF0UnVsZSB9ID0gZXZlbnRcblxuXHRpZiAocmVwZWF0UnVsZSA9PSBudWxsKSB7XG5cdFx0eWllbGQgZXZlbnRcblx0XHRyZXR1cm5cblx0fVxuXG5cdGNvbnN0IGZyZXF1ZW5jeTogUmVwZWF0UGVyaW9kID0gZG93bmNhc3QocmVwZWF0UnVsZS5mcmVxdWVuY3kpXG5cdGNvbnN0IGludGVydmFsID0gTnVtYmVyKHJlcGVhdFJ1bGUuaW50ZXJ2YWwpXG5cdGxldCBldmVudFN0YXJ0VGltZSA9IGdldEV2ZW50U3RhcnQoZXZlbnQsIHRpbWVab25lKVxuXHRsZXQgZXZlbnRFbmRUaW1lID0gZ2V0RXZlbnRFbmQoZXZlbnQsIHRpbWVab25lKVxuXHQvLyBMb29wIGJ5IHRoZSBmcmVxdWVuY3kgc3RlcFxuXHRsZXQgcmVwZWF0RW5kVGltZTogRGF0ZSB8IG51bGwgPSBudWxsXG5cdGxldCBlbmRPY2N1cnJlbmNlczogbnVtYmVyIHwgbnVsbCA9IG51bGxcblx0Y29uc3QgYWxsRGF5ID0gaXNBbGxEYXlFdmVudChldmVudClcblx0Ly8gRm9yIGFsbC1kYXkgZXZlbnRzIHdlIHNob3VsZCByZWx5IG9uIHRoZSBsb2NhbCB0aW1lIHpvbmUgb3IgYXQgbGVhc3Qgd2UgbXVzdCB1c2UgdGhlIHNhbWUgem9uZSBhcyBpbiBnZXRBbGxEYXlEYXRlVVRDRnJvbVpvbmVcblx0Ly8gYmVsb3cuIElmIHRoZXkgYXJlIG5vdCBpbiBzeW5jLCB0aGVuIGRheWxpZ2h0IHNhdmluZyBzaGlmdHMgbWF5IGNhdXNlIHVzIHRvIGV4dHJhY3Qgd3JvbmcgVVRDIGRhdGUgKGRheSBpbiByZXBlYXQgcnVsZSB6b25lIGFuZCBpblxuXHQvLyBsb2NhbCB6b25lIG1heSBiZSBkaWZmZXJlbnQpLlxuXHRjb25zdCByZXBlYXRUaW1lWm9uZSA9IGFsbERheSA/IHRpbWVab25lIDogZ2V0VmFsaWRUaW1lWm9uZShyZXBlYXRSdWxlLnRpbWVab25lKVxuXG5cdGlmIChyZXBlYXRSdWxlLmVuZFR5cGUgPT09IEVuZFR5cGUuQ291bnQpIHtcblx0XHRlbmRPY2N1cnJlbmNlcyA9IE51bWJlcihyZXBlYXRSdWxlLmVuZFZhbHVlKVxuXHR9IGVsc2UgaWYgKHJlcGVhdFJ1bGUuZW5kVHlwZSA9PT0gRW5kVHlwZS5VbnRpbERhdGUpIHtcblx0XHQvLyBTZWUgQ2FsZW5kYXJFdmVudERpYWxvZyBmb3IgYW4gZXhwbGFuYXRpb24gd2h5IGl0J3MgbmVlZGVkXG5cdFx0aWYgKGFsbERheSkge1xuXHRcdFx0cmVwZWF0RW5kVGltZSA9IGdldEFsbERheURhdGVGb3JUaW1lem9uZShuZXcgRGF0ZShOdW1iZXIocmVwZWF0UnVsZS5lbmRWYWx1ZSkpLCB0aW1lWm9uZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVwZWF0RW5kVGltZSA9IG5ldyBEYXRlKE51bWJlcihyZXBlYXRSdWxlLmVuZFZhbHVlKSlcblx0XHR9XG5cdH1cblxuXHRsZXQgY2FsY1N0YXJ0VGltZSA9IGV2ZW50U3RhcnRUaW1lXG5cdGNvbnN0IGNhbGNEdXJhdGlvbiA9IGFsbERheSA/IGdldERpZmZJbjI0aEludGVydmFscyhldmVudFN0YXJ0VGltZSwgZXZlbnRFbmRUaW1lLCB0aW1lWm9uZSkgOiBldmVudEVuZFRpbWUuZ2V0VGltZSgpIC0gZXZlbnRTdGFydFRpbWUuZ2V0VGltZSgpXG5cdGxldCBjYWxjRW5kVGltZSA9IGV2ZW50RW5kVGltZVxuXHRsZXQgaXRlcmF0aW9uID0gMVxuXG5cdHdoaWxlICgoZW5kT2NjdXJyZW5jZXMgPT0gbnVsbCB8fCBpdGVyYXRpb24gPD0gZW5kT2NjdXJyZW5jZXMpICYmIChyZXBlYXRFbmRUaW1lID09IG51bGwgfHwgY2FsY1N0YXJ0VGltZS5nZXRUaW1lKCkgPCByZXBlYXRFbmRUaW1lLmdldFRpbWUoKSkpIHtcblx0XHRhc3NlcnREYXRlSXNWYWxpZChjYWxjU3RhcnRUaW1lKVxuXHRcdGFzc2VydERhdGVJc1ZhbGlkKGNhbGNFbmRUaW1lKVxuXHRcdHlpZWxkIHsgc3RhcnRUaW1lOiBjYWxjU3RhcnRUaW1lLCBlbmRUaW1lOiBjYWxjRW5kVGltZSB9XG5cblx0XHRjYWxjU3RhcnRUaW1lID0gaW5jcmVtZW50QnlSZXBlYXRQZXJpb2QoZXZlbnRTdGFydFRpbWUsIGZyZXF1ZW5jeSwgaW50ZXJ2YWwgKiBpdGVyYXRpb24sIHJlcGVhdFRpbWVab25lKVxuXHRcdGNhbGNFbmRUaW1lID0gYWxsRGF5XG5cdFx0XHQ/IGluY3JlbWVudEJ5UmVwZWF0UGVyaW9kKGNhbGNTdGFydFRpbWUsIFJlcGVhdFBlcmlvZC5EQUlMWSwgY2FsY0R1cmF0aW9uLCByZXBlYXRUaW1lWm9uZSlcblx0XHRcdDogRGF0ZVRpbWUuZnJvbUpTRGF0ZShjYWxjU3RhcnRUaW1lKS5wbHVzKGNhbGNEdXJhdGlvbikudG9KU0RhdGUoKVxuXHRcdGl0ZXJhdGlvbisrXG5cdH1cbn1cblxuLyoqXG4gKiByZXR1cm4gdHJ1ZSBpZiBhbiBldmVudCBoYXMgbW9yZSB0aGFuIG9uZSB2aXNpYmxlIG9jY3VycmVuY2UgYWNjb3JkaW5nIHRvIGl0cyByZXBlYXQgcnVsZSBhbmQgZXhjbHVkZWQgZGF0ZXNcbiAqXG4gKiB3aWxsIGNvbXBhcmUgZXhjbHVzaW9uIHRpbWUgc3RhbXBzIHdpdGggdGhlIGV4YWN0IGRhdGUtdGltZSB2YWx1ZSBvZiB0aGUgb2NjdXJyZW5jZXMgc3RhcnRUaW1lXG4gKlxuICogQHBhcmFtIGV2ZW50IHRoZSBjYWxlbmRhciBldmVudCB0byBjaGVjay4gdG8gZ2V0IGNvcnJlY3QgcmVzdWx0cywgdGhpcyBtdXN0IGJlIHRoZSBwcm9nZW5pdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsZW5kYXJFdmVudEhhc01vcmVUaGFuT25lT2NjdXJyZW5jZXNMZWZ0KHsgcHJvZ2VuaXRvciwgYWx0ZXJlZEluc3RhbmNlcyB9OiBDYWxlbmRhckV2ZW50VWlkSW5kZXhFbnRyeSk6IGJvb2xlYW4ge1xuXHRpZiAocHJvZ2VuaXRvciA9PSBudWxsKSB7XG5cdFx0Ly8gdGhpcyBtYXkgaGFwcGVuIGlmIHdlIGFjY2VwdCBtdWx0aXBsZSBpbnZpdGVzIHRvIGFsdGVyZWQgaW5zdGFuY2VzIHdpdGhvdXQgZXZlciBnZXR0aW5nIHRoZSBwcm9nZW5pdG9yLlxuXHRcdHJldHVybiBhbHRlcmVkSW5zdGFuY2VzLmxlbmd0aCA+IDFcblx0fVxuXHRjb25zdCB7IHJlcGVhdFJ1bGUgfSA9IHByb2dlbml0b3Jcblx0aWYgKHJlcGVhdFJ1bGUgPT0gbnVsbCkge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0Y29uc3QgeyBlbmRUeXBlLCBlbmRWYWx1ZSwgZXhjbHVkZWREYXRlcyB9ID0gcmVwZWF0UnVsZVxuXHRpZiAoZW5kVHlwZSA9PT0gRW5kVHlwZS5OZXZlcikge1xuXHRcdC8vIHRoZXJlIGFyZSBpbmZpbml0ZSBvY2N1cnJlbmNlc1xuXHRcdHJldHVybiB0cnVlXG5cdH0gZWxzZSBpZiAoZW5kVHlwZSA9PT0gRW5kVHlwZS5Db3VudCAmJiBOdW1iZXIoZW5kVmFsdWUgPz8gXCIwXCIpICsgYWx0ZXJlZEluc3RhbmNlcy5sZW5ndGggPiBleGNsdWRlZERhdGVzLmxlbmd0aCArIDEpIHtcblx0XHQvLyBpZiB0aGVyZSBhcmUgbm90IGVub3VnaCBleGNsdXNpb25zIHRvIGRlbGV0ZSBhbGwgYnV0IG9uZSBvY2N1cnJlbmNlLCB3ZSBjYW4gcmV0dXJuIHRydWVcblx0XHRyZXR1cm4gdHJ1ZVxuXHR9IGVsc2UgaWYgKGFsdGVyZWRJbnN0YW5jZXMubGVuZ3RoID4gMSkge1xuXHRcdHJldHVybiB0cnVlXG5cdH0gZWxzZSB7XG5cdFx0Ly8gd2UgbmVlZCB0byBjb3VudCBvY2N1cnJlbmNlcyBhbmQgbWF0Y2ggdGhlbSB1cCBhZ2FpbnN0IGFsdGVyZWQgaW5zdGFuY2VzICYgZXhjbHVzaW9ucy5cblx0XHRjb25zdCBleGNsdWRlZFRpbWVzdGFtcHMgPSBleGNsdWRlZERhdGVzLm1hcCgoeyBkYXRlIH0pID0+IGRhdGUuZ2V0VGltZSgpKVxuXHRcdGxldCBpID0gMFxuXHRcdC8vIGluIG91ciBtb2RlbCwgd2UgaGF2ZSBhbiBleHRyYSBleGNsdXNpb24gZm9yIGVhY2ggYWx0ZXJlZCBpbnN0YW5jZS4gdGhpcyBjb2RlXG5cdFx0Ly8gYXNzdW1lcyB0aGF0IHRoaXMgaW52YXJpYW50IGlzIHVwaGVsZCBoZXJlIGFuZCBkb2VzIG5vdCBtYXRjaCBlYWNoIHJlY3VycmVuY2VJZFxuXHRcdC8vIGFnYWluc3QgYW4gZXhjbHVzaW9uLCBidXQgb25seSB0YWxsaWVzIHRoZW0gdXAuXG5cdFx0bGV0IG9jY3VycmVuY2VzRm91bmQgPSBhbHRlcmVkSW5zdGFuY2VzLmxlbmd0aFxuXHRcdGZvciAoY29uc3QgeyBzdGFydFRpbWUgfSBvZiBnZW5lcmF0ZUV2ZW50T2NjdXJyZW5jZXMocHJvZ2VuaXRvciwgZ2V0VGltZVpvbmUoKSkpIHtcblx0XHRcdGNvbnN0IHN0YXJ0VGltZXN0YW1wID0gc3RhcnRUaW1lLmdldFRpbWUoKVxuXHRcdFx0d2hpbGUgKGkgPCBleGNsdWRlZFRpbWVzdGFtcHMubGVuZ3RoICYmIHN0YXJ0VGltZXN0YW1wID4gZXhjbHVkZWRUaW1lc3RhbXBzW2ldKSB7XG5cdFx0XHRcdC8vIGV4Y2x1c2lvbnMgYXJlIHNvcnRlZFxuXHRcdFx0XHRpKytcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0YXJ0VGltZXN0YW1wICE9PSBleGNsdWRlZFRpbWVzdGFtcHNbaV0pIHtcblx0XHRcdFx0Ly8gd2UgZm91bmQgdGhlIHBsYWNlIGluIHRoZSBhcnJheSB3aGVyZSB0aGUgc3RhcnRUaW1lc3RhbXAgd291bGRcblx0XHRcdFx0Ly8gYmUgaWYgaXQgd2VyZSBpbiB0aGUgYXJyYXlcblx0XHRcdFx0b2NjdXJyZW5jZXNGb3VuZCArPSAxXG5cdFx0XHRcdGlmIChvY2N1cnJlbmNlc0ZvdW5kID4gMSkgcmV0dXJuIHRydWVcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxufVxuXG4vKipcbiAqIGZpbmQgb3V0IGlmIGEgZ2l2ZW4gZGF0ZSBpcyBpbiBhIGxpc3Qgb2YgZXhjbHVkZWQgZGF0ZXNcbiAqIEBwYXJhbSBjdXJyZW50RGF0ZSB0aGUgZGF0ZSB0byBjaGVja1xuICogQHBhcmFtIGV4Y2x1ZGVkRGF0ZXMgYSBzb3J0ZWQgbGlzdCBvZiBleGNsdWRlZCBkYXRlcywgZWFybGllc3QgdG8gbGF0ZXN0XG4gKi9cbmZ1bmN0aW9uIGlzRXhjbHVkZWREYXRlKGN1cnJlbnREYXRlOiBEYXRlLCBleGNsdWRlZERhdGVzOiBSZWFkb25seUFycmF5PERhdGVXcmFwcGVyPiA9IFtdKTogYm9vbGVhbiB7XG5cdHJldHVybiBleGNsdWRlZERhdGVzLnNvbWUoKGR3KSA9PiBkdy5kYXRlLmdldFRpbWUoKSA9PT0gY3VycmVudERhdGUuZ2V0VGltZSgpKVxufVxuXG5leHBvcnQgdHlwZSBBbGFybU9jY3VycmVuY2UgPSB7XG5cdGFsYXJtVGltZTogRGF0ZVxuXHRvY2N1cnJlbmNlTnVtYmVyOiBudW1iZXJcblx0ZXZlbnRUaW1lOiBEYXRlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTmV4dEFsYXJtT2NjdXJyZW5jZShcblx0bm93OiBEYXRlLFxuXHR0aW1lWm9uZTogc3RyaW5nLFxuXHRldmVudFN0YXJ0OiBEYXRlLFxuXHRldmVudEVuZDogRGF0ZSxcblx0ZnJlcXVlbmN5OiBSZXBlYXRQZXJpb2QsXG5cdGludGVydmFsOiBudW1iZXIsXG5cdGVuZFR5cGU6IEVuZFR5cGUsXG5cdGVuZFZhbHVlOiBudW1iZXIsXG5cdGV4Y2x1c2lvbnM6IEFycmF5PERhdGU+LFxuXHRhbGFybVRyaWdnZXI6IEFsYXJtSW50ZXJ2YWwsXG5cdGxvY2FsVGltZVpvbmU6IHN0cmluZyxcbik6IEFsYXJtT2NjdXJyZW5jZSB8IG51bGwge1xuXHRsZXQgb2NjdXJyZW5jZU51bWJlciA9IDBcblx0Y29uc3QgaXNBbGxEYXlFdmVudCA9IGlzQWxsRGF5RXZlbnRCeVRpbWVzKGV2ZW50U3RhcnQsIGV2ZW50RW5kKVxuXHRjb25zdCBjYWxjRXZlbnRTdGFydCA9IGlzQWxsRGF5RXZlbnQgPyBnZXRBbGxEYXlEYXRlRm9yVGltZXpvbmUoZXZlbnRTdGFydCwgbG9jYWxUaW1lWm9uZSkgOiBldmVudFN0YXJ0XG5cdGFzc2VydERhdGVJc1ZhbGlkKGNhbGNFdmVudFN0YXJ0KVxuXHRjb25zdCBlbmREYXRlID0gZW5kVHlwZSA9PT0gRW5kVHlwZS5VbnRpbERhdGUgPyAoaXNBbGxEYXlFdmVudCA/IGdldEFsbERheURhdGVGb3JUaW1lem9uZShuZXcgRGF0ZShlbmRWYWx1ZSksIGxvY2FsVGltZVpvbmUpIDogbmV3IERhdGUoZW5kVmFsdWUpKSA6IG51bGxcblxuXHR3aGlsZSAoZW5kVHlwZSAhPT0gRW5kVHlwZS5Db3VudCB8fCBvY2N1cnJlbmNlTnVtYmVyIDwgZW5kVmFsdWUpIHtcblx0XHRjb25zdCBvY2N1cnJlbmNlRGF0ZSA9IGluY3JlbWVudEJ5UmVwZWF0UGVyaW9kKGNhbGNFdmVudFN0YXJ0LCBmcmVxdWVuY3ksIGludGVydmFsICogb2NjdXJyZW5jZU51bWJlciwgaXNBbGxEYXlFdmVudCA/IGxvY2FsVGltZVpvbmUgOiB0aW1lWm9uZSlcblx0XHRpZiAoZW5kRGF0ZSAmJiBvY2N1cnJlbmNlRGF0ZS5nZXRUaW1lKCkgPj0gZW5kRGF0ZS5nZXRUaW1lKCkpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0aWYgKCFleGNsdXNpb25zLnNvbWUoKGQpID0+IGQuZ2V0VGltZSgpID09PSBvY2N1cnJlbmNlRGF0ZS5nZXRUaW1lKCkpKSB7XG5cdFx0XHRjb25zdCBhbGFybVRpbWUgPSBjYWxjdWxhdGVBbGFybVRpbWUob2NjdXJyZW5jZURhdGUsIGFsYXJtVHJpZ2dlciwgbG9jYWxUaW1lWm9uZSlcblxuXHRcdFx0aWYgKGFsYXJtVGltZSA+PSBub3cpIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRhbGFybVRpbWUsXG5cdFx0XHRcdFx0b2NjdXJyZW5jZU51bWJlcjogb2NjdXJyZW5jZU51bWJlcixcblx0XHRcdFx0XHRldmVudFRpbWU6IG9jY3VycmVuY2VEYXRlLFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdG9jY3VycmVuY2VOdW1iZXIrK1xuXHR9XG5cdHJldHVybiBudWxsXG59XG5cbi8qKiAqL1xuZXhwb3J0IHR5cGUgQ2FsZW5kYXJEYXkgPSB7XG5cdGRhdGU6IERhdGVcblx0eWVhcjogbnVtYmVyXG5cdG1vbnRoOiBudW1iZXJcblx0ZGF5OiBudW1iZXJcblx0LyoqIGRheXMgdGhhdCBhcmUgdGVjaG5pY2FsbHkgbm90IHBhcnQgb2YgdGhlIGN1cnJlbnQgbW9udGgsIGJ1dCBhcmUgc2hvd24gdG8gZmlsbCB0aGUgZ3JpZC4gKi9cblx0aXNQYWRkaW5nRGF5OiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIENhbGVuZGFyTW9udGggPSB7XG5cdHdlZWtkYXlzOiBSZWFkb25seUFycmF5PHN0cmluZz5cblx0d2Vla3M6IFJlYWRvbmx5QXJyYXk8UmVhZG9ubHlBcnJheTxDYWxlbmRhckRheT4+XG5cdC8qKiB0aGUgMXN0IG9mIHRoZSBtb250aCwgbWlnaHQgbm90IGJlIHRoZSBmaXJzdCBkYXRlIGluIHtAbGluayB3ZWVrc30gYmVjYXVzZSBvZiB0aGUgcGFkZGluZyBkYXlzLiAqL1xuXHRiZWdpbm5pbmdPZk1vbnRoOiBEYXRlXG59XG5cbi8qKlxuICpcbiAqIGh0dHBzOi8vd3d3Lmthbnpha2kuY29tL2RvY3MvaWNhbC9zZXF1ZW5jZS5odG1sXG4gKiBUaGUgXCJPcmdhbml6ZXJcIiBpbmNsdWRlcyB0aGlzIHByb3BlcnR5IGluIGFuIGlDYWxlbmRhciBvYmplY3QgdGhhdCBpdCBzZW5kcyB0byBhblxuICogXCJBdHRlbmRlZVwiIHRvIHNwZWNpZnkgdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgY2FsZW5kYXIgY29tcG9uZW50LlxuICpcbiAqIFRoZSBcIkF0dGVuZGVlXCIgaW5jbHVkZXMgdGhpcyBwcm9wZXJ0eSBpbiBhbiBpQ2FsZW5kYXIgb2JqZWN0IHRoYXQgaXQgc2VuZHMgdG8gdGhlIFwiT3JnYW5pemVyXCJcbiAqIHRvIHNwZWNpZnkgdGhlIHZlcnNpb24gb2YgdGhlIGNhbGVuZGFyIGNvbXBvbmVudCB0aGF0IHRoZSBcIkF0dGVuZGVlXCIgaXMgcmVmZXJyaW5nIHRvLlxuICpcbiAqIEBwYXJhbSBzZXF1ZW5jZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50U2VxdWVuY2Uoc2VxdWVuY2U6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IGN1cnJlbnQgPSBmaWx0ZXJJbnQoc2VxdWVuY2UpIHx8IDBcblx0Ly8gT25seSB0aGUgb3JnYW5pemVyIHNob3VsZCBpbmNyZWFzZSBzZXF1ZW5jZSBudW1iZXJzXG5cdHJldHVybiBTdHJpbmcoY3VycmVudCArIDEpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRmlyc3RQcml2YXRlQ2FsZW5kYXIoY2FsZW5kYXJJbmZvOiBSZWFkb25seU1hcDxJZCwgQ2FsZW5kYXJJbmZvPik6IENhbGVuZGFySW5mbyB8IG51bGwge1xuXHRmb3IgKGNvbnN0IGNhbGVuZGFyIG9mIGNhbGVuZGFySW5mby52YWx1ZXMoKSkge1xuXHRcdGlmIChjYWxlbmRhci51c2VySXNPd25lciAmJiAhY2FsZW5kYXIuaXNFeHRlcm5hbCkgcmV0dXJuIGNhbGVuZGFyXG5cdH1cblx0cmV0dXJuIG51bGxcbn1cblxuLyoqXG4gKiBQcmVwYXJlIGNhbGVuZGFyIGV2ZW50IGRlc2NyaXB0aW9uIHRvIGJlIHNob3duIHRvIHRoZSB1c2VyLlxuICpcbiAqIEl0IGlzIG5lZWRlZCB0byBmaXggc3BlY2lhbCBmb3JtYXQgb2YgbGlua3MgZnJvbSBPdXRsb29rIHdoaWNoIG90aGVyd2lzZSBkaXNhcHBlYXIgZHVyaW5nIHNhbml0aXppbmcuXG4gKiBUaGV5IGxvb2sgbGlrZSB0aGlzOlxuICogYGBgXG4gKiB0ZXh0PGh0dHBzOi8vZXhhbXBsZS5jb20+XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZGVzY3JpcHRpb24gZGVzY3JpcHRpb24gdG8gY2xlYW4gdXBcbiAqIEBwYXJhbSBzYW5pdGl6ZXIgb3B0aW9uYWwgc2FuaXRpemVyIHRvIGFwcGx5IGFmdGVyIHByZXBhcmluZyB0aGUgZGVzY3JpcHRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZXBhcmVDYWxlbmRhckRlc2NyaXB0aW9uKGRlc2NyaXB0aW9uOiBzdHJpbmcsIHNhbml0aXplcjogKHM6IHN0cmluZykgPT4gc3RyaW5nKTogc3RyaW5nIHtcblx0Y29uc3QgcHJlcGFyZWQgPSBkZXNjcmlwdGlvbi5yZXBsYWNlKC88KGh0dHB8aHR0cHMpOlxcL1xcL1tBLXowLTkkLV8uKyEq4oCYKCksLz9dKz4vZ2ksIChwb3NzaWJseUxpbmspID0+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgd2l0aG91dEJyYWNrZXRzID0gcG9zc2libHlMaW5rLnNsaWNlKDEsIC0xKVxuXHRcdFx0Y29uc3QgdXJsID0gbmV3IFVSTCh3aXRob3V0QnJhY2tldHMpXG5cdFx0XHRyZXR1cm4gYDxhIGhyZWY9XCIke3VybC50b1N0cmluZygpfVwiPiR7d2l0aG91dEJyYWNrZXRzfTwvYT5gXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIHBvc3NpYmx5TGlua1xuXHRcdH1cblx0fSlcblxuXHRyZXR1cm4gc2FuaXRpemVyKHByZXBhcmVkKVxufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9IT1VSX09GX0RBWSA9IDZcblxuLyoqIEdldCBDU1MgY2xhc3MgZm9yIHRoZSBkYXRlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGF0ZUluZGljYXRvcihkYXk6IERhdGUsIHNlbGVjdGVkRGF0ZTogRGF0ZSB8IG51bGwpOiBzdHJpbmcge1xuXHRpZiAoaXNTYW1lRGF5T2ZEYXRlKGRheSwgc2VsZWN0ZWREYXRlKSkge1xuXHRcdHJldHVybiBcIi5hY2NlbnQtYmcuY2lyY2xlXCJcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gXCJcIlxuXHR9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoYXQgZm9ybWF0IHRoZSB0aW1lIG9mIGFuIGV2ZW50IHNob3VsZCBiZSByZW5kZXJlZCBpbiBnaXZlbiBhIHN1cnJvdW5kaW5nIHRpbWUgcGVyaW9kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUaW1lVGV4dEZvcm1hdEZvckxvbmdFdmVudChldjogQ2FsZW5kYXJFdmVudCwgc3RhcnREYXk6IERhdGUsIGVuZERheTogRGF0ZSwgem9uZTogc3RyaW5nKTogRXZlbnRUZXh0VGltZU9wdGlvbiB8IG51bGwge1xuXHRjb25zdCBzdGFydHNCZWZvcmUgPSBldmVudFN0YXJ0c0JlZm9yZShzdGFydERheSwgem9uZSwgZXYpXG5cdGNvbnN0IGVuZHNBZnRlciA9IGV2ZW50RW5kc0FmdGVyT3JPbihlbmREYXksIHpvbmUsIGV2KVxuXG5cdGlmICgoc3RhcnRzQmVmb3JlICYmIGVuZHNBZnRlcikgfHwgaXNBbGxEYXlFdmVudChldikpIHtcblx0XHRyZXR1cm4gbnVsbFxuXHR9IGVsc2UgaWYgKHN0YXJ0c0JlZm9yZSAmJiAhZW5kc0FmdGVyKSB7XG5cdFx0cmV0dXJuIEV2ZW50VGV4dFRpbWVPcHRpb24uRU5EX1RJTUVcblx0fSBlbHNlIGlmICghc3RhcnRzQmVmb3JlICYmIGVuZHNBZnRlcikge1xuXHRcdHJldHVybiBFdmVudFRleHRUaW1lT3B0aW9uLlNUQVJUX1RJTUVcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gRXZlbnRUZXh0VGltZU9wdGlvbi5TVEFSVF9FTkRfVElNRVxuXHR9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBkYXRlIHdpdGggdGhlIHllYXIsIG1vbnRoIGFuZCBkYXkgZnJvbSB0aGUgRGF0ZSBhbmQgdGhlIGhvdXJzIGFuZCBtaW51dGVzIGZyb20gdGhlIFRpbWVcbiAqIEBwYXJhbSBkYXRlXG4gKiBAcGFyYW0gdGltZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZURhdGVXaXRoVGltZShkYXRlOiBEYXRlLCB0aW1lOiBUaW1lKTogRGF0ZSB7XG5cdGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZShkYXRlKVxuXHRuZXdEYXRlLnNldEhvdXJzKHRpbWUuaG91cilcblx0bmV3RGF0ZS5zZXRNaW51dGVzKHRpbWUubWludXRlKVxuXHRyZXR1cm4gbmV3RGF0ZVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGFuIGV2ZW50IG9jY3VycyBkdXJpbmcgc29tZSB0aW1lIHBlcmlvZCBvZiBkYXlzLCBlaXRoZXIgcGFydGlhbGx5IG9yIGVudGlyZWx5XG4gKiBFeHBlY3RzIHRoYXQgZmlyc3REYXlPZldlZWsgaXMgYmVmb3JlIGxhc3REYXlPZldlZWssIGFuZCB0aGF0IGV2ZW50IHN0YXJ0cyBiZWZvcmUgaXQgZW5kcywgb3RoZXJ3aXNlIHJlc3VsdCBpcyBpbnZhbGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0V2ZW50QmV0d2VlbkRheXMoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIGZpcnN0RGF5OiBEYXRlLCBsYXN0RGF5OiBEYXRlLCB6b25lOiBzdHJpbmcpOiBib29sZWFuIHtcblx0Y29uc3QgZW5kT2ZEYXkgPSBEYXRlVGltZS5mcm9tSlNEYXRlKGxhc3REYXksIHsgem9uZSB9KS5lbmRPZihcImRheVwiKS50b0pTRGF0ZSgpXG5cdHJldHVybiAhKGV2ZW50RW5kc0JlZm9yZShmaXJzdERheSwgem9uZSwgZXZlbnQpIHx8IGV2ZW50U3RhcnRzQWZ0ZXIoZW5kT2ZEYXksIHpvbmUsIGV2ZW50KSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZpcnN0RGF5T2ZNb250aChkOiBEYXRlKTogRGF0ZSB7XG5cdGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShkKVxuXHRkYXRlLnNldERhdGUoMSlcblx0cmV0dXJuIGRhdGVcbn1cblxuLyoqXG4gKiBnZXQgdGhlIFwicHJpbWFyeVwiIGV2ZW50IG9mIGEgc2VyaWVzIC0gdGhlIG9uZSB0aGF0IGNvbnRhaW5zIHRoZSByZXBlYXQgcnVsZSBhbmQgaXMgbm90IGEgcmVwZWF0ZWQgb3IgYSByZXNjaGVkdWxlZCBpbnN0YW5jZS5cbiAqIEBwYXJhbSBjYWxlbmRhckV2ZW50XG4gKiBAcGFyYW0gZW50aXR5Q2xpZW50XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlQ2FsZW5kYXJFdmVudFByb2dlbml0b3IoY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCwgZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQpOiBQcm9taXNlPENhbGVuZGFyRXZlbnQ+IHtcblx0cmV0dXJuIGNhbGVuZGFyRXZlbnQucmVwZWF0UnVsZSA/IGF3YWl0IGVudGl0eUNsaWVudC5sb2FkKENhbGVuZGFyRXZlbnRUeXBlUmVmLCBjYWxlbmRhckV2ZW50Ll9pZCkgOiBjYWxlbmRhckV2ZW50XG59XG5cbi8qKiBjbGlwIHRoZSByYW5nZSBzdGFydC1lbmQgdG8gdGhlIHJhbmdlIGdpdmVuIGJ5IG1pbi1tYXguIGlmIHRoZSByZXN1bHQgd291bGQgaGF2ZSBsZW5ndGggMCwgbnVsbCBpcyByZXR1cm5lZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGlwUmFuZ2VzKHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBDYWxlbmRhclRpbWVSYW5nZSB8IG51bGwge1xuXHRjb25zdCByZXMgPSB7XG5cdFx0c3RhcnQ6IE1hdGgubWF4KHN0YXJ0LCBtaW4pLFxuXHRcdGVuZDogTWF0aC5taW4oZW5kLCBtYXgpLFxuXHR9XG5cdHJldHVybiByZXMuc3RhcnQgPCByZXMuZW5kID8gcmVzIDogbnVsbFxufVxuXG5leHBvcnQgZW51bSBBbGFybUludGVydmFsVW5pdCB7XG5cdE1JTlVURSA9IFwiTVwiLFxuXHRIT1VSID0gXCJIXCIsXG5cdERBWSA9IFwiRFwiLFxuXHRXRUVLID0gXCJXXCIsXG59XG5cbmV4cG9ydCBjb25zdCBTdGFuZGFyZEFsYXJtSW50ZXJ2YWwgPSBPYmplY3QuZnJlZXplKHtcblx0WkVST19NSU5VVEVTOiB7IHZhbHVlOiAwLCB1bml0OiBBbGFybUludGVydmFsVW5pdC5NSU5VVEUgfSxcblx0RklWRV9NSU5VVEVTOiB7IHZhbHVlOiA1LCB1bml0OiBBbGFybUludGVydmFsVW5pdC5NSU5VVEUgfSxcblx0VEVOX01JTlVURVM6IHsgdmFsdWU6IDEwLCB1bml0OiBBbGFybUludGVydmFsVW5pdC5NSU5VVEUgfSxcblx0VEhJUlRZX01JTlVURVM6IHsgdmFsdWU6IDMwLCB1bml0OiBBbGFybUludGVydmFsVW5pdC5NSU5VVEUgfSxcblx0T05FX0hPVVI6IHsgdmFsdWU6IDEsIHVuaXQ6IEFsYXJtSW50ZXJ2YWxVbml0LkhPVVIgfSxcblx0T05FX0RBWTogeyB2YWx1ZTogMSwgdW5pdDogQWxhcm1JbnRlcnZhbFVuaXQuREFZIH0sXG5cdFRXT19EQVlTOiB7IHZhbHVlOiAyLCB1bml0OiBBbGFybUludGVydmFsVW5pdC5EQVkgfSxcblx0VEhSRUVfREFZUzogeyB2YWx1ZTogMywgdW5pdDogQWxhcm1JbnRlcnZhbFVuaXQuREFZIH0sXG5cdE9ORV9XRUVLOiB7IHZhbHVlOiAxLCB1bml0OiBBbGFybUludGVydmFsVW5pdC5XRUVLIH0sXG59IGFzIGNvbnN0IHNhdGlzZmllcyBSZWNvcmQ8c3RyaW5nLCBBbGFybUludGVydmFsPilcblxuLyoqXG4gKiBSdW50aW1lIHJlcHJlc2VudGF0aW9uIG9mIGFuIGFsYXJtIGludGVydmFsL2FsYXJtIHRyaWdnZXIuXG4gKiBVbmxpa2UgaUNhbCB3ZSBvbmx5IHN1cHBvcnQgb25lIHVuaXQgYW5kIGFsYXJtcyBpbiB0aGUgcGFzdFxuICogKHJlcHJlc2VudGVkIGhlcmUgYXMgbm9uLW5lZ2F0aXZlIG51bWJlcnMpLlxuICovXG5leHBvcnQgdHlwZSBBbGFybUludGVydmFsID0gUmVhZG9ubHk8e1xuXHR1bml0OiBBbGFybUludGVydmFsVW5pdFxuXHR2YWx1ZTogbnVtYmVyXG59PlxuXG5leHBvcnQgZnVuY3Rpb24gYWxhcm1JbnRlcnZhbFRvTHV4b25EdXJhdGlvbkxpa2VPYmplY3QoYWxhcm1JbnRlcnZhbDogQWxhcm1JbnRlcnZhbCk6IER1cmF0aW9uTGlrZU9iamVjdCB7XG5cdHN3aXRjaCAoYWxhcm1JbnRlcnZhbC51bml0KSB7XG5cdFx0Y2FzZSBBbGFybUludGVydmFsVW5pdC5NSU5VVEU6XG5cdFx0XHRyZXR1cm4geyBtaW51dGVzOiBhbGFybUludGVydmFsLnZhbHVlIH1cblx0XHRjYXNlIEFsYXJtSW50ZXJ2YWxVbml0LkhPVVI6XG5cdFx0XHRyZXR1cm4geyBob3VyczogYWxhcm1JbnRlcnZhbC52YWx1ZSB9XG5cdFx0Y2FzZSBBbGFybUludGVydmFsVW5pdC5EQVk6XG5cdFx0XHRyZXR1cm4geyBkYXlzOiBhbGFybUludGVydmFsLnZhbHVlIH1cblx0XHRjYXNlIEFsYXJtSW50ZXJ2YWxVbml0LldFRUs6XG5cdFx0XHRyZXR1cm4geyB3ZWVrczogYWxhcm1JbnRlcnZhbC52YWx1ZSB9XG5cdH1cbn1cblxuLyoqXG4gKiBjb21wYXJlIHR3byBsaXN0cyBvZiBkYXRlcyB0aGF0IGFyZSBzb3J0ZWQgZnJvbSBlYXJsaWVzdCB0byBsYXRlc3QuIHJldHVybiB0cnVlIGlmIHRoZXkgYXJlIGVxdWl2YWxlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcmVFeGNsdWRlZERhdGVzRXF1YWwoZTE6IFJlYWRvbmx5QXJyYXk8RGF0ZVdyYXBwZXI+LCBlMjogUmVhZG9ubHlBcnJheTxEYXRlV3JhcHBlcj4pOiBib29sZWFuIHtcblx0aWYgKGUxLmxlbmd0aCAhPT0gZTIubGVuZ3RoKSByZXR1cm4gZmFsc2Vcblx0cmV0dXJuIGUxLmV2ZXJ5KCh7IGRhdGUgfSwgaSkgPT4gZTJbaV0uZGF0ZS5nZXRUaW1lKCkgPT09IGRhdGUuZ2V0VGltZSgpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJlUmVwZWF0UnVsZXNFcXVhbChyMTogQ2FsZW5kYXJSZXBlYXRSdWxlIHwgbnVsbCwgcjI6IENhbGVuZGFyUmVwZWF0UnVsZSB8IG51bGwpOiBib29sZWFuIHtcblx0cmV0dXJuIChcblx0XHRyMSA9PT0gcjIgfHxcblx0XHQocjE/LmVuZFR5cGUgPT09IHIyPy5lbmRUeXBlICYmXG5cdFx0XHRyMT8uZW5kVmFsdWUgPT09IHIyPy5lbmRWYWx1ZSAmJlxuXHRcdFx0cjE/LmZyZXF1ZW5jeSA9PT0gcjI/LmZyZXF1ZW5jeSAmJlxuXHRcdFx0cjE/LmludGVydmFsID09PSByMj8uaW50ZXJ2YWwgJiZcblx0XHRcdC8qKiByMT8udGltZVpvbmUgPT09IHIyPy50aW1lWm9uZSAmJiB3ZSdyZSBpZ25vcmluZyB0aW1lIHpvbmUgYmVjYXVzZSBpdCdzIG5vdCBhbiBvYnNlcnZhYmxlIGNoYW5nZS4gKi9cblx0XHRcdGFyZUV4Y2x1ZGVkRGF0ZXNFcXVhbChyMT8uZXhjbHVkZWREYXRlcyA/PyBbXSwgcjI/LmV4Y2x1ZGVkRGF0ZXMgPz8gW10pICYmXG5cdFx0XHRkZWVwRXF1YWwocjE/LmFkdmFuY2VkUnVsZXMsIHIyPy5hZHZhbmNlZFJ1bGVzKSlcblx0KVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGRiIHJlcHJlc2VudGF0aW9uIG9mIGFsYXJtIHRvIGEgcnVudGltZSBvbmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFsYXJtSW50ZXJ2YWwoc2VyaWFsaXplZDogc3RyaW5nKTogQWxhcm1JbnRlcnZhbCB7XG5cdGNvbnN0IG1hdGNoZWQgPSBzZXJpYWxpemVkLm1hdGNoKC9eKFxcZCspKFtNSERXXSkkLylcblx0aWYgKG1hdGNoZWQpIHtcblx0XHRjb25zdCBbXywgZGlnaXRzLCB1bml0XSA9IG1hdGNoZWRcblx0XHRjb25zdCB2YWx1ZSA9IGZpbHRlckludChkaWdpdHMpXG5cdFx0aWYgKGlzTmFOKHZhbHVlKSkge1xuXHRcdFx0dGhyb3cgbmV3IFBhcnNlckVycm9yKGBJbnZhbGlkIHZhbHVlOiAke3ZhbHVlfWApXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7IHZhbHVlLCB1bml0OiB1bml0IGFzIEFsYXJtSW50ZXJ2YWxVbml0IH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IFBhcnNlckVycm9yKGBJbnZhbGlkIGFsYXJtIGludGVydmFsOiAke3NlcmlhbGl6ZWR9YClcblx0fVxufVxuXG5leHBvcnQgZW51bSBDYWxlbmRhclR5cGUge1xuXHROT1JNQUwsXG5cdFVSTCwgLy8gRXh0ZXJuYWwgY2FsZW5kYXJcblx0Q0xJRU5UX09OTFksXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NsaWVudE9ubHlDYWxlbmRhcihjYWxlbmRhcklkOiBJZCkge1xuXHRjb25zdCBjbGllbnRPbmx5SWQgPSBjYWxlbmRhcklkLm1hdGNoKC8jKC4qKS8pPy5bMV0hXG5cdHJldHVybiBDTElFTlRfT05MWV9DQUxFTkRBUlMuaGFzKGNsaWVudE9ubHlJZClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xpZW50T25seUNhbGVuZGFyVHlwZShjYWxlbmRhclR5cGU6IENhbGVuZGFyVHlwZSkge1xuXHRyZXR1cm4gY2FsZW5kYXJUeXBlID09PSBDYWxlbmRhclR5cGUuQ0xJRU5UX09OTFlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9ybWFsQ2FsZW5kYXJUeXBlKGNhbGVuZGFyVHlwZTogQ2FsZW5kYXJUeXBlKSB7XG5cdHJldHVybiBjYWxlbmRhclR5cGUgPT09IENhbGVuZGFyVHlwZS5OT1JNQUxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXh0ZXJuYWxDYWxlbmRhclR5cGUoY2FsZW5kYXJUeXBlOiBDYWxlbmRhclR5cGUpIHtcblx0cmV0dXJuIGNhbGVuZGFyVHlwZSA9PT0gQ2FsZW5kYXJUeXBlLlVSTFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU291cmNlVXJsKGdyb3VwU2V0dGluZ3M6IEdyb3VwU2V0dGluZ3MgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG5cdHJldHVybiBpc05vdE51bGwoZ3JvdXBTZXR0aW5ncz8uc291cmNlVXJsKSAmJiBncm91cFNldHRpbmdzPy5zb3VyY2VVcmwgIT09IFwiXCJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENhbGVuZGFyVHlwZShncm91cFNldHRpbmdzOiBHcm91cFNldHRpbmdzIHwgbnVsbCwgZ3JvdXBJbmZvOiBHcm91cEluZm8pOiBDYWxlbmRhclR5cGUge1xuXHRpZiAoaGFzU291cmNlVXJsKGdyb3VwU2V0dGluZ3MpKSByZXR1cm4gQ2FsZW5kYXJUeXBlLlVSTFxuXHRpZiAoaXNDbGllbnRPbmx5Q2FsZW5kYXIoZ3JvdXBTZXR0aW5ncyA/IGdyb3VwU2V0dGluZ3MuX2lkIDogZ3JvdXBJbmZvLmdyb3VwKSkgcmV0dXJuIENhbGVuZGFyVHlwZS5DTElFTlRfT05MWVxuXHRyZXR1cm4gQ2FsZW5kYXJUeXBlLk5PUk1BTFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFllYXJGcm9tQmlydGhkYXkoYmlydGhkYXk6IHN0cmluZyB8IG51bGwpOiBudW1iZXIgfCBudWxsIHtcblx0aWYgKCFiaXJ0aGRheSkge1xuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRjb25zdCBkYXRlUGFydHMgPSBiaXJ0aGRheS5zcGxpdChcIi1cIilcblx0Y29uc3QgcGFydHNMZW5ndGggPSBkYXRlUGFydHMubGVuZ3RoXG5cblx0Ly8gQSB2YWxpZCBJU08gZGF0ZSBzaG91bGQgY29udGFpbiAzIHBhcnRzOlxuXHQvLyBZWVlZLW1tLWRkID0+IFt5eXl5LCBtbSwgZGRdXG5cdGlmIChwYXJ0c0xlbmd0aCAhPT0gMykge1xuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRyZXR1cm4gTnVtYmVyLnBhcnNlSW50KGRhdGVQYXJ0c1swXSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJldHJpZXZlQ2xpZW50T25seUV2ZW50c0ZvclVzZXIobG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsIGV2ZW50czogSWRUdXBsZVtdLCBsb2NhbEV2ZW50czogTWFwPG51bWJlciwgQmlydGhkYXlFdmVudFJlZ2lzdHJ5W10+KSB7XG5cdGlmICghKGF3YWl0IGxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzTmV3UGFpZFBsYW4oKSkpIHtcblx0XHRyZXR1cm4gW11cblx0fVxuXG5cdGNvbnN0IGNsaWVudE9ubHlFdmVudHMgPSBldmVudHMuZmlsdGVyKChbY2FsZW5kYXJJZCwgX10pID0+IGlzQ2xpZW50T25seUNhbGVuZGFyKGNhbGVuZGFySWQpKS5mbGF0TWFwKChldmVudCkgPT4gZXZlbnQuam9pbihcIi9cIikpXG5cdGNvbnN0IHJldHJpZXZlZEV2ZW50czogQ2FsZW5kYXJFdmVudFtdID0gW11cblxuXHRmb3IgKGNvbnN0IGV2ZW50IG9mIEFycmF5LmZyb20obG9jYWxFdmVudHMudmFsdWVzKCkpLmZsYXQoKSkge1xuXHRcdGlmIChjbGllbnRPbmx5RXZlbnRzLmluY2x1ZGVzKGV2ZW50LmV2ZW50Ll9pZC5qb2luKFwiL1wiKSkpIHtcblx0XHRcdHJldHJpZXZlZEV2ZW50cy5wdXNoKGV2ZW50LmV2ZW50KVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXRyaWV2ZWRFdmVudHNcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZUNvbnRhY3RzQWdlKGJpcnRoWWVhcjogbnVtYmVyIHwgbnVsbCwgY3VycmVudFllYXI6IG51bWJlcik6IG51bWJlciB8IG51bGwge1xuXHRpZiAoIWJpcnRoWWVhcikge1xuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRyZXR1cm4gY3VycmVudFllYXIgLSBiaXJ0aFllYXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RDb250YWN0SWRGcm9tRXZlbnQoaWQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcgfCBudWxsIHtcblx0aWYgKGlkID09IG51bGwpIHtcblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0cmV0dXJuIGRlY29kZUJhc2U2NChcInV0Zi04XCIsIGlkKVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBd0RPLFNBQVMsa0JBQWtCQSxhQUFtQkMsTUFBY0MsT0FBK0I7QUFDakcsUUFBTyxjQUFjLE9BQU8sS0FBSyxDQUFDLFNBQVMsR0FBRyxZQUFZLFNBQVM7QUFDbkU7QUFFTSxTQUFTLGdCQUFnQkMsTUFBWUYsTUFBY0MsT0FBK0I7QUFDeEYsUUFBTyxZQUFZLE9BQU8sS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLLFNBQVM7QUFDMUQ7QUFFTSxTQUFTLGlCQUFpQkMsTUFBWUYsTUFBY0MsT0FBK0I7QUFDekYsUUFBTyxjQUFjLE9BQU8sS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLLFNBQVM7QUFDNUQ7QUFFTSxT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