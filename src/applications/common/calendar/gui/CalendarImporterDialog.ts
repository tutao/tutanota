import { clone, elementIdPart, isSameId, listIdPart } from "@tutao/meta"
import { showFileChooser, showNativeFilePicker } from "../../file/FileController.js"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { serializeCalendar } from "../../../calendar-app/calendar/export/CalendarExporter.js"
import { parseCalendarFile, showEventsImportDialog } from "./CalendarImporter.js"
import { locator } from "../../api/main/CommonLocator.js"
import {
	first,
	getFirstOrThrow,
	groupBy,
	isNotEmpty,
	isNotNull,
	ofClass,
	promiseMap,
	stringToUtf8Uint8Array
} from "@tutao/utils"
import { CalendarType, getTimeZone, resolveCalendarEventProgenitor } from "../date/CalendarUtils.js"
import { ImportError } from "../../api/common/error/ImportError.js"
import { TranslationKeyType } from "../../../../ui/utils/TranslationKey.js"
import {
	EventAlarmInfoTemplatesTuple,
	EventImportRejectionReason,
	ParsedEventAlarmTuple,
	sortOutParsedEvents
} from "./ImportExportUtils.js"
import { CalendarInfoBase } from "../../../calendar-app/calendar/model/CalendarModel"
import { isApp } from "@tutao/app-env"
import { CALENDAR_MIME_TYPE } from "../../../../platform-kit/utils/FileConstants"
import { CalendarEvent, CalendarEventTypeRef, CalendarGroupRoot, createFile } from "@tutao/entities/tutanota"
import { convertToDataFile } from "../../api/worker/utils/DataFile"
import { createDateWrapper, User, UserAlarmInfo, UserAlarmInfoTypeRef } from "@tutao/entities/sys"
import { showInfoSnackbar } from "../../../../ui/base/SnackBar"
import {
	AlarmInfoTemplate,
	CalendarEventAlteredInstance,
	CalendarEventProgenitor
} from "../../api/worker/facades/lazy/CalendarFacade"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"

/**
 * show an error dialog detailing the reason and amount for events that failed to import
 */
async function partialImportConfirmation(skippedEvents: CalendarEvent[], confirmationText: TranslationKeyType, total: number): Promise<boolean> {
	return (
		skippedEvents.length === 0 ||
		(await Dialog.confirm(
			lang.makeTranslation(
				"confirm_msg",
				lang.get(confirmationText, {
					"{amount}": skippedEvents.length + "",
					"{total}": total + "",
				}),
			),
		))
	)
}

/**
 * Prompts the user to get confirmation to continue the importing procces.
 *
 * We will show sequential dialogs stating the number of events and the reason why it is going to be skipped.
 *
 * @param rejectedEvents
 * @param importedParsedEvents
 */
async function getPartialImportUserConfirmation(
	rejectedEvents: Map<EventImportRejectionReason, Array<CalendarEvent>>,
	importedParsedEvents: ParsedEventAlarmTuple[],
) {
	const acceptSkippingIcsDuplicates = await partialImportConfirmation(
		rejectedEvents.get(EventImportRejectionReason.DuplicateInIcs) ?? [],
		"importEventIcsDuplicate_msg",
		importedParsedEvents.length,
	)
	if (!acceptSkippingIcsDuplicates) {
		return false
	}

	const acceptSkippingExistingDuplicates = await partialImportConfirmation(
		rejectedEvents.get(EventImportRejectionReason.Duplicate) ?? [],
		"importEventExistingUid_msg",
		importedParsedEvents.length,
	)
	if (!acceptSkippingExistingDuplicates) {
		return false
	}

	const acceptSkippingInvalideDates = await partialImportConfirmation(
		rejectedEvents.get(EventImportRejectionReason.InvalidDate) ?? [],
		"importInvalidDatesInEvent_msg",
		importedParsedEvents.length,
	)
	if (!acceptSkippingInvalideDates) {
		return false
	}

	const acceptSkippingInversedDates = await partialImportConfirmation(
		rejectedEvents.get(EventImportRejectionReason.Inversed) ?? [],
		"importEndNotAfterStartInEvent_msg",
		importedParsedEvents.length,
	)
	if (!acceptSkippingInversedDates) {
		return false
	}

	const acceptSkippingPre1970 = await partialImportConfirmation(
		rejectedEvents.get(EventImportRejectionReason.Pre1970) ?? [],
		"importPre1970StartInEvent_msg",
		importedParsedEvents.length,
	)
	if (!acceptSkippingPre1970) {
		return false
	}

	return true
}

