//@flow

import m from "mithril"
import {colorForBg, isAllDayEvent, timeString} from "./CalendarUtils"
import {animations, opacity} from "../gui/animation/Animations"
import {px, size} from "../gui/size"

export type CalendarEventBubbleAttrs = {
	event: CalendarEvent,
	color: string,
	onEventClicked: clickHandler,
	height?: number,
	marginRight?: number
}


const defaultBubbleHeight = size.calendar_line_height

export class CalendarEventBubble implements MComponent<CalendarEventBubbleAttrs> {

	view(vnode: Vnode<CalendarEventBubbleAttrs>): Children {
		const attrs = vnode.attrs
		return m(".calendar-event.small.overflow-hidden"
			// + (eventStartsBefore(attrs.date, attrs.event) ? ".event-continues-left" : "")
			// + (eventEndsAfterDay(attrs.date, attrs.event) ? ".event-continues-right" : "")
			, {
				style: {
					background: "#" + attrs.color,
					color: colorForBg(attrs.color),
					opacity: '0',
					minHeight: px(defaultBubbleHeight),
					height: px(attrs.height ? attrs.height : defaultBubbleHeight),
					lineHeight: px(defaultBubbleHeight)
				},
				oncreate: (vnode) => animations.add(vnode.dom, opacity(0, 1, true)),
				onbeforeremove: (vnode) => animations.add(vnode.dom, opacity(1, 0, true)),
				onclick: (e) => {
					e.stopPropagation()
					attrs.onEventClicked(e)
				}
			}, this._getEventText(attrs.event))
	}

	_getEventText(event: CalendarEvent): string {
		if (isAllDayEvent(event)) {
			return event.summary
		} else {
			return timeString(event.startTime) + " " + event.summary
		}
	}

}
