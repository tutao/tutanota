import o from "@tutao/otest"
import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { createTestEntity } from "../TestUtils.js"
import { incrementDate } from "@tutao/utils"
import { earliestEventToShowTimeIndicator } from "../../../src/calendar-app/calendar/view/CalendarAgendaView.js"

import { makeEventWrapper } from "./CalendarTestUtils"

o.spec("CalendarAgendaViewTest", function () {
	o("earliestEventToShowTimeIndicator", () => {
		let allDayStartDate = new Date()
		allDayStartDate.setUTCHours(0, 0, 0, 0)

		let allDayEndDate = new Date(allDayStartDate)
		allDayEndDate.setUTCHours(0, 0, 0, 0)
		incrementDate(allDayEndDate, 1)

		// If there are two events with the same start time, prefer the one with the lower index
		let actualEventStart = new Date(allDayStartDate)
		actualEventStart.setUTCHours(4, 0, 0, 0)
		let actualEventEnd = new Date(allDayStartDate)
		actualEventEnd.setUTCHours(5, 0, 0, 0)

		const sameTimeEventStart = actualEventStart
		let sameTimeEventEnd = new Date(allDayStartDate)
		sameTimeEventEnd.setUTCHours(6, 0, 0, 0)

		let nextEventStart = new Date(allDayStartDate)
		nextEventStart.setUTCHours(10, 0, 0, 0)
		let nextEventEnd = new Date(allDayStartDate)
		nextEventEnd.setUTCHours(12, 0, 0, 0)

		const events: tutanotaTypeRefs.CalendarEvent[] = [
			createTestEntity<tutanotaTypeRefs.CalendarEvent>(tutanotaTypeRefs.CalendarEventTypeRef, {
				startTime: allDayStartDate,
				endTime: allDayEndDate,
			}),
			createTestEntity<tutanotaTypeRefs.CalendarEvent>(tutanotaTypeRefs.CalendarEventTypeRef, {
				startTime: actualEventStart,
				endTime: actualEventEnd,
			}),
			createTestEntity<tutanotaTypeRefs.CalendarEvent>(tutanotaTypeRefs.CalendarEventTypeRef, {
				startTime: sameTimeEventStart,
				endTime: sameTimeEventEnd,
			}),
			createTestEntity<tutanotaTypeRefs.CalendarEvent>(tutanotaTypeRefs.CalendarEventTypeRef, {
				startTime: nextEventStart,
				endTime: nextEventEnd,
			}),
		]

		o(
			earliestEventToShowTimeIndicator(
				events.map((e) => makeEventWrapper(e)),
				allDayStartDate,
			),
		).equals(1)("lower index preferred")
		o(
			earliestEventToShowTimeIndicator(
				events.map((e) => makeEventWrapper(e)),
				actualEventStart,
			),
		).equals(3)("if the date is equal, skip the event")
		o(
			earliestEventToShowTimeIndicator(
				events.map((e) => makeEventWrapper(e)),
				nextEventStart,
			),
		).equals(null)("no dates left")
	})
})
