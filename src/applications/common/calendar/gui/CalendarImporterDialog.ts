import { elementIdPart, isSameId, listIdPart } from "@tutao/meta"
import { showFileChooser, showNativeFilePicker } from "../../file/FileController.js"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { Dialog, DialogType } from "../../../../ui/base/Dialog.js"
import { lang, MaybeTranslation } from "../../../../ui/utils/LanguageViewModel.js"
import { serializeCalendar } from "../../../calendar-app/calendar/export/CalendarExporter.js"
import { locator } from "../../api/main/CommonLocator.js"
import { promiseMap, stringToUtf8Uint8Array } from "@tutao/utils"
import { CalendarInfo, CalendarInfoBase, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel"
import { isApp, ShareCapability } from "@tutao/app-env"
import { CALENDAR_MIME_TYPE } from "../../../../platform-kit/utils/FileConstants"
import { CalendarEvent, CalendarEventTypeRef, CalendarGroupRoot, createFile } from "@tutao/entities/tutanota"
import { convertToDataFile } from "../../api/worker/utils/DataFile"
import { UserAlarmInfo, UserAlarmInfoTypeRef } from "@tutao/entities/sys"
import { CalendarEventAlteredInstance, CalendarEventProgenitor } from "../../api/worker/facades/lazy/CalendarFacade"

import { CalendarImporter } from "../import/CalendarImporter"
import { UserController } from "../../api/main/UserController.js"
import { parseCalendarFile, ParsedEventAlarmTuple } from "../../../calendar-app/calendar/export/CalendarParser"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig } from "../../../../ui/base/List"
import { KindaCalendarRow } from "../../../calendar-app/calendar/gui/CalendarRow"
import { component_size } from "../../../../ui/size"
import m from "mithril"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { ButtonType } from "../../../../ui/base/Button"
import { GroupColors } from "../../../calendar-app/calendar/view/CalendarView"
import { hasCapabilityOnGroup } from "../../../../entities/sys/Utils"
import { DropDownSelector, DropDownSelectorAttrs } from "../../../../ui/base/DropDownSelector"
import { getSharedGroupName } from "../../sharing/GroupUtils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { renderCalendarColor } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"

/**
 * Shows a dialog with a preview of a given list of events
 * @param events The event list to be previewed
 * @param okAction The action to be executed when the user press the ok or continue button
 * @param title
 * @param calendarInfo
 */
export function showEventsImportDialog(
	events: CalendarEvent[],
	okAction: (dialog: Dialog) => unknown,
	title: MaybeTranslation,
	calendarInfo: CalendarInfoBase,
) {
	const renderConfig: RenderConfig<CalendarEvent, KindaCalendarRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			return new KindaCalendarRow(dom, [calendarInfo])
		},
	}

	const dialog = new Dialog(DialogType.EditSmall, {
		view: () => [
			m(DialogHeaderBar, {
				left: [
					{
						type: ButtonType.Secondary,
						label: "cancel_action",
						click: () => {
							dialog.close()
						},
					},
				],
				middle: title,
				right: [
					{
						type: ButtonType.Primary,
						label: "import_action",
						click: () => {
							okAction(dialog)
						},
					},
				],
			}),
			/** variable-size child container that may be scrollable. */
			m(".dialog-max-height.plr-4.pb-16.text-break.nav-bg", [
				m(
					".flex.col.rel.mt-8",
					{
						style: {
							height: "80vh",
						},
					},
					m(List, {
						renderConfig,
						state: {
							items: events,
							loadingStatus: ListLoadingState.Done,
							loadingAll: false,
							inMultiselect: true,
							activeIndex: null,
							selectedItems: new Set(),
						},
						onLoadMore() {},
						onRangeSelectionTowards(item: CalendarEvent) {},
						onRetryLoading() {},
						onSingleSelection(item: CalendarEvent) {},
						onSingleTogglingMultiselection(item: CalendarEvent) {},
						onStopLoading() {},
					} satisfies ListAttrs<CalendarEvent, KindaCalendarRow>),
				),
			]),
		],
	}).show()
}

/**
 * Shows a dialog with user's calendars that are able to receive new events
 * @param calendars List of user's calendars
 * @param userController
 * @param groupColors List of calendar's colors
 * @param okAction
 */
export function calendarSelectionDialog(
	calendars: CalendarInfo[],
	userController: UserController,
	groupColors: GroupColors,
	okAction: (dialog: Dialog, selectedCalendar: CalendarInfo) => unknown,
) {
	const availableCalendars = calendars.filter(
		(calendarInfo) => hasCapabilityOnGroup(userController.user, calendarInfo.group, ShareCapability.Write) && !calendarInfo.isExternal,
	)
	let selectedCalendar = availableCalendars[0]

	const dialog = new Dialog(DialogType.EditSmall, {
		view: () => [
			m(DialogHeaderBar, {
				left: [
					{
						type: ButtonType.Secondary,
						label: "cancel_action",
						click: () => {
							dialog.close()
						},
					},
				],
				middle: "calendar_label",
				right: [
					{
						type: ButtonType.Primary,
						label: "pricing.select_action",
						click: () => {
							okAction(dialog, selectedCalendar)
						},
					},
				],
			}),

			m(".dialog-max-height.plr-24.pt-16.pb-16.text-break.scroll", [
				m(".text-break.selectable", lang.get("calendarImportSelection_label")),
				m(DropDownSelector, {
					label: "calendar_label",
					items: availableCalendars.map((calendarInfo) => {
						return {
							name: getSharedGroupName(calendarInfo.groupInfo, userController.userSettingsGroupRoot, calendarInfo.hasMultipleMembers),
							value: calendarInfo,
						}
					}),
					selectedValue: selectedCalendar,
					selectionChangedHandler: (v) => (selectedCalendar = v),
					icon: Icons.ArrowDown,
					disabled: availableCalendars.length < 2,
					helpLabel: () => renderCalendarColor(selectedCalendar, groupColors),
				} satisfies DropDownSelectorAttrs<CalendarInfo>),
			]),
		],
	}).show()
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

export async function selectAndParseIcalFile(): Promise<ParsedEventAlarmTuple[]> {
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

/**
 * Handle the import of calendar events with preview of events to be imported
 * @param calendarModel
 * @param userController
 * @param events The event list to be previewed and imported
 * @param calendarImporter
 */
export async function importCalendarFile(
	calendarModel: CalendarModel,
	userController: UserController,
	events: ParsedEventAlarmTuple[],
	calendarImporter: CalendarImporter,
) {
	const groupSettings = userController.userSettingsGroupRoot.groupSettings
	const calendarInfos = await calendarModel.getCalendarInfos()
	const groupColors: Map<Id, string> = groupSettings.reduce((acc, gc) => {
		acc.set(gc.group, gc.color)
		return acc
	}, new Map())

	calendarSelectionDialog(Array.from(calendarInfos.values()), userController, groupColors, (dialog, selectedCalendar) => {
		dialog.close()
		calendarImporter.import(selectedCalendar.groupRoot, selectedCalendar, events, CalendarImporter.classifyImportedEvents, selectedCalendar.type)
	})
}
