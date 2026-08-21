import m, { Component, Vnode } from "mithril"
import { EnvProvider, TimeFormat } from "@tutao/app-env"
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

		let displayStartTimeZone: string | null = null
		let displayEndTimeZone: string | null = null
		if (editModel.allowsTimeZones()) {
			if (attrs.separateStartAndEndTimeZone) {
				displayStartTimeZone = editModel.getEffectiveStartTimeZone()
			}
			displayEndTimeZone = editModel.getEffectiveEndTimeZone()
		}

		const appClasses = EnvProvider.get().isApp() ? ["smaller"] : []

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
			m(".time-selection-grid", [
				m("", lang.get("dateFrom_label")),
				m(DatePicker, {
					classes: [EnvProvider.get().isApp() ? "" : "pl-32"],
					date: attrs.editModel.startDate,
					onDateSelected: (date) => date && attrs.dateSelectionChanged(date),
					startOfTheWeekOffset: attrs.startOfTheWeekOffset,
					label: lang.getTranslation("dateFrom_label"),
					useInputButton: true,
					disabled: attrs.disabled,
				}),
				m(TimePicker, {
					time: editModel.startTime,
					onTimeSelected: (time) => (editModel.startTime = time),
					timeFormat: attrs.timeFormat,
					disabled: attrs.disabled || attrs.editModel.isAllDay,
					valid: editModel.hasValidStartBeforeEnd(),
					ariaLabel: lang.getTranslation("startTime_label"),
					forMailSendTime: false,
				}),
				displayStartTimeZone && this.renderTimeZoneButton(attrs, displayStartTimeZone),
			]),
			m(".time-selection-grid", [
				m("", lang.get("dateTo_label")),
				m(DatePicker, {
					classes: [EnvProvider.get().isApp() ? "" : "pl-32"],
					date: attrs.editModel.endDate,
					onDateSelected: (date) => date && (attrs.editModel.endDate = date),
					startOfTheWeekOffset: attrs.startOfTheWeekOffset,
					label: lang.getTranslation("dateTo_label"),
					useInputButton: true,
					disabled: attrs.disabled,
				}),
				m(TimePicker, {
					time: editModel.endTime,
					onTimeSelected: (time) => (editModel.endTime = time),
					timeFormat: attrs.timeFormat,
					disabled: attrs.disabled || editModel.isAllDay,
					valid: editModel.hasValidStartBeforeEnd(),
					ariaLabel: lang.getTranslation("endTime_label"),
					forMailSendTime: false,
				}),
				displayEndTimeZone && this.renderTimeZoneButton(attrs, displayEndTimeZone),
			]),
		])
	}

	private renderTimeZoneButton(attrs: EventTimeEditorAttrs, timeZone: string) {
		const selectionButtonTextTranslation: Translation = lang.makeTranslation("timeZone", timeZone.replaceAll("_", " "))

		return m(
			BaseButton,
			{
				class: `fill-grid-row flash flex items-center text-ellipsis smaller ml-auto ${attrs.disabled || attrs.editModel.isAllDay ? "disabled" : ""}`,
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
