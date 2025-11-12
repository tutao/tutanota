import m, { Children, Component, Vnode } from "mithril"
import { hasAlarmsForTheUser, isBirthdayCalendar } from "../../../common/calendar/date/CalendarUtils"
import type { User } from "../../../common/api/entities/sys/TypeRefs.js"
import type { EventTextTimeOption } from "../../../common/api/common/TutanotaConstants"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyDownHandler, EventWrapper } from "./CalendarViewModel"
import { formatEventTime, getDisplayEventTitle } from "../gui/CalendarGuiUtils.js"
import { listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { LegacyCalendarEventBubble } from "./LegacyCalendarEventBubble"

export type LegacyContinuingCalendarEventBubbleAttrs = {
	eventWrapper: EventWrapper
	startsBefore: boolean
	endsAfter: boolean
	color: string
	onEventClicked: CalendarEventBubbleClickHandler
	onEventKeyDown: CalendarEventBubbleKeyDownHandler
	showTime: EventTextTimeOption | null
	user: User
	fadeIn: boolean
	opacity: number
	enablePointerEvents: boolean
}

/**
 * @deprecated since version 314.251018.1. Use the new ContinuingCalendarEventBubble instead
 * @see ContinuingCalendarEventBubble
 */
export class LegacyContinuingCalendarEventBubble implements Component<LegacyContinuingCalendarEventBubbleAttrs> {
	view({ attrs }: Vnode<LegacyContinuingCalendarEventBubbleAttrs>): Children {
		const eventTitle = getDisplayEventTitle(attrs.eventWrapper.event.summary)

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
				m(LegacyCalendarEventBubble, {
					text: (attrs.showTime != null ? formatEventTime(attrs.eventWrapper.event, attrs.showTime) + " " : "") + eventTitle,
					color: attrs.color,
					click: (e) => attrs.onEventClicked(attrs.eventWrapper.event, e),
					keyDown: (e) => attrs.onEventKeyDown(attrs.eventWrapper.event, e),
					noBorderLeft: attrs.startsBefore,
					noBorderRight: attrs.endsAfter,
					hasAlarm: hasAlarmsForTheUser(attrs.user, attrs.eventWrapper.event),
					isAltered: attrs.eventWrapper.event.recurrenceId != null,
					fadeIn: attrs.fadeIn,
					opacity: attrs.opacity,
					enablePointerEvents: attrs.enablePointerEvents,
					isBirthday: isBirthdayCalendar(listIdPart(attrs.eventWrapper.event._id)),
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
