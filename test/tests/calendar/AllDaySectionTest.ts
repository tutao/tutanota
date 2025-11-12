import o from "@tutao/otest"
import { AllDaySection } from "../../../src/common/calendar/gui/AllDaySection"
import { createTestEntity, makeEventWrapper } from "../TestUtils"
import { CalendarEvent, CalendarEventTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { getAllDayDateUTCFromZone, getTimeZone } from "../../../src/common/calendar/date/CalendarUtils"
import { ColumnBounds } from "../../../src/common/calendar/gui/CalendarTimeGrid"

o.spec("AllDaySection", function () {
	const BASE_YEAR = 2025
	const BASE_MONTH = 10 // November (JS Months are 0-indexed)

	const dates = [
		new Date(BASE_YEAR, BASE_MONTH, 6, 0, 0),
		new Date(BASE_YEAR, BASE_MONTH, 7, 0, 0),
		new Date(BASE_YEAR, BASE_MONTH, 8, 0, 0),
		new Date(BASE_YEAR, BASE_MONTH, 9, 0, 0),
		new Date(BASE_YEAR, BASE_MONTH, 10, 0, 0),
	]

	const createAllDayEventStub = (id: string, startDate: Date, endDate: Date): CalendarEvent => {
		return createTestEntity(CalendarEventTypeRef, {
			_id: ["long-events-list", id],
			startTime: getAllDayDateUTCFromZone(startDate, getTimeZone()),
			endTime: getAllDayDateUTCFromZone(endDate, getTimeZone()),
			summary: id,
		})
	}

	const createEventStub = (id: string, startDate: Date, endDate: Date): CalendarEvent => {
		return createTestEntity(CalendarEventTypeRef, {
			_id: ["short-events-list", id],
			startTime: startDate,
			endTime: endDate,
			summary: id,
		})
	}

	// Helper to create dates more easily using day offsets
	const makeDate = (year: number, month: number, day: number, hour = 0, minute = 0): Date => {
		return new Date(year, month, day, hour, minute)
	}

	o.spec("getColumnBounds", function () {
		o.spec("All day events", function () {
			o.test("Single day event", function () {
				const event = createAllDayEventStub("single-day", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 7))

				const bounds = AllDaySection.getColumnBounds(event, dates)

				o(bounds).deepEquals({ start: 1, span: 1 })
			})

			o.spec("Multi day events", function () {
				o.test("Spans two consecutive days", function () {
					const event = createAllDayEventStub("two-days", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 8))

					const bounds = AllDaySection.getColumnBounds(event, dates)

					o(bounds).deepEquals({ start: 1, span: 2 })
				})

				o.test("Spans entire date range", function () {
					const event = createAllDayEventStub("full-range", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 11))

					const bounds = AllDaySection.getColumnBounds(event, dates)

					o(bounds).deepEquals({ start: 1, span: dates.length })
				})

				o.test("Event starts before visible range", function () {
					const event = createAllDayEventStub("starts-before", makeDate(BASE_YEAR, BASE_MONTH, 5), makeDate(BASE_YEAR, BASE_MONTH, 8))

					const bounds = AllDaySection.getColumnBounds(event, dates)

					// Should be clamped to start of range, showing only visible portion
					o(bounds).deepEquals({ start: 1, span: 2 })
				})

				o.test("Event ends after visible range", function () {
					const event = createAllDayEventStub(
						"ends-after",
						makeDate(BASE_YEAR, BASE_MONTH, 7), // Second day in range
						makeDate(BASE_YEAR, BASE_MONTH, 15),
					)

					const bounds = AllDaySection.getColumnBounds(event, dates)

					// Should span from day 2 to end of range
					o(bounds).deepEquals({ start: 2, span: dates.length - 1 })
				})

				o.test("Event spans beyond both ends of range", function () {
					const event = createAllDayEventStub("spans-through", makeDate(BASE_YEAR, BASE_MONTH, 5), makeDate(BASE_YEAR, BASE_MONTH, 15))

					const bounds = AllDaySection.getColumnBounds(event, dates)

					// Should fill entire visible range
					o(bounds).deepEquals({ start: 1, span: dates.length })
				})
			})
		})

		o.spec("Timed multi-day events", function () {
			o.test("Event exactly 24 hours long", function () {
				const event = createEventStub("24hrs", makeDate(BASE_YEAR, BASE_MONTH, 6, 11, 0), makeDate(BASE_YEAR, BASE_MONTH, 7, 11, 0))

				const bounds = AllDaySection.getColumnBounds(event, dates)

				o(bounds).deepEquals({ start: 1, span: 2 })
			})

			o.test("Event longer than 24 hours spanning two days", function () {
				const event = createEventStub("28hrs", makeDate(BASE_YEAR, BASE_MONTH, 6, 11, 0), makeDate(BASE_YEAR, BASE_MONTH, 7, 15, 0))

				const bounds = AllDaySection.getColumnBounds(event, dates)

				o(bounds).deepEquals({ start: 1, span: 2 })
			})

			o.test("Event spanning three calendar days", function () {
				const event = createEventStub("48hrs", makeDate(BASE_YEAR, BASE_MONTH, 6, 11, 0), makeDate(BASE_YEAR, BASE_MONTH, 8, 11, 0))

				const bounds = AllDaySection.getColumnBounds(event, dates)

				o(bounds).deepEquals({ start: 1, span: 3 })
			})

			o.test("Event starts before range, ends on first day", function () {
				const event = createEventStub("starts-before-timed", makeDate(BASE_YEAR, BASE_MONTH, 4, 11, 0), makeDate(BASE_YEAR, BASE_MONTH, 6, 11, 0))

				const bounds = AllDaySection.getColumnBounds(event, dates)

				o(bounds).deepEquals({ start: 1, span: 1 })
			})
		})
	})

	o.spec("packEventsIntoRows", function () {
		o.test("Empty event map returns empty rows", function () {
			const rows = AllDaySection.packEventsIntoRows(new Map())

			o(rows).deepEquals([])
		})

		o.test("Overlapping events on same day occupy separate rows", function () {
			const evA = makeEventWrapper(createAllDayEventStub("evA", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 7)))
			const evB = makeEventWrapper(createAllDayEventStub("evB", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 7)))
			const events = [evA, evB]
			const eventsMap = new Map(
				events.map((wrapper) => {
					const bounds = AllDaySection.getColumnBounds(wrapper.event, dates)
					return [wrapper, bounds]
				}),
			)

			const rows = AllDaySection.packEventsIntoRows(eventsMap)

			o(rows.length).equals(2)
			o(rows).deepEquals([
				{
					lastOccupiedColumn: 2,
					events: new Map([[evA, eventsMap.get(evA)!]]),
				},
				{
					lastOccupiedColumn: 2,
					events: new Map([[evB, eventsMap.get(evB)!]]),
				},
			])
		})

		o.test("Non-overlapping events share the same row", function () {
			const evA = makeEventWrapper(createAllDayEventStub("evA", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 7)))
			const evB = makeEventWrapper(createAllDayEventStub("evB", makeDate(BASE_YEAR, BASE_MONTH, 7), makeDate(BASE_YEAR, BASE_MONTH, 8)))
			const events = [evA, evB]
			const eventsMap = new Map(
				events.map((wrapper) => {
					const bounds = AllDaySection.getColumnBounds(wrapper.event, dates)
					return [wrapper, bounds]
				}),
			)

			const rows = AllDaySection.packEventsIntoRows(eventsMap)

			o(rows.length).equals(1)
			o(rows).deepEquals([
				{
					lastOccupiedColumn: 3,
					events: eventsMap,
				},
			])
		})

		o.test("Complex scenario: multiple overlaps and gaps", function () {
			// Event A: spans days 1-2
			const evA = makeEventWrapper(createAllDayEventStub("evA", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 8)))
			// Event B: overlaps with A on day 1
			const evB = makeEventWrapper(createAllDayEventStub("evB", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 7)))
			// Event C: starts on day 3 (no overlap with A or B)
			const evC = makeEventWrapper(createAllDayEventStub("evC", makeDate(BASE_YEAR, BASE_MONTH, 8), makeDate(BASE_YEAR, BASE_MONTH, 9)))

			const events = [evA, evB, evC]
			const eventsMap = new Map(
				events.map((wrapper) => {
					const bounds = AllDaySection.getColumnBounds(wrapper.event, dates)
					return [wrapper, bounds]
				}),
			)

			const rows = AllDaySection.packEventsIntoRows(eventsMap)

			// A and C should share row 1, B should be in row 2
			o(rows.length).equals(2)
		})
	})

	o.spec("layoutEvents", function () {
		o.test("Layout empty event list", function () {
			const rows = AllDaySection.layoutEvents([], dates)

			o(rows).deepEquals([])
		})

		o.test("Layout single event", function () {
			const event = createAllDayEventStub("single", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 7))
			const wrapper = makeEventWrapper(event)

			const rows = AllDaySection.layoutEvents([wrapper], dates)

			// Verify structure: should have one row with one event
			o(rows.length).equals(1)
			o(rows[0].events.size).equals(1)
		})

		o.test("Layout multiple non-overlapping events", function () {
			const ev1 = makeEventWrapper(createAllDayEventStub("ev1", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 7)))
			const ev2 = makeEventWrapper(createAllDayEventStub("ev2", makeDate(BASE_YEAR, BASE_MONTH, 8), makeDate(BASE_YEAR, BASE_MONTH, 9)))

			const rows = AllDaySection.layoutEvents([ev1, ev2], dates)

			// Should pack into single row
			o(rows.length).equals(1)
			o(rows[0].events.size).equals(2)
		})

		o.test("Layout overlapping events requiring multiple rows", function () {
			const ev1 = makeEventWrapper(createAllDayEventStub("ev1", makeDate(BASE_YEAR, BASE_MONTH, 6), makeDate(BASE_YEAR, BASE_MONTH, 8)))
			const ev1Bounds: ColumnBounds = {
				start: 1,
				span: 2,
			}
			const ev2 = makeEventWrapper(createAllDayEventStub("ev2", makeDate(BASE_YEAR, BASE_MONTH, 7), makeDate(BASE_YEAR, BASE_MONTH, 9)))
			const ev2Bounds: ColumnBounds = {
				start: 2,
				span: 2,
			}
			const rows = AllDaySection.layoutEvents([ev1, ev2], dates)

			// Should require 2 rows due to overlap
			o(rows.length).equals(2)
			o(rows).deepEquals([
				{
					lastOccupiedColumn: 3,
					events: new Map([[ev1, ev1Bounds]]),
				},
				{
					lastOccupiedColumn: 4,
					events: new Map([[ev2, ev2Bounds]]),
				},
			])
		})
	})
})
