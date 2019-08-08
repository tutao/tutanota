//@flow

import m from "mithril"
import {formatTime} from "../misc/Formatter"
import {getFromMap} from "../api/common/utils/MapUtils"
import {incrementDate, isSameDay} from "../api/common/utils/DateUtils"
import {EventTextTimeOption} from "../api/common/TutanotaConstants"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {CALENDAR_EVENT_HEIGHT, eventEndsAfterDay, eventStartsBefore, getEventColor} from "./CalendarUtils"
import {neverNull} from "../api/common/utils/Utils"
import {CalendarDayEventsView, calendarDayTimes} from "./CalendarDayEventsView"
import {theme} from "../gui/theme"
import {px, size} from "../gui/size"
import {PageView} from "../gui/base/PageView"

export type CalendarDayViewAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed,
	groupColors: {[Id]: string},
	hiddenCalendars: Set<Id>,
}

type PageEvents = {shortEvents: Array<CalendarEvent>, longEvents: Array<CalendarEvent>, allDayEvents: Array<CalendarEvent>}

export class CalendarDayView implements MComponent<CalendarDayViewAttrs> {
	_redrawIntervalId: ?IntervalID
	_selectedDate: Date
	_domElements = []

	view(vnode: Vnode<CalendarDayViewAttrs>): Children {
		this._selectedDate = vnode.attrs.selectedDate
		const previousDate = incrementDate(new Date(vnode.attrs.selectedDate), -1)
		const nextDate = incrementDate(new Date(vnode.attrs.selectedDate), 1)

		const previousPageEvents = this._calculateEventsForDate(vnode.attrs, previousDate)
		const currentPageEvents = this._calculateEventsForDate(vnode.attrs, vnode.attrs.selectedDate)
		const nextPageEvents = this._calculateEventsForDate(vnode.attrs, nextDate)

		return m(PageView, {
			previousPage: this._renderDay(vnode, previousDate, previousPageEvents, currentPageEvents),
			currentPage: this._renderDay(vnode, vnode.attrs.selectedDate, currentPageEvents, currentPageEvents),
			nextPage: this._renderDay(vnode, nextDate, nextPageEvents, currentPageEvents),
			onChangePage: (next) => vnode.attrs.onDateSelected(next ? nextDate : previousDate)
		})
	}

	_calculateEventsForDate(attrs: CalendarDayViewAttrs,
	                        date: Date): PageEvents {
		const events = getFromMap(attrs.eventsForDays, date.getTime(), () => [])
		const shortEvents = []
		const longEvents = []
		const allDayEvents = []
		events.forEach((e) => {
			if (attrs.hiddenCalendars.has(neverNull(e._ownerGroup))) {
				return
			}
			if (isAllDayEvent(e)) {
				allDayEvents.push(e)
			} else if (eventStartsBefore(date, e) || eventEndsAfterDay(date, e)) {
				longEvents.push(e)
			} else {
				shortEvents.push(e)
			}
		})
		return {shortEvents, longEvents, allDayEvents}
	}

	_renderDay(vnode: Vnode<CalendarDayViewAttrs>, date: Date, thisPageEvents: PageEvents, mainPageEvents: PageEvents) {
		const {shortEvents, longEvents, allDayEvents} = thisPageEvents
		const mainPageEventsCount = mainPageEvents.allDayEvents.length + mainPageEvents.longEvents.length
		return m(".fill-absolute.flex.col.calendar-column-border", {
			oncreate: () => {
				this._redrawIntervalId = setInterval(m.redraw, 1000 * 60)
			},
			onremove: () => {
				if (this._redrawIntervalId != null) {
					clearInterval(this._redrawIntervalId)
					this._redrawIntervalId = null
				}
			},
		}, [
			m(".calendar-long-events-header.flex-fixed" + (mainPageEventsCount === 0 ? "" : ".mt-s"), {
				style: {
					height: px(mainPageEventsCount === 0 ? 0 : (mainPageEventsCount * CALENDAR_EVENT_HEIGHT + 9)),

				},
			}, [
				m(".calendar-hour-margin.pr-l", allDayEvents.map(e => {
					return m(ContinuingCalendarEventBubble, {
						event: e,
						startDate: date,
						endDate: date,
						color: getEventColor(e, vnode.attrs.groupColors),
						onEventClicked: () => vnode.attrs.onEventClicked(e),
						showTime: EventTextTimeOption.NO_TIME,
					})
				})),
				m(".calendar-hour-margin.pr-l", longEvents.map(e => m(ContinuingCalendarEventBubble, {
					event: e,
					startDate: date,
					endDate: date,
					color: getEventColor(e, vnode.attrs.groupColors),
					onEventClicked: () => vnode.attrs.onEventClicked(e),
					showTime: EventTextTimeOption.START_TIME,
				}))),
				mainPageEvents.allDayEvents.length > 0 || mainPageEvents.longEvents.length > 0
					? m(".mt-s")
					: null
			]),
			m(".flex.scroll", {
				oncreate: (vnode) => {
					vnode.dom.scrollTop = size.calendar_hour_height * new Date().getHours() - 100
					this._domElements.push(vnode.dom)
				},
				onscroll: (event) => {
					if (date === vnode.attrs.selectedDate) {
						this._domElements.forEach(dom => {
							if (dom !== event.target) {
								dom.scrollTop = event.target.scrollTop
							}
						})
					}
				},
			}, [
				m(".flex.col", calendarDayTimes.map(n => m(".calendar-hour.flex", {
						onclick: (e) => {
							e.stopPropagation()
							vnode.attrs.onNewEvent(n)
						},
					},
					m(".pt.pl-s.pr-s.center.small", {
						style: {
							width: px(size.calendar_hour_width_mobile),
							height: px(size.calendar_hour_height),
							'border-right': `2px solid ${theme.content_border}`,
						},
					}, formatTime(n))
					)
				)),
				m(".flex-grow", m(CalendarDayEventsView, {
					onEventClicked: vnode.attrs.onEventClicked,
					groupColors: vnode.attrs.groupColors,
					events: shortEvents.filter((ev) => !vnode.attrs.hiddenCalendars.has(neverNull(ev._ownerGroup))),
					displayTimeIndicator: isSameDay(new Date(), vnode.attrs.selectedDate),
					onTimePressed: (hours, minutes) => {
						const newDate = new Date(vnode.attrs.selectedDate)
						newDate.setHours(hours, minutes)
						vnode.attrs.onNewEvent(newDate)
					}
				})),
			]),

		])
	}
}
