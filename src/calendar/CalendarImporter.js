//@flow

import {fileController} from "../file/FileController"
import {stringToUtf8Uint8Array, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {parseCalendarEvents, parseICalendar, tutaToIcalFrequency} from "./CalendarParser"
import {generateEventElementId, isLongEvent} from "../api/common/utils/CommonCalendarUtils"
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
	const tree = parseICalendar(stringData)
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
	let value = [
		"BEGIN:VCALENDAR",
		`PRODID:-//Tutao GmbH//Tutanota ${env.versionNumber}//EN`,
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
	]

	for (let {event, alarms} of events) {
		value.push(...serializeEvent(event, alarms))
	}
	value.push(...["END:VCALENDAR"])

	const stringValue = value.join("\r\n")
	const data = stringToUtf8Uint8Array(stringValue)
	const tmpFile = createFile()
	tmpFile.name = calendarName === "" ? "export.ical" : (calendarName + "-export.ical")
	tmpFile.mimeType = "text/calendar"
	tmpFile.size = String(data.byteLength)
	return fileController.open(createDataFile(tmpFile, data))
}

function serializeRepeatRule(repeatRule: ?RepeatRule) {
	if (repeatRule) {
		const endType = repeatRule.endType === EndType.Count
			? ";COUNT=" + neverNull(repeatRule.endValue)
			: repeatRule.endType === EndType.UntilDate
				? ";" + formatDateTimeUTC(new Date(parseInt(repeatRule.endValue)))
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
			return "-P05M"
		case AlarmInterval.TEN_MINUTES:
			return "-P10M"
		case AlarmInterval.THIRTY_MINUTES:
			return "-PT10M"
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

function serializeEvent(event: CalendarEvent, alarms: Array<UserAlarmInfo>): Array<string> {
	const repeatRule = event.repeatRule
	// TODO: differentiate all-day events
	return [
		"BEGIN:VEVENT",
		`DTSTART:${formatDateTimeUTC(event.startTime)}`,
		`DTEND:${formatDateTimeUTC(event.endTime)}`,
		`DTSTAMP:${formatDateTimeUTC(new Date())}`,
		`UID:${event._id[0] + event._id[1]}@tutanota.com`,
		`SUMMARY:${escapeSemicolons(event.summary)}`,
	]
		.concat(event.description && event.description !== "" ? `DESCRIPTION:${escapeSemicolons(event.description)}` : [])
		.concat(serializeRepeatRule(repeatRule))
		.concat(...alarms.map((alarm) => serializeAlarm(event, alarm)))
		.concat("END:VEVENT")
}

function escapeSemicolons(value: string): string {
	return value.replace(/;/g, "\;")
}

function pad2(number) {
	return pad(number, 2)
}

export function formatDateTime(date: Date): string {
	return `${date.getFullYear()}${pad2(date.getMonth())}${pad2(date.getDate())}T${pad2(date.getHours())}${pad2(date.getMinutes())}00`
}

export function formatDateTimeUTC(date: Date): string {
	return `${date.getUTCFullYear()}${pad2(date.getUTCMonth())}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}00Z`
}
