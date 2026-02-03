import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { styles } from "../../../common/gui/styles"
import { WeekStart } from "../../../common/api/common/TutanotaConstants"
import { calendarWeek, extractCalendarEventModifierKey } from "../gui/CalendarGuiUtils"
import { WeekDaysComponent, WeekDaysComponentAttrs } from "./WeekDaysComponent"
import { CalendarTimeColumn, CalendarTimeColumnAttrs, getTimeColumnWidth } from "../../../common/calendar/gui/CalendarTimeColumn"
import { Time } from "../../../common/calendar/date/Time"
import { px } from "../../../common/gui/size"
import { CalendarTimeGrid, CalendarTimeGridAttributes, SUBROWS_PER_INTERVAL, TimeRange, TimeScale } from "../../../common/calendar/gui/CalendarTimeGrid"
import { EventWrapper, ScrollByListener } from "./CalendarViewModel"
import { EventBubbleInteractions } from "../../../common/calendar/gui/CalendarEventBubble"
import { EventDragHandler, type EventDragHandlerCallbacks, type MousePos } from "./EventDragHandler"
import { isEmpty, isToday, neverNull, ofClass } from "@tutao/tutanota-utils"
import { deviceConfig } from "../../../common/misc/DeviceConfig"
import { PageView } from "../../../common/gui/base/PageView"
import { AllDaySection, AllDaySectionAttrs } from "../../../common/calendar/gui/AllDaySection"
import { combineDateWithTime } from "../../../common/calendar/date/CalendarUtils"
import { getPosAndBoundsFromMouseEvent } from "../../../common/gui/base/GuiUtils"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"

/**
 * Represents a single page (previous/current/next) in the calendar sliding view.
 */
export interface CalendarViewPageAttrs {
	/** Period start timestamp */
	key: number
	/** Dates displayed in this period */
	dates: Array<Date>
	/** Events by list type */
	events: {
		short: Array<EventWrapper>
		long: Array<EventWrapper>
	}
}

interface BodyComponentAttrs {
	previous: CalendarViewPageAttrs
	current: CalendarViewPageAttrs
	next: CalendarViewPageAttrs
	/**
	 * Callback triggered when the page changes.
	 * @param moveForward - true if moving to the next page, false if moving back
	 */
	onChangePage: (moveForward: boolean) => void

	/**
	 * Scroll behavior.
	 * - Should be smooth (`true`) when clicking the "Today" button.
	 */
	smoothScroll: boolean
	registerListener: (listener: ScrollByListener) => void
	onViewChanged: (vnode: VnodeDOM) => unknown
	amPm: boolean
}

export interface CalendarTimeBasedViewComponentAttrs {
	headerComponentAttrs: WeekDaysComponentAttrs
	bodyComponentAttrs: BodyComponentAttrs
	cellActionHandlers: CalendarTimeGridAttributes["cellActionHandlers"]
	eventBubbleHandlers: EventBubbleInteractions
	dragHandlerCallbacks: EventDragHandlerCallbacks
}

/**
 * Main calendar view component that orchestrates the weekly/daily calendar display.
 *
 * **Responsibilities:**
 * - Renders week header with day indicators and week number
 * - Displays all-day events section
 * - Renders time-based event grid with hourly intervals
 * - Manages drag-and-drop interactions for events
 * - Handles keyboard shortcuts for event manipulation
 *
 * Layout Structure:
 * ```
 * +-------------+-------------------+
 * | Week Number | Week Days Section |
 * +-------------+-------------------+
 * | (empty)     | All Day Section   |
 * +-------------+-------------------+
 * | Time Column | Calendar Grid     |
 * +-------------+-------------------+
 * ```
 */
export class CalendarTimeBasedViewComponent implements ClassComponent<CalendarTimeBasedViewComponentAttrs> {
	private layoutState: {
		dayHeight: number | null
		pageViewWidth: number | null
		rowCountPerDay: number
		gridRowHeight: number
	} = {
		dayHeight: null,
		pageViewWidth: null,
		rowCountPerDay: 0,
		gridRowHeight: 6,
	}

	private dragState: {
		dateUnderMouse: Date | null
		lastMousePos: MousePos | null
	} = {
		dateUnderMouse: null,
		lastMousePos: null,
	}

