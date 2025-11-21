import { Time } from "../date/Time"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { DAY_IN_MINUTES } from "@tutao/tutanota-utils/dist/TimeUtils"
import { TimeBadge, TimeBadgeAttrs, TimeBadgeVarient } from "./TimeBadge"

export interface TimeIndicatorAttrs {
	timeBadgeConfig?: {
		currentTime: Time
		amPm: boolean
		variant: TimeBadgeVarient
	}
}

export class TimeIndicator implements ClassComponent<TimeIndicatorAttrs> {
	view({ attrs }: Vnode<TimeIndicatorAttrs>): Children {
		const style: Partial<CSSStyleDeclaration> = {
			height: px(size.calendar_day_event_padding),
		}

		if (attrs.timeBadgeConfig) {
			return m(".flex.items-center.z3", [
				m(TimeBadge, {
					currentTime: attrs.timeBadgeConfig.currentTime,
					amPm: attrs.timeBadgeConfig.amPm,
					variant: attrs.timeBadgeConfig.variant,
				} satisfies TimeBadgeAttrs),
				m(".time-indicator", {
					"aria-hidden": "true",
					style,
				}),
			])
		}

		return m(".time-indicator.z3", {
			"aria-hidden": "true",
		})
	}

	static calculateYPosition(time: Time, dayHeight: number) {
		return (time.asMinutes() * dayHeight) / DAY_IN_MINUTES
	}
}
