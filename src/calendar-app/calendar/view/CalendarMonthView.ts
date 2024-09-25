import m, { Children, ClassComponent, Component, Vnode, VnodeDOM } from "mithril"
import { px, size } from "../../../common/gui/size"
import { EventTextTimeOption, WeekStart } from "../../../common/api/common/TutanotaConstants"
import { CalendarDay, CalendarMonth } from "../../../common/calendar/date/CalendarUtils"
import {
	getAllDayDateForTimezone,
	getDiffIn24hIntervals,
	getEventEnd,
	getFirstDayOfMonth,
	getStartOfNextDayWithZone,
	getStartOfTheWeekOffset,
	getTimeZone,
	getWeekNumber,
} from "../../../common/calendar/date/CalendarUtils"
import { incrementDate, incrementMonth, isToday, lastThrow, neverNull, ofClass } from "@tutao/tutanota-utils"
import { ContinuingCalendarEventBubble } from "./ContinuingCalendarEventBubble"
import { styles } from "../../../common/gui/styles"
import { CalendarViewType, isAllDayEvent, isAllDayEventByTimes, setNextHalfHour } from "../../../common/api/common/utils/CommonCalendarUtils"
import { windowFacade } from "../../../common/misc/WindowFacade"
import type { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import type { GroupColors } from "./CalendarView"
import type { EventDragHandlerCallbacks, MousePos } from "./EventDragHandler"
import { EventDragHandler } from "./EventDragHandler"
import { getPosAndBoundsFromMouseEvent } from "../../../common/gui/base/GuiUtils"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import {
	CALENDAR_EVENT_HEIGHT,
	changePeriodOnWheel,
	EventLayoutMode,
	getCalendarMonth,
	getDateFromMousePos,
	getEventColor,
	layOutEvents,
	SELECTED_DATE_INDICATOR_THICKNESS,
	TEMPORARY_EVENT_OPACITY,
} from "../gui/CalendarGuiUtils.js"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyDownHandler, EventsOnDays } from "./CalendarViewModel"
import { Time } from "../../../common/calendar/date/Time.js"
import { client } from "../../../common/misc/ClientDetector"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { PageView } from "../../../common/gui/base/PageView.js"
import { DaysToEvents } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { isIOSApp } from "../../../common/api/common/Env"
import { getSafeAreaInsetBottom } from "../../../common/gui/HtmlUtils"

type CalendarMonthAttrs = {
	selectedDate: Date
	onDateSelected: (date: Date, calendarViewTypeToShow: CalendarViewType) => unknown
	eventsForDays: DaysToEvents
	getEventsOnDaysToRender: (range: Array<Date>) => EventsOnDays
	onNewEvent: (date: Date | null) => unknown
	onEventClicked: CalendarEventBubbleClickHandler
	onEventKeyDown: CalendarEventBubbleKeyDownHandler
	onChangeMonth: (next: boolean) => unknown
	amPmFormat: boolean
	startOfTheWeek: WeekStart
	groupColors: GroupColors
	hiddenCalendars: ReadonlySet<Id>
	temporaryEvents: Array<CalendarEvent>
	dragHandlerCallbacks: EventDragHandlerCallbacks
}
type SimplePosRect = {
	top: number
	left: number
	right: number
}

/** height of the day number indicator at the top of the day square */
const dayHeight = () => (styles.isDesktopLayout() ? 32 : 24)

const spaceBetweenEvents = () => (styles.isDesktopLayout() ? 2 : 1)

const EVENT_BUBBLE_VERTICAL_OFFSET = 5

export class CalendarMonthView implements Component<CalendarMonthAttrs>, ClassComponent<CalendarMonthAttrs> {
	private monthDom: HTMLElement | null = null
	private readonly resizeListener: () => unknown
	private readonly zone: string
	private lastWidth: number
	private lastHeight: number
	private eventDragHandler: EventDragHandler
	private dayUnderMouse: Date | null = null
	private lastMousePos: MousePos | null = null

	constructor({ attrs }: Vnode<CalendarMonthAttrs>) {
		this.resizeListener = m.redraw
		this.zone = getTimeZone()
		this.lastWidth = 0
		this.lastHeight = 0
		this.eventDragHandler = new EventDragHandler(neverNull(document.body as HTMLBodyElement), attrs.dragHandlerCallbacks)
	}

