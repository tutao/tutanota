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
	limitSummaryWidth?: boolean
	selected?: boolean
	height?: number
}

export class CalendarAgendaItemView implements Component<CalendarAgendaItemViewAttrs> {
	view({ attrs }: Vnode<CalendarAgendaItemViewAttrs>): Children {
		return [
			m(
				".flex.items-center.gap-vpad.click.plr.border-radius.pt-s.pb-s.rel",
				{
					class: (styles.isDesktopLayout() ? "" : "state-bg") + (attrs.limitSummaryWidth ? "limit-width full-width" : ""),
					onclick: attrs.click,
					style: {
						transition: `background ${DefaultAnimationTime}ms`,
						background: styles.isDesktopLayout() ? (attrs.selected ? stateBgHover : theme.list_bg) : undefined,
						height: attrs.height ? px(attrs.height) : undefined,
					},
				},
				[
					m(".icon.circle", {
						style: {
							backgroundColor: `#${attrs.color}`,
						},
					}),
					m(".flex.col", { class: attrs.limitSummaryWidth ? "min-width-0" : "" }, [
						m("p.b.m-0", { class: attrs.limitSummaryWidth ? "text-ellipsis" : "" }, attrs.event.summary),
						m("", attrs.timeText),
					]),
				],
			),
		]
	}
}
