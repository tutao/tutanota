import m, { Children, ClassComponent, Vnode } from "mithril"
import { Time } from "../Time"

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
		let formatedTime: string
		if (attrs.amPm) {
			formatedTime = attrs.currentTime.to12HourString(false)
		} else {
			formatedTime = attrs.currentTime.to24HourString()
		}

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
