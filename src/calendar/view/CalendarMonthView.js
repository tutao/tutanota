//@flow


import m from "mithril"
import {px, size} from "../../gui/size"
import type {WeekStartEnum} from "../../api/common/TutanotaConstants"
import {EventTextTimeOption, WeekStart} from "../../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import {
	CALENDAR_EVENT_HEIGHT, getAllDayDateForTimezone,
	getCalendarMonth, getDateIndicator,
	getDiffInDays,
	getEventColor,
	getEventEnd,
	getStartOfDayWithZone,
	getStartOfNextDayWithZone,
	getStartOfTheWeekOffset, getTimeZone,
	getWeekNumber,
	layOutEvents
} from "../date/CalendarUtils"
import {incrementDate} from "../../api/common/utils/DateUtils"
import {lastThrow} from "../../api/common/utils/ArrayUtils"
import {theme} from "../../gui/theme"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {styles} from "../../gui/styles"
import {formatMonthWithFullYear} from "../../misc/Formatter"
import {isAllDayEvent, isAllDayEventByTimes} from "../../api/common/utils/CommonCalendarUtils"
import {windowFacade} from "../../misc/WindowFacade"
import {neverNull} from "../../api/common/utils/Utils"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {PageView} from "../../gui/base/PageView"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import type {CalendarDay} from "../date/CalendarUtils"
import {logins} from "../../api/main/LoginController"

type CalendarMonthAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (calendarEvent: CalendarEvent, clickEvent: Event) => mixed,
	onChangeMonth: (next: boolean) => mixed,
	amPmFormat: boolean,
	startOfTheWeek: WeekStartEnum,
	groupColors: {[Id]: string},
	hiddenCalendars: Set<Id>,
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

	constructor() {
		this._resizeListener = m.redraw
		this._zone = getTimeZone()
		this._lastHeight = 0
		this._lastHeight = 0
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

		const nextMonthDate = new Date(attrs.selectedDate)
		nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
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
		return different
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
				}
			}, weeks.map((week) => {
				return m(".flex.flex-grow.rel", [
					week.map((d, i) => this._renderDay(attrs, d, today, i)),
					this._monthDom ? this._renderWeekEvents(attrs, week, zone) : null,
				])
			}))
		])
	}

	_renderDay(attrs: CalendarMonthAttrs, d: CalendarDay, today: Date, weekDayNumber: number): Children {
		return m(".calendar-day.calendar-column-border.flex-grow.rel.overflow-hidden.fill-absolute"
			+ (d.paddingDay ? ".calendar-alternate-background" : ""), {
				key: d.date.getTime(),
				onclick: () => attrs.onDateSelected(new Date(d.date)),
				oncontextmenu: (e) => {
					if (styles.isDesktopLayout()) {
						const newDate = new Date(d.date)
						let hour = new Date().getHours()
						if (hour < 23) {
							hour++
						}
						newDate.setHours(hour, 0)
						attrs.onNewEvent(newDate)
					} else {
						attrs.onDateSelected(new Date(d.date))
					}
					e.preventDefault()
				}
			},
			[
				m(".calendar-day-indicator.calendar-day-number" + getDateIndicator(d.date, null, today), String(d.day)),
				// According to ISO 8601, weeks always start on Monday. Week numbering systems for
				// weeks that do not start on Monday are not strictly defined, so we only display
				// a week number if the user's client is configured to start weeks on Monday
				(weekDayNumber === 0) && (attrs.startOfTheWeek === WeekStart.MONDAY)
					? m(".calendar-month-week-number.abs", getWeekNumber(d.date))
					: null
			]
		)
	}

	_renderWeekEvents(attrs: CalendarMonthAttrs, week: Array<CalendarDay>, zone: string): Children {
		const events = new Set()
		week.forEach((day) => {
			const dayEvents = attrs.eventsForDays.get(day.date.getTime())
			dayEvents && dayEvents.forEach(e => {
				if (!attrs.hiddenCalendars.has(neverNull(e._ownerGroup))) events.add(e)
			})
		})


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
						return m(".abs.overflow-hidden", {
							key: event._id[0] + event._id[1] + event.startTime.getTime(),
							style: {
								top: px(position.top),
								height: px(CALENDAR_EVENT_HEIGHT),
								left: px(position.left),
								right: px(position.right)
							}
						}, this._renderEvent(attrs, event, eventStart < firstDayOfWeek, firstDayOfNextWeek < eventEnd))

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
							width: px(dayWidth - 2 - eventMargin * 2)
						}
					}, m(CalendarEventBubble, {
						text: "+" + moreEventsCount,
						color: isPadding ? theme.list_bg.substring(1) : theme.content_bg.substring(1),
						click: () => {
							attrs.onDateSelected(day.date)
						},
						hasAlarm: false,
					}))
				} else {
					return null
				}

			}))
		}, true)
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
		const right = (eventEnd > firstDayOfNextWeek ? 0 : ((6 - dayOfEndDateInWeek) * calendarDayWidth))
			+ calendarEventMargin
		return {top, left, right}
	}

	_renderEvent(attrs: CalendarMonthAttrs, event: CalendarEvent, startsBeforeWeek: boolean, endsAfterWeek: boolean): Children {
		return m(ContinuingCalendarEventBubble, {
			event: event,
			startsBefore: startsBeforeWeek,
			endsAfter: endsAfterWeek,
			color: getEventColor(event, attrs.groupColors),
			showTime: styles.isDesktopLayout() && !isAllDayEvent(event) ? EventTextTimeOption.START_TIME : EventTextTimeOption.NO_TIME,
			user: logins.getUserController().user,
			onEventClicked: (e, domEvent) => {
				attrs.onEventClicked(event, domEvent)
			},
		})
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
 */function getDiffInDaysFast(left: Date, right: Date): number {
	if (left.getMonth() === right.getMonth()) {
		return left.getDate() - right.getDate()
	} else {
		return getDiffInDays(left, right)
	}
}
