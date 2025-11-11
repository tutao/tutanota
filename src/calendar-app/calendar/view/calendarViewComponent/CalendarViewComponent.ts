import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { styles } from "../../../../common/gui/styles"
import { WeekStart } from "../../../../common/api/common/TutanotaConstants"
import { calendarWeek, extractCalendarEventModifierKey } from "../../gui/CalendarGuiUtils"
import { HeaderComponent, HeaderComponentAttrs } from "./HeaderComponent"
import { TimeColumn, TimeColumnAttrs } from "../../../../common/calendar/gui/TimeColumn"
import { Time } from "../../../../common/calendar/date/Time"
import { px, size } from "../../../../common/gui/size"
import { PageView } from "../../../../common/gui/base/PageView"
import { getSubRowAsMinutes, TimeRange, TimeScale, TimeView, TimeViewAttributes } from "../../../../common/calendar/gui/TimeView"
import { EventWrapper } from "../CalendarViewModel"
import { AllDaySection, AllDaySectionAttrs } from "../../../../common/calendar/gui/AllDaySection"
import { EventBubbleInteractions } from "../CalendarEventBubble"
import { getPosAndBoundsFromMouseEvent } from "../../../../common/gui/base/GuiUtils"
import { EventDragHandler, type EventDragHandlerCallbacks, type MousePos } from "../EventDragHandler"
import { isToday, neverNull, ofClass } from "@tutao/tutanota-utils"
import { UserError } from "../../../../common/api/main/UserError"
import { showUserError } from "../../../../common/misc/ErrorHandlerImpl"
import { combineDateWithTime } from "../../../../common/calendar/date/CalendarUtils"
import { deviceConfig } from "../../../../common/misc/DeviceConfig"

interface PageAttrs {
	/**
	 * Period start timestamp
	 */
	key: number
	dates: Array<Date>
	events: {
		short: Array<EventWrapper>
		long: Array<EventWrapper>
	}
}

interface BodyComponentAttrs {
	previous: PageAttrs
	current: PageAttrs
	next: PageAttrs
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
}

export interface CalendarViewComponentAttrs {
	headerComponentAttrs?: HeaderComponentAttrs
	bodyComponentAttrs: BodyComponentAttrs
	cellActionHandlers: TimeViewAttributes["cellActionHandlers"]
	eventBubbleHandlers: EventBubbleInteractions
	dragHandlerCallbacks: EventDragHandlerCallbacks
}

export class CalendarViewComponent implements ClassComponent<CalendarViewComponentAttrs> {
	private eventDragHandler: EventDragHandler
	private dateUnderMouse: Date | null = null
	private lastMousePos: MousePos | null = null

	private timeScale: TimeScale = 1 // FIXME add support to smooth/continuous zoom,
	private timeRange = {
		start: new Time(0, 0),
		end: new Time(23, 0),
	}
	private subRowAsMinutes = getSubRowAsMinutes(this.timeScale)
	private timeRowHeight = 0

	constructor({ attrs }: Vnode<CalendarViewComponentAttrs>) {
		this.eventDragHandler = new EventDragHandler(neverNull(document.body as HTMLBodyElement), attrs.dragHandlerCallbacks)
	}

	oncreate(vnode: VnodeDOM<CalendarViewComponentAttrs>) {
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
				oncreate: (vnode) => {
					console.log("oncreate: CalendarView - on element")
				},
				style: {
					gridTemplateAreas: `'weekNumber 	header'
										'empty 			allDayGrid'
										'timeColumn 	calendarGrid'`,
					gridTemplateRows: "auto auto 1fr",
					gridTemplateColumns: "auto 1fr",
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[this.renderHeader(attrs.headerComponentAttrs), this.renderAllDaySection(attrs), this.renderBody(attrs)],
		)
	}

