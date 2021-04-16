// @flow

import m from "mithril"
import {getStartOfDay, incrementDate} from "../../api/common/utils/DateUtils"
import {styles} from "../../gui/styles"
import {formatTime} from "../../misc/Formatter"
import {
	CALENDAR_EVENT_HEIGHT, DEFAULT_HOUR_OF_DAY,
	eventEndsAfterDay,
	eventStartsBefore,
	getCalendarWeek,
	getDiffInDays,
	getEventColor,
	getEventEnd,
	getEventStart, getTimeZone,
	getWeekNumber,
	layOutEvents
} from "../date/CalendarUtils"
import {CalendarDayEventsView, calendarDayTimes} from "./CalendarDayEventsView"
import {neverNull} from "../../api/common/utils/Utils"
import {isAllDayEvent} from "../../api/common/utils/CommonCalendarUtils"
import {theme} from "../../gui/theme"
import {px, size} from "../../gui/size"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import type {WeekStartEnum} from "../../api/common/TutanotaConstants"
import {EventTextTimeOption, WeekStart} from "../../api/common/TutanotaConstants"
import {lastThrow} from "../../api/common/utils/ArrayUtils"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {lang} from "../../misc/LanguageViewModel"
import {PageView} from "../../gui/base/PageView"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {logins} from "../../api/main/LoginController"

export type Attrs = {
	selectedDate: Date,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent, domEvent: Event) => mixed,
	groupColors: {[Id]: string},
	hiddenCalendars: Set<Id>,
	startOfTheWeek: WeekStartEnum,
	onChangeWeek: (next: boolean) => mixed,
}

type WeekEvents = {
	week: Array<Date>,
	eventsForWeek: Set<CalendarEvent>,
	eventsPerDay: Array<Array<CalendarEvent>>,
	longEvents: {children: Children, maxColumns: number}
}


export class CalendarWeekView implements MComponent<Attrs> {
	_redrawIntervalId: ?IntervalID;
	_longEventsDom: ?HTMLElement;
	_domElements: HTMLElement[] = [];
	_scrollPosition: number;

	constructor() {
		this._scrollPosition = size.calendar_hour_height * DEFAULT_HOUR_OF_DAY
	}

	view(vnode: Vnode<Attrs>): Children {
		const previousWeek = getCalendarWeek(incrementDate(new Date(vnode.attrs.selectedDate), -7), vnode.attrs.startOfTheWeek)
		const currentWeek = getCalendarWeek(vnode.attrs.selectedDate, vnode.attrs.startOfTheWeek)
		const nextWeek = getCalendarWeek(incrementDate(new Date(vnode.attrs.selectedDate), +7), vnode.attrs.startOfTheWeek)

		const previousPageEvents = this._getEventsForWeek(previousWeek, vnode.attrs)
		const currentPageEvents = this._getEventsForWeek(currentWeek, vnode.attrs)
		const nextPageEvents = this._getEventsForWeek(nextWeek, vnode.attrs)

		return m(PageView, {
			previousPage: {key: previousWeek[0].getTime(), nodes: this._renderWeek(vnode.attrs, previousPageEvents, currentPageEvents)},
			currentPage: {key: currentWeek[0].getTime(), nodes: this._renderWeek(vnode.attrs, currentPageEvents, currentPageEvents)},
			nextPage: {key: nextWeek[0].getTime(), nodes: this._renderWeek(vnode.attrs, nextPageEvents, currentPageEvents)},
			onChangePage: (next) => vnode.attrs.onChangeWeek(next)
		})
	}

