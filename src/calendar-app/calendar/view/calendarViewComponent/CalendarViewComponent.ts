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
import { neverNull, ofClass } from "@tutao/tutanota-utils"
import { UserError } from "../../../../common/api/main/UserError"
import { showUserError } from "../../../../common/misc/ErrorHandlerImpl"
import { combineDateWithTime } from "../../../../common/calendar/date/CalendarUtils"

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
	onChangePage: (moveForward: boolean) => unknown
}

export interface CalendarViewComponentAttrs {
	headerComponentAttrs?: HeaderComponentAttrs
	bodyComponentAttrs: BodyComponentAttrs
	cellActionHandlers: TimeViewAttributes["cellActionHandlers"]
	eventBubbleHandlers: EventBubbleInteractions
	dragHandlerCallbacks: EventDragHandlerCallbacks
}

export class CalendarViewComponent implements ClassComponent<CalendarViewComponentAttrs> {
	private timeRowHeight = 0

	private eventDragHandler: EventDragHandler
	private dateUnderMouse: Date | null = null
	private lastMousePos: MousePos | null = null

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
		const renderHeader = () => {
			const children: Children = []

			if (attrs.headerComponentAttrs) {
				children.push(
					m(
						".b.text-center.calendar-day-indicator",
						{ style: { gridArea: "weekNumber" } },
						styles.isDesktopLayout()
							? calendarWeek(attrs.headerComponentAttrs.selectedDate, attrs.headerComponentAttrs.startOfWeek ?? WeekStart.MONDAY)
							: null,
					),
				)

				if (attrs.headerComponentAttrs.showWeekDays) {
					children.push(
						m("", { style: { gridArea: "header" } }, m(HeaderComponent, { ...attrs.headerComponentAttrs } satisfies HeaderComponentAttrs)),
					)
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

		const renderBody = () => {
			const timeScale: TimeScale = 1 // FIXME add support to smooth/continuous zoom,
			const timeRange = {
				start: new Time(0, 0),
				end: new Time(23, 0),
			}
			const subRowAsMinutes = getSubRowAsMinutes(timeScale)

			return m(
				".grid.overflow-x-hidden.rel",
				{
					class: styles.isDesktopLayout() ? "border-top" : "",
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
							timeRange,
							timeScale,
							width: styles.isDesktopLayout() ? size.calendar_hour_width : size.calendar_hour_width_mobile,
							onCellPressed: attrs.cellActionHandlers?.onCellPressed,
						} satisfies TimeColumnAttrs),
					),
					this.renderCurrentTimeIndicator(Time.fromDate(new Date()), timeRange, subRowAsMinutes, this.timeRowHeight),
					m(
						".content-bg.border-radius-top-right-big",
						{ style: { gridArea: "calendarGrid" } },
						m(PageView, {
							classes: "height-100p",
							previousPage: {
								key: attrs.bodyComponentAttrs.previous.key,
								nodes: this.renderEventGrid(
									timeRange,
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
									timeRange,
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
									timeRange,
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

		const renderAllDaySection = () => {
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

		const resolveClasses = (): string => {
			const classes = styles.isDesktopLayout() ? ["content-bg", "mr-l", "border-radius-big"] : ["mlr-safe-inset"]
			return classes.join(" ")
		}

		return m(
			".grid.height-100p.overflow-hidden",
			{
				class: resolveClasses(),
				style: {
					gridTemplateAreas: `'weekNumber 	header'
										'empty 			allDayGrid'
										'timeColumn 	calendarGrid'`,
					gridTemplateRows: "auto auto 1fr",
					gridTemplateColumns: "auto 1fr",
				} satisfies Partial<CSSStyleDeclaration>,
			},
			[renderHeader(), renderAllDaySection(), renderBody()],
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
		const startTimeSpan = timeRange.start.diff(time)
		const start = Math.floor(startTimeSpan / subRowAsMinutes)

		return m(".time-indicator.z3", {
			style: {
				top: px((timeRowHeight ?? 0) * start),
				display: timeRowHeight == null ? "none" : "initial",
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
