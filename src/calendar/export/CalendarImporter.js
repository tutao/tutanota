//@flow
import type {AlarmIntervalEnum, CalendarAttendeeStatusEnum, CalendarMethodEnum} from "../../api/common/TutanotaConstants"
import {AlarmInterval, EndType, SECOND_MS} from "../../api/common/TutanotaConstants"
import {stringToUtf8Uint8Array, utf8Uint8ArrayToString} from "../../api/common/utils/Encoding"
import {calendarAttendeeStatusToParstat, iCalReplacements, parseCalendarEvents, parseICalendar, tutaToIcalFrequency} from "./CalendarParser"
import {getAllDayDateLocal, isAllDayEvent} from "../../api/common/utils/CommonCalendarUtils"
import {generateUid, getTimeZone} from "../date/CalendarUtils"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {createFile} from "../../api/entities/tutanota/File"
import {convertToDataFile} from "../../api/common/DataFile"
import {pad} from "../../api/common/utils/StringUtils"
import {assertNotNull, downcast, neverNull} from "../../api/common/utils/Utils"
import type {UserAlarmInfo} from "../../api/entities/sys/UserAlarmInfo"
import {ParserError} from "../../misc/parsing/ParserCombinator"
import {incrementDate} from "../../api/common/utils/DateUtils"
import {flat, mapAndFilterNull} from "../../api/common/utils/ArrayUtils"
import {DateTime} from "luxon"
import type {AlarmInfo} from "../../api/entities/sys/AlarmInfo"
import type {RepeatRule} from "../../api/entities/sys/RepeatRule"
import {CALENDAR_MIME_TYPE} from "../../file/FileController"
import {getLetId} from "../../api/common/utils/EntityUtils"

export type ParsedCalendarData = {method: string, contents: Array<{event: CalendarEvent, alarms: Array<AlarmInfo>}>}

export function parseCalendarFile(file: DataFile): ParsedCalendarData {
	try {
		const stringData = utf8Uint8ArrayToString(file.data)
		return parseCalendarStringData(stringData, getTimeZone())
	} catch (e) {
		if (e instanceof ParserError) {
			throw new ParserError(e.message, file.name)
		} else {
			throw e
		}
	}
}

export function parseCalendarStringData(value: string, zone: string): ParsedCalendarData {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree, zone)
}

export function makeInvitationCalendar(versionNumber: string, event: CalendarEvent, method: string, now: Date, zone: string): string {
	const eventSerialized = serializeEvent(event, [], now, zone)
	return wrapIntoCalendar(versionNumber, method, eventSerialized)
}


export function makeInvitationCalendarFile(event: CalendarEvent, method: CalendarMethodEnum, now: Date, zone: string): DataFile {
	const stringValue = makeInvitationCalendar(env.versionNumber, event, method, now, zone)
	const data = stringToUtf8Uint8Array(stringValue)
	const tmpFile = createFile()
	const date = new Date()
	tmpFile.name = `${method.toLowerCase()}-${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}.ics`
	tmpFile.mimeType = CALENDAR_MIME_TYPE
	tmpFile.size = String(data.byteLength)
	return convertToDataFile(tmpFile, data)
}

function wrapIntoCalendar(versionNumber: string, method: string, contents: Array<string>): string {
	let value = [
		"BEGIN:VCALENDAR",
		`PRODID:-//Tutao GmbH//Tutanota ${versionNumber}//EN`,
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		`METHOD:${method}`,
	]
	value.push(...contents)
	value.push("END:VCALENDAR")

	return value.join("\r\n")
}

export function serializeCalendar(
	versionNumber: string,
	events: Array<{event: CalendarEvent, alarms: Array<UserAlarmInfo>}>,
	now: Date,
	zone: string,
): string {
	return wrapIntoCalendar(versionNumber, "PUBLISH", flat(events.map(({event, alarms}) => serializeEvent(event, alarms, now, zone))))
}

function serializeRepeatRule(repeatRule: ?RepeatRule, isAllDayEvent: boolean, localTimeZone: string) {
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
			const value = isAllDayEvent
				? formatDate(incrementDate(date, -1), localTimeZone)
				: formatDateTimeUTC(new Date(date.getTime() - SECOND_MS))
			endType = `;UNTIL=${value}`
		}
		return [
			`RRULE:FREQ=${tutaToIcalFrequency[downcast(repeatRule.frequency)]}` +
			`;INTERVAL=${repeatRule.interval}` +
			endType
		]
	} else {
		return []
	}
}

