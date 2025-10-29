import m, { ClassComponent, Vnode } from "mithril"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import { ColumnBounds, DEFAULT_EVENT_COLUMN_SPAN_SIZE, SUBROWS_PER_INTERVAL } from "./TimeView"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs"
import { downcast, getStartOfDay } from "@tutao/tutanota-utils"
import {
	CalendarEventBubble,
	CalendarEventBubbleAttrs,
	CalendarEventBubbleDragProperties,
	EventBubbleInteractions,
	RangeOverflowData,
} from "../../../calendar-app/calendar/view/CalendarEventBubble"
import { eventEndsAfterDay, eventStartsBeforeDay, getTimeZone } from "../date/CalendarUtils"
import { getRowDateFromMousePos, getTimeFromMousePos } from "../../../calendar-app/calendar/gui/CalendarGuiUtils"
import { getPosAndBoundsFromMouseEvent } from "../../gui/base/GuiUtils"
import { isAllDayEvent } from "../../api/common/utils/CommonCalendarUtils"

/**
 * Internal data structure tracking events within a single row.
 * Used during the row-packing phase of the layout algorithm.
 */
export interface RowData {
	/**
	 * The column index where the last event in this row ends.
	 * Used for quick availability checks when placing new events.
	 */
	lastEventEndingColumn: number

	/**
	 * Map of event IDs to their column bounds.
	 * Maintains insertion order for deterministic layout.
	 */
	events: Map<EventWrapper, ColumnBounds>
}

export interface AllDaySectionAttrs {
	dates: Array<Date>
	allDayEventWrappers: Array<EventWrapper>
	eventBubbleHandlers: EventBubbleInteractions & CalendarEventBubbleDragProperties
}

export class AllDaySection implements ClassComponent<AllDaySectionAttrs> {
	private rowCount = 0

	view({ attrs }: Vnode<AllDaySectionAttrs>) {
		return m(
			".grid.gap.pb-xs",
			{
				style: {
					gridTemplateColumns: `repeat(${attrs.dates.length}, 1fr)`,
					gridTemplateRows: `repeat(${this.rowCount}, 1fr)`,
					transition: `height ${DefaultAnimationTime}ms linear`,
					height: attrs.allDayEventWrappers.length === 0 ? "0" : "auto", // FIXME After working with bubble make it expand beautifully
				} satisfies Partial<CSSStyleDeclaration>,
				onmousemove: (mouseEvent: MouseEvent) => {
					downcast(mouseEvent).redraw = false
					const time = getTimeFromMousePos(getPosAndBoundsFromMouseEvent(mouseEvent), SUBROWS_PER_INTERVAL)
					const date = getRowDateFromMousePos(mouseEvent, attrs.dates.length, attrs.dates[0])
					attrs.eventBubbleHandlers?.drag?.setTimeUnderMouse(time, date)
				},
			},
			this.renderEvents(attrs.dates, attrs.allDayEventWrappers, attrs.eventBubbleHandlers),
		)
	}

	private renderEvents(dates: Date[], allDayEventWrappers: EventWrapper[], eventBubbleHandlers: EventBubbleInteractions & CalendarEventBubbleDragProperties) {
		// Sort events for optimal lay outing
		// Primary: earlier start times first
		// Secondary: longer duration first (helps minimize columns)
		const orderedEvents = allDayEventWrappers.toSorted((a, b) => {
			const startTimeDiff = a.event.startTime.getTime() - b.event.startTime.getTime()
			if (startTimeDiff !== 0) {
				return startTimeDiff
			}
			// Longer events first (end time descending)
			return b.event.endTime.getTime() - a.event.endTime.getTime()
		})

		const rows = AllDaySection.layoutEvents(orderedEvents, dates)
		this.rowCount = rows.length

		return rows.flatMap((rowData, rowIndex) =>
			Array.from(rowData.events.entries()).map(([eventWrapper, columnBounds]) => {
				return m(
					CalendarEventBubble,
					{
						eventWrapper: eventWrapper,
						gridInfo: {
							row: {
								start: rowIndex + 1, // CSS Grid noramlization
								end: rowIndex + 2, // CSS Grid noramlization + event own default size
							},
							column: columnBounds,
						},
						rowOverflowInfo: {
							start: false,
							end: false,
						},
						columnOverflowInfo: this.findColumnOverflowInfo(dates, eventWrapper),
						canReceiveFocus: true,
						interactions: eventBubbleHandlers,
					} satisfies CalendarEventBubbleAttrs,
					eventWrapper.event.summary,
				)
			}),
		)
	}

	private findColumnOverflowInfo(dates: Array<Date>, eventWrapper: EventWrapper): RangeOverflowData {
		const firstDateOfPeriod = dates[0]
		const lastDateOfPeriod = dates[dates.length - 1]

		return {
			start: eventStartsBeforeDay(firstDateOfPeriod, getTimeZone(), eventWrapper.event),
			end: eventEndsAfterDay(lastDateOfPeriod, getTimeZone(), eventWrapper.event),
		}
	}

	static layoutEvents(orderedEvents: EventWrapper[], dates: Date[]): Array<RowData> {
		// Step 1: Convert events to column-based coordinates
		const eventsMap = new Map<EventWrapper, ColumnBounds>(
			orderedEvents.map((wrapper) => {
				return [wrapper, AllDaySection.getColumnBounds(wrapper.event, dates)]
			}),
		)

		// Step 2: Pack events into columns using first-fit strategy
		return AllDaySection.packEventsIntoRows(eventsMap)
	}

	/**
	 * Packs events into columns using a greedy first-fit algorithm.
	 * Each event is placed in the first available column where it doesn't overlap.
	 *
	 * @param eventsMap - Map of events to their row bounds
	 * @returns Array of columns with their contained events
	 */
	static packEventsIntoRows(eventsMap: Map<EventWrapper, ColumnBounds>): Array<RowData> {
		const rows: Array<RowData> = []

		for (const [eventWrapper, columnBounds] of eventsMap.entries()) {
			const availableColumnIndex = rows.findIndex((rowData) => rowData.lastEventEndingColumn <= columnBounds.start)

			if (availableColumnIndex === -1) {
				rows.push({
					lastEventEndingColumn: columnBounds.start + columnBounds.span,
					events: new Map([[eventWrapper, columnBounds]]),
				})
			} else {
				const column = rows[availableColumnIndex]
				column.lastEventEndingColumn = columnBounds.start + columnBounds.span
				column.events.set(eventWrapper, columnBounds)
			}
		}

		return rows
	}

	static getColumnBounds(event: CalendarEvent, dates: Date[]) {
		const eventStartTimeStartOfDay = getStartOfDay(event.startTime).getTime()
		const eventEndTimeStartOfDay = getStartOfDay(event.endTime).getTime()

		const startDayIndex = dates.findIndex((date) => eventStartTimeStartOfDay <= date.getTime())
		const endDayIndexReversed = dates.toReversed().findIndex((date) => eventEndTimeStartOfDay > date.getTime())
		const endDayIndex = endDayIndexReversed === -1 ? 0 : dates.length - endDayIndexReversed

		const eventTypeCorrection = isAllDayEvent(event) ? 0 : 1
		const gridStart = startDayIndex + DEFAULT_EVENT_COLUMN_SPAN_SIZE
		const gridEnd = endDayIndex + DEFAULT_EVENT_COLUMN_SPAN_SIZE + eventTypeCorrection
		return {
			start: gridStart,
			span: gridEnd - gridStart,
		}
	}
}
