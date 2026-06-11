import m, { Component, Vnode } from "mithril"
import { isApp, TimeFormat } from "@tutao/app-env"
import { lang } from "../../../../../ui/utils/LanguageViewModel.js"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { Switch } from "../../../../../ui/base/Switch.js"
import { Icon, IconSize } from "../../../../../ui/base/Icon.js"
import { Icons } from "../../../../../ui/base/icons/Icons.js"
import { theme } from "../../../../../ui/theme.js"
import { DatePicker } from "../pickers/DatePicker.js"
import { TimePicker } from "../pickers/TimePicker.js"
import { px, size } from "../../../../../ui/size.js"
import { Divider } from "../../../../../ui/Divider.js"
import { InputAttrs, SingleLineTextField } from "../../../../../ui/base/SingleLineTextField"
import { LegacyTextFieldType } from "../../../../../ui/base/LegacyTextField"
import { formatEventDuration } from "../CalendarGuiUtils"

export type EventTimeEditorAttrs = {
	startOfTheWeekOffset: number
	timeFormat: TimeFormat
	editModel: CalendarEventWhenModel
	disabled: boolean
	dateSelectionChanged: (date: Date) => void
}

/**
 * an editor component to edit the start date and end date of a calendar event.
 * also allows to edit start time and end time for events where that makes sense (ie not all-day)
 */
export class EventTimeEditor implements Component<EventTimeEditorAttrs> {
	view(vnode: Vnode<EventTimeEditorAttrs>) {
		const { attrs } = vnode
		const { startOfTheWeekOffset, editModel, timeFormat, disabled } = attrs

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
							disabled: disabled,
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
								onDateSelected: (date) => date && vnode.attrs.dateSelectionChanged(date),
								startOfTheWeekOffset,
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
								time: editModel.getStartTime(true),
								onTimeSelected: (time) => (editModel.startTime = time),
								timeFormat,
								disabled: attrs.disabled || attrs.editModel.isAllDay,
								ariaLabel: "startTime_label",
								renderAsTextField: false,
							}),
						),
						m("", lang.get("dateTo_label")),
						m(
							`${isApp() ? "" : ".pl-32"}`,
							m(DatePicker, {
								classes: appClasses,
								date: attrs.editModel.endDate,
								onDateSelected: (date) => date && (editModel.endDate = date),
								startOfTheWeekOffset,
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
								time: editModel.getEndTime(true),
								onTimeSelected: (time) => (editModel.endTime = time),
								timeFormat,
								disabled: attrs.disabled || attrs.editModel.isAllDay,
								ariaLabel: "endTime_label",
								renderAsTextField: false,
							}),
						),
					]),
					!editModel.isAllDay
						? m(
								"small.text-fade",
								formatEventDuration(
									{
										startTime: editModel.getStartTime(false).toDate(new Date(editModel.startDate)),
										endTime: editModel.getEndTime(false).toDate(new Date(editModel.endDate)),
									},
									editModel.calendarTimeZone,
									editModel.calendarTimeZone,
									true,
									"longGeneric",
								),
							)
						: null,
					m(".flex.col", [
						m(SingleLineTextField, {
							type: LegacyTextFieldType.Text,
							value: editModel.startTimeZone ?? "",
							ariaLabel: lang.getTranslation("dataOutOfSync_msg").text,
							oninput: (newValue: string) => {
								editModel.startTimeZone = newValue
								m.redraw()
							},
							placeholder: "Start timezone",
							disabled: editModel.isAllDay,
							// classes: ["custom-text-color"], // Adding new styles
							// style: {
							// 	"font-size": px(font_size.base * 1.25), // Overriding the component style
							// },
						} satisfies InputAttrs<LegacyTextFieldType.Text>),
						m(SingleLineTextField, {
							type: LegacyTextFieldType.Text,
							value: editModel.endTimeZone ?? "",
							ariaLabel: lang.getTranslation("dataOutOfSync_msg").text,
							oninput: (newValue: string) => {
								editModel.endTimeZone = newValue
								m.redraw()
							},
							placeholder: "End timezone",
							disabled: editModel.isAllDay,
							// classes: ["custom-text-color"], // Adding new styles
							// style: {
							// 	"font-size": px(font_size.base * 1.25), // Overriding the component style
							// },
						} satisfies InputAttrs<LegacyTextFieldType.Text>),
					]),
				]),
			]),
		])
	}
}
