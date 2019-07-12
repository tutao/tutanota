//@flow

import m from "mithril"
import {colorForBg} from "./CalendarUtils"
import {animations, opacity} from "../gui/animation/Animations"
import {px, size} from "../gui/size"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"

export type CalendarEventBubbleAttrs = {
	text: string,
	secondLineText?: string,
	color: string,
	hasAlarm: boolean,
	onEventClicked: clickHandler,
	height?: number,
	noBorderRight?: boolean,
	noBorderLeft?: boolean,
	verticalPadding?: number
}


const defaultBubbleHeight = size.calendar_line_height

export class CalendarEventBubble implements MComponent<CalendarEventBubbleAttrs> {

	view({attrs}: Vnode<CalendarEventBubbleAttrs>): Children {
		return m(".calendar-event.small.overflow-hidden.flex"
			+ (attrs.noBorderLeft ? ".event-continues-left" : "")
			+ (attrs.noBorderRight ? ".event-continues-right" : "")
			, {
				style: {
					background: "#" + attrs.color,
					color: colorForBg(attrs.color),
					opacity: '0',
					minHeight: px(defaultBubbleHeight),
					height: px(attrs.height ? attrs.height : defaultBubbleHeight),
					"padding-top": px(attrs.verticalPadding)
				},
				oncreate: (vnode) => animations.add(vnode.dom, opacity(0, 1, true)),
				onbeforeremove: (vnode) => animations.add(vnode.dom, opacity(1, 0, true)),
				onclick: (e) => {
					e.stopPropagation()
					attrs.onEventClicked(e)
				}
			}, [
				attrs.hasAlarm
					? m(Icon, {
						icon: Icons.Notifications,
						style: {fill: colorForBg(attrs.color), "padding-top": "2px", "padding-right": "2px"},
						class: "icon-small",
					})
					: null,
				m(".flex.col", [
					m("", {style: {lineHeight: px(defaultBubbleHeight),}}, attrs.text),
					attrs.secondLineText ? m("", attrs.secondLineText) : null
				])
			])
	}

}
