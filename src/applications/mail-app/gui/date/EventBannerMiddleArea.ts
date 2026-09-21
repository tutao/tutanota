import m, { Children, ClassComponent, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { IcsCalendarEvent } from "../../../calendar-app/calendar/export/CalendarParser"
import { Icons } from "../../../../ui/base/icons/Icons"
import { EventBannerIconWithText, EventBannerTextVariant } from "./EventBannerIconWithText"
import { EventBannerAreas } from "./EventBannerImpl"
import { formatEventDuration, formatEventTime } from "../../../calendar-app/calendar/gui/DateTimeTextFormatterUtils"
import { EventTextTimeOption } from "@tutao/app-env"

export type EventBannerMidleAreaAttrs = {
	event: IcsCalendarEvent
	calendarTimeZone: string
	replySection: Children
}

export class EventBannerMiddleArea implements ClassComponent<EventBannerMidleAreaAttrs> {
	view(vnode: Vnode<EventBannerMidleAreaAttrs>): Children {
		const { event, calendarTimeZone, replySection } = vnode.attrs

		const timeText =
			event.startTime.getFullYear() !== new Date().getFullYear()
				? formatEventDuration(event, calendarTimeZone, false)
				: formatEventTime(event, EventTextTimeOption.START_END_TIME, false, calendarTimeZone)

		return m(
			".flex.flex-column.plr-16.pb-16.pt-8.gap-8",
			{
				style: {
					gridArea: EventBannerAreas.Middle,
					color: theme.on_surface,
				},
			},
			[
				m(EventBannerIconWithText, {
					icon: Icons.ClockFilled,
					text: timeText,
					textVariant: EventBannerTextVariant.Normal,
				}),
				replySection,
			],
		)
	}
}
