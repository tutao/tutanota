import o from "ospec"
import type { CalendarEvent, CalendarGroupRoot } from "../../../src/api/entities/tutanota/TypeRefs.js"
import {
	CalendarEventTypeRef,
	createCalendarEvent,
	createCalendarEventAttendee,
	createCalendarGroupRoot,
	createEncryptedMailAddress,
} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {
	addDaysForEventInstance,
	addDaysForRecurringEvent,
	createRepeatRuleWithValues,
	getAllDayDateUTCFromZone,
	getMonthRange,
	incrementByRepeatPeriod,
} from "../../../src/calendar/date/CalendarUtils.js"
import { clone, downcast, getStartOfDay, neverNull, noOp } from "@tutao/tutanota-utils"
import { CalendarModel } from "../../../src/calendar/model/CalendarModel.js"
import { CalendarAttendeeStatus, CalendarMethod, EndType, RepeatPeriod } from "../../../src/api/common/TutanotaConstants.js"
import { DateTime } from "luxon"
import { generateEventElementId } from "../../../src/api/common/utils/CommonCalendarUtils.js"
import type { EntityUpdateData } from "../../../src/api/main/EventController.js"
import { EventController } from "../../../src/api/main/EventController.js"
import { Notifications } from "../../../src/gui/Notifications.js"
import { createAlarmInfo, createDateWrapper, createUser, createUserAlarmInfo, createUserAlarmInfoListType } from "../../../src/api/entities/sys/TypeRefs.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import type { UserController } from "../../../src/api/main/UserController.js"
import { NotFoundError } from "../../../src/api/common/error/RestError.js"
import type { LoginController } from "../../../src/api/main/LoginController.js"
import { ProgressTracker } from "../../../src/api/main/ProgressTracker.js"
import { EntityClient } from "../../../src/api/common/EntityClient.js"
import { MailModel } from "../../../src/mail/model/MailModel.js"
import { AlarmScheduler } from "../../../src/calendar/date/AlarmScheduler.js"
import { CalendarEventProgenitor, CalendarFacade } from "../../../src/api/worker/facades/lazy/CalendarFacade.js"
import { asResult, mapToObject } from "@tutao/tutanota-test-utils"
import type { WorkerClient } from "../../../src/api/main/WorkerClient.js"
import { FileController } from "../../../src/file/FileController.js"
import { getDateInUTC, getDateInZone, zone } from "./CalendarTestUtils.js"

function countDaysWithEvents(eventsForDays: Map<number, Array<CalendarEvent>>) {
	return Array.from(eventsForDays).filter(([_, events]) => events.length).length
}

