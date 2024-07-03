import o from "@tutao/otest"
import { CalendarEvent, CalendarEventTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity } from "../TestUtils.js"
import { incrementDate } from "@tutao/tutanota-utils"
import { earliestEventToShowTimeIndicator } from "../../../src/calendar-app/calendar/view/CalendarAgendaView.js"

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

		const events: CalendarEvent[] = [
			createTestEntity<CalendarEvent>(CalendarEventTypeRef, {
				startTime: allDayStartDate,
				endTime: allDayEndDate,
			}),
			createTestEntity<CalendarEvent>(CalendarEventTypeRef, {
				startTime: actualEventStart,
				endTime: actualEventEnd,
			}),
			createTestEntity<CalendarEvent>(CalendarEventTypeRef, {
				startTime: sameTimeEventStart,
				endTime: sameTimeEventEnd,
			}),
			createTestEntity<CalendarEvent>(CalendarEventTypeRef, {
				startTime: nextEventStart,
				endTime: nextEventEnd,
			}),
		]

		o(earliestEventToShowTimeIndicator(events, allDayStartDate)).equals(1)("lower index preferred")
		o(earliestEventToShowTimeIndicator(events, actualEventStart)).equals(3)("if the date is equal, skip the event")
		o(earliestEventToShowTimeIndicator(events, nextEventStart)).equals(null)("no dates left")
		o(earliestEventToShowTimeIndicator(events, new Date(0))).equals(1)("even before the day, all-day events are skipped")
	})
})
