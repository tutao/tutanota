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
import { EventTextTimeOption, ProgrammingError, RepeatPeriod } from "@tutao/app-env"
import { isSameDay, isSameDayOfDate } from "@tutao/utils"
import { formatDateTime, formatDateWithMonth, formatTime } from "../../../../ui/utils/Formatter"

export type TextFormatterTimezones = {
	startTimeZone?: string
	endTimeZone?: string
	calendarTimeZone: string
}

function formatAllDayDurationText(event: CalendarEventTimes, startTimeZone: string, endTimeZone: string) {
	const startTime = getEventStart(event, startTimeZone)
	const startString = formatDateWithMonth(startTime)
	const endTime = incrementByRepeatPeriod(getEventEnd(event, endTimeZone), RepeatPeriod.DAILY, -1, endTimeZone)

	if (isSameDayOfDate(startTime, endTime)) {
		return `${lang.get("allDay_label")}, ${startString}`
	} else {
		return `${lang.get("allDay_label")}, ${startString} - ${formatDateWithMonth(endTime)}`
	}
}

function formatNormalEventDurationText(event: CalendarEventTimes, includeTimezone: boolean, startTimeZone: string, endTimeZone: string) {
	const startAndEndIsSameDay = isSameDay(event.startTime, event.endTime)

	const startString = formatDateTime(event.startTime, startTimeZone)

	let endString = startAndEndIsSameDay ? formatTime(event.endTime, endTimeZone) : formatDateTime(event.endTime, endTimeZone)

	// IANA always has a / in it so we can use ! here
	const startZoneFormatted = "(" + startTimeZone.split("/").at(-1)!.replace("_", " ") + ")"
	const endZoneFormatted = "(" + endTimeZone.split("/").at(-1)!.replace("_", " ") + ")"

	return `${startString} ${includeTimezone ? startZoneFormatted : ""} - ${endString} ${includeTimezone ? endZoneFormatted : ""}`
}

export function formatEventDuration(
	event: CalendarEventTimes,
	{ startTimeZone, endTimeZone, calendarTimeZone }: TextFormatterTimezones,
	includeTimezone: boolean,
): string {
	if (isAllDayEvent(event)) {
		return formatAllDayDurationText(event, calendarTimeZone, calendarTimeZone)
	} else {
		return formatNormalEventDurationText(event, includeTimezone, startTimeZone ?? calendarTimeZone, endTimeZone ?? startTimeZone ?? calendarTimeZone)
	}
}

export function formatTimeWithZoneInfo({ endTime, startTime }: CalendarEventTimes, showTime: EventTextTimeOption, formatterTimezones: TextFormatterTimezones) {
	const startTimeZone = formatterTimezones.startTimeZone ?? formatterTimezones.calendarTimeZone
	const startTimezoneCity = startTimeZone.split("/").at(-1)!.replaceAll("_", " ")

	const endTimeZone = formatterTimezones.endTimeZone ?? startTimeZone
	const endTimezoneCity = endTimeZone.split("/").at(-1)!.replaceAll("_", " ")

	const isSameTimeZone = startTimeZone === endTimeZone

	const startTimeText = `${startTimezoneCity} ${formatTime(startTime, startTimeZone)}`
	const endTimeText = `${isSameTimeZone && showTime !== EventTextTimeOption.END_TIME ? "" : ` ${endTimezoneCity}`} ${formatTime(endTime, endTimeZone)}`

	switch (showTime) {
		case EventTextTimeOption.START_TIME:
			return startTimeText

		case EventTextTimeOption.END_TIME:
			return ` - ${endTimeText}`

		case EventTextTimeOption.START_END_TIME:
			return `${startTimeText} - ${endTimeText}`
	}
}

export function formatEventTime(
	{ endTime, startTime }: CalendarEventTimes,
	showTime: EventTextTimeOption,
	includeTimeZone: boolean,
	formatterTimezones: TextFormatterTimezones,
): string {
	const timeZoneInfo = includeTimeZone ? ` (${formatTimeWithZoneInfo({ endTime, startTime }, showTime, formatterTimezones)})` : ""

	switch (showTime) {
		case EventTextTimeOption.START_TIME:
			return formatTime(startTime) + timeZoneInfo

		case EventTextTimeOption.END_TIME:
			return ` - ${formatTime(endTime)} ${timeZoneInfo}`

		case EventTextTimeOption.START_END_TIME:
			return `${formatTime(startTime)} - ${formatTime(endTime)}` + timeZoneInfo

		default:
			throw new ProgrammingError(`Unknown time option: ${showTime}`)
	}
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

export function getTimeZoneLongName(date: Date, timeZone: string) {
	const dateTimeFormat = new Intl.DateTimeFormat(lang.languageTag, { timeZoneName: "long", timeZone })

	let longName = ""
	for (const part of dateTimeFormat.formatToParts(date)) {
		if (part.type === "timeZoneName") {
			longName = part.value
		}
	}
	return longName
}

export function getTimeZoneOffset(date: Date, timeZone: string) {
	const dateTimeFormat = new Intl.DateTimeFormat(lang.languageTag, { timeZoneName: "short", timeZone })
	let offsetString = ""
	for (const part of dateTimeFormat.formatToParts(date)) {
		if (part.type === "timeZoneName") {
			offsetString = part.value
		}
	}
	return offsetString
}
