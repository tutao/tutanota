// @flow

import m from "mithril"
import {getStartOfDay, incrementDate, isSameDay} from "../../api/common/utils/DateUtils"
import {formatTime} from "../../misc/Formatter"
import {
	CALENDAR_EVENT_HEIGHT,
	combineDateWithTime,
	DEFAULT_HOUR_OF_DAY,
	EVENT_BEING_DRAGGED_OPACITY,
	eventEndsAfterDay,
	eventStartsBefore,
	getDiffInDays,
	getEventColor,
	getEventEnd,
	getEventStart,
	getRangeOfDays,
	getStartOfTheWeekOffset,
	getStartOfWeek,
	getTimeTextFormatForLongEvent,
	getTimeZone,
	getWeekNumber,
	layOutEvents
} from "../date/CalendarUtils"
import {CalendarDayEventsView, calendarDayTimes} from "./CalendarDayEventsView"
import {isAllDayEvent} from "../../api/common/utils/CommonCalendarUtils"
import {theme} from "../../gui/theme"
import {px, size} from "../../gui/size"
import {ContinuingCalendarEventBubble} from "./ContinuingCalendarEventBubble"
import type {EventTextTimeOptionEnum, WeekStartEnum} from "../../api/common/TutanotaConstants"
import {EventTextTimeOption, WeekStart} from "../../api/common/TutanotaConstants"
import {lastThrow} from "../../api/common/utils/ArrayUtils"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {lang} from "../../misc/LanguageViewModel"
import {PageView} from "../../gui/base/PageView"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {logins} from "../../api/main/LoginController"
import type {CalendarEventBubbleClickHandler, CalendarViewTypeEnum, EventUpdateHandler, GroupColors} from "./CalendarView"
import {CalendarViewType, SELECTED_DATE_INDICATOR_THICKNESS} from "./CalendarView"
import type {EventsOnDays, MousePos} from "./EventDragHandler"
import {EventDragHandler} from "./EventDragHandler"
import {locator} from "../../api/main/MainLocator"
import {getPosAndBoundsFromMouseEvent} from "../../gui/base/GuiUtils"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {styles} from "../../gui/styles"
import {ofClass} from "../../api/common/utils/PromiseUtils"
import {haveSameId} from "../../api/common/utils/EntityUtils"

export type Attrs = {
	selectedDate: Date,
	daysInPeriod: number,
	renderHeaderText: Date => string,
	onDateSelected: (date: Date, calendarViewTypeToShow?: CalendarViewTypeEnum) => mixed,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: CalendarEventBubbleClickHandler,
	groupColors: GroupColors,
	hiddenCalendars: Set<Id>,
	startOfTheWeek: WeekStartEnum,
	onChangeViewPeriod: (next: boolean) => mixed,
	onEventMoved: EventUpdateHandler
}

export class MultiDayCalendarView implements MComponent<Attrs> {
	_redrawIntervalId: ?IntervalID;
	_longEventsDom: ?HTMLElement;
	_domElements: HTMLElement[] = [];
	_scrollPosition: number;
	_eventDragHandler: EventDragHandler
	_dateUnderMouse: Date
	_viewDom: ?HTMLElement = null
	_lastMousePos: ?MousePos = null
	_isHeaderEventBeingDragged: boolean = false

	constructor() {
		this._scrollPosition = size.calendar_hour_height * DEFAULT_HOUR_OF_DAY
		this._dateUnderMouse = vnode.attrs.selectedDate
		this._eventDragHandler = new EventDragHandler(locator.entityClient)
	}

	oncreate(vnode: Vnode<Attrs>) {
		this._viewDom = vnode.dom
	}

	onupdate(vnode: Vnode<Attrs>) {
		this._viewDom = vnode.dom
	}

