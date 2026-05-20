import m, { Children, ClassComponent, Vnode } from "mithril"
import { Time } from "../date/Time"

export enum TimeBadgeVarient {
	SMALL,
	LARGE,
}

export interface TimeBadgeAttrs {
	currentTime: Time
	amPm: boolean
	variant: TimeBadgeVarient
}

export class TimeBadge implements ClassComponent<TimeBadgeAttrs> {
	view({ attrs }: Vnode<TimeBadgeAttrs>): Children {
		const formatedTime = attrs.currentTime.toString(attrs.amPm ? { withAmPmSuffix: false } : undefined)

		return m(
			".time-badge.small.text-center.fit-content",
			{
				"aria-hidden": "true",
				class: attrs.variant === TimeBadgeVarient.SMALL ? "pl-4 pr-4" : " pl-8 pr-8",
			},
			formatedTime,
		)
	}
}
