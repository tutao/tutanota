import m, { Children, Component, Vnode } from "mithril"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { stateBgHover } from "../../gui/builtinThemes.js"
import { theme } from "../../gui/theme.js"
import { styles } from "../../gui/styles.js"
import { DefaultAnimationTime } from "../../gui/animation/Animations.js"

export interface CalendarAgendaItemViewAttrs {
	day: Date
	zone: string
	event: CalendarEvent
	color: string
	click: (domEvent: MouseEvent) => unknown
	timeText: string
	wrapSummary?: boolean
	selected?: boolean
}

export class CalendarAgendaItemView implements Component<CalendarAgendaItemViewAttrs> {
	view({ attrs }: Vnode<CalendarAgendaItemViewAttrs>): Children {
		return m(
			".flex.items-center.gap-vpad.click.plr.border-radius.pt-s.pb-s",
			{
				class: (styles.isDesktopLayout() ? "" : "state-bg") + (attrs.wrapSummary ? "limit-width full-width" : ""),
				onclick: attrs.click,
				style: {
					transition: `background ${DefaultAnimationTime}ms`,
					background: styles.isDesktopLayout() ? (attrs.selected ? stateBgHover : theme.list_bg) : undefined,
				},
			},
			[
				m("", {
					style: {
						minWidth: "16px",
						minHeight: "16px",
						borderRadius: "50%",
						backgroundColor: `#${attrs.color}`,
					},
				}),
				m(".flex.col", { class: attrs.wrapSummary ? "min-width-0" : "" }, [
					m("p.b.m-0", { class: attrs.wrapSummary ? "text-ellipsis" : "" }, attrs.event.summary),
					m("", attrs.timeText),
				]),
			],
		)
	}
}