	_renderWeek(attrs: Attrs, thisWeek: WeekEvents, mainWeek: WeekEvents): Children {
		const firstDate = thisWeek.week[0]
		const lastDate = lastThrow(thisWeek.week)
		let title: string
		if (firstDate.getMonth() !== lastDate.getMonth()) {
			title = `${lang.formats.monthLong.format(firstDate)} - ${lang.formats.monthLong.format(lastDate)} ${lang.formats.yearNumeric.format(firstDate)}`
		} else {
			title = `${lang.formats.monthLong.format(firstDate)} ${lang.formats.yearNumeric.format(firstDate)}`
		}
		const todayTimestamp = getStartOfDay(new Date()).getTime()

		const marginForWeekEvents = mainWeek.eventsForWeek.size === 0 ? 0 : 6

		const {startOfTheWeek} = logins.getUserController().userSettingsGroupRoot

		return m(".fill-absolute.flex.col.calendar-column-border.margin-are-inset-lr", {
			oncreate: () => {
				this._redrawIntervalId = setInterval(m.redraw, 1000 * 60)
			},
			onremove: () => {
				if (this._redrawIntervalId != null) {
					clearInterval(this._redrawIntervalId)
					this._redrawIntervalId = null
				}
			},
		}, [
			m(".calendar-long-events-header.mt-s.flex-fixed", {
				style: {height: px(45 + 24 + mainWeek.longEvents.maxColumns * CALENDAR_EVENT_HEIGHT + marginForWeekEvents + 8)},
			}, [
				m(".pr-l.flex.row.items-center", [
					m("button.calendar-switch-button", {
						onclick: () => attrs.onChangeWeek(false),
					}, m(Icon, {icon: Icons.ArrowDropLeft, class: "icon-large switch-month-button"})),
					m("button.calendar-switch-button", {
						onclick: () => attrs.onChangeWeek(true),
					}, m(Icon, {icon: Icons.ArrowDropRight, class: "icon-large switch-month-button"})),
					m("h1", title),
					// According to ISO 8601, weeks always start on Monday. Week numbering systems for
					// weeks that do not start on Monday are not strictly defined, so we only display
					// a week number if the user's client is configured to start weeks on Monday
					startOfTheWeek === WeekStart.MONDAY
						? m(".ml-m.content-message-bg.small", {style: {padding: "2px 4px"}}, lang.get("weekNumber_label", {"{week}": String(getWeekNumber(firstDate))}))
						: null
				]),
				m(".flex", {
					style: {
						"margin": `0 0 ${px(marginForWeekEvents)} ${px(size.calendar_hour_width)}`
					}
				}, thisWeek.week.map((wd) => m(".flex.center-horizontally.flex-grow.center.b.", [
					m(".calendar-day-indicator", {
						style: {"margin-right": "4px"},
					}, lang.formats.weekdayShort.format(wd) + " "),
					m(".calendar-day-indicator.calendar-day-number" + (todayTimestamp === wd.getTime() ? ".date-current" : ""), {
						style: {margin: "0"}
					}, wd.getDate())
				]))),
				m(".calendar-hour-margin.flex.row", {
						oncreate: (vnode) => {
							if (mainWeek === thisWeek) {
								this._longEventsDom = vnode.dom
							}
							m.redraw()
						},
						onupdate: (vnode) => {
							if (mainWeek === thisWeek) {
								this._longEventsDom = vnode.dom
							}
						}
					},
					m(".rel.mb-s",
						{style: {height: px(mainWeek.longEvents.maxColumns * CALENDAR_EVENT_HEIGHT), width: "100%"}},
						thisWeek.longEvents.children
					))
			]),
			m("", {
				style: {'border-bottom': `1px solid ${theme.content_border}`,}
			}),
			m(".flex.scroll", {
				oncreate: (vnode) => {
					vnode.dom.scrollTop = this._scrollPosition
					this._domElements.push(vnode.dom)
				},
				onscroll: (event) => {
					if (thisWeek === mainWeek) {
						this._domElements.forEach(dom => {
							if (dom !== event.target) {
								dom.scrollTop = event.target.scrollTop
							}
						})
						this._scrollPosition = event.target.scrollTop
					}
				},
			}, [
				m(".flex.col", calendarDayTimes.map(n => m(".calendar-hour.flex",
					m(".center.small", {
						style: {
							'line-height': px(size.calendar_hour_height),
							width: px(size.calendar_hour_width),
							height: px(size.calendar_hour_height),
							'border-right': `2px solid ${theme.content_border}`,
						},
					}, formatTime(n))
					)
				)),
				m(".flex.flex-grow", thisWeek.week.map((weekday, i) => {
						const events = thisWeek.eventsPerDay[i]
						const newEventHandler = (hours, minutes) => {
							const eventDate = new Date(weekday)
							eventDate.setHours(hours, minutes)
							attrs.onNewEvent(eventDate)
						}
						return m(".flex-grow.calendar-column-border", {
							style: {
								height: px(calendarDayTimes.length * size.calendar_hour_height)
							}
						}, m(CalendarDayEventsView, {
							onEventClicked: attrs.onEventClicked,
							groupColors: attrs.groupColors,
							events: events,
							displayTimeIndicator: weekday.getTime() === todayTimestamp,
							onTimePressed: newEventHandler,
							onTimeContextPressed: newEventHandler,
						}))
					})
				)
			]),
		])

	}


