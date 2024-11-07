import m, { Component, Vnode } from "mithril"
import { TimeFormat } from "../../../../common/api/common/TutanotaConstants.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { Switch } from "../../../../common/gui/base/Switch.js"
import { Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { theme } from "../../../../common/gui/theme.js"

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
		const { startOfTheWeekOffset, editModel, timeFormat } = attrs

		return m(".flex.gap-vpad-sm", [
			m(Icon, {
				icon: Icons.Notifications,
				style: {
					fill: theme.content_fg,
				},
				title: lang.get("timeSection_label"),
				size: IconSize.Medium,
			}),
			m(".flex.col.flex-grow.gap-vpad-sm", [
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
				m(".time-selection-grid", [
					m("", "Placeholder"),
					m("", "Placeholder"),
					m("", "Placeholder"),
					m("", "Placeholder"),
					m("", "Placeholder"),
					m("", "Placeholder"),
				]),
			]),
		])
	}
}
