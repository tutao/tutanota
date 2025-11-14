import { Time } from "../date/Time"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { TimeRange } from "./CalendarTimeGrid"
import { deepMemoized } from "@tutao/tutanota-utils"

export interface TimeIndicatorAttrs {
	/** Absolute positioning configuration for grid placement */
	position?: {
		dayHeight: number
		timeRange: TimeRange
		interval: number
		areaWidth: number
		numberOfDatesInRange: number
		datePosition: number
		leftOffset?: number
	}
	/** Make the ::before circle tangent to the left side rather than intersecting */
	circleLeftTangent?: boolean
}

/**
 * Renders a time indicator line with a ::before circle.
 * Can be used as a simple div(AgendaView) or absolutely positioned in a calendar grid.
 */
export class TimeIndicator implements ClassComponent<TimeIndicatorAttrs> {
	private getPositions = deepMemoized((time: Time, positionConfig: NonNullable<TimeIndicatorAttrs["position"]>) => {
		const yPosition = (time.asMinutes() * positionConfig.dayHeight) / (positionConfig.timeRange.end.asMinutes() + positionConfig.interval)
		const xPosition = (positionConfig.leftOffset ?? 0) + (positionConfig.areaWidth / positionConfig.numberOfDatesInRange) * positionConfig.datePosition
		return { xPosition, yPosition }
	})

	view({ attrs }: Vnode<TimeIndicatorAttrs>): Children {
		const style: Partial<CSSStyleDeclaration> = {
			height: px(size.calendar_day_event_padding),
		}

		if (attrs.position) {
			const time = Time.fromDate(new Date())
			const { xPosition, yPosition } = this.getPositions(time, attrs.position)
			Object.assign(style, {
				position: "absolute",
				top: px(yPosition),
				left: px(xPosition),
				width: px(attrs.position.areaWidth / attrs.position.numberOfDatesInRange),
			} satisfies Partial<CSSStyleDeclaration>)
		}

		if (attrs.circleLeftTangent) {
			style.paddingLeft = px(size.icon_size_small / 2)
		}

		return m(".time-indicator.z3", {
			"aria-hidden": "true",
			style,
		})
	}
}
