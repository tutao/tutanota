import m, { Child, ClassComponent, Vnode } from "mithril"
import { Time } from "../date/Time"
import { deepMemoized, getStartOfDay, getStartOfNextDay, lastIndex } from "@tutao/tutanota-utils"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { DateTime } from "luxon"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import { CalendarEventBubbleDragProperties, EventBubbleInteractions, MIN_ROW_SPAN } from "./CalendarEventBubble"
import { CellActionHandler } from "./CalendarTimeCell"
import { CalendarTimeColumn, CalendarTimeColumnAttrs } from "./CalendarTimeColumn"

export const TIME_SCALE_BASE_VALUE = 60
export type TimeScale = 1 | 2 | 4
export type TimeScaleTuple = [TimeScale, number]
export type TimeRange = {
	start: Time
	end: Time
}
export const SUBROWS_PER_INTERVAL = 12
export const DEFAULT_EVENT_COLUMN_SPAN_SIZE = 1

export interface CalendarTimeGridAttributes {
	dates: Array<Date>
	events: Array<EventWrapper>
	timeScale: TimeScale
	timeRange: TimeRange
	intervals: Array<Time>
	cellActionHandlers?: {
		onCellPressed: CellActionHandler
		onCellContextMenuPressed?: CellActionHandler
	}
	eventBubbleHandlers?: EventBubbleInteractions & CalendarEventBubbleDragProperties
	layout: {
		rowCountForRange: number
		gridRowHeight: number
	}
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
export interface EventGridData {
	/** Vertical position (row range) */
	row: RowBounds
	/** Horizontal position and width */
	column: ColumnBounds
}

/**
 * Internal data structure tracking events within a single column.
 * Used during the column-packing phase of the layout algorithm.
 */
export interface ColumnLayoutData {
	/**
	 * The row index where the last event in this column ends.
	 * Used to determine if the next event can fit.
	 */
	lastOccupiedRow: number

	/**
	 * Map of event IDs to their row bounds within this column.
	 * Maintains insertion order for deterministic layout.
	 */
	events: Map<Id, RowBounds>
}

export type CalendarTimeColumnData = {
	grid: Map<Id, EventGridData>
	subColumnCount: number
	orderedEvents: Array<EventWrapper>
}

export const getSubRowAsMinutes = deepMemoized((timeScale: TimeScale) => {
	return getIntervalAsMinutes(timeScale) / SUBROWS_PER_INTERVAL
})

export const getIntervalAsMinutes = (timeScale: TimeScale) => {
	return TIME_SCALE_BASE_VALUE / timeScale
}

/**
 * CalendarTimeGrid Component
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
 * m(CalendarTimeGrid, {
 *   dates: [new Date(), tomorrowDate],
 *   events: eventWrappers,
 *   timeScale: 2,  // 30-minute intervals
 *   timeRange: { start: Time.fromString("00:00"), end: Time.fromString("23:00") },
 *   timeIndicator: Time.now()
 * })
 * ```
 */
export class CalendarTimeGrid implements ClassComponent<CalendarTimeGridAttributes> {
	view({ attrs }: Vnode<CalendarTimeGridAttributes>) {
		return m(
			".grid.overflow-hidden.height-100p",
			{
				style: {
					"grid-template-columns": `repeat(${attrs.dates.length}, 1fr)`,
					transition: `opacity ${DefaultAnimationTime}ms linear`,
				},
			},
			attrs.dates.map((date, index) => this.renderDayColumn(date, attrs, index === lastIndex(attrs.dates))),
		)
	}

	/**
	 * Renders a column of events using grids for a given base date.
	 * This function is deepMemoized to prevent unnecessary layout calculation
	 *
	 * @param baseDate - The date for this column
	 * @param timeViewAttrs
	 * @param hideRightBorder
	 * @returns Child nodes representing the rendered events
	 *
	 * @private
	 */
	private renderDayColumn(baseDate: Date, timeViewAttrs: CalendarTimeGridAttributes, hideRightBorder: boolean): Child {
		const {
			events: eventWrappers,
			timeScale,
			timeRange,
			cellActionHandlers,
			eventBubbleHandlers,
			layout: { rowCountForRange, gridRowHeight },
		} = timeViewAttrs
		const subRowAsMinutes = getSubRowAsMinutes(timeScale)
		const startOfTomorrow = getStartOfNextDay(baseDate)
		const startOfDay = getStartOfDay(baseDate)
		const eventsForThisDate = eventWrappers.filter(
			(eventWrapper) => eventWrapper.event.startTime.getTime() < startOfTomorrow.getTime() && eventWrapper.event.endTime.getTime() > startOfDay.getTime(),
		)

		return m(CalendarTimeColumn, {
			intervals: timeViewAttrs.intervals, // containing the start time of each interval
			baseDate: baseDate,
			onCellPressed: cellActionHandlers?.onCellPressed,
			onCellContextMenuPressed: cellActionHandlers?.onCellContextMenuPressed,
			eventInteractions: eventBubbleHandlers,
			timeColumnGrid: this.memoizedLayoutEvents(eventsForThisDate, timeRange, subRowAsMinutes, timeScale, baseDate),
			layout: {
				rowCount: rowCountForRange,
				hideRightBorder,
				gridRowHeight,
			},
		} as CalendarTimeColumnAttrs)
	}

