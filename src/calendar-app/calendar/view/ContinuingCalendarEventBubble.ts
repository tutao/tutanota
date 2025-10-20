import m, { Children, Component, Vnode } from "mithril"
import { hasAlarmsForTheUser, isBirthdayCalendar } from "../../../common/calendar/date/CalendarUtils"
import { CalendarEventBubble } from "./CalendarEventBubble"
import type { User } from "../../../common/api/entities/sys/TypeRefs.js"
import type { EventTextTimeOption } from "../../../common/api/common/TutanotaConstants"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyDownHandler, EventWrapper } from "./CalendarViewModel"
import { formatEventTime, getDisplayEventTitle } from "../gui/CalendarGuiUtils.js"
import { listIdPart } from "../../../common/api/common/utils/EntityUtils.js"

type ContinuingCalendarEventBubbleAttrs = {
	event: EventWrapper
	startsBefore: boolean
	endsAfter: boolean
	color: string
	border?: string
	onEventClicked: CalendarEventBubbleClickHandler
	onEventKeyDown: CalendarEventBubbleKeyDownHandler
	showTime: EventTextTimeOption | null
	user: User
	fadeIn: boolean
	opacity: number
	enablePointerEvents: boolean
}

export class ContinuingCalendarEventBubble implements Component<ContinuingCalendarEventBubbleAttrs> {
	view({ attrs }: Vnode<ContinuingCalendarEventBubbleAttrs>): Children {
		const eventTitle = getDisplayEventTitle(attrs.event.event.summary)

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
					text: (attrs.showTime != null ? formatEventTime(attrs.event.event, attrs.showTime) + " " : "") + eventTitle,
					color: attrs.color,
					border: attrs.border,
					click: (e) => attrs.onEventClicked(attrs.event.event, e),
					keyDown: (e) => attrs.onEventKeyDown(attrs.event.event, e),
					noBorderLeft: attrs.startsBefore,
					noBorderRight: attrs.endsAfter,
					hasAlarm: hasAlarmsForTheUser(attrs.user, attrs.event.event),
					isAltered: attrs.event.event.recurrenceId != null,
					fadeIn: attrs.fadeIn,
					opacity: attrs.opacity,
					enablePointerEvents: attrs.enablePointerEvents,
					isBirthday: isBirthdayCalendar(listIdPart(attrs.event.event._id)),
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
