import m, { Children, Component, Vnode } from "mithril"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils.js"
import { formatEventTimes } from "../date/CalendarUtils.js"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { stateBgHover } from "../../gui/builtinThemes.js"
import { theme } from "../../gui/theme.js"
import { styles } from "../../gui/styles.js"
import { DefaultAnimationTime } from "../../gui/animation/Animations.js"

interface CalendarAgendaItemViewAttrs {
	day: Date
	zone: string
	event: CalendarEvent
	color: string
	click: (domEvent: MouseEvent) => unknown
	selected?: boolean
}

export class CalendarAgendaItemView implements Component<CalendarAgendaItemViewAttrs> {
	view({ attrs }: Vnode<CalendarAgendaItemViewAttrs>): Children {
		return m(
			".flex.items-center.gap-vpad.click.plr.border-radius.pt-s.pb-s",
			{
				class: styles.isDesktopLayout() ? "" : "state-bg",
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
				m(".flex.col", [m(".b", attrs.event.summary), m("", formatEventTimes(attrs.day, attrs.event, attrs.zone, isAllDayEvent(attrs.event)))]),
			],
		)
	}
}
