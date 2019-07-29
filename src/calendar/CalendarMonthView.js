//@flow


import m from "mithril"
import {px, size} from "../gui/size"
import type {WeekStartEnum} from "../api/common/TutanotaConstants"
import {EventTextTimeOption, WeekStart} from "../api/common/TutanotaConstants"
import {CalendarEventBubble} from "./CalendarEventBubble"
import type {CalendarDay} from "./CalendarUtils"
import {eventEndsAfterDay, eventStartsBefore, getCalendarMonth, getDiffInDays, getEventColor, layOutEvents} from "./CalendarUtils"
import {getDateIndicator, getDayShifted, getStartOfDay} from "../api/common/utils/DateUtils"
import {lastThrow} from "../api/common/utils/ArrayUtils"
import {theme} from "../gui/theme"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import {styles} from "../gui/styles"
import {formatMonthWithFullYear} from "../misc/Formatter"
import {getEventEnd, getEventStart, isAllDayEvent} from "../api/common/utils/CommonCalendarUtils"
import type {GestureInfo} from "../gui/base/ViewSlider"
import {gestureInfoFromTouch} from "../gui/base/ViewSlider"
import {windowFacade} from "../misc/WindowFacade"
import {debounce, neverNull} from "../api/common/utils/Utils"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"

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

const weekDaysHeight = 30
const dayHeight = () => styles.isDesktopLayout() ? 32 : 24
const spaceBetweenEvents = () => styles.isDesktopLayout() ? 2 : 1

function getStartOfTheWeekOffset(weekStart: WeekStartEnum): number {
	switch (weekStart) {
		case WeekStart.SUNDAY:
			return 0
		case WeekStart.MONDAY:
		default:
			return 1
	}
}

export class CalendarMonthView implements MComponent<CalendarMonthAttrs> {
	_monthDom: ?HTMLElement;
	_lastGestureInfo: ?GestureInfo;
	_oldGestureInfo: ?GestureInfo;
	_resizeListener: () => mixed;

	constructor() {
		// Redraw after timeout with pause because when changing mobile device orientation the size is not correct on the first draw
		this._resizeListener = debounce(100, m.redraw)
	}

	oncreate() {
		windowFacade.addResizeListener(this._resizeListener)
	}

	onremove() {
		windowFacade.removeResizeListener(this._resizeListener)
	}

	view({attrs}: Vnode<CalendarMonthAttrs>): Children {
		const startOfTheWeekOffset = getStartOfTheWeekOffset(attrs.startOfTheWeek)
		const {weekdays, weeks} = getCalendarMonth(attrs.selectedDate, startOfTheWeekOffset, false)
		const today = getStartOfDay(new Date())
		return m(".fill-absolute.flex.col", {
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
							attrs.onChangeMonth(false)
						} else if (velocity < -0.6) {
							attrs.onChangeMonth(true)
						}
					}
				},
			},
			[
				styles.isDesktopLayout() ?
					m(".mt-s.pr-l.flex.row.items-center",
						[
							m("button.ml-s.calendar-day-content", {
								onclick: () => attrs.onChangeMonth(false)
							}, m(Icon, {icon: Icons.ArrowBackward, class: "icon-large switch-month-button"})),
							m("button", {
								onclick: () => attrs.onChangeMonth(true)
							}, m(Icon, {icon: Icons.ArrowForward, class: "icon-large switch-month-button"})),
							m("h1.ml-m", formatMonthWithFullYear(attrs.selectedDate)),
						])
					: null,
				m(".flex.pt-s.pb-s", {
					style: {
						height: px(weekDaysHeight)
					}
				}, weekdays.map((wd) => m(".flex-grow", m(".b.small.center", wd)))),
				m(".flex.col.flex-grow", {
					oncreate: (vnode) => {
						this._monthDom = vnode.dom
						m.redraw() // render week events needs height and width of days, schedule a redraw when dom is available.
					}
				}, weeks.map((week) => {
					return m(".flex.flex-grow.rel", [
						week.map((d) => this._renderDay(attrs, d, today)),
						this._monthDom ? this._renderWeekEvents(attrs, week) : null,
					])
				}))
			])
	}

	_renderDay(attrs: CalendarMonthAttrs, d: CalendarDay, today: Date): Children {
		return m(".calendar-day.flex-grow.rel.overflow-hidden.fill-absolute"
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
			m(".calendar-day-number" + getDateIndicator(d.date, today), String(d.day)),
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
								height: px(size.calendar_line_height + 2),
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
							height: px(size.calendar_line_height + 2),
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
			showTime: styles.isDesktopLayout() ? EventTextTimeOption.START_TIME : EventTextTimeOption.NO_TIME,
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
