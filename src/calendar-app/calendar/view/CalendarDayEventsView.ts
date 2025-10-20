import m, { ChildArray, Children, Component, Vnode } from "mithril"
import { px, size } from "../../../common/gui/size"
import { DAY_IN_MILLIS, downcast, getEndOfDay, getStartOfDay, mapNullable, neverNull, numberRange } from "@tutao/tutanota-utils"
import {
	eventEndsAfterDay,
	eventStartsBefore,
	getTimeTextFormatForLongEvent,
	getTimeZone,
	hasAlarmsForTheUser,
	isBirthdayCalendar,
} from "../../../common/calendar/date/CalendarUtils"
import { CalendarEventBubble } from "./CalendarEventBubble"
import type { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Time } from "../../../common/calendar/date/Time.js"
import { getPosAndBoundsFromMouseEvent } from "../../../common/gui/base/GuiUtils"
import {
	EventLayoutMode,
	expandEvent,
	formatEventTime,
	getDisplayEventTitle,
	getEventColor,
	getTimeFromMousePos,
	layOutEvents,
	TEMPORARY_EVENT_OPACITY,
} from "../gui/CalendarGuiUtils.js"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyDownHandler, EventWrapper } from "./CalendarViewModel"
import type { GroupColors } from "./CalendarView"
import { styles } from "../../../common/gui/styles"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { CalendarTimeIndicator } from "./CalendarTimeIndicator.js"
import { listIdPart } from "../../../common/api/common/utils/EntityUtils.js"

export type Attrs = {
	onEventClicked: CalendarEventBubbleClickHandler
	onEventKeyDown: CalendarEventBubbleKeyDownHandler
	groupColors: GroupColors
	events: Array<EventWrapper>
	displayTimeIndicator: boolean
	onTimePressed: (hours: number, minutes: number) => unknown
	onTimeContextPressed: (hours: number, minutes: number) => unknown
	day: Date
	setCurrentDraggedEvent: (eventWrapper: EventWrapper) => unknown
	setTimeUnderMouse: (time: Time) => unknown
	isTemporaryEvent: (event: EventWrapper) => boolean
	isDragging: boolean
	fullViewWidth?: number
	disabled?: boolean
}
export const calendarDayTimes: Array<Time> = numberRange(0, 23).map((number) => new Time(number, 0))
const allHoursHeight = size.calendar_hour_height * calendarDayTimes.length

export class CalendarDayEventsView implements Component<Attrs> {
	private dayDom: HTMLElement | null = null

	view({ attrs }: Vnode<Attrs>): Children {
		return m(
			".col.rel",
			{
				oncreate: (vnode) => {
					this.dayDom = vnode.dom as HTMLElement
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
							const { hour, minute } = getTimeFromClickInteraction(e, time)
							attrs.onTimePressed(hour, minute)
						},
						oncontextmenu: (e: MouseEvent) => {
							const { hour, minute } = getTimeFromClickInteraction(e, time)
							attrs.onTimeContextPressed(hour, minute)
							e.preventDefault()
						},
					}),
				),
				this.dayDom ? this.renderEvents(attrs, attrs.events) : null,
				this.renderTimeIndicator(attrs),
			],
		)
	}

	private renderTimeIndicator(attrs: Attrs): Children {
		const now = new Date()

		if (!attrs.displayTimeIndicator) {
			return null
		}

		const top = getTimeIndicatorPosition(now)
		return m(".abs", { style: { top: px(top), left: 0, right: 0 } }, m(CalendarTimeIndicator))
	}

	private renderEvents(attrs: Attrs, events: Array<EventWrapper>): Children {
		return layOutEvents(events, getTimeZone(), (columns) => this.renderColumns(attrs, columns), EventLayoutMode.TimeBasedColumn)
	}

	private renderEvent(attrs: Attrs, eventWrapper: EventWrapper, columnIndex: number, columns: Array<Array<EventWrapper>>, columnWidth: number): Children {
		// If an event starts in the previous day or ends in the next, we want to clamp top/height to fit within just this day
		const zone = getTimeZone()
		const startOfEvent = eventStartsBefore(attrs.day, zone, eventWrapper.event) ? getStartOfDay(attrs.day) : eventWrapper.event.startTime
		const endOfEvent = eventEndsAfterDay(attrs.day, zone, eventWrapper.event) ? getEndOfDay(attrs.day) : eventWrapper.event.endTime
		const startTime = (startOfEvent.getHours() * 60 + startOfEvent.getMinutes()) * 60 * 1000
		const height = ((endOfEvent.getTime() - startOfEvent.getTime()) / (1000 * 60 * 60)) * size.calendar_hour_height - size.calendar_event_border
		const fullViewWidth = attrs.fullViewWidth
		const maxWidth = fullViewWidth != null ? px(styles.isDesktopLayout() ? fullViewWidth / 2 : fullViewWidth) : "none"
		const colSpan = expandEvent(eventWrapper.event, columnIndex, columns)
		const eventTitle = getDisplayEventTitle(eventWrapper.event.summary)
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
					if (!attrs.isTemporaryEvent(eventWrapper)) {
						attrs.setCurrentDraggedEvent(eventWrapper)
					}
				},
			},
			m(CalendarEventBubble, {
				text: eventTitle,
				secondLineText: mapNullable(getTimeTextFormatForLongEvent(eventWrapper.event, attrs.day, attrs.day, zone), (option) => formatEventTime(eventWrapper.event, option)),
				color: getEventColor(eventWrapper.event, attrs.groupColors, eventWrapper.isGhost),
				border: eventWrapper.isGhost ? `2px dashed #${getEventColor(eventWrapper.event, attrs.groupColors)}` : undefined,
				click: (domEvent) => attrs.onEventClicked(eventWrapper.event, domEvent),
				keyDown: (domEvent) => attrs.onEventKeyDown(eventWrapper.event, domEvent),
				height: height - size.calendar_day_event_padding,
				hasAlarm: hasAlarmsForTheUser(locator.logins.getUserController().user, eventWrapper.event),
				isAltered: eventWrapper.event.recurrenceId != null,
				verticalPadding: size.calendar_day_event_padding,
				fadeIn: !attrs.isTemporaryEvent(eventWrapper),
				opacity: attrs.isTemporaryEvent(eventWrapper) ? TEMPORARY_EVENT_OPACITY : 1,
				enablePointerEvents: !attrs.isTemporaryEvent(eventWrapper) && !attrs.isDragging && !attrs.disabled,
				isBirthday: isBirthdayCalendar(listIdPart(eventWrapper.event._id)),
			}),
		)
	}

	private renderColumns(attrs: Attrs, columns: Array<Array<EventWrapper>>): ChildArray {
		const columnWidth = neverNull(this.dayDom).clientWidth / columns.length
		return columns.map((column, index) => {
			return column.map((event) => {
				return this.renderEvent(attrs, event, index, columns, Math.floor(columnWidth))
			}) as ChildArray
		}) as ChildArray
	}
}

function getTimeIndicatorPosition(now: Date): number {
	const passedMillisInDay = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000
	return (passedMillisInDay / DAY_IN_MILLIS) * allHoursHeight
}

function getTimeFromClickInteraction(e: MouseEvent, time: Time): Time {
	const rect = (e.target as HTMLElement).getBoundingClientRect()
	const mousePositionRelativeToRectHeight = Math.abs(rect.top - e.clientY)
	if (mousePositionRelativeToRectHeight > rect.height / 2) return new Time(time.hour, time.minute + 30)
	return time
}
