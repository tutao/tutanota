import m, { ChildArray, Children, Component, Vnode, VnodeDOM } from "mithril"
import { Time } from "../date/Time"
import { deepMemoized, getStartOfDay, getStartOfNextDay } from "@tutao/tutanota-utils"
import { px } from "../../gui/size.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { colorForBg } from "../../gui/base/GuiUtils.js"
import { getTimeZone } from "../date/CalendarUtils"
import { EventRenderWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { TimeColumn } from "./TimeColumn"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs"
import { DateTime } from "luxon"

export interface TimeViewEventWrapper {
	event: EventRenderWrapper
	conflictsWithMainEvent: boolean
	color: string
	featured: boolean
}

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
	events: Array<TimeViewEventWrapper>
	timeScale: TimeScale
	timeRange: TimeRange
	conflictRenderPolicy: EventConflictRenderPolicy
	timeIndicator?: Time
	hasAnyConflict?: boolean
}

export interface RowBounds {
	start: number
	end: number
}

export interface ColumnBounds {
	start: number
	span: number
}

export interface GridEventData {
	row: RowBounds
	column: ColumnBounds
}

interface ColumnData {
	lastEventEndingRow: number
	events: Map<Id, RowBounds>
}

interface BlockingInfo {
	canExpand: boolean
	blockingEvents: Map<Id, boolean>
}

const BASE_EVENT_BUBBLE_SPAN_SIZE = 1

export class TimeView implements Component<TimeViewAttributes> {
	private timeRowHeight?: number
	private parentHeight?: number

	private blockingGroupsCache: Map<Id, Array<Map<Id, boolean>>> = new Map()
	private expandabilityCache: Map<Id, BlockingInfo> = new Map()
	private eventIdToOriginalColumnArrayIndex: Map<Id, number> = new Map()

