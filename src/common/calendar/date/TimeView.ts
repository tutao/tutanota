import m, { Child, Children, Component, Vnode } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { Time } from "./Time"
import { clone } from "@tutao/tutanota-utils"

interface AgendaEventWrapper {
	event: CalendarEvent
	conflict: boolean
}

export interface InviteAgenda {
	before: AgendaEventWrapper | null
	after: AgendaEventWrapper | null
	current: AgendaEventWrapper
	conflictCount: number
}

const TIME_SCALE_BASE_VALUE = 60
/**
 * {@link TIME_SCALE_BASE_VALUE} / {@link TimeScale} = Time interval applied to the agenda time column
 * @example
 * const scale1: TimeScale = 1
 * const intervalOf60Minutes = TIME_SCALE_BASE_VALUE / timeScale1
 *
 * const scale2: TimeScale = 2
 * const intervalOf30Minutes = TIME_SCALE_BASE_VALUE / timeScale2
 *
 * const scale3: TimeScale = 3
 * const intervalOf15Minutes = TIME_SCALE_BASE_VALUE / timeScale3
 * */
type TimeScale = 1 | 2 | 4
type TimeRange = {
	start: Time
	end: Time
}

export interface TimeViewAttributes {
	events: Array<AgendaEventWrapper>
	timeScale: TimeScale
	/**
	 * Range used to generate the Time column and the number of time intervals/slots to position the events
	 * 0 <= start < end < 24:00
	 */
	timeRange: TimeRange
	// FIXME define conflict rendering policy (e.g overlap or parallel)
}

type AgendaData = Map<string, Array<AgendaEventWrapper>>

export class TimeView implements Component<TimeViewAttributes> {
	view({ attrs }: Vnode<TimeViewAttributes>) {
		const { timeScale, timeRange, events } = attrs
		const rowHeight = 46
		const miniAgendaData: AgendaData = this.organizeAgenda(timeScale, timeRange, events)

		console.log({ attrs, miniAgendaData })

		return m(
			".grid.overflow-hidden", // mini-agenda
			{
				style: {
					"grid-template-columns": "auto 1fr",
				},
			},
			[
				this.buildTimeColumn(Array.from(miniAgendaData.keys()), rowHeight, miniAgendaData.size), // Time column
				m(
					".grid",
					{
						oncreate(vnode): any {
							const subRowCount = 12 * miniAgendaData.size
							const subRowHeight = rowHeight / 12
							;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(${subRowCount}, ${subRowHeight}px)`
						},
					},
					this.buildColumns(Array.from(miniAgendaData.values()).flat()),
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

	private organizeAgenda(timeScale: TimeScale, timeRange: TimeRange, events: Array<AgendaEventWrapper>): AgendaData {
		let timeInterval = TIME_SCALE_BASE_VALUE / timeScale
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + 60) / timeInterval
		const agendaData: AgendaData = new Map()

		console.log(timeRange, numberOfIntervals)

		for (let i = 0; i < numberOfIntervals; i++) {
			const agendaRowTime = clone(timeRange.start).add({ minutes: timeInterval * i })
			const timeKey = agendaRowTime.toString(true)

			const lowerBoundTime = clone(agendaRowTime)
			const upperBound = agendaRowTime.add({ minutes: timeInterval })

			const eventsAtCurrentInterval = events.filter(({ event }) => {
				const baseDate = event.startTime
				const lowerBound = lowerBoundTime.toDate(baseDate).getTime()
				return event.startTime.getTime() >= lowerBound && event.startTime.getTime() < upperBound.toDate(baseDate).getTime()
			})

			agendaData.set(timeKey, eventsAtCurrentInterval)
		}

		return agendaData
	}

	private buildTimeColumn(times: Array<string>, rowHeight: number, numberOfIntervals: number): Child {
		return m(
			".grid",
			{
				style: {
					"grid-template-rows": `repeat(${numberOfIntervals}, ${rowHeight}px)`,
				},
			},
			times.map((time) => m(".flex.items-center", time)),
		)
	}

	private buildColumns(agendaEntries: Array<AgendaEventWrapper>): Children {
		let columns: Children = null

		return columns
	}
}
