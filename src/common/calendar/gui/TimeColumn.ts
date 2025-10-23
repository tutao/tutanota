import m, { Child, ClassComponent, Vnode } from "mithril"
import { clone, deepMemoized, noOp } from "@tutao/tutanota-utils"
import { formatShortTime, formatTime } from "../../misc/Formatter"
import { CellActionHandler, TIME_SCALE_BASE_VALUE, TimeRange, TimeScale } from "./TimeView"
import { px, size } from "../../gui/size"
import { Time } from "../date/Time"
import { styles } from "../../gui/styles"

export interface TimeColumnAttrs {
	timeScale: TimeScale
	timeRange: TimeRange
	width: number // FIXME should it receive a width or variant?
	baseDate?: Date
	onCellPressed?: CellActionHandler
}

export class TimeColumn implements ClassComponent<TimeColumnAttrs> {
	view({ attrs }: Vnode<TimeColumnAttrs>) {
		const timeColumnIntervals = TimeColumn.createTimeColumnIntervals(attrs.timeScale, attrs.timeRange)
		return this.buildTimeColumn(attrs.baseDate ?? new Date(), timeColumnIntervals, attrs.width, attrs.onCellPressed ?? noOp)
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
					m(
						".flex.small.border-right.rel.justify-center.items-center.interactable-cell.cursor-pointer",
						{
							style: {
								height: px(size.calendar_hour_height), // FIXME apply dynamic height according to zoom
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
