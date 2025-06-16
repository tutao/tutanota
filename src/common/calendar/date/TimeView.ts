import m, { Child, Children, Component, Vnode, VnodeDOM } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Time } from "./Time"
import { clone } from "@tutao/tutanota-utils"
import { deepMemoized } from "@tutao/tutanota-utils/dist/memoized"
import { px } from "../../gui/size.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { colorForBg } from "../../gui/base/GuiUtils.js"
import { formatTime } from "../../misc/Formatter.js"

export interface AgendaEventWrapper {
	event: CalendarEvent
	conflict: boolean
	color: string
	featured: boolean
}

export interface InviteAgenda {
	before: AgendaEventWrapper | null
	after: AgendaEventWrapper | null
	current: AgendaEventWrapper
	conflictCount: number
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
export type TimeScale = 1 | 2 | 4
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
	events: Array<AgendaEventWrapper>
	/**
	 * {@link TimeScale} applied to this TimeView
	 */
	timeScale: TimeScale
	/**
	 * {@link TimeRange} used to generate the Time column and the number of time intervals/slots to position the events
	 * 0 <= start < end < 24:00
	 */
	timeRange: TimeRange
	conflictRenderPolicy: EventConflictRenderPolicy
	/**
	 * This is taken into consideration when defining the row the event is attached to
	 */
	baselineTimeForEventPositionCalculation: Time
	/**
	 * Days to render events
	 */
	dates: Array<Date>
	timeIndicator?: Time
}

export class TimeView implements Component<TimeViewAttributes> {
	private timeRowHeight?: number

	/*
	 * Must filter the array to get events using the same logic from conflict detection
	 * But instead of event start and end we use range start end
	 */
	view({ attrs }: Vnode<TimeViewAttributes>) {
		const { timeScale, timeRange, events, conflictRenderPolicy, baselineTimeForEventPositionCalculation, dates, timeIndicator } = attrs
		const timeColumnIntervals = this.createTimeColumnIntervals(timeScale, timeRange)

		const subRowCount = 12 * timeColumnIntervals.length
		const subRowAsMinutes = TIME_SCALE_BASE_VALUE / timeScale / 12

		return m(
			".grid.overflow-hidden", // mini-agenda
			{
				style: {
					"grid-template-columns": `auto repeat(${dates.length}, 1fr)`,
				},
				oninit: (vnode: VnodeDOM) => {
					if (this.timeRowHeight == null) {
						window.requestAnimationFrame(() => {
							this.timeRowHeight = Number.parseFloat(window.getComputedStyle(vnode.dom).height.replaceAll("px", "")) / subRowCount
							m.redraw()
						})
					}
				}
			},
			[
				this.buildTimeColumn(timeColumnIntervals), // Time column
				dates.map((date) => {
					return m(
						".grid.plr-unit.gap.z1.grid-auto-columns.rel",
						{
							oncreate(vnode): any {
								;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(${subRowCount}, 1fr)`
							},
						},
						[
							this.buildTimeIndicator(timeRange, subRowAsMinutes, timeIndicator),
							this.buildEventsColumn(events, timeRange, subRowAsMinutes, conflictRenderPolicy, subRowCount, timeScale, date),
						],
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
				position: "absolute",
				background: theme.content_accent,
				height: px(2),
				width: "100%",
				display: this.timeRowHeight == null ? "none" : "initial"
			}
		})
	}

	private createTimeColumnIntervals(timeScale: TimeScale, timeRange: TimeRange): Array<string> {
		let timeInterval = TIME_SCALE_BASE_VALUE / timeScale
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeInterval) / timeInterval
		const timeKeys = []

		for (let i = 0; i < numberOfIntervals; i++) {
			const agendaRowTime = clone(timeRange.start).add({ minutes: timeInterval * i })

			timeKeys.push(formatTime(agendaRowTime.toDate()))
		}

		return timeKeys
	}

	private buildTimeColumn = deepMemoized((times: Array<string>): Child => {
		return m(
			".grid",
			{
				style: {
					"grid-template-rows": `repeat(${times.length}, 1fr)`,
				},
			},
			times.map((time, index) =>
				m(
					".flex.ptb-button-double.small.pr-vpad-s.border-right.rel.items-center",
					{
						class: index !== times.length - 1 ? "after-as-border-bottom" : "",
					},
					time,
				),
			),
		)
	})

	private buildEventsColumn = deepMemoized(
		(
			agendaEntries: Array<AgendaEventWrapper>,
			timeRange: TimeRange,
			subRowAsMinutes: number,
			conflictRenderPolicy: EventConflictRenderPolicy,
			subRowCount: number,
			timeScale: TimeScale,
			baseDate: Date,
		): Children => {
			const timeRangeAsDate = {
				start: timeRange.start.toDate(baseDate),
				end: timeRange.end.toDate(baseDate),
			}

			return agendaEntries.map((event, _, events) => {
				const { start, end } = this.getRowPosition(event.event, timeRange, subRowAsMinutes, subRowCount, timeScale, baseDate)
				const hasAnyConflict = events.some((ev) => ev.conflict)

				return m(
					// EventBubble
					".border-radius.text-ellipsis-multi-line.p-xsm.on-success-container-color.small",
					{
						style: {
							"min-height": px(0),
							"min-width": px(0),
							"grid-column": conflictRenderPolicy === EventConflictRenderPolicy.OVERLAP ? 1 : undefined,
							background: event.color,
							color: !event.featured ? colorForBg(event.color) : undefined,
							"grid-row": `${start} / ${end}`,
							"border-bottom-left-radius": event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
							"border-bottom-right-radius": event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
							"border-top-left-radius": event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
							"border-top-right-radius": event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
							border: event.featured ? `1.5px dashed ${theme.on_success_container_color}` : "none",
							"border-top": event.event.startTime < timeRangeAsDate.start ? "none" : undefined,
							"border-bottom": event.event.endTime > timeRangeAsDate.end ? "none" : undefined,
							"-webkit-line-clamp": 2,
						},
					},
					event.featured
						? m(".flex.items-start", [
							m(Icon, {
								icon: hasAnyConflict ? Icons.ExclamationMark : Icons.Checkmark,
								container: "div",
								class: "mr-xxs",
								size: IconSize.Normal,
								style: {
									fill: hasAnyConflict ? theme.on_error_container_color : theme.on_success_container_color,
								},
							}),
							m(".text-wrap.b.text-ellipsis-multi-line", { style: { "-webkit-line-clamp": 2 } }, event.event.summary),
						])
						: event.event.summary,
				)
			})
		},
	)

	private getRowPosition(event: CalendarEvent, timeRange: TimeRange, subRowAsMinutes: number, subRowCount: number, timeScale: TimeScale, baseDate: Date) {
		let timeInterval = TIME_SCALE_BASE_VALUE / timeScale

		const startTimeSpan = timeRange.start.diff(Time.fromDate(event.startTime))
		const start =
			event.startTime < baseDate || timeRange.start.isAfter(Time.fromDate(event.startTime)) ? 1 : Math.floor(startTimeSpan / subRowAsMinutes) + 1

		const endTimeSpan = timeRange.start.diff(Time.fromDate(event.endTime))
		const end = Math.min(Math.floor(endTimeSpan / subRowAsMinutes) + 1, subRowCount + 1)

		return { start, end }
	}
}
