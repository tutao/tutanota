import { parseCalendarEvents, parseICalendar } from "./CalendarParser.js"
import { DataFile } from "../../../common/api/common/DataFile.js"
import { Require, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"
import { ParserError } from "../../../common/misc/parsing/ParserCombinator.js"
import { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { AlarmInfoTemplate } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { Dialog, DialogType } from "../../../common/gui/base/Dialog.js"
import { lang, TranslationText } from "../../../common/misc/LanguageViewModel.js"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig } from "../../../common/gui/base/List.js"
import { KindaCalendarRow } from "../gui/CalendarRow.js"
import { size } from "../../../common/gui/size.js"
import { DialogHeaderBar } from "../../../common/gui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../common/gui/base/Button.js"
import m from "mithril"
import { DropDownSelector, DropDownSelectorAttrs } from "../../../common/gui/base/DropDownSelector.js"
import { getSharedGroupName, hasCapabilityOnGroup } from "../../../common/sharing/GroupUtils.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { CalendarInfo } from "../model/CalendarModel.js"
import { UserController } from "../../../common/api/main/UserController.js"
import { ShareCapability } from "../../../common/api/common/TutanotaConstants.js"
import { renderCalendarColor } from "../gui/CalendarGuiUtils.js"
import { GroupColors } from "../view/CalendarView.js"

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

/** importer internals exported for testing */
export function parseCalendarStringData(value: string, zone: string): ParsedCalendarData {
	const tree = parseICalendar(value)
	return parseCalendarEvents(tree, zone)
}

/**
 * Show a dialog with a preview of a given list of events
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
						onLoadMore() {
						},
						onRangeSelectionTowards(item: CalendarEvent) {
						},
						onRetryLoading() {
						},
						onSingleSelection(item: CalendarEvent) {
						},
						onSingleTogglingMultiselection(item: CalendarEvent) {
						},
						onStopLoading() {
						},
					} satisfies ListAttrs<CalendarEvent, KindaCalendarRow>),
				),
			]),
		],
	}).show()
}

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
				} satisfies DropDownSelectorAttrs<CalendarInfo>)
			]),
		],
	}).show()
}