	renderHeader(headerComponentAttrs: HeaderComponentAttrs | undefined): Children {
		const children: Children = []

		if (headerComponentAttrs) {
			children.push(
				m(
					".b.text-center.calendar-day-indicator",
					{ style: { gridArea: "weekNumber" } },
					styles.isDesktopLayout() ? calendarWeek(headerComponentAttrs.selectedDate, headerComponentAttrs.startOfWeek ?? WeekStart.MONDAY) : null,
				),
			)

			if (headerComponentAttrs.showWeekDays) {
				children.push(m("", { style: { gridArea: "header" } }, m(HeaderComponent, { ...headerComponentAttrs } satisfies HeaderComponentAttrs)))
			}
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

	renderBody(attrs: CalendarViewComponentAttrs) {
		return m(
			".grid.scroll.rel",
			{
				class: styles.isDesktopLayout() ? "border-top" : "",
				style: {
					gridColumn: "1/-1",
					gridTemplateColumns: "subgrid",
				} satisfies Partial<CSSStyleDeclaration>,
				oncreate: (vnode: VnodeDOM<BodyComponentAttrs>) => {
					const scrollToCurrentTime = attrs.headerComponentAttrs?.dates?.length === 1 && attrs.headerComponentAttrs?.dates?.some(isToday)
					const time = scrollToCurrentTime ? new Date().getHours() : deviceConfig.getScrollTime()
					this.scrollToTime(time, scrollToCurrentTime ? "center" : "start", "instant")
				},
				onupdate: () => {
					if (attrs.bodyComponentAttrs.smoothScroll) {
						this.scrollToTime(new Date().getHours(), "center", "smooth")
					}
				},
				onmousemove: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					this.lastMousePos = getPosAndBoundsFromMouseEvent(mouseEvent)

					if (this.dateUnderMouse) {
						return this.eventDragHandler.handleDrag(this.dateUnderMouse, this.lastMousePos)
					}
				},
				onmouseup: (mouseEvent: EventRedraw<MouseEvent>) => {
					if (this.eventDragHandler.isDragging) {
						mouseEvent.preventDefault()
					}
					mouseEvent.redraw = false
					this.endDrag(mouseEvent)
				},

				// ontouchmove: (e: TouchEvent) => {
				// 	e.preventDefault()
				// 	const mouseEvent = transformTouchEvent(e)
				// 	if (mouseEvent) {
				// 		e.target?.dispatchEvent(mouseEvent)
				// 	}
				// },
				// ontouchend: (e: TouchEvent) => {
				// 	e.preventDefault()
				// 	const mouseEvent = transformTouchEvent(e)
				// 	if (mouseEvent) {
				// 		e.target?.dispatchEvent(mouseEvent)
				// 	}
				// },
				// ontouchcancel: (e: TouchEvent) => {
				// 	e.preventDefault()
				// 	const mouseEvent = transformTouchEvent(e)
				// 	if (mouseEvent) {
				// 		e.target?.dispatchEvent(mouseEvent)
				// 	}
				// },
			},
			[
				m(
					".content-bg.border-radius-top-left-big",
					{ style: { gridArea: "timeColumn" } },
					m(TimeColumn, {
						baseDate: attrs.headerComponentAttrs?.selectedDate,
						timeRange: this.timeRange,
						timeScale: this.timeScale,
						width: styles.isDesktopLayout() ? size.calendar_hour_width : size.calendar_hour_width_mobile,
						onCellPressed: attrs.cellActionHandlers?.onCellPressed,
					} satisfies TimeColumnAttrs),
				),
				this.renderCurrentTimeIndicator(Time.fromDate(new Date()), this.timeRange, this.subRowAsMinutes, this.timeRowHeight),
				m(
					".content-bg.border-radius-top-right-big",
					{ style: { gridArea: "calendarGrid" } },
					m(PageView, {
						classes: "height-100p",
						previousPage: {
							key: attrs.bodyComponentAttrs.previous.key,
							nodes: this.renderEventGrid(
								this.timeRange,
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
								this.timeRange,
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
								this.timeRange,
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
		const timeCell = document.getElementById(`time-cell-${time}`)
		timeCell?.scrollIntoView({ block: positionOnScreen, behavior })
	}

	renderAllDaySection(attrs: CalendarViewComponentAttrs) {
		return m(
			".grid.overflow-hidden.rel.scrollbar-gutter-stable-or-fallback",
			{
				style: {
					gridColumn: "1/-1",
					gridTemplateColumns: "subgrid",
				} satisfies Partial<CSSStyleDeclaration>,
				onmousemove: (mouseEvent: EventRedraw<MouseEvent>) => {
					mouseEvent.redraw = false
					this.lastMousePos = getPosAndBoundsFromMouseEvent(mouseEvent)

					if (this.dateUnderMouse) {
						return this.eventDragHandler.handleDrag(this.dateUnderMouse, this.lastMousePos)
					}
				},
				onmouseup: (mouseEvent: EventRedraw<MouseEvent>) => {
					if (this.eventDragHandler.isDragging) {
						mouseEvent.preventDefault()
					}
					mouseEvent.redraw = false
					this.endDrag(mouseEvent)
				},
			},
			[
				m(
					"",
					{
						style: {
							gridArea: "allDayGrid",
						} satisfies Partial<CSSStyleDeclaration>,
					},
					m(AllDaySection, {
						dates: attrs.bodyComponentAttrs.current.dates,
						allDayEventWrappers: attrs.bodyComponentAttrs.current.events.long,
						eventBubbleHandlers: {
							...attrs.eventBubbleHandlers,
							drag: {
								prepareCurrentDraggedEvent: (eventWrapper) => this.prepareEventDrag(eventWrapper, true),
								setTimeUnderMouse: (time, date: Date) => {
									const timeToCombine = this.dateUnderMouse ? Time.fromDate(this.dateUnderMouse) : time
									return (this.dateUnderMouse = combineDateWithTime(date, timeToCombine))
								},
							},
						},
					} satisfies AllDaySectionAttrs),
				),
			],
		)
	}

	/**
	 * Renders a TimeIndicator line in the screen over the event grid
	 * @param timeRange Time range for the day, usually from 00:00 till 23:00
	 * @param subRowAsMinutes How many minutes a Grid row represents
	 * @param time Time where to position the indicator
	 * @param timeRowHeight
	 * @private
	 */
	private renderCurrentTimeIndicator(time: Time, timeRange: TimeRange, subRowAsMinutes: number, timeRowHeight?: number): Children {
		const yPosition = this.getTimePosition(timeRange, time, subRowAsMinutes, timeRowHeight)
		return m(".time-indicator.z3", {
			style: {
				top: px(yPosition),
				visibility: timeRowHeight == null ? "hidden" : "initial",
				gridArea: "calendarGrid",
			} satisfies Partial<CSSStyleDeclaration>,
		})
	}

	private renderEventGrid(
		timeRange: TimeRange,
		dates: Array<Date>,
		events: Array<EventWrapper>,
		cellActionHandlers: TimeViewAttributes["cellActionHandlers"],
		eventBubbleHandlers: EventBubbleInteractions,
		canReceiveFocus: boolean,
	) {
		return m(TimeView, {
			timeRange,
			timeScale: 1,
			dates,
			events,
			cellActionHandlers,
			timeRowHeight: this.timeRowHeight,
			setTimeRowHeight: (timeViewHeight: number) => (this.timeRowHeight = timeViewHeight),
			eventBubbleHandlers: {
				...eventBubbleHandlers,
				drag: {
					prepareCurrentDraggedEvent: (eventWrapper) => this.prepareEventDrag(eventWrapper, false),
					setTimeUnderMouse: (time, date: Date) => (this.dateUnderMouse = combineDateWithTime(date, time)),
				},
			},
			canReceiveFocus,
		} satisfies TimeViewAttributes)
	}

	private getTimePosition(timeRange: TimeRange, time: Time, subRowAsMinutes: number, timeRowHeight: number | undefined) {
		const startTimeSpan = timeRange.start.diff(time)
		const start = Math.floor(startTimeSpan / subRowAsMinutes)
		return (timeRowHeight ?? 0) * start
	}

	private prepareEventDrag(eventWrapper: EventWrapper, keepTime: boolean) {
		const lastMousePos = this.lastMousePos

		if (this.dateUnderMouse && lastMousePos) {
			this.eventDragHandler.prepareDrag(eventWrapper, this.dateUnderMouse, lastMousePos, keepTime)
		}
	}

	private endDrag(pos: MousePos) {
		if (this.dateUnderMouse) {
			this.eventDragHandler.endDrag(this.dateUnderMouse, pos, this.eventDragHandler.pressedDragKey).catch(ofClass(UserError, showUserError))
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
