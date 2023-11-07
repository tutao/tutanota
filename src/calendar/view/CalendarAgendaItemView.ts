import m, { Children, Component, Vnode } from "mithril"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { eventEndsAfterDay, eventStartsBefore, formatEventTime, getEndOfDayWithZone } from "../date/CalendarUtils.js"
import { EventTextTimeOption } from "../../api/common/TutanotaConstants.js"
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
				m(".flex.col", [m(".b", attrs.event.summary), m("", this.formatTimes(attrs))]),
			],
		)
	}

	private formatTimes({ day, event, zone }: CalendarAgendaItemViewAttrs): string {
		if (isAllDayEvent(event)) {
			return lang.get("allDay_label")
		} else {
			const startsBefore = eventStartsBefore(day, zone, event)
			const endsAfter = eventEndsAfterDay(day, zone, event)
			if (startsBefore && endsAfter) {
				return lang.get("allDay_label")
			} else {
				const startTime: Date = startsBefore ? day : event.startTime
				const endTime: Date = endsAfter ? getEndOfDayWithZone(day, zone) : event.endTime
				return formatEventTime({ startTime, endTime }, EventTextTimeOption.START_END_TIME)
			}
		}
	}
}
