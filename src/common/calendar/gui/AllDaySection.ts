import m, { ClassComponent, Vnode } from "mithril"
import { EventWrapper } from "../../../calendar-app/calendar/view/CalendarViewModel"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import { ColumnBounds, DEFAULT_EVENT_COLUMN_SPAN_SIZE } from "./TimeView"
import { CalendarEvent } from "../../api/entities/tutanota/TypeRefs"
import { getStartOfDay } from "@tutao/tutanota-utils"
import { DEFAULT_CALENDAR_COLOR } from "../../api/common/TutanotaConstants"

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
}

export class AllDaySection implements ClassComponent<AllDaySectionAttrs> {
	private rowCount = 0

	view({ attrs }: Vnode<AllDaySectionAttrs>) {
		return m(
			".grid",
			{
				style: {
					gridTemplateColumns: `repeat(${attrs.dates.length}, 1fr)`,
					gridTemplateRows: `repeat(${this.rowCount}, 1fr)`,
					transition: `height ${DefaultAnimationTime}ms linear`,
					height: attrs.allDayEventWrappers.length === 0 ? "0" : "auto", // FIXME After working with bubble make it expand beautifully
				} satisfies Partial<CSSStyleDeclaration>,
			},
			this.renderEvents(attrs.dates, attrs.allDayEventWrappers),
		)
	}

	private renderEvents(dates: Date[], allDayEventWrappers: EventWrapper[]) {
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

		const rows = this.layoutEvents(orderedEvents, dates)
		this.rowCount = rows.length

		return rows.flatMap((rowData) =>
			Array.from(rowData.events.entries()).map(([eventWrapper, columnBounds]) => {
				return m(
					"",
					{
						style: {
							background: `#${eventWrapper.color ?? DEFAULT_CALENDAR_COLOR}`,
							gridColumn: `${columnBounds.start} / span ${columnBounds.span}`,
						} satisfies Partial<CSSStyleDeclaration>,
					},
					eventWrapper.event.summary,
				)
			}),
		)
	}

	private layoutEvents(orderedEvents: EventWrapper[], dates: Date[]): Array<RowData> {
		// Step 1: Convert events to column-based coordinates
		const eventsMap = new Map<EventWrapper, ColumnBounds>(
			orderedEvents.map((wrapper) => {
				return [wrapper, this.getColumnBounds(wrapper.event, dates)]
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

	private getColumnBounds(event: CalendarEvent, dates: Date[]) {
		const eventStartTimeStartOfDay = getStartOfDay(event.startTime).getTime()
		const eventEndTimeStartOfDay = getStartOfDay(event.endTime).getTime()

		const startDayIndex = dates.findIndex((date) => eventStartTimeStartOfDay <= date.getTime())
		const endDayIndexReversed = dates.toReversed().findIndex((date) => eventEndTimeStartOfDay >= date.getTime())
		const endDayIndex = dates.length - endDayIndexReversed - 1

		const lastColumnCorrection = endDayIndex === dates.length - 1 ? 1 : 0
		const gridStart = startDayIndex + DEFAULT_EVENT_COLUMN_SPAN_SIZE
		const gridEnd = endDayIndex + DEFAULT_EVENT_COLUMN_SPAN_SIZE + lastColumnCorrection
		return {
			start: gridStart,
			span: gridEnd - gridStart,
		}
	}
}
