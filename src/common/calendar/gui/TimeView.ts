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

			const sortesEntries = agendaEntries.toSorted((evA, evB) => {
				const sort = evA.event.event.startTime.getTime() - evB.event.event.startTime.getTime()
				return sort !== 0 ? sort : evB.event.event.endTime.getTime() - evA.event.event.endTime.getTime()
			})
			//const gridData = this.calculateGridData(agendaEntries, timeRange, subRowAsMinutes, subRowCount, timeScale, baseDate)
			const gridData = this.processAgendaEntries(sortesEntries, timeRange, subRowAsMinutes)

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

			console.log(e.event.event._id, e.event.event.summary)

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
		const sizesMap = new Map<string, number>()
		const diffsMap = new Map<string, number>()

		for (const event of events) {
			let column = eventToColumn.get(event.id)!
			let span = 1

			let blockers = 0
			// Check each column to the right for blocking events
			const bk = []
			for (let checkCol = column + 1; checkCol < totalColumns; checkCol++) {
				// Check if this column has any event that overlaps with current event
				const hasBlocker = columns[checkCol].events.filter((e) => e.start < event.end && e.end > event.start)
				bk.push(...hasBlocker)
				if (hasBlocker.length > 0) blockers++
			}

			const mapa = new Map(eventToColumn)
			const cl = Array.from(mapa.entries())
			console.log("Event2column", cl)
			console.log(`Blockers for ${event.id}`, bk)

			let myColumn = column
			const processed = new Set<string>()
			if (blockers === 0) {
				const eventsIBlock = []
				for (const ev2 of events) {
					if (ev2.id === event.id) continue

					let c = eventToColumn.get(ev2.id)!
					for (let checkCol = c + 1; checkCol < totalColumns; checkCol++) {
						// Check if this column has any event that overlaps with current event
						const hasBlocker = columns[checkCol].events.filter((e) => e.start < ev2.end && e.end > ev2.start)
						if (hasBlocker.includes(event)) {
							eventsIBlock.push(ev2)
						}
					}

					const sizePerChild = Math.floor(totalColumns / (eventsIBlock.length + 1))

					for (let j = 0; j < eventsIBlock.length; j++) {
						const evb = eventsIBlock[j]

						console.log(event.id, sizePerChild)

						const evbR = result.get(evb.id)
						if (!evbR) {
							continue
						}
						const cSize = sizesMap.get(evb.id)
						let diff = 0
						if (cSize == null || cSize > sizePerChild) {
							sizesMap.set(evb.id, sizePerChild)
							diff = Math.abs(evbR.size - sizePerChild)
							for (let k = j + 1; k < eventsIBlock.length; k++) {
								let evc = result.get(eventsIBlock[k].id)
								if (evc && evc.gridColumnStart > 1) {
									console.log("Moving", eventsIBlock[k].id, evc.gridColumnStart, diff)
									result.set(eventsIBlock[k].id, {
										...evc,
										gridColumnStart: evc.gridColumnStart + diff,
									})

									diffsMap.set(eventsIBlock[k].id, diff)
								}
							}

							console.log("Setting last column", event.id, eventsIBlock.length, j, j + 1)
							myColumn = column + diff * eventsIBlock.length
						}

						if (j === eventsIBlock.length - 1 && !diffsMap.has(eventsIBlock[j].id)) {
							let c = 0
							for (let k = 0; k < j; k++) {
								const df = diffsMap.get(eventsIBlock[k].id) ?? 0
								c += df
							}

							const ap = result.get(eventsIBlock[j].id)
							if (ap) {
								result.set(eventsIBlock[j].id, {
									...ap,
									gridColumnStart: ap.gridColumnStart + c,
								})
								diffsMap.set(eventsIBlock[j].id, c)
							}
						}
					}

					if (sizePerChild > 0) {
						span = totalColumns - sizePerChild * eventsIBlock.length
					}
				}

				if (eventsIBlock.length === 0) {
					span = totalColumns
				}

				console.log(`Last event ${event.id}`, eventsIBlock)
			}
			// if (blockers === 0) {
			//     const mapa = new Map(eventToColumn)
			//     const cl = Array.from(mapa.entries())
			//     console.log("Event2column", cl)
			//     const eventsBefore = columns.flatMap((col, index) => {
			//         if (index >= column) return []
			//         return col.events.filter((e) => e.start < event.end && e.end > event.start)
			//     })
			//
			//     let remainingSpace = totalColumns - (column + 1)
			//     while (remainingSpace > 0) {
			//         span++
			//         remainingSpace -= 1
			//
			//         for (const event of eventsBefore) {
			//             if (!remainingSpace) {
			//                 break
			//             }
			//
			//             const eventBeforeColumn = eventToColumn.get(event.id)
			//
			//             if (eventBeforeColumn != null && eventBeforeColumn < totalColumns - 1) {
			//                 // const eventIndexInsideItsColumn = columns[column].events.findIndex((ev) => ev.id === event.id)
			//
			//                 const oldRt = result.get(event.id)
			//                 if (oldRt) {
			//                     remainingSpace -= 1
			//
			//                     const obj = {
			//                         ...oldRt,
			//                         size: oldRt.size + 1,
			//                         gridColumnStart: eventToColumn.get(event.id)!
			//                     }
			//
			//                     console.log("Remaining space: ", remainingSpace, oldRt.size, oldRt.size + 1, event.id, obj)
			//                     result.set(event.id, obj)
			//                 }
			//                 // if (idx > -1 && ((column + 1) < columns.length)) {
			//                 //     columns[column].events.splice(idx, 1)
			//                 //     columns[column + 1].events.push(event)
			//                 // }
			//             }
			//         }
			//     }
			// }

			result.set(event.id, {
				start: event.start,
				end: event.end,
				gridColumnStart: myColumn + 1,
				size: span,
			})
		}

		for (const [id, size] of sizesMap.entries()) {
			const existing = result.get(id)
			if (!existing) continue

			existing.size = size
			result.set(id, existing)
		}

		return result
	}
}
