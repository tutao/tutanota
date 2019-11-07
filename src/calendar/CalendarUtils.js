//@flow
import {getStartOfDay, getStartOfNextDay, incrementDate} from "../api/common/utils/DateUtils"
import {pad} from "../api/common/utils/StringUtils"
import type {EventTextTimeOptionEnum, RepeatPeriodEnum, ShareCapabilityEnum, WeekStartEnum} from "../api/common/TutanotaConstants"
import {
	defaultCalendarColor,
	EventTextTimeOption,
	getWeekStart,
	GroupType,
	ShareCapability,
	WeekStart
} from "../api/common/TutanotaConstants"
import {DateTime} from "luxon"
import {clone, neverNull} from "../api/common/utils/Utils"
import {createCalendarRepeatRule} from "../api/entities/tutanota/CalendarRepeatRule"
import {DAYS_SHIFTED_MS, generateEventElementId, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {lang} from "../misc/LanguageViewModel"
import {formatTime} from "../misc/Formatter"
import {size} from "../gui/size"
import {assertMainOrNode} from "../api/Env"
import {logins} from "../api/main/LoginController"
import {isSameId} from "../api/common/EntityFunctions"

assertMainOrNode()

export const CALENDAR_EVENT_HEIGHT = size.calendar_line_height + 2

export type CalendarMonthTimeRange = {
	start: Date,
	end: Date
}


export function eventStartsBefore(currentDate: Date, event: CalendarEvent): boolean {
	return getEventStart(event).getTime() < currentDate.getTime()
}

export function eventEndsAfterDay(currentDate: Date, event: CalendarEvent): boolean {
	return getEventEnd(event).getTime() > getStartOfNextDay(currentDate).getTime()
}

export function generateUid(event: CalendarEvent, timestamp: number): string {
	return `${neverNull(event._ownerGroup)}${timestamp}@tutanota.com`
}

/**
 * Accepts 2, 2:30, 2:5, 02:05, 02:30, 24:30
 */
export function parseTime(timeString: string): ?{hours: number, minutes: number} {
	const suffix = timeString.substr(-2).toUpperCase()
	if (suffix === "AM" || suffix === "PM") {
		timeString = timeString.slice(0, -2)
	}
	const parts = timeString.split(":")
	let hours = filterInt(parts[0])
	let minutes = 0
	if (parts.length === 2) {
		minutes = filterInt(parts[1])
	}
	if (isNaN(hours) || isNaN(minutes) || minutes > 59) {
		return null
	}
	if (suffix === "PM") {
		if (hours > 12) return null
		if (hours !== 12) hours = hours + 12
	} else if (suffix === "AM") {
		if (hours > 12) return null
		if (hours === 12) hours = 0
	} else if (hours > 23) {
		return null
	}
	return {hours, minutes}
}

export function filterInt(value: string) {
	if (/^\d+$/.test(value)) {
		return parseInt(value, 10);
	} else {
		return NaN;
	}
}


export function timeString(date: Date, amPm: boolean): string {
	return timeStringFromParts(date.getHours(), date.getMinutes(), amPm)
}

export function timeStringFromParts(hours: number, minutes: number, amPm: boolean): string {
	let minutesString = pad(minutes, 2)
	if (amPm) {
		if (hours === 0) {
			return `12:${minutesString}AM`
		} else if (hours === 12) {
			return `12:${minutesString}PM`
		} else if (hours > 12) {
			return `${hours - 12}:${minutesString}PM`
		} else {
			return `${hours}:${minutesString}AM`
		}
	} else {
		let hoursString = pad(hours, 2)
		return hoursString + ":" + minutesString
	}
}

export function shouldDefaultToAmPmTimeFormat(): boolean {
	return lang.code === "en"
}

export function getAllDayDateUTC(localDate: Date): Date {
	return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0))
}

export function getAllDayDateLocal(utcDate: Date, timeZone: string): Date {
	return DateTime.fromObject({
		year: utcDate.getUTCFullYear(),
		month: utcDate.getUTCMonth() + 1,
		day: utcDate.getUTCDate(),
		zone: timeZone
	}).toJSDate()
}


