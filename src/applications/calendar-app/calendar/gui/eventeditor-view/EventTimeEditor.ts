import m, { Component, Vnode } from "mithril"
import { isApp, TimeFormat } from "@tutao/app-env"
import { lang, Translation } from "../../../../../ui/utils/LanguageViewModel.js"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { Switch } from "../../../../../ui/base/Switch.js"
import { Icon, IconSize } from "../../../../../ui/base/Icon.js"
import { Icons } from "../../../../../ui/base/icons/Icons.js"
import { theme } from "../../../../../ui/theme.js"
import { DatePicker } from "../pickers/DatePicker.js"
import { TimePicker } from "../pickers/TimePicker.js"
import { Divider } from "../../../../../ui/Divider.js"
import { BaseButton, BaseButtonAttrs } from "../../../../../ui/base/buttons/BaseButton"
import { AriaRole } from "../../../../../ui/AriaUtils"
import { ButtonColor, getColors } from "../../../../../ui/base/Button"

export type EventTimeEditorAttrs = {
	startOfTheWeekOffset: number
	timeFormat: TimeFormat
	editModel: CalendarEventWhenModel
	separateStartAndEndTimeZone: boolean
	disabled: boolean
	dateSelectionChanged: (date: Date) => void
	onTimeZoneSelectionClick: () => void
}

/**
 * an editor component to edit the start date and end date of a calendar event.
 * also allows to edit start time and end time for events where that makes sense (ie not all-day)
 */
export class EventTimeEditor implements Component<EventTimeEditorAttrs> {
	view(vnode: Vnode<EventTimeEditorAttrs>) {
		const { attrs } = vnode
		const editModel = attrs.editModel

		const renderStartTimeZone = editModel.allowsTimeZones() && attrs.separateStartAndEndTimeZone
		const renderEndTimeZone = editModel.allowsTimeZones()

		const appClasses = isApp() ? ["smaller"] : []

		const startDateComponents = attrs.editModel.getStartDate()
		const startDate = new Date(startDateComponents.year, startDateComponents.month, startDateComponents.day)

		const endDateComponents = attrs.editModel.getStartDate()
		const endDate = new Date(endDateComponents.year, endDateComponents.month, endDateComponents.day)

		return m(".flex.col.flex-grow.gap-12", [
			m(".flex.gap-8.items-center.justify-between", [
				m(Icon, {
					icon: Icons.ClockFilled,
					style: {
						fill: theme.on_surface,
					},
					title: lang.get("timeSection_label"),
					size: IconSize.PX24,
				}),
				m(
					Switch,
					{
						checked: editModel.isAllDay,
						onclick: (value) => (editModel.isAllDay = value),
						ariaLabel: lang.get("allDay_label"),
						disabled: attrs.disabled,
						variant: "normal",
					},
					lang.get("allDay_label"),
				),
			]),
			m(Divider, { color: theme.outline_variant }),
			m(".flex.col.full-width.flex-grow.gap-12", [
				m(".flex.col.gap-8", [
					m(".time-selection-grid.pr-8", [
						m("", lang.get("dateFrom_label")),
						m(
							`${isApp() ? "" : ".pl-32"}`,
							m(DatePicker, {
								classes: appClasses,
								date: startDate,
								onDateSelected: (date) => date && attrs.dateSelectionChanged(date),
								startOfTheWeekOffset: attrs.startOfTheWeekOffset,
								label: lang.getTranslation("dateFrom_label"),
								useInputButton: true,
								disabled: attrs.disabled,
							}),
						),
						m(
							".rel",
							{
								style: {
									overflow: "visible",
								},
							},
							m(TimePicker, {
								classes: appClasses,
								time: editModel.getStartTime(),
								onTimeSelected: editModel.setStartTime.bind(editModel),
								timeFormat: attrs.timeFormat,
								disabled: attrs.disabled || attrs.editModel.isAllDay,
								ariaLabel: lang.getTranslation("startTime_label"),
								renderAsTextField: false,
							}),
						),
					]),
					renderStartTimeZone && this.renderTimeZoneButton(attrs, editModel.getStartTimeZoneOrDefault()),
				]),
				m(".flex.col.gap-8", [
					m(".time-selection-grid.pr-8", [
						m("", lang.get("dateTo_label")),
						m(
							`${isApp() ? "" : ".pl-32"}`,
							m(DatePicker, {
								classes: appClasses,
								date: endDate,
								onDateSelected: (date) => date && attrs.editModel.setEndDate(date),
								startOfTheWeekOffset: attrs.startOfTheWeekOffset,
								label: lang.getTranslation("dateTo_label"),
								useInputButton: true,
								disabled: attrs.disabled,
							}),
						),
						m(
							".rel",
							{
								style: {
									overflow: "visible",
								},
							},
							m(TimePicker, {
								classes: appClasses,
								time: editModel.getEndTime(),
								onTimeSelected: editModel.setEndTime.bind(editModel),
								timeFormat: attrs.timeFormat,
								disabled: attrs.disabled || editModel.isAllDay,
								ariaLabel: lang.getTranslation("endTime_label"),
								renderAsTextField: false,
							}),
						),
					]),
					renderEndTimeZone && this.renderTimeZoneButton(attrs, editModel.getEndTimeZoneOrDefault()),
				]),
			]),
		])
	}

	private renderTimeZoneButton(attrs: EventTimeEditorAttrs, timeZone: string) {
		const selectionButtonTextTranslation: Translation = lang.makeTranslation("timeZone", timeZone.replaceAll("_", " "))

		return m(
			BaseButton,
			{
				class: `flash flex items-center text-ellipsis smaller  ml-auto ${attrs.disabled || attrs.editModel.isAllDay ? "disabled" : ""}`,
				label: selectionButtonTextTranslation,
				disabled: attrs.disabled || attrs.editModel.isAllDay,
				role: AriaRole.Button,
				onclick: attrs.onTimeZoneSelectionClick,
			} satisfies BaseButtonAttrs,
			[
				selectionButtonTextTranslation.text,
				m(Icon, {
					icon: Icons.ChevronRight,
					style: { fill: getColors(ButtonColor.Content).button },
					title: lang.get("next_action"),
					size: IconSize.PX20,
				}),
			],
		)
	}
}
