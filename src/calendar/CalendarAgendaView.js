//@flow
import m from "mithril"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {EventTextTimeOption} from "../api/common/TutanotaConstants"
import {getDayShifted, getStartOfDay, incrementDate} from "../api/common/utils/DateUtils"
import {styles} from "../gui/styles"
import {lang} from "../misc/LanguageViewModel"
import {formatDateWithWeekday} from "../misc/Formatter"
import {getEventColor, getEventText} from "./CalendarUtils"
import {isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {neverNull} from "../api/common/utils/Utils"

type Attrs = {
	/**
	 * maps start of day timestamp to events on that day
	 */
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onEventClicked: (ev: CalendarEvent) => mixed,
	groupColors: {[Id]: string},
	hiddenCalendars: Set<Id>,
	onDateSelected: (date: Date) => mixed,
}

export class CalendarAgendaView implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>) {
		const now = new Date()
		const today = getStartOfDay(now).getTime()
		const tomorrow = getDayShifted(new Date(today), 1).getTime()

		const days = getWeek()
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
					let events = (attrs.eventsForDays.get(day) || []).filter((e) => !attrs.hiddenCalendars.has(neverNull(e._ownerGroup)))
					if (day === today) {
						// only show future and currently running events
						events = events.filter(ev => isAllDayEvent(ev) || now < ev.endTime)
					} else if (day > tomorrow && events.length === 0) {
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
						m("button.pb-s.b", {
							onclick: () => attrs.onDateSelected(new Date(day)),
						}, dateDescription),
						m(".flex-grow", {
							style: {
								"max-width": "600px",
							}
						}, events.length === 0
							? m(".mb-s", lang.get("noEntries_msg"))
							: events.map((ev) => m(".darker-hover.mb-s", {key: ev._id}, m(CalendarEventBubble, {
								text: getEventText(ev, EventTextTimeOption.START_END_TIME),
								secondLineText: ev.location,
								color: getEventColor(ev, attrs.groupColors),
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

function getWeek(): Array<number> {
	let calculationDate = getStartOfDay(new Date())
	const days = []
	for (let i = 0; i < 14; i++) {
		days.push(calculationDate.getTime())
		calculationDate = incrementDate(calculationDate, 1)
	}
	return days
}
