//@flow

import m from "mithril"
import {numberRange} from "../api/common/utils/ArrayUtils"
import {theme} from "../gui/theme"
import {px, size} from "../gui/size"
import {formatDateWithWeekday, formatTime} from "../misc/Formatter"
import {getFromMap} from "../api/common/utils/MapUtils"
import {eventEndsAfterDay, eventStartsBefore, isAllDayEvent} from "./CalendarUtils"
import {DAY_IN_MILLIS} from "../api/common/utils/DateUtils"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {styles} from "../gui/styles"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"

export type CalendarDayViewAttrs = {
	selectedDate: Stream<Date>,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed
}

const hours = numberRange(0, 23).map((n) => {
	const d = new Date()
	d.setHours(n, 0, 0, 0)
	return d
})
const allHoursHeight = size.calendar_hour_height * hours.length

export class CalendarDayView implements MComponent<CalendarDayViewAttrs> {
	view(vnode: Vnode<CalendarDayViewAttrs>): Children {
		const date = vnode.attrs.selectedDate()
		const events = getFromMap(vnode.attrs.eventsForDays, date.getTime(), () => [])
		const shortEvents = []
		const longEvents = []
		const allDayEvents = []
		events.forEach((e) => {
			if (isAllDayEvent(e)) {
				allDayEvents.push(e)
			} else if (eventStartsBefore(date, e) || eventEndsAfterDay(date, e)) {
				longEvents.push(e)
			} else {
				shortEvents.push(e)
			}
		})


		return m(".fill-absolute.flex.col",
			[
				m(".mt-s.pr-l", [
					styles.isDesktopLayout() ? m("h1.calendar-day-content", formatDateWithWeekday(vnode.attrs.selectedDate())) : null,
					m(".calendar-day-content", allDayEvents.map(e => {
						return m(CalendarEventBubble, {
							event: e,
							date: vnode.attrs.selectedDate(),
							color: defaultCalendarColor,
							onEventClicked: () => vnode.attrs.onEventClicked(e),
							showText: true
						})
					})),
					m(".calendar-day-content", longEvents.map(e => m(ContinuingCalendarEventBubble, {
						event: e,
						date: vnode.attrs.selectedDate(),
						color: defaultCalendarColor,
						onEventClicked: () => vnode.attrs.onEventClicked(e),
						showText: true
					}))),
					m("hr.hr.mt-s")
				]),
				m(".scroll.col.rel",
					[
						hours.map(n => m(".calendar-hour.flex", {
							style: {
								'border-bottom': `1px solid ${theme.content_border}`,
								height: px(size.calendar_hour_height)
							},
							onclick: (e) => {
								e.stopPropagation()
								vnode.attrs.onNewEvent(n)
							},
						}, m(".pt.pl-s.pr-s.center", {
							style: {
								width: px(size.calendar_hour_width),
								height: px(size.calendar_hour_height),
								'border-right': `2px solid ${theme.content_border}`,
							},
						}, formatTime(n)))),
						this._renderEvents(vnode.attrs, shortEvents)
					])
			])
	}


	_renderEvents(attrs: CalendarDayViewAttrs, events: Array<CalendarEvent>): ChildArray {
		// Iterate over the sorted array
		let lastEventEnding = null
		let columns: Array<Array<CalendarEvent>> = []
		const children = []
		events.forEach((e) => {
			if (isAllDayEvent(e)) {
				return
			}
			// Check if a new event group needs to be started
			if (lastEventEnding !== null && e.startTime.getTime() >= lastEventEnding) {
				// The latest event is later than any of the event in the
				// current group. There is no overlap. Output the current
				// event group and start a new event group.
				children.push(...this._renderColumns(attrs, columns))
				columns = [];  // This starts new event group.
				lastEventEnding = null;
			}

			// Try to place the event inside the existing columns
			let placed = false
			for (let i = 0; i < columns.length; i++) {
				var col = columns[i]
				if (!this._collidesWith(col[col.length - 1], e)) {
					col.push(e)
					placed = true
					break
				}
			}

			// It was not possible to place the event. Add a new column
			// for the current event group.
			if (!placed) {
				columns.push([e])
			}

			// Remember the latest event end time of the current group.
			// This is later used to determine if a new groups starts.
			if (lastEventEnding === null || e.endTime.getTime() > lastEventEnding) {
				lastEventEnding = e.endTime.getTime()
			}
		})
		children.push(...this._renderColumns(attrs, columns))
		return children
	}

	_renderColumns(attrs: CalendarDayViewAttrs, columns: Array<Array<CalendarEvent>>): ChildArray {
		return columns.map((column, index) => {
			return column.map(event => {
				return this._renderEvent(attrs, event, index)
			})
		})
	}


	_collidesWith(a: CalendarEvent, b: CalendarEvent) {
		return a.endTime.getTime() > b.startTime.getTime() && a.startTime.getTime() < b.endTime.getTime()
	}

	_renderEvent(attrs: CalendarDayViewAttrs, ev: CalendarEvent, columnIndex: number): Children {
		if (isAllDayEvent(ev)) {
			return null
		} else {
			const startTime = (ev.startTime.getHours() * 60 + ev.startTime.getMinutes()) * 60 * 1000
			const height = (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 60 * 60) * size.calendar_hour_height
			return m(".abs", {
				style: {
					left: `calc(${size.calendar_hour_width}px + ${columnIndex} * 10%)`,
					right: px(size.hpad_large), // same as .pr-l
					top: px(startTime / DAY_IN_MILLIS * allHoursHeight),
					height: px(height)
				},
			}, m(CalendarEventBubble, {
				event: ev,
				date: attrs.selectedDate(),
				color: defaultCalendarColor,
				onEventClicked: () => attrs.onEventClicked(ev),
				height: height - 2
			}))
		}
	}
}
