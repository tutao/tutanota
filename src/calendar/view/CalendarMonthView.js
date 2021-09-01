//@flow


import m from "mithril"
import {px, size} from "../../gui/size"
import type {WeekStartEnum} from "../../api/common/TutanotaConstants"
import {EventTextTimeOption, WeekStart} from "../../api/common/TutanotaConstants"
import type {CalendarDay} from "../date/CalendarUtils"
import {
	CALENDAR_EVENT_HEIGHT,
	EVENT_BEING_DRAGGED_OPACITY,
	getAllDayDateForTimezone,
	getCalendarMonth,
	getDateIndicator,
	getDiffInDays,
	getEventColor,
	getEventEnd,
	getStartOfDayWithZone,
	getStartOfNextDayWithZone,
	getStartOfTheWeekOffset,
	getTimeZone,
	getWeekNumber,
	layOutEvents
} from "../date/CalendarUtils"
import {incrementDate, isSameDay} from "../../api/common/utils/DateUtils"
import {flat, lastThrow} from "../../api/common/utils/ArrayUtils"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {styles} from "../../gui/styles"
import {formatMonthWithFullYear} from "../../misc/Formatter"
import {isAllDayEvent, isAllDayEventByTimes} from "../../api/common/utils/CommonCalendarUtils"
import {windowFacade} from "../../misc/WindowFacade"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {PageView} from "../../gui/base/PageView"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {logins} from "../../api/main/LoginController"
import type {CalendarEventBubbleClickHandler, CalendarViewTypeEnum, EventUpdateHandler, GroupColors} from "./CalendarView"
import {CalendarViewType, SELECTED_DATE_INDICATOR_THICKNESS} from "./CalendarView"
import type {MousePos} from "./EventDragHandler"
import {EventDragHandler} from "./EventDragHandler"
import type {MousePosAndBounds} from "../../gui/base/GuiUtils"
import {getPosAndBoundsFromMouseEvent} from "../../gui/base/GuiUtils"
import {locator} from "../../api/main/MainLocator"
import {ofClass} from "../../api/common/utils/PromiseUtils"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {theme} from "../../gui/theme"

type CalendarMonthAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date, calendarViewTypeToShow: CalendarViewTypeEnum) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: CalendarEventBubbleClickHandler,
	onChangeMonth: (next: boolean) => mixed,
	amPmFormat: boolean,
	startOfTheWeek: WeekStartEnum,
	groupColors: GroupColors,
	hiddenCalendars: Set<Id>,
	onEventMoved: EventUpdateHandler
}

type SimplePosRect = {top: number, left: number, right: number}

const dayHeight = () => styles.isDesktopLayout() ? 32 : 24
const spaceBetweenEvents = () => styles.isDesktopLayout() ? 2 : 1

export class CalendarMonthView implements MComponent<CalendarMonthAttrs>, Lifecycle<CalendarMonthAttrs> {
	_monthDom: ?HTMLElement;
	_resizeListener: () => mixed;
	_zone: string
	_lastWidth: number
	_lastHeight: number
	_eventDragHandler: EventDragHandler
	_dayUnderMouse: Date
	_lastMousePos: ?MousePos = null

	constructor(vnode: Vnode<CalendarMonthAttrs>) {
		this._resizeListener = m.redraw
		this._zone = getTimeZone()
		this._lastHeight = 0
		this._lastHeight = 0
		this._dayUnderMouse = vnode.attrs.selectedDate //TODO rather do nothing if null?
		this._eventDragHandler = new EventDragHandler(locator.entityClient) // TODO inject?
	}

	oncreate() {
		windowFacade.addResizeListener(this._resizeListener)
	}

	onremove() {
		windowFacade.removeResizeListener(this._resizeListener)
	}

	view({attrs}: Vnode<CalendarMonthAttrs>): Children {
		const previousMonthDate = new Date(attrs.selectedDate)
		previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
		previousMonthDate.setDate(1)

		const nextMonthDate = new Date(attrs.selectedDate)
		nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
		nextMonthDate.setDate(1)
		return m(PageView, {
			previousPage: {
				key: previousMonthDate.getTime(),
				nodes: this._monthDom ? this._renderCalendar(attrs, previousMonthDate, this._zone) : null
			},
			currentPage: {
				key: attrs.selectedDate.getTime(),
				nodes: this._renderCalendar(attrs, attrs.selectedDate, this._zone)
			},
			nextPage: {
				key: nextMonthDate.getTime(),
				nodes: this._monthDom ? this._renderCalendar(attrs, nextMonthDate, this._zone) : null
			},
			onChangePage: (next) => attrs.onChangeMonth(next)
		})
	}