	oncreate() {
		windowFacade.addResizeListener(this.resizeListener)
	}

	onremove() {
		windowFacade.removeResizeListener(this.resizeListener)
	}

	view({ attrs }: Vnode<CalendarMonthAttrs>): Children {
		const startOfTheWeekOffset = getStartOfTheWeekOffset(attrs.startOfTheWeek)
		const thisMonth = getCalendarMonth(attrs.selectedDate, startOfTheWeekOffset, styles.isSingleColumnLayout())
		const lastMonthDate = incrementMonth(attrs.selectedDate, -1)
		const nextMonthDate = incrementMonth(attrs.selectedDate, 1)
		const previousMonth = getCalendarMonth(lastMonthDate, startOfTheWeekOffset, styles.isSingleColumnLayout())
		const nextMonth = getCalendarMonth(nextMonthDate, startOfTheWeekOffset, styles.isSingleColumnLayout())

		const isDesktopLayout = styles.isDesktopLayout()

		let containerStyle
		let weekdayDaysClasses = ""
		if (isDesktopLayout) {
			containerStyle = {
				overflow: "hidden",
				marginBottom: px(size.hpad_large),
			}
			weekdayDaysClasses = "content-bg border-radius-top-left-big border-radius-top-right-big"
		} else {
			containerStyle = {
				paddingBottom: isIOSApp() && client.isCalendarApp() ? px(getSafeAreaInsetBottom()) : null,
			}
			weekdayDaysClasses = "nav-bg"
		}

		return m(
			".fill-absolute.flex.col",
			{
				class: isDesktopLayout ? " mlr-l border-radius-big" : "mlr-safe-inset",
				style: isDesktopLayout ? { marginLeft: px(5) } : null,
				onwheel: changePeriodOnWheel(attrs.onChangeMonth),
			},
			[
				m(
					".flex.pt-s.pb-m",
					{
						class: weekdayDaysClasses,
					},
					thisMonth.weekdays.map((wd) => m(".flex-grow", m(".calendar-day-indicator.b", wd))),
				),
				m(
					".flex.col.rel.flex-grow.overflow-hidden",
					{
						class:
							(!styles.isUsingBottomNavigation() || (isIOSApp() && client.isCalendarApp()) ? "content-bg" : "") +
							(!isDesktopLayout ? " border-radius-top-left-big border-radius-top-right-big" : ""),
						style: containerStyle,
					},
					m(PageView, {
						previousPage: {
							key: getFirstDayOfMonth(lastMonthDate).getTime(),
							nodes: this.monthDom ? this.renderCalendar(attrs, previousMonth, thisMonth, this.zone) : null,
						},
						currentPage: {
							key: getFirstDayOfMonth(attrs.selectedDate).getTime(),
							nodes: this.renderCalendar(attrs, thisMonth, thisMonth, this.zone),
						},
						nextPage: {
							key: getFirstDayOfMonth(nextMonthDate).getTime(),
							nodes: this.monthDom ? this.renderCalendar(attrs, nextMonth, thisMonth, this.zone) : null,
						},
						onChangePage: (next) => attrs.onChangeMonth(next),
					}),
				),
			],
		)
	}

	onbeforeupdate(newVnode: Vnode<CalendarMonthAttrs>, oldVnode: VnodeDOM<CalendarMonthAttrs>): boolean {
		const dom = this.monthDom
		const different =
			!dom ||
			oldVnode.attrs.eventsForDays !== newVnode.attrs.eventsForDays ||
			oldVnode.attrs.selectedDate !== newVnode.attrs.selectedDate ||
			oldVnode.attrs.amPmFormat !== newVnode.attrs.amPmFormat ||
			oldVnode.attrs.groupColors !== newVnode.attrs.groupColors ||
			oldVnode.attrs.hiddenCalendars !== newVnode.attrs.hiddenCalendars ||
			dom.offsetWidth !== this.lastWidth ||
			dom.offsetHeight !== this.lastHeight

		if (dom) {
			this.lastWidth = dom.offsetWidth
			this.lastHeight = dom.offsetHeight
		}

		return different || this.eventDragHandler.queryHasChanged()
	}

