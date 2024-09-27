import type { CalendarEvent, CalendarGroupRoot } from "../../api/entities/tutanota/TypeRefs.js"
import { CalendarEventTypeRef, createFile } from "../../api/entities/tutanota/TypeRefs.js"
import { CALENDAR_MIME_TYPE, showFileChooser, showNativeFilePicker } from "../../file/FileController.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { serializeCalendar } from "../../../calendar-app/calendar/export/CalendarExporter.js"
import { parseCalendarFile, ParsedEvent, showEventsImportDialog } from "./CalendarImporter.js"
import { elementIdPart, isSameId, listIdPart } from "../../api/common/utils/EntityUtils.js"
import type { UserAlarmInfo } from "../../api/entities/sys/TypeRefs.js"
import { UserAlarmInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { convertToDataFile } from "../../api/common/DataFile.js"
import { locator } from "../../api/main/CommonLocator.js"
import { ofClass, promiseMap, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { CalendarType, getTimeZone } from "../date/CalendarUtils.js"
import { ImportError } from "../../api/common/error/ImportError.js"
import { TranslationKeyType } from "../../misc/TranslationKey.js"
import { isApp } from "../../api/common/Env.js"

import { EventImportRejectionReason, EventWrapper, isExternalCalendarType, sortOutParsedEvents } from "./ImportExportUtils.js"

/**
 * show an error dialog detailing the reason and amount for events that failed to import
 */
async function partialImportConfirmation(skippedEvents: CalendarEvent[], confirmationText: TranslationKeyType, total: number): Promise<boolean> {
	return (
		skippedEvents.length === 0 ||
		(await Dialog.confirm(() =>
			lang.get(confirmationText, {
				"{amount}": skippedEvents.length + "",
				"{total}": total + "",
			}),
		))
	)
}

export async function handleCalendarImport(
	calendarGroupRoot: CalendarGroupRoot,
	importedParsedEvents: ParsedEvent[] | null = null,
	calendarType: CalendarType = CalendarType.NORMAL,
): Promise<void> {
	const parsedEvents: ParsedEvent[] = importedParsedEvents ?? (await showProgressDialog("loading_msg", selectAndParseIcalFile()))
	if (parsedEvents.length === 0) return
	const zone = getTimeZone()
	const existingEvents = await showProgressDialog("loading_msg", loadAllEvents(calendarGroupRoot))
	const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(parsedEvents, existingEvents, calendarGroupRoot, zone)

	const total = parsedEvents.length
	if (!(await partialImportConfirmation(rejectedEvents.get(EventImportRejectionReason.Duplicate) ?? [], "importEventExistingUid_msg", total))) return
	if (!(await partialImportConfirmation(rejectedEvents.get(EventImportRejectionReason.InvalidDate) ?? [], "importInvalidDatesInEvent_msg", total))) return
	if (!(await partialImportConfirmation(rejectedEvents.get(EventImportRejectionReason.Inversed) ?? [], "importEndNotAfterStartInEvent_msg", total))) return
	if (!(await partialImportConfirmation(rejectedEvents.get(EventImportRejectionReason.Pre1970) ?? [], "importPre1970StartInEvent_msg", total))) return

	if (eventsForCreation.length > 0) {
		if (isExternalCalendarType(calendarType)) await importEvents(eventsForCreation)
		else
			showEventsImportDialog(
				eventsForCreation.map((ev) => ev.event),
				async (dialog) => {
					dialog.close()
					await importEvents(eventsForCreation)
				},
				"importEvents_label",
			)
	}
}

async function selectAndParseIcalFile(): Promise<ParsedEvent[]> {
	try {
		const allowedExtensions = ["ical", "ics", "ifb", "icalendar"]
		const dataFiles = isApp() ? await showNativeFilePicker(allowedExtensions) : await showFileChooser(true, allowedExtensions)
		const contents = dataFiles.map((file) => parseCalendarFile(file).contents)
		return contents.flat()
	} catch (e) {
		if (e instanceof ParserError) {
			console.log("Failed to parse file", e)
			Dialog.message(() =>
				lang.get("importReadFileError_msg", {
					"{filename}": e.filename,
				}),
			)
			return []
		} else {
			throw e
		}
	}
}

async function importEvents(eventsForCreation: Array<EventWrapper>): Promise<void> {
	const operation = locator.operationProgressTracker.startNewOperation()
	return showProgressDialog("importCalendar_label", locator.calendarFacade.saveImportedCalendarEvents(eventsForCreation, operation.id), operation.progress)
		.catch(
			ofClass(ImportError, (e) =>
				Dialog.message(() =>
					lang.get("importEventsError_msg", {
						"{amount}": e.numFailed + "",
						"{total}": eventsForCreation.length.toString(),
					}),
				),
			),
		)
		.finally(() => operation.done())
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
	const tmpFile = createFile({
		name: calendarName === "" ? "export.ics" : calendarName + "-export.ics",
		mimeType: CALENDAR_MIME_TYPE,
		size: String(data.byteLength),
		subFiles: null,
		parent: null,
		cid: null,
		blobs: [],
	})
	return locator.fileController.saveDataFile(convertToDataFile(tmpFile, data))
}

function loadAllEvents(groupRoot: CalendarGroupRoot): Promise<Array<CalendarEvent>> {
	return locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents).then((longEvents) =>
		locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents).then((shortEvents) => {
			return shortEvents.concat(longEvents)
		}),
	)
}
