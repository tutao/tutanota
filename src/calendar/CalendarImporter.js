//@flow

import type {AlarmIntervalEnum} from "../api/common/TutanotaConstants"
import {AlarmInterval, CalendarAttendeeStatus, EndType, reverse, SECOND_MS} from "../api/common/TutanotaConstants"
import {fileController} from "../file/FileController"
import {stringToUtf8Uint8Array, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {iCalReplacements, parseCalendarEvents, parseICalendar, tutaToIcalFrequency} from "./CalendarParser"
import {generateEventElementId, isAllDayEvent, isLongEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {CALENDAR_MIME_TYPE, generateUid, getTimeZone} from "./CalendarUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {loadAll, loadMultiple} from "../api/main/Entity"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {createFile} from "../api/entities/tutanota/File"
import {createDataFile} from "../api/common/DataFile"
import {pad} from "../api/common/utils/StringUtils"
import {downcast, neverNull, ProgressMonitor} from "../api/common/utils/Utils"
import {elementIdPart, isSameId, listIdPart} from "../api/common/EntityFunctions"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"
import stream from "mithril/stream/stream.js"
import {ParserError} from "../misc/parsing"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {incrementDate} from "../api/common/utils/DateUtils"
import {flat} from "../api/common/utils/ArrayUtils"

export function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot) {

	fileController.showFileChooser(true, ["ical", "ics", "ifb", "icalendar"])
	              .then((dataFiles) => {
		              const parsedEvents = dataFiles.map((file) => parseCalendarFile(file).contents)

		              const totalCount = parsedEvents.reduce((acc, eventsWithAlarms) => acc + eventsWithAlarms.length, 0)
		              const progress = stream(0)
		              const progressMonitor = new ProgressMonitor(totalCount, progress)

		              const importPromise =
			              loadAllEvents(calendarGroupRoot)
				              .then((events) => {
					              const uidToEvent = new Map()
					              events.forEach((event) => {
						              event.uid && uidToEvent.set(event.uid, event)
					              })
					              return Promise.each(parsedEvents, (events: Iterable<{event: CalendarEvent, alarms: Array<AlarmInfo>}>) => {
						              return Promise.each(events, ({event, alarms}) => {
							              // Don't try to create event which we already have
							              if (event.uid && uidToEvent.has(event.uid)) {
								              return
							              }
							              const elementId = generateEventElementId(event.startTime.getTime())
							              const repeatRule = event.repeatRule
							              if (isLongEvent(event) || repeatRule) {
								              event._id = [calendarGroupRoot.longEvents, elementId]
							              } else {
								              event._id = [calendarGroupRoot.shortEvents, elementId]
							              }
							              event._ownerGroup = calendarGroupRoot._id

							              if (repeatRule && repeatRule.timeZone === "") {
								              repeatRule.timeZone = getTimeZone()
							              }

							              for (let alarmInfo of alarms) {
								              alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
							              }
							              return worker.createCalendarEvent(event, alarms, null)
							                           .then(() => progressMonitor.workDone(1))
							                           .delay(100)
						              })
					              })

				              })
		              return showProgressDialog("importCalendar_label", importPromise.then(() => progress(100)), progress)
	              })
	              .catch(ParserError, (e) => {
		              console.log("Failed to parse file", e)
		              Dialog.error(() => lang.get("importReadFileError_msg", {"{filename}": e.filename}))
	              })

}

export type ParsedCalendarData = {method: string, contents: Array<{event: CalendarEvent, alarms: Array<AlarmInfo>}>}

export function parseCalendarFile(file: DataFile): ParsedCalendarData {
	try {
		const stringData = utf8Uint8ArrayToString(file.data)
		return parseCalendarStringData(stringData)
	} catch (e) {
		if (e instanceof ParserError) {
			throw new ParserError(e.message, file.name)
		} else {
			throw e
		}
	}

}

export function parseCalendarStringData(value: string): ParsedCalendarData {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree)
}

export function exportCalendar(calendarName: string, groupRoot: CalendarGroupRoot, userAlarmInfos: Id) {
	showProgressDialog("pleaseWait_msg", loadAllEvents(groupRoot)
		.then((allEvents) => {
			return Promise.map(allEvents, event => {
				const thisUserAlarms = event.alarmInfos.filter(alarmInfoId => isSameId(userAlarmInfos, listIdPart(alarmInfoId)))
				if (thisUserAlarms.length > 0) {
					return loadMultiple(UserAlarmInfoTypeRef, userAlarmInfos, thisUserAlarms.map(elementIdPart))
						.then(alarms => ({event, alarms}))
				} else {
					return {event, alarms: []}
				}
			})
		})
		.then((eventsWithAlarms) => exportCalendarEvents(calendarName, eventsWithAlarms)))
}

function loadAllEvents(groupRoot: CalendarGroupRoot): Promise<Array<CalendarEvent>> {
	return loadAll(CalendarEventTypeRef, groupRoot.longEvents)
		.then((longEvents) =>
			loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then((shortEvents) => {
				return shortEvents.concat(longEvents)
			}))
}

