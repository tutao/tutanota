//@flow

import m from "mithril"
import {getEventText, hasAlarmsForTheUser} from "./CalendarUtils"
import type {EventTextTimeOptionEnum} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"

type ContinuingCalendarEventBubbleAttrs = {|
	event: CalendarEvent,
	startsBefore: boolean,
	endsAfter: boolean,
	color: string,
	onEventClicked: (event: CalendarEvent, domEvent: Event) => mixed,
	showTime: EventTextTimeOptionEnum,
|}

export class ContinuingCalendarEventBubble implements MComponent<ContinuingCalendarEventBubbleAttrs> {

	view({attrs}: Vnode<ContinuingCalendarEventBubbleAttrs>): Children {
		return m(".flex.calendar-event-cont.darker-hover", [
			attrs.startsBefore
				? m(".event-continues-right-arrow", {
					style: {
						"border-left-color": "transparent",
						"border-top-color": "#" + attrs.color,
						"border-bottom-color": "#" + attrs.color,
					},
				})
				: null,
			m(".flex-grow.overflow-hidden",
				m(CalendarEventBubble, {
					text: getEventText(attrs.event, attrs.showTime),
					color: attrs.color,
					click: (e) => attrs.onEventClicked(attrs.event, e),
					noBorderLeft: attrs.startsBefore,
					noBorderRight: attrs.endsAfter,
					hasAlarm: hasAlarmsForTheUser(attrs.event)
				}),
			),
			attrs.endsAfter
				? m(".event-continues-right-arrow", {
					style: {"border-left-color": "#" + attrs.color}
				})
				: null,
		])
	}
}