	private renderCalendar(attrs: CalendarMonthAttrs, month: CalendarMonth, currentlyVisibleMonth: CalendarMonth, zone: string): Children {
		const { weeks } = month
		const isVisible = month === currentlyVisibleMonth
		return m(
			".fill-absolute.flex.col.flex-grow",
			{
				oncreate: (vnode) => {
					if (isVisible) {
						this.monthDom = vnode.dom as HTMLElement
						m.redraw()
					}
				},
				onupdate: (vnode) => {
					if (isVisible) {
						this.monthDom = vnode.dom as HTMLElement
					}
				},
				onmousemove: (mouseEvent: MouseEvent & { redraw?: boolean }) => {
					mouseEvent.redraw = false
					const posAndBoundsFromMouseEvent = getPosAndBoundsFromMouseEvent(mouseEvent)
					this.lastMousePos = posAndBoundsFromMouseEvent
					this.dayUnderMouse = getDateFromMousePos(
						posAndBoundsFromMouseEvent,
						weeks.map((week) => week.map((day) => day.date)),
					)

					this.eventDragHandler.handleDrag(this.dayUnderMouse, posAndBoundsFromMouseEvent)
				},
				onmouseup: (mouseEvent: MouseEvent & { redraw?: boolean }) => {
					mouseEvent.redraw = false

					this.endDrag(mouseEvent)
				},
				onmouseleave: (mouseEvent: MouseEvent & { redraw?: boolean }) => {
					mouseEvent.redraw = false

					if (this.eventDragHandler.isDragging) {
						this.eventDragHandler.cancelDrag()
					}
				},
			},
			weeks.map((week, weekIndex) => {
				return m(
					".flex.flex-grow.rel",
					{
						key: week[0].date.getTime(),
					},
					[
						week.map((day, i) => this.renderDay(attrs, day, i, weekIndex === 0)),
						this.monthDom ? this.renderWeekEvents(attrs, week, zone, !isVisible) : null,
					],
				)
			}),
		)
	}

	private endDrag(pos: MousePos) {
		const dayUnderMouse = this.dayUnderMouse
		const originalDate = this.eventDragHandler.originalEvent?.startTime

		if (dayUnderMouse && originalDate) {
			//make sure the date we move to also gets a time
			const dateUnderMouse = Time.fromDate(originalDate).toDate(dayUnderMouse)

			this.eventDragHandler.endDrag(dateUnderMouse, pos).catch(ofClass(UserError, showUserError))
		}
	}

	/** render the grid of days */
	private renderDay(attrs: CalendarMonthAttrs, day: CalendarDay, weekDayNumber: number, firstWeek: boolean): Children {
		return m(
			".calendar-day.calendar-column-border.flex-grow.rel.overflow-hidden.fill-absolute.cursor-pointer",
			{
				style: {
					...(firstWeek && !styles.isDesktopLayout() ? { borderTop: "none" } : {}),
				},
				key: day.date.getTime(),
				onclick: (e: MouseEvent) => {
					if (client.isDesktopDevice()) {
						const newDate = setNextHalfHour(new Date(day.date))

						attrs.onDateSelected(new Date(day.date), CalendarViewType.MONTH)
						attrs.onNewEvent(newDate)
					} else {
						attrs.onDateSelected(new Date(day.date), styles.isDesktopLayout() ? CalendarViewType.DAY : CalendarViewType.AGENDA)
					}

					e.preventDefault()
				},
			},
			[
				m(".mb-xs", {
					style: {
						height: px(SELECTED_DATE_INDICATOR_THICKNESS),
					},
				}),
				this.renderDayHeader(day, attrs.onDateSelected), // According to ISO 8601, weeks always start on Monday. Week numbering systems for
				// weeks that do not start on Monday are not strictly defined, so we only display
				// a week number if the user's client is configured to start weeks on Monday
				weekDayNumber === 0 && attrs.startOfTheWeek === WeekStart.MONDAY
					? m(
							".calendar-month-week-number.abs.z3",
							{
								onclick: (e: MouseEvent) => {
									e.stopPropagation()
									attrs.onDateSelected(new Date(day.date), CalendarViewType.WEEK)
								},
							},
							getWeekNumber(day.date),
					  )
					: null,
			],
		)
	}

