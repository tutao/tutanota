import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../gui/base/icons/Icons.js"

type TodayIconButtonAttrs = Omit<IconButtonAttrs, "icon" | "title" | "svgParameters">

/**
 * Button that has a current day number displayed in it.
 */
export class TodayIconButton implements Component<TodayIconButtonAttrs> {
	view(vnode: Vnode<TodayIconButtonAttrs>): Children {
		const { attrs } = vnode
		return m(IconButton, {
			...attrs,
			icon: Icons.Today,
			title: "today_label",
			svgParameters: { date: new Date().getDate().toString() },
			iconClass: "icon-large svg-text-content-bg",
		})
	}
}
