import { lang } from "../misc/LanguageViewModel.js"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander.js"
import m, { Child, ChildArray, Children, ClassComponent, Component, Vnode } from "mithril"
import Stream from "mithril/stream"

export interface SettingsNotificationTargetsAttrs {
	rowAdd: Child
	rows: ChildArray
	onExpandedChange: Stream<boolean>
}

export class SettingsNotificationTargets implements Component<SettingsNotificationTargetsAttrs> {
	view(vnode: Vnode<SettingsNotificationTargetsAttrs>) {
		return m("", [
			m(".flex-space-between.items-center.mt-s.mb-s", [
				m(".h5", lang.get("notificationTargets_label")),
				m(ExpanderButton, {
					label: "show_action",
					expanded: vnode.attrs.onExpandedChange(),
					onExpandedChange: vnode.attrs.onExpandedChange,
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: vnode.attrs.onExpandedChange(),
				},
				m(".flex.flex-column.items-end.mb", [vnode.attrs.rowAdd, ...vnode.attrs.rows]),
			),
			m(".small", lang.get("pushIdentifierInfoMessage_msg")),
		])
	}
}