	private renderDayHeader(
		{ date, day, isPaddingDay }: CalendarDay,
		onDateSelected: (date: Date, calendarViewTypeToShow: CalendarViewType) => unknown,
	): Children {
		const size = styles.isDesktopLayout() ? px(22) : px(20)
		return m(
			".rel.click.flex.items-center.justify-center.rel.ml-hpad_small",
			{
				"aria-label": date.toLocaleDateString(),
				onclick: (e: MouseEvent) => {
					onDateSelected(new Date(date), client.isDesktopDevice() || styles.isDesktopLayout() ? CalendarViewType.DAY : CalendarViewType.AGENDA)
					e.stopPropagation()
				},
			},
			[
				m(".abs.z1.circle", {
					class: isToday(date) ? "calendar-current-day-circle" : "",
					style: {
						width: size,
						height: size,
					},
				}),
				m(
					".full-width.height-100p.center.z2",
					{
						class: isToday(date) ? "calendar-current-day-text" : "",
						style: {
							opacity: isPaddingDay ? 0.4 : 1,
							fontWeight: isPaddingDay ? "500" : null,
							fontSize: styles.isDesktopLayout() ? "14px" : "12px",
							lineHeight: size,
						},
					},
					String(day),
				),
			],
		)
	}

	/** render the events for the given week */
	private renderWeekEvents(attrs: CalendarMonthAttrs, week: ReadonlyArray<CalendarDay>, zone: string, isDisabled: boolean): Children {
		const eventsOnDays = attrs.getEventsOnDaysToRender(week.map((day) => day.date))
		const events = new Set(eventsOnDays.longEvents.concat(eventsOnDays.shortEventsPerDay.flat()))
		const firstDayOfWeek = week[0].date
		const lastDayOfWeek = lastThrow(week)

		const dayWidth = this.getWidthForDay()

		const weekHeight = this.getHeightForWeek()

		const eventHeight = size.calendar_line_height + spaceBetweenEvents() // height + border

		const maxEventsPerDay = (weekHeight - dayHeight()) / eventHeight
		const numberOfEventsPerDayToRender = Math.floor(maxEventsPerDay) - 1 // preserve some space for the more events indicator

		/** initially, we have 0 extra, non-rendered events on each day of the week */
		const moreEventsForDay = [0, 0, 0, 0, 0, 0, 0]
		const eventMargin = styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile
		const firstDayOfNextWeek = getStartOfNextDayWithZone(lastDayOfWeek.date, zone)
		return layOutEvents(
			Array.from(events),
			zone,
			(columns) => {
				return columns
					.map((eventsInColumn, columnIndex) => {
						return eventsInColumn.map((event) => {
							if (columnIndex < numberOfEventsPerDayToRender) {
								const eventIsAllDay = isAllDayEventByTimes(event.startTime, event.endTime)
								const eventStart = eventIsAllDay ? getAllDayDateForTimezone(event.startTime, zone) : event.startTime
								const eventEnd = eventIsAllDay ? incrementDate(getEventEnd(event, zone), -1) : event.endTime

								const position = this.getEventPosition(
									eventStart,
									eventEnd,
									firstDayOfWeek,
									firstDayOfNextWeek,
									dayWidth,
									dayHeight(),
									columnIndex,
								)
								return this.renderEvent(event, position, eventStart, firstDayOfWeek, firstDayOfNextWeek, eventEnd, attrs, isDisabled)
							} else {
								for (const [dayIndex, dayInWeek] of week.entries()) {
									const eventsForDay = attrs.eventsForDays.get(dayInWeek.date.getTime())

									if (eventsForDay && eventsForDay.indexOf(event) !== -1) {
										moreEventsForDay[dayIndex]++
									}
								}
								return null
							}
						})
					})
					.concat(
						moreEventsForDay.map((moreEventsCount, weekday) => {
							const day = week[weekday]
							const isPadding = day.isPaddingDay

							if (moreEventsCount > 0) {
								return m(
									".abs.small" + (isPadding ? ".calendar-bubble-more-padding-day" : ""),
									{
										style: {
											bottom: 0,
											height: px(CALENDAR_EVENT_HEIGHT),
											left: px(weekday * dayWidth + eventMargin),
											width: px(dayWidth - 2 - eventMargin * 2),
											pointerEvents: "none",
										},
									},
									m(
										"",
										{
											style: {
												"font-weight": "600",
											},
										},
										"+" + moreEventsCount,
									),
								)
							} else {
								return null
							}
						}),
					)
			},
			EventLayoutMode.DayBasedColumn,
		)
	}

