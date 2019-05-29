//@flow
import o from "ospec/ospec.js"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {getAllDayDateUTC, getMonth} from "../../../src/calendar/CalendarUtils"
import {getStartOfDay} from "../../../src/api/common/utils/DateUtils"
import {clone, neverNull} from "../../../src/api/common/utils/Utils"
import {mapToObject} from "../../api/TestUtils"
import {addDaysForEvent, addDaysForLongEvent, addDaysForRecurringEvent} from "../../../src/calendar/CalendarModel"
import {createRepeatRule} from "../../../src/api/entities/tutanota/RepeatRule"
import {RepeatPeriod} from "../../../src/api/common/TutanotaConstants"

o.spec("CalendarView test", function () {
	o.spec("addDaysForEvent", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})

		o("short event same month", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
			const month = getMonth(event.startTime)

			addDaysForEvent(eventsForDays, event, month)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals([event])
		})

		o("short event prev month", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
			const prevMonth = getMonth(new Date(2019, 3, 1))
			addDaysForEvent(eventsForDays, event, prevMonth)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals(undefined)
		})

		o("short event next month", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
			const nextMonth = getMonth(new Date(2019, 5, 1))
			addDaysForEvent(eventsForDays, event, nextMonth)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals(undefined)
		})

		o("short event multiple days", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 4, 10))
			const thisMonth = getMonth(new Date(2019, 4, 1))
			const nextMonth = getMonth(new Date(2019, 5, 1))

			addDaysForEvent(eventsForDays, event, nextMonth)
			o(eventsForDays.size).equals(0)

			addDaysForEvent(eventsForDays, event, thisMonth)
			o(mapToObject(eventsForDays)).deepEquals({
				[getStartOfDay(new Date(2019, 4, 1)).getTime()]: [event],
				[getStartOfDay(new Date(2019, 4, 2)).getTime()]: [event],
				[getStartOfDay(new Date(2019, 4, 3)).getTime()]: [event],
				[getStartOfDay(new Date(2019, 4, 4)).getTime()]: [event],
			})
		})

		o("short event multiple days spans next month", function () {
			const event = createEvent(new Date(2019, 4, 29, 8), new Date(2019, 5, 2, 10))
			const thisMonth = getMonth(new Date(2019, 4, 1))
			const nextMonth = getMonth(new Date(2019, 5, 1))

			addDaysForEvent(eventsForDays, event, nextMonth)
			o(eventsForDays.size).equals(0)

			addDaysForEvent(eventsForDays, event, thisMonth)
			o(mapToObject(eventsForDays)).deepEquals({
				[getStartOfDay(new Date(2019, 4, 29)).getTime()]: [event],
				[getStartOfDay(new Date(2019, 4, 30)).getTime()]: [event],
				[getStartOfDay(new Date(2019, 4, 31)).getTime()]: [event],
				[getStartOfDay(new Date(2019, 5, 1)).getTime()]: [event],
				[getStartOfDay(new Date(2019, 5, 2)).getTime()]: [event],
			})
		})

		o("all day event", function () {
			const event = createEvent(getAllDayDateUTC(new Date(2019, 4, 1)), getAllDayDateUTC(new Date(2019, 4, 2)))
			const month = getMonth(event.startTime)

			addDaysForEvent(eventsForDays, event, month)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			const eventsForNextDay = neverNull(eventsForDays.get(getStartOfDay(event.endTime).getTime()))
			o(eventsForDay).deepEquals([event])
			o(eventsForNextDay).deepEquals(undefined)
		})


		o("all day event two days", function () {
			const event = createEvent(getAllDayDateUTC(new Date(2019, 3, 30)), getAllDayDateUTC(new Date(2019, 4, 2)))
			const eventEndMonth = getMonth(new Date(2019, 4, 1))

			// do not create events if event does not start in specified month
			{
				addDaysForEvent(eventsForDays, event, eventEndMonth)
				o(eventsForDays.size).deepEquals(0)
			}

			// create events if event starts in specified month
			{
				const eventStartMonth = getMonth(new Date(2019, 3, 1))
				addDaysForEvent(eventsForDays, event, eventStartMonth)
				const eventsForStartDay = neverNull(eventsForDays.get(getStartOfDay(new Date(2019, 3, 30)).getTime()))
				const eventsForSecondDay = neverNull(eventsForDays.get(getStartOfDay(new Date(2019, 4, 1)).getTime()))
				o(eventsForDays.size).deepEquals(2)
				o(eventsForStartDay).deepEquals([event])
				o(eventsForSecondDay).deepEquals([event])
			}
		})
	})

	o.spec("addDaysForRecurringEvent", function () {

		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})

		o("recuring event - short with time ", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 4, 2, 12))
			event.repeatRule = createRepeatRule()
			event.repeatRule.frequency = RepeatPeriod.WEEKLY
			event.repeatRule.interval = "1"
			// TODO: set timezone on repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)))

			const expectedForJune = {
				[new Date(2019, 5, 6).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 6, 10), new Date(2019, 5, 6, 12))],
				[new Date(2019, 5, 13).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 13, 10), new Date(2019, 5, 13, 12))],
				[new Date(2019, 5, 20).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 20, 10), new Date(2019, 5, 20, 12))],
				[new Date(2019, 5, 27).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 27, 10), new Date(2019, 5, 27, 12))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4)))

			const expectedForJuneAndJuly = Object.assign({}, expectedForJune, {
				[new Date(2019, 4, 2).getTime()]: [event],
				[new Date(2019, 4, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 9, 10), new Date(2019, 4, 9, 12))],
				[new Date(2019, 4, 16).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 16, 10), new Date(2019, 4, 16, 12))],
				[new Date(2019, 4, 23).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 23, 10), new Date(2019, 4, 23, 12))],
				[new Date(2019, 4, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 30, 10), new Date(2019, 4, 30, 12))],
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuneAndJuly)
		})

		o("recuring event - short with time & day interval", function () {
			const event = createEvent(new Date(2019, 4, 30, 10), new Date(2019, 4, 30, 12))
			event.repeatRule = createRepeatRule()
			event.repeatRule.frequency = RepeatPeriod.DAILY
			event.repeatRule.interval = "4"
			// TODO: set timezone on repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)))

			const expectedForJune = {
				[new Date(2019, 5, 3).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 3, 10), new Date(2019, 5, 3, 12))],
				[new Date(2019, 5, 7).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 7, 10), new Date(2019, 5, 7, 12))],
				[new Date(2019, 5, 11).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 11, 10), new Date(2019, 5, 11, 12))],
				[new Date(2019, 5, 15).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 15, 10), new Date(2019, 5, 15, 12))],
				[new Date(2019, 5, 19).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 19, 10), new Date(2019, 5, 19, 12))],
				[new Date(2019, 5, 23).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 23, 10), new Date(2019, 5, 23, 12))],
				[new Date(2019, 5, 27).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 27, 10), new Date(2019, 5, 27, 12))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)
		})

		o.only("recuring event - short with time & monthly interval", function () {
			const event = createEvent(new Date(2019, 4, 31, 10), new Date(2019, 4, 31, 12))
			event.repeatRule = createRepeatRule()
			event.repeatRule.frequency = RepeatPeriod.MONTHLY
			event.repeatRule.interval = "2"
			// TODO: set timezone on repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)))
			o(mapToObject(eventsForDays)).deepEquals({})

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6)))
			const expectedForJuly = {
				[new Date(2019, 6, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 6, 31, 10), new Date(2019, 6, 31, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 7)))
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			const expectedForSeptember = Object.assign({}, expectedForJuly, {
				[new Date(2019, 8, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 8, 31, 10), new Date(2019, 8, 31, 12))]
			})
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 8)))
			// o(mapToObject(eventsForDays)).deepEquals(expectedForSeptember)
			const expectedForNovember = Object.assign({}, expectedForSeptember, {
				[new Date(2019, 10, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 10, 31, 10), new Date(2019, 10, 31, 12))]
			})
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 10)))
			o(eventsForDays).deepEquals(expectedForNovember)
		})

		o("recuring event - short multiple days ", function () {
			const event = createEvent(new Date(2019, 4, 3, 10), new Date(2019, 4, 5, 12))
			event.repeatRule = createRepeatRule()
			event.repeatRule.frequency = RepeatPeriod.WEEKLY
			event.repeatRule.interval = "1"
			// TODO: set timezone on repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)))

			const expectedForJune = {
				[new Date(2019, 5, 7).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 7, 10), new Date(2019, 5, 9, 12))],
				[new Date(2019, 5, 8).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 7, 10), new Date(2019, 5, 9, 12))],
				[new Date(2019, 5, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 7, 10), new Date(2019, 5, 9, 12))],

				[new Date(2019, 5, 14).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 14, 10), new Date(2019, 5, 16, 12))],
				[new Date(2019, 5, 15).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 14, 10), new Date(2019, 5, 16, 12))],
				[new Date(2019, 5, 16).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 14, 10), new Date(2019, 5, 16, 12))],

				[new Date(2019, 5, 21).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 21, 10), new Date(2019, 5, 23, 12))],
				[new Date(2019, 5, 22).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 21, 10), new Date(2019, 5, 23, 12))],
				[new Date(2019, 5, 23).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 21, 10), new Date(2019, 5, 23, 12))],

				[new Date(2019, 5, 28).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 28, 10), new Date(2019, 5, 30, 12))],
				[new Date(2019, 5, 29).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 28, 10), new Date(2019, 5, 30, 12))],
				[new Date(2019, 5, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 28, 10), new Date(2019, 5, 30, 12))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4)))

			const expectedForJuneAndJuly = Object.assign({}, expectedForJune, {
				[new Date(2019, 4, 3).getTime()]: [event],
				[new Date(2019, 4, 4).getTime()]: [event],
				[new Date(2019, 4, 5).getTime()]: [event],

				[new Date(2019, 4, 10).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 10, 10), new Date(2019, 4, 12, 12))],
				[new Date(2019, 4, 11).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 10, 10), new Date(2019, 4, 12, 12))],
				[new Date(2019, 4, 12).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 10, 10), new Date(2019, 4, 12, 12))],

				[new Date(2019, 4, 17).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 17, 10), new Date(2019, 4, 19, 12))],
				[new Date(2019, 4, 18).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 17, 10), new Date(2019, 4, 19, 12))],
				[new Date(2019, 4, 19).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 17, 10), new Date(2019, 4, 19, 12))],

				[new Date(2019, 4, 24).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 24, 10), new Date(2019, 4, 26, 12))],
				[new Date(2019, 4, 25).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 24, 10), new Date(2019, 4, 26, 12))],
				[new Date(2019, 4, 26).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 24, 10), new Date(2019, 4, 26, 12))],

				[new Date(2019, 4, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 31, 10), new Date(2019, 5, 2, 12))],
				[new Date(2019, 5, 1).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 31, 10), new Date(2019, 5, 2, 12))],
				[new Date(2019, 5, 2).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 31, 10), new Date(2019, 5, 2, 12))],
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuneAndJuly)
		})
	})

	o.spec("addDaysForEvent for long events", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})


		o("longer than a month", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2)))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2)))
			o(eventsForDays.size).equals(32)
			o(eventsForDays.get(new Date(2019, 4, 1).getTime())).equals(undefined)
			o(eventsForDays.get(new Date(2019, 4, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals([event])
		})

		o("longer than a month all day", function () {
			const event = createEvent(getAllDayDateUTC(new Date(2019, 4, 2, 10)), getAllDayDateUTC(new Date(2019, 5, 3, 12)))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2)))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2)))
			o(eventsForDays.size).equals(32)
			o(eventsForDays.get(new Date(2019, 4, 1).getTime())).equals(undefined)
			o(eventsForDays.get(new Date(2019, 4, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals([event])
		})

		o("multiple months", function () {
			const event = createEvent(new Date(2019, 3, 2, 10), new Date(2019, 5, 2, 12))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2)))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2)))
			o(eventsForDays.size).equals(2 + 31)
			o(eventsForDays.get(new Date(2019, 4, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals([event])


			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 3, 2)))
			o(eventsForDays.size).equals(2 + 31 + 29)
			o(eventsForDays.get(new Date(2019, 3, 1).getTime())).equals(undefined)
			o(eventsForDays.get(new Date(2019, 3, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 3, 3).getTime())).deepEquals([event])

		})


		o("longer than a month repeating", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			event.repeatRule = createRepeatRule()
			event.repeatRule.frequency = RepeatPeriod.MONTHLY
			event.repeatRule.interval = "1"
			// TODO: set timezone on repeatRule

			const startingInMay = cloneEventWithNewTime(event, new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			const startingInJune = cloneEventWithNewTime(event, new Date(2019, 5, 2, 10), new Date(2019, 6, 2, 12))
			const startingInJuly = cloneEventWithNewTime(event, new Date(2019, 6, 2, 10), new Date(2019, 7, 2, 12))

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2))) // invoke for June
			o(eventsForDays.size).equals(30) // One starting in May and all the June
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals(undefined)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([startingInMay])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([startingInMay, startingInJune])
			o(eventsForDays.get(new Date(2019, 5, 30).getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(new Date(2019, 6, 1).getTime())).deepEquals(undefined)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6, 2))) // invoke for July
			o(eventsForDays.size).equals(30 + 31) // Previous pls all of the July
			o(eventsForDays.get(new Date(2019, 6, 1).getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(new Date(2019, 6, 2).getTime())).deepEquals([startingInJune, startingInJuly])
			o(eventsForDays.get(new Date(2019, 6, 3).getTime())).deepEquals([startingInJuly])
			o(eventsForDays.get(new Date(2019, 7, 1).getTime())).deepEquals(undefined)
		})

	})
})


function cloneEventWithNewTime(event: CalendarEvent, startTime: Date, endTime: Date): CalendarEvent {
	const clonedEvent = clone(event)
	clonedEvent.startTime = startTime
	clonedEvent.endTime = endTime
	return clonedEvent
}

function createEvent(startTime: Date, endTime: Date): CalendarEvent {
	const event = createCalendarEvent()
	event.startTime = startTime // 1 May 8:00
	event.endTime = endTime
	return event
}
