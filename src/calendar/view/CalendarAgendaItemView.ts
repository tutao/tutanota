import m, { Children, Component, Vnode } from "mithril"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils.js"
import { formatEventTimes } from "../date/CalendarUtils.js"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"

interface CalendarAgendaItemViewAttrs {
	day: Date
	zone: string
	event: CalendarEvent
	color: string
	click: (domEvent: MouseEvent) => unknown
}

export class CalendarAgendaItemView implements Component<CalendarAgendaItemViewAttrs> {
	view({ attrs }: Vnode<CalendarAgendaItemViewAttrs>): Children {
		return m(
			".flex.items-center.gap-vpad.click.state-bg.plr.border-radius.pt-s.pb-s",
			{
				onclick: attrs.click,
			},
			[
				m("", {
					style: {
						minWidth: "16px",
						minHeight: "16px",
						borderRadius: "50%",
						backgroundColor: `#${attrs.color}`,
					},
				}),
				m(".flex.col", [m(".b", attrs.event.summary), m("", formatEventTimes(attrs.day, attrs.event, attrs.zone, isAllDayEvent(attrs.event)))]),
			],
		)
	}
}