export function getMonth(date: Date): CalendarMonthTimeRange {
	const start = new Date(date)
	start.setDate(1)
	start.setHours(0, 0, 0, 0)
	const end = new Date(start)
	end.setMonth(start.getMonth() + 1)
	return {start, end}
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

export function isColorLight(c: string) {
	const rgb = parseInt(c, 16);   // convert rrggbb to decimal
	const r = (rgb >> 16) & 0xff;  // extract red
	const g = (rgb >> 8) & 0xff;  // extract green
	const b = (rgb >> 0) & 0xff;  // extract blue

	// Counting the perceptive luminance
	// human eye favors green color...
	const a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return (a < 0.5);
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
 * @param firstDayOfWeekFromSundayOffset
 * @return {{weeks: Array[], weekdays: Array}}
 */
export function getCalendarMonth(date: Date, firstDayOfWeekFromSundayOffset: number, weekdayNarrowFormat: boolean): CalendarMonth {
	const weeks = [[]]
	const calculationDate = getStartOfDay(date)
	calculationDate.setDate(1)
	let currentYear = calculationDate.getFullYear()
	let month = calculationDate.getMonth()
	// add "padding" days
	// getDay returns the day of the week (from 0 to 6) for the specified date (with first one being Sunday)

	let firstDay
	if (firstDayOfWeekFromSundayOffset > calculationDate.getDay()) {
		firstDay = (calculationDate.getDay() + 7) - firstDayOfWeekFromSundayOffset
	} else {
		firstDay = calculationDate.getDay() - firstDayOfWeekFromSundayOffset
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
	incrementDate(weekdaysDate, -weekdaysDate.getDay() + firstDayOfWeekFromSundayOffset)// get first day of week
	for (let i = 0; i < 7; i++) {
		weekdays.push(weekdayNarrowFormat ? lang.formats.weekdayNarrow.format(weekdaysDate) : lang.formats.weekdayShort.format(weekdaysDate))
		incrementDate(weekdaysDate, 1)
	}
	return {
		weekdays,
		weeks
	}
}

export function layOutEvents(events: Array<CalendarEvent>, renderer: (columns: Array<Array<CalendarEvent>>) => ChildArray, handleAsAllDay: boolean): ChildArray {
	events.sort((e1, e2) => {
		if (getEventStart(e1) < getEventStart(e2)) return -1;
		if (getEventStart(e1) > getEventStart(e2)) return 1;
		if (getEventEnd(e1) < getEventEnd(e2)) return -1;
		if (getEventEnd(e1) > getEventEnd(e2)) return 1;
		return 0;
	})
	let lastEventEnding = null
	let columns: Array<Array<CalendarEvent>> = []
	const children = []
	events.forEach((e) => {
		const calcEvent = getCalculationEvent(e, handleAsAllDay)

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
			var col = columns[i]
			const lastEvent = getCalculationEvent(col[col.length - 1], handleAsAllDay)
			if (!collidesWith(lastEvent, calcEvent)) {
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


function getCalculationEvent(event: CalendarEvent, handleAsAllDay: boolean): CalendarEvent {
	const timeZone = getTimeZone()
	if (handleAsAllDay) {
		const calcDate = clone(event)
		if (isAllDayEvent(event)) {
			calcDate.startTime = getAllDayDateLocal(event.startTime, timeZone)
			calcDate.endTime = getAllDayDateLocal(event.endTime, timeZone)
		} else {
			calcDate.startTime = getStartOfDay(event.startTime)
			calcDate.endTime = getStartOfNextDay(event.endTime)
		}
		return calcDate
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

export function getCalendarName(name: ?string): string {
	return name || lang.get("privateCalendar_label")
}

export function getEventColor(event: CalendarEvent, groupColors: {[Id]: string}): string {
	return groupColors[neverNull(event._ownerGroup)] || defaultCalendarColor
}

export function getStartOfWeek(date: Date, firstDayOfWeekFromSundayOffset: number): Date {
	let firstDay
	if (firstDayOfWeekFromSundayOffset > date.getDay()) {
		firstDay = (date.getDay() + 7) - firstDayOfWeekFromSundayOffset
	} else {
		firstDay = date.getDay() - firstDayOfWeekFromSundayOffset
	}
	return incrementDate(new Date(date), -firstDay)
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


export function getEventEnd(event: CalendarEvent): Date {
	if (isAllDayEvent(event)) {
		return getAllDayDateLocal(event.endTime, getTimeZone())
	} else {
		return event.endTime
	}
}

export function getEventStart(event: CalendarEvent): Date {
	if (isAllDayEvent(event)) {
		return getAllDayDateLocal(event.startTime, getTimeZone())
	} else {
		return event.startTime
	}
}

export function isLongEvent(event: CalendarEvent): boolean {
	return getEventEnd(event).getTime() - getEventStart(event).getTime() > DAYS_SHIFTED_MS
}

export function createEventId(event: CalendarEvent, groupRoot: CalendarGroupRoot): void {
	const listId = event.repeatRule || isLongEvent(event) ? groupRoot.longEvents : groupRoot.shortEvents
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