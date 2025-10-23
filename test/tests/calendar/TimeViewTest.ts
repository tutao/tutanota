import o from "@tutao/otest"
import { ColumnData, GridEventData, RowBounds, TimeRange, TimeScale, TimeView } from "../../../src/common/calendar/gui/TimeView"
import { Time } from "../../../src/common/calendar/date/Time"
import { createTestEntity } from "../TestUtils"
import { CalendarEventTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { EventWrapper } from "../../../src/calendar-app/calendar/view/CalendarViewModel"

o.spec("TimeView", function () {
	let eventsMap: Map<Id, RowBounds> = new Map()
	let columns: Array<ColumnData> = []

	const timeRange: TimeRange = {
		start: new Time(0, 0),
		end: new Time(23, 0),
	}
	const subRowAsMinutes = 5
	const timeScale: TimeScale = 1
	const currentDate = new Date(2025, 9, 22, 0, 0)

	const createEventStub = (id: string, startHour: number, startMinute: number, endHour: number, endMinute: number): EventWrapper => {
		return {
			event: createTestEntity(CalendarEventTypeRef, {
				_id: ["foo", id],
				startTime: new Date(2025, 9, 22, startHour, startMinute),
				endTime: new Date(2025, 9, 22, endHour, endMinute),
				summary: id,
			}),
			isGhost: false,
			isFeatured: false,
			isConflict: false,
			color: "#FFF",
		}
	}

	const assertLayoutPosition = (grid: Map<Id, GridEventData>, eventId: string, expected: GridEventData) => {
		const actual = grid.get(eventId)
		o.check(actual?.row).deepEquals(expected.row)(`${eventId} row mismatch`)
		o.check(actual?.column).deepEquals(expected.column)(`${eventId} column mismatch`)
	}

	o.beforeEach(function () {
		eventsMap = new Map([
			["ev1", { start: 1, end: 3 }],
			["ev2", { start: 1, end: 2 }],
			["ev3", { start: 1, end: 2 }],
			["ev4", { start: 1, end: 3 }],
		])

		columns = []
		for (const [evId, rowBounds] of eventsMap.entries()) {
			columns.push({
				lastEventEndingRow: rowBounds.end,
				events: new Map([[evId, rowBounds]]),
			})
		}
	})

	o.spec("calculateColumnSpan", function () {
		o.test("Stops expansion when finds a conflict", function () {
			const eventColumnIndex = 1
			const eventId: Id = "eventToBeEvaluated"
			const eventRowBounds: RowBounds = {
				start: 2,
				end: 3,
			}
			columns[eventColumnIndex].events.set(eventId, eventRowBounds)

			const columnSpan = TimeView.calculateColumnSpan(eventColumnIndex, eventRowBounds, columns)

			o.check(columnSpan).equals(2)
		})

		o.test("Stops expansion when reaches last column", function () {
			const eventColumnIndex = 0
			const eventId: Id = "eventToBeEvaluated"
			const eventRowBounds: RowBounds = {
				start: 2,
				end: 3,
			}
			columns[eventColumnIndex].events.set(eventId, eventRowBounds)

			const columnSpan = TimeView.calculateColumnSpan(eventColumnIndex, eventRowBounds, columns)

			o.check(columnSpan).equals(3)
		})
	})

	o.spec("buildGridDataWithExpansion", function () {
		o.test("Transforms columns into grid event data", function () {
			const grid = TimeView.buildGridDataWithExpansion(columns)

			o.check(grid.get("ev1")?.column.start).equals(1)
			o.check(grid.get("ev1")?.column.span).equals(1)

			o.check(grid.get("ev2")?.column.start).equals(2)
			o.check(grid.get("ev2")?.column.span).equals(1)

			o.check(grid.get("ev3")?.column.start).equals(3)
			o.check(grid.get("ev3")?.column.span).equals(1)

			o.check(grid.get("ev4")?.column.start).equals(4)
			o.check(grid.get("ev4")?.column.span).equals(1)
		})
	})

	o.spec("packEventsIntoColumns", function () {
		o.test("No events", function () {
			const resultColumns = TimeView.packEventsIntoColumns(new Map())

			o.check(resultColumns.length).equals(0)
		})
		o.test("Subsequent events gets assigned to the same column", function () {
			const newEvId = "newEvent"
			eventsMap.set(newEvId, { start: 2, end: 3 })

			const resultColumns = TimeView.packEventsIntoColumns(eventsMap)

			o.check(resultColumns[1].events.get(newEvId)).notEquals(undefined)
			o.check(resultColumns[1].lastEventEndingRow).equals(3)
			o.check(resultColumns[1].events.size).equals(2) // Original ev + newEv
		})
		/**
		 * When a column is occupied it gets assigned to the next free column (without overlapping event)
		 */
		o.spec("Overlapping events", function () {
			o.test("Event A ends during Event B", function () {
				const newEvId = "eventA"
				eventsMap.set("eventB", { start: 5, end: 7 })
				eventsMap.set(newEvId, { start: 4, end: 6 })

				const resultColumns = TimeView.packEventsIntoColumns(eventsMap)

				o.check(resultColumns[0].events.get("eventB")).notEquals(undefined)
				o.check(resultColumns[1].events.get(newEvId)).notEquals(undefined)
				o.check(resultColumns[1].lastEventEndingRow).equals(6)
				o.check(resultColumns[1].events.size).equals(2) // Original ev + newEv
			})
			o.test("Event A starts during Event B", function () {
				const newEvId = "eventA"
				eventsMap.set("eventB", { start: 5, end: 7 })
				eventsMap.set(newEvId, { start: 6, end: 8 })

				const resultColumns = TimeView.packEventsIntoColumns(eventsMap)

				o.check(resultColumns[0].events.get("eventB")).notEquals(undefined)
				o.check(resultColumns[1].events.get(newEvId)).notEquals(undefined)
				o.check(resultColumns[1].lastEventEndingRow).equals(8)
				o.check(resultColumns[1].events.size).equals(2) // Original ev + newEv
			})
			o.test("Event A starts before and ends after Event B", function () {
				const newEvId = "eventA"
				eventsMap.set("eventB", { start: 5, end: 7 })
				eventsMap.set(newEvId, { start: 4, end: 8 })

				const resultColumns = TimeView.packEventsIntoColumns(eventsMap)

				o.check(resultColumns[0].events.get("eventB")).notEquals(undefined)
				o.check(resultColumns[1].events.get(newEvId)).notEquals(undefined)
				o.check(resultColumns[1].lastEventEndingRow).equals(8)
				o.check(resultColumns[1].events.size).equals(2) // Original ev + newEv
			})
			o.test("Event A starts and ends as Event B", function () {
				const newEvId = "eventA"
				eventsMap.set("eventB", { start: 5, end: 7 })
				eventsMap.set(newEvId, { start: 5, end: 7 })

				const resultColumns = TimeView.packEventsIntoColumns(eventsMap)

				o.check(resultColumns[0].events.get("eventB")).notEquals(undefined)
				o.check(resultColumns[1].events.get(newEvId)).notEquals(undefined)
				o.check(resultColumns[1].lastEventEndingRow).equals(7)
				o.check(resultColumns[1].events.size).equals(2) // Original ev + newEv
			})
		})
	})

	o.spec("getRowBounds", function () {
		o.test("Event starts and ends today", function () {
			const eventBounds = {
				startTime: new Date(2025, 9, 22, 0, 0),
				endTime: new Date(2025, 9, 22, 0, 30),
			}
			const bounds = TimeView.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)
			o.check(bounds).deepEquals({
				start: 1,
				end: 7,
			})
		})
		o.test("Event starts yesterday ends today", function () {
			const eventBounds = {
				startTime: new Date(2025, 9, 22, 0, 0),
				endTime: new Date(2025, 9, 22, 0, 30),
			}

			const bounds = TimeView.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)
			o.check(bounds).deepEquals({
				start: 1,
				end: 7,
			})
		})
		o.test("Event starts today ends tomorrow", function () {
			const eventBounds = {
				startTime: new Date(2025, 9, 22, 23, 30),
				endTime: new Date(2025, 9, 23, 0, 30),
			}

			const bounds = TimeView.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)
			o.check(bounds).deepEquals({
				start: 283, // 23 hours * 12 rows/hour + 30 minutes / 5 minutes/row + 1
				end: -1,
			})
		})
		o.test("Event passes through today", function () {
			const eventBounds = {
				startTime: new Date(2025, 9, 21, 23, 30),
				endTime: new Date(2025, 9, 23, 0, 30),
			}

			const bounds = TimeView.getRowBounds(eventBounds, timeRange, subRowAsMinutes, timeScale, currentDate)
			o.check(bounds).deepEquals({
				start: 1,
				end: -1,
			})
		})
		o.test("Event starting between grid intervals gets rounded to previous grid boundary", function () {
			const eventOneTimes = {
				startTime: new Date(2025, 9, 22, 0, 1),
				endTime: new Date(2025, 9, 22, 0, 5),
			}

			const eventTwoTimes = {
				startTime: new Date(2025, 9, 22, 0, 3),
				endTime: new Date(2025, 9, 22, 0, 5),
			}

			const eventOneBounds = TimeView.getRowBounds(eventOneTimes, timeRange, subRowAsMinutes, timeScale, currentDate)
			const eventTwoBounds = TimeView.getRowBounds(eventTwoTimes, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(eventOneBounds).deepEquals({
				start: 1,
				end: 2,
			})

			o.check(eventTwoBounds).deepEquals({
				start: 1,
				end: 2,
			})
		})
		o.test("Event ending between grid intervals gets rounded to next grid boundary", function () {
			const eventOneTimes = {
				startTime: new Date(2025, 9, 22, 0, 0),
				endTime: new Date(2025, 9, 22, 0, 1),
			}

			const eventTwoTimes = {
				startTime: new Date(2025, 9, 22, 0, 0),
				endTime: new Date(2025, 9, 22, 0, 12),
			}

			const eventThreeTimes = {
				startTime: new Date(2025, 9, 22, 0, 0),
				endTime: new Date(2025, 9, 22, 0, 8),
			}

			const eventOneBounds = TimeView.getRowBounds(eventOneTimes, timeRange, subRowAsMinutes, timeScale, currentDate)
			const eventTwoBounds = TimeView.getRowBounds(eventTwoTimes, timeRange, subRowAsMinutes, timeScale, currentDate)
			const eventThreeBounds = TimeView.getRowBounds(eventThreeTimes, timeRange, subRowAsMinutes, timeScale, currentDate)

			o.check(eventOneBounds).deepEquals({
				start: 1,
				end: 2,
			})

			o.check(eventTwoBounds).deepEquals({
				start: 1,
				end: 4,
			})

			o.check(eventThreeBounds).deepEquals({
				start: 1,
				end: 3,
			})
		})
	})

	o.spec("layoutEvents", function () {
		o.test("Transforms a list of events into a structure grid", function () {
			/**
			 *  EVA EVA EVA EVA
			 *  EVB EVC EVD EVD
			 *  EVE EVF EVG EVH
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

			const { grid } = TimeView.layoutEvents(events, timeRange, subRowAsMinutes, timeScale, currentDate)

			assertLayoutPosition(grid, "EVA", {
				row: { start: 1, end: 7 },
				column: { start: 1, span: 4 },
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
				column: { start: 3, span: 2 },
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

		/**
		 * Integration test
		 */
		o.test("Transforms a list of events into a structure grid with partial events", function () {
			/**
			 *  EVI EVJ EVJ
			 *  EVI EVK EVM(Partial)
			 *  EVI EVL EVM(Partial)
			 */
			const events = [
				createEventStub("EVI", 0, 0, 1, 30),
				createEventStub("EVJ", 0, 0, 0, 30),
				createEventStub("EVK", 0, 30, 1, 0),
				createEventStub("EVL", 1, 0, 1, 30),
				createEventStub("EVM", 0, 45, 1, 15),
			]

			const { grid } = TimeView.layoutEvents(events, timeRange, subRowAsMinutes, timeScale, currentDate)

			assertLayoutPosition(grid, "EVI", {
				row: { start: 1, end: 19 },
				column: { start: 1, span: 1 },
			})

			assertLayoutPosition(grid, "EVJ", {
				row: { start: 1, end: 7 },
				column: { start: 2, span: 2 },
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
	})
})
