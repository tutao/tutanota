//@flow


import m from "mithril"
import {px, size} from "../gui/size"
import {getFromMap} from "../api/common/utils/MapUtils"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import type {CalendarDay} from "./CalendarUtils"
import {getCalendarMonth} from "./CalendarUtils"
import {getStartOfDay} from "../api/common/utils/DateUtils"

type CalendarMonthAttrs = {
	selectedDate: Stream<Date>,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed
}

const weekDaysHeight = 30

export class CalendarMonthView implements MComponent<CalendarMonthAttrs> {

	_monthDom: ?HTMLElement;

	view(vnode: Vnode<CalendarMonthAttrs>): Children {
		const {weekdays, weeks} = getCalendarMonth(vnode.attrs.selectedDate())
		const today = getStartOfDay(new Date())
		return m(".fill-absolute.flex.col", {
				oncreate: (vnode) => {
					this._monthDom = vnode.dom
				}
			},
			[
				m(".flex.pt-s.pb-s", {
					style: {
						'border-bottom': '1px solid lightgrey',
						height: px(weekDaysHeight)
					}
				}, weekdays.map((wd) => m(".flex-grow", m(".b.small.pl-s", wd))))
			].concat(weeks.map((week) => {
				return m(".flex.flex-grow", week.map(d => this._renderDay(vnode.attrs, d, today)))
			})))
	}

	_renderDay(attrs: CalendarMonthAttrs, d: CalendarDay, today: Date): Children {
		const eventsForDay = getFromMap(attrs.eventsForDays, d.date.getTime(), () => [])
		const weekHeight = this._getHeightForWeek()
		const canDisplay = weekHeight / size.calendar_line_height
		const sortedEvents = eventsForDay.slice().sort((l, r) => l.startTime.getTime() - r.startTime.getTime())
		const eventsToDisplay = sortedEvents.slice(0, canDisplay - 1)
		const notShown = eventsForDay.length - eventsToDisplay.length
		return m(".calendar-day-wrapper.flex-grow.rel.overflow-hidden" + (d.paddingDay ? ".calendar-alternate-background" : ""), {
			onclick: () => attrs.onNewEvent(d.date),
		}, [
			m(".day-with-border.calendar-day.fill-absolute",
				m(".pl-s.pr-s.pt-s",
					m(".calendar-day-number" + (today.getTime() === d.date.getTime() ? ".date-selected.b" : ""),
						String(d.day)))),
			m(".day-with-events.events.pt-l.rel", [
				eventsToDisplay.map((e) => this._renderEvent(attrs, e, d.date)),
				notShown > 0
					? m("", {
						onclick: (e) => {
							// this._showFullDayEvents(e, d, eventsForDay)
							e.stopPropagation()
						}
					}, "+" + notShown)
					: null
			])
		])
	}


	_renderEvent(attrs: CalendarMonthAttrs, event: CalendarEvent, date: Date): Children {
		let color = defaultCalendarColor


		return m(CalendarEventBubble, {
			event,
			date,
			color,
			onEventClicked: (e) => {
				attrs.onEventClicked(event)
			}
		})
	}


	_getHeightForWeek(): number {
		if (!this._monthDom) {
			return 1
		}
		const monthDomHeight = this._monthDom.scrollHeight
		const weeksHeight = monthDomHeight - weekDaysHeight
		return weeksHeight / 6
	}
}
