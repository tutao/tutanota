import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../../common/gui/size.js"

export type CalendarTimeIndicatorAttrs = {
	/** Make the circle tangent to the left side of the line rather than intersecting it */
	circleLeftTangent?: boolean
}

/**
 * Indicator used for indicating the current time relative to the current date in the calendar view.
 */
export class CalendarTimeIndicator implements Component<CalendarTimeIndicatorAttrs> {
	view({ attrs }: Vnode<CalendarTimeIndicatorAttrs>): Children {
		const iconRadius = size.icon_size_small / 2
		const leftOffset = attrs.circleLeftTangent ? 0 : -iconRadius
		return m(
			".accent-bg",
			{
				"aria-hidden": "true",
				style: {
					height: px(size.calendar_day_event_padding),
				},
			},
			m(`.circle.icon-small.accent-bg`, {
				"aria-hidden": "true",
				style: {
					translate: `${px(leftOffset)} ${px(-5)}`,
				},
			}),
		)
	}
}
