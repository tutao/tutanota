import m, { ChildArray, Children, Component, Vnode } from "mithril"
import { theme } from "../../gui/theme"
import { px, size } from "../../gui/size"
import { DAY_IN_MILLIS, downcast, getEndOfDay, getStartOfDay, mapNullable, neverNull, numberRange } from "@tutao/tutanota-utils"
import {
	eventEndsAfterDay,
	EventLayoutMode,
	eventStartsBefore,
	expandEvent,
	formatEventTime,
	getEventColor,
	getTimeTextFormatForLongEvent,
	getTimeZone,
	hasAlarmsForTheUser,
	layOutEvents,
	TEMPORARY_EVENT_OPACITY,
} from "../date/CalendarUtils"
import { CalendarEventBubble } from "./CalendarEventBubble"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Time } from "../../api/common/utils/Time"
import { getPosAndBoundsFromMouseEvent } from "../../gui/base/GuiUtils"
import { getTimeFromMousePos } from "./CalendarGuiUtils"
import type { CalendarEventBubbleClickHandler } from "./CalendarViewModel"
import type { GroupColors } from "./CalendarView"
import { styles } from "../../gui/styles"
import { locator } from "../../api/main/MainLocator.js"

export type Attrs = {
	onEventClicked: CalendarEventBubbleClickHandler
	groupColors: GroupColors
	events: Array<CalendarEvent>
	displayTimeIndicator: boolean
	onTimePressed: (hours: number, minutes: number) => unknown
	onTimeContextPressed: (hours: number, minutes: number) => unknown
	day: Date
	setCurrentDraggedEvent: (ev: CalendarEvent) => unknown
	setTimeUnderMouse: (time: Time) => unknown
	isTemporaryEvent: (event: CalendarEvent) => boolean
	isDragging: boolean
	fullViewWidth?: number
}
export const calendarDayTimes: Array<Time> = numberRange(0, 23).map((number) => new Time(number, 0))
const allHoursHeight = size.calendar_hour_height * calendarDayTimes.length

export class CalendarDayEventsView implements Component<Attrs> {
	private _dayDom: HTMLElement | null = null

	view({ attrs }: Vnode<Attrs>): Children {
		return m(
			".col.rel",
			{
				oncreate: (vnode) => {
					this._dayDom = vnode.dom as HTMLElement
					m.redraw()
				},
				onmousemove: (mouseEvent: MouseEvent) => {
					downcast(mouseEvent).redraw = false
					const time = getTimeFromMousePos(getPosAndBoundsFromMouseEvent(mouseEvent), 4)
					attrs.setTimeUnderMouse(time)
				},
			},
			[
				calendarDayTimes.map((time) =>
					m(".calendar-hour.flex.cursor-pointer", {
						onclick: (e: MouseEvent) => {
							e.stopPropagation()
							attrs.onTimePressed(time.hours, time.minutes)
						},
						oncontextmenu: (e: MouseEvent) => {
							attrs.onTimeContextPressed(time.hours, time.minutes)
							e.preventDefault()
						},
					}),
				),
				this._dayDom ? this._renderEvents(attrs, attrs.events) : null,
				this._renderTimeIndicator(attrs),
			],
		)
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
					background: theme.content_accent,
				},
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
				},
			}),
		]
	}

	_renderEvents(attrs: Attrs, events: Array<CalendarEvent>): Children {
		return layOutEvents(events, getTimeZone(), (columns) => this._renderColumns(attrs, columns), EventLayoutMode.TimeBasedColumn)
	}

	_renderEvent(attrs: Attrs, ev: CalendarEvent, columnIndex: number, columns: Array<Array<CalendarEvent>>, columnWidth: number): Children {
		// If an event starts in the previous day or ends in the next, we want to clamp top/height to fit within just this day
		const zone = getTimeZone()
		const startOfEvent = eventStartsBefore(attrs.day, zone, ev) ? getStartOfDay(attrs.day) : ev.startTime
		const endOfEvent = eventEndsAfterDay(attrs.day, zone, ev) ? getEndOfDay(attrs.day) : ev.endTime
		const startTime = (startOfEvent.getHours() * 60 + startOfEvent.getMinutes()) * 60 * 1000
		const height = ((endOfEvent.getTime() - startOfEvent.getTime()) / (1000 * 60 * 60)) * size.calendar_hour_height - size.calendar_event_border
		const fullViewWidth = attrs.fullViewWidth
		const maxWidth = fullViewWidth != null ? px(styles.isDesktopLayout() ? fullViewWidth / 2 : fullViewWidth) : "none"
		const colSpan = expandEvent(ev, columnIndex, columns)
		return m(
			".abs.darker-hover",
			{
				style: {
					maxWidth,
					left: px(columnWidth * columnIndex),
					width: px(columnWidth * colSpan),
					top: px((startTime / DAY_IN_MILLIS) * allHoursHeight),
					height: px(height),
				},
				onmousedown: () => {
					if (!attrs.isTemporaryEvent(ev)) {
						attrs.setCurrentDraggedEvent(ev)
					}
				},
			},
			m(CalendarEventBubble, {
				text: ev.summary,
				secondLineText: mapNullable(getTimeTextFormatForLongEvent(ev, attrs.day, attrs.day, zone), (option) => formatEventTime(ev, option)),
				color: getEventColor(ev, attrs.groupColors),
				click: (domEvent) => attrs.onEventClicked(ev, domEvent),
				height: height - size.calendar_day_event_padding,
				hasAlarm: hasAlarmsForTheUser(locator.logins.getUserController().user, ev),
				verticalPadding: size.calendar_day_event_padding,
				fadeIn: !attrs.isTemporaryEvent(ev),
				opacity: attrs.isTemporaryEvent(ev) ? TEMPORARY_EVENT_OPACITY : 1,
				enablePointerEvents: !attrs.isTemporaryEvent(ev) && !attrs.isDragging,
			}),
		)
	}

	_renderColumns(attrs: Attrs, columns: Array<Array<CalendarEvent>>): ChildArray {
		const columnWidth = neverNull(this._dayDom).clientWidth / columns.length
		return columns.map((column, index) => {
			return column.map((event) => {
				return this._renderEvent(attrs, event, index, columns, Math.floor(columnWidth))
			})
		})
	}
}

function getTimeIndicatorPosition(now: Date): number {
	const passedMillisInDay = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000
	return (passedMillisInDay / DAY_IN_MILLIS) * allHoursHeight
}
