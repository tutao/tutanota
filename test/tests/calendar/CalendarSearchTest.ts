import o from "@tutao/otest"
import { createTestEntity } from "../TestUtils"
import { CalendarEvent, CalendarEventTypeRef } from "@tutao/entities/tutanota"
import { SearchModel } from "../../../src/applications/mail-app/search/model/SearchModel"
import { object, when } from "testdouble"
import { CalendarModel } from "../../../src/applications/calendar-app/calendar/model/CalendarModel"
import { CalendarEventsRepository, DaysToEvents } from "../../../src/applications/common/calendar/date/CalendarEventsRepository"
import { getStartOfDay } from "../../../src/platform-kit/utils"

o.spec("CalendarSearchTest", function () {
	let search: SearchModel
	let calendarRepo: CalendarEventsRepository

	o.beforeEach(function () {
		search = object()
		calendarRepo = object()
	})
	o.spec("Event Search", function () {
		o.test("searching an event should return all the events that contain query in summary or description", function () {
			const eventStartDate = new Date(2026, 7, 27)
			const eventEndDate = new Date(2026, 7, 28)
			const event1 = createTestEntity(CalendarEventTypeRef, {
				summary: "test event",
				description: "",
				startTime: eventStartDate,
				endTime: eventEndDate,
			})
			const event2 = createTestEntity(CalendarEventTypeRef, {
				summary: "no summary",
				description: "test event",
				startTime: eventStartDate,
				endTime: eventEndDate,
			})
		})
	})
})
