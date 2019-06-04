//@flow

import m from "mithril"
import {eventEndsAfterDay, eventStartsBefore} from "./CalendarUtils"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import type {CalendarEventBubbleAttrs} from "./CalendarEventBubble"
import {CalendarEventBubble} from "./CalendarEventBubble"

type ContinuingCalendarEventBubbleAttrs = CalendarEventBubbleAttrs

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
					event: attrs.event,
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
