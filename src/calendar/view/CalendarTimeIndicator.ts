import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../gui/size.js"

export type CalendarTimeIndicatorAttrs = {}

/**
 * Indicator used for indicating the current time relative to the current date in the calendar view.
 */
export class CalendarTimeIndicator implements Component<CalendarTimeIndicatorAttrs> {
	view({ attrs }: Vnode<CalendarTimeIndicatorAttrs>): Children {
		return m(
			".accent-bg.rel",
			{
				"aria-hidden": "true",
				style: {
					height: px(size.calendar_day_event_padding),
				},
			},
			m(`.circle.icon-small.accent-bg.abs`, {
				"aria-hidden": "true",
				style: {
					top: "-5px",
					left: "-6.5px",
				},
			}),
		)
	}
}