	onbeforeupdate(newVnode: Vnode<CalendarMonthAttrs>, oldVnode: VnodeDOM<CalendarMonthAttrs>): boolean {
		const dom = this._monthDom
		const different = !dom
			|| oldVnode.attrs.eventsForDays !== newVnode.attrs.eventsForDays
			|| oldVnode.attrs.selectedDate !== newVnode.attrs.selectedDate
			|| oldVnode.attrs.amPmFormat !== newVnode.attrs.amPmFormat
			|| oldVnode.attrs.groupColors !== newVnode.attrs.groupColors
			|| oldVnode.attrs.hiddenCalendars !== newVnode.attrs.hiddenCalendars
			|| dom.offsetWidth !== this._lastWidth
			|| dom.offsetHeight !== this._lastHeight
		if (dom) {
			this._lastWidth = dom.offsetWidth
			this._lastHeight = dom.offsetHeight
		}
		return different || this._eventDragHandler.queryHasChanged()
	}

	_renderCalendar(attrs: CalendarMonthAttrs, date: Date, zone: string): Children {
		const startOfTheWeekOffset = getStartOfTheWeekOffset(attrs.startOfTheWeek)
		const {weekdays, weeks} = getCalendarMonth(date, startOfTheWeekOffset, false)
		const today = getStartOfDayWithZone(new Date(), getTimeZone())
		return m(".fill-absolute.flex.col.margin-are-inset-lr", [
			styles.isDesktopLayout() ?
				m(".mt-s.pr-l.flex.row.items-center",
					[
						m("button.calendar-switch-button", {
							onclick: () => attrs.onChangeMonth(false),
						}, m(Icon, {icon: Icons.ArrowDropLeft, class: "icon-large switch-month-button"})),
						m("button.calendar-switch-button", {
							onclick: () => attrs.onChangeMonth(true),
						}, m(Icon, {icon: Icons.ArrowDropRight, class: "icon-large switch-month-button"})),
						m("h1", formatMonthWithFullYear(date)),
					])
				: m(".pt-s"),
			m(".flex.mb-s", weekdays.map((wd) => m(".flex-grow", m(".calendar-day-indicator.b", wd)))),
			m(".flex.col.flex-grow", {
				oncreate: (vnode) => {
					if (date === attrs.selectedDate) {
						this._monthDom = vnode.dom
						m.redraw()
					}
				},
				onupdate: (vnode) => {
					if (date === attrs.selectedDate) {
						this._monthDom = vnode.dom
					}
				},
				onmousemove: mouseEvent => {
					const posAndBoundsFromMouseEvent = getPosAndBoundsFromMouseEvent(mouseEvent)
					this._lastMousePos = posAndBoundsFromMouseEvent
					const currentDate = this._getDateUnderMouseEvent(posAndBoundsFromMouseEvent, weeks)
					this._dayUnderMouse = currentDate
					this._eventDragHandler.handleDrag(currentDate, posAndBoundsFromMouseEvent)
				},
				onmouseup: () => this._endDrag(attrs.onEventMoved),
				onmouseleave: () => this._endDrag(attrs.onEventMoved),
			}, weeks.map((week) => {
				return m(".flex.flex-grow.rel", [
					week.map((d, i) => this._renderDay(attrs, d, today, i)),
					this._monthDom ? this._renderWeekEvents(attrs, week, zone) : null,
				])
			}))
		])
	}

	_endDrag(callback: (eventId: IdTuple, newStartDate: Date) => *) {
		this._eventDragHandler.endDrag(this._dayUnderMouse, callback)
		    .catch(ofClass(UserError, showUserError))
	}

	_getDateUnderMouseEvent({x, y, targetWidth, targetHeight}: MousePosAndBounds, weeks: Array<Array<CalendarDay>>): Date {
		const unitHeight = targetHeight / 6
		const unitWidth = targetWidth / 7
		const currentSquareX = Math.floor(x / unitWidth)
		const currentSquareY = Math.floor(y / unitHeight)
		return weeks[currentSquareY][currentSquareX].date
	}

