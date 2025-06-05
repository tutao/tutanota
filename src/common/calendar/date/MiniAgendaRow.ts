import m, { Component, Vnode } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs"
import { DateTime } from "luxon"
import { px } from "../../gui/size"

interface MiniAgendaRowAttributes {
	time: number
	events: Array<CalendarEvent>
}

export class MiniAgendaRow implements Component<MiniAgendaRowAttributes> {
	view({ attrs }: Vnode<MiniAgendaRowAttributes>) {
		m(
			"", // mini-agenda-row
			{
				style: {
					"min-height": "0",
					display: "grid",
					"grid-template-columns": "auto 1fr",
				},
			},
			[
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
									const ev = attrs.events[0]

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
			],
		)
	}
}
