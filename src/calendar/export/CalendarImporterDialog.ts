import type {CalendarGroupRoot} from "../../api/entities/tutanota/TypeRefs.js"
import {CALENDAR_MIME_TYPE, showFileChooser} from "../../file/FileController"
import type {CalendarEvent} from "../../api/entities/tutanota/TypeRefs.js"
import {CalendarEventTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {generateEventElementId} from "../../api/common/utils/CommonCalendarUtils"
import {showProgressDialog, showWorkerProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {ParserError} from "../../misc/parsing/ParserCombinator"
import {Dialog} from "../../gui/base/Dialog"
import {lang} from "../../misc/LanguageViewModel"
import {parseCalendarFile, ParsedEvent, serializeCalendar} from "./CalendarImporter"
import {elementIdPart, isSameId, listIdPart} from "../../api/common/utils/EntityUtils"
import type {UserAlarmInfo} from "../../api/entities/sys/TypeRefs.js"
import {UserAlarmInfoTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {createFile} from "../../api/entities/tutanota/TypeRefs.js"
import {convertToDataFile} from "../../api/common/DataFile"
import {locator} from "../../api/main/MainLocator"
import {flat, ofClass, promiseMap, stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {assignEventId, CalendarEventValidity, checkEventValidity, getTimeZone} from "../date/CalendarUtils"
import {ImportError} from "../../api/common/error/ImportError"
import {TranslationKeyType} from "../../misc/TranslationKey"

export async function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot): Promise<void> {
	let parsedEvents: ParsedEvent[][]

	try {
		const dataFiles = await showFileChooser(true, ["ical", "ics", "ifb", "icalendar"])
		parsedEvents = dataFiles.map(file => parseCalendarFile(file).contents)
	} catch (e) {
		if (e instanceof ParserError) {
			console.log("Failed to parse file", e)
			return Dialog.message(() =>
				lang.get("importReadFileError_msg", {
					"{filename}": e.filename,
				}),
			)
		} else {
			throw e
		}
	}

	const zone = getTimeZone()

	async function importEvents(): Promise<void> {
		const existingEvents = await loadAllEvents(calendarGroupRoot)
		const existingUidToEventMap = new Map()
		existingEvents.forEach(existingEvent => {
			existingEvent.uid && existingUidToEventMap.set(existingEvent.uid, existingEvent)
		})
		const flatParsedEvents = flat(parsedEvents)
		const eventsWithInvalidDate: CalendarEvent[] = []
		const inversedEvents: CalendarEvent[] = []
		const pre1970Events: CalendarEvent[] = []
		const eventsWithExistingUid: CalendarEvent[] = []
		// Don't try to create event which we already have
		const eventsForCreation = flatParsedEvents // only create events with non-existing uid
			.filter(({event}) => {
				if (!event.uid) {
					// should not happen because calendar parser will generate uids if they do not exist
					throw new Error("Uid is not set for imported event")
				}

				switch (checkEventValidity(event)) {
					case CalendarEventValidity.InvalidContainsInvalidDate:
						eventsWithInvalidDate.push(event)
						return false
					case CalendarEventValidity.InvalidEndBeforeStart:
						inversedEvents.push(event)
						return false
					case CalendarEventValidity.InvalidPre1970:
						pre1970Events.push(event)
						return false
				}

				if (!existingUidToEventMap.has(event.uid)) {
					existingUidToEventMap.set(event.uid, event)
					return true
				} else {
					eventsWithExistingUid.push(event)
					return false
				}
			})
			.map(({event, alarms}) => {
				// hashedUid will be set later in calendarFacade to avoid importing the hash function here
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
				return {
					event,
					alarms,
				}
			})

		if (!await showConfirmPartialImportDialog(eventsWithExistingUid, "importEventExistingUid_msg")) return
		if (!await showConfirmPartialImportDialog(eventsWithInvalidDate, "importInvalidDatesInEvent_msg")) return
		if (!await showConfirmPartialImportDialog(inversedEvents, "importEndNotAfterStartInEvent_msg")) return
		if (!await showConfirmPartialImportDialog(pre1970Events, "importPre1970StartInEvent_msg")) return

		/**
		 * show an error dialog detailing the reason and amount for events that failed to import
		 */
		async function showConfirmPartialImportDialog(skippedEvents: CalendarEvent[], confirmationText: TranslationKeyType): Promise<boolean> {
			return skippedEvents.length === 0 || await Dialog.confirm(() =>
				lang.get(confirmationText, {
					"{amount}": skippedEvents.length + "",
					"{total}": flatParsedEvents.length + "",
				}),
			)
		}

		return locator.calendarFacade.saveImportedCalendarEvents(eventsForCreation).catch(
			ofClass(ImportError, e =>
				Dialog.message(() =>
					lang.get("importEventsError_msg", {
						"{amount}": e.numFailed + "",
						"{total}": eventsForCreation.length + "",
					}),
				),
			),
		)
	}

	return showWorkerProgressDialog(locator.worker, "importCalendar_label", importEvents())
}

export function exportCalendar(calendarName: string, groupRoot: CalendarGroupRoot, userAlarmInfos: Id, now: Date, zone: string) {
	showProgressDialog(
		"pleaseWait_msg",
		loadAllEvents(groupRoot)
			.then(allEvents => {
				return promiseMap(allEvents, event => {
					const thisUserAlarms = event.alarmInfos.filter(alarmInfoId => isSameId(userAlarmInfos, listIdPart(alarmInfoId)))

					if (thisUserAlarms.length > 0) {
						return locator.entityClient.loadMultiple(UserAlarmInfoTypeRef, userAlarmInfos, thisUserAlarms.map(elementIdPart)).then(alarms => ({
							event,
							alarms,
						}))
					} else {
						return {
							event,
							alarms: [],
						}
					}
				})
			})
			.then(eventsWithAlarms => exportCalendarEvents(calendarName, eventsWithAlarms, now, zone)),
	)
}

function exportCalendarEvents(
	calendarName: string,
	events: Array<{
		event: CalendarEvent
		alarms: Array<UserAlarmInfo>
	}>,
	now: Date,
	zone: string,
) {
	const stringValue = serializeCalendar(env.versionNumber, events, now, zone)
	const data = stringToUtf8Uint8Array(stringValue)
	const tmpFile = createFile()
	tmpFile.name = calendarName === "" ? "export.ics" : calendarName + "-export.ics"
	tmpFile.mimeType = CALENDAR_MIME_TYPE
	tmpFile.size = String(data.byteLength)
	return locator.fileController.saveDataFile(convertToDataFile(tmpFile, data))
}

function loadAllEvents(groupRoot: CalendarGroupRoot): Promise<Array<CalendarEvent>> {
	return locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents).then(longEvents =>
		locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then(shortEvents => {
			return shortEvents.concat(longEvents)
		}),
	)
}