	private memoizedLayoutEvents = deepMemoized(CalendarTimeGrid.layoutEvents)

	/**
	 * Layout Strategy:
	 * 1. Convert events to row-based coordinates
	 * 2. Pack events into columns using a greedy first-fit strategy
	 * 3. Expand events horizontally to fill available space
	 *
	 * **Important:** Relies on events being previously ordered for better results
	 *
	 * @param events - Array of event wrappers to layout
	 * @param timeRange - Visible time range for the calendar view
	 * @param subRowAsMinutes - Granularity of grid rows in minutes
	 * @param timeScale - Time scale divisor for hour subdivision
	 * @param baseDate - Reference date for the calendar view
	 * @returns Map of event IDs to their grid positioning data
	 *
	 * @VisibleForTesting
	 */
	static layoutEvents(
		events: Array<EventWrapper>,
		timeRange: TimeRange,
		subRowAsMinutes: number,
		timeScale: TimeScale,
		baseDate: Date,
	): CalendarTimeColumnData {
		// Sort events for optimal lay outing
		// Primary: earlier start times first
		// Secondary: longer duration first (helps minimize columns)
		const orderedEvents = events.toSorted((a, b) => {
			const startTimeDiff = a.event.startTime.getTime() - b.event.startTime.getTime()
			if (startTimeDiff !== 0) {
				return startTimeDiff
			}
			// Longer events first (end time descending)
			return b.event.endTime.getTime() - a.event.endTime.getTime()
		})

		// Step 1: Convert events to row-based coordinates
		const eventsMap = new Map<Id, RowBounds>(
			orderedEvents.map((wrapper) => {
				const rowBounds = CalendarTimeGrid.getRowBounds(wrapper.event, timeRange, subRowAsMinutes, timeScale, baseDate)
				return [elementIdPart(wrapper.event._id), rowBounds]
			}),
		)

		// Step 2: Pack events into columns using first-fit strategy
		const columns = CalendarTimeGrid.packEventsIntoColumns(eventsMap)

		// Step 3: Expand events to fill available horizontal space
		return {
			grid: CalendarTimeGrid.buildGridDataWithExpansion(columns),
			subColumnCount: columns.length,
			orderedEvents,
		}
	}

	/**
	 * Packs events into columns using a greedy first-fit algorithm.
	 * Each event is placed in the first available column where it doesn't overlap.
	 *
	 * **Important:** Relies on events being previously ordered for better results
	 *
	 * @param eventsMap - Map of event IDs to their row bounds
	 * @returns Array of columns with their contained events
	 *
	 * @VisibleForTesting
	 */
	static packEventsIntoColumns(eventsMap: Map<Id, RowBounds>): Array<ColumnLayoutData> {
		const columns: Array<ColumnLayoutData> = []

		for (const [eventId, rowBounds] of eventsMap.entries()) {
			const availableColumnIndex = columns.findIndex((col) => col.lastOccupiedRow !== -1 && col.lastOccupiedRow <= rowBounds.start)

			if (availableColumnIndex === -1) {
				columns.push({
					lastOccupiedRow: rowBounds.end,
					events: new Map([[eventId, rowBounds]]),
				})
			} else {
				const column = columns[availableColumnIndex]
				column.lastOccupiedRow = rowBounds.end
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
	 *
	 * @VisibleForTesting
	 */
	static buildGridDataWithExpansion(columns: Array<ColumnLayoutData>): Map<Id, EventGridData> {
		const gridData = new Map<Id, EventGridData>()

		for (const [columnIndex, columnData] of columns.entries()) {
			for (const [eventId, rowBounds] of columnData.events.entries()) {
				const columnSpan = CalendarTimeGrid.calculateColumnSpan(columnIndex, rowBounds, columns)

				const eventGridData: EventGridData = {
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
	 *
	 * @VisibleForTesting
	 */
	static calculateColumnSpan(eventColumnIndex: number, eventRowBounds: RowBounds, allColumns: Array<ColumnLayoutData>): number {
		let span = DEFAULT_EVENT_COLUMN_SPAN_SIZE

		// Check each subsequent column for blocking events
		for (let colIndex = eventColumnIndex + 1; colIndex < allColumns.length; colIndex++) {
			const columnEvents = Array.from(allColumns[colIndex].events.values())
			const eventOverflowsRange = eventRowBounds.end === -1
			const hasOverlap =
				(columnEvents.length && eventOverflowsRange) ||
				columnEvents.some((otherEvent) => otherEvent.start < eventRowBounds.end && otherEvent.end > eventRowBounds.start)
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
	 *
	 * @VisibleForTesting
	 */
	static getRowBounds(
		eventTimeRange: { startTime: Date; endTime: Date },
		timeRange: TimeRange,
		subRowAsMinutes: number,
		timeScale: TimeScale,
		baseDate: Date,
	): RowBounds {
		const interval = getIntervalAsMinutes(timeScale)
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
		const maxRows = (timeRange.end.asMinutes() + interval - timeRange.start.asMinutes()) / subRowAsMinutes + 1
		let end = eventEndsAfterRange ? maxRows : Math.ceil(diffFromRangeStartToEventEnd / subRowAsMinutes) + 1
		if (!eventEndsAfterRange) {
			end = Math.max(end, start + MIN_ROW_SPAN) // Assert events has at least row span of MIN_ROW_SPAN
		}
		return { start, end }
	}
}
