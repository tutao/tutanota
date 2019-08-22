// @flow

import m from "mithril"
import {theme} from "../gui/theme"
import {px, size} from "../gui/size"
import {DAY_IN_MILLIS} from "../api/common/utils/DateUtils"
import {numberRange} from "../api/common/utils/ArrayUtils"
import {expandEvent, getEventColor, getEventText, getTimeZone, hasAlarmsForTheUser, layOutEvents} from "./CalendarUtils"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {EventTextTimeOption} from "../api/common/TutanotaConstants"
import {neverNull} from "../api/common/utils/Utils"
import {isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import type {CalendarEvent} from "../api/entities/tutanota/CalendarEvent"

export type Attrs = {
	onEventClicked: (event: CalendarEvent, domEvent: Event) => mixed,
	groupColors: {[Id]: string},
	events: Array<CalendarEvent>,
	displayTimeIndicator: boolean,
	onTimePressed: (hours: number, minutes: number) => mixed,
	onTimeContextPressed: (hours: number, minutes: number) => mixed,
}

export const calendarDayTimes: Array<Date> = numberRange(0, 23).map((n) => {
	const d = new Date()
	d.setHours(n, 0, 0, 0)
	return d
})
const allHoursHeight = size.calendar_hour_height * calendarDayTimes.length

export class CalendarDayEventsView implements MComponent<Attrs> {
	_dayDom: ?HTMLElement;

	view(vnode: Vnode<Attrs>): Children {
		return m(".col.rel",
			{
				oncreate: (vnode) => {
					this._dayDom = vnode.dom
					m.redraw()
				}
			},
			[
				calendarDayTimes.map(n => m(".calendar-hour.flex", {
						onclick: (e) => {
							e.stopPropagation()
							vnode.attrs.onTimePressed(n.getHours(), n.getMinutes())
						},
						oncontextmenu: (e) => {
							vnode.attrs.onTimeContextPressed(n.getHours(), n.getMinutes())
							e.preventDefault()
						}
					},
					)
				),
				this._dayDom ? this._renderEvents(vnode.attrs, vnode.attrs.events) : null,
				this._renderTimeIndicator(vnode.attrs),
			])
	}

	_renderTimeIndicator(attrs: Attrs): Children {
		const now = new Date()
		if (!attrs.displayTimeIndicator) {
			return null
		}
		const top = getTimeIndicatorPosition(now)

		return [
			m(".abs", {
				"aria-hidden": "true",
				style: {
					top: px(top),
					left: 0,
					right: 0,
					height: "2px",
					background: theme.content_accent
				}
			}),
			m(".abs", {
				"aria-hidden": "true",
				style: {
					top: px(top),
					left: 0,
					height: "12px",
					width: "12px",
					"border-radius": "50%",
					background: theme.content_accent,
					"margin-top": "-5px",
					"margin-left": "-7px",
				}
			})
		]
	}


	_renderEvents(attrs: Attrs, events: Array<CalendarEvent>): Children {
		return layOutEvents(events, getTimeZone(), (columns) => this._renderColumns(attrs, columns), false)
	}


	_renderEvent(attrs: Attrs, ev: CalendarEvent, columnIndex: number, columns: Array<Array<CalendarEvent>>, columnWidth: number): Children {
		const startTime = (ev.startTime.getHours() * 60 + ev.startTime.getMinutes()) * 60 * 1000
		const height = (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 60 * 60) * size.calendar_hour_height
		const colSpan = expandEvent(ev, columnIndex, columns)

		return m(".abs.darker-hover", {
			style: {
				left: px(columnWidth * columnIndex),
				width: px(columnWidth * colSpan),
				top: px(startTime / DAY_IN_MILLIS * allHoursHeight),
				height: px(height)
			},
		}, m(CalendarEventBubble, {
			text: getEventText(ev, isAllDayEvent(ev) ? EventTextTimeOption.NO_TIME : EventTextTimeOption.START_TIME),
			color: getEventColor(ev, attrs.groupColors),
			click: (domEvent) => attrs.onEventClicked(ev, domEvent),
			height: height - 2,
			hasAlarm: hasAlarmsForTheUser(ev),
			verticalPadding: 2
		}))
	}

	_renderColumns(attrs: Attrs, columns: Array<Array<CalendarEvent>>): ChildArray {
		const columnWidth = neverNull(this._dayDom).scrollWidth / columns.length
		return columns.map((column, index) => {
			return column.map(event => {
				return this._renderEvent(attrs, event, index, columns, Math.floor(columnWidth))
			})
		})
	}
}

function getTimeIndicatorPosition(now: Date): number {
	const passedMillisInDay = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000
	return passedMillisInDay / DAY_IN_MILLIS * allHoursHeight
}
