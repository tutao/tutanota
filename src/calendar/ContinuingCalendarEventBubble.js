//@flow

import m from "mithril"
import {eventEndsAfterDay, eventStartsBefore, getEventText} from "./CalendarUtils"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"

type ContinuingCalendarEventBubbleAttrs = {|
	event: CalendarEvent,
	startDate: Date,
	endDate: Date,
	color: string,
	onEventClicked: clickHandler,
	height?: number,
	showTime: boolean,
	amPmFormat: boolean
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
						"border-top-color": "#" + defaultCalendarColor,
						"border-bottom-color": "#" + defaultCalendarColor,
					},
				})
				: null,
			m(".flex-grow.overflow-hidden",
				m(CalendarEventBubble, {
					text: getEventText(attrs.event, attrs.showTime, attrs.amPmFormat),
					color: defaultCalendarColor,
					onEventClicked: () => attrs.onEventClicked(attrs.event),
					noBorderLeft: startsBefore,
					noBorderRight: endsAfter,
					hasAlarm: attrs.event.alarmInfos.length > 0
				}),
			),
			endsAfter
				? m(".event-continues-right-arrow", {
					style: {"border-left-color": "#" + defaultCalendarColor}
				})
				: null,
		])
	}
}
