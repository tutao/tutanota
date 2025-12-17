import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { assertNotNull, downcast, getFirstOrThrow, isToday, lastIndex, lastThrow } from "@tutao/tutanota-utils"
import { getTimeFromMousePos } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"
import { getPosAndBoundsFromMouseEvent } from "../../gui/base/GuiUtils"
import { CalendarTimeColumnData, SUBROWS_PER_INTERVAL } from "./CalendarTimeGrid"
import { Time } from "../date/Time"
import { CalendarTimeCell, CalendarTimeCellAttrs, CellActionHandler } from "./CalendarTimeCell"
import { CalendarEventBubble, CalendarEventBubbleAttrs, CalendarEventBubbleDragProperties, EventBubbleInteractions } from "./CalendarEventBubble"
import { elementIdPart } from "../../api/common/utils/EntityUtils"
import { DateTime } from "../../../../libs/luxon"
import { px } from "../../gui/size"
import { TimeIndicator } from "./TimeIndicator"

export type CalendarDayColumnAttrs = {
	intervals: Array<Time> // containing the start time of each interval
	baseDate: Date
	time?: Time
	onCellPressed?: CellActionHandler
	onCellContextMenuPressed?: CellActionHandler
	eventInteractions?: EventBubbleInteractions & CalendarEventBubbleDragProperties
	timeColumnGrid: CalendarTimeColumnData
	layout: {
		rowCount: number
		gridRowHeight: number
		hideRightBorder: boolean
		showLeftBorder: boolean
	}
}

export class CalendarDayColumn implements ClassComponent<CalendarDayColumnAttrs> {
	private columnHeight: number = 0

	oncreate(vnode: VnodeDOM<CalendarDayColumnAttrs>) {
		this.columnHeight = vnode.dom.clientHeight
		m.redraw()
	}

	view({ attrs }: Vnode<CalendarDayColumnAttrs>) {
		return m(
			".grid.z1.grid-auto-columns.rel.min-width-0.gap-1",
			{
				class: this.resolveClasses(attrs.layout),
				style: {
					gridTemplateRows: `repeat(${attrs.layout.rowCount}, ${px(attrs.layout.gridRowHeight)})`,
					paddingLeft: px(1),
					paddingRight: px(1),
				} satisfies Partial<CSSStyleDeclaration>,
				onmousemove: (mouseEvent: MouseEvent) => {
					downcast(mouseEvent).redraw = false
					const time = getTimeFromMousePos(getPosAndBoundsFromMouseEvent(mouseEvent), SUBROWS_PER_INTERVAL)
					attrs.eventInteractions?.drag?.setTimeUnderMouse(time, attrs.baseDate)
				},
			},
			[
				isToday(attrs.baseDate) && attrs.time
					? m(
							".abs.z3.full-width",
							{
								style: {
									top: px(TimeIndicator.calculateYPosition(attrs.time, this.columnHeight)),
									transform: "translateY(-50%)",
								} satisfies Partial<CSSStyleDeclaration>,
							},
							m(TimeIndicator),
						)
					: null,
				this.renderInteractableCells(attrs),
				this.renderEvents(attrs),
			],
		)
	}

	private renderInteractableCells(attrs: CalendarDayColumnAttrs): Children {
		const { intervals, baseDate, onCellPressed, onCellContextMenuPressed } = attrs
		return intervals.map((interval, intervalIndex) => {
			const showBorderBottom = intervalIndex !== lastIndex(intervals)
			const rowStart = intervalIndex * SUBROWS_PER_INTERVAL + 1
			const rowEnd = rowStart + SUBROWS_PER_INTERVAL
			return m(CalendarTimeCell, {
				dateTime: { baseDate, time: interval },
				layout: {
					rowBounds: {
						start: rowStart,
						end: rowEnd,
					},
					subColumnCount: attrs.timeColumnGrid.subColumnCount,
				},
				interactions: { onCellPressed, onCellContextMenuPressed },
				showBorderBottom,
			} satisfies CalendarTimeCellAttrs)
		})
	}

	/**
	 * Renders a column of events using grids for a given base date.
	 * This function is deepMemoized to prevent unnecessary layout calculation
	 *
	 * @param eventsForThisDate - Array of events to render in this column
	 * @param timeRange - Visible time range for the day (e.g., 00:00 AM to 23:00 PM)
	 * @param subRowAsMinutes - Minutes represented by each grid subrow
	 * @param timeScale - Time scale factor for interval subdivision (1, 2, or 4)
	 * @param baseDate - The date for this column
	 * @returns Child nodes representing the rendered events
	 *
	 * @private
	 */
	private renderEvents(columnViewAttrs: CalendarDayColumnAttrs): Children {
		const { timeColumnGrid, baseDate, eventInteractions, intervals } = columnViewAttrs

		const firstInterval = getFirstOrThrow(intervals)
		const secondInterval = assertNotNull(intervals.at(1))
		const intervalIncrement = firstInterval.diff(secondInterval)
		const lastInterval = lastThrow(intervals)

		const timeRangeStartAsDate = firstInterval.toDate(baseDate)
		const timeRangeEndAsDate = DateTime.fromJSDate(lastInterval.toDate(baseDate)).plus({ minutes: intervalIncrement }).toJSDate()

		return timeColumnGrid.orderedEvents.map((eventWrapper) => {
			const evData = timeColumnGrid.grid.get(elementIdPart(eventWrapper.event._id))
			if (!evData) {
				return null
			}
			return m(CalendarEventBubble, {
				interactions: eventInteractions,
				gridInfo: evData,
				eventWrapper,
				rowOverflowInfo: {
					start: eventWrapper.event.startTime < timeRangeStartAsDate,
					end: eventWrapper.event.endTime > timeRangeEndAsDate,
				},
				baseDate,
				canReceiveFocus: Boolean(eventInteractions),
				columnOverflowInfo: {
					start: false,
					end: false,
				},
			} satisfies CalendarEventBubbleAttrs)
		})
	}

	private resolveClasses(layout: CalendarDayColumnAttrs["layout"]) {
		const classes: Array<string> = []
		if (layout.showLeftBorder) {
			classes.push("border-left")
		}
		if (!layout.hideRightBorder) {
			classes.push("border-right")
		}
		return classes.join(" ")
	}
}
