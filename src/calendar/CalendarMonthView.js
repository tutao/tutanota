//@flow


import m from "mithril"
import {px, size} from "../gui/size"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import type {CalendarDay} from "./CalendarUtils"
import {eventEndsAfterDay, eventStartsBefore, getCalendarMonth, getEventEnd, getEventStart, isAllDayEvent, layOutEvents} from "./CalendarUtils"
import {getDayShifted, getStartOfDay} from "../api/common/utils/DateUtils"
import {lastThrow} from "../api/common/utils/ArrayUtils"

type CalendarMonthAttrs = {
	selectedDate: Stream<Date>,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed
}

const weekDaysHeight = 30
const calendarDayHeight = 32

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
				return m(".flex.flex-grow.rel", [
					week.map(d => this._renderDay(vnode.attrs, d, today)),
					this._renderWeekEvents(vnode.attrs, week),
				])
			})))
	}

	_renderDay(attrs: CalendarMonthAttrs, d: CalendarDay, today: Date): Children {
		return m(".calendar-day-wrapper.flex-grow.rel.overflow-hidden" + (d.paddingDay ? ".calendar-alternate-background" : ""), {
			onclick: () => attrs.onNewEvent(d.date),
		}, [
			m(".day-with-border.calendar-day.fill-absolute",
				m(".pl-s.pr-s.pt-s",
					m(".calendar-day-number" + (today.getTime() === d.date.getTime() ? ".date-selected.b" : ""),
						String(d.day)))),
		])
	}

	_renderWeekEvents(attrs: CalendarMonthAttrs, week: Array<CalendarDay>): Children {
		const events = new Set()
		week.forEach((day) => {
			const dayEvents = attrs.eventsForDays.get(day.date.getTime())
			dayEvents && dayEvents.forEach(e => events.add(e))
		})


		const firstDayOfWeek = week[0]
		const lastDayOfWeek = lastThrow(week)
		const dayWidth = this._getWidthForDay()
		const weekHeight = this._getHeightForWeek()
		const maxEventsPerDay = (weekHeight - calendarDayHeight) / size.calendar_line_height
		const eventsPerDay = Math.floor(maxEventsPerDay)
		return layOutEvents(Array.from(events), (columns) => {
			return columns.map((events, columnIndex) => {
				return events.map(event => {
					if (columnIndex < eventsPerDay) {
						const top = size.calendar_line_height * columnIndex + calendarDayHeight
						const left = eventStartsBefore(firstDayOfWeek.date, event) ? 0 : (getEventStart(event).getDay()) * dayWidth
						const eventEnd = isAllDayEvent(event) ? getDayShifted(getEventEnd(event), -1) : event.endTime
						const right = eventEndsAfterDay(lastDayOfWeek.date, event) ? 0 : (6 - eventEnd.getDay()) * dayWidth
						return m(".abs", {
							style: {
								top: px(top),
								height: px(size.calendar_line_height),
								left: px(left),
								right: px(right)
							}
						}, this._renderEvent(attrs, event))
					} else {
						return null
					}
				})
			})
		}, true)
	}


	_renderEvent(attrs: CalendarMonthAttrs, event: CalendarEvent): Children {
		let color = defaultCalendarColor
		return m(CalendarEventBubble, {
			event,
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

	_getWidthForDay(): number {
		if (!this._monthDom) {
			return 1
		}
		const monthDomWidth = this._monthDom.scrollWidth
		return monthDomWidth / 7
	}
}
