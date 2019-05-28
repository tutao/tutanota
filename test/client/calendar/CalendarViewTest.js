//@flow
import o from "ospec/ospec.js"
import {CalendarView} from "../../../src/calendar/CalendarView"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {getAllDayDateUTC, getMonth} from "../../../src/calendar/CalendarUtils"
import {getStartOfDay} from "../../../src/api/common/utils/DateUtils"
import {downcast, neverNull} from "../../../src/api/common/utils/Utils"

o.spec("CalendarView test", browser(function () {
	let calendarView: CalendarView
	o.beforeEach(function () {
		const logins = {
			getUserController: () => ({
				getCalendarMemberships: () => []
			})
		}
		calendarView = new CalendarView(downcast(logins))
	})


	o("_addDaysForEvent - short event same month", function () {
		const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
		const month = getMonth(event.startTime)

		calendarView._addDaysForEvent(event, month)
		const eventsForDay = neverNull(calendarView._eventsForDays.get(getStartOfDay(event.startTime).getTime()))
		o(eventsForDay[0]).deepEquals(event)
	})

	o("_addDaysForEvent - short event prev month", function () {
		const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
		const prevMonth = getMonth(new Date(2019, 3, 1))
		calendarView._addDaysForEvent(event, prevMonth)
		const eventsForDay = neverNull(calendarView._eventsForDays.get(getStartOfDay(event.startTime).getTime()))
		o(eventsForDay).deepEquals(undefined)
	})

	o("_addDaysForEvent - short event next month", function () {
		const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
		const nextMonth = getMonth(new Date(2019, 5, 1))
		calendarView._addDaysForEvent(event, nextMonth)
		const eventsForDay = neverNull(calendarView._eventsForDays.get(getStartOfDay(event.startTime).getTime()))
		o(eventsForDay).deepEquals(undefined)
	})

	o("_addDaysForEvent - all day event", function () {
		const event = createEvent(getAllDayDateUTC(new Date(2019, 4, 1)), getAllDayDateUTC(new Date(2019, 4, 2)))
		const month = getMonth(event.startTime)

		calendarView._addDaysForEvent(event, month)
		const eventsForDay = neverNull(calendarView._eventsForDays.get(getStartOfDay(event.startTime).getTime()))
		const eventsForNextDay = neverNull(calendarView._eventsForDays.get(getStartOfDay(event.endTime).getTime()))
		o(eventsForDay[0]).deepEquals(event)
		o(eventsForNextDay).deepEquals(undefined)
	})


}))


function createEvent(startTime: Date, endTime: Date): CalendarEvent {
	const event = createCalendarEvent()
	event.startTime = startTime // 1 May 8:00
	event.endTime = endTime
	return event
}
