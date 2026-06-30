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
import { px, size } from "../../../../../ui/size.js"
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

		return m(".flex", [
			m(".flex.col.flex-grow.gap-8", [
				m(".flex.gap-8.items-center.pr-8", [
					m(Icon, {
						icon: Icons.ClockOutlines,
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
							variant: "expanded",
						},
						lang.get("allDay_label"),
					),
				]),
				m(".flex.col.full-width.flex-grow.gap-8", { style: { paddingLeft: px(size.icon_24 + size.spacing_8) } }, [
					m(Divider, { color: theme.outline_variant }),
					m(".time-selection-grid.pr-8", [
						m("", lang.get("dateFrom_label")),
						m(
							`${isApp() ? "" : ".pl-32"}`,
							m(DatePicker, {
								classes: appClasses,
								date: attrs.editModel.startDate,
								onDateSelected: (date) => date && attrs.dateSelectionChanged(date),
								startOfTheWeekOffset: attrs.startOfTheWeekOffset,
								label: "dateFrom_label",
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
								time: editModel.startTime,
								onTimeSelected: (time) => (editModel.startTime = time),
								timeFormat: attrs.timeFormat,
								disabled: attrs.disabled || attrs.editModel.isAllDay,
								ariaLabel: "startTime_label",
								renderAsTextField: false,
							}),
						),
					]),
					renderStartTimeZone && this.renderTimeZoneButton(attrs, editModel.getStartTimeZoneOrDefault()),
					m(".time-selection-grid.pr-8", [
						m("", lang.get("dateTo_label")),
						m(
							`${isApp() ? "" : ".pl-32"}`,
							m(DatePicker, {
								classes: appClasses,
								date: attrs.editModel.endDate,
								onDateSelected: (date) => date && (attrs.editModel.endDate = date),
								startOfTheWeekOffset: attrs.startOfTheWeekOffset,
								label: "dateTo_label",
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
								time: editModel.endTime,
								onTimeSelected: (time) => (editModel.endTime = time),
								timeFormat: attrs.timeFormat,
								disabled: attrs.disabled || editModel.isAllDay,
								ariaLabel: "endTime_label",
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
				class: `flash button-min-height flex items-center right text-ellipsis ${attrs.disabled || attrs.editModel.isAllDay ? "disabled" : ""}`,
				label: selectionButtonTextTranslation,
				disabled: attrs.disabled || attrs.editModel.isAllDay,
				role: AriaRole.Button,
				onclick: attrs.onTimeZoneSelectionClick,
			} satisfies BaseButtonAttrs,
			[
				m("span.flex-grow.full-width.white-space", selectionButtonTextTranslation.text),
				m(Icon, {
					icon: Icons.ChevronRight,
					style: { fill: getColors(ButtonColor.Content).button },
					title: lang.get("next_action"),
					size: IconSize.PX24,
				}),
			],
		)
	}
}
