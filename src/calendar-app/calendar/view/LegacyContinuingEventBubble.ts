import m, { Children, Component, Vnode } from "mithril"
import { hasAlarmsForTheUser, isBirthdayCalendar } from "../../../common/calendar/date/CalendarUtils"
import type { User } from "../../../common/api/entities/sys/TypeRefs.js"
import type { EventTextTimeOption } from "../../../common/api/common/TutanotaConstants"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyDownHandler, EventWrapper } from "./CalendarViewModel"
import { formatEventTime, getDisplayEventTitle } from "../gui/CalendarGuiUtils.js"
import { listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { LegacyCalendarEventBubble } from "./LegacyCalendarEventBubble"
import { px } from "../../../common/gui/size"
import { normalizeColorHex } from "../../../common/gui/base/GuiUtils"

export type LegacyContinuingCalendarEventBubbleAttrs = {
	eventWrapper: EventWrapper
	startsBefore: boolean
	endsAfter: boolean
	backgroundColor: string
	color: string
	border: string
	height: number
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
 * @see CalendarEventBubble
 */
export class LegacyContinuingCalendarEventBubble implements Component<LegacyContinuingCalendarEventBubbleAttrs> {
	view({ attrs }: Vnode<LegacyContinuingCalendarEventBubbleAttrs>): Children {
		const eventTitle = getDisplayEventTitle(attrs.eventWrapper.event.summary)

		const normalizedBackgroundColor = normalizeColorHex(attrs.backgroundColor)

		return m(".flex.calendar-event-container.darker-hover", [
			attrs.startsBefore
				? m(".event-continues-right-arrow", {
						style: {
							"border-left-color": "transparent",
							"border-top-color": normalizedBackgroundColor,
							"border-bottom-color": normalizedBackgroundColor,
							opacity: attrs.opacity,
							height: px(attrs.height),
						},
					})
				: null,
			m(
				".flex-grow.overflow-hidden",
				m(LegacyCalendarEventBubble, {
					color: attrs.color,
					border: attrs.border,
					text: (attrs.showTime != null ? formatEventTime(attrs.eventWrapper.event, attrs.showTime) + " " : "") + eventTitle,
					backgroundColor: normalizedBackgroundColor,
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
							"border-left-color": normalizedBackgroundColor,
							opacity: attrs.opacity,
							height: px(attrs.height),
						},
					})
				: null,
		])
	}
}