	_getEventsForWeek(week: Date[], attrs: Attrs): WeekEvents {
		const eventsForWeek = new Set()
		const eventsPerDay = []
		week.forEach((wd) => {
			const weekdayDate = wd
			const eventsForWeekDay = []
			const weekEvents = attrs.eventsForDays.get(wd.getTime()) || []
			weekEvents.forEach((event) => {
				if (!attrs.hiddenCalendars.has(neverNull(event._ownerGroup)) && !eventsForWeek.has(event)) {
					const isShort = !isAllDayEvent(event)
						&& !eventStartsBefore(weekdayDate, getTimeZone(), event)
						&& !eventEndsAfterDay(weekdayDate, getTimeZone(), event)
					if (isShort) {
						eventsForWeekDay.push(event)
					} else {
						eventsForWeek.add(event)
					}
				}
			})
			eventsPerDay.push(eventsForWeekDay)
		})
		const longEvents = this._renderLongEvents(week, eventsForWeek, attrs)
		return {week, eventsForWeek, eventsPerDay, longEvents}
	}

	_renderLongEvents(week: Array<Date>, eventsForWeek: Set<CalendarEvent>, attrs: Attrs): {children: Children, maxColumns: number} {
		if (this._longEventsDom == null) {
			return {children: null, maxColumns: 0}
		}
		const dayWidth = this._longEventsDom.offsetWidth / 7
		let maxColumns = 0
		const firstDayOfWeek = week[0]
		const lastDayOfWeek = lastThrow(week)
		const calendarEventMargin = styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile

		const zone = getTimeZone()
		const children = layOutEvents(Array.from(eventsForWeek), zone, (columns) => {
			maxColumns = Math.max(maxColumns, columns.length)
			return columns.map((rows, c) =>
				rows.map((event) => {
					const zone = getTimeZone()
					const eventEnd = isAllDayEvent(event) ? incrementDate(getEventEnd(event, zone), -1) : event.endTime
					const dayOfStartDateInWeek = getDiffInDays(getEventStart(event, zone), firstDayOfWeek)
					const dayOfEndDateInWeek = getDiffInDays(eventEnd, firstDayOfWeek)
					const startsBefore = eventStartsBefore(firstDayOfWeek, zone, event)
					const endsAfter = eventEndsAfterDay(lastDayOfWeek, zone, event)
					const left = startsBefore ? 0 : dayOfStartDateInWeek * dayWidth
					const right = endsAfter ? 0 : (6 - dayOfEndDateInWeek) * dayWidth
						+ calendarEventMargin
					return m(".abs", {
						style: {
							top: px(c * CALENDAR_EVENT_HEIGHT),
							left: px(left),
							right: px(right),
						},
						key: event._id[0] + event._id[1] + event.startTime.getTime()
					}, m(ContinuingCalendarEventBubble, {
						event,
						startsBefore,
						endsAfter,
						color: getEventColor(event, attrs.groupColors),
						onEventClicked: attrs.onEventClicked,
						showTime: isAllDayEvent(event) ? EventTextTimeOption.NO_TIME : EventTextTimeOption.START_TIME,
						user: logins.getUserController().user
					}))
				}))
		}, true)

		return {
			children,
			maxColumns
		}
	}
}
