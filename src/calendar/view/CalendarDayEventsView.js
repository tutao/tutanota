// @flow

import m from "mithril"
import {theme} from "../../gui/theme"
import {px, size} from "../../gui/size"
import {DAY_IN_MILLIS, getEndOfDay, getStartOfDay} from "../../api/common/utils/DateUtils"
import {numberRange} from "../../api/common/utils/ArrayUtils"
import {
	eventEndsAfterDay,
	eventStartsBefore,
	expandEvent,
	formatEventTime,
	getEventColor,
	getTimeTextFormatForLongEvent,
	getTimeZone,
	hasAlarmsForTheUser,
	layOutEvents,
	TEMPORARY_EVENT_OPACITY
} from "../date/CalendarUtils"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {mapNullable, neverNull} from "../../api/common/utils/Utils"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {logins} from "../../api/main/LoginController"
import {Time} from "../../api/common/utils/Time"
import {getPosAndBoundsFromMouseEvent} from "../../gui/base/GuiUtils"
import type {CalendarEventBubbleClickHandler, GroupColors} from "./CalendarView"
import {getTimeFromMousePos} from "./CalendarGuiUtils"

export type Attrs = {
	onEventClicked: CalendarEventBubbleClickHandler,
	groupColors: GroupColors,
	events: Array<CalendarEvent>,
	displayTimeIndicator: boolean,
	onTimePressed: (hours: number, minutes: number) => mixed,
	onTimeContextPressed: (hours: number, minutes: number) => mixed,
	day: Date,
	setCurrentDraggedEvent: (ev: CalendarEvent) => *,
	setTimeUnderMouse: (time: Time) => *,
	temporaryEvents: $ReadOnlyArray<CalendarEvent>,
	fullViewWidth?: number
}

export const calendarDayTimes: Array<Time> = numberRange(0, 23).map(number => new Time(number, 0))
const allHoursHeight = size.calendar_hour_height * calendarDayTimes.length

export class CalendarDayEventsView implements MComponent<Attrs> {
	_dayDom: ?HTMLElement;

	view({attrs}: Vnode<Attrs>): Children {
		return m(".col.rel",
			{
				oncreate: (vnode) => {
					this._dayDom = vnode.dom
					m.redraw()
				},
				onmousemove: (mouseEvent: MouseEvent) => {
					const time = getTimeFromMousePos(getPosAndBoundsFromMouseEvent(mouseEvent), 4)
					attrs.setTimeUnderMouse(time)
				}
			},
			[
				calendarDayTimes.map(time => m(".calendar-hour.flex", {
						onclick: (e) => {
							e.stopPropagation()
							attrs.onTimePressed(time.hours, time.minutes)
						},
						oncontextmenu: (e) => {
							attrs.onTimeContextPressed(time.hours, time.minutes)
							e.preventDefault()
						},
					},
				)),
				this._dayDom ? this._renderEvents(attrs, attrs.events) : null,
				this._renderTimeIndicator(attrs),
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

		// If an event starts in the previous day or ends in the next, we want to clamp top/height to fit within just this day
		const zone = getTimeZone()
		const startOfEvent = eventStartsBefore(attrs.day, zone, ev) ? getStartOfDay(attrs.day) : ev.startTime
		const endOfEvent = eventEndsAfterDay(attrs.day, zone, ev) ? getEndOfDay(attrs.day) : ev.endTime

		const startTime = (startOfEvent.getHours() * 60 + startOfEvent.getMinutes()) * 60 * 1000
		const height = (endOfEvent.getTime() - startOfEvent.getTime()) / (1000 * 60 * 60) * size.calendar_hour_height
		const maxWidth = attrs.fullViewWidth != null
			? px(attrs.fullViewWidth / 2)
			: "none"

		const colSpan = expandEvent(ev, columnIndex, columns)
		const padding = 2

		return m(".abs.darker-hover", {
			style: {
				maxWidth,
				left: px(columnWidth * columnIndex),
				width: px(columnWidth * colSpan),
				top: px(startTime / DAY_IN_MILLIS * allHoursHeight),
				height: px(height)
			},
			onmousedown: () => {
				if (!attrs.temporaryEvents.includes(ev)) {
					attrs.setCurrentDraggedEvent(ev)
				}
			},
		}, m(CalendarEventBubble, {
			text: ev.summary,
			secondLineText: mapNullable(getTimeTextFormatForLongEvent(ev, attrs.day, attrs.day, zone), option => formatEventTime(ev, option)),
			color: getEventColor(ev, attrs.groupColors),
			click: (domEvent) => attrs.onEventClicked(ev, domEvent),
			height: height - padding,
			hasAlarm: hasAlarmsForTheUser(logins.getUserController().user, ev),
			verticalPadding: padding,
			fadeIn: !attrs.temporaryEvents.includes(ev),
			opacity: attrs.temporaryEvents.includes(ev)
				? TEMPORARY_EVENT_OPACITY
				: 1,
			enablePointerEvents: !attrs.temporaryEvents.includes(ev)
		}))
	}

	_renderColumns(attrs: Attrs, columns: Array<Array<CalendarEvent>>): ChildArray {
		const columnWidth = neverNull(this._dayDom).clientWidth / columns.length
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
