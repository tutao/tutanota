import m, { Children, Component, Vnode } from "mithril"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { stateBgHover } from "../../gui/builtinThemes.js"
import { theme } from "../../gui/theme.js"
import { styles } from "../../gui/styles.js"
import { DefaultAnimationTime } from "../../gui/animation/Animations.js"
import { px } from "../../gui/size.js"

export interface CalendarAgendaItemViewAttrs {
	day: Date
	zone: string
	event: CalendarEvent
	color: string
	click: (domEvent: MouseEvent) => unknown
	timeText: string
	selected?: boolean
	height?: number
}

export class CalendarAgendaItemView implements Component<CalendarAgendaItemViewAttrs> {
	view({ attrs }: Vnode<CalendarAgendaItemViewAttrs>): Children {
		return [
			m(
				".flex.items-center.click.plr.border-radius.pt-s.pb-s.rel.limit-width.full-width",
				{
					class: styles.isDesktopLayout() ? "" : "state-bg",
					onclick: attrs.click,
					style: {
						transition: `background ${DefaultAnimationTime}ms`,
						background: styles.isDesktopLayout() ? (attrs.selected ? stateBgHover : theme.list_bg) : undefined,
						height: attrs.height ? px(attrs.height) : undefined,
					},
				},
				[
					m(".icon.circle.abs", {
						style: {
							backgroundColor: `#${attrs.color}`,
						},
					}),
					m(".flex.col.min-width-0.pl-vpad-l", [m("p.b.m-0.text-ellipsis", attrs.event.summary), m("", attrs.timeText)]),
				],
			),
		]
	}
}
