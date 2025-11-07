/**
 * Renders a TimeIndicator line in the screen over the event grid
 * @param timeRange Time range for the day, usually from 00:00 till 23:00
 * @param subRowAsMinutes How many minutes a Grid row represents
 * @param time Time where to position the indicator
 * @param timeRowHeight
 * @private
 */
import { Time } from "../date/Time"
import m, { ClassComponent, Vnode } from "mithril"
import { px } from "../../gui/size"
import { TimeRange } from "./TimeView"
import { deepMemoized } from "@tutao/tutanota-utils"

export interface TimeIndicatorAttrs {
	dayHeight: number
	timeRange: TimeRange
	interval: number

	areaWidth: number
	numberOfDatesInRange: number
	datePosition: number
	leftOffset?: number
}

export class TimeIndicator implements ClassComponent<TimeIndicatorAttrs> {
	private getPositions = deepMemoized((time: Time, compAttrs: TimeIndicatorAttrs) => {
		const yPosition = (time.asMinutes() * compAttrs.dayHeight) / (compAttrs.timeRange.end.asMinutes() + compAttrs.interval)
		const xPosition = (compAttrs.leftOffset ?? 0) + (compAttrs.areaWidth / compAttrs.numberOfDatesInRange) * compAttrs.datePosition
		return { xPosition, yPosition }
	})

	view({ attrs }: Vnode<TimeIndicatorAttrs>) {
		const time = Time.fromDate(new Date())
		const { xPosition, yPosition } = this.getPositions(time, attrs)

		return m(".time-indicator.z3", {
			ariaHidden: "true",
			style: {
				top: px(yPosition),
				left: px(xPosition),
				width: px(attrs.areaWidth / attrs.numberOfDatesInRange),
			} satisfies Partial<CSSStyleDeclaration>,
		})
	}
}
