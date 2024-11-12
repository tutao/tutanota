import m, { Component, Vnode } from "mithril"
import { TimeFormat } from "../../../../common/api/common/TutanotaConstants.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { Switch } from "../../../../common/gui/base/Switch.js"
import { Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { theme } from "../../../../common/gui/theme.js"
import { isApp } from "../../../../common/api/common/Env.js"
import { DatePicker } from "../pickers/DatePicker.js"
import { TimePicker } from "../pickers/TimePicker.js"

export type EventTimeEditorAttrs = {
	startOfTheWeekOffset: number
	timeFormat: TimeFormat
	editModel: CalendarEventWhenModel
	disabled: boolean
}

/**
 * an editor component to edit the start date and end date of a calendar event.
 * also allows to edit start time and end time for events where that makes sense (ie not all-day)
 */
export class EventTimeEditor implements Component<EventTimeEditorAttrs> {
	view(vnode: Vnode<EventTimeEditorAttrs>) {
		const { attrs } = vnode
		const { startOfTheWeekOffset, editModel, timeFormat, disabled } = attrs

		const amPm = timeFormat === TimeFormat.TWELVE_HOURS

		return m(".flex.gap-vpad-sm", [
			m(Icon, {
				icon: Icons.Time,
				style: {
					fill: theme.content_fg,
				},
				title: lang.get("timeSection_label"),
				size: IconSize.Medium,
			}),
			m(".flex.col.flex-grow.gap-vpad-sm-15", [
				m(
					Switch,
					{
						checked: editModel.isAllDay,
						onclick: (value) => (editModel.isAllDay = value),
						ariaLabel: lang.get("allDay_label"),
						disabled: disabled,
						variant: "expanded",
					},
					lang.get("allDay_label"),
				),
				m(".time-selection-grid", [
					m("", lang.get("dateFrom_label")),
					m(
						`${isApp() ? "" : ".pl-vpad-l"}`,
						m(DatePicker, {
							date: attrs.editModel.startDate,
							onDateSelected: (date) => date && (editModel.startDate = date),
							startOfTheWeekOffset,
							label: "dateFrom_label",
							useInputButton: true,
							disabled: attrs.disabled,
						}),
					),
					m(
						"",
						m(TimePicker, {
							time: editModel.startTime,
							onTimeSelected: (time) => (editModel.startTime = time),
							timeFormat,
							disabled: attrs.disabled || attrs.editModel.isAllDay,
							ariaLabel: lang.get("startTime_label"),
						}),
					),
					m("", lang.get("dateTo_label")),
					m(
						`${isApp() ? "" : ".pl-vpad-l"}`,
						m(DatePicker, {
							date: attrs.editModel.endDate,
							onDateSelected: (date) => date && (editModel.endDate = date),
							startOfTheWeekOffset,
							label: "dateTo_label",
							useInputButton: true,
							disabled: attrs.disabled,
						}),
					),
					m(
						"",
						m(TimePicker, {
							time: editModel.endTime,
							onTimeSelected: (time) => (editModel.endTime = time),
							timeFormat,
							disabled: attrs.disabled || attrs.editModel.isAllDay,
							ariaLabel: lang.get("endTime_label"),
						}),
					),
				]),
			]),
		])
	}
}
