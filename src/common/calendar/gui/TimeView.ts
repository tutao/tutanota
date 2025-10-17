import m, { ChildArray, Children, Component, Vnode, VnodeDOM } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Time } from "../date/Time"
import { deepMemoized, downcast, first, getStartOfNextDay } from "@tutao/tutanota-utils"
import { px } from "../../gui/size.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { colorForBg } from "../../gui/base/GuiUtils.js"
import { getTimeZone } from "../date/CalendarUtils"
import { EventRenderWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { DateTime } from "../../../../libs/luxon.js"
import { TimeColumn } from "./TimeColumn"
import { elementIdPart } from "../../api/common/utils/EntityUtils"

export interface TimeViewEventWrapper {
	event: EventRenderWrapper
	conflictsWithMainEvent: boolean
	/**
	 * Color applied to the event bubble background
	 */
	color: string
	/**
	 * Applies special style, color border and shows success or warning icon before event title
	 */
	featured: boolean
}

export const TIME_SCALE_BASE_VALUE = 60 // 60 minutes
/**
 * {@link TIME_SCALE_BASE_VALUE} / {@link TimeScale} = Time interval applied to the agenda time column
 * @example
 * const timeScale1: TimeScale = 1
 * const intervalOf60Minutes = TIME_SCALE_BASE_VALUE / timeScale1
 *
 * const timeScale2: TimeScale = 2
 * const intervalOf30Minutes = TIME_SCALE_BASE_VALUE / timeScale2
 *
 * const timeScale4: TimeScale = 4
 * const intervalOf15Minutes = TIME_SCALE_BASE_VALUE / timeScale4
 * */
export type TimeScale = 1 | 2 | 4 // FIXME update docs
/**
 * Tuple of {@link TimeScale} and timeScaleInMinutes
 * @example
 * const scale = 4
 * const timeScaleInMinutes = TIME_SCALE_BASE_VALUE / scale
 * const myTuple: TimeScaleTuple = [scale, timeScaleInMinutes]
 */
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
	/**
	 * Days to render events
	 */
	dates: Array<Date>
	events: Array<TimeViewEventWrapper>
	/**
	 * {@link TimeScale} applied to this TimeView
	 */
	timeScale: TimeScale
	/**
	 * {@link TimeRange} used to generate the Time column and the number of time intervals/slots to position the events
	 *
	 * 0 <= start < end < 24:00
	 *
	 * End time is inclusive and is considered the beginning of the last interval
	 */
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

export class TimeView implements Component<TimeViewAttributes> {
	private timeRowHeight?: number

	/*
	 * Must filter the array to get events using the same logic from conflict detection
	 * But instead of event start and end we use range start end
	 */
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
				/**
				 * We sum one more interval because it is inclusive
				 * @see TimeViewAttributes.timeRange
				 */
				end: timeRange.end.toDateTime(baseDate, getTimeZone()).plus({ minute: interval }).toJSDate(),
			}

			//const gridData = this.calculateGridData(agendaEntries, timeRange, subRowAsMinutes, subRowCount, timeScale, baseDate)
			const orderedEvents = agendaEntries.toSorted((eventWrapperA, eventWrapperB) => {
				const startTimeComparison = eventWrapperA.event.event.startTime.getTime() - eventWrapperB.event.event.startTime.getTime()
				if (startTimeComparison === 0) {
					return eventWrapperB.event.event.endTime.getTime() - eventWrapperA.event.event.endTime.getTime()
				}

				return startTimeComparison
			})
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
						// EventBubble
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
							: m("", event.event.event.summary), // FIXME for god sake, we need to get rid of those event.event.event
					),
				]
			}) as ChildArray
		},
	)

	private getRowBounds(event: CalendarEvent, timeRange: TimeRange, subRowAsMinutes: number, timeScale: TimeScale, baseDate: Date) {
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

		// FIXME remove downcast
		const diff = DateTime.fromJSDate(event.endTime).diff(DateTime.fromObject(downcast(dateParts)).plus({ minutes: interval }), "minutes").minutes

		const diffFromRangeStartToEventEnd = timeRange.start.diff(Time.fromDate(event.endTime))
		const eventEndsAfterRange = event.endTime > getStartOfNextDay(baseDate) || diff > 0
		const end = eventEndsAfterRange ? -1 : Math.floor(diffFromRangeStartToEventEnd / subRowAsMinutes) + 1

		return { start, end }
	}

	private layoutEvents(events: Array<TimeViewEventWrapper>, timeRange: TimeRange, subRowAsMinutes: number) {
		const baseMinutes = timeRange.start.asMinutes()
		const subRowFactor = 1 / subRowAsMinutes

		const dateToRow = (date: Date): number => {
			const minutesFromStart = date.getHours() * 60 + date.getMinutes() - baseMinutes
			return Math.floor(minutesFromStart * subRowFactor) + 1
		}

		// Convert to row-based events
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

		const columns: Array<ColumnData> = []

		for (const [eventId, eventRowData] of eventsMap.entries()) {
			let currentColumnIndex = columns.findIndex((col) => col.lastEventEndingRow <= eventRowData.rowStart)

			if (currentColumnIndex === -1) {
				// No available column, create new one
				currentColumnIndex = columns.length
				columns.push({
					lastEventEndingRow: eventRowData.rowEnd,
					events: new Map([[eventId, eventRowData]]),
				})
			} else {
				// Reuse available column
				columns[currentColumnIndex].lastEventEndingRow = eventRowData.rowEnd
				columns[currentColumnIndex].events.set(eventId, eventRowData)
			}
		}

		return this.buildGridData(columns)
	}

	blockingGroups: Map<Id, Array<Map<Id, boolean>>> = new Map()

	private buildGridData(allColumns: Array<ColumnData>): GridData["events"] {
		const gridData = new Map()
		const blockerShift = new Map<Id, number>()
		for (const [columnIndex, columnData] of allColumns.entries()) {
			console.log(`\n\n==================================================\nIterating over Column ${columnIndex}`)
			console.table(columnData)
			console.log(this.blockingGroups.entries())

			for (let [eventId, eventRowData] of columnData.events.entries()) {
				let currentEventCanExpand = false
				const hasBlockingGroup = this.blockingGroups.has(eventId)
				let hasBeenEvaluatedBefore = hasBlockingGroup

				for (const entry of Array.from(this.blockingGroups.values()).flat()) {
					for (const [evId, canExpand] of entry.entries()) {
						if (evId === eventId) {
							currentEventCanExpand = canExpand
							hasBeenEvaluatedBefore = true
						}
					}
				}
				// Array.from(this.blockingGroups.entries()).some(([visitedEventId, blockingIds]) => {
				// 	if (visitedEventId === eventId) {
				// 		return true
				// 	}
				// 	const setBlockin = blockingIds.map((columnSet) => Array.from(columnSet.entries())).flat()
				// 	const currentEv = setBlockin.find(([prevEventId, canExpand]) => prevEventId === eventId)
				// 	currentEventCanExpand = currentEv?.[1] ?? false
				// 	return !!currentEv
				// })

				if (!hasBeenEvaluatedBefore || (!hasBlockingGroup && currentEventCanExpand)) {
					const { canExpand, blockingEvents } = this.canExpandRight(eventId, eventRowData, columnIndex, allColumns, this.blockingGroups)
					console.log("buildgridData / hasBeenEvaluatedBefore FALSE: ", {
						eventId,
						eventRowData,
						canExpand,
						blockingEvents,
					})
					currentEventCanExpand = canExpand
				}

				const eventShift = blockerShift.get(eventId) ?? 0
				let size = 0

				if (currentEventCanExpand) {
					const maxSize = allColumns.length
					const numOfColumnsWithBlockers = (this.blockingGroups.get(eventId)?.length ?? 0) > 0 ? this.blockingGroups.get(eventId)!.length : 0
					console.log(`${eventId}: `, this.blockingGroups.get(eventId))

					if (numOfColumnsWithBlockers === 0) {
						for (let i = columnIndex + 1; i < allColumns.length; i++) {
							const columnData = allColumns[i]
							let conflict = Array.from(columnData.events.entries()).find(
								([_, evData]) => evData.rowStart < eventRowData.rowEnd && evData.rowEnd > eventRowData.rowStart,
							)
							if (conflict) {
								size = i + (blockerShift.get(conflict[0]) ?? 0) - eventShift
							}
						}
						if (size === 0) {
							const arrayIndexToGridIndex = 1 + columnIndex
							size = maxSize - eventShift - arrayIndexToGridIndex
						}
						size += 1
					} else {
						const myOriginalSize = 1
						const columnsWithConflict = allColumns.slice(columnIndex + 1).reduce((prev, column) => {
							if (
								Array.from(column.events.entries()).some(([evId, eventData]) => {
									return eventData.rowStart < eventRowData.rowEnd && eventData.rowEnd > eventRowData.rowStart
								})
							) {
								return prev + 1
							}

							return prev
						}, 0)

						size = Math.max(Math.floor((maxSize - eventShift) / (columnsWithConflict + myOriginalSize)), 1)
					}

					//iterate over blockers
					for (const blockerGroup of this.blockingGroups.get(eventId) ?? []) {
						for (const blocker of blockerGroup.keys()) {
							const blockerShiftInfo = blockerShift.get(blocker) ?? 0
							blockerShift.set(blocker, blockerShiftInfo + size - 1)
							blockerGroup.delete(blocker)
							this.blockingGroups.delete(blocker)
						}
					}
				}

				// const colSpan = this.expandEvent(columnIndex, eventRowData, allColumns)
				const gridColumnStart = 1 + columnIndex + eventShift
				const gridColumnEnd = gridColumnStart + size > allColumns.length + 1 ? Math.max(allColumns.length - gridColumnStart, 1) : size
				console.log("buildgridData / final: ", {
					eventId,
					eventRowData,
					currentEventCanExpand,
					eventShift,
					size,
					gridColumnStart,
					gridColumnEnd,
				})
				const eventGridData: GridEventData = {
					start: eventRowData.rowStart,
					end: eventRowData.rowEnd,
					gridColumnStart,
					gridColumnEnd,
				}

				gridData.set(eventId, eventGridData)
			}
		}

		return gridData
	}

	private canExpandRight(
		eventId: string,
		eventRowData: EventRowData,
		colIndex: number,
		allColumns: ColumnData[],
		blockingGroups: Map<Id, Array<Map<Id, boolean>>>,
		visited: Set<Id> = new Set(),
	): { canExpand: boolean; blockingEvents: Map<Id, boolean> } {
		const blockingEvents = new Map<string, boolean>()
		let nextColIndex = colIndex + 1

		if (!blockingGroups.get(eventId)) {
			blockingGroups.set(eventId, [])
		}

		if (nextColIndex >= allColumns.length) {
			return { canExpand: false, blockingEvents }
		}

		const nextColEvents = allColumns[nextColIndex].events
		let overlapping = this.findOverlappingEvents(eventRowData, nextColEvents)

		// If there are overlapping events, they must also be movable
		for (const [nextEventId, nextEventRowData] of overlapping) {
			if (visited.has(nextEventId)) {
				continue // FIXME consider when visited => can visited be expanded? true or false
			}

			visited.add(nextEventId)
			const result = this.canExpandRight(nextEventId, nextEventRowData, nextColIndex, allColumns, blockingGroups)

			blockingEvents.set(nextEventId, result.canExpand)
			for (const [id, canExpand] of result.blockingEvents) blockingEvents.set(id, canExpand)

			if (!result.canExpand) {
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
				const a = blockingGroups.get(event)
				if (a === undefined || a.length === 0) return true
				return Array.from(a.values()).every(Boolean)
			}),
			blockingEvents,
		}
	}

	private findOverlappingEvents(currentEventRowData: EventRowData, eventsInColumn: Map<Id, EventRowData>) {
		let columnEntries = Array.from(eventsInColumn.entries())
		const firstEv: EventRowData | undefined = first(columnEntries)?.[1]

		if (!firstEv || firstEv.rowStart >= currentEventRowData.rowEnd) {
			return new Map()
		}

		return new Map(
			columnEntries.filter(
				([eventId, eventRowData]) => eventRowData.rowStart < currentEventRowData.rowEnd && eventRowData.rowEnd > currentEventRowData.rowStart,
			),
		)
	}
}
