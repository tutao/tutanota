//@flow

import m from "mithril"
import {eventEndsAfterDay, eventStartsBefore, getEventText} from "./CalendarUtils"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"

type ContinuingCalendarEventBubbleAttrs = {
	date: Date, event: CalendarEvent,
	color: string,
	onEventClicked: clickHandler,
	height?: number,
	marginRight?: number
}

export class ContinuingCalendarEventBubble implements MComponent<ContinuingCalendarEventBubbleAttrs> {
	view({attrs}: Vnode<ContinuingCalendarEventBubbleAttrs>) {
		return m(".flex", [
			eventStartsBefore(attrs.date, attrs.event)
				? m(".event-continues-right-arrow", {
					style: {
						"border-left-color": "transparent",
						"border-top-color": "#" + defaultCalendarColor,
						"border-bottom-color": "#" + defaultCalendarColor,
					},
				})
				: null,
			m(".flex-grow",
				m(CalendarEventBubble, {
					text: getEventText(attrs.event),
					date: attrs.date,
					color: defaultCalendarColor,
					onEventClicked: () => attrs.onEventClicked(attrs.event),
					showText: true
				}),
			),
			eventEndsAfterDay(attrs.date, attrs.event)
				? m(".event-continues-right-arrow", {
					style: {"border-left-color": "#" + defaultCalendarColor}
				})
				: null,
		])
	}
}
