//@flow
import {getStartOfDay, incrementDate, isSameDay, isSameDayOfDate} from "../api/common/utils/DateUtils"
import {pad} from "../api/common/utils/StringUtils"
import type {
	CalendarAttendeeStatusEnum,
	EventTextTimeOptionEnum,
	RepeatPeriodEnum,
	ShareCapabilityEnum,
	WeekStartEnum
} from "../api/common/TutanotaConstants"
import {
	CalendarAttendeeStatus,
	defaultCalendarColor,
	EventTextTimeOption,
	getWeekStart,
	GroupType,
	RepeatPeriod,
	ShareCapability,
	WeekStart
} from "../api/common/TutanotaConstants"
import {DateTime} from "luxon"
import {clone, neverNull} from "../api/common/utils/Utils"
import type {CalendarRepeatRule} from "../api/entities/tutanota/CalendarRepeatRule"
import {createCalendarRepeatRule} from "../api/entities/tutanota/CalendarRepeatRule"
import {DAYS_SHIFTED_MS, generateEventElementId, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {lang} from "../misc/LanguageViewModel"
import {formatDateTime, formatDateWithMonth, formatTime} from "../misc/Formatter"
import {size} from "../gui/size"
import {assertMainOrNode} from "../api/Env"
import {logins} from "../api/main/LoginController"
import {isSameId} from "../api/common/EntityFunctions"
import {getFromMap} from "../api/common/utils/MapUtils"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import type {CalendarGroupRoot} from "../api/entities/tutanota/CalendarGroupRoot"
import type {User} from "../api/entities/sys/User"
import type {Group} from "../api/entities/sys/Group"
import type {GroupMembership} from "../api/entities/sys/GroupMembership"
import {isColorLight} from "../gui/Color"
import type {CalendarInfo} from "./CalendarView"
import {incrementByRepeatPeriod} from "./CalendarModel"

assertMainOrNode()

export const CALENDAR_EVENT_HEIGHT: number = size.calendar_line_height + 2
export const CALENDAR_MIME_TYPE = "text/calendar"

export type CalendarMonthTimeRange = {
	start: Date,
	end: Date
}


export function eventStartsBefore(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventStart(event, zone).getTime() < currentDate.getTime()
}

export function eventEndsAfterDay(currentDate: Date, zone: string, event: CalendarEvent): boolean {
	return getEventEnd(event, zone).getTime() > getStartOfNextDayWithZone(currentDate, zone).getTime()
}

export function generateUid(groupId: Id, timestamp: number): string {
	return `${groupId}${timestamp}@tutanota.com`
}

/**
 * Accepts 2, 2:30, 2:5, 02:05, 02:30, 24:30, 2430, 12:30pm, 12:30 p.m.
 */
export function parseTime(timeString: string): ?{hours: number, minutes: number} {
	let suffix  // am/pm indicator or undefined
	let hours   // numeric hours
	let minutes // numeric minutes
	// See if the time includes a colon separating hh:mm
	let mt = timeString.match(/^(\d{1,2}):(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)?$/i)
	if (mt != null) {
		suffix = mt[3]
		hours = parseInt(mt[1], 10)
		minutes = parseInt(mt[2], 10)
	} else {
		// Interpret 127am as 1:27am or 2311 as 11:11pm, e.g.
		mt = timeString.match(/^(\d{1,4})\s*(am|pm|a\.m\.|p\.m\.)?$/i)
		if (mt != null) {
			suffix = mt[2]
			const digits = mt[1]
			// Hours only?
			if (digits.length <= 2) {
				hours = parseInt(digits, 10)
				minutes = 0
			} else {
				hours = parseInt(digits.substr(0, digits.length - 2), 10)
				minutes = parseInt(digits.substr(-2, 2), 10)
			}
		} else {
			return null
		}
	}
	if (isNaN(hours) || isNaN(minutes) || minutes > 59) {
		return null
	}
	if (suffix) {
		suffix = suffix.toUpperCase()
	}
	if (suffix === "PM" || suffix === "P.M.") {
		if (hours > 12) return null
		if (hours !== 12) hours = hours + 12
	} else if (suffix === "AM" || suffix === "A.M.") {
		if (hours > 12) return null
		if (hours === 12) hours = 0
	} else if (hours > 23) {
		return null
	}
	return {hours, minutes}
}

/**
 * Stricter version of parseInt() from MDN. parseInt() allows some arbitrary characters at the end of the string.
 * Returns NaN in case there's anything non-number in the string.
 */
export function filterInt(value: string): number {
	if (/^\d+$/.test(value)) {
		return parseInt(value, 10);
	} else {
		return NaN;
	}
}


export function timeString(date: Date, amPm: boolean): string {
	return timeStringFromParts(date.getHours(), date.getMinutes(), amPm)
}

export function timeStringInZone(date: Date, amPm: boolean, zone: string): string {
	const {hour, minute} = DateTime.fromJSDate(date, {zone})
	return timeStringFromParts(hour, minute, amPm)
}

export function timeStringFromParts(hours: number, minutes: number, amPm: boolean): string {
	let minutesString = pad(minutes, 2)
	if (amPm) {
		if (hours === 0) {
			return `12:${minutesString} am`
		} else if (hours === 12) {
			return `12:${minutesString} pm`
		} else if (hours > 12) {
			return `${hours - 12}:${minutesString} pm`
		} else {
			return `${hours}:${minutesString} am`
		}
	} else {
		let hoursString = pad(hours, 2)
		return hoursString + ":" + minutesString
	}
}

export function shouldDefaultToAmPmTimeFormat(): boolean {
	return lang.code === "en"
}

export function getAllDayDateForTimezone(utcDate: Date, timeZone: string): Date {
	return DateTime.fromObject({
		year: utcDate.getUTCFullYear(),
		month: utcDate.getUTCMonth() + 1,
		day: utcDate.getUTCDate(),
		zone: timeZone
	}).toJSDate()
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

export function getTimeZone(): string {
	return DateTime.local().zoneName
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
	let lastEventEnding = null
	let columns: Array<Array<CalendarEvent>> = []
	const children = []
	// Cache for calculation events
	const calcEvents = new Map()
	events.forEach((e) => {
		const calcEvent = getFromMap(calcEvents, e, () => getCalculationEvent(e, zone, handleAsAllDay))

		// Check if a new event group needs to be started
		if (lastEventEnding !== null && calcEvent.startTime.getTime() >= lastEventEnding) {
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
		if (lastEventEnding === null || calcEvent.endTime.getTime() > lastEventEnding) {
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


export function getEventText(event: CalendarEvent, showTime: EventTextTimeOptionEnum): string {
	switch (showTime) {
		case EventTextTimeOption.NO_TIME:
			return event.summary
		case EventTextTimeOption.START_TIME:
			return `${formatTime(event.startTime)} ${event.summary}`
		case EventTextTimeOption.END_TIME:
			return `- ${formatTime(event.endTime)} ${event.summary}`
		case EventTextTimeOption.START_END_TIME:
			return `${formatTime(event.startTime)} - ${formatTime(event.endTime)} ${event.summary}`
		case EventTextTimeOption.ALL_DAY:
			return `${lang.get("allDay_label")} ${event.summary}`
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
	return Math.floor(DateTime.fromJSDate(a).diff(DateTime.fromJSDate(b), 'day').days)
}

export function getCalendarName(groupInfo: GroupInfo, allowGroupNameOverride: boolean): string {
	const {userSettingsGroupRoot} = logins.getUserController()
	const groupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === groupInfo.group)
	return (allowGroupNameOverride && groupSettings && groupSettings.name) || groupInfo.name || lang.get("privateCalendar_label")
}

export function getEventColor(event: CalendarEvent, groupColors: {[Id]: string}): string {
	return groupColors[neverNull(event._ownerGroup)] || defaultCalendarColor
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

export function getCalendarWeek(dayInTheWeek: Date, startOfTheWeek: WeekStartEnum): Array<Date> {
	let calculationDate = getStartOfWeek(dayInTheWeek, getStartOfTheWeekOffset(startOfTheWeek))
	const days = []
	for (let i = 0; i < 7; i++) {
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

export function getStartOfTheWeekOffsetForUser(): number {
	return getStartOfTheWeekOffset(getWeekStart(logins.getUserController().userSettingsGroupRoot))
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
	if (isAllDayEvent(event)) {
		return getAllDayDateForTimezone(event.startTime, timeZone)
	} else {
		return event.startTime
	}
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


export function hasCapabilityOnGroup(user: User, group: Group, requiredCapability: ShareCapabilityEnum): boolean {
	if (group.type !== GroupType.Calendar) {
		return false
	}

	if (isSharedGroupOwner(group, user._id)) {
		return true;
	}
	const membership = user.memberships.find((gm: GroupMembership) => isSameId(gm.group, group._id))
	if (membership) {
		return membership.capability != null && Number(requiredCapability) <= Number(membership.capability)
	}
	return false
}

export function isSharedGroupOwner(sharedGroup: Group, userId: Id): boolean {
	return !!(sharedGroup.user && isSameId(sharedGroup.user, userId))
}

export function getCapabilityText(capability: ?ShareCapabilityEnum): string {
	switch (capability) {
		case ShareCapability.Invite:
			return lang.get("calendarShareCapabilityInvite_label")
		case ShareCapability.Write:
			return lang.get("calendarShareCapabilityWrite_label")
		case ShareCapability.Read:
			return lang.get("calendarShareCapabilityRead_label")
		default:
			return lang.get("comboBoxSelectionNone_msg")
	}
}

export function isSameEvent(left: CalendarEvent, right: CalendarEvent): boolean {
	// in addition to the id we compare the start time equality to be able to distinguish repeating events. They have the same id but different start time.
	return isSameId(left._id, right._id) && left.startTime.getTime() === right.startTime.getTime()
}


export function hasAlarmsForTheUser(event: CalendarEvent): boolean {
	const useAlarmList = neverNull(logins.getUserController().user.alarmInfoList).alarms
	return event.alarmInfos.some(([listId]) => isSameId(listId, useAlarmList))
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

export function incrementSequence(sequence: string): string {
	const current = filterInt(sequence) || 0
	return String(current + 1)
}

export function getNextHalfHour(): Date {
	let date: Date = new Date()
	if (date.getMinutes() > 30) {
		date.setHours(date.getHours() + 1, 0)
	} else {
		date.setMinutes(30)
	}
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