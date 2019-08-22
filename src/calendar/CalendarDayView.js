//@flow

import m from "mithril"
import {formatTime} from "../misc/Formatter"
import {incrementDate, isSameDay} from "../api/common/utils/DateUtils"
import {EventTextTimeOption} from "../api/common/TutanotaConstants"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {CALENDAR_EVENT_HEIGHT, eventEndsAfterDay, eventStartsBefore, getEventColor, getTimeZone} from "./CalendarUtils"
import {neverNull} from "../api/common/utils/Utils"
import {CalendarDayEventsView, calendarDayTimes} from "./CalendarDayEventsView"
import {theme} from "../gui/theme"
import {px, size} from "../gui/size"
import {PageView} from "../gui/base/PageView"
import {DEFAULT_HOUR_OF_DAY} from "./CalendarView"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"

export type CalendarDayViewAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent, domEvent: Event) => mixed,
	groupColors: {[Id]: string},
	hiddenCalendars: Set<Id>,
}

type PageEvents = {shortEvents: Array<CalendarEvent>, longEvents: Array<CalendarEvent>, allDayEvents: Array<CalendarEvent>}

export class CalendarDayView implements MComponent<CalendarDayViewAttrs> {
	_redrawIntervalId: ?IntervalID
	_selectedDate: Date
	_domElements: Array<HTMLElement> = []
	_scrollPosition: number


	constructor() {
		this._scrollPosition = size.calendar_hour_height * DEFAULT_HOUR_OF_DAY
	}

	view(vnode: Vnode<CalendarDayViewAttrs>): Children {
		this._selectedDate = vnode.attrs.selectedDate
		const previousDate = incrementDate(new Date(vnode.attrs.selectedDate), -1)
		const nextDate = incrementDate(new Date(vnode.attrs.selectedDate), 1)

		const previousPageEvents = this._calculateEventsForDate(vnode.attrs, previousDate)
		const currentPageEvents = this._calculateEventsForDate(vnode.attrs, vnode.attrs.selectedDate)
		const nextPageEvents = this._calculateEventsForDate(vnode.attrs, nextDate)

		return m(PageView, {
			previousPage: {
				key: previousDate.getTime(),
				nodes: this._renderDay(vnode, previousDate, previousPageEvents, currentPageEvents)
			},
			currentPage: {
				key: vnode.attrs.selectedDate.getTime(),
				nodes: this._renderDay(vnode, vnode.attrs.selectedDate, currentPageEvents, currentPageEvents)
			},
			nextPage: {
				key: nextDate.getTime(),
				nodes: this._renderDay(vnode, nextDate, nextPageEvents, currentPageEvents)
			},
			onChangePage: (next) => vnode.attrs.onDateSelected(next ? nextDate : previousDate)
		})
	}

	_calculateEventsForDate(attrs: CalendarDayViewAttrs,
	                        date: Date): PageEvents {
		let dayEvents = attrs.eventsForDays.get(date.getTime())
		const events = dayEvents ? dayEvents : []
		const shortEvents = []
		const longEvents = []
		const allDayEvents = []
		const zone = getTimeZone()
		events.forEach((e) => {
			if (attrs.hiddenCalendars.has(neverNull(e._ownerGroup))) {
				return
			}
			if (isAllDayEvent(e)) {
				allDayEvents.push(e)
			} else if (eventStartsBefore(date, zone, e) || eventEndsAfterDay(date, zone, e)) {
				longEvents.push(e)
			} else {
				shortEvents.push(e)
			}
		})
		return {shortEvents, longEvents, allDayEvents}
	}

	_renderDay(vnode: Vnode<CalendarDayViewAttrs>, date: Date, thisPageEvents: PageEvents, mainPageEvents: PageEvents): Children {
		const {shortEvents, longEvents, allDayEvents} = thisPageEvents
		const mainPageEventsCount = mainPageEvents.allDayEvents.length + mainPageEvents.longEvents.length
		const zone = getTimeZone()
		return m(".fill-absolute.flex.col.calendar-column-border.margin-are-inset-lr", {
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
						startsBefore: eventStartsBefore(date, zone, e),
						endsAfter: eventEndsAfterDay(date, zone, e),
						color: getEventColor(e, vnode.attrs.groupColors),
						onEventClicked: (_, domEvent) => vnode.attrs.onEventClicked(e, domEvent),
						showTime: EventTextTimeOption.NO_TIME,
					})
				})),
				m(".calendar-hour-margin.pr-l", longEvents.map(e => m(ContinuingCalendarEventBubble, {
					event: e,
					startsBefore: eventStartsBefore(date, zone, e),
					endsAfter: eventEndsAfterDay(date, zone, e),
					color: getEventColor(e, vnode.attrs.groupColors),
					onEventClicked: (_, domEvent) => vnode.attrs.onEventClicked(e, domEvent),
					showTime: EventTextTimeOption.START_TIME,
				}))),
				mainPageEvents.allDayEvents.length > 0 || mainPageEvents.longEvents.length > 0
					? m(".mt-s")
					: null
			]),
			m(".flex.scroll", {
				oncreate: (vnode) => {
					vnode.dom.scrollTop = this._scrollPosition
					this._domElements.push(vnode.dom)
				},
				onscroll: (event) => {
					if (date === vnode.attrs.selectedDate) {
						this._domElements.forEach(dom => {
							if (dom !== event.target) {
								dom.scrollTop = event.target.scrollTop
							}
						})
						this._scrollPosition = event.target.scrollTop
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
					},
					onTimeContextPressed: (hours, minutes) => {
						const newDate = new Date(vnode.attrs.selectedDate)
						newDate.setHours(hours, minutes)
						vnode.attrs.onNewEvent(newDate)
					}
				})),
			]),

		])
	}
}