	_renderDay(attrs: CalendarMonthAttrs, d: CalendarDay, today: Date, weekDayNumber: number): Children {
		const {selectedDate} = attrs
		const isSelectedDate = isSameDay(selectedDate, d.date)
		return m(".calendar-day.calendar-column-border.flex-grow.rel.overflow-hidden.fill-absolute"
			+ (d.paddingDay ? ".calendar-alternate-background" : ""), {
				key: d.date.getTime(),
				onclick: (e) => {
					if (styles.isDesktopLayout()) {
						const newDate = new Date(d.date)
						let hour = new Date().getHours()
						if (hour < 23) {
							hour++
						}
						newDate.setHours(hour, 0)
						attrs.onNewEvent(newDate)
						attrs.onDateSelected(new Date(d.date), CalendarViewType.MONTH)
					} else {
						attrs.onDateSelected(new Date(d.date), CalendarViewType.DAY)
					}
					e.preventDefault()
				},
			},
			[
				m(".mb-xs", {
					style: {
						height: px(SELECTED_DATE_INDICATOR_THICKNESS),
						background: isSelectedDate ? theme.content_accent : "none"
					},
				}),
				this._renderDayHeader(d, today, attrs.onDateSelected),
				// According to ISO 8601, weeks always start on Monday. Week numbering systems for
				// weeks that do not start on Monday are not strictly defined, so we only display
				// a week number if the user's client is configured to start weeks on Monday
				(weekDayNumber === 0) && (attrs.startOfTheWeek === WeekStart.MONDAY)
					? m(".calendar-month-week-number.abs", getWeekNumber(d.date))
					: null
			]
		)
	}


	_renderDayHeader(
		{date, day}: CalendarDay,
		today: Date,
		onDateSelected: (date: Date, calendarViewTypeToShow: CalendarViewTypeEnum) => mixed
	): Children {

		return m(".flex-center", [
			m(".calendar-day-indicator.circle" + getDateIndicator(date, today), {
				onclick: e => {
					onDateSelected(new Date(date), CalendarViewType.DAY)
					e.stopPropagation()
				},
				style: {
					width: px(22)
				}
			}, String(day)),

		])
	}


	_renderWeekEvents(attrs: CalendarMonthAttrs, week: Array<CalendarDay>, zone: string): Children {

		const eventsOnDays = this._eventDragHandler.getEventsOnDays(week.map(day => day.date), attrs.eventsForDays, attrs.hiddenCalendars)
		const events = new Set(eventsOnDays.longEvents.concat(flat(eventsOnDays.shortEvents)))

		const firstDayOfWeek = week[0].date
		const lastDayOfWeek = lastThrow(week)

		const dayWidth = this._getWidthForDay()
		const weekHeight = this._getHeightForWeek()
		const eventHeight = (size.calendar_line_height + spaceBetweenEvents()) // height + border
		const maxEventsPerDay = (weekHeight - dayHeight()) / eventHeight
		const eventsPerDay = Math.floor(maxEventsPerDay) - 1 // preserve some space for the more events indicator
		const moreEventsForDay = [0, 0, 0, 0, 0, 0, 0]
		const eventMargin = (styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile)
		const firstDayOfNextWeek = getStartOfNextDayWithZone(lastDayOfWeek.date, zone)
		return layOutEvents(Array.from(events), zone, (columns) => {
			return columns.map((events, columnIndex) => {
				return events.map(event => {
					if (columnIndex < eventsPerDay) {
						const eventIsAllDay = isAllDayEventByTimes(event.startTime, event.endTime)
						const eventStart = eventIsAllDay ? getAllDayDateForTimezone(event.startTime, zone) : event.startTime
						const eventEnd = eventIsAllDay ? incrementDate(getEventEnd(event, zone), -1) : event.endTime
						const position = this._getEventPosition(eventStart, eventEnd, firstDayOfWeek, firstDayOfNextWeek, dayWidth,
							dayHeight(), columnIndex)

						return this.renderEvent(event, position, eventStart, firstDayOfWeek, firstDayOfNextWeek, eventEnd, attrs)

					} else {
						week.forEach((dayInWeek, index) => {
							const eventsForDay = attrs.eventsForDays.get(dayInWeek.date.getTime())
							if (eventsForDay && eventsForDay.indexOf(event) !== -1) {
								moreEventsForDay[index]++
							}
						})
						return null
					}
				})
			}).concat(moreEventsForDay.map((moreEventsCount, weekday) => {
				const day = week[weekday]
				const isPadding = day.paddingDay
				if (moreEventsCount > 0) {
					return m(".abs.darker-hover" + (isPadding ? ".calendar-bubble-more-padding-day" : ""), {
						style: {
							bottom: px(1),
							height: px(CALENDAR_EVENT_HEIGHT),
							left: px(weekday * dayWidth + eventMargin),
							width: px(dayWidth - 2 - eventMargin * 2),
							pointerEvents: "none"
						}
					}, m("", {
						style: {
							'font-weight': '600'
						}
					}, "+" + moreEventsCount))
				} else {
					return null
				}

			}))
		}, true)
	}

