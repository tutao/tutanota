//@flow
import o from "ospec/ospec.js"
import {createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {createRepeatRuleWithValues, getMonth, getTimeZone} from "../../../src/calendar/CalendarUtils"
import {getStartOfDay} from "../../../src/api/common/utils/DateUtils"
import {clone, neverNull} from "../../../src/api/common/utils/Utils"
import {mapToObject} from "../../api/TestUtils"
import {
	addDaysForEvent,
	addDaysForLongEvent,
	addDaysForRecurringEvent,
	incrementByRepeatPeriod,
	iterateEventOccurrences
} from "../../../src/calendar/CalendarModel"
import {AlarmInterval, EndType, RepeatPeriod} from "../../../src/api/common/TutanotaConstants"
import {DateTime} from "luxon"
import {generateEventElementId, getAllDayDateUTC} from "../../../src/api/common/utils/CommonCalendarUtils"

o.spec("CalendarModel", function () {
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
			const startDateLocal = new Date(2019, 4, 1)
			const endDateLocal = new Date(2019, 4, 2)

			const event = createEvent(getAllDayDateUTC(startDateLocal), getAllDayDateUTC(endDateLocal))
			const month = getMonth(startDateLocal)

			addDaysForEvent(eventsForDays, event, month)
			const eventsForDay = neverNull(eventsForDays.get(startDateLocal.getTime()))
			const eventsForNextDay = neverNull(eventsForDays.get(endDateLocal.getTime()))
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

		o("add same event", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
			const month = getMonth(event.startTime)

			addDaysForEvent(eventsForDays, event, month)
			const secondEvent = clone(event)
			addDaysForEvent(eventsForDays, secondEvent, month)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals([event])
		})
	})

	o.spec("addDaysForRecurringEvent", function () {
		const timeZone = getTimeZone()

		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})

		o("recuring event - short with time ", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 4, 2, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)

			const expectedForJune = {
				[new Date(2019, 5, 6).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 6, 10), new Date(2019, 5, 6, 12))],
				[new Date(2019, 5, 13).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 13, 10), new Date(2019, 5, 13, 12))],
				[new Date(2019, 5, 20).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 20, 10), new Date(2019, 5, 20, 12))],
				[new Date(2019, 5, 27).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 27, 10), new Date(2019, 5, 27, 12))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4)), timeZone)

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
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 4)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)

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

		o("recuring event - short with time & monthly", function () {
			const event = createEvent(new Date(2019, 4, 31, 10), new Date(2019, 4, 31, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4)), timeZone)
			const expectedForMay = {
				[new Date(2019, 4, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 31, 10), new Date(2019, 4, 31, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForMay)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)
			const expectedForJune = Object.assign({}, expectedForMay, {
				[new Date(2019, 5, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 30, 10), new Date(2019, 5, 30, 12))]
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6)), timeZone)
			const expectedForJuly = Object.assign({}, expectedForJune, {
				[new Date(2019, 6, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 6, 31, 10), new Date(2019, 6, 31, 12))]
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2020, 1)), timeZone)
			const expectedForFebruary = Object.assign({}, expectedForJuly, {
				[new Date(2020, 1, 29).getTime()]: [cloneEventWithNewTime(event, new Date(2020, 1, 29, 10), new Date(2020, 1, 29, 12))]
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForFebruary)

		})


		o("recurring event - short with time & monthly interval", function () {
			const event = createEvent(new Date(2019, 4, 31, 10), new Date(2019, 4, 31, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 2)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)
			o(mapToObject(eventsForDays)).deepEquals({})

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6)), timeZone)
			const expectedForJuly = {
				[new Date(2019, 6, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 6, 31, 10), new Date(2019, 6, 31, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 7)), timeZone)
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			const expectedForSeptember = Object.assign({}, expectedForJuly, {
				[new Date(2019, 8, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 8, 30, 10), new Date(2019, 8, 30, 12))]
			})
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 8)), timeZone)
			// o(mapToObject(eventsForDays)).deepEquals(expectedForSeptember)
			const expectedForNovember = Object.assign({}, expectedForSeptember, {
				[new Date(2019, 10, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 10, 30, 10), new Date(2019, 10, 30, 12))]
			})
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 10)), timeZone)
			o(mapToObject(eventsForDays)).deepEquals(expectedForNovember)
		})

		o("recuring event - short multiple days ", function () {
			const event = createEvent(new Date(2019, 4, 3, 10), new Date(2019, 4, 5, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)

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


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4)), timeZone)

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

		o("weekly all-day with DST in another time zone", function () {
			// This test checks that when there is a daylight saving change in UTC-m time zone all-day events in UTC+n still work like they
			// should
			const zone = 'Asia/Krasnoyarsk'
			const event = createEvent(getAllDayDateUTC(new Date(2020, 1, 12)), getAllDayDateUTC(new Date(2020, 1, 13)))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)
			event.repeatRule.timeZone = 'America/Los_angeles'
			const month = getMonth(DateTime.fromObject({year: 2020, month: 3, day: 1, zone}).toJSDate(), zone)
			addDaysForRecurringEvent(eventsForDays, event, month, zone)
			DateTime.fromObject({year: 2020, month: 3, day: 4, zone})

			const expectedForMarch = {
				[DateTime.fromObject({year: 2020, month: 3, day: 4, zone}).toMillis()]:
					[cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2020, 2, 4)), getAllDayDateUTC(new Date(2020, 2, 5)))],
				[DateTime.fromObject({year: 2020, month: 3, day: 11, zone}).toMillis()]:
					[cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2020, 2, 11)), getAllDayDateUTC(new Date(2020, 2, 12)))],
				[DateTime.fromObject({year: 2020, month: 3, day: 18, zone}).toMillis()]:
					[cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2020, 2, 18)), getAllDayDateUTC(new Date(2020, 2, 19)))],
				[DateTime.fromObject({year: 2020, month: 3, day: 25, zone}).toMillis()]:
					[cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2020, 2, 25)), getAllDayDateUTC(new Date(2020, 2, 26)))],
			}
			o(Object.keys(mapToObject(eventsForDays))).deepEquals(Object.keys(expectedForMarch))
		})

		o("end count", function () {
			const event = createEvent(new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)
			repeatRule.endType = EndType.Count
			repeatRule.endValue = "2"
			event.repeatRule = repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)

			const expectedForJune = {
				[new Date(2019, 5, 2).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))],
				[new Date(2019, 5, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 9, 10), new Date(2019, 5, 9, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6)), timeZone)
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)
		})

		o("end on date", function () {
			const event = createEvent(new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)
			repeatRule.endType = EndType.UntilDate
			repeatRule.endValue = String(new Date(2019, 5, 29).getTime())
			event.repeatRule = repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)

			const expectedForJune = {
				[new Date(2019, 5, 2).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))],
				[new Date(2019, 5, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 9, 10), new Date(2019, 5, 9, 12))],
				[new Date(2019, 5, 16).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 16, 10), new Date(2019, 5, 16, 12))],
				[new Date(2019, 5, 23).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 23, 10), new Date(2019, 5, 23, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6)), timeZone)
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)
		})

		o("end on date - all day", function () {

			const event = createEvent(
				getAllDayDateUTC(new Date(2019, 5, 2)),
				getAllDayDateUTC(new Date(2019, 5, 3))
			)
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 1)
			repeatRule.endType = EndType.UntilDate
			repeatRule.endValue = String(getAllDayDateUTC(new Date(2019, 5, 4)).getTime())
			event.repeatRule = repeatRule
			event.repeatRule.timeZone = "Asia/Anadyr" // +12

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)

			const expectedForJune = {
				[new Date(2019, 5, 2).getTime()]: [cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2019, 5, 2)), getAllDayDateUTC(new Date(2019, 5, 3)))],
				[new Date(2019, 5, 3).getTime()]: [cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2019, 5, 3)), getAllDayDateUTC(new Date(2019, 5, 4)))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)
		})

		o("add same event", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 4, 2, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5)), timeZone)

			const expectedForJune = {
				[new Date(2019, 5, 6).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 6, 10), new Date(2019, 5, 6, 12))],
				[new Date(2019, 5, 13).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 13, 10), new Date(2019, 5, 13, 12))],
				[new Date(2019, 5, 20).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 20, 10), new Date(2019, 5, 20, 12))],
				[new Date(2019, 5, 27).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 27, 10), new Date(2019, 5, 27, 12))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4)), timeZone)
			const eventClone = clone(event)
			addDaysForRecurringEvent(eventsForDays, eventClone, getMonth(new Date(2019, 4)), timeZone)

			const expectedForJuneAndJuly = Object.assign({}, expectedForJune, {
				[new Date(2019, 4, 2).getTime()]: [event],
				[new Date(2019, 4, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 9, 10), new Date(2019, 4, 9, 12))],
				[new Date(2019, 4, 16).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 16, 10), new Date(2019, 4, 16, 12))],
				[new Date(2019, 4, 23).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 23, 10), new Date(2019, 4, 23, 12))],
				[new Date(2019, 4, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 30, 10), new Date(2019, 4, 30, 12))],
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
			const timeZone = getTimeZone()
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1)

			const startingInMay = cloneEventWithNewTime(event, new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			const startingInJune = cloneEventWithNewTime(event, new Date(2019, 5, 2, 10), new Date(2019, 6, 2, 12))
			const startingInJuly = cloneEventWithNewTime(event, new Date(2019, 6, 2, 10), new Date(2019, 7, 2, 12))

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2)), timeZone) // invoke for June
			o(eventsForDays.size).equals(30) // One starting in May and all the June
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals(undefined)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([startingInMay])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([startingInMay, startingInJune])
			o(eventsForDays.get(new Date(2019, 5, 30).getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(new Date(2019, 6, 1).getTime())).deepEquals(undefined)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6, 2)), timeZone) // invoke for July
			o(eventsForDays.size).equals(30 + 31) // Previous pls all of the July
			o(eventsForDays.get(new Date(2019, 6, 1).getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(new Date(2019, 6, 2).getTime())).deepEquals([startingInJune, startingInJuly])
			o(eventsForDays.get(new Date(2019, 6, 3).getTime())).deepEquals([startingInJuly])
			o(eventsForDays.get(new Date(2019, 7, 1).getTime())).deepEquals(undefined)
		})

		o("add same event", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2)))
			addDaysForLongEvent(eventsForDays, clone(event), getMonth(new Date(2019, 5, 2)))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2)))
			addDaysForLongEvent(eventsForDays, clone(event), getMonth(new Date(2019, 4, 2)))
			o(eventsForDays.size).equals(32)
			o(eventsForDays.get(new Date(2019, 4, 1).getTime())).equals(undefined)
			o(eventsForDays.get(new Date(2019, 4, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals([event])
		})

	})

	o.spec("incrementByRepeatPeriod", function () {
		const timeZone = 'Europe/Berlin'

		o("with daylight saving", function () {
			const daylightSavingDay = DateTime.fromObject({year: 2019, month: 10, day: 26, hour: 10, zone: 'Europe/Moscow'}).toJSDate()
			const dayAfter = DateTime.fromObject({year: 2019, month: 10, day: 27, hour: 11, zone: 'Europe/Moscow'}).toJSDate()

			// event timezone is subject to daylight saving but observer is not
			o(incrementByRepeatPeriod(daylightSavingDay, RepeatPeriod.DAILY, 1, timeZone).toISOString()).equals(dayAfter.toISOString())
		})

		o("event in timezone without daylight saving should not be subject to daylight saving", function () {
			const daylightSavingDay = DateTime.fromObject({year: 2019, month: 10, day: 26, hour: 10, zone: 'Europe/Moscow'}).toJSDate()
			const dayAfter = DateTime.fromObject({year: 2019, month: 10, day: 27, hour: 10, zone: 'Europe/Moscow'}).toJSDate()

			o(incrementByRepeatPeriod(daylightSavingDay, RepeatPeriod.DAILY, 1, 'Europe/Moscow').toISOString())
				.equals(dayAfter.toISOString())
		})

		o("weekly", function () {
			const onFriday = DateTime.fromObject({year: 2019, month: 5, day: 31, hour: 10, zone: timeZone}).toJSDate()
			const nextFriday = DateTime.fromObject({year: 2019, month: 6, day: 7, hour: 10, zone: timeZone}).toJSDate()

			o(incrementByRepeatPeriod(onFriday, RepeatPeriod.WEEKLY, 1, timeZone).toISOString()).equals(nextFriday.toISOString())

			const oneYearAfter = DateTime.fromObject({year: 2020, month: 5, day: 29, hour: 10, zone: timeZone}).toJSDate()
			o(incrementByRepeatPeriod(onFriday, RepeatPeriod.WEEKLY, 52, timeZone).toISOString()).equals(oneYearAfter.toISOString())
		})

		o("monthly", function () {
			const endOfMay = DateTime.fromObject({year: 2019, month: 5, day: 31, zone: timeZone}).toJSDate()
			const endOfJune = DateTime.fromObject({year: 2019, month: 6, day: 30, zone: timeZone}).toJSDate()
			const calculatedEndOfJune = incrementByRepeatPeriod(endOfMay, RepeatPeriod.MONTHLY, 1, timeZone)
			o(calculatedEndOfJune.toISOString()).equals(endOfJune.toISOString())

			const endOfJuly = DateTime.fromObject({year: 2019, month: 7, day: 31, zone: timeZone}).toJSDate()
			const endOfJulyString = endOfJuly.toISOString()
			const incrementedDateString = incrementByRepeatPeriod(endOfMay, RepeatPeriod.MONTHLY, 2, timeZone).toISOString()
			o(incrementedDateString).equals(endOfJulyString)
		})

		o("annually", function () {
			const leapYear = DateTime.fromObject({year: 2020, month: 2, day: 29, zone: timeZone}).toJSDate()
			const yearAfter = DateTime.fromObject({year: 2021, month: 2, day: 28, zone: timeZone}).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 1, timeZone).toISOString()).equals(yearAfter.toISOString())

			const twoYearsAfter = DateTime.fromObject({year: 2022, month: 2, day: 28, zone: timeZone}).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 2, timeZone).toISOString()).equals(twoYearsAfter.toISOString())

			const fourYearsAfter = DateTime.fromObject({year: 2024, month: 2, day: 29, zone: timeZone}).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 4, timeZone).toISOString()).equals(fourYearsAfter.toISOString())
		})
	})

	o.spec("iterateEventOccurrences", function () {
		const timeZone = 'Europe/Berlin'
		o("iterates", function () {
			const now = DateTime.fromObject({year: 2019, month: 5, day: 2, zone: timeZone}).toJSDate()
			const eventStart = DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 12, zone: timeZone}).toJSDate()
			const eventEnd = DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 14, zone: timeZone}).toJSDate()
			const occurrences = []
			iterateEventOccurrences(now, timeZone, eventStart, eventEnd, RepeatPeriod.WEEKLY, 1, EndType.Never, 0, AlarmInterval.ONE_HOUR, timeZone, (time) => {
				occurrences.push(time)
			})

			o(occurrences.slice(0, 4)).deepEquals([
				DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 11, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 9, hour: 11, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 16, hour: 11, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 23, hour: 11, zone: timeZone}).toJSDate()
			])
		})

		o("ends for all-day event correctly", function () {
			const repeatRuleTimeZone = "Asia/Anadyr" // +12

			const now = DateTime.fromObject({year: 2019, month: 5, day: 1, zone: timeZone}).toJSDate()
			// UTC date just encodes the date, whatever you pass to it. You just have to extract consistently
			const eventStart = getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 5, day: 2}).toJSDate())
			const eventEnd = getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 5, day: 3}).toJSDate())
			const repeatEnd = getAllDayDateUTC(DateTime.fromObject({year: 2019, month: 5, day: 4}).toJSDate())
			const occurrences = []
			iterateEventOccurrences(now, repeatRuleTimeZone, eventStart, eventEnd, RepeatPeriod.DAILY, 1, EndType.UntilDate, repeatEnd, AlarmInterval.ONE_DAY,
				timeZone,
				(time) => {
					occurrences.push(time)
				})

			o(occurrences).deepEquals([
				DateTime.fromObject({year: 2019, month: 5, day: 1, hour: 0, zone: timeZone}).toJSDate(),
				DateTime.fromObject({year: 2019, month: 5, day: 2, hour: 0, zone: timeZone}).toJSDate(),
			])
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
	event._id = ["listId", generateEventElementId(event.startTime.getTime())]
	return event
}
