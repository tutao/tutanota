//@flow

import m from "mithril"
import {numberRange} from "../api/common/utils/ArrayUtils"
import {theme} from "../gui/theme"
import {px, size as sizes, size} from "../gui/size"
import {formatDateWithWeekday, formatTime} from "../misc/Formatter"
import {getFromMap} from "../api/common/utils/MapUtils"
import {DAY_IN_MILLIS, getStartOfNextDay, incrementDate, isSameDay} from "../api/common/utils/DateUtils"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {styles} from "../gui/styles"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {eventEndsAfterDay, eventStartsBefore, expandEvent, getEventText, layOutEvents} from "./CalendarUtils"
import type {GestureInfo} from "../gui/base/ViewSlider"
import {gestureInfoFromTouch} from "../gui/base/ViewSlider"

export type CalendarDayViewAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date) => mixed,
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

	dayDom: HTMLElement;
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
			if (isAllDayEvent(e)) {
				allDayEvents.push(e)
			} else if (eventStartsBefore(date, e) || eventEndsAfterDay(date, e)) {
				longEvents.push(e)
			} else {
				shortEvents.push(e)
			}
		})

		return m(".fill-absolute.flex.col", {
			oncreate: (vnode) => {
				this.dayDom = vnode.dom
				this._redrawIntervalId = setInterval(m.redraw, 1000 * 60)
				m.redraw()
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
					console.log("velocity", velocity, "vertical", verticalVelocity)
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
					return m(CalendarEventBubble, {
						text: getEventText(e),
						color: defaultCalendarColor,
						onEventClicked: () => vnode.attrs.onEventClicked(e)
					})
				})),
				m(".calendar-day-content", longEvents.map(e => m(ContinuingCalendarEventBubble, {
					event: e,
					startDate: vnode.attrs.selectedDate,
					endDate: vnode.attrs.selectedDate,
					color: defaultCalendarColor,
					onEventClicked: () => vnode.attrs.onEventClicked(e),
					showText: true
				}))),
				m("hr.hr.mt-s")
			]),
			m(".scroll.col.rel", [
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
				this.dayDom ? this._renderEvents(vnode.attrs, shortEvents) : null,
				this._renderTimeIndicator(vnode.attrs),
			])
		])
	}

	_renderColumns(attrs: CalendarDayViewAttrs, columns: Array<Array<CalendarEvent>>): ChildArray {
		const columnWidth = (this.dayDom.scrollWidth - size.calendar_hour_width) / columns.length
		return columns.map((column, index) => {
			return column.map(event => {
				return this._renderEvent(attrs, event, index, columns, Math.floor(columnWidth))
			})
		})
	}

	_renderEvents(attrs: CalendarDayViewAttrs, events: Array<CalendarEvent>): Children {
		return layOutEvents(events, (columns) => this._renderColumns(attrs, columns), false)
	}


	_renderEvent(attrs: CalendarDayViewAttrs, ev: CalendarEvent, columnIndex: number, columns: Array<Array<CalendarEvent>>, columnWidth: number): Children {
		const startTime = (ev.startTime.getHours() * 60 + ev.startTime.getMinutes()) * 60 * 1000
		const height = (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 60 * 60) * size.calendar_hour_height
		const colSpan = expandEvent(ev, columnIndex, columns)

		return m(".abs", {
			style: {
				left: px(size.calendar_hour_width + columnWidth * columnIndex),
				width: px(columnWidth * colSpan),
				top: px(startTime / DAY_IN_MILLIS * allHoursHeight),
				height: px(height)
			},
		}, m(CalendarEventBubble, {
			text: getEventText(ev),
			date: attrs.selectedDate,
			color: defaultCalendarColor,
			onEventClicked: () => attrs.onEventClicked(ev),
			height: height - 2
		}))
	}

	_renderTimeIndicator(attrs: CalendarDayViewAttrs): Children {
		const now = new Date()
		if (!isSameDay(attrs.selectedDate, now)) {
			return null
		}

		const passedMillisInDay = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000
		const top = passedMillisInDay / DAY_IN_MILLIS * allHoursHeight
		return [
			m(".abs", {
				"aria-hidden": "true",
				style: {
					top: px(top),
					left: px(sizes.calendar_hour_width),
					right: 0,
					height: "2px",
					background: theme.content_accent
				}
			}),
			m(".abs", {
				"aria-hidden": "true",
				style: {
					top: px(top),
					left: px(sizes.calendar_hour_width),
					height: "12px",
					width: "12px",
					"border-radius": "50%",
					background: theme.content_accent,
					"margin-top": "-6px",
					"margin-left": "-6px",
				}
			})
		]
	}
}