/**
 * Identifies progenitors that need to have their exclusion dates updated during an import.
 *
 * Separates progenitors that will be created for the first time (progenitorsToCreate) from progenitors that exist
 * already exist in the database and need to be updated (progenitorsToUpdate).
 *
 * @see {@link ProgenitorsToUpdateExclusionDates}
 *
 *
 * @param entityClient
 * @param alteredInstancesFromIcsFile
 * @param progenitorsFromIcsFile
 */
async function findProgenitorsToAddExcludedDates(
	entityClient: EntityClient,
	alteredInstancesFromIcsFile: EventAlarmInfoTemplatesTuple[],
	progenitorsFromIcsFile: EventAlarmInfoTemplatesTuple[],
): Promise<ProgenitorsToUpdateExclusionDates> {
	const result: ProgenitorsToUpdateExclusionDates = {
		alteredInstancesForNewProgenitors: new Map<CalendarEventProgenitor, CalendarEventAlteredInstance[]>(),
		alteredInstancesForExistingProgenitors: new Map<CalendarEventProgenitor, CalendarEventAlteredInstance[]>(),
	}

	const icsProgenitorsToCreate = groupBy(progenitorsFromIcsFile, (ev) => ev.event.uid)

	for (const alteredInstance of alteredInstancesFromIcsFile) {
		const typedAlteredInstance = alteredInstance.event as CalendarEventAlteredInstance

		const icsProgenitorToCreate = first(icsProgenitorsToCreate.get(alteredInstance.event.uid) ?? [])
		if (icsProgenitorToCreate && icsProgenitorToCreate.event.repeatRule) {
			const newProgenitors = Array.from(result.alteredInstancesForNewProgenitors.keys())
			const progenitorAsKey: CalendarEventProgenitor =
				newProgenitors.find((progenitorAsKey) => progenitorAsKey.uid === icsProgenitorToCreate.event.uid) ??
				(icsProgenitorToCreate.event as CalendarEventProgenitor)

			const knownAlteredInstances = result.alteredInstancesForNewProgenitors.get(progenitorAsKey) ?? []
			knownAlteredInstances.push(typedAlteredInstance)

			result.alteredInstancesForNewProgenitors.set(progenitorAsKey, knownAlteredInstances)
			continue
		}

		const existingProgenitors = Array.from(result.alteredInstancesForExistingProgenitors.keys())
		const progenitorAsKey: CalendarEventProgenitor =
			existingProgenitors.find((progenitorAsKey) => progenitorAsKey.uid === alteredInstance.event.uid) ??
			((await resolveCalendarEventProgenitor(alteredInstance.event, entityClient)) as CalendarEventProgenitor)

		const knownAlteredInstances = result.alteredInstancesForExistingProgenitors.get(progenitorAsKey) ?? []
		knownAlteredInstances.push(typedAlteredInstance)
		result.alteredInstancesForExistingProgenitors.set(progenitorAsKey, knownAlteredInstances)
	}

	return result
}

// FIXME: do we need to handle cases where altered instances already exist in the db, but not the iCal file?
// This could happen if a user is already invited to only an altered instance, but then gets added to the series later.
/**
 * Identifies progenitors in an incoming iCal (ics) file, and updates it with exclusion dates for all
 * altered instances that are also in the iCal file.
 *
 * The list of new progenitors should ALREADY have had duplicates removed in a previous step BEFORE doing this.
 *
 * This should be done BEFORE creating the events in the database, because doing so makes it possible
 * to create a progenitor with all its exclusion dates appended in a single server request.  Not doing so would
 * mean we must make a server request to update the progenitor each time we find a new altered instance.
 *
 * @param progenitorsToAddAlteredInstances
 * @param newProgenitors
 */
