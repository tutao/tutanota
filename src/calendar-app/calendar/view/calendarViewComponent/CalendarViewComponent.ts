import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { styles } from "../../../../common/gui/styles"
import { WeekStart } from "../../../../common/api/common/TutanotaConstants"
import { calendarWeek, extractCalendarEventModifierKey } from "../../gui/CalendarGuiUtils"
import { WeekDaysComponent, WeekDaysComponentAttrs } from "./WeekDaysComponent"
import { TimeColumn, TimeColumnAttrs } from "../../../../common/calendar/gui/TimeColumn"
import { Time } from "../../../../common/calendar/date/Time"
import { size } from "../../../../common/gui/size"
import { CalendarTimeGrid, CalendarTimeGridAttributes, getIntervalAsMinutes, TimeRange, TimeScale } from "../../../../common/calendar/gui/CalendarTimeGrid"
import { EventWrapper, ScrollByListener } from "../CalendarViewModel"
import { AllDaySection, AllDaySectionAttrs } from "../../../../common/calendar/gui/AllDaySection"
import { EventBubbleInteractions } from "../../../../common/calendar/gui/CalendarEventBubble"
import { getPosAndBoundsFromMouseEvent } from "../../../../common/gui/base/GuiUtils"
import { EventDragHandler, type EventDragHandlerCallbacks, type MousePos } from "../EventDragHandler"
import { isToday, neverNull, ofClass } from "@tutao/tutanota-utils"
import { UserError } from "../../../../common/api/main/UserError"
import { showUserError } from "../../../../common/misc/ErrorHandlerImpl"
import { combineDateWithTime } from "../../../../common/calendar/date/CalendarUtils"
import { deviceConfig } from "../../../../common/misc/DeviceConfig"
import { TimeIndicator, TimeIndicatorAttrs } from "../../../../common/calendar/gui/TimeIndicator"
import { PageView } from "../../../../common/gui/base/PageView"

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
}

export interface CalendarViewComponentAttrs {
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
 * @see CalendarViewComponent.GRID_TEMPLATE_AREAS
 * @see CalendarViewComponent.GRID_AREA
 */
export class CalendarViewComponent implements ClassComponent<CalendarViewComponentAttrs> {
	private layoutState: {
		dayHeight: number | null
		pageViewWidth: number | null
	} = {
		dayHeight: null,
		pageViewWidth: null,
	}

	private dragState: {
		dateUnderMouse: Date | null
		lastMousePos: MousePos | null
	} = {
		dateUnderMouse: null,
		lastMousePos: null,
	}

	private viewConfig: {
		timeScale: TimeScale
		timeRange: TimeRange
	} = {
		timeScale: 1,
		timeRange: { start: new Time(0, 0), end: new Time(23, 0) },
	}

	private eventDragHandler: EventDragHandler

	private static readonly GRID_AREA = {
		WEEK_NUMBER: "weekNumber",
		WEEK_DAYS_SECTION: "weekDaysSection",
		ALL_DAY_SECTION: "allDaySection",
		TIME_COLUMN: "timeColumn",
		CALENDAR_GRID: "calendarGrid",
	} as const

	private readonly GRID_TEMPLATE_AREAS =
		`"${CalendarViewComponent.GRID_AREA.WEEK_NUMBER} 	${CalendarViewComponent.GRID_AREA.WEEK_DAYS_SECTION}"` +
		` "empty											${CalendarViewComponent.GRID_AREA.ALL_DAY_SECTION}"` +
		` "${CalendarViewComponent.GRID_AREA.TIME_COLUMN} 	${CalendarViewComponent.GRID_AREA.CALENDAR_GRID}"`

	constructor({ attrs }: Vnode<CalendarViewComponentAttrs>) {
		this.eventDragHandler = new EventDragHandler(neverNull(document.body as HTMLBodyElement), attrs.dragHandlerCallbacks)
	}