	renderEvent(event: CalendarEvent, position: SimplePosRect, eventStart: Date, firstDayOfWeek: Date, firstDayOfNextWeek: Date, eventEnd: Date, attrs: CalendarMonthAttrs): Children {

		const eventBeingDragged = this._eventDragHandler.originalEvent
		const isTemporary = this._eventDragHandler.isTemporaryEvent(event)
		return m(".abs.overflow-hidden", {
			key: event._id[0] + event._id[1] + event.startTime.getTime(),
			style: {
				top: px(position.top),
				height: px(CALENDAR_EVENT_HEIGHT),
				left: px(position.left),
				right: px(position.right)
			},
			onmousedown: () => {
				if (this._lastMousePos && !isTemporary) {
					this._eventDragHandler.prepareDrag(event, this._dayUnderMouse, this._lastMousePos)
				}
			},
		}, m(ContinuingCalendarEventBubble, {
			event: event,
			startsBefore: eventStart < firstDayOfWeek,
			endsAfter: firstDayOfNextWeek < eventEnd,
			color: getEventColor(event, attrs.groupColors),
			showTime: styles.isDesktopLayout() && !isAllDayEvent(event) ? EventTextTimeOption.START_TIME : null,
			user: logins.getUserController().user,
			onEventClicked: (e, domEvent) => {
				attrs.onEventClicked(event, domEvent)
			},
			fadeIn: !this._eventDragHandler.isDragging,
			opacity: isTemporary
				? EVENT_BEING_DRAGGED_OPACITY
				: 1,
			enablePointerEvents: !this._eventDragHandler.isDragging && !isTemporary
		}))
	}

	_getEventPosition(
		eventStart: Date,
		eventEnd: Date,
		firstDayOfWeek: Date,
		firstDayOfNextWeek: Date,
		calendarDayWidth: number,
		calendarDayHeight: number,
		columnIndex: number,
	): SimplePosRect {
		const top = (size.calendar_line_height + spaceBetweenEvents()) * columnIndex + calendarDayHeight

		const dayOfStartDateInWeek = getDiffInDaysFast(eventStart, firstDayOfWeek)
		const dayOfEndDateInWeek = getDiffInDaysFast(eventEnd, firstDayOfWeek)

		const calendarEventMargin = styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile

		const left = (eventStart < firstDayOfWeek ? 0 : dayOfStartDateInWeek * calendarDayWidth) + calendarEventMargin
		const right = (eventEnd > firstDayOfNextWeek ? 0 : ((6 - dayOfEndDateInWeek) * calendarDayWidth)) + calendarEventMargin
		return {top, left, right}
	}

	_getHeightForWeek(): number {
		if (!this._monthDom) {
			return 1
		}
		const monthDomHeight = this._monthDom.offsetHeight
		return monthDomHeight / 6
	}

	_getWidthForDay(): number {
		if (!this._monthDom) {
			return 1
		}
		const monthDomWidth = this._monthDom.offsetWidth
		return monthDomWidth / 7
	}

}

/**
 * Optimization to not create luxon's DateTime in simple case.
 * May not work if we allow override time zones.
 */
function getDiffInDaysFast(left: Date, right: Date): number {
	if (left.getMonth() === right.getMonth()) {
		return left.getDate() - right.getDate()
	} else {
		return getDiffInDays(right, left)
	}
}