o.spec("CalendarModel", function () {
	o.spec("addDaysForEventInstance", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})
		o("short event same month", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-01T10:00"))
			const month = getMonthRange(getDateInZone("2019-05-01"), zone)
			addDaysForEventInstance(eventsForDays, event, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)
		})
		o("short event prev month", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-01T10:00"))
			const prevMonth = getMonthRange(getDateInZone("2019-04-01"), zone)
			addDaysForEventInstance(eventsForDays, event, prevMonth, zone)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			// @ts-ignore
			o(eventsForDay).deepEquals(undefined)
		})
		o("short event next month", function () {
			const krsk = "Asia/Krasnoyarsk"
			const event = createEvent(getDateInZone("2019-05-01T08:00", krsk), getDateInZone("2019-05-01T10:00", krsk))
			const nextMonth = getMonthRange(getDateInZone("2019-06-01"), krsk)
			addDaysForEventInstance(eventsForDays, event, nextMonth, zone)
			const eventsForDay = neverNull(eventsForDays.get(getStartOfDay(event.startTime).getTime()))
			// @ts-ignore
			o(eventsForDay).deepEquals(undefined)
		})
		o("short event multiple days", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-04T10:00"))
			const thisMonth = getMonthRange(getDateInZone("2019-05-01"), zone)
			const nextMonth = getMonthRange(getDateInZone("2019-06-01"), zone)
			// the event is not in june, duh
			addDaysForEventInstance(eventsForDays, event, nextMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(0)

			addDaysForEventInstance(eventsForDays, event, thisMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(4)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-04").getTime())).deepEquals([event])
		})
		o("short event multiple days spans next month", function () {
			const event = createEvent(getDateInZone("2019-05-29T08:00"), getDateInZone("2019-06-02T10:00"))
			const thisMonth = getMonthRange(getDateInZone("2019-05-01"), zone)
			const nextMonth = getMonthRange(getDateInZone("2019-06-01"), zone)

			addDaysForEventInstance(eventsForDays, event, nextMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])

			addDaysForEventInstance(eventsForDays, event, thisMonth, zone)
			o(countDaysWithEvents(eventsForDays)).equals(2 + 3)
			o(eventsForDays.get(getDateInZone("2019-05-29").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-30").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
		})
		o("all day event", function () {
			// all day event of one day
			const event = createEvent(getDateInUTC("2019-05-01"), getDateInUTC("2019-05-02"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)
		})
		o("all day event two days", function () {
			const event = createEvent(getDateInUTC("2019-04-30"), getDateInUTC("2019-05-02"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)

			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-04-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)
			o(eventsForDays.get(getDateInZone("2019-04-30").getTime())).deepEquals([event])
		})
		o("add same event", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-01T10:00"))
			const month = getMonthRange(getDateInZone("2019-05-01"), zone)
			addDaysForEventInstance(eventsForDays, event, month, zone)
			const secondEvent = clone(event)
			addDaysForEventInstance(eventsForDays, secondEvent, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])
			o(countDaysWithEvents(eventsForDays)).equals(1)
		})
		o("event became shorter", function () {
			const event = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-05T12:00"))
			const month = getMonthRange(getDateInZone("2019-05-01"), zone)

			// add for may
			addDaysForEventInstance(eventsForDays, event, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-05").getTime())).deepEquals([event])("Original event is added")
			const shorterEvent = createEvent(getDateInZone("2019-05-01T08:00"), getDateInZone("2019-05-03T12:00"))
			shorterEvent._id = event._id

			// add for may again, but with fewer days.
			addDaysForEventInstance(eventsForDays, shorterEvent, month, zone)
			o(eventsForDays.get(getDateInZone("2019-05-05").getTime())).deepEquals([])("Original event is removed")
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([shorterEvent])("New event is added")
		})
	})
	o.spec("addDaysForRecurringEvent", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})
		o("recurring event - short with time ", function () {
			// event that goes on for 2 hours and repeats weekly
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-05-02T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(4)
			o(eventsForDays.get(getDateInZone("2019-06-06").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-06T10:00"), getDateInZone("2019-06-06T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-13").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-13T10:00"), getDateInZone("2019-06-13T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-20").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-20T10:00"), getDateInZone("2019-06-20T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-27").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-27T10:00"), getDateInZone("2019-06-27T12:00")),
			])

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(4 + 5)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-02T10:00"), getDateInZone("2019-05-02T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-09T10:00"), getDateInZone("2019-05-09T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-16").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-16T10:00"), getDateInZone("2019-05-16T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-23T10:00"), getDateInZone("2019-05-23T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-30T10:00"), getDateInZone("2019-05-30T12:00")),
			])
		})
		o("recurring event - short with time & day interval", function () {
			// two hour event that happens every fourth day
			const event = createEvent(getDateInZone("2019-05-30T10:00"), getDateInZone("2019-05-30T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 4, zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-03T10:00"), getDateInZone("2019-06-03T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-07").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-07T10:00"), getDateInZone("2019-06-07T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-11").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-11T10:00"), getDateInZone("2019-06-11T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-15").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-15T10:00"), getDateInZone("2019-06-15T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-19").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-19T10:00"), getDateInZone("2019-06-19T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-23T10:00"), getDateInZone("2019-06-23T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-27").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-27T10:00"), getDateInZone("2019-06-27T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(7)
		})
		o("recurring event - short with time & monthly", function () {
			const event = createEvent(getDateInZone("2019-05-31T10:00"), getDateInZone("2019-05-31T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			const expectedForMay = [cloneEventWithNewTime(event, getDateInZone("2019-05-31T10:00"), getDateInZone("2019-05-31T12:00"))]
			const expectedForJune = [cloneEventWithNewTime(event, getDateInZone("2019-06-30T10:00"), getDateInZone("2019-06-30T12:00"))]
			const expectedForJuly = [cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00"))]
			const expectedForFebruary = [cloneEventWithNewTime(event, getDateInZone("2020-02-29T10:00"), getDateInZone("2020-02-29T12:00"))]

			// add for may
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(countDaysWithEvents(eventsForDays)).equals(1)

			// add for june
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals(expectedForJune)
			o(countDaysWithEvents(eventsForDays)).equals(2)

			// add for july
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals(expectedForJune)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals(expectedForJuly)
			o(countDaysWithEvents(eventsForDays)).equals(3)

			// add for february 2020
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-02-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(expectedForMay)
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals(expectedForJune)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals(expectedForJuly)
			o(eventsForDays.get(getDateInZone("2020-02-29").getTime())).deepEquals(expectedForFebruary)
			o(countDaysWithEvents(eventsForDays)).equals(4)
		})
		o("recurring event - short with time & monthly interval", function () {
			const event = createEvent(getDateInZone("2019-05-31T10:00"), getDateInZone("2019-05-31T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 2, zone)
			// add for june
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(0)("does not occur in june")

			// add for july
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is added")
			o(countDaysWithEvents(eventsForDays)).equals(1)

			// add for august
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-08-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is still there")
			o(countDaysWithEvents(eventsForDays)).equals(1)("nothing added for august")

			// add for september
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-09-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is still still there")
			o(eventsForDays.get(getDateInZone("2019-09-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-09-30T10:00"), getDateInZone("2019-09-30T12:00")),
			])("event instance in september was added ")
			o(countDaysWithEvents(eventsForDays)).equals(2)("only september was added")

			// add for november
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-11-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-31").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-07-31T10:00"), getDateInZone("2019-07-31T12:00")),
			])("event instance in july is still still still there")
			o(eventsForDays.get(getDateInZone("2019-11-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-11-30T10:00"), getDateInZone("2019-11-30T12:00")),
			])("event instance in november was added")
			o(countDaysWithEvents(eventsForDays)).deepEquals(3)
		})
		o("recurring event - short multiple days ", function () {
			const event = createEvent(getDateInZone("2019-05-03T10:00"), getDateInZone("2019-05-05T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			/**
			 *       May 2019
			 * So Mo Di Mi Do Fr Sa
			 *           1  2  3  4
			 *  5  6  7  8  9 10 11
			 * 12 13 14 15 16 17 18
			 * 19 20 21 22 23 24 25
			 * 26 27 28 29 30 31
			 *
			 *     June 2019
			 * So Mo Di Mi Do Fr Sa
			 *                    1
			 *  2  3  4  5  6  7  8
			 *  9 10 11 12 13 14 15
			 * 16 17 18 19 20 21 22
			 * 23 24 25 26 27 28 29
			 * 30
			 *
			 *      July 2019
			 * So Mo Di Mi Do Fr Sa
			 *     1  2  3  4  5  6
			 *  7  8  9 10 11 12 13
			 * 14 15 16 17 18 19 20
			 * 21 22 23 24 25 26 27
			 * 28 29 30 31
			 */
			// the last occurrence in May leaks into June
			const zerothjuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-31T10:00"), getDateInZone("2019-06-02T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([zerothjuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([zerothjuneOccurrence])
			const firstJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-07T10:00"), getDateInZone("2019-06-09T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-07").getTime())).deepEquals([firstJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-08").getTime())).deepEquals([firstJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-09").getTime())).deepEquals([firstJuneOccurrence])
			const secondJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-14T10:00"), getDateInZone("2019-06-16T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-14").getTime())).deepEquals([secondJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-15").getTime())).deepEquals([secondJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-16").getTime())).deepEquals([secondJuneOccurrence])
			const thirdJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-21T10:00"), getDateInZone("2019-06-23T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-21").getTime())).deepEquals([thirdJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-22").getTime())).deepEquals([thirdJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-23").getTime())).deepEquals([thirdJuneOccurrence])
			const fourthJuneOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-06-28T10:00"), getDateInZone("2019-06-30T12:00"))
			o(eventsForDays.get(getDateInZone("2019-06-28").getTime())).deepEquals([fourthJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-29").getTime())).deepEquals([fourthJuneOccurrence])
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals([fourthJuneOccurrence])
			o(countDaysWithEvents(eventsForDays)).equals(14)

			const firstMayOccurrence = event
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([firstMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-04").getTime())).deepEquals([firstMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-05").getTime())).deepEquals([firstMayOccurrence])
			const secondMayOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-10T10:00"), getDateInZone("2019-05-12T12:00"))
			o(eventsForDays.get(getDateInZone("2019-05-10").getTime())).deepEquals([secondMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-11").getTime())).deepEquals([secondMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-12").getTime())).deepEquals([secondMayOccurrence])
			const thirdMayOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-17T10:00"), getDateInZone("2019-05-19T12:00"))
			o(eventsForDays.get(getDateInZone("2019-05-17").getTime())).deepEquals([thirdMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-18").getTime())).deepEquals([thirdMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-19").getTime())).deepEquals([thirdMayOccurrence])
			const fourthMayOccurrence = cloneEventWithNewTime(event, getDateInZone("2019-05-24T10:00"), getDateInZone("2019-05-26T12:00"))
			o(eventsForDays.get(getDateInZone("2019-05-24").getTime())).deepEquals([fourthMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-25").getTime())).deepEquals([fourthMayOccurrence])
			o(eventsForDays.get(getDateInZone("2019-05-26").getTime())).deepEquals([fourthMayOccurrence])

			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([zerothjuneOccurrence])
			o(countDaysWithEvents(eventsForDays)).equals(14 + 13)
		})
		o("weekly all-day with DST in another time zone", function () {
			// This test checks that when there is a daylight saving change in UTC-m time zone all-day events in UTC+n still work like they
			// should
			const krsk = "Asia/Krasnoyarsk"
			// all-day event with a length of 1 day
			const event = createEvent(getDateInUTC("2020-02-12"), getDateInUTC("2020-02-13"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			event.repeatRule.timeZone = "America/Los_angeles"
			const month = getMonthRange(getDateInZone("2020-03-01", krsk), krsk)
			addDaysForRecurringEvent(eventsForDays, event, month, krsk)
			o(eventsForDays.get(getDateInZone("2020-03-04", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-04"), getDateInUTC("2020-03-05")),
			])
			o(eventsForDays.get(getDateInZone("2020-03-11", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-11"), getDateInUTC("2020-03-12")),
			])
			o(eventsForDays.get(getDateInZone("2020-03-18", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-18"), getDateInUTC("2020-03-19")),
			])
			o(eventsForDays.get(getDateInZone("2020-03-25", krsk).getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2020-03-25"), getDateInUTC("2020-03-26")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(4)
		})
		o("end count", function () {
			const event = createEvent(getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			repeatRule.endType = EndType.Count
			repeatRule.endValue = "2"
			event.repeatRule = repeatRule
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-09T10:00"), getDateInZone("2019-06-09T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(2)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)
		})
		o("end on date", function () {
			const event = createEvent(getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			repeatRule.endType = EndType.UntilDate
			repeatRule.endValue = String(getDateInZone("2019-06-29").getTime())
			event.repeatRule = repeatRule
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-02T10:00"), getDateInZone("2019-06-02T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-09T10:00"), getDateInZone("2019-06-09T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-16").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-16T10:00"), getDateInZone("2019-06-16T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-23T10:00"), getDateInZone("2019-06-23T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(4)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(4)
		})
		o("end on date - all day", function () {
			// all-day event of length 1 day
			const event = createEvent(getDateInUTC("2019-06-02"), getDateInUTC("2019-06-03"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 1)
			repeatRule.endType = EndType.UntilDate
			repeatRule.endValue = String(getDateInUTC("2019-06-04").getTime())
			event.repeatRule = repeatRule
			event.repeatRule.timeZone = "Asia/Anadyr" // +12

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInUTC("2019-06-02"), getDateInUTC("2019-06-03")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([
				// there are two in here?
				cloneEventWithNewTime(event, getDateInUTC("2019-06-03"), getDateInUTC("2019-06-04")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(2)
		})
		o("add same recurring event", function () {
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-05-02T12:00"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.WEEKLY, 1, zone)
			const monthDate = getDateInZone("2019-06-01")
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(monthDate, zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-06").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-06T10:00"), getDateInZone("2019-06-06T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-13").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-13T10:00"), getDateInZone("2019-06-13T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-20").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-20T10:00"), getDateInZone("2019-06-20T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-06-27").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-06-27T10:00"), getDateInZone("2019-06-27T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(4)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			const eventClone = clone(event)
			addDaysForRecurringEvent(eventsForDays, eventClone, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-09").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-09T10:00"), getDateInZone("2019-05-09T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-16").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-16T10:00"), getDateInZone("2019-05-16T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-23").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-23T10:00"), getDateInZone("2019-05-23T12:00")),
			])
			o(eventsForDays.get(getDateInZone("2019-05-30").getTime())).deepEquals([
				cloneEventWithNewTime(event, getDateInZone("2019-05-30T10:00"), getDateInZone("2019-05-30T12:00")),
			])
			o(countDaysWithEvents(eventsForDays)).equals(9)
		})
		o("monthly with shorter month", function () {
			// Potential problem with this case is that if the end date is calculated incorrectly, event might be shortened by a few
			// days (see #1786).
			// all-day, 3 days (march 29th, 30th, 31st)
			const event = createEvent(getDateInUTC("2020-03-29"), getDateInUTC("2020-04-01"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			event.repeatRule = repeatRule
			// 2nd occurrence happens on april 29th, 30th, may 1st
			const occurrence = cloneEventWithNewTime(event, getDateInUTC("2020-04-29"), getDateInUTC("2020-05-02"))

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-03-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2020-03-29").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2020-03-30").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2020-03-31").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2020-04-01").getTime())).deepEquals(undefined)
			o(countDaysWithEvents(eventsForDays)).equals(3)

			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2020-04-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2020-04-29").getTime())).deepEquals([occurrence])("29th is 1st day of the occurrence")
			o(eventsForDays.get(getDateInZone("2020-04-30").getTime())).deepEquals([occurrence])("30. is 2. day of 2nd occurrence")
			o(eventsForDays.get(getDateInZone("2020-05-01").getTime())).deepEquals(undefined)("outside range")
			o(countDaysWithEvents(eventsForDays)).equals(5)
		})
		o("monthly with longer month", function () {
			// Potential problem with this case is that if the end date is calculated incorrectly, event might be stretched by a few
			// days (see #1786).
			const event = createEvent(new Date("2020-02-29T00:00:00.000Z"), new Date("2020-03-01T00:00:00.000Z"))
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			event.repeatRule = repeatRule
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(new Date("2020-01-31T23:00:00.000Z"), zone), zone)
			const expectedForFebruary = {
				[new Date("2020-02-28T23:00:00.000Z").getTime()]: [event],
			}
			o(mapToObject(eventsForDays)).deepEquals(expectedForFebruary)("only the last day of february is in the map")
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(new Date("2020-02-31T23:00:00.000Z"), zone), zone)
			const occurrence = cloneEventWithNewTime(
				event,
				getAllDayDateUTCFromZone(new Date("2020-03-28T23:00:00.000Z"), zone),
				getAllDayDateUTCFromZone(new Date("2020-03-29T22:00:00.000Z"), zone),
			)
			o(eventsForDays.get(new Date("2020-03-28T23:00:00.000Z").getTime())).deepEquals([occurrence])("the 28th of march is in the map")
		})
		o("adding a progenitor while there are altered instances does not remove the altered instance", function () {
			const event = createEvent(getDateInZone("2023-07-13T13:00"), getDateInZone("2023-07-13T13:30"))
			event.summary = "summary"
			const repeatRule = createRepeatRuleWithValues(RepeatPeriod.DAILY, 1, zone)
			repeatRule.endValue = "2"
			repeatRule.endType = EndType.Count
			repeatRule.excludedDates = [createDateWrapper({ date: event.startTime })]
			event.repeatRule = repeatRule
			const alteredEvent = clone(event)
			alteredEvent._id = ["shortEvents", generateEventElementId(alteredEvent.startTime.getTime())]
			alteredEvent.repeatRule = null
			alteredEvent.recurrenceId = alteredEvent.startTime
			alteredEvent.summary = "another summary"

			addDaysForEventInstance(eventsForDays, alteredEvent, getMonthRange(getDateInZone("2023-07-01"), zone), zone)
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2023-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2023-07-13").getTime())).deepEquals([alteredEvent])(
				"altered instance is on the day it occurs, but event is excluded",
			)
			const eventsOn14th = eventsForDays.get(getDateInZone("2023-07-14").getTime()) ?? []
			o(eventsOn14th.length).equals(1)("one event on 14th")
			o(eventsOn14th[0].summary).equals("summary")("occurrence of original series on 14th")
		})
	})
	o.spec("addDaysForEvent for long events", function () {
		let eventsForDays: Map<number, Array<CalendarEvent>>
		o.beforeEach(function () {
			eventsForDays = new Map()
		})
		o("longer than a month", function () {
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-06-02T12:00"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.size).equals(3)
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([])
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.size).equals(2 + 31)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).equals(undefined)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
		})
		o("longer than a month all day", function () {
			// all-day event that has a last day on 2019-06-03
			const event = createEvent(getDateInUTC("2019-05-02"), getDateInUTC("2019-06-04"))
			// add for june
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), "Europe/Berlin")
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])("there on the first")
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])("there on the 2nd")
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([event])("also there on the 3rd")
			o(countDaysWithEvents(eventsForDays)).equals(3)("no more days added")

			// also add for may
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), "Europe/Berlin")
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-03").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			// previous entries + each day of may minus one (31 - 1)
			o(countDaysWithEvents(eventsForDays)).equals(3 + 30)
		})
		o("multiple months", function () {
			// event goes from april to june
			const event = createEvent(getDateInZone("2019-04-02T10:00"), getDateInZone("2019-06-02T12:00"))
			// first, only add for june
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])("there on the 1st")
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])("there on the 2nd")
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([])("not there on the 3rd")
			o(eventsForDays.size).equals(3)("no more days added for this call")

			// now also add for may
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime())).deepEquals([event])("there on the 1st")
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])("there on the 2nd")
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])("there on the 31st")
			o(eventsForDays.size).equals(3 + 31)("added for each day of may but no more")

			// also add for april
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-04-01"), zone), zone)
			o(eventsForDays.size).equals(3 + 31 + 29)("now it's there for june, may, april")
			o(eventsForDays.get(getDateInZone("2019-04-01").getTime())).deepEquals(undefined)("1st of april is not touched")
			o(eventsForDays.get(getDateInZone("2019-04-02").getTime())).deepEquals([event])("2nd it's there")
			o(eventsForDays.get(getDateInZone("2019-04-03").getTime())).deepEquals([event])("3rd it's there")
		})

		o("longer than a month repeating", function () {
			const event = createEvent(new Date("2019-05-02T08:00:00.000Z"), new Date("2019-06-02T10:00:00.000Z"))
			event.repeatRule = createRepeatRuleWithValues(RepeatPeriod.MONTHLY, 1, zone)
			const startingInMay = cloneEventWithNewTime(event, getDateInZone("2019-05-02T10:00"), getDateInZone("2019-06-02T12:00"))
			const startingInJune = cloneEventWithNewTime(event, getDateInZone("2019-06-02T10:00"), getDateInZone("2019-07-03T12:00"))
			const startingInJuly = cloneEventWithNewTime(event, getDateInZone("2019-07-02T10:00"), getDateInZone("2019-08-02T12:00"))

			// invoke for june only
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals(undefined)("nothing added for the 31st of may")
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([startingInMay])("but may instance is still going on at start of june")
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([startingInMay, startingInJune])
			o(eventsForDays.get(getDateInZone("2019-06-30").getTime())).deepEquals([startingInJune])
			o(eventsForDays.get(getDateInZone("2019-07-01").getTime())).deepEquals(undefined)("we're not caring about july")
			o(eventsForDays.size).equals(30)

			// now also invoke for july
			addDaysForRecurringEvent(eventsForDays, event, getMonthRange(getDateInZone("2019-07-01"), zone), zone)
			o(eventsForDays.get(getDateInZone("2019-07-01").getTime())).deepEquals([startingInJune])("june instance still going on")
			o(eventsForDays.get(getDateInZone("2019-07-03").getTime())).deepEquals([startingInJune, startingInJuly])("july instance added as well")
			o(eventsForDays.get(getDateInZone("2019-07-04").getTime())).deepEquals([startingInJuly])("june instance now ended.")
			o(eventsForDays.get(getDateInZone("2019-07-30").getTime())).deepEquals([startingInJuly])("only starting in july at end of july")
			o(eventsForDays.get(getDateInZone("2019-08-01").getTime())).deepEquals(undefined)("nothing in august")
			o(eventsForDays.size).equals(31 + 30) // previous plus all of july
		})
		o("add same event does not increase number of days with events", function () {
			const event = createEvent(getDateInZone("2019-05-02T10:00"), getDateInZone("2019-06-02T12:00"))
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			addDaysForEventInstance(eventsForDays, clone(event), getMonthRange(getDateInZone("2019-06-01"), zone), zone)
			o(countDaysWithEvents(eventsForDays)).equals(2)("days with events after adding june twice")
			o(eventsForDays.get(getDateInZone("2019-06-01").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-06-03").getTime())).deepEquals([]) // there's one empty day
			addDaysForEventInstance(eventsForDays, event, getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			addDaysForEventInstance(eventsForDays, clone(event), getMonthRange(getDateInZone("2019-05-01"), zone), zone)
			// 2 in june plus everything in may except for the first (event starts on the 2nd)
			o(countDaysWithEvents(eventsForDays)).equals(32)("days with events after adding may twice")
			o(eventsForDays.get(getDateInZone("2019-05-01").getTime()) == null).equals(true)
			o(eventsForDays.get(getDateInZone("2019-05-02").getTime())).deepEquals([event])
			o(eventsForDays.get(getDateInZone("2019-05-31").getTime())).deepEquals([event])
		})
	})
	o.spec("incrementByRepeatPeriod", function () {
		const timeZone = "Europe/Berlin"
		o("with daylight saving", function () {
			const daylightSavingDay = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 26,
					hour: 10,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			const dayAfter = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 27,
					hour: 11,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			// event timezone is subject to daylight saving but observer is not
			o(incrementByRepeatPeriod(daylightSavingDay, RepeatPeriod.DAILY, 1, timeZone).toISOString()).equals(dayAfter.toISOString())
		})
		o("event in timezone without daylight saving should not be subject to daylight saving", function () {
			const daylightSavingDay = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 26,
					hour: 10,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			const dayAfter = DateTime.fromObject(
				{
					year: 2019,
					month: 10,
					day: 27,
					hour: 10,
				},
				{ zone: "Europe/Moscow" },
			).toJSDate()
			o(incrementByRepeatPeriod(daylightSavingDay, RepeatPeriod.DAILY, 1, "Europe/Moscow").toISOString()).equals(dayAfter.toISOString())
		})
		o("weekly", function () {
			const onFriday = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 31,
					hour: 10,
				},
				{ zone: timeZone },
			).toJSDate()
			const nextFriday = DateTime.fromObject(
				{
					year: 2019,
					month: 6,
					day: 7,
					hour: 10,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(onFriday, RepeatPeriod.WEEKLY, 1, timeZone).toISOString()).equals(nextFriday.toISOString())
			const oneYearAfter = DateTime.fromObject(
				{
					year: 2020,
					month: 5,
					day: 29,
					hour: 10,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(onFriday, RepeatPeriod.WEEKLY, 52, timeZone).toISOString()).equals(oneYearAfter.toISOString())
		})
		o("monthly", function () {
			const endOfMay = DateTime.fromObject(
				{
					year: 2019,
					month: 5,
					day: 31,
				},
				{ zone: timeZone },
			).toJSDate()
			const endOfJune = DateTime.fromObject(
				{
					year: 2019,
					month: 6,
					day: 30,
				},
				{ zone: timeZone },
			).toJSDate()
			const calculatedEndOfJune = incrementByRepeatPeriod(endOfMay, RepeatPeriod.MONTHLY, 1, timeZone)
			o(calculatedEndOfJune.toISOString()).equals(endOfJune.toISOString())
			const endOfJuly = DateTime.fromObject(
				{
					year: 2019,
					month: 7,
					day: 31,
				},
				{ zone: timeZone },
			).toJSDate()
			const endOfJulyString = endOfJuly.toISOString()
			const incrementedDateString = incrementByRepeatPeriod(endOfMay, RepeatPeriod.MONTHLY, 2, timeZone).toISOString()
			o(incrementedDateString).equals(endOfJulyString)
		})
		o("annually", function () {
			const leapYear = DateTime.fromObject(
				{
					year: 2020,
					month: 2,
					day: 29,
				},
				{ zone: timeZone },
			).toJSDate()
			const yearAfter = DateTime.fromObject(
				{
					year: 2021,
					month: 2,
					day: 28,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 1, timeZone).toISOString()).equals(yearAfter.toISOString())
			const twoYearsAfter = DateTime.fromObject(
				{
					year: 2022,
					month: 2,
					day: 28,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 2, timeZone).toISOString()).equals(twoYearsAfter.toISOString())
			const fourYearsAfter = DateTime.fromObject(
				{
					year: 2024,
					month: 2,
					day: 29,
				},
				{ zone: timeZone },
			).toJSDate()
			o(incrementByRepeatPeriod(leapYear, RepeatPeriod.ANNUALLY, 4, timeZone).toISOString()).equals(fourYearsAfter.toISOString())
		})
	})
	o.spec("calendar event updates", function () {
		let restClientMock: EntityRestClientMock
		let groupRoot: CalendarGroupRoot
		const loginController = makeLoginController()
		const alarmsListId = neverNull(loginController.getUserController().user.alarmInfoList).alarms
		o.beforeEach(function () {
			groupRoot = createCalendarGroupRoot({
				_id: "groupRootId",
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})
			restClientMock = new EntityRestClientMock()
			restClientMock.addElementInstances(groupRoot)
		})
		o("reply but sender is not a guest", async function () {
			const uid = "uid"
			const existingEvent = createCalendarEvent({ uid })
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const workerClient = makeWorkerClient()
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			await model.processCalendarData("sender@example.com", {
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createCalendarEvent({
							uid,
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			// @ts-ignore
			o(calendarFacade.updateCalendarEvent.calls.length).equals(0)
		})
		o("reply", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const anotherGuest = "another-attendee"
			const alarm = createAlarmInfo({
				_id: "alarm-id",
			})
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				uid,
				_ownerGroup: groupRoot._id,
				summary: "v1",
				attendees: [
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							address: sender,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
					createCalendarEventAttendee({
						address: createEncryptedMailAddress({
							address: anotherGuest,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
				alarmInfos: [[alarmsListId, alarm._id]],
			})
			restClientMock.addListInstances(
				createUserAlarmInfo({
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			await model.processCalendarData(sender, {
				// should be ignored
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createCalendarEvent({
							uid,
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({
										address: sender,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
								createCalendarEventAttendee({
									// should be ignored
									address: createEncryptedMailAddress({
										address: anotherGuest,
									}),
									status: CalendarAttendeeStatus.DECLINED,
								}),
							],
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			const [createdEvent, alarms] = calendarFacade.updateCalendarEvent.calls[0].args
			o(createdEvent.uid).equals(existingEvent.uid)
			o(createdEvent.summary).equals(existingEvent.summary)
			o(createdEvent.attendees).deepEquals([
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
						address: sender,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createCalendarEventAttendee({
					address: createEncryptedMailAddress({
						address: "another-attendee",
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			])
			o(alarms).deepEquals([alarm])
		})
		o("request as a new invite", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const restClientMock = new EntityRestClientMock()
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) => Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			await model.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: createCalendarEvent({
							uid,
							attendees: [
								createCalendarEventAttendee({
									address: createEncryptedMailAddress({
										address: sender,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
							],
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			// It'a a new invite, we don't do anything with them yet
			// @ts-ignore
			o(calendarFacade.updateCalendarEvent.calls).deepEquals([])
		})
		o("request as an update", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const alarm = createAlarmInfo({
				_id: "alarm-id",
			})
			restClientMock.addListInstances(
				createUserAlarmInfo({
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const startTime = new Date()
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createEncryptedMailAddress({
					address: sender,
				}),
				alarmInfos: [[alarmsListId, alarm._id]],
				startTime,
			})
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			const sentEvent = createCalendarEvent({
				summary: "v2",
				uid,
				sequence: "2",
				organizer: createEncryptedMailAddress({
					address: sender,
				}),
				startTime,
			})
			await model.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			// @ts-ignore
			const [updatedEvent, updatedAlarms, oldEvent] = calendarFacade.updateCalendarEvent.calls[0].args
			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedAlarms).deepEquals([alarm])
			o(oldEvent).deepEquals(existingEvent)
		})
		o("event is re-created when the start time changes", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const alarm = createAlarmInfo({
				_id: "alarm-id",
			})
			restClientMock.addListInstances(
				createUserAlarmInfo({
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const existingEvent = createCalendarEvent({
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createEncryptedMailAddress({
					address: sender,
				}),
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 5,
						day: 10,
					},
					{ zone: "UTC" },
				).toJSDate(),
				alarmInfos: [[alarmsListId, alarm._id]],
			})
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
				},
				restClientMock,
			)
			const model = init({
				workerClient,
				restClientMock,
				calendarFacade,
			})
			const sentEvent = createCalendarEvent({
				summary: "v2",
				uid,
				sequence: "2",
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 5,
						day: 11,
					},
					{ zone: "UTC" },
				).toJSDate(),
				organizer: createEncryptedMailAddress({
					address: sender,
				}),
			})
			await model.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			// @ts-ignore
			o(calendarFacade.updateCalendarEvent.calls).deepEquals([])
			// @ts-ignore
			const [updatedEvent, updatedAlarms, oldEvent] = calendarFacade.saveCalendarEvent.calls[0].args
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
					organizer: createEncryptedMailAddress({
						address: sender,
					}),
				})
				restClientMock.addListInstances(existingEvent)
				const workerClient = makeWorkerClient()
				const calendarFacade = makeCalendarFacade(
					{
						getEventsByUid: (loadUid) =>
							uid === loadUid ? Promise.resolve({ progenitor: existingEvent, alteredInstances: [] }) : Promise.resolve(null),
					},
					restClientMock,
				)
				const model = init({
					workerClient,
					restClientMock,
					calendarFacade: calendarFacade,
				})
				const sentEvent = createCalendarEvent({
					uid,
					sequence: "2",
					organizer: createEncryptedMailAddress({
						address: sender,
					}),
				})
				await model.processCalendarData(sender, {
					method: CalendarMethod.CANCEL,
					contents: [
						{
							event: sentEvent as CalendarEventProgenitor,
							alarms: [],
						},
					],
				})
				o(Object.getPrototypeOf(await asResult(restClientMock.load(CalendarEventTypeRef, existingEvent._id, null)))).equals(NotFoundError.prototype)(
					"Calendar event was deleted",
				)
			})
			o("event is cancelled by someone else than organizer", async function () {
				const uid = "uid"
				const sender = "sender@example.com"
				const existingEvent = createCalendarEvent({
					_id: ["listId", "eventId"],
					_ownerGroup: groupRoot._id,
					sequence: "1",
					uid,
					organizer: createEncryptedMailAddress({
						address: sender,
					}),
				})
				restClientMock.addListInstances(existingEvent)
				const workerClient = makeWorkerClient()
				const model = init({
					workerClient,
					restClientMock,
				})
				const sentEvent = createCalendarEvent({
					uid,
					sequence: "2",
					organizer: createEncryptedMailAddress({
						address: sender,
					}),
				})
				await model.processCalendarData("another-sender", {
					method: CalendarMethod.CANCEL,
					contents: [
						{
							event: sentEvent as CalendarEventProgenitor,
							alarms: [],
						},
					],
				})
				o(await restClientMock.load(CalendarEventTypeRef, existingEvent._id, null)).equals(existingEvent)("Calendar event was not deleted")
			})
		})
	})
})

function makeNotifications(): Notifications {
	return downcast({})
}

function makeProgressTracker(): ProgressTracker {
	return downcast({
		register: () => 0,
	})
}

function makeEventController(): {
	eventController: EventController
	sendEvent: (arg0: EntityUpdateData) => void
} {
	const listeners = []
	return {
		eventController: downcast({
			listeners,
			addEntityListener: noOp,
		}),
		sendEvent: (update) => {
			for (let listener of listeners) {
				// @ts-ignore
				listener([update])
			}
		},
	}
}

function makeWorkerClient(): WorkerClient {
	return downcast({})
}

function makeLoginController(props: Partial<UserController> = {}): LoginController {
	const userController = downcast(
		Object.assign(props, {
			user: createUser({
				_id: "user-id",
				alarmInfoList: createUserAlarmInfoListType({
					alarms: "alarms",
				}),
			}),
		}),
	)
	return downcast({
		getUserController: () => userController,
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

function makeAlarmScheduler(): AlarmScheduler {
	return {
		scheduleAlarm: o.spy(),
		cancelAlarm: o.spy(),
	}
}

function makeMailModel(): MailModel {
	return downcast({})
}

function makeCalendarFacade(getEventsByUid, entityRestClient: EntityRestClientMock): CalendarFacade {
	return downcast({
		getEventsByUid: getEventsByUid.getEventsByUid,
		updateCalendarEvent: o.spy(() => Promise.resolve()),
		saveCalendarEvent: o.spy((event) => {
			entityRestClient.addListInstances(event)
			return Promise.resolve()
		}),
	})
}

function makeFileController(): FileController {
	return downcast({})
}

function init({
	notifications = makeNotifications(),
	eventController = makeEventController().eventController,
	workerClient,
	restClientMock,
	loginController = makeLoginController(),
	progressTracker = makeProgressTracker(),
	entityClient = new EntityClient(restClientMock),
	mailModel = makeMailModel(),
	alarmScheduler = makeAlarmScheduler(),
	calendarFacade = makeCalendarFacade(
		{
			getEventsByUid: () => Promise.resolve(null),
		},
		restClientMock,
	),
	fileFacade = makeFileController(),
}): CalendarModel {
	const lazyScheduler = async () => alarmScheduler

	return new CalendarModel(
		notifications,
		lazyScheduler,
		eventController,
		workerClient,
		loginController,
		progressTracker,
		entityClient,
		mailModel,
		calendarFacade,
		fileFacade,
		"Europe/Berlin",
	)
}
