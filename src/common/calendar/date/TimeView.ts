import m, { Child, Children, Component, Vnode } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Time } from "./Time"
import { clone } from "@tutao/tutanota-utils"
import { deepMemoized } from "@tutao/tutanota-utils/dist/memoized"
import { px } from "../../gui/size.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"

interface AgendaEventWrapper {
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
}

export class TimeView implements Component<TimeViewAttributes> {
	/*
	 * Must filter the array to get events using the same logic from conflict detection
	 * But instead of event start and end we use range start end
	 */
	view({ attrs }: Vnode<TimeViewAttributes>) {
		const { timeScale, timeRange, events, conflictRenderPolicy, baselineTimeForEventPositionCalculation } = attrs
		const timeColumnIntervals = this.createTimeColumnIntervals(timeScale, timeRange)

		const subRowCount = 12 * timeColumnIntervals.length
		const subRowAsMinutes = 60 / timeScale / 12

		return m(
			".grid.overflow-hidden", // mini-agenda
			{
				style: {
					"grid-template-columns": "auto 1fr",
				},
			},
			[
				this.buildTimeColumn(timeColumnIntervals), // Time column
				m(
					".grid.pr-xs.pl-xs.gap.z1",
					{
						oncreate(vnode): any {
							;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(${subRowCount}, 1fr)`
						},
					},
					this.buildEventsColumns(
						events,
						timeRange,
						subRowAsMinutes,
						conflictRenderPolicy,
						subRowCount,
						timeScale,
						baselineTimeForEventPositionCalculation,
					),
				), // Events
				// m(MiniAgendaRow, {
				// 	time: beforeTime,
				// 	events: beforeEvents,
				// } satisfies MiniAgendaRowAttributes),
				// m(MiniAgendaRow, {
				// 	time: middleTime,
				// 	events: duringEvents,
				// } satisfies MiniAgendaRowAttributes),
				// m(MiniAgendaRow, {
				// 	time: afterTime,
				// 	events: afterEvents,
				// } satisfies MiniAgendaRowAttributes),
			],
		)

		// return m(
		// 	".flex.flex-column.plr-vpad.pb.pt.justify-start.border-nota",
		// 	{
		// 		class: styles.isSingleColumnLayout() ? "border-sm border-left-none border-right-none border-bottom-none" : "border-left-sm",
		// 	},
		// 	[
		// 		m(".flex.flex-column", [
		// 			m(".flex", [
		// 				m(Icon, {
		// 					icon: Icons.Time,
		// 					container: "div",
		// 					class: "mr-xsm mt-xxs",
		// 					style: { fill: theme.content_button },
		// 					size: IconSize.Medium,
		// 				}),
		// 				m("span.b.h5", "Overview"),
		// 			]),
		// 			m(".flex.items-center", [
		// 				m(Icon, {
		// 					icon: hasConflict ? Icons.AlertCircle : Icons.CheckCircleFilled,
		// 					container: "div",
		// 					class: "mr-xsm mt-xxs",
		// 					style: { fill: hasConflict ? theme.error_color : "#39D9C1" }, //FIXME add the success color to theme
		// 					size: IconSize.Medium,
		// 				}),
		// 				m("span.small.text-fade", hasConflict ? `${agenda.conflictCount} simultaneous events` : "No simultaneous events"), //FIXME Translations
		// 			]),
		// 		]),
		// 		m(".flex.flex-column.mt-m", [
		// 			m(
		// 				"span.text-fade",
		// 				agenda.before
		// 					? `${agenda.before.event.startTime.toLocaleString("default", {
		// 						hour: "2-digit",
		// 						minute: "2-digit",
		// 					})} - ${agenda.before.event.endTime.toLocaleString("default", {
		// 						hour: "2-digit",
		// 						minute: "2-digit",
		// 					})} ${agenda.before.event.summary}${agenda.before.conflict ? " (Conflict)" : ""}`
		// 					: "No events before",
		// 			), //FIXME Add translation
		// 			m(
		// 				"span",
		// 				`${attrs.event.startTime.toLocaleString("default", {
		// 					hour: "2-digit",
		// 					minute: "2-digit",
		// 				})} - ${attrs.event.endTime.toLocaleString("default", {
		// 					hour: "2-digit",
		// 					minute: "2-digit",
		// 				})} ${attrs.event.summary}`,
		// 			),
		// 			m(
		// 				"span.text-fade",
		// 				agenda.after
		// 					? `${agenda.after.event.startTime.toLocaleString("default", {
		// 						hour: "2-digit",
		// 						minute: "2-digit",
		// 					})} - ${agenda.after.event.endTime.toLocaleString("default", {
		// 						hour: "2-digit",
		// 						minute: "2-digit",
		// 					})} ${agenda.after.event.summary}${agenda.after.conflict ? " (Conflict)" : ""}`
		// 					: "No events before",
		// 			), //FIXME Add translation
		// 		]),
		// 	],
		// )
	}

	private createTimeColumnIntervals(timeScale: TimeScale, timeRange: TimeRange): Array<string> {
		let timeInterval = TIME_SCALE_BASE_VALUE / timeScale
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeInterval) / timeInterval
		const timeKeys = []

		for (let i = 0; i < numberOfIntervals; i++) {
			const agendaRowTime = clone(timeRange.start).add({ minutes: timeInterval * i })
			const timeKey = agendaRowTime.toString(true) // FIXME Respect user decision

			const lowerBoundTime = clone(agendaRowTime)
			const upperBound = agendaRowTime.add({ minutes: timeInterval })
			timeKeys.push(timeKey)
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
					".flex.ptb-button-double.small.pr-vpad-s.border-right.rel",
					{
						class: index !== times.length - 1 ? "after-as-border-bottom" : "",
					},
					time,
				),
			),
		)
	})

	private buildEventsColumns = deepMemoized(
		(
			agendaEntries: Array<AgendaEventWrapper>,
			timeRange: TimeRange,
			subRowAsMinutes: number,
			conflictRenderPolicy: EventConflictRenderPolicy,
			subRowCount: number,
			timeScale: TimeScale,
			focusedTime: Time,
		): Children => {
			console.log({
				agendaEntries,
				timeRange,
				subRowAsMinutes,
				conflictRenderPolicy,
				subRowCount,
				timeScale,
				focusedTime,
			})
			return agendaEntries.map((event, _, events) => {
				const { start, end } = this.getRowPosition(event.event, timeRange, subRowAsMinutes, subRowCount, timeScale)
				const hasAnyConflict = events.some((ev) => ev.conflict)
				return m(
					// EventBubble
					".border-radius-small.text-ellipsis",
					{
						style: {
							"min-height": px(0),
							"min-width": px(0),
							"grid-column": conflictRenderPolicy === EventConflictRenderPolicy.OVERLAP ? 1 : undefined,
							background: event.color,
							"grid-row": `${start} / ${end}`,
							"border-bottom-left-radius": Time.fromDate(event.event.endTime).isAfter(timeRange.end) ? "0" : undefined,
							"border-bottom-right-radius": Time.fromDate(event.event.endTime).isAfter(timeRange.end) ? "0" : undefined,
							"border-top-left-radius": Time.fromDate(event.event.startTime).isBefore(timeRange.start) ? "0" : undefined,
							"border-top-right-radius": Time.fromDate(event.event.startTime).isBefore(timeRange.start) ? "0" : undefined,
							border: event.featured ? "2px dashed #013E85" : "none",
							"border-top": Time.fromDate(event.event.startTime).isBefore(timeRange.start) ? "none" : undefined,
							"border-bottom": Time.fromDate(event.event.endTime).isAfter(timeRange.end) ? "none" : undefined,
						},
					},
					event.featured
						? m(".flex.items-center", [
								m(Icon, {
									icon: hasAnyConflict ? Icons.Warning : Icons.Checkmark,
									container: "div",
									class: "mr-xsm mt-xxs",
									size: IconSize.Medium,
								}),
								m("span.b.text-ellipsis", event.event.summary),
						  ])
						: event.event.summary,
				)
			})
		},
	)

	private getRowPosition(event: CalendarEvent, timeRange: TimeRange, subRowAsMinutes: number, subRowCount: number, timeScale: TimeScale) {
		let timeInterval = TIME_SCALE_BASE_VALUE / timeScale

		const startTimeSpan = timeRange.start.diff(Time.fromDate(event.startTime))
		const start = Math.floor(startTimeSpan / subRowAsMinutes) + 1

		const endTimeSpan = timeRange.start.diff(Time.fromDate(event.endTime))
		const end = Math.min(Math.floor(endTimeSpan / subRowAsMinutes) + 1, subRowCount)

		return { start, end }
	}
}
