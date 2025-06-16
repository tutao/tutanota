import m, { Component, Vnode } from "mithril"
import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs"
import { DateTime } from "luxon"
import { px } from "../../gui/size"
import { formatShortTime, formatTime } from "../../misc/Formatter.js"
import { styles } from "../../gui/styles.js"
import { generateRandomColor } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"

export interface MiniAgendaRowAttributes {
	time: number
	events: Array<CalendarEvent>
}

export class MiniAgendaRow implements Component<MiniAgendaRowAttributes> {
	view({ attrs }: Vnode<MiniAgendaRowAttributes>) {
		return m(
			"", // mini-agenda-row
			{
				style: {
					"min-height": "0",
					display: "grid",
					"grid-template-columns": "auto 1fr",
				},
			},
			[
				m("span", styles.isDesktopLayout() ? formatTime(new Date(attrs.time)) : formatShortTime(new Date(attrs.time))),
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
						attrs.events.map((ev) => {
							return m(
								"",
								{
									style: {
										background: generateRandomColor(),
									},
									oncreate: (node) => {
										const height = node.dom.parentElement?.parentElement?.clientHeight ?? 0

										const element = node.dom as HTMLElement
										const timeDiff = Math.abs(DateTime.fromJSDate(ev.startTime).diff(DateTime.fromJSDate(ev.endTime), "hours").hours)

										element.style.height = px(height * timeDiff)
										element.style.maxHeight = px(height * 3)

										element.style.gridRow = `${Math.floor(ev.startTime.getMinutes() / (height / 12))}`
									},
								},
								ev.summary,
							)
						}),
					],
				),
			],
		)
	}
}
