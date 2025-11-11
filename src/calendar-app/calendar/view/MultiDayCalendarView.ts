import m, { ChildArray, Children, Component, Vnode, VnodeDOM } from "mithril"
import { deduplicate, getStartOfDay, identity, incrementDate, lastThrow, neverNull, ofClass, remove } from "@tutao/tutanota-utils"
import { formatShortTime, formatTime } from "../../../common/misc/Formatter"
import {
	combineDateWithTime,
	eventEndsAfterDay,
	eventStartsBefore,
	getDiffIn24hIntervals,
	getEventEnd,
	getEventStart,
	getRangeOfDays,
	getStartOfWeek,
	getTimeTextFormatForLongEvent,
	getTimeZone,
	isSameEventInstance,
} from "../../../common/calendar/date/CalendarUtils"
import { CalendarDayEventsView, calendarDayTimes } from "./CalendarDayEventsView"
import { theme } from "../../../common/gui/theme"
import { px, size } from "../../../common/gui/size"
import { EventTextTimeOption, WeekStart } from "../../../common/api/common/TutanotaConstants"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { GroupColors } from "./CalendarView"
import type { EventDragHandlerCallbacks, MousePos } from "./EventDragHandler"
import { EventDragHandler } from "./EventDragHandler"
import { getIfLargeScroll, getPosAndBoundsFromMouseEvent } from "../../../common/gui/base/GuiUtils"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { styles } from "../../../common/gui/styles"
import {
	CALENDAR_EVENT_HEIGHT,
	daysHaveAllDayEvents,
	daysHaveEvents,
	EventLayoutMode,
	getDayCircleClass,
	getEventColor,
	layOutEvents,
	TEMPORARY_EVENT_OPACITY,
} from "../gui/CalendarGuiUtils.js"
import type { CalendarEventBubbleClickHandler, CalendarEventBubbleKeyDownHandler, EventsOnDays, EventWrapper } from "./CalendarViewModel"
import { CalendarViewType, isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { Time } from "../../../common/calendar/date/Time.js"
import { getStartOfTheWeekOffset } from "../../../common/misc/weekOffset"
import { shallowIsSameEvent } from "../../../common/calendar/gui/ImportExportUtils"
import { CalendarViewComponent, CalendarViewComponentAttrs } from "./calendarViewComponent/CalendarViewComponent"
import { HeaderVariant } from "./calendarViewComponent/HeaderComponent"
import { CellActionHandler } from "../../../common/calendar/gui/TimeView"
import { LegacyContinuingCalendarEventBubble } from "./LegacyContinuingEventBubble"

export type MultiDayCalendarViewAttrs = {
	selectedDate: Date
	daysInPeriod: number
	onDateSelected: (date: Date, calendarViewTypeToShow?: CalendarViewType) => unknown
	getEventsOnDays: (range: Array<Date>) => EventsOnDays
	onNewEvent: (date: Date | null) => unknown
	onEventClicked: CalendarEventBubbleClickHandler
	onEventKeyDown: CalendarEventBubbleKeyDownHandler
	groupColors: GroupColors
	startOfTheWeek: WeekStart
	onChangeViewPeriod: (next: boolean) => unknown
	temporaryEvents: Array<EventWrapper>
	dragHandlerCallbacks: EventDragHandlerCallbacks
	isDaySelectorExpanded: boolean
	weekIndicator: string | null
	scrollPosition: number
	onScrollPositionChange: (newPosition: number) => unknown
	onViewChanged: (vnode: VnodeDOM) => unknown
	currentViewType: CalendarViewType // FIXME is it necessary?

	showWeekDays: boolean
	smoothScroll: boolean
}

export class MultiDayCalendarView implements Component<MultiDayCalendarViewAttrs> {
	private longEventsDom: HTMLElement | null = null
	private domElements: HTMLElement[] = []
	private eventDragHandler: EventDragHandler
	private dateUnderMouse: Date | null = null
	private viewDom: HTMLElement | null = null
	private lastMousePos: MousePos | null = null
	private isHeaderEventBeingDragged: boolean = false
	// These variables are used to prevent `scrollDOMs()` overwriting an in-progress `scrollTo()` from a previous call to `scrollDOMs()`
	private isProgrammaticScrollInProgress: boolean = false
	private scrollEndTime: TimeoutID | null = null
	private lastScrollPosition: number | null = null
	private viewType: CalendarViewType

	constructor({ attrs }: Vnode<MultiDayCalendarViewAttrs>) {
		this.eventDragHandler = new EventDragHandler(neverNull(document.body as HTMLBodyElement), attrs.dragHandlerCallbacks)
		this.viewType = attrs.currentViewType
	}

	onupdate(vnode: VnodeDOM<MultiDayCalendarViewAttrs>) {
		this.viewDom = vnode.dom as HTMLElement
		if (vnode.attrs.currentViewType !== this.viewType) {
			this.longEventsDom = null
			this.viewType = vnode.attrs.currentViewType
		}
	}

	view({ attrs }: Vnode<MultiDayCalendarViewAttrs>): Children {
		const { previous, current, next } = this.getPeriods(attrs.selectedDate, attrs.daysInPeriod, attrs.startOfTheWeek, attrs.getEventsOnDays)

		const newEventHandler: CellActionHandler = (baseDate: Date, time: Time) => {
			const newDate = new Date(baseDate)
			newDate.setHours(time.hour, time.minute)
			attrs.onNewEvent(newDate)
			attrs.onDateSelected(new Date(baseDate))
		}

		return m(CalendarViewComponent, {
			headerComponentAttrs: {
				dates: getRangeOfDays(current.start, attrs.daysInPeriod),
				selectedDate: attrs.selectedDate,
				onDateClick: attrs.onDateSelected,
				startOfWeek: attrs.startOfTheWeek,
				isDaySelectorExpanded: attrs.isDaySelectorExpanded,
				variant: styles.isDesktopLayout() || attrs.currentViewType === CalendarViewType.THREE_DAY ? HeaderVariant.NORMAL : HeaderVariant.SWIPEABLE,
				showWeekDays: attrs.showWeekDays,
			},
			bodyComponentAttrs: {
				previous: {
					key: previous.start.getTime(),
					dates: previous.dates,
					events: previous.events,
				},
				current: {
					key: current.start.getTime(),
					dates: current.dates,
					events: current.events,
				},
				next: {
					key: next.start.getTime(),
					dates: next.dates,
					events: next.events,
				},
				onChangePage: attrs.onChangeViewPeriod,
				smoothScroll: attrs.smoothScroll,
			},
			cellActionHandlers: {
				onCellPressed: newEventHandler,
				onCellContextMenuPressed: newEventHandler,
			},
			eventBubbleHandlers: {
				click: attrs.onEventClicked,
				keyDown: attrs.onEventKeyDown,
			},
			dragHandlerCallbacks: attrs.dragHandlerCallbacks,
		} satisfies CalendarViewComponentAttrs)
	}

	private getPeriods(baseDate: Date, daysInPeriod: number, startOfWeek: WeekStart, getEventsFunction: (range: Date[]) => EventsOnDays) {
		const periods = this.getStartOfPeriods(baseDate, daysInPeriod, startOfWeek)
		const previousEvents = this.getEventsInPeriod(getEventsFunction, daysInPeriod, periods.previous)
		const currentEvents = this.getEventsInPeriod(getEventsFunction, daysInPeriod, periods.current)
		const nextEvents = this.getEventsInPeriod(getEventsFunction, daysInPeriod, periods.next)

		return {
			previous: {
				start: periods.previous,
				dates: previousEvents.days,
				events: {
					short: deduplicate(previousEvents.shortEventsPerDay.flatMap(identity), isSameEventInstance),
					long: deduplicate(previousEvents.longEvents, isSameEventInstance),
				},
			},
			current: {
				start: periods.current,
				dates: currentEvents.days,
				events: {
					short: deduplicate(currentEvents.shortEventsPerDay.flatMap(identity), isSameEventInstance),
					long: deduplicate(currentEvents.longEvents, isSameEventInstance),
				},
			},
			next: {
				start: periods.next,
				dates: nextEvents.days,
				events: {
					short: deduplicate(nextEvents.shortEventsPerDay.flatMap(identity), isSameEventInstance),
					long: deduplicate(nextEvents.longEvents, isSameEventInstance),
				},
			},
		}
	}

	private getStartOfPeriods(baseDate: Date, daysInPeriod: number, startOfWeek: WeekStart) {
		const startOfThisPeriod = daysInPeriod === 7 ? getStartOfWeek(baseDate, getStartOfTheWeekOffset(startOfWeek)) : baseDate
		const startOfPreviousPeriod = incrementDate(new Date(startOfThisPeriod), -daysInPeriod)
		const startOfNextPeriod = incrementDate(new Date(startOfThisPeriod), daysInPeriod)

		return { previous: startOfPreviousPeriod, current: startOfThisPeriod, next: startOfNextPeriod }
	}

	private getEventsInPeriod(getEventsFunction: (range: Date[]) => EventsOnDays, daysInPeriod: number, startOfPeriod: Date) {
		const weekRange = getRangeOfDays(startOfPeriod, daysInPeriod)
		return getEventsFunction(weekRange)
	}

	private static getTodayTimestamp(): number {
		return getStartOfDay(new Date()).getTime()
	}

	private renderDays(
		attrs: MultiDayCalendarViewAttrs,
		thisPeriod: EventsOnDays,
		mainPeriod: EventsOnDays,
		isDayView: boolean,
		isDesktopLayout: boolean,
	): Children {
		let containerStyle

		if (isDesktopLayout) {
			containerStyle = {
				marginLeft: "5px",
				overflow: "hidden",
				marginBottom: px(size.hpad_large),
			}
		} else {
			containerStyle = {}
		}

		// Whether the current list is the visible list and not one of the lists used for swiping
		const isMainView = thisPeriod === mainPeriod

		const resolveClasses = (): string => {
			const classes = isDesktopLayout
				? ["mlr-l", "border-radius-big"]
				: ["border-radius-top-left-big", "border-radius-top-right-big", "content-bg", "mlr-safe-inset"]

			return classes.join(" ")
		}

		return m(
			".fill-absolute.flex.col.overflow-hidden",
			{
				class: resolveClasses(),
				style: containerStyle,
				onmousemove: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					this.lastMousePos = getPosAndBoundsFromMouseEvent(mouseEvent)

					if (this.dateUnderMouse) {
						return this.eventDragHandler.handleDrag(this.dateUnderMouse, this.lastMousePos)
					}
				},
				onmouseup: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					this.endDrag(mouseEvent)
				},
				onmouseleave: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					if (this.eventDragHandler.isDragging) {
						this.cancelDrag()
					}
				},
			},
			[
				isDesktopLayout ? this.renderHeaderDesktop(attrs, thisPeriod, mainPeriod) : null,
				// using .scroll-no-overlay because of a browser bug in Chromium where scroll wouldn't work at all
				// see https://github.com/tutao/tutanota/issues/4846
				m(
					".flex.scroll-no-overlay.content-bg",
					{
						oncreate: (vnode) => {
							this.isProgrammaticScrollInProgress = false
							if (isMainView) {
								this.scrollDOMs(vnode, attrs, false)
								attrs.onViewChanged(vnode)
								this.lastScrollPosition = attrs.scrollPosition
							}
							this.domElements.push(vnode.dom as HTMLElement)
						},
						onupdate: isMainView
							? (vnode) => {
									this.scrollDOMs(vnode, attrs, getIfLargeScroll(this.lastScrollPosition, attrs.scrollPosition))
									attrs.onViewChanged(vnode)
									this.lastScrollPosition = attrs.scrollPosition
								}
							: undefined,
						onscroll: isMainView
							? (event: Event) => {
									// Ignore calls to `scrollTo()` via the `isProgrammaticScrollInProgress` flag
									// because they are considered user input by `event.isTrusted`
									// Safari does not support the scroll end event, so we have to implement it ourselves
									if (this.isProgrammaticScrollInProgress) {
										clearTimeout(this.scrollEndTime)
										this.scrollEndTime = setTimeout(() => {
											this.isProgrammaticScrollInProgress = false
											attrs.onScrollPositionChange((event.target as HTMLElement).scrollTop)
										}, 100)
									} else {
										attrs.onScrollPositionChange((event.target as HTMLElement).scrollTop)
									}
								}
							: undefined,
						onremove: (vnode) => {
							remove(this.domElements, vnode.dom as HTMLElement)
						},
					},
					[
						m(
							".flex.col",
							calendarDayTimes.map((time) => {
								const width = isDesktopLayout ? size.calendar_hour_width : size.calendar_hour_width_mobile
								return m(
									".calendar-hour.flex.cursor-pointer",
									{
										onclick: (e: MouseEvent) => {
											e.stopPropagation()
											attrs.onNewEvent(time.toDate(attrs.selectedDate))
										},
									},
									m(
										".pl-s.pr-s.center.small.flex.flex-column.justify-center",
										{
											style: {
												"line-height": isDesktopLayout ? px(size.calendar_hour_height) : "unset",
												width: px(width),
												height: px(size.calendar_hour_height),
												"border-right": `1px solid ${theme.outline_variant}`,
											},
										},
										isDesktopLayout ? formatTime(time.toDate()) : formatShortTime(time.toDate()),
									),
								)
							}),
						),
						m(
							".flex.flex-grow",
							thisPeriod.days.map((weekday, i) => {
								const events = thisPeriod.shortEventsPerDay[i]

								const newEventHandler = (hours: number, minutes: number) => {
									const newDate = new Date(weekday)
									newDate.setHours(hours, minutes)
									attrs.onNewEvent(newDate)
									attrs.onDateSelected(new Date(weekday))
								}

								return m(
									".flex-grow",
									{
										class: !isDayView ? "calendar-column-border" : "",
										style: {
											height: px(calendarDayTimes.length * size.calendar_hour_height),
										},
									},
									m(CalendarDayEventsView, {
										onEventClicked: attrs.onEventClicked,
										onEventKeyDown: attrs.onEventKeyDown,
										groupColors: attrs.groupColors,
										events: events,
										displayTimeIndicator: weekday.getTime() === MultiDayCalendarView.getTodayTimestamp(),
										onTimePressed: newEventHandler,
										onTimeContextPressed: newEventHandler,
										day: weekday,
										setCurrentDraggedEvent: (eventWrapper) => this.startEventDrag(eventWrapper),
										setTimeUnderMouse: (time) => (this.dateUnderMouse = combineDateWithTime(weekday, time)),
										isTemporaryEvent: (event) =>
											attrs.temporaryEvents.some((temporaryEvent) => shallowIsSameEvent(temporaryEvent.event, event.event)),
										isDragging: this.eventDragHandler.isDragging,
										fullViewWidth: this.viewDom?.getBoundingClientRect().width,
										disabled: !isMainView,
									}),
								)
							}),
						),
					],
				),
			],
		)
	}

	private scrollDOMs(vnode: VnodeDOM, attrs: MultiDayCalendarViewAttrs, isSmooth: boolean): void {
		// Do not override an ongoing `scrollTo()` call unless the update was caused by user input
		// Also do not scroll to a position the list is already at
		if ((this.isProgrammaticScrollInProgress && this.lastScrollPosition === attrs.scrollPosition) || vnode.dom.scrollTop === attrs.scrollPosition) {
			return
		}

		if (isSmooth) {
			this.isProgrammaticScrollInProgress = true
			vnode.dom.scrollTo({ top: attrs.scrollPosition, behavior: "smooth" })
			for (const dom of this.domElements) {
				dom.scrollTo({ top: attrs.scrollPosition, behavior: "smooth" })
			}
			vnode.dom.dispatchEvent(new Event("scroll"))
		} else {
			this.isProgrammaticScrollInProgress = false
			vnode.dom.scrollTop = attrs.scrollPosition
			for (const dom of this.domElements) {
				dom.scrollTop = attrs.scrollPosition
			}
		}
	}

	private startEventDrag(eventWrapper: EventWrapper) {
		const lastMousePos = this.lastMousePos

		if (this.dateUnderMouse && lastMousePos) {
			this.eventDragHandler.prepareDrag(eventWrapper, this.dateUnderMouse, lastMousePos, this.isHeaderEventBeingDragged)
		}
	}

	private renderHeaderMobile(
		thisPageEvents: EventsOnDays,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		onEventKeyDown: CalendarEventBubbleKeyDownHandler,
		temporaryEvents: Array<EventWrapper>,
	): Children {
		const longEventsResult = this.renderLongEvents(
			thisPageEvents.days,
			thisPageEvents.longEvents,
			groupColors,
			onEventClicked,
			onEventKeyDown,
			temporaryEvents,
			false,
		)
		// We calculate the height manually because we want the header to transition between heights when swiping left and right
		// Hardcoding some styles instead of classes so that we can avoid nasty magic numbers
		const mainPageEventsCount = longEventsResult.rows
		const padding = mainPageEventsCount !== 0 ? size.vpad_small : 0
		// Set bottom padding in height, because it will be ignored in the style
		const height = mainPageEventsCount * CALENDAR_EVENT_HEIGHT + padding
		return m(
			".calendar-long-events-header.flex-fixed.calendar-hour-margin.pr-l.rel",
			{
				style: {
					marginLeft: size.calendar_hour_width_mobile,
					borderBottom: "none",
					height: px(height),
					paddingTop: px(padding),
					transition: "height 200ms ease-in-out",
				},
			},
			longEventsResult.children,
		)
	}

	private renderHeaderDesktop(attrs: MultiDayCalendarViewAttrs, thisPageEvents: EventsOnDays, mainPageEvents: EventsOnDays): Children {
		const { daysInPeriod, onDateSelected, onEventClicked, onEventKeyDown, groupColors, temporaryEvents } = attrs
		// `scrollbar-gutter-stable-or-fallback` is needed because the scroll bar brings the calendar body out of line with the header
		return m(".calendar-long-events-header.flex-fixed.content-bg.pt-s.scrollbar-gutter-stable-or-fallback", [
			this.renderDayNamesRow(thisPageEvents.days, attrs.weekIndicator, onDateSelected, attrs.selectedDate, false, attrs.getEventsOnDays),
			m(".content-bg", [
				m(
					".calendar-hour-margin.content-bg",
					{
						onmousemove: (mouseEvent: MouseEvent) => {
							const { x, targetWidth } = getPosAndBoundsFromMouseEvent(mouseEvent)
							const dayWidth = targetWidth / daysInPeriod
							const dayNumber = Math.floor(x / dayWidth)
							const date = new Date(thisPageEvents.days[dayNumber])
							const dateUnderMouse = this.dateUnderMouse

							// When dragging short events, don't cause the mouse position date to drop to 00:00 when dragging over the header
							if (dateUnderMouse && this.eventDragHandler.isDragging && !this.isHeaderEventBeingDragged) {
								date.setHours(dateUnderMouse.getHours())
								date.setMinutes(dateUnderMouse.getMinutes())
							}

							this.dateUnderMouse = date
						},
					},
					// this section is tricky with margins. We use this view for both week and day view.
					// in day view there's no days row and no selection indicator.
					// it all must work with and without long events.
					// thread carefully and test all the cases.
					[this.renderLongEventsSection(thisPageEvents, mainPageEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents, false)],
				),
			]),
		])
	}

	private renderShortWeekHeader(attrs: MultiDayCalendarViewAttrs, thisPageEvents: EventsOnDays, mainPageEvents: EventsOnDays): Children {
		const { daysInPeriod, onDateSelected, onEventClicked, onEventKeyDown, groupColors, temporaryEvents } = attrs
		return m("flex-fixed.pt-s.scrollbar-gutter-stable-or-fallback", [
			this.renderDayNamesRow(thisPageEvents.days, null, (day, _) => onDateSelected(day), attrs.selectedDate, true, attrs.getEventsOnDays),
			m(".calendar-hour-margin.mb-s", [
				this.renderLongEventsSection(thisPageEvents, mainPageEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents, false),
			]),
		])
	}

	private renderLongEventsSection(
		thisPageEvents: EventsOnDays,
		mainPageEvents: EventsOnDays,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		onEventKeyDown: CalendarEventBubbleKeyDownHandler,
		temporaryEvents: Array<EventWrapper>,
		isDesktopLayout: boolean,
	): Children {
		const thisPageLongEvents = this.renderLongEvents(
			thisPageEvents.days,
			thisPageEvents.longEvents,
			groupColors,
			onEventClicked,
			onEventKeyDown,
			temporaryEvents,
			isDesktopLayout,
		)
		const mainPageLongEvents = this.renderLongEvents(
			mainPageEvents.days,
			mainPageEvents.longEvents,
			groupColors,
			onEventClicked,
			onEventKeyDown,
			temporaryEvents,
			isDesktopLayout,
		)
		return m(
			".rel.mb-xs",
			{
				oncreate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this.longEventsDom = vnode.dom as HTMLElement
					}

					m.redraw()
				},
				onupdate: (vnode) => {
					if (mainPageEvents === thisPageEvents) {
						this.longEventsDom = vnode.dom as HTMLElement
					}
				},
				style: {
					height: px(mainPageLongEvents.rows * CALENDAR_EVENT_HEIGHT),
					width: "100%",
					transition: "height 200ms ease-in-out",
				},
			},
			thisPageLongEvents.children,
		)
	}

	/**
	 *
	 * @returns the rendered calendar bubble children, and the maximum number of events that occur on a day (out of all days)
	 */
	private renderLongEvents(
		dayRange: Array<Date>,
		events: Array<EventWrapper>,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		onEventKeyDown: CalendarEventBubbleKeyDownHandler,
		temporaryEvents: Array<EventWrapper>,
		isDesktopLayout: boolean,
	): {
		children: Children
		rows: number
	} {
		if (isDesktopLayout) {
			return dayRange.length === 1
				? {
						children: this.renderLongEventsForSingleDay(dayRange[0], events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents),
						rows: events.length,
					}
				: this.renderLongEventsForMultipleDays(dayRange, events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents)
		} else {
			return this.renderLongEventsForMultipleDays(dayRange, events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents)
		}
	}

	/**
	 *Only called from day view where header events are not draggable
	 */
	private renderLongEventsForSingleDay(
		day: Date,
		events: Array<EventWrapper>,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		onEventKeyDown: CalendarEventBubbleKeyDownHandler,
		temporaryEvents: Array<EventWrapper>,
	): Children {
		const zone = getTimeZone()
		return m(
			"",
			events.map((wrapper) => {
				return this.renderLongEventBubble(
					wrapper,
					getTimeTextFormatForLongEvent(wrapper.event, day, day, zone),
					eventStartsBefore(day, zone, wrapper.event),
					eventEndsAfterDay(day, zone, wrapper.event),
					groupColors,
					(_, domEvent) => onEventClicked(wrapper.event, domEvent),
					(_, domEvent) => onEventKeyDown(wrapper.event, domEvent),
					temporaryEvents.some((temporaryEvent) => shallowIsSameEvent(temporaryEvent.event, wrapper.event)),
				)
			}),
		)
	}

	private renderLongEventsForMultipleDays(
		dayRange: Array<Date>,
		events: Array<EventWrapper>,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		onEventKeyDown: CalendarEventBubbleKeyDownHandler,
		temporaryEvents: Array<EventWrapper>,
	): {
		children: Children
		rows: number
	} {
		if (this.longEventsDom == null && this.viewDom == null) {
			return {
				children: null,
				rows: 0,
			}
		}
		const dayWidth =
			(this.longEventsDom != null ? this.longEventsDom.offsetWidth : this.viewDom!.offsetWidth - size.calendar_hour_width_mobile) / dayRange.length
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
					rows.map((eventWrapper) => {
						const isAllDay = isAllDayEvent(eventWrapper.event)
						const eventEnd = isAllDay ? incrementDate(getEventEnd(eventWrapper.event, zone), -1) : eventWrapper.event.endTime
						const dayOfStartDate = getDiffIn24hIntervals(firstDay, getEventStart(eventWrapper.event, zone))
						const dayOfEndDate = getDiffIn24hIntervals(firstDay, eventEnd)
						const startsBefore = eventStartsBefore(firstDay, zone, eventWrapper.event)
						const endsAfter = eventEndsAfterDay(lastDay, zone, eventWrapper.event)
						const left = startsBefore ? 0 : dayOfStartDate * dayWidth
						const right = endsAfter ? 0 : (dayRange.length - 1 - dayOfEndDate) * dayWidth
						return m(
							".abs",
							{
								style: {
									top: px(c * CALENDAR_EVENT_HEIGHT),
									left: px(left),
									right: px(right),
									opacity: eventWrapper.flags?.isGhost ? 0.5 : 1,
								},
								key: eventWrapper.event._id[0] + eventWrapper.event._id[1] + eventWrapper.event.startTime.getTime(),
								onmousedown: () => {
									// Only allow dragging all-day events on the desktop layout, since the header supports it
									if (styles.isDesktopLayout()) {
										this.isHeaderEventBeingDragged = true
										this.startEventDrag(eventWrapper)
									}
								},
							},
							this.renderLongEventBubble(
								eventWrapper,
								isAllDay ? null : EventTextTimeOption.START_END_TIME,
								startsBefore,
								endsAfter,
								groupColors,
								onEventClicked,
								onEventKeyDown,
								temporaryEvents.some((temporaryEvent) => shallowIsSameEvent(temporaryEvent.event, eventWrapper.event)),
							),
						)
					}),
				) as ChildArray
			},
			EventLayoutMode.DayBasedColumn,
		)
		return {
			children,
			rows: maxEventsInColumn,
		}
	}

	private renderLongEventBubble(
		event: EventWrapper,
		showTime: EventTextTimeOption | null,
		startsBefore: boolean,
		endsAfter: boolean,
		groupColors: GroupColors,
		onEventClicked: CalendarEventBubbleClickHandler,
		onEventKeyDown: CalendarEventBubbleKeyDownHandler,
		isTemporary: boolean,
	): Children {
		const fadeIn = !isTemporary
		const opacity = isTemporary ? TEMPORARY_EVENT_OPACITY : 1
		const enablePointerEvents = !this.eventDragHandler.isDragging && !isTemporary
		return m(LegacyContinuingCalendarEventBubble, {
			eventWrapper: event,
			startsBefore,
			endsAfter,
			color: getEventColor(event.event, groupColors, event.flags?.isGhost),
			onEventClicked,
			onEventKeyDown: onEventKeyDown,
			showTime,
			user: locator.logins.getUserController().user,
			fadeIn,
			opacity,
			enablePointerEvents,
		})
	}

	private renderDayNamesRow(
		days: Array<Date>,
		weekIndicator: string | null,
		onDateSelected: (arg0: Date, arg1: CalendarViewType) => unknown,
		selectedDate: Date,
		highlightSelectedDay: boolean,
		getEventsOnDays: (dateRange: Date[]) => EventsOnDays,
	): Children {
		if (days.length === 1 && weekIndicator == null) {
			return null
		}

		const getCircleClass = (date: Date) => getDayCircleClass(date, selectedDate)

		return m(
			".flex.mb-s",
			weekIndicator ? m(".calendar-hour-column.calendar-day-indicator.b.center-horizontally", weekIndicator) : m(".calendar-hour-margin"),
			days.length === 1
				? null
				: days.map((day) => {
						// the click handler is set on each child individually so as to not make the entire flex container clickable, only the text
						return this.renderDayHeader(onDateSelected, day, getEventsOnDays, getCircleClass)
					}),
		)
	}

	private renderDayHeader(
		onDateSelected: (arg0: Date, arg1: CalendarViewType) => unknown,
		day: Date,
		getEventsOnDays: (dateRange: Date[]) => EventsOnDays,
		getCircleClass: (date: Date) => {
			circle: string
			text: string
		},
	) {
		const onclick = () => onDateSelected(day, CalendarViewType.DAY)
		const eventsOnDay = getEventsOnDays([day])
		const shouldShowEventIndicator = !daysHaveAllDayEvents(eventsOnDay) && daysHaveEvents(eventsOnDay)
		const classes = getCircleClass(day)
		return m(".flex.flex-column.center-horizontally.flex-grow.center.b.items-center.rel", [
			m(
				".flex.center-horizontally.flex-grow.center.b.items-center",
				{
					class: !styles.isDesktopLayout() && shouldShowEventIndicator ? "mb-s" : "",
				},
				[
					m(
						".calendar-day-indicator.clickable",
						{
							onclick,
							style: {
								"padding-right": px(4),
							},
						},
						lang.formats.weekdayShort.format(day) + " ",
					),
					m(
						".rel.click.flex.items-center.justify-center.rel.ml-hpad_small",
						{
							"aria-label": day.toLocaleDateString(),
							onclick,
						},
						[
							m(".abs.z1.circle", {
								class: classes.circle,
								style: {
									width: px(size.calendar_days_header_height),
									height: px(size.calendar_days_header_height),
								},
							}),
							m(
								".full-width.height-100p.center.z2",
								{
									class: classes.text,
									style: {
										fontSize: px(14),
										lineHeight: px(size.calendar_days_header_height),
									},
								},
								day.getDate(),
							),
						],
					),
				],
			),
			!styles.isDesktopLayout() && shouldShowEventIndicator
				? m(".day-events-indicator", {
						style: styles.isDesktopLayout()
							? {
									width: "3px",
									height: "3px",
								}
							: {},
					})
				: null,
		])
	}

	private endDrag(pos: MousePos) {
		this.isHeaderEventBeingDragged = false

		if (this.dateUnderMouse) {
			this.eventDragHandler.endDrag(this.dateUnderMouse, pos, this.eventDragHandler.pressedDragKey).catch(ofClass(UserError, showUserError))
		}
	}

	private cancelDrag() {
		this.eventDragHandler.cancelDrag()
	}
}
