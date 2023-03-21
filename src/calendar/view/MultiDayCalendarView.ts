import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { getStartOfDay, incrementDate, isSameDay, lastThrow, neverNull, ofClass } from "@tutao/tutanota-utils"
import { formatTime } from "../../misc/Formatter"
import {
	CALENDAR_EVENT_HEIGHT,
	combineDateWithTime,
	DEFAULT_HOUR_OF_DAY,
	eventEndsAfterDay,
	EventLayoutMode,
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
	layOutEvents,
	TEMPORARY_EVENT_OPACITY,
} from "../date/CalendarUtils"
import { CalendarDayEventsView, calendarDayTimes } from "./CalendarDayEventsView"
import { theme } from "../../gui/theme"
import { px, size } from "../../gui/size"
import { EventTextTimeOption, WeekStart } from "../../api/common/TutanotaConstants"
import { lang } from "../../misc/LanguageViewModel"
import { PageView } from "../../gui/base/PageView"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import type { GroupColors } from "./CalendarView"
import type { EventDragHandlerCallbacks, MousePos } from "./EventDragHandler"
import { EventDragHandler } from "./EventDragHandler"
import { getPosAndBoundsFromMouseEvent } from "../../gui/base/GuiUtils"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { styles } from "../../gui/styles"
import { renderCalendarSwitchLeftButton, renderCalendarSwitchRightButton, SELECTED_DATE_INDICATOR_THICKNESS } from "./CalendarGuiUtils"
import type { CalendarEventBubbleClickHandler, EventsOnDays } from "./CalendarViewModel"
import { CalendarViewType } from "./CalendarViewModel"
import { ContinuingCalendarEventBubble } from "./ContinuingCalendarEventBubble"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"
import { locator } from "../../api/main/MainLocator.js"

export type Attrs = {
	selectedDate: Date
	daysInPeriod: number
	renderHeaderText: (arg0: Date) => string
	onDateSelected: (date: Date, calendarViewTypeToShow?: CalendarViewType) => unknown
	getEventsOnDays: (range: Array<Date>) => EventsOnDays
	onNewEvent: (date: Date | null) => unknown
	onEventClicked: CalendarEventBubbleClickHandler
	groupColors: GroupColors
	hiddenCalendars: ReadonlySet<Id>
	startOfTheWeek: WeekStart
	onChangeViewPeriod: (next: boolean) => unknown
	temporaryEvents: Array<CalendarEvent>
	dragHandlerCallbacks: EventDragHandlerCallbacks
}

export class MultiDayCalendarView implements Component<Attrs> {
	private _redrawIntervalId: NodeJS.Timer | null = null
	private _longEventsDom: HTMLElement | null = null
	private _domElements: HTMLElement[] = []
	private _scrollPosition: number
	private _eventDragHandler: EventDragHandler
	private _dateUnderMouse: Date | null = null
	private _viewDom: HTMLElement | null = null
	private _lastMousePos: MousePos | null = null
	private _isHeaderEventBeingDragged: boolean = false

	constructor({ attrs }: Vnode<Attrs>) {
		this._scrollPosition = size.calendar_hour_height * DEFAULT_HOUR_OF_DAY
		this._eventDragHandler = new EventDragHandler(neverNull(document.body as HTMLBodyElement), attrs.dragHandlerCallbacks)
	}

	oncreate(vnode: VnodeDOM<Attrs>) {
		this._viewDom = vnode.dom as HTMLElement
	}

	onupdate(vnode: VnodeDOM<Attrs>) {
		this._viewDom = vnode.dom as HTMLElement
	}