export function addExclusionsToNewProgenitors(progenitorsToAddAlteredInstances: ProgenitorsToUpdateExclusionDates) {
	for (const [progenitor, alteredInstances] of progenitorsToAddAlteredInstances.alteredInstancesForNewProgenitors.entries()) {
		for (const alteredInstance of alteredInstances) {
			const hasExcludedDate = progenitor.repeatRule?.excludedDates.some(
				(dateWrapper) => dateWrapper.date.getTime() === alteredInstance.recurrenceId!.getTime(),
			)
			if (!hasExcludedDate && isNotNull(progenitor.repeatRule)) {
				progenitor.repeatRule.excludedDates.push(createDateWrapper({ date: alteredInstance.recurrenceId! }))
			}
		}
	}
}

/**
 * Adds exclusion dates to progenitor events that already exist in the database.
 * If it finds one, it updates that progenitor with a list of all the excluded dates.
 *
 * If no progenitor is found, it does nothing.  This could happen if the user is invited to an
 * altered instance but not the progenitor.
 *
 * @see {@link ProgenitorsToUpdateExclusionDates}
 *
 * @param progenitorsToAddAlteredInstances
 * @param progenitors
 */
async function addExclusionsToExistingProgenitors(
	progenitorsToAddAlteredInstances: ProgenitorsToUpdateExclusionDates,
	entityClient: EntityClient,
	user: User,
) {
	for (const [progenitor, alteredInstances] of progenitorsToAddAlteredInstances.alteredInstancesForExistingProgenitors.entries()) {
		const updatedProgenitor = clone(progenitor)
		for (const alteredInstance of alteredInstances) {
			const hasExcludedDate = updatedProgenitor.repeatRule?.excludedDates.some(
				(dateWrapper) => dateWrapper.date.getTime() === alteredInstance.recurrenceId!.getTime(),
			)
			if (!hasExcludedDate && isNotNull(updatedProgenitor.repeatRule)) {
				updatedProgenitor.repeatRule.excludedDates.push(createDateWrapper({ date: alteredInstance.recurrenceId! }))
			}
		}

		const userAlarmListId = user.alarmInfoList?.alarms
		if (userAlarmListId) {
			const ownedAlarms = updatedProgenitor.alarmInfos.filter((alarmIdTuple) => listIdPart(alarmIdTuple) === userAlarmListId).map(elementIdPart)
			const userAlarmInfos = await entityClient.loadMultiple(UserAlarmInfoTypeRef, userAlarmListId, ownedAlarms)
			const alarmInfoTemplates: Array<AlarmInfoTemplate> = userAlarmInfos.map((userAlarmInfo) => userAlarmInfo.alarmInfo)
			await locator.calendarFacade.updateCalendarEvent(updatedProgenitor, alarmInfoTemplates, progenitor)
		}
	}
}

async function reviewAndFinishImportingEvents(
	eventsForCreation: Array<EventAlarmInfoTemplatesTuple>,
	calendarType: CalendarType,
	calendarInfo: CalendarInfoBase,
) {
	if (eventsForCreation.length > 0) {
		if (calendarType === CalendarType.External) {
			await importEvents(eventsForCreation)
		} else {
			showEventsImportDialog(
				eventsForCreation.map((ev) => ev.event),
				async (dialog) => {
					dialog.close()
					await importEvents(eventsForCreation)
				},
				"importEvents_label",
				calendarInfo,
			)
		}
	}
}

/**
 * Used to track altered instances that need to have excluded dates added to their progenitors during import operations.
 *
 * Not all other calendar providers add excluded dates to their repeating iCalendar progenitors.
 * Therefore, we need to identify all the excluded dates ourselves and add them to the appropriate progenitor.
 *
 * **progenitorsToCreate**: is a Map to track new progenitors that do not exist in a user's calendar yet,
 * and therefore exclusions can be added before first creation.
 *
 * **progenitorsToUpdate**: is a Map progenitors that already exist in a user's calendar, and therefore we need to
 * fetch and update them with these exclusions after the new altered instances have been imported and created.
 *
 * Both Maps use the *progenitor's UID as a key*, to ensure fast lookup speed if we have a large number of altered instances.
 *
 */
