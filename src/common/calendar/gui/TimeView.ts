import m, { ChildArray, Children, Component, Vnode, VnodeDOM } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Time } from "../date/Time"
import { deepMemoized, downcast, getStartOfNextDay } from "@tutao/tutanota-utils"
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

type GridEventData = { start: number; end: number; size: number; gridColumnStart: number }

interface GridData {
	maxColumnCount: number
	events: Map<Id, GridEventData>
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
			const gridData = this.processAgendaEntries(agendaEntries, timeRange, subRowAsMinutes)

			return agendaEntries.flatMap((event) => {
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
				const { start, end, size: spanSize, gridColumnStart }: GridEventData = evData

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
							: event.event.event.summary, // FIXME for god sake, we need to get rid of those event.event.event
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

	// /**
	//  * Processes agenda entries for CSS Grid layout.
	//  * Returns grid-column span values for each event.
	//  * Assumes input events are already sorted by start time.
	//  *
	//  * @param agendaEntries - Array of time view event wrappers (MUST be sorted by startTime)
	//  * @param timeRange - The time range defining the grid boundaries
	//  * @param subRowAsMinutes - Minutes per sub-row in the grid
	//  * @returns Map of event IDs to their grid positioning data
	//  */
	// private processAgendaEntries(
	//     agendaEntries: TimeViewEventWrapper[],
	//     timeRange: TimeRange,
	//     subRowAsMinutes: number
	// ): Map<string, GridEventData> {
	//     if (agendaEntries.length === 0) return new Map()
	//
	//     const baseMinutes = timeRange.start.asMinutes()
	//     const subRowFactor = 1 / subRowAsMinutes
	//
	//     /**
	//      * Converts a date to a grid row number based on time offset
	//      */
	//     const dateToRow = (date: Date): number => {
	//         const minutesFromStart = date.getHours() * 60 + date.getMinutes() - baseMinutes
	//         return Math.floor(minutesFromStart * subRowFactor) + 1
	//     }
	//
	//     // Convert to row-based events (already sorted!)
	//     const events = agendaEntries.map((e) => {
	//         const evt = e.event.event
	//         return {
	//             id: elementIdPart(evt._id),
	//             start: dateToRow(new Date(evt.startTime)),
	//             end: dateToRow(new Date(evt.endTime)),
	//             summary: evt.summary
	//         }
	//     })
	//
	//     // Build overlap groups
	//     const groups: typeof events[] = []
	//
	//     for (const event of events) {
	//         let targetGroup: typeof events | null = null
	//
	//         for (const group of groups) {
	//             const overlaps = group.some(
	//                 groupEvent =>
	//                     groupEvent.start < event.end &&
	//                     groupEvent.end > event.start
	//             )
	//
	//             if (overlaps) {
	//                 targetGroup = group
	//                 break
	//             }
	//         }
	//
	//         if (targetGroup) {
	//             targetGroup.push(event)
	//         } else {
	//             groups.push([event])
	//         }
	//     }
	//
	//     console.log("Groups => ", groups.map(g => g.map(e => e.summary)))
	//
	//     const result = new Map<string, GridEventData>()
	//
	//     for (const group of groups) {
	//         // Assign columns
	//         const assignments: Array<{ event: typeof events[0], column: number }> = []
	//
	//         for (const event of group) {
	//             let column = 0
	//
	//             while (true) {
	//                 const hasConflict = assignments.some(
	//                     a => a.column === column &&
	//                         a.event.start < event.end &&
	//                         a.event.end > event.start
	//                 )
	//
	//                 if (!hasConflict) {
	//                     break
	//                 }
	//                 column++
	//             }
	//
	//             assignments.push({event, column})
	//         }
	//
	//         const totalColumns = Math.max(...assignments.map(a => a.column)) + 1
	//
	//         console.log("Assignments =>", assignments)
	//         console.log("Total Columns =>", assignments)
	//         // Calculate span for each event
	//         for (const {event, column} of assignments) {
	//             let span = 1
	//
	//             // Try to expand rightward
	//             for (let checkCol = column + 1; checkCol < totalColumns; checkCol++) {
	//                 const hasBlocker = assignments.some(
	//                     a => a.column === checkCol &&
	//                         a.event.start < event.end &&
	//                         a.event.end > event.start
	//                 )
	//
	//                 if (hasBlocker) break
	//                 span++
	//             }
	//
	//             result.set(event.id, {
	//                 start: event.start,
	//                 end: event.end,
	//                 gridColumnStart: column + 1,  // CSS Grid is 1-indexed
	//                 size: span,
	//             })
	//         }
	//     }
	//
	//     return result
	// }

	/**
	 * Optimized agenda processing with O(n·k) complexity where k is max concurrent events.
	 * Uses column end-time tracking instead of searching through groups.
	 * Assumes input events are already sorted by start time.
	 */
	private processAgendaEntries(agendaEntries: TimeViewEventWrapper[], timeRange: TimeRange, subRowAsMinutes: number): Map<string, GridEventData> {
		if (agendaEntries.length === 0) return new Map()

		const baseMinutes = timeRange.start.asMinutes()
		const subRowFactor = 1 / subRowAsMinutes

		const dateToRow = (date: Date): number => {
			const minutesFromStart = date.getHours() * 60 + date.getMinutes() - baseMinutes
			return Math.floor(minutesFromStart * subRowFactor) + 1
		}

		// Convert to row-based events
		const events = agendaEntries.map((e) => {
			const evt = e.event.event
			return {
				id: elementIdPart(evt._id),
				start: dateToRow(new Date(evt.startTime)),
				end: dateToRow(new Date(evt.endTime)),
			}
		})

		// Track column assignments with end times
		interface ColumnData {
			endTime: number
			events: Array<{ id: string; start: number; end: number }>
		}

		const columns: ColumnData[] = []
		const eventToColumn = new Map<string, number>()

		// Single pass: assign columns using end-time tracking
		for (const event of events) {
			// Find first column where endTime <= event.start
			let column = columns.findIndex((col) => col.endTime <= event.start)

			if (column === -1) {
				// No available column, create new one
				column = columns.length
				columns.push({
					endTime: event.end,
					events: [event],
				})
			} else {
				// Reuse available column
				columns[column].endTime = event.end
				columns[column].events.push(event)
			}

			eventToColumn.set(event.id, column)
		}

		const totalColumns = columns.length
		const result = new Map<string, GridEventData>()

		// Calculate spans for all events
		for (const event of events) {
			const column = eventToColumn.get(event.id)!
			let span = 1

			// Check each column to the right for blocking events
			for (let checkCol = column + 1; checkCol < totalColumns; checkCol++) {
				// Check if this column has any event that overlaps with current event
				const hasBlocker = columns[checkCol].events.some((e) => e.start < event.end && e.end > event.start)

				if (hasBlocker) break
				span++
			}

			result.set(event.id, {
				start: event.start,
				end: event.end,
				gridColumnStart: column + 1,
				size: span,
			})
		}

		return result
	}
}
