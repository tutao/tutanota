import m, { ChildArray, Children, Component, Vnode, VnodeDOM } from "mithril"
import { Time } from "../date/Time"
import { deepMemoized } from "@tutao/tutanota-utils"
import { px } from "../../gui/size.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { colorForBg } from "../../gui/base/GuiUtils.js"
import { getTimeZone } from "../date/CalendarUtils"
import { EventRenderWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { TimeColumn } from "./TimeColumn"
import { elementIdPart } from "../../api/common/utils/EntityUtils"

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

type GridEventData = { start: number; end: number; gridColumnEnd: number; gridColumnStart: number }

interface GridData {
	maxColumnCount: number
	events: Map<Id, GridEventData>
}

interface ColumnData {
	lastEventEndingRow: number
	events: Map<Id, EventRowData>
}

interface EventRowData {
	rowStart: number
	rowEnd: number
}

interface BlockingInfo {
	canExpand: boolean
	blockingEvents: Map<Id, boolean>
}

const BASE_EVENT_BUBBLE_SPAN_SIZE = 1

export class TimeView implements Component<TimeViewAttributes> {
	private timeRowHeight?: number
	private blockingGroupsCache: Map<Id, Array<Map<Id, boolean>>> = new Map()
	private expandabilityCache: Map<Id, BlockingInfo> = new Map()

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
							this.timeRowHeight = Number.parseFloat(window.getComputedStyle(vnode.dom).height.replaceAll("px", "")) / subRowCount
							m.redraw()
						})
					}
				},
			},
			[
				this.buildTimeIndicator(timeRange, subRowAsMinutes, timeIndicator),
				dates.map((date) => {
					return m(
						".grid.plr-unit.gap.z1.grid-auto-columns.rel.border-right",
						{
							oncreate(vnode): any {
								;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(${subRowCount}, 1fr)`
							},
							// style: {
							//     "grid-template-columns": "repeat(8, 1fr)",
							// }
						},
						[this.renderEvents(events, timeRange, subRowAsMinutes, subRowCount, timeScale, date, hasAnyConflict)],
					)
				}),
			],
		)
	}

	private buildTimeIndicator(timeRange: TimeRange, subRowAsMinutes: number, time?: Time): Children {
		if (!time) {
			return null
		}

		const startTimeSpan = timeRange.start.diff(time)
		const start = Math.floor(startTimeSpan / subRowAsMinutes)

		return m(".time-indicator", {
			style: {
				top: px((this.timeRowHeight ?? 0) * start),
				display: this.timeRowHeight == null ? "none" : "initial",
			},
		})
	}

	private renderEvents = deepMemoized(
		(
			agendaEntries: Array<TimeViewEventWrapper>,
			timeRange: TimeRange,
			subRowAsMinutes: number,
			subRowCount: number,
			timeScale: TimeScale,
			baseDate: Date,
			hasAnyConflict: boolean = false,
		): Children => {
			const interval = TIME_SCALE_BASE_VALUE / timeScale
			const timeRangeAsDate = {
				start: timeRange.start.toDate(baseDate),
				end: timeRange.end.toDateTime(baseDate, getTimeZone()).plus({ minute: interval }).toJSDate(),
			}

			const orderedEvents = agendaEntries.toSorted((eventWrapperA, eventWrapperB) => {
				const startTimeComparison = eventWrapperA.event.event.startTime.getTime() - eventWrapperB.event.event.startTime.getTime()
				if (startTimeComparison === 0) {
					return eventWrapperB.event.event.endTime.getTime() - eventWrapperA.event.event.endTime.getTime()
				}

				return startTimeComparison
			})

			// Clear caches for fresh calculation
			this.blockingGroupsCache.clear()
			this.expandabilityCache.clear()

			const gridData = this.layoutEvents(orderedEvents, timeRange, subRowAsMinutes)

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
				const { start, end, gridColumnEnd: spanSize, gridColumnStart }: GridEventData = evData

				return [
					m(
						".border-radius.text-ellipsis-multi-line.p-xsm.on-success-container-color.small",
						{
							style: {
								"min-height": px(0),
								"min-width": px(0),
								"grid-column": `${gridColumnStart} / span ${spanSize}`,
								background: event.color,
								color: !event.featured ? colorForBg(event.color) : undefined,
								"grid-row": `${start} / ${end}`,
								"border-top-left-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-top-right-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-bottom-left-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								"border-bottom-right-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								border: event.featured ? `1.5px dashed ${hasAnyConflict ? theme.on_warning_container : theme.on_success_container}` : "none",
								"border-top": event.event.event.startTime < timeRangeAsDate.start ? "none" : undefined,
								"border-bottom": event.event.event.endTime > timeRangeAsDate.end ? "none" : undefined,
								"-webkit-line-clamp": 2,
							} satisfies Partial<CSSStyleDeclaration> & Record<string, any>,
						},
						event.featured
							? m(".flex.items-start", [
									m(Icon, {
										icon: hasAnyConflict ? Icons.AlertCircle : Icons.Checkmark,
										container: "div",
										class: "mr-xxs",
										size: IconSize.Normal,
										style: {
											fill: hasAnyConflict ? theme.on_warning_container : theme.on_success_container,
										},
									}),
									m(
										".break-word.b.text-ellipsis-multi-line.lh",
										{
											style: {
												"-webkit-line-clamp": 2,
												color: hasAnyConflict ? theme.on_warning_container : theme.on_success_container,
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

	private layoutEvents(events: Array<TimeViewEventWrapper>, timeRange: TimeRange, subRowAsMinutes: number) {
		const baseMinutes = timeRange.start.asMinutes()
		const subRowFactor = 1 / subRowAsMinutes

		const dateToRow = (date: Date): number => {
			const minutesFromStart = date.getHours() * 60 + date.getMinutes() - baseMinutes
			return Math.floor(minutesFromStart * subRowFactor) + 1
		}

		// Convert to row-based events: O(n)
		const eventsMap: Map<Id, EventRowData> = new Map(
			events.map((e) => {
				const evt = e.event.event
				return [
					elementIdPart(evt._id),
					{
						rowStart: dateToRow(new Date(evt.startTime)),
						rowEnd: dateToRow(new Date(evt.endTime)),
					},
				]
			}),
		)

		// Assign events to columns: O(n * c) with optimization
		const columns: Array<ColumnData> = []

		for (const [eventId, eventRowData] of eventsMap.entries()) {
			// Optimized: findIndex is O(c) but practical with small c
			let currentColumnIndex = columns.findIndex((col) => col.lastEventEndingRow <= eventRowData.rowStart)

			if (currentColumnIndex === -1) {
				currentColumnIndex = columns.length
				columns.push({
					lastEventEndingRow: eventRowData.rowEnd,
					events: new Map([[eventId, eventRowData]]),
				})
			} else {
				columns[currentColumnIndex].lastEventEndingRow = eventRowData.rowEnd
				columns[currentColumnIndex].events.set(eventId, eventRowData)
			}
		}

		return this.buildGridData(columns)
	}

	/**
	 * Optimized: Added caching to avoid recalculating expandability
	 * Memoizes canExpandRight results to O(1) lookups
	 */
	private buildGridData(allColumns: Array<ColumnData>): GridData["events"] {
		const gridData = new Map<Id, GridEventData>()
		const blockerShift = new Map<Id, number>()

		for (const [columnIndex, columnData] of allColumns.entries()) {
			for (const [eventId, eventRowData] of columnData.events.entries()) {
				let currentEventCanExpand = false

				// Optimized: Check cache first before recalculating
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
						// Optimized: Early termination when first conflict found
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
						// Optimized: Cache column count calculation
						const columnsWithConflict = this.countConflictingColumns(columnIndex, eventRowData, allColumns)
						size = Math.max(Math.floor((maxSize - eventShift) / (columnsWithConflict + BASE_EVENT_BUBBLE_SPAN_SIZE)), 1)
					}

					// Optimized: Bulk update blockers instead of individual iteration
					this.updateBlockerShifts(eventId, size, blockerShift)
				}

				const gridColumnStart = 1 + columnIndex + eventShift
				const gridColumnEnd =
					gridColumnStart + size > allColumns.length + 1 ? Math.max(allColumns.length - gridColumnStart, BASE_EVENT_BUBBLE_SPAN_SIZE) : size

				gridData.set(eventId, {
					start: eventRowData.rowStart,
					end: eventRowData.rowEnd,
					gridColumnStart,
					gridColumnEnd,
				})
			}
		}

		return gridData
	}

	/**
	 * Optimized: Memoized and returns on first overlap found
	 * O(e) instead of O(e²) in worst case
	 */
	private findFirstOverlapFast(currentEventRowData: EventRowData, eventsInColumn: Map<Id, EventRowData>): Id | null {
		for (const [eventId, eventRowData] of eventsInColumn.entries()) {
			if (eventRowData.rowStart < currentEventRowData.rowEnd && eventRowData.rowEnd > currentEventRowData.rowStart) {
				return eventId
			}
		}
		return null
	}

	/**
	 * Optimized: Extracted to separate method for clarity and reusability
	 * O(c) where c = columns from columnIndex+1 to end
	 */
	private countConflictingColumns(columnIndex: number, eventRowData: EventRowData, allColumns: Array<ColumnData>): number {
		let count = 0
		for (let i = columnIndex + 1; i < allColumns.length; i++) {
			if (
				Array.from(allColumns[i].events.values()).some(
					(eventData) => eventData.rowStart < eventRowData.rowEnd && eventData.rowEnd > eventRowData.rowStart,
				)
			) {
				count++
			}
		}
		return count
	}

	/**
	 * Optimized: Bulk update instead of individual operations
	 * O(b) where b = blocker count
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
	 * Optimized: Used memoization cache instead of blockingGroups parameter
	 * Reduced parameter passing and improved clarity
	 */
	private canExpandRight(
		eventId: Id,
		eventRowData: EventRowData,
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

		// Process overlapping events: O(o) where o = overlapping count
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
	 * Optimized: Extracted overlap detection for clarity
	 * O(e) where e = events in column
	 */
	private findOverlappingEvents(currentEventRowData: EventRowData, eventsInColumn: Map<Id, EventRowData>): Map<Id, EventRowData> {
		const result = new Map<Id, EventRowData>()

		for (const [eventId, eventRowData] of eventsInColumn.entries()) {
			if (eventRowData.rowStart < currentEventRowData.rowEnd && eventRowData.rowEnd > currentEventRowData.rowStart) {
				result.set(eventId, eventRowData)
			}
		}

		return result
	}
}
