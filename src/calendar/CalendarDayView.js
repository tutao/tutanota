//@flow

import m from "mithril"
import {formatDateWithWeekday, formatTime} from "../misc/Formatter"
import {getFromMap} from "../api/common/utils/MapUtils"
import {getStartOfNextDay, incrementDate, isSameDay} from "../api/common/utils/DateUtils"
import {EventTextTimeOption} from "../api/common/TutanotaConstants"
import {styles} from "../gui/styles"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {eventEndsAfterDay, eventStartsBefore, getEventColor} from "./CalendarUtils"
import type {GestureInfo} from "../gui/base/ViewSlider"
import {gestureInfoFromTouch} from "../gui/base/ViewSlider"
import {neverNull} from "../api/common/utils/Utils"
import {CalendarDayEventsView, calendarDayTimes} from "./CalendarDayEventsView"
import {theme} from "../gui/theme"
import {px, size} from "../gui/size"

export type CalendarDayViewAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed,
	groupColors: {[Id]: string},
	hiddenCalendars: Set<Id>,
}


export class CalendarDayView implements MComponent<CalendarDayViewAttrs> {
	_lastGestureInfo: ?GestureInfo;
	_oldGestureInfo: ?GestureInfo;
	_redrawIntervalId: ?IntervalID

	view(vnode: Vnode<CalendarDayViewAttrs>): Children {
		const date = vnode.attrs.selectedDate
		const events = getFromMap(vnode.attrs.eventsForDays, date.getTime(), () => [])
		const shortEvents = []
		const longEvents = []
		const allDayEvents = []
		events.forEach((e) => {
			if (vnode.attrs.hiddenCalendars.has(neverNull(e._ownerGroup))) {
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

		return m(".fill-absolute.flex.col", {
			oncreate: () => {
				this._redrawIntervalId = setInterval(m.redraw, 1000 * 60)
			},
			onremove: () => {
				if (this._redrawIntervalId != null) {
					clearInterval(this._redrawIntervalId)
					this._redrawIntervalId = null
				}
			},
			ontouchstart: (event) => {
				this._lastGestureInfo = this._oldGestureInfo = gestureInfoFromTouch(event.touches[0])
			},
			ontouchmove: (event) => {
				this._oldGestureInfo = this._lastGestureInfo
				this._lastGestureInfo = gestureInfoFromTouch(event.touches[0])
			},
			ontouchend: () => {
				const lastGestureInfo = this._lastGestureInfo
				const oldGestureInfo = this._oldGestureInfo
				if (lastGestureInfo && oldGestureInfo) {
					const velocity = (lastGestureInfo.x - oldGestureInfo.x) / (lastGestureInfo.time - oldGestureInfo.time)
					const verticalVelocity = (lastGestureInfo.y - oldGestureInfo.y) / (lastGestureInfo.time - oldGestureInfo.time)
					const absVerticalVelocity = Math.abs(verticalVelocity)
					if (absVerticalVelocity > Math.abs(velocity) || absVerticalVelocity > 0.8) {
						// Do nothing, vertical scroll
					} else if (velocity > 0.6) {
						const nextDate = incrementDate(vnode.attrs.selectedDate, -1)
						vnode.attrs.onDateSelected(nextDate)
					} else if (velocity < -0.6) {
						const nextDate = getStartOfNextDay(vnode.attrs.selectedDate)
						vnode.attrs.onDateSelected(nextDate)
					}
				}
			},
		}, [
			m(".mt-s.pr-l", [
				styles.isDesktopLayout() ? m("h1.calendar-day-content", formatDateWithWeekday(vnode.attrs.selectedDate)) : null,
				m(".calendar-day-content", allDayEvents.map(e => {
					return m(ContinuingCalendarEventBubble, {
						event: e,
						startDate: vnode.attrs.selectedDate,
						endDate: vnode.attrs.selectedDate,
						color: getEventColor(e, vnode.attrs.groupColors),
						onEventClicked: () => vnode.attrs.onEventClicked(e),
						showTime: EventTextTimeOption.NO_TIME,
					})
				})),
				m(".calendar-day-content", longEvents.map(e => m(ContinuingCalendarEventBubble, {
					event: e,
					startDate: vnode.attrs.selectedDate,
					endDate: vnode.attrs.selectedDate,
					color: getEventColor(e, vnode.attrs.groupColors),
					onEventClicked: () => vnode.attrs.onEventClicked(e),
					showTime: EventTextTimeOption.START_TIME,
				}))),
				m("hr.hr.mt-s")
			]),
			m(".flex.scroll", [
				m(".flex.col", calendarDayTimes.map(n => m(".calendar-hour.flex", {
						style: {
							'border-bottom': `1px solid ${theme.content_border}`,
							height: px(size.calendar_hour_height)
						},
						onclick: (e) => {
							e.stopPropagation()
							vnode.attrs.onNewEvent(n)
						},
					},
					m(".pt.pl-s.pr-s.center.small", {
						style: {
							width: px(size.calendar_hour_width),
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
