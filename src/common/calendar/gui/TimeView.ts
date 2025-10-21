import m, { ChildArray, Children, Component, Vnode, VnodeDOM } from "mithril"
import { Time } from "../date/Time"
import { deepMemoized, getStartOfDay, getStartOfNextDay, mapNullable } from "@tutao/tutanota-utils"
import { px, size } from "../../gui/size.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { colorForBg } from "../../gui/base/GuiUtils.js"
import { getTimeTextFormatForLongEvent, getTimeZone, hasAlarmsForTheUser, isBirthdayCalendar } from "../date/CalendarUtils"
import { TimeColumn } from "./TimeColumn"
import { elementIdPart, listIdPart } from "../../api/common/utils/EntityUtils"
import { DateTime } from "luxon"
import { CalendarEventBubble } from "../../../calendar-app/calendar/view/CalendarEventBubble"
import { formatEventTime } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"
import { locator } from "../../api/main/CommonLocator"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel"

export const TIME_SCALE_BASE_VALUE = 60
export type TimeScale = 1 | 2 | 4
export type TimeScaleTuple = [TimeScale, number]
export type TimeRange = {
	start: Time
	end: Time
}

export enum EventConflictRenderPolicy {
	OVERLAP,
	PARALLEL,
}

export interface TimeViewAttributes {
	dates: Array<Date>
	events: Array<EventWrapper>
	timeScale: TimeScale
	timeRange: TimeRange
	conflictRenderPolicy: EventConflictRenderPolicy
	timeIndicator?: Time
	hasAnyConflict?: boolean
	hoverEffect?: boolean
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

const SUBROWS_PER_INTERVAL = 12

export class TimeView implements Component<TimeViewAttributes> {
	private timeRowHeight?: number
	private parentHeight?: number
	private columnCount: number = 0