	view({ attrs }: Vnode<TimeViewAttributes>) {
		const { timeScale, timeRange, events, conflictRenderPolicy, dates, timeIndicator, hasAnyConflict } = attrs
		const timeColumnIntervals = TimeColumn.createTimeColumnIntervals(attrs.timeScale, attrs.timeRange)
		const subRowCount = 12 * timeColumnIntervals.length
		const subRowAsMinutes = TIME_SCALE_BASE_VALUE / timeScale / 12

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
						(event) =>
							event.event.event.startTime.getTime() < startOfTomorrow.getTime() && event.event.event.endTime.getTime() > startOfDay.getTime(),
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
						[this.renderEventsAtDate(eventsForThisDate, timeRange, subRowAsMinutes, timeScale, date)],
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
		(eventsForThisDate: Array<TimeViewEventWrapper>, timeRange: TimeRange, subRowAsMinutes: number, timeScale: TimeScale, baseDate: Date): Children => {
			const interval = TIME_SCALE_BASE_VALUE / timeScale
			const timeRangeAsDate = {
				start: timeRange.start.toDate(baseDate),
				end: timeRange.end.toDateTime(baseDate, getTimeZone()).plus({ minute: interval }).toJSDate(),
			}

			const orderedEvents = eventsForThisDate.toSorted((eventWrapperA, eventWrapperB) => {
				const startTimeComparison = eventWrapperA.event.event.startTime.getTime() - eventWrapperB.event.event.startTime.getTime()
				if (startTimeComparison === 0) {
					return eventWrapperB.event.event.endTime.getTime() - eventWrapperA.event.event.endTime.getTime()
				}

				return startTimeComparison
			})

			// Clear caches for fresh calculation
			this.blockingGroupsCache.clear()
			this.expandabilityCache.clear()

			const gridData = this.layoutEvents(orderedEvents, timeRange, subRowAsMinutes, timeScale, baseDate)

			return orderedEvents.flatMap((event) => {
				const passesThroughToday =
					event.event.event.startTime.getTime() < timeRangeAsDate.start.getTime() &&
					event.event.event.endTime.getTime() > timeRangeAsDate.end.getTime()
				const startsToday =
					event.event.event.startTime.getTime() >= timeRangeAsDate.start.getTime() &&
					event.event.event.startTime.getTime() <= timeRangeAsDate.end.getTime()
				const endsToday =
					event.event.event.endTime.getTime() >= timeRangeAsDate.start.getTime() &&
					event.event.event.endTime.getTime() <= timeRangeAsDate.end.getTime()

				if (!(passesThroughToday || startsToday || endsToday)) {
					return []
				}

				const evData = gridData.get(elementIdPart(event.event.event._id))
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
								background: event.color,
								color: !event.featured ? colorForBg(event.color) : undefined,
								"grid-row": `${start} / ${end}`,
								"border-top-left-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-top-right-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-bottom-left-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								"border-bottom-right-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								border: event.featured
									? `1.5px dashed ${event.conflictsWithMainEvent ? theme.on_warning_container : theme.on_success_container}`
									: "none",
								"border-top": event.event.event.startTime < timeRangeAsDate.start ? "none" : undefined,
								"border-bottom": event.event.event.endTime > timeRangeAsDate.end ? "none" : undefined,
								"-webkit-line-clamp": 2,
							} satisfies Partial<CSSStyleDeclaration> & Record<string, any>,
						},
						event.featured
							? m(".flex.items-start", [
									m(Icon, {
										icon: event.conflictsWithMainEvent ? Icons.AlertCircle : Icons.Checkmark,
										container: "div",
										class: "mr-xxs",
										size: IconSize.Normal,
										style: {
											fill: event.conflictsWithMainEvent ? theme.on_warning_container : theme.on_success_container,
										},
									}),
									m(
										".break-word.b.text-ellipsis-multi-line.lh",
										{
											style: {
												"-webkit-line-clamp": 2,
												color: event.conflictsWithMainEvent ? theme.on_warning_container : theme.on_success_container,
											},
										},
										event.event.event.summary,
									),
								])
							: m("span.selectable", `${event.event.event.summary} ${event.event.event._id.join("/")}`),
					),
				]
			}) as ChildArray
		},
	)

	/**
	 * Maps an array of events to a CSS Grid Position map
	 * @param events
	 * @param timeRange
	 * @param subRowAsMinutes
	 * @param timeScale
	 * @param baseDate
	 * @private
	 *
	 * @return Map<string, GridEventData>
	 */
	private layoutEvents(events: Array<TimeViewEventWrapper>, timeRange: TimeRange, subRowAsMinutes: number, timeScale: TimeScale, baseDate: Date) {
		// Convert to row-based events
		const eventsMap: Map<Id, RowBounds> = new Map(
			events.map((e) => {
				const evt = e.event.event
				return [elementIdPart(evt._id), this.getRowBounds(evt, timeRange, subRowAsMinutes, timeScale, baseDate)]
			}),
		)

		const columns: Array<ColumnData> = []

		for (const [eventId, rowBounds] of eventsMap.entries()) {
			let currentColumnIndex = columns.findIndex((col) => col.lastEventEndingRow <= rowBounds.start)

			if (currentColumnIndex === -1) {
				currentColumnIndex = columns.length
				columns.push({
					lastEventEndingRow: rowBounds.end,
					events: new Map([[eventId, rowBounds]]),
				})
			} else {
				columns[currentColumnIndex].lastEventEndingRow = rowBounds.end
				columns[currentColumnIndex].events.set(eventId, rowBounds)
			}
		}

		return this.buildGridData(columns)
	}

	/**
	 * Organize an array of columns in a Grid, setting rows, size and column start/end
	 * for each event inside the input columns.
	 * @param allColumns Events grouped by columns
	 * @private
	 *
	 * @return The calculated Grid for the events
	 */
	private buildGridData(allColumns: Array<ColumnData>): Map<Id, GridEventData> {
		const gridData = new Map<Id, GridEventData>()
		const blockerShift = new Map<Id, number>()

		for (const [columnIndex, columnData] of allColumns.entries()) {
			for (const [eventId, eventRowData] of columnData.events.entries()) {
				this.eventIdToOriginalColumnArrayIndex.set(eventId, columnIndex)
				let currentEventCanExpand = false

				// Check cache first before recalculating
				let cachedExpandability = this.expandabilityCache.get(eventId)
				if (!cachedExpandability) {
					const expandInfo = this.canExpandRight(eventId, eventRowData, columnIndex, allColumns, this.blockingGroupsCache)
					this.expandabilityCache.set(eventId, expandInfo)
					cachedExpandability = expandInfo
				}

				currentEventCanExpand = cachedExpandability.canExpand

				const eventShift = blockerShift.get(eventId) ?? 0
				let size = 0

				if (currentEventCanExpand) {
					const maxSize = allColumns.length
					const numOfColumnsWithBlockers = this.blockingGroupsCache.get(eventId)?.length ?? 0

					if (numOfColumnsWithBlockers === 0) {
						// Early termination when first conflict found
						let firstConflictIndex = -1

						for (let i = columnIndex + 1; i < allColumns.length; i++) {
							const columnData = allColumns[i]
							const conflict = this.findFirstOverlapFast(eventRowData, columnData.events)

							if (conflict) {
								firstConflictIndex = i
								size = i - columnIndex + (blockerShift.get(conflict) ?? 0) - eventShift
								break
							}
						}

						if (firstConflictIndex === -1) {
							const arrayIndexToGridIndex = 1 + columnIndex

							size = maxSize - eventShift - arrayIndexToGridIndex + BASE_EVENT_BUBBLE_SPAN_SIZE
						}
					} else {
						const columnsWithConflict = this.countConflictingColumns(columnIndex, eventRowData, allColumns)
						size = Math.max(Math.floor((maxSize - eventShift) / (columnsWithConflict + BASE_EVENT_BUBBLE_SPAN_SIZE)), 1)
					}

					this.updateBlockerShifts(eventId, size, blockerShift)
				}

				const gridColumnStart = 1 + columnIndex + eventShift
				const spanSize =
					gridColumnStart + size > allColumns.length + 1 ? Math.max(allColumns.length - gridColumnStart, BASE_EVENT_BUBBLE_SPAN_SIZE) : size

				gridData.set(eventId, {
					row: {
						start: eventRowData.start,
						end: eventRowData.end,
					},
					column: {
						start: gridColumnStart,
						span: spanSize,
					},
				})
			}
		}

		this.applyRetroactiveShifts(gridData, allColumns)

		return gridData
	}

	/**
	 * Apply retroactive shifts and expansion to earlier events when later events have shifted
	 * This ensures events that were blocked by shifted events can now expand properly
	 *
	 * @param gridData The current state of the grid
	 * @param allColumns Original events grouped by column
	 * @private
	 */
	private applyRetroactiveShifts(gridData: Map<Id, GridEventData>, allColumns: Array<ColumnData>): void {
		// Cache conflict info to avoid redundant calculations
		const conflictCache = new Map<
			Id,
			{
				conflict: { distance: number; id: Id; gridStart: number } | undefined
				sumOfSizes: number
			}
		>()

		for (const [eventId, gridInfo] of gridData.entries()) {
			const eventIndex = this.eventIdToOriginalColumnArrayIndex.get(eventId)
			if (eventIndex == null) {
				continue
			}

			const expectedGridEnd = gridInfo.column.start + gridInfo.column.span

			// Check cache first to avoid redundant conflict finding
			let cachedConflictInfo = conflictCache.get(eventId)
			let conflict: { distance: number; id: Id; gridStart: number } | undefined
			let sumOfSizes = 0

			if (!cachedConflictInfo) {
				// Find conflict and accumulate sizes - preserve original loop logic
				for (let i = eventIndex + 1; i < allColumns.length; i++) {
					const columnData = allColumns[i]

					const overlappingEvents = this.findOverlappingEvents(
						{
							start: gridInfo.row.start,
							end: gridInfo.row.end,
						},
						columnData.events,
					)

					if (overlappingEvents.size === 0) {
						continue
					}

					// Accumulate and find closest in single pass
					for (const [conflictId] of overlappingEvents.entries()) {
						const conflictInfo = gridData.get(conflictId)
						if (!conflictInfo) {
							continue
						}

						const distance = conflictInfo.column.start - expectedGridEnd
						sumOfSizes += conflictInfo.column.span

						// Find closest conflict (minimum distance)
						if (!conflict || distance < conflict.distance) {
							conflict = {
								distance,
								id: conflictId,
								gridStart: conflictInfo.column.start,
							}
						}
					}
				}

				// Cache the result
				cachedConflictInfo = { conflict, sumOfSizes }
				conflictCache.set(eventId, cachedConflictInfo)
			} else {
				conflict = cachedConflictInfo.conflict
				sumOfSizes = cachedConflictInfo.sumOfSizes
			}

			if (!conflict) {
				continue
			}

			let newSize: number | null = null

			if (gridInfo.column.start + gridInfo.column.span > allColumns.length) {
				newSize = Math.max(allColumns.length - gridInfo.column.start, BASE_EVENT_BUBBLE_SPAN_SIZE)
			} else if (expectedGridEnd < conflict.gridStart) {
				const expandedSize = gridInfo.column.span + conflict.distance
				newSize =
					gridInfo.column.start + expandedSize > allColumns.length
						? Math.max(allColumns.length - gridInfo.column.start, BASE_EVENT_BUBBLE_SPAN_SIZE)
						: expandedSize
			} else if (expectedGridEnd > conflict.gridStart) {
				const shrinkSize = conflict.gridStart - 1
				newSize =
					gridInfo.column.start + shrinkSize + sumOfSizes > allColumns.length
						? Math.max(allColumns.length - gridInfo.column.start, BASE_EVENT_BUBBLE_SPAN_SIZE)
						: shrinkSize
			}

			// Only update if size changed
			if (newSize !== null && newSize !== gridInfo.column.span) {
				gridData.set(eventId, {
					...gridInfo,
					column: {
						...gridInfo.column,
						span: newSize,
					},
				})
			}
		}
	}

	/**
	 * Finds the first conflicting event; It differentiates from findOverlappingEvents by
	 * returning the first conflicting event instead of collecting them and returning everything
	 * @param currentEventRowData Main event row bounds
	 * @param eventsInColumn Map of event Id to row bounds
	 * @private
	 *
	 * @return Id if there is a conflict, null otherwise
	 */
	private findFirstOverlapFast(currentEventRowData: RowBounds, eventsInColumn: Map<Id, RowBounds>): Id | null {
		for (const [eventId, eventRowData] of eventsInColumn.entries()) {
			if (eventRowData.start < currentEventRowData.end && eventRowData.end > currentEventRowData.start) {
				return eventId
			}
		}
		return null
	}

	/**
	 * Counts how many columns conflicts with a given event bound
	 * @param columnIndex Which column the event was originally positioned
	 * @param eventRowData Event row bounds containing start and end rows
	 * @param allColumns All original positioned events grouped by column
	 * @private
	 */
	private countConflictingColumns(columnIndex: number, eventRowData: RowBounds, allColumns: Array<ColumnData>): number {
		let count = 0
		for (let i = columnIndex + 1; i < allColumns.length; i++) {
			if (Array.from(allColumns[i].events.values()).some((eventData) => eventData.start < eventRowData.end && eventData.end > eventRowData.start)) {
				count++
			}
		}
		return count
	}

	/**
	 * Updates the cache of events shifting, allowing shifted events to be re-visited
	 * @param eventId Event id who is expanding
	 * @param size How much this event grew and how much its blockers will have to move
	 * @param blockerShift Map of positions to shift per event
	 * @private
	 */
	private updateBlockerShifts(eventId: Id, size: number, blockerShift: Map<Id, number>): void {
		const blockerGroups = this.blockingGroupsCache.get(eventId)
		if (!blockerGroups) return

		for (const blockerGroup of blockerGroups) {
			for (const [blocker] of blockerGroup.entries()) {
				const blockerShiftInfo = blockerShift.get(blocker) ?? 0
				blockerShift.set(blocker, blockerShiftInfo + size - 1)
				blockerGroup.delete(blocker)
			}
			this.blockingGroupsCache.delete(eventId)
		}
	}

	/**
	 * Determinate if an event can expand to its right or if there is any
	 * event who blocks it.
	 *
	 * @param eventId Event element id who is being checked
	 * @param eventRowData Event row bounds
	 * @param colIndex Index from {allColumns} indicating where this event was initially positioned
	 * @param allColumns All event columns
	 * @param blockingGroups Cache of blocking events grouped by the blocked event id
	 * @param visited Set of already visited nodes
	 *
	 * @private
	 *
	 * @return A BlockingInfo object with info if the event can expand and its blockers
	 */
	private canExpandRight(
		eventId: Id,
		eventRowData: RowBounds,
		colIndex: number,
		allColumns: ColumnData[],
		blockingGroups: Map<Id, Array<Map<Id, boolean>>>,
		visited: Set<Id> = new Set(),
	): BlockingInfo {
		const blockingEvents = new Map<Id, boolean>()
		const nextColIndex = colIndex + 1

		if (!blockingGroups.has(eventId)) {
			blockingGroups.set(eventId, [])
		}

		if (nextColIndex >= allColumns.length) {
			return { canExpand: false, blockingEvents }
		}

		const nextColEvents = allColumns[nextColIndex].events
		const overlapping = this.findOverlappingEvents(eventRowData, nextColEvents)

		// Process overlapping events
		for (const [nextEventId, nextEventRowData] of overlapping) {
			if (visited.has(nextEventId)) {
				continue
			}

			visited.add(nextEventId)

			// Check cache first to avoid redundant recursion
			let nextBlockingInfo = this.expandabilityCache.get(nextEventId)
			if (!nextBlockingInfo) {
				nextBlockingInfo = this.canExpandRight(nextEventId, nextEventRowData, nextColIndex, allColumns, blockingGroups, visited)
				this.expandabilityCache.set(nextEventId, nextBlockingInfo)
			}

			blockingEvents.set(nextEventId, nextBlockingInfo.canExpand)
			for (const [id, canExpand] of nextBlockingInfo.blockingEvents) {
				blockingEvents.set(id, canExpand)
			}

			if (!nextBlockingInfo.canExpand) {
				if (blockingEvents.size) {
					blockingGroups.get(eventId)?.push(blockingEvents)
				}
				return { canExpand: false, blockingEvents }
			}
		}

		if (blockingEvents.size) {
			blockingGroups.get(eventId)?.push(blockingEvents)
		}

		return {
			canExpand: Array.from(blockingEvents.entries()).every(([event, canExpand]) => {
				if (!canExpand) {
					return false
				}
				const expandInfo = this.expandabilityCache.get(event)
				if (expandInfo !== undefined && expandInfo.blockingEvents.size === 0) {
					return true
				}
				const a = blockingGroups.get(event)
				if (a === undefined || a.length === 0) return true
				return Array.from(a.values()).every((group) => Array.from(group.values()).every(Boolean))
			}),
			blockingEvents,
		}
	}

	/**
	 * Calculates the row start and row end inside the grid for a given event
	 * @param event Event to have its bounds calculated
	 * @param timeRange Time range for the day, usually from 00:00 till 23:00
	 * @param subRowAsMinutes How many minutes a Grid row represents
	 * @param timeScale {TimeScale} How subdivided an hour should be
	 * @param baseDate Date when the event will be rendered, it can be different from the event start/end depending on
	 * how many hours it expands
	 * @private
	 *
	 * @returns RowBounds
	 */

	private getRowBounds(event: CalendarEvent, timeRange: TimeRange, subRowAsMinutes: number, timeScale: TimeScale, baseDate: Date): RowBounds {
		const interval = TIME_SCALE_BASE_VALUE / timeScale
		const diffFromRangeStartToEventStart = timeRange.start.diff(Time.fromDate(event.startTime))

		const eventStartsBeforeRange = event.startTime < baseDate || Time.fromDate(event.startTime).isBefore(timeRange.start)
		const start = eventStartsBeforeRange ? 1 : Math.floor(diffFromRangeStartToEventStart / subRowAsMinutes) + 1

		const dateParts = {
			year: baseDate.getFullYear(),
			month: baseDate.getMonth() + 1,
			day: baseDate.getDate(),
			hour: timeRange.end.hour,
			minute: timeRange.end.minute,
		}

		const diff = DateTime.fromJSDate(event.endTime).diff(DateTime.fromObject(dateParts).plus({ minutes: interval }), "minutes").minutes

		const diffFromRangeStartToEventEnd = timeRange.start.diff(Time.fromDate(event.endTime))
		const eventEndsAfterRange = event.endTime > getStartOfNextDay(baseDate) || diff > 0
		const end = eventEndsAfterRange ? -1 : Math.floor(diffFromRangeStartToEventEnd / subRowAsMinutes) + 1

		return { start, end }
	}

	/**
	 * Finds and returns all conflicting events for a given event inside a column
	 * @param currentEventRowData Base event grid row bounds info
	 * @param eventsInColumn Map of events inside the column
	 * @private
	 *
	 * @return A map containing all conflicting events and its row bounds
	 */
	private findOverlappingEvents(currentEventRowData: RowBounds, eventsInColumn: Map<Id, RowBounds>): Map<Id, RowBounds> {
		const result = new Map<Id, RowBounds>()

		for (const [eventId, rowBounds] of eventsInColumn.entries()) {
			if (rowBounds.start < currentEventRowData.end && rowBounds.end > currentEventRowData.start) {
				result.set(eventId, rowBounds)
			}
		}

		return result
	}
}
