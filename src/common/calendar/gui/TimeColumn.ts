import m, { ClassComponent, Vnode } from "mithril"
import { clone, lastIndex } from "@tutao/tutanota-utils"
import { formatShortTime, formatTime } from "../../misc/Formatter"
import { getIntervalAsMinutes, SUBROWS_PER_INTERVAL, TimeRange, TimeScale } from "./CalendarTimeGrid"
import { px } from "../../gui/size"
import { Time } from "../date/Time"
import { styles } from "../../gui/styles"
import { CalendarTimeCell, CalendarTimeCellAttrs, CellActionHandler } from "./CalendarTimeCell"

export interface TimeColumnAttrs {
	intervals: Array<Time>
	layout: {
		width: number
		subColumnCount: number
		rowCount: number
		gridRowHeight: number
	}
	baseDate?: Date
	onCellPressed?: CellActionHandler
}

const TIME_CELL_ID_PREFIX = "time-cell-"

export class TimeColumn implements ClassComponent<TimeColumnAttrs> {
	view({ attrs }: Vnode<TimeColumnAttrs>) {
		return m(
			".grid.gap.border-right",
			{
				style: {
					gridTemplateRows: `repeat(${attrs.layout.rowCount}, ${px(attrs.layout.gridRowHeight)})`,
					gridTemplateColumns: px(attrs.layout.width),
				},
			},
			attrs.intervals.map((interval, intervalIndex) => {
				const parsedTime = interval.toDate()
				const formatedTime = styles.isDesktopLayout() ? formatTime(parsedTime) : formatShortTime(parsedTime)
				const rowStart = intervalIndex * SUBROWS_PER_INTERVAL + 1
				const rowEnd = rowStart + SUBROWS_PER_INTERVAL
				const showBorderBottom = intervalIndex !== lastIndex(attrs.intervals)

				return m(CalendarTimeCell, {
					dateTime: {
						baseDate: attrs.baseDate,
						time: interval,
					},
					layout: {
						rowBounds: {
							start: rowStart,
							end: rowEnd,
						},
						subColumnCount: attrs.layout.subColumnCount,
					},
					interactions: { onCellPressed: attrs.onCellPressed },
					text: formatedTime,
					showBorderBottom,
				} as CalendarTimeCellAttrs)
			}),
		)
	}

	static getTimeCellId(hour: number): string {
		return `${TIME_CELL_ID_PREFIX}${hour}`
	}

	static createTimeColumnIntervals(timeScale: TimeScale, timeRange: TimeRange): Array<Time> {
		let timeInterval = getIntervalAsMinutes(timeScale)
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeInterval) / timeInterval
		const timeKeys: Array<Time> = []

		for (let i = 0; i < numberOfIntervals; i++) {
			const agendaRowTime = clone(timeRange.start).add({ minutes: timeInterval * i })
			timeKeys.push(agendaRowTime)
		}

		return timeKeys
	}
}
