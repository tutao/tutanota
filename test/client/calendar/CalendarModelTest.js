//@flow
import o from "ospec"
import type {CalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {CalendarEventTypeRef, createCalendarEvent} from "../../../src/api/entities/tutanota/CalendarEvent"
import {
	addDaysForEvent,
	addDaysForLongEvent,
	addDaysForRecurringEvent,
	createRepeatRuleWithValues,
	getAllDayDateUTCFromZone,
	getMonth,
	getTimeZone,
	incrementByRepeatPeriod,
	findNextAlarmOccurrence
} from "../../../src/calendar/date/CalendarUtils"
import {getStartOfDay} from "../../../src/api/common/utils/DateUtils"
import {clone, downcast, neverNull, noOp} from "../../../src/api/common/utils/Utils"
import {asResult, mapToObject} from "../../api/TestUtils"
import type {CalendarModel} from "../../../src/calendar/model/CalendarModel"
import {CalendarModelImpl} from "../../../src/calendar/model/CalendarModel"
import {AlarmInterval, CalendarAttendeeStatus, CalendarMethod, EndType, RepeatPeriod} from "../../../src/api/common/TutanotaConstants"
import {DateTime} from "luxon"
import {generateEventElementId, getAllDayDateUTC} from "../../../src/api/common/utils/CommonCalendarUtils"
import type {EntityUpdateData} from "../../../src/api/main/EventController"
import {EventController} from "../../../src/api/main/EventController"
import {Notifications} from "../../../src/gui/Notifications"
import {WorkerClient} from "../../../src/api/main/WorkerClient"
import {createCalendarEventAttendee} from "../../../src/api/entities/tutanota/CalendarEventAttendee"
import {createEncryptedMailAddress} from "../../../src/api/entities/tutanota/EncryptedMailAddress"
import {createAlarmInfo} from "../../../src/api/entities/sys/AlarmInfo"
import {EntityRestClientMock} from "../../api/worker/EntityRestClientMock"
import type {IUserController} from "../../../src/api/main/UserController"
import {createUser} from "../../../src/api/entities/sys/User"
import {createUserAlarmInfoListType} from "../../../src/api/entities/sys/UserAlarmInfoListType"
import {createUserAlarmInfo} from "../../../src/api/entities/sys/UserAlarmInfo"
import type {CalendarGroupRoot} from "../../../src/api/entities/tutanota/CalendarGroupRoot"
import {createCalendarGroupRoot} from "../../../src/api/entities/tutanota/CalendarGroupRoot"
import {_loadEntity} from "../../../src/api/common/EntityFunctions"
import {NotFoundError} from "../../../src/api/common/error/RestError"
import type {LoginController} from "../../../src/api/main/LoginController"
import {ProgressTracker} from "../../../src/api/main/ProgressTracker"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {MailModel} from "../../../src/mail/model/MailModel"
import {AlarmScheduler} from "../../../src/calendar/date/AlarmScheduler"

o.spec("CalendarModel", function () {
	o.spec("addDaysForEvent", function () {
		const zone = getTimeZone()
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})

		o("short event same month", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
			const month = getMonth(event.startTime, zone)

			addDaysForEvent(eventsForDays, event, month)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals([event])
		})

		o("short event prev month", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
			const prevMonth = getMonth(new Date(2019, 3, 1), zone)
			addDaysForEvent(eventsForDays, event, prevMonth)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals(undefined)
		})

		o("short event next month", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 1, 10))
			const nextMonth = getMonth(new Date(2019, 5, 1), zone)
			addDaysForEvent(eventsForDays, event, nextMonth)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals(undefined)
		})

		o("short event multiple days", function () {
			const event = createEvent(new Date(2019, 4, 1, 8), new Date(2019, 4, 4, 10))
			const thisMonth = getMonth(new Date(2019, 4, 1), zone)
			const nextMonth = getMonth(new Date(2019, 5, 1), zone)

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
			const thisMonth = getMonth(new Date(2019, 4, 1), zone)
			const nextMonth = getMonth(new Date(2019, 5, 1), zone)

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
			const month = getMonth(startDateLocal, zone)

			addDaysForEvent(eventsForDays, event, month)
			const eventsForDay = neverNull(eventsForDays.get(startDateLocal.getTime()))
			const eventsForNextDay = neverNull(eventsForDays.get(endDateLocal.getTime()))
			o(eventsForDay).deepEquals([event])
			o(eventsForNextDay).deepEquals(undefined)
		})


		o("all day event two days", function () {
			const event = createEvent(getAllDayDateUTC(new Date(2019, 3, 30)), getAllDayDateUTC(new Date(2019, 4, 2)))
			const eventEndMonth = getMonth(new Date(2019, 4, 1), zone)

			// do not create events if event does not start in specified month
			{
				addDaysForEvent(eventsForDays, event, eventEndMonth)
				o(eventsForDays.size).deepEquals(0)
			}

			// create events if event starts in specified month
			{
				const eventStartMonth = getMonth(new Date(2019, 3, 1), zone)
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
			const month = getMonth(event.startTime, zone)

			addDaysForEvent(eventsForDays, event, month)
			const secondEvent = clone(event)
			addDaysForEvent(eventsForDays, secondEvent, month)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			o(eventsForDay).deepEquals([event])
		})
	})

	o.spec("addDaysForRecurringEvent", function () {
		const zone = getTimeZone()

		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})

		o("recuring event - short with time ", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 4, 2, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)

			const expectedForJune = {
				[new Date(2019, 5, 6).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 6, 10), new Date(2019, 5, 6, 12))],
				[new Date(2019, 5, 13).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 13, 10), new Date(2019, 5, 13, 12))],
				[new Date(2019, 5, 20).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 20, 10), new Date(2019, 5, 20, 12))],
				[new Date(2019, 5, 27).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 27, 10), new Date(2019, 5, 27, 12))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4), zone), zone)

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

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)

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

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4), zone), zone)
			const expectedForMay = {
				[new Date(2019, 4, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 31, 10), new Date(2019, 4, 31, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForMay)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)
			const expectedForJune = Object.assign({}, expectedForMay, {
				[new Date(2019, 5, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 30, 10), new Date(2019, 5, 30, 12))]
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6), zone), zone)
			const expectedForJuly = Object.assign({}, expectedForJune, {
				[new Date(2019, 6, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 6, 31, 10), new Date(2019, 6, 31, 12))]
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2020, 1), zone), zone)
			const expectedForFebruary = Object.assign({}, expectedForJuly, {
				[new Date(2020, 1, 29).getTime()]: [cloneEventWithNewTime(event, new Date(2020, 1, 29, 10), new Date(2020, 1, 29, 12))]
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForFebruary)

		})


		o("recurring event - short with time & monthly interval", function () {
			const event = createEvent(new Date(2019, 4, 31, 10), new Date(2019, 4, 31, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 2)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)
			o(mapToObject(eventsForDays)).deepEquals({})

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6), zone), zone)
			const expectedForJuly = {
				[new Date(2019, 6, 31).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 6, 31, 10), new Date(2019, 6, 31, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 7), zone), zone)
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuly)

			const expectedForSeptember = Object.assign({}, expectedForJuly, {
				[new Date(2019, 8, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 8, 30, 10), new Date(2019, 8, 30, 12))]
			})
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 8), zone), zone)
			// o(mapToObject(eventsForDays)).deepEquals(expectedForSeptember)
			const expectedForNovember = Object.assign({}, expectedForSeptember, {
				[new Date(2019, 10, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 10, 30, 10), new Date(2019, 10, 30, 12))]
			})
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 10), zone), zone)
			o(mapToObject(eventsForDays)).deepEquals(expectedForNovember)
		})

		o("recuring event - short multiple days ", function () {
			const event = createEvent(new Date(2019, 4, 3, 10), new Date(2019, 4, 5, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)
			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)

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


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4), zone), zone)

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
			o(mapToObject(eventsForDays)).deepEquals(expectedForMarch)
		})

		o("end count", function () {
			const event = createEvent(new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)
			repeatRule.endType = EndType.Count
			repeatRule.endValue = "2"
			event.repeatRule = repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)

			const expectedForJune = {
				[new Date(2019, 5, 2).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))],
				[new Date(2019, 5, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 9, 10), new Date(2019, 5, 9, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6), zone), zone)
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)
		})

		o("end on date", function () {
			const event = createEvent(new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)
			repeatRule.endType = EndType.UntilDate
			repeatRule.endValue = String(new Date(2019, 5, 29).getTime())
			event.repeatRule = repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)

			const expectedForJune = {
				[new Date(2019, 5, 2).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 2, 10), new Date(2019, 5, 2, 12))],
				[new Date(2019, 5, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 9, 10), new Date(2019, 5, 9, 12))],
				[new Date(2019, 5, 16).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 16, 10), new Date(2019, 5, 16, 12))],
				[new Date(2019, 5, 23).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 23, 10), new Date(2019, 5, 23, 12))]
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6), zone), zone)
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

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5), zone), zone)

			const expectedForJune = {
				[new Date(2019, 5, 2).getTime()]: [cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2019, 5, 2)), getAllDayDateUTC(new Date(2019, 5, 3)))],
				[new Date(2019, 5, 3).getTime()]: [cloneEventWithNewTime(event, getAllDayDateUTC(new Date(2019, 5, 3)), getAllDayDateUTC(new Date(2019, 5, 4)))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)
		})

		o("add same event", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 4, 2, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1)

			const monthDate = new Date(2019, 5)
			addDaysForRecurringEvent(eventsForDays, event, getMonth(monthDate, zone), zone)

			const expectedForJune = {
				[new Date(2019, 5, 6).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 6, 10), new Date(2019, 5, 6, 12))],
				[new Date(2019, 5, 13).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 13, 10), new Date(2019, 5, 13, 12))],
				[new Date(2019, 5, 20).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 20, 10), new Date(2019, 5, 20, 12))],
				[new Date(2019, 5, 27).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 5, 27, 10), new Date(2019, 5, 27, 12))],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForJune)


			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 4), zone), zone)
			const eventClone = clone(event)
			addDaysForRecurringEvent(eventsForDays, eventClone, getMonth(new Date(2019, 4), zone), zone)

			const expectedForJuneAndJuly = Object.assign({}, expectedForJune, {
				[new Date(2019, 4, 2).getTime()]: [event],
				[new Date(2019, 4, 9).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 9, 10), new Date(2019, 4, 9, 12))],
				[new Date(2019, 4, 16).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 16, 10), new Date(2019, 4, 16, 12))],
				[new Date(2019, 4, 23).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 23, 10), new Date(2019, 4, 23, 12))],
				[new Date(2019, 4, 30).getTime()]: [cloneEventWithNewTime(event, new Date(2019, 4, 30, 10), new Date(2019, 4, 30, 12))],
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForJuneAndJuly)
		})


		o("monthly with shorter month", function () {
			// Potential problem with this case is that if the end date is calculated incorrectly, event might be shortened by a few
			// days (see #1786).
			const eventStart = getAllDayDateUTCFromZone(DateTime.fromISO("2020-03-29", {zone}).toJSDate(), zone)
			const eventEnd = getAllDayDateUTCFromZone(DateTime.fromISO("2020-04-01", {zone}).toJSDate(), zone)
			const event = createEvent(eventStart, eventEnd)
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			event.repeatRule = repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(DateTime.local(2020, 3).toJSDate(), zone), zone)

			const expectedForMarch = {
				[DateTime.fromISO("2020-03-29", {zone}).toMillis()]: [event],
				[DateTime.fromISO("2020-03-30", {zone}).toMillis()]: [event],
				[DateTime.fromISO("2020-03-31", {zone}).toMillis()]: [event],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForMarch)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(DateTime.local(2020, 4).toJSDate(), zone), zone)

			const occurrence = cloneEventWithNewTime(event,
				getAllDayDateUTCFromZone(DateTime.fromISO("2020-04-29", {zone}).toJSDate(), zone),
				getAllDayDateUTCFromZone(DateTime.fromISO("2020-05-02", {zone}).toJSDate(), zone),
			)
			const expectedForApril = Object.assign({}, expectedForMarch, {
				[DateTime.fromISO("2020-04-29", {zone}).toMillis()]: [occurrence],
				[DateTime.fromISO("2020-04-30", {zone}).toMillis()]: [occurrence],
				[DateTime.fromISO("2020-05-01", {zone}).toMillis()]: [occurrence],
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForApril)
		})

		o("monthly with longer month", function () {
			// Potential problem with this case is that if the end date is calculated incorrectly, event might be stretched by a few
			// days (see #1786).
			const eventStart = getAllDayDateUTCFromZone(DateTime.fromISO("2020-02-29", {zone}).toJSDate(), zone)
			const eventEnd = getAllDayDateUTCFromZone(DateTime.fromISO("2020-03-01", {zone}).toJSDate(), zone)
			const event = createEvent(eventStart, eventEnd)
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			event.repeatRule = repeatRule

			addDaysForRecurringEvent(eventsForDays, event, getMonth(DateTime.local(2020, 2).toJSDate(), zone), zone)

			const expectedForFebruary = {
				[DateTime.fromISO("2020-02-29", {zone}).toMillis()]: [event],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForFebruary)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(DateTime.local(2020, 3).toJSDate(), zone), zone)

			const occurrence = cloneEventWithNewTime(event,
				getAllDayDateUTCFromZone(DateTime.fromISO("2020-03-29", {zone}).toJSDate(), zone),
				getAllDayDateUTCFromZone(DateTime.fromISO("2020-03-30", {zone}).toJSDate(), zone),
			)
			const expectedForMarch = Object.assign({}, expectedForFebruary, {
				[DateTime.fromISO("2020-03-29", {zone}).toMillis()]: [occurrence],
			})
			o(mapToObject(eventsForDays)).deepEquals(expectedForMarch)
		})
	})

	o.spec("addDaysForEvent for long events", function () {
		const zone = getTimeZone()
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})

		o("longer than a month", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2), zone))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2), zone))
			o(eventsForDays.size).equals(32)
			o(eventsForDays.get(new Date(2019, 4, 1).getTime())).equals(undefined)
			o(eventsForDays.get(new Date(2019, 4, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals([event])
		})

		o("longer than a month all day", function () {
			const event = createEvent(getAllDayDateUTC(new Date(2019, 4, 2, 10)), getAllDayDateUTC(new Date(2019, 5, 3, 12)))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2), zone))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2), zone))
			o(eventsForDays.size).equals(32)
			o(eventsForDays.get(new Date(2019, 4, 1).getTime())).equals(undefined)
			o(eventsForDays.get(new Date(2019, 4, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals([event])
		})

		o("multiple months", function () {
			const event = createEvent(new Date(2019, 3, 2, 10), new Date(2019, 5, 2, 12))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2), zone))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2), zone))
			o(eventsForDays.size).equals(2 + 31)
			o(eventsForDays.get(new Date(2019, 4, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals([event])


			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 3, 2), zone))
			o(eventsForDays.size).equals(2 + 31 + 29)
			o(eventsForDays.get(new Date(2019, 3, 1).getTime())).equals(undefined)
			o(eventsForDays.get(new Date(2019, 3, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 3, 3).getTime())).deepEquals([event])

		})

		o("longer than a month repeating", function () {
			const zone = getTimeZone()
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1)

			const startingInMay = cloneEventWithNewTime(event, new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			const startingInJune = cloneEventWithNewTime(event, new Date(2019, 5, 2, 10), new Date(2019, 6, 3, 12))
			const startingInJuly = cloneEventWithNewTime(event, new Date(2019, 6, 2, 10), new Date(2019, 7, 2, 12))

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2), zone), zone) // invoke for June
			o(eventsForDays.size).equals(30) // One starting in May and all the June
			o(eventsForDays.get(new Date(2019, 4, 31).getTime())).deepEquals(undefined)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([startingInMay])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([startingInMay, startingInJune])
			o(eventsForDays.get(new Date(2019, 5, 30).getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(new Date(2019, 6, 1).getTime())).deepEquals(undefined)

			addDaysForRecurringEvent(eventsForDays, event, getMonth(new Date(2019, 6, 2), zone), zone) // invoke for July
			o(eventsForDays.size).equals(30 + 31) // Previous pls all of the July
			o(eventsForDays.get(new Date(2019, 6, 1).getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(new Date(2019, 6, 3).getTime())).deepEquals([startingInJune, startingInJuly])
			o(eventsForDays.get(new Date(2019, 6, 4).getTime())).deepEquals([startingInJuly])
			o(eventsForDays.get(new Date(2019, 7, 1).getTime())).deepEquals(undefined)
		})

		o("add same event", function () {
			const event = createEvent(new Date(2019, 4, 2, 10), new Date(2019, 5, 2, 12))
			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 5, 2), zone))
			addDaysForLongEvent(eventsForDays, clone(event), getMonth(new Date(2019, 5, 2), zone))
			o(eventsForDays.size).equals(2)
			o(eventsForDays.get(new Date(2019, 5, 1).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 2).getTime())).deepEquals([event])
			o(eventsForDays.get(new Date(2019, 5, 3).getTime())).equals(undefined)

			addDaysForLongEvent(eventsForDays, event, getMonth(new Date(2019, 4, 2), zone))
			addDaysForLongEvent(eventsForDays, clone(event), getMonth(new Date(2019, 4, 2), zone))
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

	o.spec("calendar event updates", function () {
		let workerMock: WorkerMock
		let groupRoot: CalendarGroupRoot
		const loginController = makeLoginController()
		const alarmsListId = neverNull(loginController.getUserController().user.alarmInfoList).alarms

		o.beforeEach(function () {
			groupRoot = createCalendarGroupRoot({
				_id: "groupRootId",
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})
			workerMock = new WorkerMock()
			workerMock.addElementInstances(groupRoot)
		})

		o("reply but sender is not a guest", async function () {
			const uid = "uid"
			const existingEvent = createCalendarEvent({
				uid,
			})
			const workerClient = makeWorkerClient({
				getEventByUid: (loadUid) => uid === loadUid ? Promise.resolve(existingEvent) : Promise.resolve(null),
				updateCalendarEvent: o.spy(() => Promise.resolve()),
			})
			const model = init({
				workerClient,
			})

			await model.processCalendarUpdate("sender@example.com", {
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createCalendarEvent({
							uid,
						}),
						alarms: []
					}
				]
			})
			o(workerClient.updateCalendarEvent.calls.length).equals(0)
		})

		o("reply", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const anotherGuest = "another-attendee"
			const alarm = createAlarmInfo({_id: "alarm-id"})
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				uid,
				_ownerGroup: groupRoot._id,
				summary: "v1",
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: sender}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({address: anotherGuest}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
				alarmInfos: [[alarmsListId, alarm._id]]
			})
			workerMock.addListInstances(createUserAlarmInfo({
				_id: [alarmsListId, alarm._id],
				alarmInfo: alarm,
			}))
			workerMock.eventByUid.set(uid, existingEvent)
			const workerClient = makeWorkerClient(workerMock)
			const model = init({workerClient})

			await model.processCalendarUpdate(sender, {
				summary: "v2", // should be ignored
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createCalendarEvent({
							uid,
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({address: sender}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
								createCalendarEventAttendee({ // should be ignored
									address: createEncryptedMailAddress({address: anotherGuest}),
									status: CalendarAttendeeStatus.DECLINED,
								}),
							]
						}),
						alarms: [],
					}
				]
			})
			const [createdEvent, alarms] = workerClient.updateCalendarEvent.calls[0].args
			o(createdEvent.uid).equals(existingEvent.uid)
			o(createdEvent.summary).equals(existingEvent.summary)
			o(createdEvent.attendees).deepEquals([
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({address: sender}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({address: "another-attendee"}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			])
			o(alarms).deepEquals([alarm])
		})

		o("request as a new invite", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const workerMock = new WorkerMock()
			const workerClient = makeWorkerClient(workerMock)
			const model = init({workerClient})

			await model.processCalendarUpdate(sender, {
				summary: "1",
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: createCalendarEvent({
							uid,
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({address: sender}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
							]
						}),
						alarms: [],
					}
				]
			})
			// It'a a new invite, we don't do anything with them yet
			o(workerClient.updateCalendarEvent.calls).deepEquals([])
		})

		o("request as an update", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const alarm = createAlarmInfo({_id: "alarm-id"})
			workerMock.addListInstances(createUserAlarmInfo({
				_id: [alarmsListId, alarm._id],
				alarmInfo: alarm,
			}))
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createEncryptedMailAddress({address: sender}),
				alarmInfos: [[alarmsListId, alarm._id]]
			})
			workerMock.eventByUid.set(uid, existingEvent)

			const workerClient = makeWorkerClient(workerMock)
			const model = init({workerClient})

			const sentEvent = createCalendarEvent({
				summary: "v2",
				uid,
				sequence: "2",
				organizer: createEncryptedMailAddress({address: sender}),
			})
			await model.processCalendarUpdate(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{event: sentEvent, alarms: []}
				]
			})
			const [updatedEvent, updatedAlarms, oldEvent] = workerClient.updateCalendarEvent.calls[0].args
			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedAlarms).deepEquals([alarm])
			o(oldEvent).deepEquals(existingEvent)
		})

		o("event is re-created when the start time changes", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const alarm = createAlarmInfo({_id: "alarm-id"})
			workerMock.addListInstances(createUserAlarmInfo({
				_id: [alarmsListId, alarm._id],
				alarmInfo: alarm,
			}))
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createEncryptedMailAddress({address: sender}),
				startTime: DateTime.fromObject({year: 2020, month: 5, day: 10, zone: "UTC"}).toJSDate(),
				alarmInfos: [[alarmsListId, alarm._id]]
			})
			workerMock.eventByUid.set(uid, existingEvent)

			const workerClient = makeWorkerClient(workerMock)
			const model = init({workerClient})

			const sentEvent = createCalendarEvent({
				summary: "v2",
				uid,
				sequence: "2",
				startTime: DateTime.fromObject({year: 2020, month: 5, day: 11, zone: "UTC"}).toJSDate(),
				organizer: createEncryptedMailAddress({address: sender}),
			})
			await model.processCalendarUpdate(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{event: sentEvent, alarms: []}
				]
			})
			o(workerClient.updateCalendarEvent.calls).deepEquals([])
			const [updatedEvent, updatedAlarms, oldEvent] = workerClient.createCalendarEvent.calls[0].args
			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedEvent.startTime.toISOString()).equals(sentEvent.startTime.toISOString())
			o(updatedEvent.uid).equals(uid)
			o(updatedAlarms).deepEquals([alarm])
			o(oldEvent).deepEquals(existingEvent)
		})

		o.spec("cancel", function () {
			o("event is cancelled by organizer", async function () {
				const uid = "uid"
				const sender = "sender@example.com"
				const existingEvent = createCalendarEvent({
					_id: ["listId", "eventId"],
					_ownerGroup: groupRoot._id,
					sequence: "1",
					uid,
					organizer: createEncryptedMailAddress({address: sender}),
				})
				workerMock.addListInstances(existingEvent)
				workerMock.eventByUid.set(uid, existingEvent)

				const workerClient = makeWorkerClient(workerMock)
				const model = init({workerClient})

				const sentEvent = createCalendarEvent({uid, sequence: "2", organizer: createEncryptedMailAddress({address: sender})})
				await model.processCalendarUpdate(sender, {
					method: CalendarMethod.CANCEL,
					contents: [
						{event: sentEvent, alarms: []}
					]
				})
				o(Object.getPrototypeOf(await asResult(_loadEntity(CalendarEventTypeRef, existingEvent._id, null, workerMock))))
					.equals(NotFoundError.prototype)("Calendar event was deleted")
			})

			o("event is cancelled by someone else than organizer", async function () {
				const uid = "uid"
				const sender = "sender@example.com"
				const existingEvent = createCalendarEvent({
					_id: ["listId", "eventId"],
					_ownerGroup: groupRoot._id,
					sequence: "1",
					uid,
					organizer: createEncryptedMailAddress({address: sender}),
				})
				workerMock.addListInstances(existingEvent)
				workerMock.eventByUid.set(uid, existingEvent)

				const workerClient = makeWorkerClient(workerMock)
				const model = init({workerClient})

				const sentEvent = createCalendarEvent({uid, sequence: "2", organizer: createEncryptedMailAddress({address: sender})})
				await model.processCalendarUpdate("another-sender", {
					method: CalendarMethod.CANCEL,
					contents: [{event: sentEvent, alarms: []}]
				})
				o(await _loadEntity(CalendarEventTypeRef, existingEvent._id, null, workerMock))
					.equals(existingEvent)("Calendar event was not deleted")
			})
		})
	})
})

