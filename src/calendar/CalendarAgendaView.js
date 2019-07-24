//@flow
import m from "mithril"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {defaultCalendarColor, EventTextTimeOption} from "../api/common/TutanotaConstants"
import {getDayShifted, getStartOfDay} from "../api/common/utils/DateUtils"
import {styles} from "../gui/styles"
import {lang} from "../misc/LanguageViewModel"
import {formatDateWithWeekday} from "../misc/Formatter"
import {getEventText} from "./CalendarUtils"
import {isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"

type Attrs = {
	/**
	 * maps start of day timestamp to events on that day
	 */
	eventsForDays: Map<number, Array<CalendarEvent>>,
	amPmFormat: boolean,
	onEventClicked: (ev: CalendarEvent) => mixed,
}

export class CalendarAgendaView implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>) {
		const now = new Date()
		const today = getStartOfDay(now).getTime()
		const tomorrow = getDayShifted(new Date(today), 1).getTime()
		let days = Array.from(attrs.eventsForDays.keys())
		days.sort((a, b) => a - b)
		return m(".fill-absolute.flex.col", [
				m(".mt-s.pr-l", [
					styles.isDesktopLayout() ?
						[
							m("h1.calendar-day-content", lang.get("agenda_label")),
							m("hr.hr.mt-s"),
						]
						: null,
				]),
				m(".scroll.pt-s", days.map((day) => {
					if (day < today) {
						return null
					}
					let events = attrs.eventsForDays.get(day) || []
					if (day === today) {
						// only show future and currently running events
						events = events.filter(ev => isAllDayEvent(ev) || now < ev.endTime)
					} else if (events.length === 0) {
						return null
					}

					const date = new Date(day)
					const dateDescription = day === today
						? lang.get("today_label")
						: day === tomorrow
							? lang.get("tomorrow_label")
							: formatDateWithWeekday(date)
					return m(".flex.mlr-l.calendar-agenda-row.mb-s.col", {
						key: day,
					}, [
						m(".pb-s" + (day === today || day === tomorrow ? ".b" : ""), dateDescription),
						m(".flex-grow", {
							style: {
								"max-width": "600px",
							}
						}, events.map((ev) => m(".darker-hover.mb-s", {key: ev._id}, m(CalendarEventBubble, {
							text: getEventText(ev, EventTextTimeOption.START_END_TIME, attrs.amPmFormat),
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