export type ProgenitorsToUpdateExclusionDates = {
	alteredInstancesForNewProgenitors: Map<CalendarEventProgenitor, CalendarEventAlteredInstance[]>
	alteredInstancesForExistingProgenitors: Map<CalendarEventProgenitor, CalendarEventAlteredInstance[]>
}

export async function handleCalendarImport(
	calendarGroupRoot: CalendarGroupRoot,
	calendarInfo: CalendarInfoBase,
	importedParsedEvents: ParsedEventAlarmTuple[] | null = null,
	calendarType: CalendarType = CalendarType.Private,
	entityClient: EntityClient,
	user: User,
): Promise<void> {
	const parsedEvents: ParsedEventAlarmTuple[] = importedParsedEvents ?? (await showProgressDialog("loading_msg", selectAndParseIcalFile()))
	if (parsedEvents.length === 0) {
		return showInfoSnackbar("emptyIcsFile_msg")
	}

	const existingEvents = await showProgressDialog("loading_msg", loadAllEvents(calendarGroupRoot))
	const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(parsedEvents, existingEvents, calendarGroupRoot, getTimeZone())

	const continueWithImportAndSkipRejectedEvents = await getPartialImportUserConfirmation(rejectedEvents, parsedEvents)
	if (!continueWithImportAndSkipRejectedEvents) {
		return
	}

	const alteredInstances = eventsForCreation.filter((ev) => isNotNull(ev.event.recurrenceId))
	const progenitorsToCreate = eventsForCreation.filter((ev) => isNotNull(ev.event.repeatRule))
	const progenitorsToAddAlteredInstances: ProgenitorsToUpdateExclusionDates = await findProgenitorsToAddExcludedDates(
		entityClient,
		alteredInstances,
		progenitorsToCreate,
	)

	addExclusionsToNewProgenitors(progenitorsToAddAlteredInstances) // FIXME: Add Tests
	await reviewAndFinishImportingEvents(eventsForCreation, calendarType, calendarInfo) // FIXME: Add Tests
	await addExclusionsToExistingProgenitors(progenitorsToAddAlteredInstances, entityClient, user) // FIXME: Add Tests
}

async function selectAndParseIcalFile(): Promise<ParsedEventAlarmTuple[]> {
	try {
		const allowedExtensions = ["ical", "ics", "ifb", "icalendar"]
		const dataFiles = isApp() ? await showNativeFilePicker(allowedExtensions, true) : await showFileChooser(true, allowedExtensions)
		const contents = dataFiles.map((file) => parseCalendarFile(file).contents)
		return contents.flat()
	} catch (e) {
		if (e instanceof ParserError) {
			console.log("Failed to parse file", e)
			Dialog.message(
				lang.makeTranslation(
					"confirm_msg",
					lang.get("importReadFileError_msg", {
						"{filename}": e.filename ?? "",
					}),
				),
			)
			return []
		} else {
			throw e
		}
	}
}

async function importEvents(eventsForCreation: Array<EventAlarmInfoTemplatesTuple>): Promise<void> {
	const operation = locator.operationProgressTracker.startNewOperation()
	const result = await showProgressDialog(
		"importCalendar_label",
		(async () => {
			const result = await locator.calendarFacade.createCalendarEvents(eventsForCreation, operation.id)
			if (isNotEmpty(result.failedEventErrors)) {
				throw new ImportError(getFirstOrThrow(result.failedEventErrors), "failed to create calendar events", result.failedEvents.length)
			}
			return
		})(),
		operation.progress,
	)
		.catch(
			ofClass(ImportError, (e) =>
				Dialog.message(
					lang.makeTranslation(
						"confirm_msg",
						lang.get("importEventsError_msg", {
							"{amount}": e.numFailed + "",
							"{total}": eventsForCreation.length.toString(),
						}),
					),
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