	private renderEvent(
		event: CalendarEvent,
		position: SimplePosRect,
		eventStart: Date,
		firstDayOfWeek: Date,
		firstDayOfNextWeek: Date,
		eventEnd: Date,
		attrs: CalendarMonthAttrs,
		isDisabled: boolean,
	): Children {
		const isTemporary = attrs.temporaryEvents.includes(event)
		return m(
			".abs.overflow-hidden",
			{
				key: event._id[0] + event._id[1] + event.startTime.getTime(),
				style: {
					top: px(position.top),
					height: px(CALENDAR_EVENT_HEIGHT),
					left: px(position.left),
					right: px(position.right),
					pointerEvents: !styles.isUsingBottomNavigation() ? "auto" : "none",
				},
				onmousedown: () => {
					let dayUnderMouse = this.dayUnderMouse
					let lastMousePos = this.lastMousePos

					if (dayUnderMouse && lastMousePos && !isTemporary) {
						this.eventDragHandler.prepareDrag(event, dayUnderMouse, lastMousePos, true)
					}
				},
			},
			m(ContinuingCalendarEventBubble, {
				event: event,
				startsBefore: eventStart < firstDayOfWeek,
				endsAfter: firstDayOfNextWeek < eventEnd,
				color: getEventColor(event, attrs.groupColors),
				showTime: styles.isDesktopLayout() && !isAllDayEvent(event) ? EventTextTimeOption.START_TIME : null,
				user: locator.logins.getUserController().user,
				onEventClicked: (e, domEvent) => {
					attrs.onEventClicked(event, domEvent)
				},
				onEventKeyDown: (e, domEvent) => {
					attrs.onEventKeyDown(event, domEvent)
				},
				fadeIn: !this.eventDragHandler.isDragging,
				opacity: isTemporary ? TEMPORARY_EVENT_OPACITY : 1,
				enablePointerEvents: !this.eventDragHandler.isDragging && !isTemporary && client.isDesktopDevice() && !isDisabled,
			}),
		)
	}

	private getEventPosition(
		eventStart: Date,
		eventEnd: Date,
		firstDayOfWeek: Date,
		firstDayOfNextWeek: Date,
		calendarDayWidth: number,
		calendarDayHeight: number,
		columnIndex: number,
	): SimplePosRect {
		const top = (size.calendar_line_height + spaceBetweenEvents()) * columnIndex + calendarDayHeight + EVENT_BUBBLE_VERTICAL_OFFSET
		const dayOfStartDateInWeek = getDiffIn24IntervalsFast(eventStart, firstDayOfWeek)
		const dayOfEndDateInWeek = getDiffIn24IntervalsFast(eventEnd, firstDayOfWeek)
		const calendarEventMargin = styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile
		const left = (eventStart < firstDayOfWeek ? 0 : dayOfStartDateInWeek * calendarDayWidth) + calendarEventMargin
		const right = (eventEnd > firstDayOfNextWeek ? 0 : (6 - dayOfEndDateInWeek) * calendarDayWidth) + calendarEventMargin
		return {
			top,
			left,
			right,
		}
	}

	private getHeightForWeek(): number {
		if (!this.monthDom) {
			return 1
		}

		const monthDomHeight = this.monthDom.offsetHeight
		return monthDomHeight / 6
	}

	private getWidthForDay(): number {
		if (!this.monthDom) {
			return 1
		}

		const monthDomWidth = this.monthDom.offsetWidth
		return monthDomWidth / 7
	}
}

/**
 * Optimization to not create luxon's DateTime in simple case.
 * May not work if we allow override time zones.
 */
function getDiffIn24IntervalsFast(left: Date, right: Date): number {
	if (left.getMonth() === right.getMonth()) {
		return left.getDate() - right.getDate()
	} else {
		return getDiffIn24hIntervals(right, left)
	}
}
