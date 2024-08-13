import { DataFile } from "../../api/common/DataFile.js"
import { Require, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { getTimeZone } from "../date/CalendarUtils.js"
import { ParserError } from "../../misc/parsing/ParserCombinator.js"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { AlarmInfoTemplate } from "../../api/worker/facades/lazy/CalendarFacade.js"
import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import { lang, TranslationText } from "../../misc/LanguageViewModel.js"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig } from "../../gui/base/List.js"
import { KindaCalendarRow } from "../../../calendar-app/calendar/gui/CalendarRow.js"
import { size } from "../../gui/size.js"
import { DialogHeaderBar } from "../../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../../gui/base/Button.js"
import m from "mithril"
import { DropDownSelector, DropDownSelectorAttrs } from "../../gui/base/DropDownSelector.js"
import { getSharedGroupName, hasCapabilityOnGroup } from "../../sharing/GroupUtils.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { UserController } from "../../api/main/UserController.js"
import { ShareCapability } from "../../api/common/TutanotaConstants.js"
import { renderCalendarColor } from "../../../calendar-app/calendar/gui/CalendarGuiUtils.js"
import { GroupColors } from "../../../calendar-app/calendar/view/CalendarView.js"
import { handleCalendarImport } from "./CalendarImporterDialog.js"
import { parseCalendarStringData } from "./ImportExportUtils.js"

export type ParsedEvent = {
	event: Require<"uid", CalendarEvent>
	alarms: Array<AlarmInfoTemplate>
}
export type ParsedCalendarData = {
	method: string
	contents: Array<ParsedEvent>
}

/** given an ical datafile, get the parsed calendar events with their alarms as well as the ical method */
export function parseCalendarFile(file: DataFile): ParsedCalendarData {
	try {
		const stringData = utf8Uint8ArrayToString(file.data)
		return parseCalendarStringData(stringData, getTimeZone())
	} catch (e) {
		if (e instanceof ParserError) {
			throw new ParserError(e.message, file.name)
		} else {
			throw e
		}
	}
}

/**
 * Shows a dialog with a preview of a given list of events
 * @param events The event list to be previewed
 * @param okAction The action to be executed when the user press the ok or continue button
 * @param title
 */
export function showEventsImportDialog(events: CalendarEvent[], okAction: (dialog: Dialog) => unknown, title: TranslationText) {
	const renderConfig: RenderConfig<CalendarEvent, KindaCalendarRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			return new KindaCalendarRow(dom)
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
				middle: () => lang.getMaybeLazy(title),
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
			m(".dialog-max-height.plr-s.pb.text-break.nav-bg", [
				m(
					".flex.col.rel.mt-s",
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
 * Handle the import of calendar events with preview of events to be imported
 * @param calendarModel
 * @param userController
 * @param events The event list to be previewed and imported
 */
export async function importCalendarFile(calendarModel: CalendarModel, userController: UserController, events: ParsedEvent[]) {
	const groupSettings = userController.userSettingsGroupRoot.groupSettings
	const calendarInfos = await calendarModel.getCalendarInfos()
	const groupColors: Map<Id, string> = groupSettings.reduce((acc, gc) => {
		acc.set(gc.group, gc.color)
		return acc
	}, new Map())

	calendarSelectionDialog(Array.from(calendarInfos.values()), userController, groupColors, (dialog, selectedCalendar) => {
		dialog.close()
		handleCalendarImport(selectedCalendar.groupRoot, events)
	})
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
	const availableCalendars = calendars.filter((calendarInfo) => hasCapabilityOnGroup(userController.user, calendarInfo.group, ShareCapability.Write))
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
				middle: () => lang.getMaybeLazy("calendar_label"),
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

			m(".dialog-max-height.plr-l.pt.pb.text-break.scroll", [
				m(".text-break.selectable", lang.get("calendarImportSelection_label")),
				m(DropDownSelector, {
					label: "calendar_label",
					items: availableCalendars.map((calendarInfo) => {
						return {
							name: getSharedGroupName(calendarInfo.groupInfo, userController, calendarInfo.shared),
							value: calendarInfo,
						}
					}),
					selectedValue: selectedCalendar,
					selectionChangedHandler: (v) => (selectedCalendar = v),
					icon: BootIcons.Expand,
					disabled: availableCalendars.length < 2,
					helpLabel: () => renderCalendarColor(selectedCalendar, groupColors),
				} satisfies DropDownSelectorAttrs<CalendarInfo>),
			]),
		],
	}).show()
}
