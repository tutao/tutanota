//@flow

import {fileController} from "../file/FileController"
import {stringToUtf8Uint8Array, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {iCalReplacements, parseCalendarEvents, parseICalendar, tutaToIcalFrequency} from "./CalendarParser"
import {generateEventElementId, isAllDayEvent, isLongEvent} from "../api/common/utils/CommonCalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {getTimeZone} from "./CalendarUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {loadAll, loadMultiple} from "../api/main/Entity"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {createFile} from "../api/entities/tutanota/File"
import {createDataFile} from "../api/common/DataFile"
import {pad} from "../api/common/utils/StringUtils"
import type {AlarmIntervalEnum} from "../api/common/TutanotaConstants"
import {AlarmInterval, EndType} from "../api/common/TutanotaConstants"
import {downcast, neverNull} from "../api/common/utils/Utils"
import {elementIdPart, isSameId, listIdPart} from "../api/common/EntityFunctions"
import {UserAlarmInfoTypeRef} from "../api/entities/sys/UserAlarmInfo"

export function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot) {
	fileController.showFileChooser(true, ["ical", "ics", "ifb", "icalendar"]).then((dataFiles) => {
		return Promise.each(dataFiles.map(parseFile), (events: Iterable<{event: CalendarEvent, alarms: Array<AlarmInfo>}>) => {
			return Promise.each(events, ({event, alarms}) => {
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
				return worker.createCalendarEvent(calendarGroupRoot, event, alarms, null).delay(100)
			})
		})
	})
}

function parseFile(file: DataFile) {
	const stringData = utf8Uint8ArrayToString(file.data)
	return parseCalendarStringData(stringData)
}

export function parseCalendarStringData(value: string) {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree)
}

export function exportCalendar(calendarName: string, groupRoot: CalendarGroupRoot, userAlarmInfos: Id) {
	showProgressDialog("pleaseWait_msg", loadAll(CalendarEventTypeRef, groupRoot.longEvents)
		.then((longEvents) =>
			loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then((shortEvents) => {
				return {shortEvents, longEvents}
			})))
		.then(({longEvents, shortEvents}) => {
			const allEvents = shortEvents.concat(longEvents)
			return Promise.map(allEvents, event => {
				const thisUserAlarms = event.alarmInfos.filter(alarmInfoId => isSameId(userAlarmInfos, listIdPart(alarmInfoId)))
				if (thisUserAlarms.length > 0) {
					return loadMultiple(UserAlarmInfoTypeRef, userAlarmInfos, thisUserAlarms.map(elementIdPart)).then(alarms => ({event, alarms}))
				} else {
					return {event, alarms: []}
				}
			})
		})
		.then((eventsWithAlarms) => exportCalendarEvents(calendarName, eventsWithAlarms))
}

function exportCalendarEvents(calendarName: string, events: Array<{event: CalendarEvent, alarms: Array<UserAlarmInfo>}>) {
	const stringValue = serializeCalendar(env.versionNumber, events)
	const data = stringToUtf8Uint8Array(stringValue)
	const tmpFile = createFile()
	tmpFile.name = calendarName === "" ? "export.ical" : (calendarName + "-export.ical")
	tmpFile.mimeType = "text/calendar"
	tmpFile.size = String(data.byteLength)
	return fileController.open(createDataFile(tmpFile, data))
}

export function serializeCalendar(versionNumber: string, events: Array<{event: CalendarEvent, alarms: Array<UserAlarmInfo>}>, now: Date = new Date()): string {
	let value = [
		"BEGIN:VCALENDAR",
		`PRODID:-//Tutao GmbH//Tutanota ${versionNumber}//EN`,
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
	]

	for (let {event, alarms} of events) {
		value.push(...serializeEvent(event, alarms, now))
	}
	value.push(...["END:VCALENDAR"])

	return value.join("\r\n")
}

function serializeRepeatRule(repeatRule: ?RepeatRule) {
	if (repeatRule) {
		const endType = repeatRule.endType === EndType.Count
			? ";COUNT=" + neverNull(repeatRule.endValue)
			: repeatRule.endType === EndType.UntilDate
				? ";UNTIL=" + formatDateTimeUTC(new Date(parseInt(repeatRule.endValue)))
				: ""
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
		dateEnd = `DTEND:${formatDate(event.endTime)}`
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
		`UID:${event._id[0] + event._id[1]}@tutanota.com`,
		`SUMMARY:${escapeSemicolons(event.summary)}`,
	]
		.concat(event.description && event.description !== "" ? `DESCRIPTION:${escapeSemicolons(event.description)}` : [])
		.concat(serializeRepeatRule(repeatRule))
		.concat(...alarms.map((alarm) => serializeAlarm(event, alarm)))
		.concat("END:VEVENT")
}

function escapeSemicolons(value: string): string {
	return value.replace(/[;\\\n]/g, (ch) => iCalReplacements[ch])
}

function pad2(number) {
	return pad(number, 2)
}

export function formatDateTime(date: Date): string {
	return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(date.getHours())}${pad2(date.getMinutes())}00`
}

export function formatDateTimeUTC(date: Date): string {
	return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}00Z`
}

export function formatDate(date: Date): string {
	return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
}
