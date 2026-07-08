import { CalendarEventTimes, isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import {
	eventEndsAfterDay,
	eventStartsBefore,
	getEndOfDayWithZone,
	getEventEnd,
	getEventStart,
	incrementByRepeatPeriod,
} from "../../../common/calendar/date/CalendarUtils"
import { EventTextTimeOption, RepeatPeriod } from "@tutao/app-env"
import { assert, isSameDay, isSameDayOfDate } from "@tutao/utils"
import { formatDateTime, formatDateWithMonth, formatTime } from "../../../../ui/utils/Formatter"
import { DateTime } from "luxon"

export type TextFormatterTimezones = {
	startTimeZone?: string
	endTimeZone?: string
	calendarTimeZone: string
}

function includeStartTime(showTime: EventTextTimeOption) {
	return showTime === EventTextTimeOption.START_TIME || showTime === EventTextTimeOption.START_END_TIME
}

function includeEndTime(showTime: EventTextTimeOption) {
	return showTime === EventTextTimeOption.END_TIME || showTime === EventTextTimeOption.START_END_TIME
}

function resolveStartAndEntTimeZone(timeZones: TextFormatterTimezones) {
	const startTimeZone = timeZones.startTimeZone ?? timeZones.calendarTimeZone
	const endTimeZone = timeZones.endTimeZone ?? startTimeZone
	return [startTimeZone, endTimeZone]
}

export function getTimeZoneName(timeZone: string) {
	return timeZone.replaceAll("_", " ")
}

export function getTimeZoneShortName(timeZone: string) {
	const name = getTimeZoneName(timeZone)
	const lastSlashPosition = name.lastIndexOf("/")
	if (lastSlashPosition === -1) {
		return name
	}
	let shortName = name.slice(lastSlashPosition + 1)
	if (name.slice(0, lastSlashPosition) === "Etc" && shortName.slice(0, 3) === "GMT") {
		// 'Etc/GMT[+-]<offset>' time zones are specified in an old POSIX standard.
		// In this standard the sign of the offset is the inverse of what you'd expect,
		// so we need to invert it
		const sign = shortName[3]
		if (sign === "+") {
			shortName = "GMT-" + shortName.slice(4)
		} else if (sign === "-") {
			shortName = "GMT+" + shortName.slice(4)
		}
	}
	return shortName
}

/**
 * The full name for the time zone offset.
 *
 * For example, "Central European Standard Time" or "Central European Summer Time" (depending on daylight saving)
 * will be returned for many central european time zones.
 */
export function getTimeZoneOffsetLongName(dateTime: DateTime, timeZone: string) {
	assert(dateTime.isValid, "getTimeZoneOffsetLongName expects a valid date time!")

	const dateTimeInTimeZone = dateTime.setZone(timeZone)
	assert(dateTimeInTimeZone.isValid, `Invalid time zone = "${timeZone}" passed to getTimeZoneOffsetLongName!`)

	return dateTimeInTimeZone.offsetNameLong ?? ""
}

/** Builds the offset string 'GMT+HH[:MM]' or 'GMT-HH[:MM]' for a datetime in a time zone. */
export function getTimeZoneGmtOffset(dateTime: DateTime, timeZone: string) {
	assert(dateTime.isValid, "getTimeZoneGmtOffset expects a valid date time!")

	const dateTimeInTimeZone = dateTime.setZone(timeZone)
	assert(dateTimeInTimeZone.isValid, `Invalid time zone = "${timeZone}" passed to getTimeZoneGmtOffset!`)

	let offsetInMinutes = dateTimeInTimeZone.offset
	assert(!Number.isNaN(offsetInMinutes), "Unexpected NaN date time offset!")

	let result = "GMT"
	if (offsetInMinutes < 0) {
		offsetInMinutes = -offsetInMinutes
		result += "-"
	} else {
		result += "+"
	}

	const hours = Math.floor(offsetInMinutes / 60)
	const minutes = offsetInMinutes % 60

	result += hours.toString()
	if (minutes) {
		result += ":" + minutes.toString().padStart(2, "0")
	}

	return result
}

export function formatEventDuration(event: CalendarEventTimes, formatterTimezones: TextFormatterTimezones, includeTimezone: boolean): string {
	let result = ""
	if (isAllDayEvent(event)) {
		const calendarTimeZone = formatterTimezones.calendarTimeZone

		const startTime = getEventStart(event, calendarTimeZone)
		const endTime = incrementByRepeatPeriod(getEventEnd(event, calendarTimeZone), RepeatPeriod.DAILY, -1, calendarTimeZone)

		result += lang.get("allDay_label") + ", " + formatDateWithMonth(startTime)
		if (!isSameDayOfDate(startTime, endTime)) {
			result += " - " + formatDateWithMonth(endTime)
		}
	} else {
		const [startTimeZone, endTimeZone] = resolveStartAndEntTimeZone(formatterTimezones)

		result += formatDateTime(event.startTime, startTimeZone)
		if (includeTimezone) {
			result += " (" + getTimeZoneShortName(startTimeZone) + ")"
		}
		result += " - "
		if (isSameDay(event.startTime, event.endTime)) {
			result += formatTime(event.endTime, endTimeZone)
		} else {
			result += formatDateTime(event.endTime, endTimeZone)
		}
		if (includeTimezone) {
			result += " (" + getTimeZoneShortName(endTimeZone) + ")"
		}
	}
	return result
}

export function formatTimeWithZoneInfo({ endTime, startTime }: CalendarEventTimes, showTime: EventTextTimeOption, formatterTimezones: TextFormatterTimezones) {
	const [startTimeZone, endTimeZone] = resolveStartAndEntTimeZone(formatterTimezones)

	let result = ""
	let timeZoneIsInResult = false
	if (includeStartTime(showTime)) {
		result += getTimeZoneShortName(startTimeZone) + " " + formatTime(startTime, startTimeZone)
		timeZoneIsInResult = true
	}
	if (includeEndTime(showTime)) {
		result += " - "
		if (!timeZoneIsInResult || startTimeZone !== endTimeZone) {
			result += getTimeZoneShortName(endTimeZone) + " "
		}
		result += formatTime(endTime, endTimeZone)
	}
	return result
}

export function formatEventTime(
	{ endTime, startTime }: CalendarEventTimes,
	showTime: EventTextTimeOption,
	includeTimeZone: boolean,
	formatterTimezones: TextFormatterTimezones,
): string {
	let result = ""
	if (includeStartTime(showTime)) {
		result += formatTime(startTime)
	}
	if (includeEndTime(showTime)) {
		result += " - " + formatTime(endTime)
	}
	if (includeTimeZone) {
		result += " (" + formatTimeWithZoneInfo({ endTime, startTime }, showTime, formatterTimezones) + ")"
	}
	return result
}

export function formatEventTimesAtDate(day: Date, event: CalendarEvent, includeTimeZone: boolean, formatterTimezones: TextFormatterTimezones): string {
	if (isAllDayEvent(event)) {
		return lang.get("allDay_label")
	} else {
		const startsBefore = eventStartsBefore(day, formatterTimezones.calendarTimeZone, event)
		const endsAfter = eventEndsAfterDay(day, formatterTimezones.calendarTimeZone, event)
		if (startsBefore && endsAfter) {
			return lang.get("allDay_label")
		} else {
			const startTime: Date = startsBefore ? day : event.startTime
			const endTime: Date = endsAfter ? getEndOfDayWithZone(day, formatterTimezones.calendarTimeZone) : event.endTime
			return formatEventTime({ startTime, endTime }, EventTextTimeOption.START_END_TIME, includeTimeZone, formatterTimezones)
		}
	}
}

export function shouldShowTimeZones(calendarTimeZone: string, startTimeZone: string | null, endTimeZone: string | null) {
	if (startTimeZone === null && endTimeZone === null) {
		return false
	}

	if (startTimeZone !== null && startTimeZone === calendarTimeZone && endTimeZone === null) {
		return false
	}

	if (endTimeZone !== null && endTimeZone === calendarTimeZone && startTimeZone === null) {
		return false
	}

	if (startTimeZone === endTimeZone && startTimeZone === calendarTimeZone) {
		return false
	}

	return true
}

export function getTextFormatterTimeZones(event: Omit<CalendarEvent, "description">, calendarTimeZone: string) {
	const timeZones: TextFormatterTimezones = {
		calendarTimeZone,
	}
	if (event.startTimeZone) {
		timeZones.startTimeZone = event.startTimeZone
	}
	if (event.endTimeZone) {
		timeZones.endTimeZone = event.endTimeZone
	}

	return timeZones
}
