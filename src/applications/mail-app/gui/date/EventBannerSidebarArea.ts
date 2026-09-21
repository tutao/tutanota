import m, { Children, ClassComponent, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { IcsCalendarEvent } from "../../../calendar-app/calendar/export/CalendarParser"

export type EventBannerSidebarAreaAttrs = {
	event: IcsCalendarEvent
}

export class EventBannerSidebarArea implements ClassComponent<EventBannerSidebarAreaAttrs> {
	view(vnode: Vnode<EventBannerSidebarAreaAttrs>): Children {
		const { event } = vnode.attrs
		return m(
			".flex.flex-column.center.items-center.pb-16.pt-16.justify-center.fill-grid-column",
			{
				class: "pr-32 pl-32",
				style: {
					gridArea: "sidebar",
					"background-color": theme.surface_container_high,
					color: theme.on_surface,
				},
			},
			[
				m("span.normal-font-size", event.startTime.toLocaleString("default", { month: "short" })),
				m("span.big.b.lh-s", event.startTime.getDate().toString().padStart(2, "0")),
				m("span.normal-font-size", event.startTime.toLocaleString("default", { weekday: "short" })),
			],
		)
	}
}