	view({attrs}: Vnode<Attrs>): Children {

		// Special case for week view
		const startOfThisPeriod = attrs.daysInPeriod === 7
			? getStartOfWeek(attrs.selectedDate, getStartOfTheWeekOffset(attrs.startOfTheWeek))
			: attrs.selectedDate
		const startOfPreviousPeriod = incrementDate(new Date(startOfThisPeriod), -attrs.daysInPeriod)
		const startOfNextPeriod = incrementDate(new Date(startOfThisPeriod), attrs.daysInPeriod)

		const previousRange = getRangeOfDays(startOfPreviousPeriod, attrs.daysInPeriod)
		const currentRange = getRangeOfDays(startOfThisPeriod, attrs.daysInPeriod)
		const nextRange = getRangeOfDays(startOfNextPeriod, attrs.daysInPeriod)

		const previousPageEvents = this._eventDragHandler.getEventsOnDays(previousRange, attrs.eventsForDays, attrs.hiddenCalendars)
		const currentPageEvents = this._eventDragHandler.getEventsOnDays(currentRange, attrs.eventsForDays, attrs.hiddenCalendars)
		const nextPageEvents = this._eventDragHandler.getEventsOnDays(nextRange, attrs.eventsForDays, attrs.hiddenCalendars)

		return m(PageView, {
			previousPage: {key: previousRange[0].getTime(), nodes: this._renderWeek(attrs, previousPageEvents, currentPageEvents)},
			currentPage: {key: currentRange[0].getTime(), nodes: this._renderWeek(attrs, currentPageEvents, currentPageEvents)},
			nextPage: {key: nextRange[0].getTime(), nodes: this._renderWeek(attrs, nextPageEvents, currentPageEvents)},
			onChangePage: (next) => attrs.onChangeViewPeriod(next)
		})
	}

	_getTodayTimestamp(): number {
		return getStartOfDay(new Date()).getTime()
	}