function serializeTrigger(alarmInterval: AlarmIntervalEnum): string {
	switch (alarmInterval) {
		case AlarmInterval.FIVE_MINUTES:
			return "-PT05M"
		case AlarmInterval.TEN_MINUTES:
			return "-PT10M"
		case AlarmInterval.THIRTY_MINUTES:
			return "-PT30M"
		case AlarmInterval.ONE_HOUR:
			return "-PT01H"
		case AlarmInterval.ONE_DAY:
			return "-P1D"
		case AlarmInterval.TWO_DAYS:
			return "-P2D"
		case AlarmInterval.THREE_DAYS:
			return "-P3D"
		case AlarmInterval.ONE_WEEK:
			return "-P1W"
		default:
			throw new Error("unknown alarm interval: " + alarmInterval)
	}
}

function serializeAlarm(event: CalendarEvent, alarm: UserAlarmInfo): Array<string> {
	return [
		"BEGIN:VALARM",
		"ACTION:DISPLAY",
		"DESCRIPTION:This is an event reminder",
		`TRIGGER:${serializeTrigger(downcast(alarm.alarmInfo.trigger))}`,
		"END:VALARM"
	]
}

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
		`SUMMARY:${escapeSemicolons(event.summary)}`,
	]
		.concat(event.description && event.description !== "" ? `DESCRIPTION:${escapeSemicolons(event.description)}` : [])
		.concat(serializeRepeatRule(repeatRule, isAllDay, timeZone))
		.concat(event.location && event.location.length > 0 ? `LOCATION:${escapeSemicolons(event.location)}` : [])
		.concat(...mapAndFilterNull(alarms, (alarm) => {
			try {
				return serializeAlarm(event, alarm)
			} catch (e) {
				console.log(`error serializing alarm ${getLetId(alarm).toString()} for event ${getLetId(event).toString()}:`, e)
				return null
			}
		}))
		.concat(serializeParticipants(event))
		.concat("END:VEVENT")
}

function serializeParticipants(event: CalendarEvent): Array<string> {
	const {organizer, attendees} = event
	if (attendees.length === 0 && organizer == null) {
		return []
	}

	const lines = []
	if (organizer) {
		const namePart = organizer.name ? `;CN=${quotedString(organizer.name)}` : ""
		lines.push(`ORGANIZER${namePart};EMAIL=${organizer.address}:mailto:${organizer.address}`)
	}
	const attendeesProperties = attendees.map(({address, status}) => {
		const namePart = address.name ? `;CN=${quotedString(address.name)}` : ""
		const partstat = calendarAttendeeStatusToParstat[downcast<CalendarAttendeeStatusEnum>(status)]
		return `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=${partstat}`
			+ `;RSVP=TRUE${namePart};EMAIL=${address.address}:mailto:${address.address}`
	})
	return lines.concat(attendeesProperties)
}

/**
 * Create an ical quoted-string param-value
 * double quotes are not allowed inside of param-value properties so they are removed
 */
function quotedString(input: string): string {
	return `"${input.replace(/"/g, '')}"`
}

function escapeSemicolons(value: string): string {
	return value.replace(/[;\\\n]/g, (ch) => iCalReplacements[ch])
}

function pad2(number) {
	return pad(number, 2)
}

export function formatDateTime(date: Date, timeZone: string): string {
	const dateTime = DateTime.fromJSDate(date, {zone: timeZone})
	return `${dateTime.year}${
		pad2(dateTime.month)}${pad2(dateTime.day)}T${pad2(dateTime.hour)}${pad2(dateTime.minute)}${pad2(dateTime.second)}`
}

export function formatDateTimeUTC(date: Date): string {
	return `${date.getUTCFullYear()}${
		pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${
		pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
}

export function formatDate(date: Date, timeZone: string): string {
	const dateTime = DateTime.fromJSDate(date, {zone: timeZone})
	return `${dateTime.year}${pad2(dateTime.month)}${pad2(dateTime.day)}`
}

