//@flow


import m from "mithril"
import {px, size} from "../../gui/size"
import type {WeekStartEnum} from "../../api/common/TutanotaConstants"
import {EventTextTimeOption, WeekStart} from "../../api/common/TutanotaConstants"
import type {CalendarDay, CalendarMonth} from "../date/CalendarUtils"
import {
	CALENDAR_EVENT_HEIGHT,
	getAllDayDateForTimezone,
	getCalendarMonth,
	getDateIndicator,
	getDiffInDays,
	getEventColor,
	getEventEnd,
	getFirstDayOfMonth,
	getStartOfDayWithZone,
	getStartOfNextDayWithZone,
	getStartOfTheWeekOffset,
	getTimeZone,
	getWeekNumber,
	layOutEvents,
	TEMPORARY_EVENT_OPACITY
} from "../date/CalendarUtils"
import {incrementDate, incrementMonth, isSameDay} from "@tutao/tutanota-utils"
import {flat, lastThrow} from "@tutao/tutanota-utils"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {styles} from "../../gui/styles"
import {formatMonthWithFullYear} from "../../misc/Formatter"
import {isAllDayEvent, isAllDayEventByTimes} from "../../api/common/utils/CommonCalendarUtils"
import {windowFacade} from "../../misc/WindowFacade"
import {PageView} from "../../gui/base/PageView"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {logins} from "../../api/main/LoginController"
import type {GroupColors} from "./CalendarView"
import {SELECTED_DATE_INDICATOR_THICKNESS} from "./CalendarView"
import type {EventDragHandlerCallbacks, MousePos} from "./EventDragHandler"
import {EventDragHandler} from "./EventDragHandler"
import {getPosAndBoundsFromMouseEvent} from "../../gui/base/GuiUtils"
import {ofClass} from "@tutao/tutanota-utils"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {theme} from "../../gui/theme"
import {getDateFromMousePos, renderCalendarSwitchLeftButton, renderCalendarSwitchRightButton} from "./CalendarGuiUtils"
import type {CalendarEventBubbleClickHandler, CalendarViewTypeEnum, EventsOnDays} from "./CalendarViewModel"
import {CalendarViewType} from "./CalendarViewModel"
import {Time} from "../../api/common/utils/Time"
import {neverNull} from "@tutao/tutanota-utils"
import {client} from "../../misc/ClientDetector"

type CalendarMonthAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date, calendarViewTypeToShow: CalendarViewTypeEnum) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	getEventsOnDays: (range: Array<Date>) => EventsOnDays,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: CalendarEventBubbleClickHandler,
	onChangeMonth: (next: boolean) => mixed,
	amPmFormat: boolean,
	startOfTheWeek: WeekStartEnum,
	groupColors: GroupColors,
	hiddenCalendars: $ReadOnlySet<Id>,
	temporaryEvents: Array<CalendarEvent>,
	dragHandlerCallbacks: EventDragHandlerCallbacks
}

type SimplePosRect = {top: number, left: number, right: number}

const dayHeight = () => styles.isDesktopLayout() ? 32 : 24
const spaceBetweenEvents = () => styles.isDesktopLayout() ? 2 : 1
const EVENT_BUBBLE_VERTICAL_OFFSET = 5

export class CalendarMonthView implements MComponent<CalendarMonthAttrs>, Lifecycle<CalendarMonthAttrs> {
	_monthDom: ?HTMLElement;
	_resizeListener: () => mixed;
	_zone: string
	_lastWidth: number
	_lastHeight: number
	_eventDragHandler: EventDragHandler
	_dayUnderMouse: ?Date = null
	_lastMousePos: ?MousePos = null

	constructor({attrs}: Vnode<CalendarMonthAttrs>) {
		this._resizeListener = m.redraw
		this._zone = getTimeZone()
		this._lastHeight = 0
		this._lastHeight = 0
		this._eventDragHandler = new EventDragHandler(neverNull(document.body), attrs.dragHandlerCallbacks)
	}

	oncreate() {
		windowFacade.addResizeListener(this._resizeListener)
	}

	onremove() {
		windowFacade.removeResizeListener(this._resizeListener)
	}

