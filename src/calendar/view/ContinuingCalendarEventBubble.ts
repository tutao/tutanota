import m, { Children, Component, Vnode } from "mithril"
import { hasAlarmsForTheUser } from "../date/CalendarUtils"
import { CalendarEventBubble } from "./CalendarEventBubble"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import type { User } from "../../api/entities/sys/TypeRefs.js"
import type { EventTextTimeOption } from "../../api/common/TutanotaConstants"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyUpHandler } from "./CalendarViewModel"
import { formatEventTime } from "../gui/CalendarGuiUtils.js"

type ContinuingCalendarEventBubbleAttrs = {
	event: CalendarEvent
	startsBefore: boolean
	endsAfter: boolean
	color: string
	onEventClicked: CalendarEventBubbleClickHandler
	onEventKeyUp: CalendarEventBubbleKeyUpHandler
	showTime: EventTextTimeOption | null
	user: User
	fadeIn: boolean
	opacity: number
	enablePointerEvents: boolean
}

export class ContinuingCalendarEventBubble implements Component<ContinuingCalendarEventBubbleAttrs> {
	view({ attrs }: Vnode<ContinuingCalendarEventBubbleAttrs>): Children {
		return m(".flex.calendar-event-container.darker-hover", [
			attrs.startsBefore
				? m(".event-continues-right-arrow", {
						style: {
							"border-left-color": "transparent",
							"border-top-color": "#" + attrs.color,
							"border-bottom-color": "#" + attrs.color,
							opacity: attrs.opacity,
						},
				  })
				: null,
			m(
				".flex-grow.overflow-hidden",
				m(CalendarEventBubble, {
					text: (attrs.showTime != null ? formatEventTime(attrs.event, attrs.showTime) + " " : "") + attrs.event.summary,
					color: attrs.color,
					click: (e) => attrs.onEventClicked(attrs.event, e),
					keyUp: (e) => attrs.onEventKeyUp(attrs.event, e),
					noBorderLeft: attrs.startsBefore,
					noBorderRight: attrs.endsAfter,
					hasAlarm: hasAlarmsForTheUser(attrs.user, attrs.event),
					isAltered: attrs.event.recurrenceId != null,
					fadeIn: attrs.fadeIn,
					opacity: attrs.opacity,
					enablePointerEvents: attrs.enablePointerEvents,
				}),
			),
			attrs.endsAfter
				? m(".event-continues-right-arrow", {
						style: {
							"border-left-color": "#" + attrs.color,
							opacity: attrs.opacity,
						},
				  })
				: null,
		])
	}
}
