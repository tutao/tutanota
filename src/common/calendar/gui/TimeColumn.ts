import m, { Child, ClassComponent, Vnode } from "mithril"
import { clone, deepMemoized } from "@tutao/tutanota-utils"
import { formatShortTime, formatTime } from "../../misc/Formatter"
import { TIME_SCALE_BASE_VALUE, TimeRange, TimeScale } from "./TimeView"
import { px, size } from "../../gui/size"
import { Time } from "../date/Time"
import { styles } from "../../gui/styles"

export interface TimeColumnAttrs {
	timeScale: TimeScale
	timeRange: TimeRange
	width: number // FIXME should it receive a width or variant?
}

export class TimeColumn implements ClassComponent<TimeColumnAttrs> {
	private buildTimeColumn = deepMemoized((times: Array<string>, width: number): Child => {
		return m(
			".grid",
			{
				style: {
					"grid-template-rows": `repeat(${times.length}, 1fr)`,
					width: px(width),
				},
			},
			times.map((time, index) => {
				const parsedTime = Time.parseFromString(time)?.toDate() ?? new Time(0, 0).toDate()
				const timeStr = styles.isDesktopLayout() ? formatTime(parsedTime) : formatShortTime(parsedTime)
				return m(
					".flex.small.border-right.rel.justify-center.items-center",
					{
						class: index !== times.length - 1 ? "after-as-border-bottom" : "",
						style: {
							height: px(size.calendar_hour_height), // FIXME apply dynamic height according to zoom
						},
					},
					timeStr,
				)
			}),
		)
	})

	view({ attrs }: Vnode<TimeColumnAttrs>) {
		const timeColumnIntervals = TimeColumn.createTimeColumnIntervals(attrs.timeScale, attrs.timeRange)
		return this.buildTimeColumn(timeColumnIntervals, attrs.width)
	}

	static createTimeColumnIntervals(timeScale: TimeScale, timeRange: TimeRange): Array<string> {
		let timeInterval = TIME_SCALE_BASE_VALUE / timeScale
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeInterval) / timeInterval
		const timeKeys: Array<string> = []

		for (let i = 0; i < numberOfIntervals; i++) {
			const agendaRowTime = clone(timeRange.start).add({ minutes: timeInterval * i })

			timeKeys.push(formatTime(agendaRowTime.toDate()))
		}

		return timeKeys
	}
}