	view({ attrs }: Vnode<Attrs>): Children {
		// Special case for week view
		const startOfThisPeriod =
			attrs.daysInPeriod === 7 ? getStartOfWeek(attrs.selectedDate, getStartOfTheWeekOffset(attrs.startOfTheWeek)) : attrs.selectedDate
		const startOfPreviousPeriod = incrementDate(new Date(startOfThisPeriod), -attrs.daysInPeriod)
		const startOfNextPeriod = incrementDate(new Date(startOfThisPeriod), attrs.daysInPeriod)
		const previousRange = getRangeOfDays(startOfPreviousPeriod, attrs.daysInPeriod)
		const currentRange = getRangeOfDays(startOfThisPeriod, attrs.daysInPeriod)
		const nextRange = getRangeOfDays(startOfNextPeriod, attrs.daysInPeriod)
		const previousPageEvents = attrs.getEventsOnDays(previousRange)
		const currentPageEvents = attrs.getEventsOnDays(currentRange)
		const nextPageEvents = attrs.getEventsOnDays(nextRange)
		return m(PageView, {
			previousPage: {
				key: previousRange[0].getTime(),
				nodes: this._renderWeek(attrs, previousPageEvents, currentPageEvents),
			},
			currentPage: {
				key: currentRange[0].getTime(),
				nodes: this._renderWeek(attrs, currentPageEvents, currentPageEvents),
			},
			nextPage: {
				key: nextRange[0].getTime(),
				nodes: this._renderWeek(attrs, nextPageEvents, currentPageEvents),
			},
			onChangePage: (next) => attrs.onChangeViewPeriod(next),
		})
	}

	_getTodayTimestamp(): number {
		return getStartOfDay(new Date()).getTime()
	}

