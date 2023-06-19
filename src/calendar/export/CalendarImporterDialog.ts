import type { CalendarEvent, CalendarGroupRoot } from "../../api/entities/tutanota/TypeRefs.js"
import { CalendarEventTypeRef, createFile } from "../../api/entities/tutanota/TypeRefs.js"
import { CALENDAR_MIME_TYPE, showFileChooser } from "../../file/FileController"
import { generateEventElementId } from "../../api/common/utils/CommonCalendarUtils"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { ParserError } from "../../misc/parsing/ParserCombinator"
import { Dialog } from "../../gui/base/Dialog"
import { lang } from "../../misc/LanguageViewModel"
import { parseCalendarFile, ParsedEvent, serializeCalendar } from "./CalendarImporter"
import { elementIdPart, isSameId, listIdPart } from "../../api/common/utils/EntityUtils"
import type { AlarmInfo, UserAlarmInfo } from "../../api/entities/sys/TypeRefs.js"
import { UserAlarmInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { convertToDataFile } from "../../api/common/DataFile"
import { locator } from "../../api/main/MainLocator"
import { getFromMap, ofClass, promiseMap, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { assignEventId, CalendarEventValidity, checkEventValidity, getTimeZone } from "../date/CalendarUtils"
import { ImportError } from "../../api/common/error/ImportError"
import { TranslationKeyType } from "../../misc/TranslationKey"

const enum EventImportRejectionReason {
	Pre1970,
	Inversed,
	InvalidDate,
	Duplicate,
}

type RejectedEvents = Map<EventImportRejectionReason, Array<CalendarEvent>>

export async function showCalendarImportDialog(calendarGroupRoot: CalendarGroupRoot): Promise<void> {
	let parsedEvents: ParsedEvent[][]

	try {
		const dataFiles = await showFileChooser(true, ["ical", "ics", "ifb", "icalendar"])
		parsedEvents = await promiseMap(dataFiles, async (file) => (await parseCalendarFile(file)).contents)
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

	const existingEvents = await showProgressDialog("loading_msg", loadAllEvents(calendarGroupRoot))
	const instanceIdentifierToEventMap = new Map()
	for (const existingEvent of existingEvents) {
		if (existingEvent.uid == null) continue
		instanceIdentifierToEventMap.set(makeInstanceIdentifier(existingEvent), existingEvent)
	}
	const flatParsedEvents = parsedEvents.flat()
	const rejectedEvents: RejectedEvents = new Map()
	// Don't try to create event which we already have
	const eventsForCreation: Array<{ event: CalendarEvent; alarms: Array<AlarmInfo> }> = []
	for (const { event, alarms } of flatParsedEvents) {
		const rejectionReason = shouldBeSkipped(event, instanceIdentifierToEventMap)
		if (rejectionReason != null) {
			getFromMap(rejectedEvents, rejectionReason, () => []).push(event)
			continue
		}

		// hashedUid will be set later in calendarFacade to avoid importing the hash function here
		const repeatRule = event.repeatRule
		event._ownerGroup = calendarGroupRoot._id

		if (repeatRule && repeatRule.timeZone === "") {
			repeatRule.timeZone = getTimeZone()
		}

		for (let alarmInfo of alarms) {
			alarmInfo.alarmIdentifier = generateEventElementId(Date.now())
		}

		assignEventId(event, zone, calendarGroupRoot)
		eventsForCreation.push({ event, alarms })
	}

	if (!(await showConfirmPartialImportDialog(rejectedEvents.get(EventImportRejectionReason.Duplicate) ?? [], "importEventExistingUid_msg"))) return
	if (!(await showConfirmPartialImportDialog(rejectedEvents.get(EventImportRejectionReason.InvalidDate) ?? [], "importInvalidDatesInEvent_msg"))) return
	if (!(await showConfirmPartialImportDialog(rejectedEvents.get(EventImportRejectionReason.Inversed) ?? [], "importEndNotAfterStartInEvent_msg"))) return
	if (!(await showConfirmPartialImportDialog(rejectedEvents.get(EventImportRejectionReason.Pre1970) ?? [], "importPre1970StartInEvent_msg"))) return

	/**
	 * show an error dialog detailing the reason and amount for events that failed to import
	 */
	async function showConfirmPartialImportDialog(skippedEvents: CalendarEvent[], confirmationText: TranslationKeyType): Promise<boolean> {
		return (
			skippedEvents.length === 0 ||
			(await Dialog.confirm(() =>
				lang.get(confirmationText, {
					"{amount}": skippedEvents.length + "",
					"{total}": flatParsedEvents.length + "",
				}),
			))
		)
	}

	const operation = locator.operationProgressTracker.startNewOperation()
	// FIXME: is this necessary?
	const total = [...eventsForCreation, ...eventsForCreationAltered]
	return showProgressDialog("importCalendar_label", locator.calendarFacade.saveImportedCalendarEvents(total, operation.id), operation.progress)
		.catch(
			ofClass(ImportError, (e) =>
				Dialog.message(() =>
					lang.get("importEventsError_msg", {
						"{amount}": e.numFailed + "",
						"{total}": total.length.toString(),
					}),
				),
			),
		)
		.finally(() => operation.done())
}

/** check if the event should be skipped because it's invalid or already imported. if not, add it to the map. */
function shouldBeSkipped(event: CalendarEvent, instanceIdentifierToEventMap: Map<string, CalendarEvent>): EventImportRejectionReason | null {
	if (!event.uid) {
		// should not happen because calendar parser will generate uids if they do not exist
		throw new Error("Uid is not set for imported event")
	}

	switch (checkEventValidity(event)) {
		case CalendarEventValidity.InvalidContainsInvalidDate:
			return EventImportRejectionReason.InvalidDate
		case CalendarEventValidity.InvalidEndBeforeStart:
			return EventImportRejectionReason.Inversed
		case CalendarEventValidity.InvalidPre1970:
			return EventImportRejectionReason.Pre1970
	}
	const instanceIdentifier = makeInstanceIdentifier(event)
	if (!instanceIdentifierToEventMap.has(instanceIdentifier)) {
		instanceIdentifierToEventMap.set(instanceIdentifier, event)
		return null
	} else {
		return EventImportRejectionReason.Duplicate
	}
}

/** export all events from a calendar, using the alarmInfos the current user has access to and ignoring the other ones that may be set on the event. */
export async function exportCalendar(calendarName: string, groupRoot: CalendarGroupRoot, userAlarmInfos: Id, now: Date, zone: string): Promise<void> {
	return await showProgressDialog(
		"pleaseWait_msg",
		(async () => {
			const allEvents = await loadAllEvents(groupRoot)
			const eventsWithAlarms = await promiseMap(allEvents, async (event: CalendarEvent) => {
				const thisUserAlarms = event.alarmInfos.filter((alarmInfoId) => isSameId(userAlarmInfos, listIdPart(alarmInfoId)))
				if (thisUserAlarms.length === 0) return { event, alarms: [] }
				const alarms = await locator.entityClient.loadMultiple(UserAlarmInfoTypeRef, userAlarmInfos, thisUserAlarms.map(elementIdPart))
				return { event, alarms }
			})
			return await exportCalendarEvents(calendarName, eventsWithAlarms, now, zone)
		})(),
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
	return locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents).then((longEvents) =>
		locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then((shortEvents) => {
			return shortEvents.concat(longEvents)
		}),
	)
}

/** we try to enforce that each calendar only contains each uid once, but we need to take into consideration
 * that altered instances have the same uid as their progenitor.*/
function makeInstanceIdentifier(event: CalendarEvent): string {
	return `${event.uid}-${event.recurrenceId?.getTime() ?? "progenitor"}`
}
