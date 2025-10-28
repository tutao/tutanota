import m, { Child, ChildArray, Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { Time } from "../date/Time"
import { deepMemoized, downcast, getStartOfDay, getStartOfNextDay, noOp } from "@tutao/tutanota-utils"
import { px } from "../../gui/size.js"
import { getTimeFromClickInteraction, getTimeZone } from "../date/CalendarUtils"
import { TimeColumn } from "./TimeColumn"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { DateTime } from "luxon"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import {
	CalendarEventBubble,
	CalendarEventBubbleAttrs,
	CalendarEventBubbleDragProperties,
	EventBubbleInteractions,
	MIN_ROW_SPAN,
} from "../../../calendar-app/calendar/view/CalendarEventBubble"
import { getTimeFromMousePos } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"
import { getPosAndBoundsFromMouseEvent } from "../../gui/base/GuiUtils"

export const TIME_SCALE_BASE_VALUE = 60
export type TimeScale = 1 | 2 | 4
export type TimeScaleTuple = [TimeScale, number]
export type TimeRange = {
	start: Time
	end: Time
}
export const SUBROWS_PER_INTERVAL = 12
export const DEFAULT_EVENT_COLUMN_SPAN_SIZE = 1

export interface TimeViewAttributes {
	dates: Array<Date>
	events: Array<EventWrapper>
	timeScale: TimeScale
	timeRange: TimeRange
	timeRowHeight: number
	setTimeRowHeight: (timeRowHeight: number) => void
	hasAnyConflict?: boolean
	cellActionHandlers?: Pick<CellAttrs, "onCellPressed" | "onCellContextMenuPressed">
	eventBubbleHandlers?: EventBubbleInteractions & CalendarEventBubbleDragProperties
	canReceiveFocus: boolean
}

/**
 * Represents the vertical position of an event in the CSS grid.
 * Uses 1-based indexing for CSS Grid compatibility.
 */
export interface RowBounds {
	/** Starting row (1-based index) */
	start: number
	/** Ending row (1-based index, -1 indicates extends beyond grid) */
	end: number
}

/**
 * Represents the horizontal position and width of an event in the CSS grid.
 * Uses 1-based indexing for CSS Grid compatibility.
 */
export interface ColumnBounds {
	/** Starting column (1-based index for CSS Grid) */
	start: number
	/** Number of columns the event spans */
	span: number
}

/**
 * Grid positioning data for a single event.
 */
export interface GridEventData {
	/** Vertical position (row range) */
	row: RowBounds
	/** Horizontal position and width */
	column: ColumnBounds
}

/**
 * Internal data structure tracking events within a single column.
 * Used during the column-packing phase of the layout algorithm.
 */
export interface ColumnData {
	/**
	 * The row index where the last event in this column ends.
	 * Used for quick availability checks when placing new events.
	 */
	lastEventEndingRow: number

	/**
	 * Map of event IDs to their row bounds within this column.
	 * Maintains insertion order for deterministic layout.
	 */
	events: Map<Id, RowBounds>
}

export type CellActionHandler = (baseDate: Date, time: Time) => unknown

interface CellAttrs {
	baseDate: Date
	time: Time
	rowBounds: RowBounds
	onCellPressed?: CellActionHandler
	onCellContextMenuPressed?: CellActionHandler
}

export const getSubRowAsMinutes = deepMemoized((timeScale: TimeScale) => {
	return TIME_SCALE_BASE_VALUE / timeScale / SUBROWS_PER_INTERVAL
})

/**
 * TimeView Component
 *
 * Renders a calendar day/week view with events positioned
 * on a time-based CSS Grid. Handles event layout, overlap resolution, and time-based
 * positioning.
 *
 * **Grid System:**
 * - Rows: Time is subdivided into subrows (12 per interval {@link SUBROWS_PER_INTERVAL}) for precise positioning
 * - Columns: one top-level column per date. Inside each date column events are arranged into logical "inner" columns
 * to display overlapping events; These inner columns are used only for horizontal packing/expansion and do not create
 * extra top-level date columns.
 *
 * **Layout Algorithm (3 steps):**
 * 1. Convert event times to grid row coordinates
 * 2. Pack overlapping events into separate columns (greedy first-fit)
 * 3. Expand events horizontally to fill available space
 *
 * @example
 * ```typescript
 * m(TimeView, {
 *   dates: [new Date(), tomorrowDate],
 *   events: eventWrappers,
 *   timeScale: 2,  // 30-minute intervals
 *   timeRange: { start: Time.fromString("00:00"), end: Time.fromString("23:00") },
 *   timeIndicator: Time.now()
 * })
 * ```
 */
export class TimeView implements ClassComponent<TimeViewAttributes> {
	private parentHeight?: number
	private columnCount: Map<number, number> = new Map()

	view({ attrs }: Vnode<TimeViewAttributes>) {
		const timeColumnIntervals = TimeColumn.createTimeColumnIntervals(attrs.timeScale, attrs.timeRange)
		const subRowCount = SUBROWS_PER_INTERVAL * timeColumnIntervals.length

		return m(
			".grid.overflow-hidden.height-100p",
			{
				style: {
					"overflow-x": "hidden",
					"grid-template-columns": `repeat(${attrs.dates.length}, 1fr)`,
					transition: `opacity ${DefaultAnimationTime}ms linear`,
					opacity: this.parentHeight == null ? 0 : 1,
				},
				oninit: (vnode: VnodeDOM) => {
					if (this.parentHeight == null) {
						window.requestAnimationFrame(() => {
							const domHeight = Number.parseFloat(window.getComputedStyle(vnode.dom).height.replace("px", ""))
							this.parentHeight = domHeight
							attrs.setTimeRowHeight(domHeight / subRowCount)
							m.redraw()
						})
					}
				},
			},
			attrs.dates.map((date) => this.renderDay(date, subRowCount, attrs)),
		)
	}

	private renderDay(date: Date, subRowCount: number, timeViewAttrs: TimeViewAttributes): Child {
		const { events: eventWrappers, timeScale, timeRange, cellActionHandlers, eventBubbleHandlers, canReceiveFocus } = timeViewAttrs
		const subRowAsMinutes = getSubRowAsMinutes(timeScale)
		const startOfTomorrow = getStartOfNextDay(date)
		const startOfDay = getStartOfDay(date)
		const eventsForThisDate = eventWrappers.filter(
			(eventWrapper) => eventWrapper.event.startTime.getTime() < startOfTomorrow.getTime() && eventWrapper.event.endTime.getTime() > startOfDay.getTime(),
		)

		return m(
			".grid.plr-unit.gap.z1.grid-auto-columns.rel.border-right.min-width-0",
			{
				style: {
					height: this.parentHeight ? px(this.parentHeight) : undefined,
				},
				oncreate(vnode): any {
					;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(${subRowCount}, 1fr)`
				},
				onmousemove: (mouseEvent: MouseEvent) => {
					downcast(mouseEvent).redraw = false
					const time = getTimeFromMousePos(getPosAndBoundsFromMouseEvent(mouseEvent), 4)
					eventBubbleHandlers?.drag?.setTimeUnderMouse(time, date)
				},
				// ontouchmove: (e: TouchEvent) => {
				// 	e.preventDefault()
				// 	const mouseEvent = transformTouchEvent(e)
				// 	if (mouseEvent) {
				// 		e.target?.dispatchEvent(mouseEvent)
				// 	}
				// },
			},
			[
				this.renderInteractableCells(date, timeScale, timeRange, cellActionHandlers?.onCellPressed, cellActionHandlers?.onCellContextMenuPressed),
				this.renderEventsAtDate(eventsForThisDate, timeRange, subRowAsMinutes, timeScale, date, canReceiveFocus, eventBubbleHandlers),
			],
		)
	}

	/**
	 * Renders a column of events using grids for a given base date.
	 * This function is deepMemoized to prevent unnecessary layout calculation
	 *
	 * @param eventsForThisDate - Array of events to render in this column
	 * @param timeRange - Visible time range for the day (e.g., 00:00 AM to 23:00 PM)
	 * @param subRowAsMinutes - Minutes represented by each grid subrow
	 * @param timeScale - Time scale factor for interval subdivision (1, 2, or 4)
	 * @param baseDate - The date for this column
	 * @returns Child nodes representing the rendered events
	 *
	 * @private
	 */
	private renderEventsAtDate = deepMemoized(
		(
			eventsForThisDate: Array<EventWrapper>,
			timeRange: TimeRange,
			subRowAsMinutes: number,
			timeScale: TimeScale,
			baseDate: Date,
			canReceiveFocus: boolean,
			eventInteractions?: EventBubbleInteractions & CalendarEventBubbleDragProperties,
		): Children => {
			const interval = TIME_SCALE_BASE_VALUE / timeScale
			const timeRangeAsDate = {
				start: timeRange.start.toDate(baseDate),
				end: timeRange.end.toDateTime(baseDate, getTimeZone()).plus({ minute: interval }).toJSDate(),
			}

			// Sort events for optimal lay outing
			// Primary: earlier start times first
			// Secondary: longer duration first (helps minimize columns)
			const orderedEvents = eventsForThisDate.toSorted((a, b) => {
				const startTimeDiff = a.event.startTime.getTime() - b.event.startTime.getTime()
				if (startTimeDiff !== 0) {
					return startTimeDiff
				}
				// Longer events first (end time descending)
				return b.event.endTime.getTime() - a.event.endTime.getTime()
			})

			const { grid, gridColumnSize } = TimeView.layoutEvents(orderedEvents, timeRange, subRowAsMinutes, timeScale, baseDate)
			this.columnCount.set(baseDate.getTime(), gridColumnSize)

			return orderedEvents.flatMap((eventWrapper) => {
				const passesThroughToday =
					eventWrapper.event.startTime.getTime() < timeRangeAsDate.start.getTime() &&
					eventWrapper.event.endTime.getTime() > timeRangeAsDate.end.getTime()
				const startsToday =
					eventWrapper.event.startTime.getTime() >= timeRangeAsDate.start.getTime() &&
					eventWrapper.event.startTime.getTime() <= timeRangeAsDate.end.getTime()
				const endsToday =
					eventWrapper.event.endTime.getTime() >= timeRangeAsDate.start.getTime() &&
					eventWrapper.event.endTime.getTime() <= timeRangeAsDate.end.getTime()

				if (!(passesThroughToday || startsToday || endsToday)) {
					return []
				}

				const evData = grid.get(elementIdPart(eventWrapper.event._id))
				if (!evData) {
					return []
				}

				return [
					m(CalendarEventBubble, {
						interactions: eventInteractions,
						gridInfo: evData,
						eventWrapper,
						rangeOverflowInfo: {
							start: eventWrapper.event.startTime > timeRangeAsDate.start,
							end: eventWrapper.event.endTime > timeRangeAsDate.end,
						},
						baseDate,
						canReceiveFocus,
					} satisfies CalendarEventBubbleAttrs),
				]
			}) as ChildArray
		},
	)

	/**
	 * Layout Strategy:
	 * 1. Sort events by start time (earlier first), then by duration (longer first)
	 * 2. Pack events into columns using a greedy first-fit strategy
	 * 3. Expand events horizontally to fill available space
	 *
	 * @param events - Array of event wrappers to layout
	 * @param timeRange - Visible time range for the calendar view
	 * @param subRowAsMinutes - Granularity of grid rows in minutes
	 * @param timeScale - Time scale divisor for hour subdivision
	 * @param baseDate - Reference date for the calendar view
	 * @returns Map of event IDs to their grid positioning data
	 */
	static layoutEvents(events: Array<EventWrapper>, timeRange: TimeRange, subRowAsMinutes: number, timeScale: TimeScale, baseDate: Date) {
		// Step 1: Convert events to row-based coordinates
		const eventsMap = new Map<Id, RowBounds>(
			events.map((wrapper) => {
				const rowBounds = TimeView.getRowBounds(wrapper.event, timeRange, subRowAsMinutes, timeScale, baseDate)
				return [elementIdPart(wrapper.event._id), rowBounds]
			}),
		)

		// Step 2: Pack events into columns using first-fit strategy
		const columns = TimeView.packEventsIntoColumns(eventsMap)

		// Step 3: Expand events to fill available horizontal space
		return { grid: TimeView.buildGridDataWithExpansion(columns), gridColumnSize: columns.length }
	}

	/**
	 * Packs events into columns using a greedy first-fit algorithm.
	 * Each event is placed in the first available column where it doesn't overlap.
	 *
	 * @param eventsMap - Map of event IDs to their row bounds
	 * @returns Array of columns with their contained events
	 */
	static packEventsIntoColumns(eventsMap: Map<Id, RowBounds>): Array<ColumnData> {
		const columns: Array<ColumnData> = []

		for (const [eventId, rowBounds] of eventsMap.entries()) {
			const availableColumnIndex = columns.findIndex((col) => col.lastEventEndingRow <= rowBounds.start)

			if (availableColumnIndex === -1) {
				columns.push({
					lastEventEndingRow: rowBounds.end,
					events: new Map([[eventId, rowBounds]]),
				})
			} else {
				const column = columns[availableColumnIndex]
				column.lastEventEndingRow = rowBounds.end
				column.events.set(eventId, rowBounds)
			}
		}

		return columns
	}

	/**
	 * Builds the final grid data with column span calculations.
	 * Events are expanded horizontally to fill space until blocked by another event or reach the last column.
	 *
	 * @param columns - Array of columns with packed events
	 * @returns Map of event IDs to complete grid positioning data
	 */
	static buildGridDataWithExpansion(columns: Array<ColumnData>): Map<Id, GridEventData> {
		const gridData = new Map<Id, GridEventData>()

		for (const [columnIndex, columnData] of columns.entries()) {
			for (const [eventId, rowBounds] of columnData.events.entries()) {
				const columnSpan = TimeView.calculateColumnSpan(columnIndex, rowBounds, columns)

				const eventGridData: GridEventData = {
					row: rowBounds,
					column: {
						start: columnIndex + 1, // 1-based for CSS Grid
						span: columnSpan,
					},
				}

				gridData.set(eventId, eventGridData)
			}
		}

		return gridData
	}

	/**
	 * Calculates how many columns an event can span without overlapping other events.
	 *
	 * An event can expand into adjacent columns if no events in those columns
	 * overlap with the current event's time range.
	 *
	 * Overlap Check: Two events overlap if:
	 *   event1.start < event2.end AND event1.end > event2.start
	 *
	 * @param eventColumnIndex - The column index where the event is placed
	 * @param eventRowBounds - The row bounds of the event
	 * @param allColumns - All columns in the layout
	 * @returns Number of columns the event can span (minimum 1)
	 */
	static calculateColumnSpan(eventColumnIndex: number, eventRowBounds: RowBounds, allColumns: Array<ColumnData>): number {
		let span = DEFAULT_EVENT_COLUMN_SPAN_SIZE

		// Check each subsequent column for blocking events
		for (let colIndex = eventColumnIndex + 1; colIndex < allColumns.length; colIndex++) {
			const columnEvents = Array.from(allColumns[colIndex].events.values())
			const hasOverlap = columnEvents.some((otherEvent) => otherEvent.start < eventRowBounds.end && otherEvent.end > eventRowBounds.start)
			if (hasOverlap) {
				break
			}
			span++
		}

		return span
	}

	/**
	 * Calculates the row start and row end inside the grid for a given eventTimeRange
	 * @param eventTimeRange Event to have its bounds calculated
	 * @param timeRange Time range for the day, usually from 00:00 till 23:00
	 * @param subRowAsMinutes How many minutes a Grid row represents
	 * @param timeScale {TimeScale} How subdivided an hour should be
	 * @param baseDate Date when the eventTimeRange will be rendered, it can be different from the eventTimeRange start/end depending on
	 * how many hours it expands
	 * @private
	 *
	 * @returns RowBounds
	 */
	static getRowBounds(
		eventTimeRange: { startTime: Date; endTime: Date },
		timeRange: TimeRange,
		subRowAsMinutes: number,
		timeScale: TimeScale,
		baseDate: Date,
	): RowBounds {
		const interval = TIME_SCALE_BASE_VALUE / timeScale
		const diffFromRangeStartToEventStart = Math.abs(timeRange.start.asMinutes() - Time.fromDate(eventTimeRange.startTime).asMinutes())
		const eventStartsBeforeRange = eventTimeRange.startTime < baseDate || Time.fromDate(eventTimeRange.startTime).isBefore(timeRange.start)
		const start = eventStartsBeforeRange ? 1 : Math.floor(diffFromRangeStartToEventStart / subRowAsMinutes) + 1

		const dateParts = {
			year: baseDate.getFullYear(),
			month: baseDate.getMonth() + 1,
			day: baseDate.getDate(),
			hour: timeRange.end.hour,
			minute: timeRange.end.minute,
		}

		const diff = DateTime.fromJSDate(eventTimeRange.endTime).diff(DateTime.fromObject(dateParts).plus({ minutes: interval }), "minutes").minutes

		const diffFromRangeStartToEventEnd = timeRange.start.diff(Time.fromDate(eventTimeRange.endTime))
		const eventEndsAfterRange = eventTimeRange.endTime > getStartOfNextDay(baseDate) || diff > 0
		let end = eventEndsAfterRange ? -1 : Math.ceil(diffFromRangeStartToEventEnd / subRowAsMinutes) + 1
		if (!eventEndsAfterRange) {
			end = Math.max(end, start + MIN_ROW_SPAN) // Assert events has at least row span of MIN_ROW_SPAN
		}
		return { start, end }
	}

	private renderInteractableCells(
		baseDate: Date,
		timeScale: TimeScale,
		timeRange: TimeRange,
		onCellPressed?: CellActionHandler,
		onCellContextMenuPressed?: CellActionHandler,
	): Children {
		let timeIntervalInMinutes = TIME_SCALE_BASE_VALUE / timeScale
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeIntervalInMinutes) / timeIntervalInMinutes

		const children: Children = []
		for (let hourIndex = 0; hourIndex < numberOfIntervals; hourIndex++) {
			const startTime: Time = Time.fromMinutes(hourIndex * timeIntervalInMinutes)
			const rowStart = hourIndex * SUBROWS_PER_INTERVAL + 1
			const rowEnd = rowStart + SUBROWS_PER_INTERVAL

			children.push(
				this.renderCell({
					baseDate,
					time: startTime,
					rowBounds: {
						start: rowStart,
						end: rowEnd,
					},
					onCellPressed,
					onCellContextMenuPressed,
				}),
			)
		}

		return children
	}

	private renderCell(cellAttrs: CellAttrs): Child {
		const showHoverEffect = cellAttrs.onCellPressed || cellAttrs.onCellContextMenuPressed
		const classes = showHoverEffect ? "interactable-cell cursor-pointer after-as-border-bottom" : ""

		return m(".z1", {
			class: classes,
			style: {
				gridRow: `${cellAttrs.rowBounds.start} / ${cellAttrs.rowBounds.end}`,
				gridColumn: `1 / span ${this.columnCount.get(cellAttrs.baseDate.getTime()) ?? 1}`,
			} satisfies Partial<CSSStyleDeclaration>,
			onclick: cellAttrs.onCellPressed
				? (e: MouseEvent) => {
						e.stopImmediatePropagation()
						const eventBaseTime = getTimeFromClickInteraction(e, cellAttrs.time)
						cellAttrs.onCellPressed?.(cellAttrs.baseDate, eventBaseTime)
					}
				: noOp,
			oncontextmenu: cellAttrs.onCellContextMenuPressed
				? (e: MouseEvent) => {
						e.preventDefault()
						const eventBaseTime = getTimeFromClickInteraction(e, cellAttrs.time)
						cellAttrs.onCellContextMenuPressed?.(cellAttrs.baseDate, eventBaseTime)
					}
				: null,
		})
	}
}
