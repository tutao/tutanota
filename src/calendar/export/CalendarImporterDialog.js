//@flow
import type {CalendarGroupRoot} from "../../api/entities/tutanota/CalendarGroupRoot";
import {CALENDAR_MIME_TYPE, fileController} from "../../file/FileController";
import stream from "mithril/stream/stream.js";
import {ProgressMonitor} from "../../api/common/utils/ProgressMonitor";
import {assignEventId, getTimeZone} from "../date/CalendarUtils";
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent";
import {CalendarEventTypeRef} from "../../api/entities/tutanota/CalendarEvent"
import type {AlarmInfo} from "../../api/entities/sys/AlarmInfo";
import {generateEventElementId} from "../../api/common/utils/CommonCalendarUtils";
import {worker} from "../../api/main/WorkerClient";
import {showProgressDialog} from "../../gui/ProgressDialog";
import {ParserError} from "../../misc/parsing/ParserCombinator";
import {Dialog} from "../../gui/base/Dialog";
import {lang} from "../../misc/LanguageViewModel";
import {parseCalendarFile, serializeCalendar} from "./CalendarImporter";
import {loadAll, loadMultiple} from "../../api/main/Entity"
import {elementIdPart, isSameId, listIdPart} from "../../api/common/utils/EntityUtils"
import {UserAlarmInfoTypeRef} from "../../api/entities/sys/UserAlarmInfo"
import type {UserAlarmInfo} from "../../api/entities/sys/UserAlarmInfo"
import {stringToUtf8Uint8Array} from "../../api/common/utils/Encoding"
import {createFile} from "../../api/entities/tutanota/File"
import {convertToDataFile} from "../../api/common/DataFile"

export function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot) {
	fileController.showFileChooser(true, ["ical", "ics", "ifb", "icalendar"])
	              .then((dataFiles) => {
		              const parsedEvents = dataFiles.map((file) => parseCalendarFile(file).contents)

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
							              event.uid && uidToEvent.set(event.uid, event)

							              const repeatRule = event.repeatRule
							              assignEventId(event, zone, calendarGroupRoot)
							              event._ownerGroup = calendarGroupRoot._id

							              if (repeatRule && repeatRule.timeZone === "") {
								              repeatRule.timeZone = getTimeZone()
							              }

							              for (let alarmInfo of alarms) {
								              alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
							              }
							              assignEventId(event, zone, calendarGroupRoot)
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
	tmpFile.mimeType = CALENDAR_MIME_TYPE
	tmpFile.size = String(data.byteLength)
	return fileController.open(convertToDataFile(tmpFile, data))
}

function loadAllEvents(groupRoot: CalendarGroupRoot): Promise<Array<CalendarEvent>> {
	return loadAll(CalendarEventTypeRef, groupRoot.longEvents)
		.then((longEvents) =>
			loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then((shortEvents) => {
				return shortEvents.concat(longEvents)
			}))
}