	oncreate() {
		document.addEventListener("keydown", this.handleKeyDown)
		document.addEventListener("keyup", this.handleKeyUp)
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

	view({ attrs }: Vnode<CalendarViewComponentAttrs>) {
		const resolveClasses = (): string => {
			const classes = styles.isDesktopLayout() ? ["content-bg", "mr-l", "border-radius-big"] : ["mlr-safe-inset"]
			return classes.join(" ")
		}

		return m(
			".grid.height-100p.overflow-hidden",
			{
				class: resolveClasses(),
				style: {
					gridTemplateAreas: this.GRID_TEMPLATE_AREAS,
					gridTemplateRows: "auto auto 1fr",
					gridTemplateColumns: "auto 1fr",
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[this.renderWeekDaysSection(attrs.headerComponentAttrs), this.renderAllDaySection(attrs), this.renderCalendarGridSection(attrs)],
		)
	}

	private renderWeekDaysSection(weekDaysComponentAttrs: WeekDaysComponentAttrs): Children {
		const children: Children = [
			m(
				".b.text-center.calendar-day-indicator",
				{ style: { gridArea: CalendarViewComponent.GRID_AREA.WEEK_NUMBER } },
				styles.isDesktopLayout() ? calendarWeek(weekDaysComponentAttrs.selectedDate, weekDaysComponentAttrs.startOfWeek ?? WeekStart.MONDAY) : null,
			),
		]

		if (weekDaysComponentAttrs.showWeekDays) {
			children.push(
				m(
					"",
					{ style: { gridArea: CalendarViewComponent.GRID_AREA.WEEK_DAYS_SECTION } },
					m(WeekDaysComponent, { ...weekDaysComponentAttrs } satisfies WeekDaysComponentAttrs),
				),
			)
		}

		return m(
			".grid.py-core-8",
			{
				class: styles.isDesktopLayout() ? "content-bg" : "nav-bg",
				style: {
					gridColumn: "1/-1",
					gridTemplateColumns: "subgrid",
				} satisfies Partial<CSSStyleDeclaration>,
				onmouseleave: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					if (this.eventDragHandler.isDragging) {
						this.cancelDrag()
					}
				},
			},
			children,
		)
	}

	private renderCalendarGridSection(attrs: CalendarViewComponentAttrs) {
		if (!attrs.headerComponentAttrs?.dates?.length) {
			console.warn("CalendarViewComponent: No dates provided")
			return null
		}

		const timeColumnWidth = styles.isDesktopLayout() ? size.calendar_hour_width : size.calendar_hour_width_mobile
		const datePosition = attrs.headerComponentAttrs.dates.findIndex((date) => isToday(date)) ?? -1
		const shouldRenderTimeIndicator = Boolean(datePosition !== -1 && this.layoutState.dayHeight && this.layoutState.pageViewWidth)

		return m(
			".grid.scroll.rel",
			{
				class: styles.isDesktopLayout() ? "border-top" : "",
				style: {
					gridColumn: "1/-1",
					gridTemplateColumns: "subgrid",
				} satisfies Partial<CSSStyleDeclaration>,
				oncreate: (vnode: VnodeDOM) => {
					const scrollToCurrentTime = attrs.headerComponentAttrs.dates.length === 1 && attrs.headerComponentAttrs.dates.some(isToday)
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
					".content-bg.border-radius-top-left-big",
					{
						style: { gridArea: CalendarViewComponent.GRID_AREA.TIME_COLUMN },
					},
					m(TimeColumn, {
						baseDate: attrs.headerComponentAttrs?.selectedDate,
						timeRange: this.viewConfig.timeRange,
						timeScale: this.viewConfig.timeScale,
						width: timeColumnWidth,
						onCellPressed: attrs.cellActionHandlers?.onCellPressed,
					} satisfies TimeColumnAttrs),
				),
				shouldRenderTimeIndicator
					? m(TimeIndicator, {
							position: {
								timeRange: this.viewConfig.timeRange,
								dayHeight: this.layoutState.dayHeight!,
								interval: getIntervalAsMinutes(this.viewConfig.timeScale),
								areaWidth: this.layoutState.pageViewWidth!,
								numberOfDatesInRange: attrs.headerComponentAttrs?.dates?.length ?? 1,
								datePosition,
								leftOffset: timeColumnWidth,
							},
						} satisfies TimeIndicatorAttrs)
					: null,
				m(
					".content-bg.border-radius-top-right-big",

					{
						style: { gridArea: CalendarViewComponent.GRID_AREA.CALENDAR_GRID },
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
								true,
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
								false,
							),
						},
						onChangePage: (next) => attrs.bodyComponentAttrs.onChangePage(next),
					}),
				),
			],
		)
	}

	private scrollToTime(
		time: number,
		positionOnScreen: Extract<ScrollLogicalPosition, "center" | "start">,
		behavior: Extract<ScrollBehavior, "instant" | "smooth">,
	) {
		const timeCell = document.getElementById(TimeColumn.getTimeCellId(time))
		timeCell?.scrollIntoView({ block: positionOnScreen, behavior })
	}

	private renderAllDaySection(attrs: CalendarViewComponentAttrs) {
		return m(
			".grid.overflow-hidden.rel.scrollbar-gutter-stable-or-fallback",
			{
				style: {
					gridColumn: "1/-1",
					gridTemplateColumns: "subgrid",
				} satisfies Partial<CSSStyleDeclaration>,
				onmousemove: this.handleMouseMove,
				onmouseup: this.handleMouseUp,
			},
			[
				m(
					"",
					{
						style: {
							gridArea: CalendarViewComponent.GRID_AREA.ALL_DAY_SECTION,
						} satisfies Partial<CSSStyleDeclaration>,
					},
					m(AllDaySection, {
						dates: attrs.bodyComponentAttrs.current.dates,
						allDayEventWrappers: attrs.bodyComponentAttrs.current.events.long,
						eventBubbleHandlers: {
							...attrs.eventBubbleHandlers,
							drag: this.createDragHandlers(true),
						},
					} satisfies AllDaySectionAttrs),
				),
			],
		)
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

	private renderEventGrid(
		timeRange: TimeRange,
		dates: Array<Date>,
		events: Array<EventWrapper>,
		cellActionHandlers: CalendarTimeGridAttributes["cellActionHandlers"],
		eventBubbleHandlers: EventBubbleInteractions,
		canReceiveFocus: boolean,
	) {
		return m(CalendarTimeGrid, {
			timeRange,
			timeScale: 1,
			dates,
			events,
			cellActionHandlers,
			eventBubbleHandlers: {
				...eventBubbleHandlers,
				drag: this.createDragHandlers(false),
			},
			canReceiveFocus,
		} satisfies CalendarTimeGridAttributes)
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