	private viewConfig: {
		readonly timeScale: TimeScale
		readonly timeRange: TimeRange
		intervals: Array<Time>
	} = {
		timeScale: 1,
		timeRange: { start: new Time(0, 0), end: new Time(23, 0) },
		intervals: [],
	}

	private eventDragHandler: EventDragHandler

	constructor({ attrs }: Vnode<CalendarTimeBasedViewComponentAttrs>) {
		this.eventDragHandler = new EventDragHandler(neverNull(document.body as HTMLBodyElement), attrs.dragHandlerCallbacks)
		this.viewConfig.intervals = CalendarTimeColumn.createTimeColumnIntervals(this.viewConfig.timeScale, this.viewConfig.timeRange)
		this.layoutState.rowCountPerDay = SUBROWS_PER_INTERVAL * this.viewConfig.intervals.length
	}

	oncreate(vnode: VnodeDOM<CalendarTimeBasedViewComponentAttrs>) {
		document.addEventListener("keydown", this.handleKeyDown)
		document.addEventListener("keyup", this.handleKeyUp)

		/*
		 * Workaround for weird interaction in grid layout calculation behavior in Safari 26.
		 * Forcing a new animation frame seems to ensure css grid styling is applied correctly.
		 * See Issue #10072
		 */
		window.requestAnimationFrame(() => {
			const domelement = vnode.dom as HTMLElement
			domelement.style.minWidth = "0px"
		})
	}

	onremove(): any {
		document.removeEventListener("keydown", this.handleKeyDown)
		document.removeEventListener("keyup", this.handleKeyUp)
	}

	handleKeyDown = (e: KeyboardEvent) => {
		this.eventDragHandler.pressedDragKey = extractCalendarEventModifierKey(e)
		m.redraw()
	}

	handleKeyUp = () => {
		this.eventDragHandler.pressedDragKey = undefined
		m.redraw()
	}

