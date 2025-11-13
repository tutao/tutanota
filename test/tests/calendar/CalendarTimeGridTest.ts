import o from "@tutao/otest"
import { CalendarTimeGrid, ColumnLayoutData, EventGridData, RowBounds, TimeRange, TimeScale } from "../../../src/common/calendar/gui/CalendarTimeGrid"
import { Time } from "../../../src/common/calendar/date/Time"
import { EventWrapper } from "../../../src/calendar-app/calendar/view/CalendarViewModel"
import { MIN_ROW_SPAN } from "../../../src/common/calendar/gui/CalendarEventBubble"
import { incrementDate } from "@tutao/tutanota-utils"
import { makeEvent } from "./CalendarTestUtils"

o.spec("CalendarTimeGrid", function () {
	const timeRange: TimeRange = {
		start: new Time(0, 0),
		end: new Time(23, 0),
	}
	const subRowAsMinutes = 5
	const timeScale: TimeScale = 1
	const currentDate = new Date(2025, 9, 22, 0, 0)

	const creteDateWithTime = (currentDate: Date, hour: number, minutes: number) => {
		const time = new Time(hour, minutes)
		return time.toDate(currentDate)
	}

	const createEventStub = (id: string, startHour: number, startMinute: number, endHour: number, endMinute: number): EventWrapper => {
		return makeEvent(id, creteDateWithTime(currentDate, startHour, startMinute), creteDateWithTime(currentDate, endHour, endMinute))
	}

	const assertLayoutPosition = (grid: Map<Id, EventGridData>, eventId: string, expected: EventGridData) => {
		const actual = grid.get(eventId)
		o.check(actual).notEquals(undefined)(`Event ${eventId} not found in grid`)
		o.check(actual!.row).deepEquals(expected.row)(`${eventId} row mismatch`)
		o.check(actual!.column).deepEquals(expected.column)(`${eventId} column mismatch`)
	}

	o.spec("getRowBounds", function () {
		o.test("Small event receives minimum size (MIN_ROW_SPAN)", function () {
			const eventBounds = {
				startTime: creteDateWithTime(currentDate, 0, 1),
				endTime: creteDateWithTime(currentDate, 0, 2), // Only 1 minute duration
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(1)
			o.check(bounds.end).equals(1 + MIN_ROW_SPAN)
		})

		o.test("Event starts yesterday and ends today", function () {
			const previousDay = incrementDate(new Date(currentDate), -1)
			const eventBounds = {
				startTime: creteDateWithTime(previousDay, 23, 30),
				endTime: creteDateWithTime(currentDate, 0, 30),
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(1)("Should clamped event start to midnight (start of current day)")
			o.check(bounds.end).equals(7) // 30 minutes into current day => 5 min per row = 6 rows + 1 (CSS Grid 1-indexed)
		})

		o.test("Event starts and ends within current day", function () {
			const eventBounds = {
				startTime: creteDateWithTime(currentDate, 0, 30),
				endTime: creteDateWithTime(currentDate, 1, 0),
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(7)
			o.check(bounds.end).equals(13)
		})

		o.test("Event starts at exactly midnight", function () {
			const eventBounds = {
				startTime: creteDateWithTime(currentDate, 0, 0),
				endTime: creteDateWithTime(currentDate, 0, 30),
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(1)
			o.check(bounds.end).equals(7)
		})

		o.test("Event at end of time range (23:00)", function () {
			const eventBounds = {
				startTime: creteDateWithTime(currentDate, 23, 0),
				endTime: creteDateWithTime(currentDate, 23, 30),
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(277) // 23 hours * 12 rows/hour (@see SUBROWS_PER_INTERVAL) = 276 + 1 (CSS Grid 1-indexed)
			o.check(bounds.end).equals(283)
		})

		o.test("Event starts today and ends tomorrow (overflow)", function () {
			const nextDay = incrementDate(new Date(currentDate), 1)
			const eventBounds = {
				startTime: creteDateWithTime(currentDate, 23, 30),
				endTime: creteDateWithTime(nextDay, 0, 30),
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(283)
			o.check(bounds.end).equals(-1)
		})

		o.test("Event passes through entire current day (starts before, ends after)", function () {
			const previousDay = incrementDate(new Date(currentDate), -1)
			const nextDay = incrementDate(new Date(currentDate), 1)
			const eventBounds = {
				startTime: creteDateWithTime(previousDay, 23, 30),
				endTime: creteDateWithTime(nextDay, 0, 30),
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(1)
			o.check(bounds.end).equals(-1)
		})

		o.test("Event spanning multiple hours", function () {
			const eventBounds = {
				startTime: creteDateWithTime(currentDate, 8, 0),
				endTime: creteDateWithTime(currentDate, 11, 0),
			}

			const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(bounds.start).equals(97)
			o.check(bounds.end).equals(133)
		})

		o.spec("Grid interval rounding", function () {
			o.test("Event start between grid intervals rounds to previous boundary", function () {
				const eventOne = {
					startTime: creteDateWithTime(currentDate, 0, 1),
					endTime: creteDateWithTime(currentDate, 0, 30),
				}

				const eventTwo = {
					startTime: creteDateWithTime(currentDate, 0, 3),
					endTime: creteDateWithTime(currentDate, 0, 30),
				}

				const boundsOne = CalendarTimeGrid.getRowBounds(eventOne, timeRange, subRowAsMinutes, timeScale, currentDate)
				const boundsTwo = CalendarTimeGrid.getRowBounds(eventTwo, timeRange, subRowAsMinutes, timeScale, currentDate)

				o.check(boundsOne.start).equals(boundsTwo.start)("Both should round to 00:00 (row 1)")
				o.check(boundsOne.start).equals(1)
			})

			o.test("Event end between intervals rounds to next boundary (Event smaller than MIN_ROW_SPAN)", function () {
				// MIN_ROW_SPAN = 3, Default size = 1 => 4 rows =  4 * 5 min
				const eventBounds = {
					startTime: creteDateWithTime(currentDate, 0, 0),
					endTime: creteDateWithTime(currentDate, 0, 11),
				}

				const bounds = CalendarTimeGrid.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)

				o.check(bounds.start).equals(1)
				o.check(bounds.end).equals(1 + MIN_ROW_SPAN)("Should enforce minimum size")
			})

			o.test("Event end between intervals rounds to next boundary (normal event)", function () {
				/**
				 * Grid intervals:
				 * 00:00 | Row 1
				 * 00:05 | Row 2
				 * 00:10 | Row 3
				 * 00:15 | Row 4
				 * 00:20 | Row 5 (22 minutes rounds up to here)
				 * 00:25 | Row 6
				 * 00:30 | Row 7
				 */
				const eventOne = {
					startTime: creteDateWithTime(currentDate, 0, 0),
					endTime: creteDateWithTime(currentDate, 0, 22),
				}

				const eventTwo = {
					startTime: creteDateWithTime(currentDate, 0, 0),
					endTime: creteDateWithTime(currentDate, 0, 38),
				}

				const boundsOne = CalendarTimeGrid.getRowBounds(eventOne, timeRange, subRowAsMinutes, timeScale, currentDate)
				const boundsTwo = CalendarTimeGrid.getRowBounds(eventTwo, timeRange, subRowAsMinutes, timeScale, currentDate)

				o.check(boundsOne.start).equals(1)
				o.check(boundsOne.end).equals(6)("Should round to 00:25 (row 6)")

				o.check(boundsTwo.start).equals(1)
				o.check(boundsTwo.end).equals(9)("Should round to 00:40 (row 9)")
			})
		})
	})

	o.spec("packEventsIntoColumns", function () {
		o.test("Empty input returns empty columns array", function () {
			const result = CalendarTimeGrid.packEventsIntoColumns(new Map())

			o.check(result.length).equals(0)
		})

		o.test("Single event creates one column", function () {
			const events = new Map([["solo-event", { start: 5, end: 10 }]])

			const columns = CalendarTimeGrid.packEventsIntoColumns(events)

			o.check(columns.length).equals(1)
			o.check(columns[0].events.size).equals(1)
			o.check(columns[0].events.has("solo-event")).equals(true)
			o.check(columns[0].lastOccupiedRow).equals(10)
		})

		o.test("Sequential non-overlapping events share a column", function () {
			const events = new Map([
				["morning", { start: 1, end: 5 }],
				["afternoon", { start: 6, end: 10 }],
				["evening", { start: 11, end: 15 }],
			])

			const columns = CalendarTimeGrid.packEventsIntoColumns(events)

			o.check(columns.length).equals(1)("All non-overlapping events should fit in one column")
			o.check(columns[0].events.size).equals(3)
			o.check(columns[0].lastOccupiedRow).equals(15)("Last occupied row should be the end of last event")
		})

		o.test("Touch-end events (end = next start) share a column", function () {
			const events = new Map([
				["event1", { start: 1, end: 5 }],
				["event2", { start: 5, end: 10 }],
				["event3", { start: 10, end: 15 }],
			])

			const columns = CalendarTimeGrid.packEventsIntoColumns(events)

			o.check(columns.length).equals(1)("Touch-end events should not be considered overlapping")
			o.check(columns[0].events.size).equals(3)
		})

		o.test("Respects Map insertion order (first-fit algorithm)", function () {
			const events = new Map([
				["first", { start: 1, end: 5 }],
				["second", { start: 6, end: 10 }], // Fits after first
				["third", { start: 11, end: 15 }], // Fits after second
			])

			const columns = CalendarTimeGrid.packEventsIntoColumns(events)

			o.check(columns[0].events.has("first")).equals(true)
			o.check(columns[0].events.has("second")).equals(true)
			o.check(columns[0].events.has("third")).equals(true)
			o.check(columns[0].events.size).equals(3)("All events should be packed into first column")
		})

		o.spec("Overlapping events should be assigned to different columns", function () {
			o.test("Event A ends during Event B", function () {
				const events = new Map([
					["eventB", { start: 5, end: 10 }],
					["eventA", { start: 3, end: 7 }], // Ends during B (row 7 < 10)
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(2)
				o.check(columns[0].events.has("eventB")).equals(true)
				o.check(columns[1].events.has("eventA")).equals(true)
				o.check(columns[1].lastOccupiedRow).equals(7)
			})

			o.test("Event A starts during Event B", function () {
				const events = new Map([
					["eventB", { start: 5, end: 10 }],
					["eventA", { start: 7, end: 12 }], // Starts during B (row 7 > 5 and < 10)
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(2)
				o.check(columns[0].events.has("eventB")).equals(true)
				o.check(columns[1].events.has("eventA")).equals(true)
				o.check(columns[1].lastOccupiedRow).equals(12)
			})

			o.test("Event A completely contains Event B", function () {
				const events = new Map([
					["eventA", { start: 3, end: 15 }],
					["eventB", { start: 5, end: 10 }],
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(2)
				o.check(columns[0].events.has("eventA")).equals(true)
				o.check(columns[1].events.has("eventB")).equals(true)
			})

			o.test("Event A and Event B have identical times", function () {
				const events = new Map([
					["eventA", { start: 5, end: 10 }],
					["eventB", { start: 5, end: 10 }],
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(2)("Identical times should create separate columns")
				o.check(columns[0].events.size).equals(1)
				o.check(columns[1].events.size).equals(1)
			})

			o.test("Three events with same start time", function () {
				const events = new Map([
					["event1", { start: 5, end: 8 }],
					["event2", { start: 5, end: 10 }],
					["event3", { start: 5, end: 12 }],
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(3)("All three should be in separate columns")
			})

			o.test("Complex overlap pattern", function () {
				const events = new Map([
					["ev1", { start: 1, end: 10 }],
					["ev2", { start: 2, end: 5 }], // Overlaps ev1
					["ev3", { start: 6, end: 12 }], // Overlaps ev1, fits after ev2
					["ev4", { start: 9, end: 15 }], // Overlaps ev1 and ev3
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(3)

				o.check(columns[0].events.has("ev1")).equals(true)
				o.check(columns[0].events.size).equals(1)("Should only contain ev1")

				o.check(columns[1].events.has("ev2")).equals(true)
				o.check(columns[1].events.has("ev3")).equals(true)
				o.check(columns[1].events.size).equals(2)("Should only contain ev2, and ev3")

				o.check(columns[2].events.has("ev4")).equals(true)
				o.check(columns[2].events.size).equals(1)("Should only contain ev4")
			})

			o.test("Large number of simultaneous events", function () {
				const events = new Map<Id, RowBounds>()

				for (let i = 0; i < 10; i++) {
					events.set(`event-${i}`, { start: 1, end: 10 })
				}

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(10)("Each simultaneous event needs its own column")
				for (const col of columns) {
					o.check(col.events.size).equals(1)
				}
			})

			o.test("Event with overflow (end: -1) blocks entire column", function () {
				const events = new Map([
					["overflow", { start: 5, end: -1 }],
					["normal", { start: 10, end: 15 }],
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(2)("Overflow event should block column completely")
				o.check(columns[0].events.has("overflow")).equals(true)
				o.check(columns[0].lastOccupiedRow).equals(-1)
				o.check(columns[1].events.has("normal")).equals(true)
			})

			o.test("Overflow event prevents column reuse for later events", function () {
				const events = new Map([
					["early", { start: 2, end: 5 }], // Before overflow start
					["overflow", { start: 5, end: -1 }],
					["late", { start: 100, end: 110 }], // Far after overflow start
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(2)
				o.check(columns[0].events.has("overflow")).equals(true)
				o.check(columns[0].events.has("early")).equals(true)
				o.check(columns[0].events.size).equals(2)("First column should only contain events 'early', and 'overflow' ")
				o.check(columns[1].events.has("late")).equals(true)
			})

			o.test("Multiple overflow events create separate columns", function () {
				const events = new Map([
					["overflow1", { start: 5, end: -1 }],
					["overflow2", { start: 10, end: -1 }],
					["overflow3", { start: 15, end: -1 }],
				])

				const columns = CalendarTimeGrid.packEventsIntoColumns(events)

				o.check(columns.length).equals(3)("Each overflow event needs its own column")
			})
		})
	})

	o.spec("calculateColumnSpan", function () {
		let testColumns: Array<ColumnLayoutData>

		/**
		 * Default test column layout:
		 *
		 * ```
		 * Row │ Col 0      │ Col 1      │ Col 2      │
		 * ────┼────────────┼────────────┼────────────┤
		 *  1  │ [col0-evt] │            │            │
		 *  2  │ [col0-evt] │            │ [col2-evt] │
		 *  3  │ [col0-evt] │ [col1-evt] │ [col2-evt] │
		 *  4  │            │ [col1-evt] │ [col2-evt] │
		 *  5  │            │ [col1-evt] │ [col2-evt] │
		 *  6  │            │            │ [col2-evt] │
		 *  7  │            │            │            │
		 * ```
		 */
		o.beforeEach(function () {
			testColumns = [
				{
					lastOccupiedRow: 10,
					events: new Map([["col0-event", { start: 1, end: 4 }]]),
				},
				{
					lastOccupiedRow: 20,
					events: new Map([["col1-event", { start: 3, end: 6 }]]),
				},
				{
					lastOccupiedRow: 15,
					events: new Map([["col2-event", { start: 2, end: 7 }]]),
				},
			]
		})

		o.test("Stops expansion when finding a blocking event", function () {
			const eventColumnIndex = 0
			const eventRowBounds: RowBounds = { start: 4, end: 5 }

			const columnSpan = CalendarTimeGrid.calculateColumnSpan(eventColumnIndex, eventRowBounds, testColumns)

			o.check(columnSpan).equals(1)("Should not expand - blocked by overlapping event in column 1")
		})

		o.test("Expands to last column when no conflicts exist", function () {
			const newEventColumnIndex = 0
			const newEventRowBounds: RowBounds = { start: 7, end: 8 }

			const columnSpan = CalendarTimeGrid.calculateColumnSpan(newEventColumnIndex, newEventRowBounds, testColumns)

			o.check(columnSpan).equals(3)("Should span all 3 columns - no overlapping events")
		})

		o.test("Event in last column cannot expand further", function () {
			const lastColumnIndex = testColumns.length - 1
			const eventRowBounds: RowBounds = { start: 7, end: 8 }

			const columnSpan = CalendarTimeGrid.calculateColumnSpan(lastColumnIndex, eventRowBounds, testColumns)

			o.check(columnSpan).equals(1)("Last column has no adjacent columns to expand into")
		})
	})

	o.spec("buildGridDataWithExpansion", function () {
		o.test("Correctly assigns column positions and spans", function () {
			/**
			 * Test column layout with multiple events:
			 *
			 * ```
			 * Row │ Col 0      │ Col 1      │
			 * ────┼────────────┼────────────┤
			 *  1  │ [event-A]  │            │
			 *  2  │ [event-A]  │ [event-B]  │
			 *  3  │ [event-A]  │ [event-B]  │
			 *  4  │ [event-A]  │ [event-B]  │
			 *  5  │ [event-A]  │            │
			 *  6  │            │            │
			 *  7  │            │            │
			 *  8  │            │            │
			 *  9  │ [event-C]  │            │
			 * 10  │ [event-C]  │            │
			 * 11  │ [event-C]  │            │
			 * ```
			 */
			const testColumns: Array<ColumnLayoutData> = [
				{
					lastOccupiedRow: 15,
					events: new Map([
						["event-A", { start: 1, end: 6 }],
						["event-C", { start: 10, end: 13 }],
					]),
				},
				{
					lastOccupiedRow: 4,
					events: new Map([["event-B", { start: 2, end: 5 }]]),
				},
			]

			const grid = CalendarTimeGrid.buildGridDataWithExpansion(testColumns)

			// Event A: Cannot expand because B overlaps
			assertLayoutPosition(grid, "event-A", {
				row: { start: 1, end: 6 },
				column: { start: 1, span: 1 },
			})

			// Event B: Only is in the last column and can't expand further
			assertLayoutPosition(grid, "event-B", {
				row: { start: 2, end: 5 },
				column: { start: 2, span: 1 },
			})

			// Event C: Can expand to column 2 (full range)
			assertLayoutPosition(grid, "event-C", {
				row: { start: 10, end: 13 },
				column: { start: 1, span: 2 },
			})
		})

		o.test("Empty columns array returns empty grid", function () {
			const grid = CalendarTimeGrid.buildGridDataWithExpansion([])

			o.check(grid.size).equals(0)("Empty input should produce empty grid")
		})

		o.test("Single column with multiple events", function () {
			const testColumns: Array<ColumnLayoutData> = [
				{
					lastOccupiedRow: 20,
					events: new Map([
						["morning", { start: 1, end: 5 }],
						["afternoon", { start: 10, end: 15 }],
						["evening", { start: 16, end: 20 }],
					]),
				},
			]

			const grid = CalendarTimeGrid.buildGridDataWithExpansion(testColumns)

			for (const eventId of ["morning", "afternoon", "evening"]) {
				o.check(grid.get(eventId)?.column.start).equals(1)
				o.check(grid.get(eventId)?.column.span).equals(1)
			}
		})
	})

	o.spec("layoutEvents", function () {
		o.test("Empty events array returns empty grid", function () {
			const { grid, gridColumnSize } = CalendarTimeGrid.layoutEvents([], timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(gridColumnSize).equals(0)
			o.check(grid.size).equals(0)
		})

		o.test("Single event layout", function () {
			const events = [createEventStub("SOLO", 10, 0, 11, 0)]

			const { grid, gridColumnSize } = CalendarTimeGrid.layoutEvents(events, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(gridColumnSize).equals(1)("Single event should create 1 column")
			assertLayoutPosition(grid, "SOLO", {
				row: { start: 121, end: 133 },
				column: { start: 1, span: 1 },
			})
		})

		o.test("Complex grid layout with multiple overlapping events", function () {
			/**
			 * ```
			 *       │ Col 0  │ Col 1  │ Col 2  │ Col 3  │
			 * ──────┼────────┼────────┼────────┼────────┤
			 * 00:00 │ [EVA]  │ [EVA]  │ [EVA]  │ [EVA]  │
			 * 00:30 │ [EVB]  │ [EVC]  │ [EVD]  │ [EVD]  │
			 * 01:00 │ [EVE]  │ [EVF]  │ [EVG]  │ [EVH]  │
			 * ```
			 */
			const events = [
				createEventStub("EVA", 0, 0, 0, 30),
				createEventStub("EVB", 0, 30, 1, 0),
				createEventStub("EVC", 0, 30, 1, 0),
				createEventStub("EVD", 0, 30, 1, 0),
				createEventStub("EVE", 1, 0, 1, 30),
				createEventStub("EVF", 1, 0, 1, 30),
				createEventStub("EVG", 1, 0, 1, 30),
				createEventStub("EVH", 1, 0, 1, 30),
			]

			const { grid } = CalendarTimeGrid.layoutEvents(events, timeRange, subRowAsMinutes, timeScale, currentDate)

			assertLayoutPosition(grid, "EVA", {
				row: { start: 1, end: 7 },
				column: { start: 1, span: 4 }, // Expands across all 4 columns
			})

			assertLayoutPosition(grid, "EVB", {
				row: { start: 7, end: 13 },
				column: { start: 1, span: 1 },
			})

			assertLayoutPosition(grid, "EVC", {
				row: { start: 7, end: 13 },
				column: { start: 2, span: 1 },
			})

			assertLayoutPosition(grid, "EVD", {
				row: { start: 7, end: 13 },
				column: { start: 3, span: 2 }, // Expands to column 4
			})

			assertLayoutPosition(grid, "EVE", {
				row: { start: 13, end: 19 },
				column: { start: 1, span: 1 },
			})

			assertLayoutPosition(grid, "EVF", {
				row: { start: 13, end: 19 },
				column: { start: 2, span: 1 },
			})

			assertLayoutPosition(grid, "EVG", {
				row: { start: 13, end: 19 },
				column: { start: 3, span: 1 },
			})

			assertLayoutPosition(grid, "EVH", {
				row: { start: 13, end: 19 },
				column: { start: 4, span: 1 },
			})
		})

		o.test("Layout with partial overlapping events", function () {
			/**
			 * ```
			 * Time  │ Col 0  │ Col 1  │ Col 2         │
			 * ──────┼────────┼────────┼───────────────┤
			 * 00:00 │ [EVI]  │ [EVJ]  │ [EVJ]         │
			 * 00:30 │ [EVI]  │ [EVK]  │ [EVM partial] │
			 * 01:00 │ [EVI]  │ [EVL]  │ [EVM partial] │
			 * ```
			 */
			const events = [
				createEventStub("EVI", 0, 0, 1, 30),
				createEventStub("EVJ", 0, 0, 0, 30),
				createEventStub("EVK", 0, 30, 1, 0),
				createEventStub("EVL", 1, 0, 1, 30),
				createEventStub("EVM", 0, 45, 1, 15),
			]

			const { grid } = CalendarTimeGrid.layoutEvents(events, timeRange, subRowAsMinutes, timeScale, currentDate)

			assertLayoutPosition(grid, "EVI", {
				row: { start: 1, end: 19 },
				column: { start: 1, span: 1 },
			})

			assertLayoutPosition(grid, "EVJ", {
				row: { start: 1, end: 7 },
				column: { start: 2, span: 2 }, // Expands to column 3
			})

			assertLayoutPosition(grid, "EVK", {
				row: { start: 7, end: 13 },
				column: { start: 2, span: 1 },
			})

			assertLayoutPosition(grid, "EVL", {
				row: { start: 13, end: 19 },
				column: { start: 2, span: 1 },
			})

			assertLayoutPosition(grid, "EVM", {
				row: { start: 10, end: 16 },
				column: { start: 3, span: 1 },
			})
		})

		o.test("Overflow event spanning beyond visible range", function () {
			const nextDay = incrementDate(new Date(currentDate), 1)
			const overflowEvent = createEventStub("overflow", 23, 30, 23, 59)
			overflowEvent.event.endTime = creteDateWithTime(nextDay, 0, 30)

			const regularEvent = createEventStub("normal", 10, 0, 11, 0)

			const { grid, gridColumnSize } = CalendarTimeGrid.layoutEvents([overflowEvent, regularEvent], timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(gridColumnSize).equals(2)("Overflow event should block its column")

			assertLayoutPosition(grid, "overflow", {
				row: { start: 283, end: -1 },
				column: { start: 1, span: 1 },
			})

			assertLayoutPosition(grid, "normal", {
				row: { start: 121, end: 133 },
				column: { start: 2, span: 1 },
			})
		})

		o.test("Multiple events with different durations", function () {
			const events = [
				createEventStub("short", 9, 0, 9, 15), // 15 minutes
				createEventStub("medium", 9, 20, 10, 20), // 1 hour
				createEventStub("long", 10, 30, 14, 0), // 3.5 hours
			]

			const { grid, gridColumnSize } = CalendarTimeGrid.layoutEvents(events, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(gridColumnSize).equals(1)("Non-overlapping events should share column")
			o.check(grid.size).equals(3)("All events should be in grid")
		})

		o.test("Busy workday scenario (integration test)", function () {
			/**
			 * Realistic calendar day:
			 * 08:00-09:00: Team standup
			 * 08:30-10:00: Design review (overlaps standup)
			 * 10:00-11:00: Coding session
			 * 10:30-11:30: Meeting (overlaps coding)
			 * 13:00-14:00: Lunch break
			 * 14:00-17:00: Deep work block
			 */
			const events = [
				createEventStub("standup", 8, 0, 9, 0),
				createEventStub("design", 8, 30, 10, 0),
				createEventStub("coding", 10, 0, 11, 0),
				createEventStub("meeting", 10, 30, 11, 30),
				createEventStub("lunch", 13, 0, 14, 0),
				createEventStub("deepwork", 14, 0, 17, 0),
			]

			const { grid, gridColumnSize } = CalendarTimeGrid.layoutEvents(events, timeRange, subRowAsMinutes, timeScale, currentDate)

			// Should efficiently pack into 2 columns
			o.check(gridColumnSize === 2).equals(true)("Should use efficient column layout")
			o.check(grid.size).equals(6)("All events should be laid out")

			// Verify no overlaps in same column
			const columnEvents = new Map<number, Array<EventGridData>>()
			for (const [_, eventData] of grid.entries()) {
				const col = eventData.column.start
				if (!columnEvents.has(col)) {
					columnEvents.set(col, [])
				}
				columnEvents.get(col)!.push(eventData)
			}

			// Check each column for overlaps
			for (const [colNum, eventsInCol] of columnEvents.entries()) {
				for (let i = 0; i < eventsInCol.length; i++) {
					for (let j = i + 1; j < eventsInCol.length; j++) {
						const ev1 = eventsInCol[i]
						const ev2 = eventsInCol[j]
						const hasOverlap = ev1.row.start < ev2.row.end && ev1.row.end > ev2.row.start

						o.check(hasOverlap).equals(false)(`Column ${colNum} should not have overlapping events`)
					}
				}
			}
		})
	})
})
