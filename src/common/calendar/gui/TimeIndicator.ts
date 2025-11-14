import { Time } from "../date/Time"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { layout_size, px, size } from "../../gui/size"
import { TimeRange } from "./CalendarTimeGrid"
import { deepMemoized } from "@tutao/tutanota-utils"

export interface TimeIndicatorAttrs {
	time?: Time
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
		const startMinutes = positionConfig.timeRange.start.asMinutes()
		const endPlusInterval = positionConfig.timeRange.end.asMinutes() + Math.max(0, positionConfig.interval)

		const totalMinutes = Math.max(1, endPlusInterval - startMinutes)
		const minutesSinceStart = time.asMinutes() - startMinutes

		const rawY = (minutesSinceStart * positionConfig.dayHeight) / totalMinutes
		const yPosition = Math.min(Math.max(rawY, 0), positionConfig.dayHeight) // clamp to [0, dayHeight]

		const leftOffset = positionConfig.leftOffset ?? 0
		const slots = Math.max(1, positionConfig.numberOfDatesInRange)
		const slotWidth = positionConfig.areaWidth / slots
		const xPosition = leftOffset + slotWidth * positionConfig.datePosition

		return { xPosition, yPosition }
	})

	view({ attrs }: Vnode<TimeIndicatorAttrs>): Children {
		const style: Partial<CSSStyleDeclaration> = {
			height: px(layout_size.calendar_day_event_padding),
		}

		if (attrs.position) {
			const time = attrs.time ?? Time.fromDate(new Date())
			const { xPosition, yPosition } = this.getPositions(time, attrs.position)
			Object.assign(style, {
				position: "absolute",
				top: px(yPosition),
				left: px(xPosition),
				width: px(attrs.position.areaWidth / attrs.position.numberOfDatesInRange),
			} satisfies Partial<CSSStyleDeclaration>)
		}

		if (attrs.circleLeftTangent) {
			style.paddingLeft = px(size.icon_12 / 2)
		}

		return m(".time-indicator.z3", {
			"aria-hidden": "true",
			style,
		})
	}
}
