//@flow

import {fileController} from "../file/FileController"
import {stringToUtf8Uint8Array, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {iCalReplacements, parseCalendarEvents, parseICalendar, tutaToIcalFrequency} from "./CalendarParser"
import {generateEventElementId, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {createEventId, generateUid, getTimeZone} from "./CalendarUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {loadAll, loadMultiple} from "../api/main/Entity"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {createFile} from "../api/entities/tutanota/File"
import {createDataFile} from "../api/common/DataFile"
import {pad} from "../api/common/utils/StringUtils"
import type {AlarmIntervalEnum} from "../api/common/TutanotaConstants"
import {AlarmInterval, EndType, SECOND_MS} from "../api/common/TutanotaConstants"
import {downcast, neverNull, ProgressMonitor} from "../api/common/utils/Utils"
import {elementIdPart, isSameId, listIdPart} from "../api/common/EntityFunctions"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"
import stream from "mithril/stream/stream.js"
import {ParserError} from "../misc/parsing"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {incrementDate} from "../api/common/utils/DateUtils"
import {DateTime} from "luxon"

export function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot) {

	fileController.showFileChooser(true, ["ical", "ics", "ifb", "icalendar"])
	              .then((dataFiles) => {
		              const parsedEvents = dataFiles.map(parseFile)

		              const totalCount = parsedEvents.reduce((acc, eventsWithAlarms) => acc + eventsWithAlarms.length, 0)
		              const progress = stream(0)
		              const progressMonitor = new ProgressMonitor(totalCount, progress)
		              const zone = getTimeZone()

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
							              const repeatRule = event.repeatRule
							              createEventId(event, zone, calendarGroupRoot)
							              event._ownerGroup = calendarGroupRoot._id

							              if (repeatRule && repeatRule.timeZone === "") {
								              repeatRule.timeZone = getTimeZone()
							              }

							              for (let alarmInfo of alarms) {
								              alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
							              }
							              createEventId(event, zone, calendarGroupRoot)
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

function parseFile(file: DataFile) {
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

export function parseCalendarStringData(value: string) {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree)
}

export function exportCalendar(
	calendarName: string,
	groupRoot: CalendarGroupRoot,
	userAlarmInfos: Id,
	now: Date,
	zone: string
) {
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
		.then((eventsWithAlarms) => exportCalendarEvents(calendarName, eventsWithAlarms, now, zone)))
}

function loadAllEvents(groupRoot: CalendarGroupRoot): Promise<Array<CalendarEvent>> {
	return loadAll(CalendarEventTypeRef, groupRoot.longEvents)
		.then((longEvents) =>
			loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then((shortEvents) => {
				return shortEvents.concat(longEvents)
			}))
}

function exportCalendarEvents(
	calendarName: string,
	events: Array<{event: CalendarEvent, alarms: Array<UserAlarmInfo>}>,
	now: Date,
	zone: string,
) {
	const stringValue = serializeCalendar(env.versionNumber, events, now, zone)
	const data = stringToUtf8Uint8Array(stringValue)
	const tmpFile = createFile()
	tmpFile.name = calendarName === "" ? "export.ics" : (calendarName + "-export.ics")
	tmpFile.mimeType = "text/calendar"
	tmpFile.size = String(data.byteLength)
	return fileController.open(createDataFile(tmpFile, data))
}

export function serializeCalendar(
	versionNumber: string,
	events: Array<{event: CalendarEvent, alarms: Array<UserAlarmInfo>}>,
	now: Date,
	zone: string
): string {
	let value = [
		"BEGIN:VCALENDAR",
		`PRODID:-//Tutao GmbH//Tutanota ${versionNumber}//EN`,
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
	]

	for (let {event, alarms} of events) {
		value.push(...serializeEvent(event, alarms, now, zone))
	}
	value.push(...["END:VCALENDAR"])

	return value.join("\r\n")
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

export function serializeEvent(event: CalendarEvent, alarms: Array<UserAlarmInfo>, now: Date, timeZone: string): Array<string> {
	const repeatRule = event.repeatRule
	const isAllDay = isAllDayEvent(event)
	let dateStart, dateEnd
	if (isAllDay) {
		dateStart = `DTSTART:${formatDate(event.startTime, timeZone)}`
		dateEnd = `DTEND:${formatDate(event.endTime, timeZone)}`
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
		`UID:${event.uid ? event.uid : generateUid(event, now.getTime())}`, // legacy: only generate uid for older calendar events.
		`SUMMARY:${escapeSemicolons(event.summary)}`,
	]
		.concat(event.description && event.description !== "" ? `DESCRIPTION:${escapeSemicolons(event.description)}` : [])
		.concat(serializeRepeatRule(repeatRule, isAllDay, timeZone))
		.concat(event.location && event.location.length > 0 ? `LOCATION:${escapeSemicolons(event.location)}` : [])
		.concat(...alarms.map((alarm) => serializeAlarm(event, alarm)))
		.concat("END:VEVENT")
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
