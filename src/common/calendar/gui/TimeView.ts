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
					"grid-template-rows": `auto 1fr`, // FIXME add support to alldays and big evs
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
				// Body - days,events
				m(
					".grid",
					{
						style: {
							"grid-column": "1 / -1",
							"grid-row-start": 2,
							"grid-template-columns": "subgrid",
							"overflow-x": "hidden",
						},
					},
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
								this.buildEventsColumn(events, timeRange, subRowAsMinutes, conflictRenderPolicy, subRowCount, timeScale, date, hasAnyConflict),
							],
						)
					}),
				),
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

	private buildEventsColumn = deepMemoized(
		(
			agendaEntries: Array<TimeViewEventWrapper>,
			timeRange: TimeRange,
			subRowAsMinutes: number,
			conflictRenderPolicy: EventConflictRenderPolicy,
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

				const { start, end } = this.getRowBounds(event.event.event, timeRange, subRowAsMinutes, subRowCount, timeScale, baseDate)

				return [
					m(
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
								"border-top-left-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-top-right-radius": event.event.event.startTime < timeRangeAsDate.start ? "0" : undefined,
								"border-bottom-left-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								"border-bottom-right-radius": event.event.event.endTime > timeRangeAsDate.end ? "0" : undefined,
								border: event.featured ? `1.5px dashed ${hasAnyConflict ? theme.on_warning_container : theme.on_success_container}` : "none",
								"border-top": event.event.event.startTime < timeRangeAsDate.start ? "none" : undefined,
								"border-bottom": event.event.event.endTime > timeRangeAsDate.end ? "none" : undefined,
								"-webkit-line-clamp": 2,
							},
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

	private getRowBounds(event: CalendarEvent, timeRange: TimeRange, subRowAsMinutes: number, subRowCount: number, timeScale: TimeScale, baseDate: Date) {
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
}
