//@flow

import m from "mithril"
import {eventEndsAfterDay, eventStartsBefore, getEventText, hasAlarmsForTheUser} from "./CalendarUtils"
import type {EventTextTimeOptionEnum} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"

type ContinuingCalendarEventBubbleAttrs = {|
	event: CalendarEvent,
	startDate: Date,
	endDate: Date,
	color: string,
	onEventClicked: clickHandler,
	showTime: EventTextTimeOptionEnum,
|}

export class ContinuingCalendarEventBubble implements MComponent<ContinuingCalendarEventBubbleAttrs> {

	view({attrs}: Vnode<ContinuingCalendarEventBubbleAttrs>) {
		const startsBefore = eventStartsBefore(attrs.startDate, attrs.event)
		const endsAfter = eventEndsAfterDay(attrs.endDate, attrs.event)

		return m(".flex.calendar-event-cont.darker-hover", [
			startsBefore
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
					onEventClicked: () => attrs.onEventClicked(attrs.event),
					noBorderLeft: startsBefore,
					noBorderRight: endsAfter,
					hasAlarm:  hasAlarmsForTheUser(attrs.event)
				}),
			),
			endsAfter
				? m(".event-continues-right-arrow", {
					style: {"border-left-color": "#" + attrs.color}
				})
				: null,
		])
	}
}
