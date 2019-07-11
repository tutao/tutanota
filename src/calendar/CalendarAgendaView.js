//@flow
import m from "mithril"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import {getStartOfDay} from "../api/common/utils/DateUtils"
import {styles} from "../gui/styles"
import {lang} from "../misc/LanguageViewModel"
import {formatDateWithWeekday} from "../misc/Formatter"
import {getEventText} from "./CalendarUtils"

type Attrs = {
	eventsForDays: Map<number, Array<CalendarEvent>>,
	amPmFormat: boolean,
	onEventClicked: (ev: CalendarEvent) => mixed,
}

export class CalendarAgendaView implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>) {
		const today = getStartOfDay(new Date()).getTime()
		let dayCount = 0
		return m(".fill-absolute.flex.col", [
				m(".mt-s.pr-l", [
					styles.isDesktopLayout() ?
						[
							m("h1.calendar-day-content", lang.get("agenda_label")),
							m("hr.hr.mt-s"),
						]
						: null,
				]),
				m(".scroll.pt-s", Array.from(attrs.eventsForDays.keys()).map((day) => {
					if (day < today) {
						return null
					}
					dayCount++
					const events = attrs.eventsForDays.get(day) || []
					if (events.length === 0) return null

					const date = new Date(day)
					const dateDescription = dayCount === 1
						? lang.get("today_label")
						: dayCount === 2
							? lang.get("tomorrow_label")
							: formatDateWithWeekday(date)
					return m(".flex.mlr-l.calendar-agenda-row.mb-s.col", {
						key: day,
					}, [
						m(".pb-s" + (dayCount < 3 ? ".b" : ""), dateDescription),
						m(".flex-grow", {
							style: {
								"max-width": "600px",
							}
						}, events.map((ev) => m(".darker-hover.mb-s", {key: ev._id}, m(CalendarEventBubble, {
							text: getEventText(ev, true, attrs.amPmFormat),
							secondLineText: ev.location,
							color: defaultCalendarColor,
							hasAlarm: ev.alarmInfos.length > 0,
							onEventClicked: () => attrs.onEventClicked(ev),
							height: 38,
							verticalPadding: 2
						}))))
					])
				}))
			]
		)
	}
}
