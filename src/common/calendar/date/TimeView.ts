import m, { Component, Vnode } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { px } from "../../gui/size.js"
import { DateTime } from "luxon"
import { MiniAgendaRow } from "./MiniAgendaRow"

interface InviteAgendaEvent {
	event: CalendarEvent
	conflict: boolean
}

export interface InviteAgenda {
	before: InviteAgendaEvent | null
	after: InviteAgendaEvent | null
	current: CalendarEvent | null
	conflictCount: number
}

interface TimeViewAttributes {
	agenda: InviteAgenda
	event: CalendarEvent
}

export class TimeView implements Component<TimeViewAttributes> {
	view({ attrs }: Vnode<TimeViewAttributes>) {
		const agenda = attrs.agenda
		const hasConflict = agenda.before?.conflict || agenda.after?.conflict

		return m(
			"", // mini-agenda
			{
				style: {
					display: "grid",
					overflow: "hidden",
					"grid-template-columns": "1fr",
					"grid-template-rows": "46px 46px 46px",
				},
			},
			[
				m(MiniAgendaRow, { time: "09:00 PM", events: [] }, [
					m("span", "09:00 P.M"),
					m(
						"",
						{
							style: {
								display: "grid",
							},
							oncreate(vnode): any {
								const rowHeight = vnode.dom.parentElement?.clientHeight ?? 0
								const subRowHeight = rowHeight / 12
								;(vnode.dom as HTMLElement).style.gridTemplateRows = `repeat(12, ${subRowHeight}px)`
							},
						},
						[
							m(
								"",
								{
									style: {
										background: "red",
									},
									oncreate: (node) => {
										const height = node.dom.parentElement?.parentElement?.clientHeight ?? 0
										const ev = attrs.event

										const element = node.dom as HTMLElement
										const timeDiff = Math.abs(DateTime.fromJSDate(ev.startTime).diff(DateTime.fromJSDate(ev.endTime), "hours").hours)

										element.style.height = px(height * timeDiff)
										element.style.maxHeight = px(height * 3)
										console.log(Math.floor(ev.startTime.getMinutes() / height / 12))
										element.style.gridRow = `${Math.floor(ev.startTime.getMinutes() / (height / 12))}`
									},
								},
								"My event",
							),
							m(
								"",
								{
									style: {
										background: "blue",
									},
									oncreate: (node) => {
										const height = node.dom.parentElement?.parentElement?.clientHeight ?? 0
										const ev = attrs.event

										const element = node.dom as HTMLElement
										const timeDiff = Math.abs(DateTime.fromJSDate(ev.startTime).diff(DateTime.fromJSDate(ev.endTime), "hours").hours)

										element.style.height = px(height * timeDiff)
										element.style.maxHeight = px(height * 3)
										console.log(Math.floor(ev.startTime.getMinutes() / height / 12))
										element.style.gridRow = `${Math.floor(ev.startTime.getMinutes() / (height / 12))}`
									},
								},
								"My event2",
							),
						],
					),
				]),
				m(
					"",
					{
						style: {
							display: "grid",
							"grid-template-columns": "auto 1fr",
						},
					},
					[m("span", "10:00 P.M"), m("")],
				),
				m(
					"",
					{
						style: {
							display: "grid",
							"grid-template-columns": "auto 1fr",
						},
					},
					[m("span", "11:00 P.M"), m("")],
				),
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
}