	_renderWeek(attrs: Attrs, thisWeek: EventsOnDays, mainWeek: EventsOnDays): Children {

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
			onmousemove: ev => {
				const dateUnderMouse = this.getDateUnderMouse()
				this._lastMousePos = getPosAndBoundsFromMouseEvent(ev)
				if (dateUnderMouse) {
					return this._eventDragHandler.handleDrag(dateUnderMouse, this._lastMousePos)
				}
			},
			onmouseup: () => this._endDrag(attrs.onEventMoved),
			onmouseleave: () => this._endDrag(attrs.onEventMoved),
		}, [
			styles.isDesktopLayout()
				? this.renderHeaderDesktop(attrs, thisWeek.days, thisWeek, mainWeek)
				: this.renderHeaderMobile(thisWeek, mainWeek, attrs.groupColors, attrs.onEventClicked),
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
				m(".flex.col", calendarDayTimes.map(time => {
						const width = styles.isDesktopLayout()
							? size.calendar_hour_width
							: size.calendar_hour_width_mobile

						return m(".calendar-hour.flex",
							{
								onclick: (e) => {
									e.stopPropagation()
									attrs.onNewEvent(time.toDate(attrs.selectedDate))
								},
							},
							m(".pt.pl-s.pr-s.center.small", {
								style: {
									'line-height': styles.isDesktopLayout() ? px(size.calendar_hour_height) : "unset",
									width: px(width),
									height: px(size.calendar_hour_height),
									'border-right': `2px solid ${theme.content_border}`,
								},
							}, formatTime(time.toDate()))
						)
					}
				)),
				m(".flex.flex-grow", thisWeek.days.map((weekday, i) => {
						const events = thisWeek.shortEvents[i]
						const newEventHandler = (hours, minutes) => {
							const newDate = new Date(weekday)
							newDate.setHours(hours, minutes)
							attrs.onNewEvent(newDate)
							attrs.onDateSelected(new Date(weekday))
						}
						return m(".flex-grow.calendar-column-border", {
							style: {
								height: px(calendarDayTimes.length * size.calendar_hour_height)
							}
						}, m(CalendarDayEventsView, {
							onEventClicked: attrs.onEventClicked,
							groupColors: attrs.groupColors,
							events: events,
							displayTimeIndicator: weekday.getTime() === this._getTodayTimestamp(),
							onTimePressed: newEventHandler,
							onTimeContextPressed: newEventHandler,
							day: weekday,
							setCurrentDraggedEvent: (event) => this.startEventDrag(event),
							setTimeUnderMouse: (time) => this._dateUnderMouse = combineDateWithTime(weekday, time),
							temporaryEvents: this._eventDragHandler.transientEvents.concat(this._eventDragHandler.temporaryEvent ? [this._eventDragHandler.temporaryEvent] : []),
							fullViewWidth: this._viewDom?.getBoundingClientRect().width
						}))
					})
				)
			]),
		])
	}

	startEventDrag(event: CalendarEvent) {
		const lastMousePos = this._lastMousePos
		const dateUnderMouse = this.getDateUnderMouse()
		if (dateUnderMouse && lastMousePos) {
			this._eventDragHandler.prepareDrag(event, dateUnderMouse, lastMousePos)
		}
	}

	renderHeaderMobile(thisPageEvents: EventsOnDays, mainPageEvents: EventsOnDays, groupColors: GroupColors, onEventClicked: CalendarEventBubbleClickHandler): Children {

		// We calculate the height manually because we want the header to transition between heights when swiping left and right
		// Hardcoding some styles instead of classes so that we can avoid nasty magic numbers
		const mainPageEventsCount = mainPageEvents.longEvents.length
		const padding = mainPageEventsCount !== 0 ? size.vpad_small : 0

		// Set bottom padding in height, because it will be ignored in the style
		const heightAdjustForPadding = 2 * padding
		const height = mainPageEventsCount * CALENDAR_EVENT_HEIGHT + heightAdjustForPadding
		return m(".calendar-long-events-header.flex-fixed.calendar-hour-margin.pr-l", {
				style: {
					height: px(height),
					paddingTop: px(padding),
					transition: 'height 200ms ease-in-out'
				},
				oncreate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom
					}
					m.redraw()
				},
				onupdate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom
					}
				}
			},
			this.renderLongEvents(thisPageEvents.days, thisPageEvents.longEvents, groupColors, onEventClicked).children)
	}


	renderHeaderDesktop(attrs: Attrs, dates: Array<Date>, thisPageEvents: EventsOnDays, mainPageEvents: EventsOnDays): Children {
		const {
			selectedDate,
			renderHeaderText,
			groupColors,
			onEventClicked,
			onChangeViewPeriod,
			startOfTheWeek
		} = attrs

		const firstDate = thisPageEvents.days[0]

		return m(".calendar-long-events-header.mt-s.flex-fixed", [
			m(".pr-l.flex.row.items-center", [
				this.renderPeriodSwitcherButtons(onChangeViewPeriod),
				m("h1", renderHeaderText(selectedDate)),
				this.renderWeekNumberLabel(firstDate, startOfTheWeek)
			]),
			m(".calendar-hour-margin", {
				onmousemove: mouseEvent => {
					const {x, targetWidth} = getPosAndBoundsFromMouseEvent(mouseEvent)
					const dayWidth = targetWidth / attrs.daysInPeriod
					const dayNumber = Math.floor(x / dayWidth)

					const date = new Date(thisPageEvents.days[dayNumber])

					// When dragging short events, dont cause the mouse position date to drop to 00:00 when dragging over the header
					if (this._eventDragHandler.isDragging && !this._isHeaderEventBeingDragged) {
						date.setHours(this._dateUnderMouse.getHours())
						date.setMinutes(this._dateUnderMouse.getMinutes())
					}
					this._dateUnderMouse = date
				}
			}, [
				this.renderDayNamesRow(thisPageEvents.days, attrs.onDateSelected),
				this.renderLongEventsSection(thisPageEvents, mainPageEvents, groupColors, onEventClicked),
				this.renderSelectedDateIndicatorRow(selectedDate, thisPageEvents.days),
			])
		])
	}

	renderLongEventsSection(thisPageEvents: EventsOnDays, mainPageEvents: EventsOnDays, groupColors: GroupColors, onEventClicked: CalendarEventBubbleClickHandler): Children {
		const thisPageLongEvents = this.renderLongEvents(thisPageEvents.days, thisPageEvents.longEvents, groupColors, onEventClicked)
		const mainPageLongEvents = this.renderLongEvents(mainPageEvents.days, mainPageEvents.longEvents, groupColors, onEventClicked)

		return m(".rel", {
				oncreate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom
					}
					m.redraw()
				},
				onupdate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom
					}
				},
				style: {
					height: px(mainPageLongEvents.maxEventsInColumn * CALENDAR_EVENT_HEIGHT),
					width: "100%",
					transition: 'height 200ms ease-in-out'
				}
			},
			thisPageLongEvents.children
		)
	}

	renderPeriodSwitcherButtons(callback: boolean => *): Children {
		return [
			m("button.calendar-switch-button", {
				onclick: () => {
					callback(false)
				},
			}, m(Icon, {icon: Icons.ArrowDropLeft, class: "icon-large switch-month-button"})),
			m("button.calendar-switch-button", {
				onclick: () => {
					callback(true)
				},
			}, m(Icon, {icon: Icons.ArrowDropRight, class: "icon-large switch-month-button"}))
		]
	}

	renderSelectedDateIndicatorRow(selectedDate: Date, dates: Array<Date>): Children {
		return m(".flex.pt-s", dates.map(day => m(".flex-grow.flex.col", {
				style: {
					justifyContent: "flex-end"
				}
			}, m("", {
				style: {
					// Don't render the selected date if there is only one day shown, since it's obvious
					background: isSameDay(selectedDate, day) && dates.length > 1
						? theme.content_accent
						: "none",
					width: "100%",
					// The calendar-long-events-header has a 1px border on the bottom that overlaps this selection indicator
					// therefore we need to make it +1px thicker so that it looks correct (consistent with the indicator in month view)
					height: px(SELECTED_DATE_INDICATOR_THICKNESS + 1)
				}
			})
		)))
	}

	renderWeekNumberLabel(date: Date, startOfTheWeek: WeekStartEnum): Children {

		// According to ISO 8601, weeks always start on Monday. Week numbering systems for
		// weeks that do not start on Monday are not strictly defined, so we only display
		// a week number if the user's client is configured to start weeks on Monday
		if (startOfTheWeek !== WeekStart.MONDAY) {
			return null
		}

		return m(".ml-m.content-message-bg.small", {
			style: {
				padding: "2px 4px"
			}
		}, lang.get("weekNumber_label", {"{week}": String(getWeekNumber(date))}))
	}

	/**
	 *
	 * @returns the rendered calendar bubble children, and the maximum number of events that occur on a day (out of all days)
	 */
	renderLongEvents(
		dayRange: Array<Date>,
		events: Array<CalendarEvent>,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler
	): {children: Children, maxEventsInColumn: number} {
		return dayRange.length === 1
			? {
				children: this.renderLongEventsForSingleDay(dayRange[0], events, groupColors, onEventClicked),
				maxEventsInColumn: events.length
			}
			: this.renderLongEventsForMultipleDays(dayRange, events, groupColors, onEventClicked)
	}

	renderLongEventsForSingleDay(day: Date,
	                             events: Array<CalendarEvent>,
	                             groupColors: GroupColors,
	                             onEventClicked: CalendarEventBubbleClickHandler
	): Children {
		const zone = getTimeZone()

		return [
			m("", events.map(event => {
				return this.renderLongEventBubble(
					event,
					getTimeTextFormatForLongEvent(event, day, day, zone),
					eventStartsBefore(day, zone, event),
					eventEndsAfterDay(day, zone, event),
					groupColors,
					(_, domEvent) => onEventClicked(event, domEvent)
				)
			}))
		]
	}

	renderLongEventsForMultipleDays(dayRange: Array<Date>,
	                                events: Array<CalendarEvent>,
	                                groupColors: GroupColors,
	                                onEventClicked: CalendarEventBubbleClickHandler
	): {children: Children, maxEventsInColumn: number} {
		if (this._longEventsDom == null) {
			return {children: null, maxEventsInColumn: 0}
		}
		const dayWidth = this._longEventsDom.offsetWidth / dayRange.length
		let maxEventsInColumn = 0
		const firstDay = dayRange[0]
		const lastDay = lastThrow(dayRange)

		const zone = getTimeZone()
		const children = layOutEvents(events, zone, (columns) => {
			maxEventsInColumn = Math.max(maxEventsInColumn, columns.length)
			return columns.map((rows, c) =>
				rows.map((event) => {
					const zone = getTimeZone()
					const eventEnd = isAllDayEvent(event) ? incrementDate(getEventEnd(event, zone), -1) : event.endTime
					const dayOfStartDate = getDiffInDays(firstDay, getEventStart(event, zone))
					const dayOfEndDate = getDiffInDays(firstDay, eventEnd)
					const startsBefore = eventStartsBefore(firstDay, zone, event)
					const endsAfter = eventEndsAfterDay(lastDay, zone, event)
					const left = startsBefore ? 0 : dayOfStartDate * dayWidth
					const right = endsAfter ? 0 : (dayRange.length - 1 - dayOfEndDate) * dayWidth
					return m(".abs", {
							style: {
								top: px(c * CALENDAR_EVENT_HEIGHT),
								left: px(left),
								right: px(right),
							},
							key: event._id[0] + event._id[1] + event.startTime.getTime(),
							onmousedown: () => {
								this._isHeaderEventBeingDragged = true
								this.startEventDrag(event)
							}
						},
						this.renderLongEventBubble(
							event,
							EventTextTimeOption.START_END_TIME,
							startsBefore,
							endsAfter,
							groupColors,
							onEventClicked
						)
					)
				})
			)
		}, true)

		return {
			children,
			maxEventsInColumn: maxEventsInColumn
		}
	}


	renderLongEventBubble(event: CalendarEvent, showTime: ?EventTextTimeOptionEnum, startsBefore: boolean, endsAfter: boolean, groupColors: GroupColors, onEventClicked: CalendarEventBubbleClickHandler): Children {


		const isTemporary = this._eventDragHandler.isTemporaryEvent(event)
		const fadeIn = !isTemporary
		const opacity = isTemporary
			? EVENT_BEING_DRAGGED_OPACITY
			: 1
		const enablePointerEvents = !this._eventDragHandler.isTemporaryEvent(event)

		return m(ContinuingCalendarEventBubble, {
			event,
			startsBefore,
			endsAfter,
			color: getEventColor(event, groupColors),
			onEventClicked,
			showTime,
			user: logins.getUserController().user,
			fadeIn,
			opacity,
			enablePointerEvents
		})
	}

	renderDayNamesRow(days: Array<Date>, onDateSelected: (Date, CalendarViewTypeEnum) => mixed): Children {
		if (days.length <= 1) {
			return null
		}

		return m(".flex", days.map(day => {

			const dayNumberClass = ".calendar-day-indicator.calendar-day-number.clickable"
				+ (this._getTodayTimestamp() === day.getTime() ? ".date-current" : "")

			// the click handler is set on each child individually so as to not make the entire flex container clickable, only the text
			const onclick = () => onDateSelected(day, CalendarViewType.DAY)

			return m(".flex.center-horizontally.flex-grow.center.b", [
				m(".calendar-day-indicator.clickable", {
					onclick,
					style: {
						"padding-right": "4px",
					},
				}, lang.formats.weekdayShort.format(day) + " "),
				m(dayNumberClass, {
					onclick,
					style: {
						margin: "0",
					},
				}, day.getDate())
			])
		}))
	}

	_endDrag(onEventMovedCallback: EventUpdateHandler) {
		this._isHeaderEventBeingDragged = false
		const dateUnderMouse = this.getDateUnderMouse()
		if (dateUnderMouse) {
			this._eventDragHandler.endDrag(dateUnderMouse, onEventMovedCallback).catch(ofClass(UserError, showUserError))
		}
	}

	getDateUnderMouse(): ?Date {

		if (this._dateUnderMouse == null) {
			return null
		}

		const date = new Date(this._dateUnderMouse)

		// We don't want to change the time of header events when dragging over the day grid
		// It should always be 00:00
		if (this._isHeaderEventBeingDragged) {
			date.setHours(0)
			date.setMinutes(0)
		}

		return date
	}
}
