import m, { Children, ClassComponent, Vnode } from "mithril"
import { Time } from "../date/Time"
import { px, size } from "../../gui/size"

export enum TimeBadgeVarient {
	SMALL,
	LARGE,
}

export interface TimeBadgeAttrs {
	currentTime: Time
	amPm: boolean
	variant: TimeBadgeVarient
}

/**
 * Renders a time indicator line without
 */
export class TimeBadge implements ClassComponent<TimeBadgeAttrs> {
	view({ attrs }: Vnode<TimeBadgeAttrs>): Children {
		const formatedTime = attrs.currentTime.toString(attrs.amPm ? { withAmPmSuffix: false } : undefined)

		return m(
			".time-badge.small.text-center.fit-content",
			{
				"aria-hidden": "true",
				style: {
					padding: `${px(2)} ${px(attrs.variant === TimeBadgeVarient.SMALL ? size.spacing_4 : size.spacing_8)}`,
				},
			},
			formatedTime,
		)
	}
}