function exportCalendarEvents(calendarName: string, events: Array<{event: CalendarEvent, alarms: Array<UserAlarmInfo>}>) {
	const stringValue = serializeCalendar(env.versionNumber, events)
	const data = stringToUtf8Uint8Array(stringValue)
	const tmpFile = createFile()
	tmpFile.name = calendarName === "" ? "export.ics" : (calendarName + "-export.ics")
	tmpFile.mimeType = CALENDAR_MIME_TYPE
	tmpFile.size = String(data.byteLength)
	return fileController.open(createDataFile(tmpFile, data))
}

export function makeInvitationCalendar(versionNumber: string, event: CalendarEvent, method: string, now: Date = new Date()): string {
	const eventSerialized = serializeEvent(event, [], now)
	return wrapIntoCalendar(versionNumber, method, eventSerialized)
}


export function makeInvitationCalendarFile(event: CalendarEvent, method: string): DataFile {
	const stringValue = makeInvitationCalendar(env.versionNumber, event, method)
	const data = stringToUtf8Uint8Array(stringValue)
	const tmpFile = createFile()
	const date = new Date()
	tmpFile.name = `${method.toLowerCase()}-${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}.ics`
	tmpFile.mimeType = CALENDAR_MIME_TYPE
	tmpFile.size = String(data.byteLength)
	return createDataFile(tmpFile, data)
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

export function serializeCalendar(versionNumber: string, events: Array<{event: CalendarEvent, alarms: Array<UserAlarmInfo>}>, now: Date = new Date()): string {
	return wrapIntoCalendar(versionNumber, "PUBLISH", flat(events.map(({event, alarms}) => serializeEvent(event, alarms, now))))
}

function serializeRepeatRule(repeatRule: ?RepeatRule, isAllDayEvent: boolean) {
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
			const value = isAllDayEvent ? formatDate(incrementDate(date, -1)) : formatDateTimeUTC(new Date(date.getTime() - SECOND_MS))
			endType = `;UNTIL=${value}`
		}
		return [
			`RRULE:FREQ=${tutaToIcalFrequency[repeatRule.frequency]}` +
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

export function serializeEvent(event: CalendarEvent, alarms: Array<UserAlarmInfo>, now: Date = new Date()): Array<string> {
	const repeatRule = event.repeatRule
	const isAllDay = isAllDayEvent(event)
	let dateStart, dateEnd
	if (isAllDay) {
		dateStart = `DTSTART:${formatDate(event.startTime)}`
		dateEnd = `DTEND:${formatDate(incrementDate(event.endTime, -1))}`
	} else if (repeatRule) {
		dateStart = `DTSTART;TZID=${repeatRule.timeZone}:${formatDateTime(event.startTime)}`
		dateEnd = `DTEND;TZID=${repeatRule.timeZone}:${formatDateTime(event.endTime)}`
	} else {
		dateStart = `DTSTART:${formatDateTimeUTC(event.startTime)}`
		dateEnd = `DTEND:${formatDateTimeUTC(event.endTime)}`
	}
	return [
		"BEGIN:VEVENT",
		dateStart,
		dateEnd,
		`DTSTAMP:${formatDateTimeUTC(now)}`,
		`UID:${event.uid ? event.uid : generateUid(event, now.getTime())}`, // legacy: only generate uid for older calendar events.
		`SUMMARY:${escapeSemicolons(event.summary)}`,
	]
		.concat(event.description && event.description !== "" ? `DESCRIPTION:${escapeSemicolons(event.description)}` : [])
		.concat(serializeRepeatRule(repeatRule, isAllDay))
		.concat(event.location && event.location.length > 0 ? `LOCATION:${escapeSemicolons(event.location)}` : [])
		.concat(...alarms.map((alarm) => serializeAlarm(event, alarm)))
		.concat(serializeParticipants(event))
		.concat("END:VEVENT")
}

function serializeParticipants(event: CalendarEvent): Array<string> {
	const {organizer, attendees} = event
	if (attendees.length === 0 && organizer == null) {
		return []
	}

	const lines = []
	organizer && lines.push(`ORGANIZER;CN=${organizer}:mailto:${organizer}`)
	const attendeesProperties = attendees.map(({address, status}) =>
		`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARSTAT=${calendarAttendeeStatusToParstat[status]}`
		+ `;RSVP=TRUE;CN=${address.name}:mailto:${address.address}`)
	return lines.concat(attendeesProperties)
}

function escapeSemicolons(value: string): string {
	return value.replace(/[;\\\n]/g, (ch) => iCalReplacements[ch])
}

function pad2(number) {
	return pad(number, 2)
}

export function formatDateTime(date: Date): string {
	return `${date.getFullYear()}${pad2(date.getMonth()
		+ 1)}${pad2(date.getDate())}T${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
}

export function formatDateTimeUTC(date: Date): string {
	return `${date.getUTCFullYear()}${pad2(date.getUTCMonth()
		+ 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
}

export function formatDate(date: Date): string {
	return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
}

const calendarAttendeeStatusToParstat = {
	[CalendarAttendeeStatus.NEEDS_ACTION]: "NEEDS-ACTION",
	[CalendarAttendeeStatus.ACCEPTED]: "ACCEPTED",
	[CalendarAttendeeStatus.DECLINED]: "DECLINED",
	[CalendarAttendeeStatus.TENTATIVE]: "TENTATIVE",
}
export const parstatToCalendarAttendeeStatus = reverse(calendarAttendeeStatusToParstat)