function makeNotifications(): Notifications {
	return downcast({})
}

function makeProgressTracker(): ProgressTracker {
	return downcast({
		register: () => 0
	})
}

function makeEventController(): {eventController: EventController, sendEvent: (EntityUpdateData) => void} {
	const listeners = []
	return {
		eventController: downcast({
			listeners,
			addEntityListener: noOp,
		}),
		sendEvent: (update) => {
			for (let listener of listeners) {
				listener([update])
			}
		},
	}
}

function makeWorkerClient(props: {}): WorkerClient {
	return downcast(props)
}

function makeLoginController(props: $Shape<IUserController> = {}): LoginController {

	const userController = downcast(Object.assign(props, {
		user: createUser({
			_id: "user-id",
			alarmInfoList: createUserAlarmInfoListType({alarms: "alarms"})
		})
	}))

	return downcast({
		getUserController: () => userController
	})
}

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

class WorkerMock extends EntityRestClientMock {
	eventByUid: Map<string, CalendarEvent> = new Map();

	createCalendarEvent = o.spy((event) => {
		this.addListInstances(event)
		return Promise.resolve()
	})
	updateCalendarEvent = o.spy(() => Promise.resolve())

	getEventByUid(loadUid) {
		return Promise.resolve(this.eventByUid.get(loadUid))
	}
}

function makeAlarmScheduler(): AlarmScheduler {
	return {
		scheduleAlarm: o.spy(),
		cancelAlarm: o.spy(),
	}
}


function makeMailModel(): MailModel {
	return downcast({})
}

function init({
	              notifications = makeNotifications(),
	              eventController = makeEventController().eventController,
	              workerClient,
	              loginController = makeLoginController(),
	              progressTracker = makeProgressTracker(),
	              entityClient = new EntityClient(workerClient),
	              mailModel = makeMailModel(),
	              alarmScheduler = makeAlarmScheduler(),
              }): CalendarModelImpl {
	const lazyScheduler = async () => alarmScheduler
	return new CalendarModelImpl(notifications, lazyScheduler, eventController, workerClient, loginController, progressTracker,
		entityClient, mailModel)
}