	view({attrs}: Vnode<CalendarMonthAttrs>): Children {

		const startOfTheWeekOffset = getStartOfTheWeekOffset(attrs.startOfTheWeek)
		const thisMonth = getCalendarMonth(attrs.selectedDate, startOfTheWeekOffset, false)

		const previousMonthDate = new Date(attrs.selectedDate)
		previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
		const previousMonth = getCalendarMonth(previousMonthDate, startOfTheWeekOffset, false)

		const nextMonthDate = new Date(attrs.selectedDate)
		nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
		const nextMonth = getCalendarMonth(nextMonthDate, startOfTheWeekOffset, false)

		let lastMontDate = incrementMonth(attrs.selectedDate, -1)
		let nextMontDate = incrementMonth(attrs.selectedDate, 1)
		return m(PageView, {
			previousPage: {
				key: getFirstDayOfMonth(lastMontDate).getTime(),
				nodes: this._monthDom ? this._renderCalendar(attrs, previousMonth, thisMonth, lastMontDate, this._zone) : null
			},
			currentPage: {
				key: getFirstDayOfMonth(attrs.selectedDate).getTime(),
				nodes: this._renderCalendar(attrs, thisMonth, thisMonth, attrs.selectedDate, this._zone)
			},
			nextPage: {
				key: getFirstDayOfMonth(nextMontDate).getTime(),
				nodes: this._monthDom ? this._renderCalendar(attrs, nextMonth, thisMonth, nextMontDate, this._zone) : null
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

	_renderCalendar(attrs: CalendarMonthAttrs, month: CalendarMonth, currentlyVisibleMonth: CalendarMonth, date: Date, zone: string): Children {
		const {weekdays, weeks} = month
		const firstDay = getFirstDayOfMonth(date)
		const today = getStartOfDayWithZone(new Date(), getTimeZone())
		return m(".fill-absolute.flex.col.margin-are-inset-lr", [
			styles.isDesktopLayout() ?
				m(".mt-s.pr-l.flex.row.items-center",
					[
						renderCalendarSwitchLeftButton("prevMonth_label", () => attrs.onChangeMonth(false)),
						renderCalendarSwitchRightButton("nextMonth_label", () => attrs.onChangeMonth(true)),
						m("h1", formatMonthWithFullYear(firstDay)),
					])
				: m(".pt-s"),
			m(".flex.mb-s", weekdays.map((wd) => m(".flex-grow", m(".calendar-day-indicator.b", wd)))),
			m(".flex.col.flex-grow", {
				oncreate: (vnode) => {
					if (month === currentlyVisibleMonth) {
						this._monthDom = vnode.dom
						m.redraw()
					}
				},
				onupdate: (vnode) => {
					if (month === currentlyVisibleMonth) {
						this._monthDom = vnode.dom
					}
				},
				onmousemove: (mouseEvent) => {
					mouseEvent.redraw = false
					const posAndBoundsFromMouseEvent = getPosAndBoundsFromMouseEvent(mouseEvent)
					this._lastMousePos = posAndBoundsFromMouseEvent
					this._dayUnderMouse = getDateFromMousePos(posAndBoundsFromMouseEvent, weeks.map(week => week.map(day => day.date)))
					this._eventDragHandler.handleDrag(this._dayUnderMouse, posAndBoundsFromMouseEvent)
				},
				onmouseup: (mouseEvent) => {
					mouseEvent.redraw = false
					this._endDrag()
				},
				onmouseleave: (mouseEvent) => {
					mouseEvent.redraw = false
					this._endDrag()
				},
			}, weeks.map((week) => {
				return m(".flex.flex-grow.rel", {
					key: week[0].date.getTime()
				}, [
					week.map((day, i) => this._renderDay(attrs, day, today, i)),
					this._monthDom ? this._renderWeekEvents(attrs, week, zone) : null,
				])
			}))
		])
	}

	_endDrag() {
		const dayUnderMouse = this._dayUnderMouse
		const originalDate = this._eventDragHandler.originalEvent?.startTime
		if (dayUnderMouse && originalDate) {
			//make sure the date we move to also gets a time
			const dateUnderMouse = Time.fromDate(originalDate).toDate(dayUnderMouse)
			this._eventDragHandler.endDrag(dateUnderMouse)
			    .catch(ofClass(UserError, showUserError))
		}
	}

	_renderDay(attrs: CalendarMonthAttrs, day: CalendarDay, today: Date, weekDayNumber: number): Children {
		const {selectedDate} = attrs
		const isSelectedDate = isSameDay(selectedDate, day.date)
		return m(".calendar-day.calendar-column-border.flex-grow.rel.overflow-hidden.fill-absolute.cursor-pointer"
			+ (day.paddingDay ? ".calendar-alternate-background" : ""),
			{
				key: day.date.getTime(),
				onclick: (e) => {
					if (client.isDesktopDevice()) {
						const newDate = new Date(day.date)
						let hour = new Date().getHours()
						if (hour < 23) {
							hour++
						}
						newDate.setHours(hour, 0)
						attrs.onDateSelected(new Date(day.date), CalendarViewType.MONTH)
						attrs.onNewEvent(newDate)
					} else {
						attrs.onDateSelected(new Date(day.date), CalendarViewType.DAY)
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
				this._renderDayHeader(day, today, attrs.onDateSelected),
				// According to ISO 8601, weeks always start on Monday. Week numbering systems for
				// weeks that do not start on Monday are not strictly defined, so we only display
				// a week number if the user's client is configured to start weeks on Monday
				(weekDayNumber === 0) && (attrs.startOfTheWeek === WeekStart.MONDAY)
					? m(".calendar-month-week-number.abs", getWeekNumber(day.date))
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
			m(client.isDesktopDevice() ? ".calendar-day-indicator.circle" : "" + getDateIndicator(date, today), {
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

		const eventsOnDays = attrs.getEventsOnDays(week.map(day => day.date))
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
					return m(".abs.small" + (isPadding ? ".calendar-bubble-more-padding-day" : ""), {
						style: {
							bottom: px(-EVENT_BUBBLE_VERTICAL_OFFSET),
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
		const isTemporary = attrs.temporaryEvents.includes(event)
		return m(".abs.overflow-hidden", {
			key: event._id[0] + event._id[1] + event.startTime.getTime(),
			style: {
				top: px(position.top),
				height: px(CALENDAR_EVENT_HEIGHT),
				left: px(position.left),
				right: px(position.right),
				pointerEvents: !styles.isUsingBottomNavigation() ? "auto" : "none"
			},
			onmousedown: () => {
				let dayUnderMouse = this._dayUnderMouse
				let lastMousePos = this._lastMousePos
				if (dayUnderMouse && lastMousePos && !isTemporary) {
					this._eventDragHandler.prepareDrag(event, dayUnderMouse, lastMousePos, true)
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
				? TEMPORARY_EVENT_OPACITY
				: 1,
			enablePointerEvents: !this._eventDragHandler.isDragging && !isTemporary && client.isDesktopDevice()
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
		const top = (size.calendar_line_height + spaceBetweenEvents()) * columnIndex + calendarDayHeight + EVENT_BUBBLE_VERTICAL_OFFSET

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
