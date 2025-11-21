import { Time } from "../date/Time"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { TimeRange } from "./CalendarTimeGrid"
import { deepMemoized } from "@tutao/tutanota-utils"
import { theme } from "../../gui/theme"

export interface TimeIndicatorAttrs {
	time?: Time
	/** Absolute positioning configuration for grid placement */
	position?: {
		dayHeight: number
		timeRange: TimeRange
		interval: number
	}
	fullOpacity: boolean
	variant: TimeIndicatorVariant
}

export enum TimeIndicatorVariant {
	LINE,
	LINE_WITH_CIRCLE,
}

/**
 * Renders a time indicator line with a ::before circle.
 * Can be used as a simple div(AgendaView) or absolutely positioned in a calendar grid.
 */
export class TimeIndicator implements ClassComponent<TimeIndicatorAttrs> {
	private getYPosition = deepMemoized((time: Time, positionConfig: NonNullable<TimeIndicatorAttrs["position"]>) => {
		const startMinutes = positionConfig.timeRange.start.asMinutes()
		const endPlusInterval = positionConfig.timeRange.end.asMinutes() + Math.max(0, positionConfig.interval)

		const totalMinutes = Math.max(1, endPlusInterval - startMinutes)
		const minutesSinceStart = time.asMinutes() - startMinutes

		const rawY = (minutesSinceStart * positionConfig.dayHeight) / totalMinutes
		return Math.min(Math.max(rawY, 0), positionConfig.dayHeight) // clamp to [0, dayHeight]
	})

	view({ attrs }: Vnode<TimeIndicatorAttrs>): Children {
		const style: Partial<CSSStyleDeclaration> = {
			height: px(size.calendar_day_event_padding),
		}

		if (attrs.position && attrs.time) {
			const yPosition = this.getYPosition(attrs.time, attrs.position)
			Object.assign(style, {
				position: "absolute",
				top: px(yPosition),
			} satisfies Partial<CSSStyleDeclaration>)
		}

		if (attrs.variant === TimeIndicatorVariant.LINE_WITH_CIRCLE) {
			style.paddingLeft = px(size.icon_size_small / 2)
		}

		return m(
			".time-indicator.z3.full-width",
			{
				class: attrs.fullOpacity ? "opaque" : "translucent",
				"aria-hidden": "true",
				style: {
					...style,
					borderBottom: `2px solid ${theme.primary}`,
				},
			},
			attrs.variant === TimeIndicatorVariant.LINE_WITH_CIRCLE ? m(".time-indicator-circle") : null,
		)
	}
}
