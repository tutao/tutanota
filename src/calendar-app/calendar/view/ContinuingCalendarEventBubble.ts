import m, { Children, Component, Vnode } from "mithril"
import { TEMPORARY_EVENT_OPACITY } from "../gui/CalendarGuiUtils.js"
import { CalendarEventBubble, CalendarEventBubbleAttrs, RangeOverflowData } from "../../../common/calendar/gui/CalendarEventBubble"

export type ContinuingCalendarEventBubbleAttrs = {
	columnOverflowInfo: RangeOverflowData
} & CalendarEventBubbleAttrs

export class ContinuingCalendarEventBubble implements Component<ContinuingCalendarEventBubbleAttrs> {
	view({ attrs }: Vnode<ContinuingCalendarEventBubbleAttrs>): Children {
		return m(".flex.calendar-event-container.darker-hover", [
			attrs.columnOverflowInfo.start
				? m(".event-continues-right-arrow", {
						style: {
							"border-left-color": "transparent",
							"border-top-color": "#" + attrs.eventWrapper.color,
							"border-bottom-color": "#" + attrs.eventWrapper.color,
							opacity: `${attrs.eventWrapper.flags?.isTransientEvent ? TEMPORARY_EVENT_OPACITY : 1}`,
						},
					})
				: null,
			m(".flex-grow.overflow-hidden", m(CalendarEventBubble, attrs)),
			attrs.columnOverflowInfo.end
				? m(".event-continues-right-arrow", {
						style: {
							"border-left-color": "#" + attrs.eventWrapper.color,
							opacity: `${attrs.eventWrapper.flags?.isTransientEvent ? TEMPORARY_EVENT_OPACITY : 1}`,
						},
					})
				: null,
		])
	}
}