	view({ attrs }: Vnode<TimeViewAttributes>) {
		const { timeScale, timeRange, events, conflictRenderPolicy, dates, timeIndicator, hasAnyConflict } = attrs
		const timeColumnIntervals = TimeColumn.createTimeColumnIntervals(attrs.timeScale, attrs.timeRange)
		const subRowCount = SUBROWS_PER_INTERVAL * timeColumnIntervals.length
		const subRowAsMinutes = TIME_SCALE_BASE_VALUE / timeScale / SUBROWS_PER_INTERVAL

		return m(
			".grid.overflow-hidden.height-100p",
			{
				style: {
					"overflow-x": "hidden",
					"grid-template-columns": `repeat(${dates.length}, 1fr)`,
				},
				oninit: (vnode: VnodeDOM) => {
					if (this.timeRowHeight == null) {
						window.requestAnimationFrame(() => {
							const domHeight = Number.parseFloat(window.getComputedStyle(vnode.dom).height.replace("px", ""))
							this.timeRowHeight = domHeight / subRowCount
							this.parentHeight = domHeight
							m.redraw()
						})
					}
				},
			},
			[
				this.buildTimeIndicator(timeRange, subRowAsMinutes, timeIndicator),
				dates.map((date) => {
					const startOfTomorrow = getStartOfNextDay(date)
					const startOfDay = getStartOfDay(date)
					const eventsForThisDate = events.filter(
						(eventWrapper) =>
							eventWrapper.event.startTime.getTime() < startOfTomorrow.getTime() && eventWrapper.event.endTime.getTime() > startOfDay.getTime(),
					)

					return m(
						".grid.plr-unit.gap.z1.grid-auto-columns.rel.border-right",
						{
							style: {
								height: this.parentHeight ? px(this.parentHeight) : undefined,
							},
							oncreate(vnode): any {
								;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(${subRowCount}, 1fr)`
							},
						},
						[
							// this.renderCells(timeScale, timeRange),
							this.renderEventsAtDate(eventsForThisDate, timeRange, subRowAsMinutes, timeScale, date),
						],
					)
				}),
			],
		)
	}

	/**
	 * Renders a TimeIndicator line in the screen over the event grid
	 * @param timeRange Time range for the day, usually from 00:00 till 23:00
	 * @param subRowAsMinutes How many minutes a Grid row represents
	 * @param time Time where to position the indicator
	 * @private
	 */
	private buildTimeIndicator(timeRange: TimeRange, subRowAsMinutes: number, time?: Time): Children {
		if (!time) {
			return null
		}

		const startTimeSpan = timeRange.start.diff(time)
		const start = Math.floor(startTimeSpan / subRowAsMinutes)

		return m(".time-indicator.z3", {
			style: {
				top: px((this.timeRowHeight ?? 0) * start),
				display: this.timeRowHeight == null ? "none" : "initial",
			},
		})
	}

	/**
	 * Renders a column of events using grids for a given base date.
	 * This function is deepMemoized to prevent unnecessary layout calculation
	 * @param eventsForThisDate Array of events to be rendered
	 * @param timeRange Time range for the day, usually from 00:00 till 23:00
	 * @param subRowAsMinutes How many minutes a Grid row represents
	 * @param baseDate Date where the events are being rendered
	 * @private
	 */
	private renderEventsAtDate = deepMemoized(
		(eventsForThisDate: Array<EventWrapper>, timeRange: TimeRange, subRowAsMinutes: number, timeScale: TimeScale, baseDate: Date): Children => {
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

			const gridData = TimeView.layoutEvents(orderedEvents, timeRange, subRowAsMinutes, timeScale, baseDate)

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

				const evData = gridData.get(elementIdPart(eventWrapper.event._id))
				if (!evData) {
					return []
				}
				const {
					row: { start, end },
					column: { span: spanSize, start: columnStart },
				}: GridEventData = evData

				return [
					m(
						".border-radius.text-ellipsis-multi-line.p-xsm.on-success-container-color.small",
						{
							style: {
								"min-height": px(0),
								"min-width": px(0),
								"grid-column": `${columnStart} / span ${spanSize}`,
								background: `#${eventWrapper.color}`,
								color: !eventWrapper.isFeatured ? colorForBg(`#${eventWrapper.color}`) : undefined,
								"grid-row": `${start} / ${end}`,
								"border-top-left-radius": eventWrapper.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-top-right-radius": eventWrapper.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-bottom-left-radius": eventWrapper.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								"border-bottom-right-radius": eventWrapper.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								border: eventWrapper.isFeatured
									? `1.5px dashed ${eventWrapper.isConflict ? theme.on_warning_container : theme.on_success_container}`
									: "none",
								"border-top": eventWrapper.event.startTime < timeRangeAsDate.start ? "none" : undefined,
								"border-bottom": eventWrapper.event.endTime > timeRangeAsDate.end ? "none" : undefined,
								"-webkit-line-clamp": 2,
							} satisfies Partial<CSSStyleDeclaration> & Record<string, any>,
						},
						eventWrapper.isFeatured
							? m(".flex.items-start", [
									m(Icon, {
										icon: eventWrapper.isConflict ? Icons.AlertCircle : Icons.Checkmark,
										container: "div",
										class: "mr-xxs",
										size: IconSize.Normal,
										style: {
											fill: eventWrapper.isConflict ? theme.on_warning_container : theme.on_success_container,
										},
									}),
									m(
										".break-word.b.text-ellipsis-multi-line.lh",
										{
											style: {
												"-webkit-line-clamp": 2,
												color: eventWrapper.isConflict ? theme.on_warning_container : theme.on_success_container,
											},
										},
										eventWrapper.event.summary,
									),
								])
							: // : m("span.selectable", `${eventWrapper.event.summary} ${eventWrapper.event._id.join("/")}`),
								m(CalendarEventBubble, {
									text: eventWrapper.event.summary,
									secondLineText: mapNullable(
										getTimeTextFormatForLongEvent(eventWrapper.event, baseDate, getStartOfNextDay(baseDate), getTimeZone()),
										(option) => formatEventTime(eventWrapper.event, option),
									),
									color: eventWrapper.color.replaceAll("#", ""),
									border: `2px dashed #${eventWrapper.color}`,
									click: (domEvent) => console.log("click"),
									keyDown: (domEvent) => console.log("keyDown", domEvent),
									height: (end - start) * (this.timeRowHeight ?? 1),
									hasAlarm: hasAlarmsForTheUser(locator.logins.getUserController().user, eventWrapper.event),
									isAltered: eventWrapper.event.recurrenceId != null,
									verticalPadding: size.calendar_day_event_padding,
									fadeIn: true,
									opacity: 1,
									enablePointerEvents: true,
									isBirthday: isBirthdayCalendar(listIdPart(eventWrapper.event._id)),
								}),
					),
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
		return TimeView.buildGridDataWithExpansion(columns)
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
		let span = 1

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
		const end = eventEndsAfterRange ? -1 : Math.ceil(diffFromRangeStartToEventEnd / subRowAsMinutes) + 1

		return { start, end }
	}

	private renderCells(timeScale: TimeScale, timeRange: TimeRange): Children {
		let timeIntervalInMinutes = TIME_SCALE_BASE_VALUE / timeScale
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeIntervalInMinutes) / timeIntervalInMinutes

		const children: Children = []
		for (let hourIndex = 0; hourIndex < numberOfIntervals; hourIndex++) {
			const rowBoundStart = hourIndex * SUBROWS_PER_INTERVAL + 1
			const rowBoundEnd = rowBoundStart + SUBROWS_PER_INTERVAL
			children.push(
				m(".z1.w-full", {
					style: {
						gridRow: `${rowBoundStart} / span ${SUBROWS_PER_INTERVAL}`,
						gridColumn: `1 / span ${this.columnCount}`,
						background: "red",
					},
					click: () => console.log("Cell click"),
				}),
			)
		}

		return children
	}
}
