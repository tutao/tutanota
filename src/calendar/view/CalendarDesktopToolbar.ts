import { CalendarNavConfiguration } from "./CalendarGuiUtils.js"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../gui/theme.js"

type CalendarDesktopToolbarAttrs = { navConfig: CalendarNavConfiguration }

export class CalendarDesktopToolbar implements Component<CalendarDesktopToolbarAttrs> {
	view({ attrs }: Vnode<CalendarDesktopToolbarAttrs>): Children {
		const { navConfig } = attrs
		return m(".flex.row.items-center.content-bg.border-radius-top-left-big", [
			m(".flex.pt-xs.pb-xs", [navConfig.back ?? m(".button-width-fixed"), navConfig.forward ?? m(".button-width-fixed")]),
			m("h1", navConfig.title),
			navConfig.week && this.renderWeekNumberLabel(navConfig.week),
			m(".flex-grow"),
		])
	}

	private renderWeekNumberLabel(label: string): Children {
		return m(
			".ml-m.small.font-weight-600",
			{
				style: {
					padding: "2px 8px",
					backgroundColor: theme.list_alternate_bg,
				},
			},
			label,
		)
	}
}