	_renderWeek(attrs: Attrs, thisWeek: EventsOnDays, mainWeek: EventsOnDays): Children {
		return m(
			".fill-absolute.flex.col.calendar-column-border.mlr-safe-inset",
			{
				oncreate: (vnode) => {
					this._redrawIntervalId = setInterval(m.redraw, 1000 * 60)
				},
				onremove: () => {
					if (this._redrawIntervalId != null) {
						clearInterval(this._redrawIntervalId)
						this._redrawIntervalId = null
					}
				},
				onmousemove: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					this._lastMousePos = getPosAndBoundsFromMouseEvent(mouseEvent)

					if (this._dateUnderMouse) {
						return this._eventDragHandler.handleDrag(this._dateUnderMouse, this._lastMousePos)
					}
				},
				onmouseup: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false

					this._endDrag()
				},
				onmouseleave: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false

					this._endDrag()
				},
			},
			[
				styles.isDesktopLayout()
					? this.renderHeaderDesktop(attrs, thisWeek.days, thisWeek, mainWeek)
					: this.renderHeaderMobile(thisWeek, mainWeek, attrs.groupColors, attrs.onEventClicked, attrs.temporaryEvents),
				m("", {
					style: {
						"border-bottom": `1px solid ${theme.content_border}`,
					},
				}),
				// using .scroll-no-overlay because of a browser bug in Chromium where scroll wouldn't work at all
				// see https://github.com/tutao/tutanota/issues/4846
				m(
					".flex.scroll-no-overlay",
					{
						oncreate: (vnode) => {
							vnode.dom.scrollTop = this._scrollPosition

							this._domElements.push(vnode.dom as HTMLElement)
						},
						onscroll: (event: Event) => {
							if (thisWeek === mainWeek) {
								this._domElements.forEach((dom) => {
									if (dom !== event.target) {
										dom.scrollTop = (event.target as HTMLElement).scrollTop
									}
								})

								this._scrollPosition = (event.target as HTMLElement).scrollTop
							}
						},
					},
					[
						m(
							".flex.col",
							calendarDayTimes.map((time) => {
								const width = styles.isDesktopLayout() ? size.calendar_hour_width : size.calendar_hour_width_mobile
								return m(
									".calendar-hour.flex.cursor-pointer",
									{
										onclick: (e: MouseEvent) => {
											e.stopPropagation()
											attrs.onNewEvent(time.toDate(attrs.selectedDate))
										},
									},
									m(
										".pl-s.pr-s.center.small",
										{
											style: {
												"line-height": styles.isDesktopLayout() ? px(size.calendar_hour_height) : "unset",
												width: px(width),
												height: px(size.calendar_hour_height),
												"border-right": `2px solid ${theme.content_border}`,
											},
										},
										formatTime(time.toDate()),
									),
								)
							}),
						),
						m(
							".flex.flex-grow",
							thisWeek.days.map((weekday, i) => {
								const events = thisWeek.shortEvents[i]

								const newEventHandler = (hours: number, minutes: number) => {
									const newDate = new Date(weekday)
									newDate.setHours(hours, minutes)
									attrs.onNewEvent(newDate)
									attrs.onDateSelected(new Date(weekday))
								}

								return m(
									".flex-grow.calendar-column-border",
									{
										style: {
											height: px(calendarDayTimes.length * size.calendar_hour_height),
										},
									},
									m(CalendarDayEventsView, {
										onEventClicked: attrs.onEventClicked,
										groupColors: attrs.groupColors,
										events: events,
										displayTimeIndicator: weekday.getTime() === this._getTodayTimestamp(),
										onTimePressed: newEventHandler,
										onTimeContextPressed: newEventHandler,
										day: weekday,
										setCurrentDraggedEvent: (event) => this.startEventDrag(event),
										setTimeUnderMouse: (time) => (this._dateUnderMouse = combineDateWithTime(weekday, time)),
										isTemporaryEvent: (event) => attrs.temporaryEvents.includes(event),
										isDragging: this._eventDragHandler.isDragging,
										fullViewWidth: this._viewDom?.getBoundingClientRect().width,
									}),
								)
							}),
						),
					],
				),
			],
		)
	}

	startEventDrag(event: CalendarEvent) {
		const lastMousePos = this._lastMousePos

		if (this._dateUnderMouse && lastMousePos) {
			this._eventDragHandler.prepareDrag(event, this._dateUnderMouse, lastMousePos, this._isHeaderEventBeingDragged)
		}
	}

	renderHeaderMobile(
		thisPageEvents: EventsOnDays,
		mainPageEvents: EventsOnDays,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		temporaryEvents: Array<CalendarEvent>,
	): Children {
		// We calculate the height manually because we want the header to transition between heights when swiping left and right
		// Hardcoding some styles instead of classes so that we can avoid nasty magic numbers
		const mainPageEventsCount = mainPageEvents.longEvents.length
		const padding = mainPageEventsCount !== 0 ? size.vpad_small : 0
		// Set bottom padding in height, because it will be ignored in the style
		const heightAdjustForPadding = 2 * padding
		const height = mainPageEventsCount * CALENDAR_EVENT_HEIGHT + heightAdjustForPadding
		return m(
			".calendar-long-events-header.flex-fixed.calendar-hour-margin.pr-l",
			{
				style: {
					height: px(height),
					paddingTop: px(padding),
					transition: "height 200ms ease-in-out",
				},
				oncreate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom as HTMLElement
					}

					m.redraw()
				},
				onupdate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom as HTMLElement
					}
				},
			},
			this.renderLongEvents(thisPageEvents.days, thisPageEvents.longEvents, groupColors, onEventClicked, temporaryEvents).children,
		)
	}

	renderHeaderDesktop(attrs: Attrs, dates: Array<Date>, thisPageEvents: EventsOnDays, mainPageEvents: EventsOnDays): Children {
		const { selectedDate, renderHeaderText, groupColors, onEventClicked, onChangeViewPeriod, startOfTheWeek } = attrs
		const firstDate = thisPageEvents.days[0]
		return m(".calendar-long-events-header.mt-s.flex-fixed", [
			// Only display navigation buttons if it is the visible page
			thisPageEvents === mainPageEvents
				? m(".pr-l.flex.row.items-center", [
						renderCalendarSwitchLeftButton("prevWeek_label", () => onChangeViewPeriod(false)),
						renderCalendarSwitchRightButton("nextWeek_label", () => onChangeViewPeriod(true)),
						m("h1", renderHeaderText(selectedDate)),
						this.renderWeekNumberLabel(firstDate, startOfTheWeek),
				  ])
				: m(".pr-l.flex.row.items-center", [m("h1", renderHeaderText(selectedDate)), this.renderWeekNumberLabel(firstDate, startOfTheWeek)]),
			m(
				".calendar-hour-margin",
				{
					onmousemove: (mouseEvent: MouseEvent) => {
						const { x, targetWidth } = getPosAndBoundsFromMouseEvent(mouseEvent)
						const dayWidth = targetWidth / attrs.daysInPeriod
						const dayNumber = Math.floor(x / dayWidth)
						const date = new Date(thisPageEvents.days[dayNumber])
						const dateUnderMouse = this._dateUnderMouse

						// When dragging short events, dont cause the mouse position date to drop to 00:00 when dragging over the header
						if (dateUnderMouse && this._eventDragHandler.isDragging && !this._isHeaderEventBeingDragged) {
							date.setHours(dateUnderMouse.getHours())
							date.setMinutes(dateUnderMouse.getMinutes())
						}

						this._dateUnderMouse = date
					},
				},
				[
					this.renderDayNamesRow(thisPageEvents.days, attrs.onDateSelected),
					this.renderLongEventsSection(thisPageEvents, mainPageEvents, groupColors, onEventClicked, attrs.temporaryEvents),
					this.renderSelectedDateIndicatorRow(selectedDate, thisPageEvents.days),
				],
			),
		])
	}

	renderLongEventsSection(
		thisPageEvents: EventsOnDays,
		mainPageEvents: EventsOnDays,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		temporayEvents: Array<CalendarEvent>,
	): Children {
		const thisPageLongEvents = this.renderLongEvents(thisPageEvents.days, thisPageEvents.longEvents, groupColors, onEventClicked, temporayEvents)
		const mainPageLongEvents = this.renderLongEvents(mainPageEvents.days, mainPageEvents.longEvents, groupColors, onEventClicked, temporayEvents)
		return m(
			".rel",
			{
				oncreate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom as HTMLElement
					}

					m.redraw()
				},
				onupdate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this._longEventsDom = vnode.dom as HTMLElement
					}
				},
				style: {
					height: px(mainPageLongEvents.maxEventsInColumn * CALENDAR_EVENT_HEIGHT),
					width: "100%",
					transition: "height 200ms ease-in-out",
				},
			},
			thisPageLongEvents.children,
		)
	}

	renderSelectedDateIndicatorRow(selectedDate: Date, dates: Array<Date>): Children {
		return m(
			".flex.pt-s",
			dates.map((day) =>
				m(
					".flex-grow.flex.col",
					{
						style: {
							justifyContent: "flex-end",
						},
					},
					m("", {
						style: {
							// Don't render the selected date if there is only one day shown, since it's obvious
							background: isSameDay(selectedDate, day) && dates.length > 1 ? theme.content_accent : "none",
							// Browsers which don't support overflow:overlay (looking at you, FF) will shrink the contents of the event grid and it
							// will shift relative to the header (with indicator). It's noticeable when it's close to borders but it's not as bad
							// when it's smaller than the grid.
							width: "50%",
							// The calendar-long-events-header has a 1px border on the bottom that overlaps this selection indicator
							// therefore we need to make it +1px thicker so that it looks correct (consistent with the indicator in month view)
							height: px(SELECTED_DATE_INDICATOR_THICKNESS + 1),
							alignSelf: "center",
						},
					}),
				),
			),
		)
	}

	renderWeekNumberLabel(date: Date, startOfTheWeek: WeekStart): Children {
		// According to ISO 8601, weeks always start on Monday. Week numbering systems for
		// weeks that do not start on Monday are not strictly defined, so we only display
		// a week number if the user's client is configured to start weeks on Monday
		if (startOfTheWeek !== WeekStart.MONDAY) {
			return null
		}

		return m(
			".ml-m.content-message-bg.small",
			{
				style: {
					padding: "2px 4px",
				},
			},
			lang.get("weekNumber_label", {
				"{week}": String(getWeekNumber(date)),
			}),
		)
	}

	/**
	 *
	 * @returns the rendered calendar bubble children, and the maximum number of events that occur on a day (out of all days)
	 */
	renderLongEvents(
		dayRange: Array<Date>,
		events: Array<CalendarEvent>,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		temporaryEvents: Array<CalendarEvent>,
	): {
		children: Children
		maxEventsInColumn: number
	} {
		return dayRange.length === 1
			? {
					children: this.renderLongEventsForSingleDay(dayRange[0], events, groupColors, onEventClicked, temporaryEvents),
					maxEventsInColumn: events.length,
			  }
			: this.renderLongEventsForMultipleDays(dayRange, events, groupColors, onEventClicked, temporaryEvents)
	}

	/**
	 *Only called from day view where header events are not draggable
	 */
	renderLongEventsForSingleDay(
		day: Date,
		events: Array<CalendarEvent>,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		temporaryEvents: Array<CalendarEvent>,
	): Children {
		const zone = getTimeZone()
		return [
			m(
				"",
				events.map((event) => {
					return this.renderLongEventBubble(
						event,
						getTimeTextFormatForLongEvent(event, day, day, zone),
						eventStartsBefore(day, zone, event),
						eventEndsAfterDay(day, zone, event),
						groupColors,
						(_, domEvent) => onEventClicked(event, domEvent),
						temporaryEvents.includes(event),
					)
				}),
			),
		]
	}

	renderLongEventsForMultipleDays(
		dayRange: Array<Date>,
		events: Array<CalendarEvent>,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		temporaryEvents: Array<CalendarEvent>,
	): {
		children: Children
		maxEventsInColumn: number
	} {
		if (this._longEventsDom == null) {
			return {
				children: null,
				maxEventsInColumn: 0,
			}
		}

		const dayWidth = this._longEventsDom.offsetWidth / dayRange.length
		let maxEventsInColumn = 0
		const firstDay = dayRange[0]
		const lastDay = lastThrow(dayRange)
		const zone = getTimeZone()
		const children = layOutEvents(
			events,
			zone,
			(columns) => {
				maxEventsInColumn = Math.max(maxEventsInColumn, columns.length)
				return columns.map((rows, c) =>
					rows.map((event) => {
						const isAllDay = isAllDayEvent(event)
						const eventEnd = isAllDay ? incrementDate(getEventEnd(event, zone), -1) : event.endTime
						const dayOfStartDate = getDiffInDays(firstDay, getEventStart(event, zone))
						const dayOfEndDate = getDiffInDays(firstDay, eventEnd)
						const startsBefore = eventStartsBefore(firstDay, zone, event)
						const endsAfter = eventEndsAfterDay(lastDay, zone, event)
						const left = startsBefore ? 0 : dayOfStartDate * dayWidth
						const right = endsAfter ? 0 : (dayRange.length - 1 - dayOfEndDate) * dayWidth
						return m(
							".abs",
							{
								style: {
									top: px(c * CALENDAR_EVENT_HEIGHT),
									left: px(left),
									right: px(right),
								},
								key: event._id[0] + event._id[1] + event.startTime.getTime(),
								onmousedown: () => {
									this._isHeaderEventBeingDragged = true
									this.startEventDrag(event)
								},
							},
							this.renderLongEventBubble(
								event,
								isAllDay ? null : EventTextTimeOption.START_END_TIME,
								startsBefore,
								endsAfter,
								groupColors,
								onEventClicked,
								temporaryEvents.includes(event),
							),
						)
					}),
				)
			},
			EventLayoutMode.DayBasedColumn,
		)
		return {
			children,
			maxEventsInColumn: maxEventsInColumn,
		}
	}

	renderLongEventBubble(
		event: CalendarEvent,
		showTime: EventTextTimeOption | null,
		startsBefore: boolean,
		endsAfter: boolean,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		isTemporary: boolean,
	): Children {
		const fadeIn = !isTemporary
		const opacity = isTemporary ? TEMPORARY_EVENT_OPACITY : 1
		const enablePointerEvents = !this._eventDragHandler.isDragging && !isTemporary
		return m(ContinuingCalendarEventBubble, {
			event,
			startsBefore,
			endsAfter,
			color: getEventColor(event, groupColors),
			onEventClicked,
			showTime,
			user: locator.logins.getUserController().user,
			fadeIn,
			opacity,
			enablePointerEvents,
		})
	}

	renderDayNamesRow(days: Array<Date>, onDateSelected: (arg0: Date, arg1: CalendarViewType) => unknown): Children {
		if (days.length <= 1) {
			return null
		}

		return m(
			".flex",
			days.map((day) => {
				const dayNumberClass =
					".calendar-day-indicator.calendar-day-number.clickable.circle" + (this._getTodayTimestamp() === day.getTime() ? ".accent-bg" : "")

				// the click handler is set on each child individually so as to not make the entire flex container clickable, only the text
				const onclick = () => onDateSelected(day, CalendarViewType.DAY)

				return m(".flex.center-horizontally.flex-grow.center.b", [
					m(
						".calendar-day-indicator.clickable",
						{
							onclick,
							style: {
								"padding-right": "4px",
							},
						},
						lang.formats.weekdayShort.format(day) + " ",
					),
					m(
						dayNumberClass,
						{
							onclick,
							style: {
								margin: "0",
							},
						},
						day.getDate(),
					),
				])
			}),
		)
	}

	_endDrag() {
		this._isHeaderEventBeingDragged = false

		if (this._dateUnderMouse) {
			this._eventDragHandler.endDrag(this._dateUnderMouse).catch(ofClass(UserError, showUserError))
		}
	}
}
