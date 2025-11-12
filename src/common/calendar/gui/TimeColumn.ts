import m, { Child, ClassComponent, Vnode } from "mithril"
import { clone, deepMemoized, noOp } from "@tutao/tutanota-utils"
import { formatShortTime, formatTime } from "../../misc/Formatter"
import { CellActionHandler, getIntervalAsMinutes, TimeRange, TimeScale } from "./CalendarTimeGrid"
import { px, size } from "../../gui/size"
import { Time } from "../date/Time"
import { styles } from "../../gui/styles"

export interface TimeColumnAttrs {
	timeScale: TimeScale
	timeRange: TimeRange
	width: number
	baseDate?: Date
	onCellPressed?: CellActionHandler
}

const TIME_CELL_ID_PREFIX = "time-cell-"

export class TimeColumn implements ClassComponent<TimeColumnAttrs> {
	view({ attrs }: Vnode<TimeColumnAttrs>) {
		const timeColumnIntervals = TimeColumn.createTimeColumnIntervals(attrs.timeScale, attrs.timeRange)
		return this.buildTimeColumn(attrs.baseDate ?? new Date(), timeColumnIntervals, attrs.width, attrs.onCellPressed ?? noOp)
	}

	static getTimeCellId(hour: number): string {
		return `${TIME_CELL_ID_PREFIX}${hour}`
	}

	static createTimeColumnIntervals(timeScale: TimeScale, timeRange: TimeRange): Array<string> {
		let timeInterval = getIntervalAsMinutes(timeScale)
		const numberOfIntervals = (timeRange.start.diff(timeRange.end) + timeInterval) / timeInterval
		const timeKeys: Array<string> = []

		for (let i = 0; i < numberOfIntervals; i++) {
			const agendaRowTime = clone(timeRange.start).add({ minutes: timeInterval * i })

			timeKeys.push(formatTime(agendaRowTime.toDate()))
		}

		return timeKeys
	}

	private buildTimeColumn = deepMemoized((baseDate: Date, times: Array<string>, width: number, onCellPressed: CellActionHandler): Child => {
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
					".rel.after-as-border-bottom",
					{
						id: TimeColumn.getTimeCellId(parsedTime.getHours()),
					},
					m(
						".flex.small.border-right.rel.justify-center.items-center.interactable-cell.cursor-pointer",
						{
							style: {
								height: px(size.calendar_hour_height),
							},
							onclick: (e: MouseEvent) => {
								e.stopImmediatePropagation()
								onCellPressed(baseDate, Time.parseFromString(time) ?? new Time(0, 0))
							},
						},
						timeStr,
					),
				)
			}),
		)
	})
}
