//@flow


import m from "mithril"
import {px, size} from "../gui/size"
import type {WeekStartEnum} from "../api/common/TutanotaConstants"
import {EventTextTimeOption} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import type {CalendarDay} from "./CalendarUtils"
import {
	CALENDAR_EVENT_HEIGHT,
	eventEndsAfterDay,
	eventStartsBefore,
	getCalendarMonth,
	getDiffInDays,
	getEventColor,
	getStartOfTheWeekOffset,
	getWeekNumber,
	layOutEvents
} from "./CalendarUtils"
import {getDateIndicator, getDayShifted, getStartOfDay} from "../api/common/utils/DateUtils"
import {lastThrow} from "../api/common/utils/ArrayUtils"
import {theme} from "../gui/theme"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {styles} from "../gui/styles"
import {formatMonthWithFullYear} from "../misc/Formatter"
import {getEventEnd, getEventStart, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import {windowFacade} from "../misc/WindowFacade"
import {debounce, neverNull} from "../api/common/utils/Utils"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {PageView} from "../gui/base/PageView"

type CalendarMonthAttrs = {
	selectedDate: Date,
	onDateSelected: (date: Date) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed,
	onChangeMonth: (next: boolean) => mixed,
	amPmFormat: boolean,
	startOfTheWeek: WeekStartEnum,
	groupColors: {[Id]: string},
	hiddenCalendars: Set<Id>,
}

const dayHeight = () => styles.isDesktopLayout() ? 32 : 24
const spaceBetweenEvents = () => styles.isDesktopLayout() ? 2 : 1


export class CalendarMonthView implements MComponent<CalendarMonthAttrs> {
	_monthDom: ?HTMLElement;
	_resizeListener: () => mixed;

	constructor() {
		this._resizeListener = m.redraw
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
			previousPage: this._monthDom ? this._renderCalendar(attrs, previousMonthDate) : null,
			currentPage: this._renderCalendar(attrs, attrs.selectedDate, (vnode) => {
				this._monthDom = vnode.dom
				m.redraw() // render week events needs height and width of days, schedule a redraw when dom is available.
			}),
			nextPage: this._monthDom ? this._renderCalendar(attrs, nextMonthDate) : null,
			onChangePage: (next) => attrs.onChangeMonth(next)
		})
	}

	_renderCalendar(attrs: CalendarMonthAttrs, date: Date, onCreateMonth: ?(Vnode<any> => mixed)): Children {
		const startOfTheWeekOffset = getStartOfTheWeekOffset(attrs.startOfTheWeek)
		const {weekdays, weeks} = getCalendarMonth(date, startOfTheWeekOffset, false)
		const today = getStartOfDay(new Date())
		return m(".fill-absolute.flex.col", [
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
			m(".flex.col.flex-grow", {oncreate: onCreateMonth}, weeks.map((week) => {
				return m(".flex.flex-grow.rel", [
					week.map((d, i) => this._renderDay(attrs, d, today, i)),
					this._monthDom ? this._renderWeekEvents(attrs, week) : null,
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
				weekDayNumber === 0 ? m(".calendar-month-week-number.abs", getWeekNumber(d.date)) : null,
			]
		)
	}

	_renderWeekEvents(attrs: CalendarMonthAttrs, week: Array<CalendarDay>): Children {
		const events = new Set()
		week.forEach((day) => {
			const dayEvents = attrs.eventsForDays.get(day.date.getTime())
			dayEvents && dayEvents.forEach(e => {
				if (!attrs.hiddenCalendars.has(neverNull(e._ownerGroup))) events.add(e)
			})
		})


		const firstDayOfWeek = week[0]
		const lastDayOfWeek = lastThrow(week)
		const dayWidth = this._getWidthForDay()
		const weekHeight = this._getHeightForWeek()
		const eventHeight = (size.calendar_line_height + spaceBetweenEvents()) // height + border
		const maxEventsPerDay = (weekHeight - dayHeight()) / eventHeight
		const eventsPerDay = Math.floor(maxEventsPerDay) - 1 // preserve some space for the more events indicator
		const moreEventsForDay = [0, 0, 0, 0, 0, 0, 0]
		const eventMargin = (styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile)
		return layOutEvents(Array.from(events), (columns) => {
			return columns.map((events, columnIndex) => {
				return events.map(event => {
					if (columnIndex < eventsPerDay) {
						const position = this._getEventPosition(event, firstDayOfWeek.date, lastDayOfWeek.date, dayWidth, dayHeight(), columnIndex)
						return m(".abs.overflow-hidden", {
							key: event._id[0] + event._id[1] + event.startTime.getTime(),
							style: {
								top: px(position.top),
								height: px(CALENDAR_EVENT_HEIGHT),
								left: px(position.left),
								right: px(position.right)
							}
						}, this._renderEvent(attrs, event, firstDayOfWeek.date, lastDayOfWeek.date))

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
						onEventClicked: () => {
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

	_getEventPosition(event: CalendarEvent, firstDayOfWeek: Date, lastDayOfWeek: Date, calendarDayWidth: number, calendarDayHeight: number, columnIndex: number): {top: number, left: number, right: number} {
		const top = (size.calendar_line_height + spaceBetweenEvents()) * columnIndex + calendarDayHeight

		const eventStart = getEventStart(event)
		const eventEnd = isAllDayEvent(event) ? getDayShifted(getEventEnd(event), -1) : event.endTime

		const dayOfStartDateInWeek = getDiffInDays(eventStart, firstDayOfWeek)
		const dayOfEndDateInWeek = getDiffInDays(eventEnd, firstDayOfWeek)

		const calendarEventMargin = styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile


		const left = (eventStartsBefore(firstDayOfWeek, event) ? 0 : dayOfStartDateInWeek * calendarDayWidth) + calendarEventMargin
		const right = (eventEndsAfterDay(lastDayOfWeek, event) ? 0 : ((6 - dayOfEndDateInWeek) * calendarDayWidth)) + calendarEventMargin
		return {
			top,
			left,
			right,
		}
	}


	_renderEvent(attrs: CalendarMonthAttrs, event: CalendarEvent, firstDayOfWeek: Date, lastDayOfWeek: Date): Children {
		return m(ContinuingCalendarEventBubble, {
			event: event,
			startDate: firstDayOfWeek,
			endDate: lastDayOfWeek,
			color: getEventColor(event, attrs.groupColors),
			showTime: styles.isDesktopLayout() && !isAllDayEvent(event) ? EventTextTimeOption.START_TIME : EventTextTimeOption.NO_TIME,
			onEventClicked: (e) => {
				attrs.onEventClicked(event)
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
