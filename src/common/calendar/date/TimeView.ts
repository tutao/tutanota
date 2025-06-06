import m, { Component, Vnode } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { MiniAgendaRow, MiniAgendaRowAttributes } from "./MiniAgendaRow"

interface InviteAgendaEvent {
	time: number
	event: CalendarEvent | null
	conflict: boolean
}

export interface InviteAgenda {
	before: InviteAgendaEvent
	after: InviteAgendaEvent
	current: InviteAgendaEvent
	conflictCount: number
}

interface TimeViewAttributes {
	agenda: InviteAgenda
	event: CalendarEvent
}

export class TimeView implements Component<TimeViewAttributes> {
	view({ attrs }: Vnode<TimeViewAttributes>) {
		const agenda = attrs.agenda

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
				m(MiniAgendaRow, {
					time: agenda.before.time,
					events: agenda.before.event ? [agenda.before.event] : [],
				} satisfies MiniAgendaRowAttributes),
				m(MiniAgendaRow, {
					time: agenda.current.time,
					events: agenda.current.event ? [agenda.current.event] : [],
				} satisfies MiniAgendaRowAttributes),
				m(MiniAgendaRow, {
					time: agenda.after.time,
					events: agenda.after.event ? [agenda.after.event] : [],
				} satisfies MiniAgendaRowAttributes),
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
