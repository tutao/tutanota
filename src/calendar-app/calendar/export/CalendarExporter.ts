import type { CalendarAttendeeStatus, CalendarMethod } from "../../../common/api/common/TutanotaConstants"
import { assertEnumValue, EndType, RepeatPeriod, SECOND_MS } from "../../../common/api/common/TutanotaConstants"
import { assertNotNull, downcast, incrementDate, mapAndFilterNull, neverNull, pad, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { calendarAttendeeStatusToParstat, iCalReplacements, repeatPeriodToIcalFrequency } from "./CalendarParser"
import { getAllDayDateLocal, isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { AlarmIntervalUnit, generateUid, getTimeZone, parseAlarmInterval } from "../../../common/calendar/date/CalendarUtils"
import type { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { createFile } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { convertToDataFile, DataFile } from "../../../common/api/common/DataFile"
import type { DateWrapper, RepeatRule, UserAlarmInfo } from "../../../common/api/entities/sys/TypeRefs.js"
import { DateTime } from "luxon"
import { getLetId } from "../../../common/api/common/utils/EntityUtils"
import { CALENDAR_MIME_TYPE } from "../../../common/file/FileController.js"

/** create an ical data file that can be attached to an invitation/update/cancellation/response mail */
export function makeInvitationCalendarFile(event: CalendarEvent, method: CalendarMethod, now: Date, zone: string): DataFile {
	const stringValue = makeInvitationCalendar(env.versionNumber, event, method, now, zone)
	const data = stringToUtf8Uint8Array(stringValue)
	const date = new Date()
	const tmpFile = createFile({
		name: `${method.toLowerCase()}-${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}.ics`,
		mimeType: CALENDAR_MIME_TYPE,
		size: String(data.byteLength),
		cid: null,
		blobs: [],
		parent: null,
		subFiles: null,
	})
	return convertToDataFile(tmpFile, data)
}

/** serialize a list of events into a valid ical string using the PUBLISH method suitable to import as a calendar into any app supporting ical */
export function serializeCalendar(
	versionNumber: string,
	events: Array<{
		event: CalendarEvent
		alarms: Array<UserAlarmInfo>
	}>,
	now: Date,
	zone: string,
): string {
	return wrapIntoCalendar(versionNumber, "PUBLISH", events.map(({ event, alarms }) => serializeEvent(event, alarms, now, zone)).flat())
}

//
// end of the public interface for calendar invites/import/export, everything below this is exported for testing.
//

/** importer internals exported for testing, should always be used through serializeCalendar */
export function serializeEvent(event: CalendarEvent, alarms: Array<UserAlarmInfo>, now: Date, timeZone: string): Array<string> {
	const repeatRule = event.repeatRule
	const isAllDay = isAllDayEvent(event)
	const localZone = getTimeZone()
	let dateStart, dateEnd

	if (isAllDay) {
		// We use local zone because we convert UTC time to local first so to convert it back we need to use the right one.
		// It will not affect times in case of all-day event anyway
		dateStart = `DTSTART;VALUE=DATE:${formatDate(getAllDayDateLocal(event.startTime), localZone)}`
		dateEnd = `DTEND;VALUE=DATE:${formatDate(getAllDayDateLocal(event.endTime), localZone)}`
	} else if (repeatRule) {
		dateStart = `DTSTART;TZID=${repeatRule.timeZone}:${formatDateTime(event.startTime, repeatRule.timeZone)}`
		dateEnd = `DTEND;TZID=${repeatRule.timeZone}:${formatDateTime(event.endTime, repeatRule.timeZone)}`
	} else {
		dateStart = `DTSTART:${formatDateTimeUTC(event.startTime)}`
		dateEnd = `DTEND:${formatDateTimeUTC(event.endTime)}`
	}

	return [
		"BEGIN:VEVENT",
		dateStart,
		dateEnd,
		`DTSTAMP:${formatDateTimeUTC(now)}`,
		`UID:${event.uid ? event.uid : generateUid(assertNotNull(event._ownerGroup), now.getTime())}`, // legacy: only generate uid for older calendar events.
		`SEQUENCE:${event.sequence}`,
		`SUMMARY:${serializeIcalText(event.summary)}`,
	]
		.concat(
			event.recurrenceId != null
				? isAllDay
					? `RECURRENCE-ID;VALUE=DATE:${formatDate(getAllDayDateLocal(event.recurrenceId), localZone)}`
					: `RECURRENCE-ID;VALUE=DATETIME:${formatDateTimeUTC(event.recurrenceId)}`
				: [],
		)
		.concat(event.description && event.description !== "" ? `DESCRIPTION:${serializeIcalText(event.description)}` : [])
		.concat(event.recurrenceId == null ? serializeRepeatRule(repeatRule, isAllDay, timeZone) : [])
		.concat(event.location && event.location.length > 0 ? `LOCATION:${serializeIcalText(event.location)}` : [])
		.concat(
			...mapAndFilterNull(alarms, (alarm) => {
				try {
					return serializeAlarm(event, alarm)
				} catch (e) {
					console.log(`error serializing alarm ${getLetId(alarm).toString()} for event ${getLetId(event).toString()}:`, e)
					return null
				}
			}),
		)
		.concat(serializeParticipants(event))
		.concat("END:VEVENT")
}

/** importer internals exported for testing */
export function serializeRepeatRule(repeatRule: RepeatRule | null, isAllDayEvent: boolean, localTimeZone: string) {
	if (repeatRule) {
		let endType = ""

		if (repeatRule.endType === EndType.Count) {
			endType = `;COUNT=${neverNull(repeatRule.endValue)}`
		} else if (repeatRule.endType === EndType.UntilDate) {
			// According to the RFC 5545 section 3.3.5
			//  The UNTIL rule part defines a DATE or DATE-TIME value that bounds
			//  the recurrence rule in an inclusive manner.  If the value
			//  specified by UNTIL is synchronized with the specified recurrence,
			//  this DATE or DATE-TIME becomes the last instance of the
			//  recurrence.  The value of the UNTIL rule part MUST have the same
			//  value type as the "DTSTART" property.  Furthermore, if the
			//  "DTSTART" property is specified as a date with local time, then
			//  the UNTIL rule part MUST also be specified as a date with local
			//  time.  If the "DTSTART" property is specified as a date with UTC
			//  time or a date with local time and time zone reference, then the
			//  UNTIL rule part MUST be specified as a date with UTC time.
			// We have three cases (check serializeEvent()).
			// So our matrix wil be:
			//
			// Case       | start/end format | UNTIL format
			// All-day:   | date             | date
			// w/RR       | TZID + DateTime  | timestamp
			// w/o/RR     | timestamp        | N/A
			//
			// In this branch there is a repeat rule and we just check if it's all day.
			// We also differ in a way that we define end as exclusive (because it's so
			// hard to find anything in this RFC).
			const date = new Date(Number(repeatRule.endValue))
			const value = isAllDayEvent ? formatDate(incrementDate(date, -1), localTimeZone) : formatDateTimeUTC(new Date(date.getTime() - SECOND_MS))
			endType = `;UNTIL=${value}`
		}

		const excludedDates = serializeExcludedDates(repeatRule.excludedDates, repeatRule.timeZone)
		return [
			`RRULE:FREQ=${repeatPeriodToIcalFrequency(assertEnumValue(RepeatPeriod, repeatRule.frequency))}` + `;INTERVAL=${repeatRule.interval}` + endType,
		].concat(excludedDates)
	} else {
		return []
	}
}

/** importer internals exported for testing */
export function serializeExcludedDates(excludedDates: DateWrapper[], timeZone: string): string[] {
	if (excludedDates.length > 0) {
		let dates = ""
		for (let i = 0; i < excludedDates.length; i++) {
			dates += formatDateTime(excludedDates[i].date, timeZone)
			if (i < excludedDates.length - 1) {
				dates += ","
			}
		}
		return [`EXDATE;TZID=${timeZone}:${dates}`]
	} else {
		return []
	}
}

/** importer internals exported for testing */
export function formatDateTimeUTC(date: Date): string {
	return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(
		date.getUTCSeconds(),
	)}Z`
}

function formatDateTime(date: Date, timeZone: string): string {
	const dateTime = DateTime.fromJSDate(date, {
		zone: timeZone,
	})
	return `${dateTime.year}${pad2(dateTime.month)}${pad2(dateTime.day)}T${pad2(dateTime.hour)}${pad2(dateTime.minute)}${pad2(dateTime.second)}`
}

function formatDate(date: Date, timeZone: string): string {
	const dateTime = DateTime.fromJSDate(date, {
		zone: timeZone,
	})
	return `${dateTime.year}${pad2(dateTime.month)}${pad2(dateTime.day)}`
}

function makeInvitationCalendar(versionNumber: string, event: CalendarEvent, method: string, now: Date, zone: string): string {
	const eventSerialized = serializeEvent(event, [], now, zone)
	return wrapIntoCalendar(versionNumber, method, eventSerialized)
}

export function serializeTrigger(dbAlarmInterval: string): string {
	const alarmInterval = parseAlarmInterval(dbAlarmInterval)

	let timeMarker = ""

	if (alarmInterval.unit === AlarmIntervalUnit.MINUTE || alarmInterval.unit === AlarmIntervalUnit.HOUR) {
		timeMarker += "T"
	}

	return "-P" + timeMarker + alarmInterval.value.toString() + alarmInterval.unit
}

function serializeParticipants(event: CalendarEvent): Array<string> {
	const { organizer, attendees } = event

	if (attendees.length === 0 && organizer == null) {
		return []
	}

	const lines: string[] = []

	if (organizer) {
		const namePart = organizer.name ? `;CN=${quotedString(organizer.name)}` : ""
		lines.push(`ORGANIZER${namePart};EMAIL=${organizer.address}:mailto:${organizer.address}`)
	}

	const attendeesProperties = attendees.map(({ address, status }) => {
		const namePart = address.name ? `;CN=${quotedString(address.name)}` : ""
		const partstat = calendarAttendeeStatusToParstat[downcast<CalendarAttendeeStatus>(status)]
		return (
			`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=${partstat}` + `;RSVP=TRUE${namePart};EMAIL=${address.address}:mailto:${address.address}`
		)
	})
	return lines.concat(attendeesProperties)
}

/**
 * Create an ical quoted-string param-value
 * double quotes are not allowed inside of param-value properties so they are removed
 */
function quotedString(input: string): string {
	return `"${input.replace(/"/g, "")}"`
}

/**
 * Serialize text properties according to the iCal standard.
 * https://icalendar.org/iCalendar-RFC-5545/3-3-11-text.html
 */
function serializeIcalText(value: string): string {
	let text = value
	for (const rawEscape in iCalReplacements) {
		text = text.replaceAll(rawEscape, iCalReplacements[rawEscape as keyof typeof iCalReplacements])
	}
	return text
}

function pad2(number: number) {
	return pad(number, 2)
}

function wrapIntoCalendar(versionNumber: string, method: string, contents: Array<string>): string {
	let value = ["BEGIN:VCALENDAR", `PRODID:-//Tutao GmbH//Tutanota ${versionNumber}//EN`, "VERSION:2.0", "CALSCALE:GREGORIAN", `METHOD:${method}`]
	value.push(...contents)
	value.push("END:VCALENDAR")
	return value.join("\r\n")
}

function serializeAlarm(event: CalendarEvent, alarm: UserAlarmInfo): Array<string> {
	// prettier-ignore
	return [
		"BEGIN:VALARM",
		"ACTION:DISPLAY",
		"DESCRIPTION:This is an event reminder",
		`TRIGGER:${serializeTrigger(alarm.alarmInfo.trigger)}`,
		"END:VALARM",
	]
}
