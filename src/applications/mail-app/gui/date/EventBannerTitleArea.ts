import m, { Children, ClassComponent, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { Icons } from "../../../../ui/base/icons/Icons"
import { EventBannerIconWithText, EventBannerTextVariant } from "./EventBannerIconWithText"
import { EventBannerAreas } from "./EventBannerImpl"

export type EventBannerTitleAreaAttrs = {
	eventTitle: string
}

export class EventBannerTitleArea implements ClassComponent<EventBannerTitleAreaAttrs> {
	view(vnode: Vnode<EventBannerTitleAreaAttrs>): Children {
		const { eventTitle } = vnode.attrs
		return m(
			".flex.plr-16.pb-8.pt-16",
			{
				style: {
					gridArea: EventBannerAreas.Title,
					color: theme.on_surface,
				},
			},
			m(EventBannerIconWithText, {
				icon: Icons.CalendarFilled,
				text: eventTitle,
				textVariant: EventBannerTextVariant.Large,
			}),
		)
	}
}
