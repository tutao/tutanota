//@flow

import m from "mithril"
import {colorForBg} from "../date/CalendarUtils"
import {px, size} from "../../gui/size"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"

export type CalendarEventBubbleAttrs = {
	text: string,
	secondLineText?: string,
	color: string,
	hasAlarm: boolean,
	click: clickHandler,
	height?: number,
	noBorderRight?: boolean,
	noBorderLeft?: boolean,
	verticalPadding?: number
}


const defaultBubbleHeight = size.calendar_line_height

export class CalendarEventBubble implements MComponent<CalendarEventBubbleAttrs> {

	view({attrs}: Vnode<CalendarEventBubbleAttrs>): Children {
		return m(".calendar-event.small.overflow-hidden.flex.fade-in"
			+ (attrs.noBorderLeft ? ".event-continues-left" : "")
			+ (attrs.noBorderRight ? ".event-continues-right" : "")
			, {
				style: {
					background: "#" + attrs.color,
					color: colorForBg(attrs.color),
					minHeight: px(defaultBubbleHeight),
					height: px(attrs.height ? attrs.height : defaultBubbleHeight),
					"padding-top": px(attrs.verticalPadding || 0),
				},
				onclick: (e) => {
					e.stopPropagation()
					attrs.click(e, e.target)
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
