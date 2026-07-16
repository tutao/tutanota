import { CalendarEventDateTimeFields, CalendarEventTimeZones, getAllDayDateLocal, isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { EventTextTimeOption } from "@tutao/app-env"
import { assert, isSameDay, isSameDayOfDate } from "@tutao/utils"
import { formatDateTime, formatDateWithMonth, formatTime } from "../../../../ui/utils/Formatter"
import { DateTime } from "luxon"
import { eventEndsAfterDay, eventStartsBefore, getEndOfDayWithZone } from "../../../common/calendar/date/CalendarUtils"

function includeStartTime(showTime: EventTextTimeOption) {
	return showTime === EventTextTimeOption.START_TIME || showTime === EventTextTimeOption.START_END_TIME
}

function includeEndTime(showTime: EventTextTimeOption) {
	return showTime === EventTextTimeOption.END_TIME || showTime === EventTextTimeOption.START_END_TIME
}

function resolveStartTimeZone(event: CalendarEventTimeZones, calendarTimeZone: string) {
	return event.startTimeZone ?? calendarTimeZone
}

function resolveEndTimeZone(event: CalendarEventTimeZones, calendarTimeZone: string) {
	return event.endTimeZone ?? event.startTimeZone ?? calendarTimeZone
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

export function formatEventDuration(event: CalendarEventDateTimeFields, calendarTimeZone: string, includeTimezone: boolean): string {
	let result = ""
	if (isAllDayEvent(event)) {
		// To format the start and end date we need to convert to local time zone (and not the calendar timeZone)
		// in order to use Intl.DateTimeFormat
		const startTime = getAllDayDateLocal(event.startTime)
		const endTime = new Date(event.endTime.getUTCFullYear(), event.endTime.getUTCMonth(), event.endTime.getUTCDate() - 1)

		result += lang.get("allDay_label") + ", " + formatDateWithMonth(startTime)
		if (!isSameDayOfDate(startTime, endTime)) {
			result += " - " + formatDateWithMonth(endTime)
		}
	} else {
		const startTimeZone = includeTimezone ? resolveStartTimeZone(event, calendarTimeZone) : calendarTimeZone
		const endTimeZone = includeTimezone ? resolveEndTimeZone(event, calendarTimeZone) : calendarTimeZone

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

export function formatTimeWithZoneInfo(event: CalendarEventDateTimeFields, showTime: EventTextTimeOption, calendarTimeZone: string) {
	const startTimeZone = resolveStartTimeZone(event, calendarTimeZone)

	let result = ""
	let timeZoneIsInResult = false
	if (includeStartTime(showTime)) {
		result += getTimeZoneShortName(startTimeZone) + " " + formatTime(event.startTime, startTimeZone)
		timeZoneIsInResult = true
	}
	if (includeEndTime(showTime)) {
		const endTimeZone = resolveEndTimeZone(event, calendarTimeZone)

		result += " - "
		if (!timeZoneIsInResult || startTimeZone !== endTimeZone) {
			result += getTimeZoneShortName(endTimeZone) + " "
		}
		result += formatTime(event.endTime, endTimeZone)
	}
	return result
}

export function formatEventTime(event: CalendarEventDateTimeFields, showTime: EventTextTimeOption, includeTimeZone: boolean, calendarTimeZone: string): string {
	let result = ""
	if (includeStartTime(showTime)) {
		result += formatTime(event.startTime, calendarTimeZone)
	}
	if (includeEndTime(showTime)) {
		result += " - " + formatTime(event.endTime, calendarTimeZone)
	}
	if (includeTimeZone) {
		result += " (" + formatTimeWithZoneInfo(event, showTime, calendarTimeZone) + ")"
	}
	return result
}

export function formatEventTimesAtDate(day: Date, event: CalendarEventDateTimeFields, calendarTimeZone: string): string {
	if (isAllDayEvent(event)) {
		return lang.get("allDay_label")
	}

	const startsBefore = eventStartsBefore(day, calendarTimeZone, event)
	const endsAfter = eventEndsAfterDay(day, calendarTimeZone, event)
	if (startsBefore && endsAfter) {
		return lang.get("allDay_label")
	}

	const eventBoundedWithinDay = {
		startTime: startsBefore ? day : event.startTime,
		endTime: endsAfter ? getEndOfDayWithZone(day, calendarTimeZone) : event.endTime,
		startTimeZone: startsBefore ? event.endTimeZone : event.startTimeZone,
		endTimeZone: endsAfter ? event.startTimeZone : event.endTimeZone,
	}
	return formatEventTime(eventBoundedWithinDay, EventTextTimeOption.START_END_TIME, false, calendarTimeZone)
}

export function shouldShowTimeZones(event: CalendarEventTimeZones, calendarTimeZone: string) {
	return resolveStartTimeZone(event, calendarTimeZone) !== calendarTimeZone || resolveEndTimeZone(event, calendarTimeZone) !== calendarTimeZone
}