	view({ attrs }: Vnode<CalendarTimeBasedViewComponentAttrs>) {
		const resolveClasses = (): string => {
			const classes = styles.isDesktopLayout() ? ["content-bg", "mr-24", "border-radius-12"] : ["mlr-safe-inset"]
			return classes.join(" ")
		}

		return m(
			".grid.height-100p.overflow-hidden",
			{
				class: resolveClasses(),
				style: {
					marginLeft: px(5), // keep in sync with toolbar definition
					gridTemplateRows: "auto auto 1fr",
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[this.renderWeekDaysSection(attrs.headerComponentAttrs), this.renderAllDaySection(attrs), this.renderCalendarGridSection(attrs)],
		)
	}

	private renderWeekDaysSection(weekDaysComponentAttrs: WeekDaysComponentAttrs): Children {
		const weekStart = weekDaysComponentAttrs.startOfWeek ?? WeekStart.MONDAY
		return m(
			".grid.pt-8.pb-8",
			{
				class: styles.isDesktopLayout() ? "content-bg" : "nav-bg",
				style: {
					gridTemplateColumns: `${px(getTimeColumnWidth())} 1fr`,
				} satisfies Partial<CSSStyleDeclaration>,
				onmouseleave: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					if (this.eventDragHandler.isDragging) {
						this.cancelDrag()
					}
				},
			},
			[
				m(
					".b.text-center.calendar-day-indicator",
					{
						class: styles.isDesktopLayout() ? undefined : "text-fade",
					},
					styles.isDesktopLayout()
						? calendarWeek(weekDaysComponentAttrs.selectedDate, weekStart, false)
						: calendarWeek(weekDaysComponentAttrs.selectedDate, weekStart, true),
				),
				weekDaysComponentAttrs.showWeekDays
					? m(".min-width-0", m(WeekDaysComponent, { ...weekDaysComponentAttrs } satisfies WeekDaysComponentAttrs))
					: null,
			],
		)
	}

	private renderCalendarGridSection(attrs: CalendarTimeBasedViewComponentAttrs) {
		if (isEmpty(attrs.headerComponentAttrs.dates)) {
			console.warn("CalendarTimeBasedViewComponent: No dates provided")
			return null
		}

		const periodHasToday = attrs.headerComponentAttrs.dates.some((date) => isToday(date))
		const timeColumnWidth = getTimeColumnWidth()
		const shouldRenderTimeIndicator = periodHasToday && this.layoutState.dayHeight && this.layoutState.pageViewWidth
		const currentTime = Time.fromDate(new Date())

		return m(
			/* z1 is required so webkit can properly render the scrollbar over absolute positioned the content after a 3d transformation
			 * See: https://github.com/emberjs/list-view/issues/54
			 */
			".grid.scroll.z1",
			{
				class: styles.isDesktopLayout() ? "border-top" : "",
				style: {
					gridTemplateColumns: `${px(getTimeColumnWidth())} 1fr`,
				} satisfies Partial<CSSStyleDeclaration>,
				oncreate: (vnode: VnodeDOM) => {
					const scrollToCurrentTime = attrs.headerComponentAttrs.dates.length === 1 && periodHasToday
					const time = scrollToCurrentTime ? new Date().getHours() : deviceConfig.getScrollTime()
					this.scrollToTime(time, scrollToCurrentTime ? "center" : "start", "instant")
					attrs.bodyComponentAttrs.registerListener((amount: number) => {
						vnode.dom.scrollBy({ top: amount })
					})
					attrs.bodyComponentAttrs.onViewChanged(vnode)
				},
				onupdate: () => {
					if (attrs.bodyComponentAttrs.smoothScroll) {
						this.scrollToTime(new Date().getHours(), "center", "smooth")
					}
				},
				onmousemove: this.handleMouseMove,
				onmouseup: this.handleMouseUp,
			},
			[
				m(
					".content-bg.border-radius-top-left-12",
					m(CalendarTimeColumn, {
						intervals: this.viewConfig.intervals,
						baseDate: attrs.headerComponentAttrs?.selectedDate,
						onCellPressed: attrs.cellActionHandlers?.onCellPressed,
						layout: {
							width: timeColumnWidth,
							subColumnCount: 1,
							rowCount: this.layoutState.rowCountPerDay,
							gridRowHeight: this.layoutState.gridRowHeight,
						},
						currentTime: shouldRenderTimeIndicator ? currentTime : undefined,
						amPm: attrs.bodyComponentAttrs.amPm,
					} satisfies CalendarTimeColumnAttrs),
				),
				m(
					".content-bg.border-radius-top-right-12.min-width-0.overflow-x-hidden",
					{
						onupdate: (vnode) => {
							const newHeight = vnode.dom.clientHeight
							const newWidth = vnode.dom.clientWidth

							if (newHeight !== this.layoutState.dayHeight || newWidth !== this.layoutState.pageViewWidth) {
								this.layoutState.dayHeight = newHeight
								this.layoutState.pageViewWidth = newWidth
								m.redraw() // Force redraw to show time indicator
							}
						},
					},
					m(PageView, {
						classes: "height-100p",
						previousPage: {
							key: attrs.bodyComponentAttrs.previous.key,
							nodes: this.renderEventGrid(
								this.viewConfig.timeRange,
								attrs.bodyComponentAttrs.previous.dates,
								attrs.bodyComponentAttrs.previous.events.short,
								attrs.cellActionHandlers,
								attrs.eventBubbleHandlers,
								currentTime,
								false,
								false,
							),
						},
						currentPage: {
							key: attrs.bodyComponentAttrs.current.key,
							nodes: this.renderEventGrid(
								this.viewConfig.timeRange,
								attrs.bodyComponentAttrs.current.dates,
								attrs.bodyComponentAttrs.current.events.short,
								attrs.cellActionHandlers,
								attrs.eventBubbleHandlers,
								currentTime,
								true,
								false,
							),
						},
						nextPage: {
							key: attrs.bodyComponentAttrs.next.key,
							nodes: this.renderEventGrid(
								this.viewConfig.timeRange,
								attrs.bodyComponentAttrs.next.dates,
								attrs.bodyComponentAttrs.next.events.short,
								attrs.cellActionHandlers,
								attrs.eventBubbleHandlers,
								currentTime,
								false,
								true,
							),
						},
						onChangePage: (next) => attrs.bodyComponentAttrs.onChangePage(next),
					}),
				),
			],
		)
	}

	private renderAllDaySection(attrs: CalendarTimeBasedViewComponentAttrs) {
		return m(
			".grid.overflow-hidden.rel.scrollbar-gutter-stable-or-fallback",
			{
				style: {
					gridTemplateColumns: `${px(getTimeColumnWidth())} 1fr`,
				} satisfies Partial<CSSStyleDeclaration>,
				onmousemove: this.handleMouseMove,
				onmouseup: this.handleMouseUp,
			},
			[
				m(""), // empty diff to satisfy grid definition
				m(AllDaySection, {
					dates: attrs.bodyComponentAttrs.current.dates,
					allDayEventWrappers: attrs.bodyComponentAttrs.current.events.long,
					eventBubbleHandlers: {
						...attrs.eventBubbleHandlers,
						drag: this.createDragHandlers(true),
					},
				} satisfies AllDaySectionAttrs),
			],
		)
	}

	private scrollToTime(
		time: number,
		positionOnScreen: Extract<ScrollLogicalPosition, "center" | "start">,
		behavior: Extract<ScrollBehavior, "instant" | "smooth">,
	) {
		const timeCell = document.getElementById(CalendarTimeColumn.getTimeCellId(time))
		timeCell?.scrollIntoView({ block: positionOnScreen, behavior })
	}

	private renderEventGrid(
		timeRange: TimeRange,
		dates: Array<Date>,
		events: Array<EventWrapper>,
		cellActionHandlers: CalendarTimeGridAttributes["cellActionHandlers"],
		eventBubbleHandlers: EventBubbleInteractions,
		currentTime: Time,
		hideRightBorder: boolean,
		showLeftBorderAtFirstColumn: boolean,
	) {
		return m(CalendarTimeGrid, {
			intervals: this.viewConfig.intervals,
			timeScale: 1,
			dates,
			events,
			cellActionHandlers,
			eventBubbleHandlers: {
				...eventBubbleHandlers,
				drag: this.createDragHandlers(false),
			},
			timeRange,
			layout: {
				rowCountForRange: this.layoutState.rowCountPerDay,
				gridRowHeight: this.layoutState.gridRowHeight,
				hideRightBorder,
				showLeftBorderAtFirstColumn,
			},
			time: currentTime,
		} satisfies CalendarTimeGridAttributes)
	}

	private createDragHandlers(keepTime: boolean) {
		return {
			prepareCurrentDraggedEvent: (eventWrapper: EventWrapper) => this.prepareEventDrag(eventWrapper, keepTime),
			setTimeUnderMouse: (time: Time, date: Date) => {
				const timeToCombine = keepTime && this.dragState.dateUnderMouse ? Time.fromDate(this.dragState.dateUnderMouse) : time
				return (this.dragState.dateUnderMouse = combineDateWithTime(date, timeToCombine))
			},
		}
	}

	private handleMouseMove = (mouseEvent: EventRedraw<MouseEvent>) => {
		mouseEvent.redraw = false
		this.dragState.lastMousePos = getPosAndBoundsFromMouseEvent(mouseEvent)
		if (this.dragState.dateUnderMouse) {
			return this.eventDragHandler.handleDrag(this.dragState.dateUnderMouse, this.dragState.lastMousePos)
		}
	}

	private handleMouseUp = (mouseEvent: EventRedraw<MouseEvent>) => {
		if (this.eventDragHandler.isDragging) {
			mouseEvent.preventDefault()
		}
		mouseEvent.redraw = false
		this.endDrag(mouseEvent)
	}

	private prepareEventDrag(eventWrapper: EventWrapper, keepTime: boolean) {
		if (eventWrapper.flags.isGhost) {
			return
		}
		const lastMousePos = this.dragState.lastMousePos

		if (this.dragState.dateUnderMouse && lastMousePos) {
			this.eventDragHandler.prepareDrag(eventWrapper, this.dragState.dateUnderMouse, lastMousePos, keepTime)
		}
	}

	private endDrag(pos: MousePos) {
		if (this.dragState.dateUnderMouse) {
			this.eventDragHandler.endDrag(this.dragState.dateUnderMouse, pos, this.eventDragHandler.pressedDragKey).catch(ofClass(UserError, showUserError))
			const eventWrapper = this.eventDragHandler.originalCalendarEventWrapper
			if (eventWrapper) {
				delete eventWrapper.flags?.isTransientEvent
			}
		}
	}

	private cancelDrag() {
		const eventWrapper = this.eventDragHandler.originalCalendarEventWrapper
		this.eventDragHandler.cancelDrag()
		if (eventWrapper) {
			delete eventWrapper.flags?.isTransientEvent
		}
	}
}
