import o from "@tutao/otest"
import { noOp } from "@tutao/tutanota-utils"
import { getEventWithDefaultTimes, isAllDayEvent } from "../../../../src/common/api/common/utils/CommonCalendarUtils.js"
import { EndType, RepeatPeriod } from "../../../../src/common/api/common/TutanotaConstants.js"
import { DateWrapperTypeRef, RepeatRuleTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { CalendarEvent, CalendarEventTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { DateTime } from "luxon"
import { createTestEntity } from "../../TestUtils.js"
import { CalendarEventWhenModel, getDefaultEndCountValue } from "../../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventWhenModel.js"
import { Time } from "../../../../src/common/calendar/date/Time.js"

o.spec("CalendarEventWhenModel", function () {
	const getModelBerlin = (initialValues: Partial<CalendarEvent>) => new CalendarEventWhenModel(initialValues, "Europe/Berlin", noOp)

	const getModelKrasnoyarsk = (initialValues: Partial<CalendarEvent>) => new CalendarEventWhenModel(initialValues, "Asia/Krasnoyarsk", noOp)

	o.spec("date modifications", function () {
		o("if the start date is set to before 1970, it will be set to this year", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:45.523Z"),
				endTime: new Date("2023-04-27T08:57:45.523Z"),
			})
			model.startDate = new Date("1969-04-27T08:27:00.000Z")
			o(model.startDate.getFullYear()).equals(new Date().getFullYear())
		})
		o("if the start time is changed while not all-day, the end time changes by the same amount", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:00.000Z"),
				endTime: new Date("2023-04-27T08:57:00.000Z"),
			})
			const startTime = model.startTime
			o(startTime.to24HourString()).equals("10:27")
			model.startTime = new Time(startTime.hour, startTime.minute + 3)

			o(model.startTime.to24HourString()).equals("10:30")
			o(model.endTime.to24HourString()).equals("11:00")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-27T08:30:00.000Z")
			o(result.endTime.toISOString()).equals("2023-04-27T09:00:00.000Z")
		})
		o("if the start date is changed while not all-day, the end time changes by the same amount", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:00.000Z"),
				endTime: new Date("2023-04-27T08:57:00.000Z"),
			})
			const startDate = model.startDate
			o(startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("start date is start of the day in utc")
			model.startDate = new Date("2023-04-30T05:15:00.000Z")

			o(model.startDate.toISOString()).equals("2023-04-29T22:00:00.000Z")("start date was moved by three days")
			o(model.endDate.toISOString()).equals("2023-04-29T22:00:00.000Z")("end date was moved by three days")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-30T08:27:00.000Z")("start time on result is correct and includes time")
			o(result.endTime.toISOString()).equals("2023-04-30T08:57:00.000Z")("end time on result is correct and includes time")
		})
		o("if the start date is changed while all-day, the end time changes by the same amount", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:00.000Z"),
				endTime: new Date("2023-04-27T08:57:00.000Z"),
			})
			model.isAllDay = true
			o(model.startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("start date for display is start of day in local timezone, not UTC")
			o(model.endDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("end date for display is start of day in local timezone, not UTC")
			// plus three days
			model.startDate = new Date("2023-04-30T08:27:00.000Z")

			o(model.startDate.toISOString()).equals("2023-04-29T22:00:00.000Z")("new start date is displayed as start of current day in local tz")
			o(model.endDate.toISOString()).equals("2023-04-29T22:00:00.000Z")("new end date has also been changed")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-30T00:00:00.000Z")("start date on result is correct")
			o(result.endTime.toISOString()).equals("2023-05-01T00:00:00.000Z")("end date on result is correct")
		})
		o("modifying the start time while the event is all-day has no effect after unsetting all-day", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:45.523Z"),
				endTime: new Date("2023-04-27T08:57:45.523Z"),
			})
			o(model.isAllDay).equals(false)
			o(model.startTime.to24HourString()).equals("10:27")("still the start time we gave the model")
			model.isAllDay = true
			model.startTime = new Time(13, 30)
			const allDayResult = model.result
			o(allDayResult.startTime.toISOString()).equals("2023-04-27T00:00:00.000Z")
			model.isAllDay = false
			o(model.startTime.to24HourString()).equals("10:27")("still the start time we gave the model after change")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-27T08:27:00.000Z")
		})
		o("modifying the end time while the event is all-day has no effect after unsetting all-day", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:45.523Z"),
				endTime: new Date("2023-04-27T08:57:45.523Z"),
			})
			o(model.endTime.to24HourString()).equals("10:57")("initialization correctly applied")
			model.isAllDay = true
			model.endTime = new Time(13, 30)
			o(model.endTime.to24HourString()).equals("00:00")("all-day causes zeroed time")
			const allDayResult = model.result
			o(allDayResult.endTime.toISOString()).equals("2023-04-28T00:00:00.000Z")("the result also comes without a time part")
			model.isAllDay = false
			o(model.endTime.to24HourString()).equals("10:57")("still has old time after unsetting all-day")
			const result = model.result
			o(result.endTime.toISOString()).equals("2023-04-27T08:57:00.000Z")("the not-all-day-result includes the time")
		})
		o("rescheduling the event by a few hours correctly updates start and end time", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:45.523Z"),
				endTime: new Date("2023-04-28T08:57:45.523Z"),
			})

			o(model.startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("correct display start date")
			o(model.endDate.toISOString()).equals("2023-04-27T22:00:00.000Z")("correct display end date")
			o(model.startTime.to24HourString()).equals("10:27")("display start time correct")
			o(model.endTime.to24HourString()).equals("10:57")("display end time correct")
			model.rescheduleEvent({ hours: 10 })
			o(model.startTime.to24HourString()).equals("20:27")("start time changed correct amount")
			o(model.endTime.to24HourString()).equals("20:57")("end time changed correct amount")
			o(model.startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("the display start date did not change")
			o(model.endDate.toISOString()).equals("2023-04-27T22:00:00.000Z")("the display end date did not change")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-27T18:27:00.000Z")("result start time is correct")
			o(result.endTime.toISOString()).equals("2023-04-28T18:57:00.000Z")("result end time is correct")
		})
		o("rescheduling the event by a few days and hours correctly updates start and end times", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:45.523Z"),
				endTime: new Date("2023-04-28T08:57:45.523Z"),
			})

			o(model.startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("correct display start date")
			o(model.endDate.toISOString()).equals("2023-04-27T22:00:00.000Z")("correct display end date")
			model.rescheduleEvent({ days: -3, hours: 10 })
			o(model.startTime.to24HourString()).equals("20:27")("start time updated")
			o(model.endTime.to24HourString()).equals("20:57")("end time updated")
			o(model.startDate.toISOString()).equals("2023-04-23T22:00:00.000Z")("the display start date did change")
			o(model.endDate.toISOString()).equals("2023-04-24T22:00:00.000Z")("the display end date did change")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-24T18:27:00.000Z")("result start time is correct")
			o(result.endTime.toISOString()).equals("2023-04-25T18:57:00.000Z")("result end time is correct")
		})
		o("rescheduling the event by a few days correctly updates start and end times for all-day events", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
			})

			o(model.startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("correct display start date")
			o(model.endDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("correct display end date")
			model.rescheduleEvent({ days: 3, hours: 10 })
			o(model.startTime.to24HourString()).equals("00:00")("start time changed correct amount")
			o(model.endTime.to24HourString()).equals("00:00")("end time changed correct amount")
			o(model.startDate.toISOString()).equals("2023-04-29T22:00:00.000Z")("the display start date did not change")
			o(model.endDate.toISOString()).equals("2023-04-29T22:00:00.000Z")("the display end date did not change")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-30T00:00:00.000Z")("result start time is correct")
			o(result.endTime.toISOString()).equals("2023-05-01T00:00:00.000Z")("result end time is correct")
		})
		o("setting the start date correctly updates the start date and end date", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:45.523Z"),
				endTime: new Date("2023-04-28T08:57:45.523Z"),
			})

			model.startDate = new Date("2023-04-28T04:00:00.000Z")
			o(model.startTime.to24HourString()).equals("10:27")("start time did not change")
			o(model.endTime.to24HourString()).equals("10:57")("end time did not change")
			o(model.startDate.toISOString()).equals("2023-04-27T22:00:00.000Z")("the display start date is shifted by one day")
			o(model.endDate.toISOString()).equals("2023-04-28T22:00:00.000Z")("the display end date was also moved by one day")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-28T08:27:00.000Z")("result start time is correct")
			o(result.endTime.toISOString()).equals("2023-04-29T08:57:00.000Z")("result end time is correct")
		})
		o("setting the start date correctly updates the start date and end date, all day true", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
			})

			o(model.startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("correct display start date")
			o(model.endDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("correct display end date")
			model.startDate = new Date("2023-04-28T04:00:00.000Z")
			o(model.startTime.to24HourString()).equals("00:00")("start time did not change")
			o(model.endTime.to24HourString()).equals("00:00")("end time did not change")
			o(model.startDate.toISOString()).equals("2023-04-27T22:00:00.000Z")("the display start date is shifted by one day")
			o(model.endDate.toISOString()).equals("2023-04-27T22:00:00.000Z")("the display end date was also moved by one day")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-28T00:00:00.000Z")("result start time is correct")
			o(result.endTime.toISOString()).equals("2023-04-29T00:00:00.000Z")("result end time is correct")
		})
		o("setting the end date correctly updates the end date", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T08:27:45.523Z"),
				endTime: new Date("2023-04-28T08:57:45.523Z"),
			})
			o(model.endDate.toISOString()).equals("2023-04-27T22:00:00.000Z")("the initialization was correctly applied")
			model.endDate = new Date("2023-05-27T04:00:00.000Z")
			o(model.startTime.to24HourString()).equals("10:27")("start time did not change")
			o(model.endTime.to24HourString()).equals("10:57")("end time did not change")
			o(model.startDate.toISOString()).equals("2023-04-26T22:00:00.000Z")("start date did not change")
			o(model.endDate.toISOString()).equals("2023-05-26T22:00:00.000Z")("end date is correctly shifted")
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-27T08:27:00.000Z")("result start time is correct")
			o(result.endTime.toISOString()).equals("2023-05-27T08:57:00.000Z")("result end time is correct")
		})
	})

	o.spec("all day", function () {
		o("all day is set correctly for an event that is all-day by times", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
			})
			o(model.isAllDay).equals(true)
		})
		o("all day is set correctly for an event that is not all-day by times", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T01:00:00.000Z"),
				endTime: new Date("2023-04-28T00:02:00.000Z"),
			})
			o(model.isAllDay).equals(false)
		})
		o("setting all-day correctly sets utc times to midnight", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T01:00:00.000Z"),
				endTime: new Date("2023-04-28T00:02:00.000Z"),
			})
			model.isAllDay = true
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-27T00:00:00.000Z")
			o(result.endTime.toISOString()).equals("2023-04-29T00:00:00.000Z")
			o(isAllDayEvent(result)).equals(true)
		})
		o("setting all-day correctly sets utc times to midnight on an event with same start and end date", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T01:00:00.000Z"),
				endTime: new Date("2023-04-27T00:02:00.000Z"),
			})
			model.isAllDay = true
			const result = model.result
			o(result.startTime.toISOString()).equals("2023-04-27T00:00:00.000Z")
			o(result.endTime.toISOString()).equals("2023-04-28T00:00:00.000Z")
			o(isAllDayEvent(result)).equals(true)
		})
		o("setting all-day to false will cause result to not be considered all-day and the times to be set to the default", function () {
			// NOTE: this test might fail if run on exactly a full half hour. it's time dependent because the default
			// is created by the model by calling new Date()
			const now = new Date()
			const eventWithDefaults = getEventWithDefaultTimes()
			eventWithDefaults.startTime = DateTime.fromJSDate(eventWithDefaults.startTime).set({ millisecond: 0, second: 0 }).toJSDate()
			eventWithDefaults.endTime = DateTime.fromJSDate(eventWithDefaults.endTime).set({ millisecond: 0, second: 0 }).toJSDate()
			const model = getModelBerlin({
				startTime: DateTime.fromJSDate(now, { zone: "utc" }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
				endTime: DateTime.fromJSDate(now, { zone: "utc" }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).plus({ day: 1 }).toJSDate(),
			})

			o(model.isAllDay).equals(true)("correctly devised the all-day status")
			model.isAllDay = false
			const result = model.result
			o(result.startTime.toISOString()).equals(eventWithDefaults.startTime?.toISOString())("default start time was correctly applied")
			o(result.endTime.toISOString()).equals(eventWithDefaults.endTime?.toISOString())("default end time was correctly applied")
			o(isAllDayEvent(result)).equals(false)("the result is not considered all-day")
		})
	})

	o.spec("timezones", function () {
		o("creating an all-day event in one time zone will be considered all-day in another time zone", function () {
			const berlinModel = getModelBerlin({
				startTime: new Date("2023-04-27T01:00:00.000Z"),
				endTime: new Date("2023-04-27T00:02:00.000Z"),
			})
			o(berlinModel.isAllDay).equals(false)
			berlinModel.isAllDay = true
			const berlinResult = berlinModel.result
			o(berlinResult.startTime.toISOString()).equals("2023-04-27T00:00:00.000Z")
			o(berlinResult.endTime.toISOString()).equals("2023-04-28T00:00:00.000Z")

			// now, around the planet...
			const krasnoyarskModel = getModelKrasnoyarsk(berlinResult)
			o(krasnoyarskModel.isAllDay).equals(true)
		})

		o("events from another timezone correctly translate the displayed start and end times", function () {
			const berlinModel = getModelBerlin({
				startTime: new Date("2023-04-27T01:00:00.000Z"),
				endTime: new Date("2023-04-27T00:02:00.000Z"),
			})
			o(berlinModel.isAllDay).equals(false)
			berlinModel.startTime = new Time(13, 0)
			berlinModel.endTime = new Time(13, 30)
			const berlinResult = berlinModel.result
			o(berlinResult.startTime.toISOString()).equals("2023-04-27T11:00:00.000Z")
			o(berlinResult.endTime.toISOString()).equals("2023-04-27T11:30:00.000Z")

			const krasnoyarskModel = getModelKrasnoyarsk(berlinResult)
			o(krasnoyarskModel.isAllDay).equals(false)
			o(krasnoyarskModel.startTime.to24HourString()).equals("18:00")
			o(krasnoyarskModel.endTime.to24HourString()).equals("18:30")
		})

		o("repeat rules from one time zone are updated for the current time zone", function () {
			const berlinModel = getModelBerlin({
				startTime: new Date("2023-04-27T01:00:00.000Z"),
				endTime: new Date("2023-04-27T00:02:00.000Z"),
			})
			berlinModel.repeatPeriod = RepeatPeriod.DAILY
			const result = berlinModel.result
			o(result.repeatRule?.timeZone).equals(berlinModel.zone)
			const krasnoyarskModel = getModelKrasnoyarsk({
				startTime: result.startTime,
				endTime: result.endTime,
				repeatRule: result.repeatRule,
			})
			const newResult = krasnoyarskModel.result
			o(newResult.repeatRule?.timeZone).equals(krasnoyarskModel.zone)
		})
	})

	o.spec("repeat rules", function () {
		o("the repeat interval is reflected on the result and for display, no repeat", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: null,
			})
			o(model.repeatPeriod).equals(null)
			o(model.result.repeatRule).equals(null)
		})

		o("repeat interval is set to daily", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: null,
			})

			model.repeatPeriod = RepeatPeriod.DAILY
			o(model.repeatPeriod).equals(RepeatPeriod.DAILY)
			o(model.result.repeatRule).deepEquals(
				createTestEntity(RepeatRuleTypeRef, {
					interval: "1",
					endType: EndType.Never,
					endValue: "1",
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
					timeZone: model.zone,
				}),
			)
		})

		o("setting repeat end type after count works", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					interval: "1",
					endType: EndType.Never,
					endValue: "1",
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
				}),
			})
			const result = model.result

			model.repeatEndType = EndType.Count
			model.repeatEndOccurrences = 13
			o(model.repeatEndOccurrences).equals(13)

			o(model.result.repeatRule?.endType).equals(EndType.Count)
			o(model.result.repeatRule?.endValue).equals("13")
			const before = model.repeatEndDateForDisplay
			model.repeatEndDateForDisplay = new Date("2022-04-03T13:00:00.000Z")
			const after = model.repeatEndDateForDisplay
			o(before.toISOString()).equals(after.toISOString())
			o(model.repeatEndType).equals(EndType.Count)
		})

		o("setting repeat end type after date works", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					interval: "1",
					endType: EndType.Never,
					endValue: "1",
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
				}),
			})
			o(model.isAllDay).equals(true)
			const endDateForSetting = new Date("2023-05-27T13:00:00.000Z")
			const endDateForSaving = new Date("2023-05-28T00:00:00.000Z")
			const cleanEndDate = new Date("2023-05-26T22:00:00.000Z")
			model.repeatEndType = EndType.UntilDate
			model.repeatEndDateForDisplay = endDateForSetting
			o(model.repeatEndType).equals(EndType.UntilDate)
			o(model.repeatEndDateForDisplay.toISOString()).equals(cleanEndDate.toISOString())
			const result = model.result
			o(result.repeatRule?.endType).equals(EndType.UntilDate)
			o(new Date(parseInt(result.repeatRule?.endValue ?? "")).toISOString()).equals(endDateForSaving.toISOString())(
				"saved value is one day after the date we set through GUI",
			)

			o(model.repeatEndOccurrences).equals(Number(getDefaultEndCountValue()))

			model.repeatPeriod = null
			o(model.repeatPeriod).equals(null)
			o(model.result.repeatRule).equals(null)
		})

		o("changing the end date or end count if the event is not repeating is a no-op", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
			})
			const resultBefore = model.result
			model.repeatEndOccurrences = 42
			o(model.result).deepEquals(resultBefore)
			model.repeatEndDateForDisplay = new Date("2023-04-30T13:00:00.000Z")
			o(model.result).deepEquals(resultBefore)
			o(model.repeatEndDateForDisplay.toISOString()).equals("2023-05-26T22:00:00.000Z")
		})

		o("changing the end date if the event ends after count is a no-op", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					interval: "1",
					endType: EndType.Count,
					endValue: "42",
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
				}),
			})
			const resultBefore = model.result
			model.repeatEndDateForDisplay = new Date("2023-04-30T13:00:00.000Z")
			o(model.result).deepEquals(resultBefore)
			o(model.repeatEndDateForDisplay.toISOString()).equals("2023-05-26T22:00:00.000Z")
			o(model.repeatEndOccurrences).equals(42)
		})

		o("changing the end count if the event ends on date is a no-op", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					interval: "1",
					endType: EndType.UntilDate,
					endValue: new Date("2023-04-30T00:00:00.000Z").getTime().toString(),
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
				}),
			})
			o(model.repeatEndDateForDisplay.toISOString()).equals("2023-04-28T22:00:00.000Z")("before was correct end date")
			const resultBefore = model.result
			o(resultBefore.repeatRule?.endValue).equals(new Date("2023-04-30T00:00:00.000Z").getTime().toString())
			model.repeatEndOccurrences = 42
			o(model.result).deepEquals(resultBefore)
			o(model.repeatEndOccurrences).equals(10)
			o(model.repeatEndType).equals(EndType.UntilDate)
			o(model.repeatEndDateForDisplay.toISOString()).equals("2023-04-28T22:00:00.000Z")("still correct end date")
		})

		o("changing the repeat interval to something less than 1 sets it to 1", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					interval: "10",
					endType: EndType.Count,
					endValue: "10",
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
				}),
			})

			model.repeatInterval = -1
			o(model.repeatInterval).equals(1)
			o(model.result.repeatRule?.interval).equals("1")
		})

		o("repeat interval changes are reflected in the result and display", function () {
			const model = getModelBerlin({
				startTime: new Date("2023-04-27T00:00:00.000Z"),
				endTime: new Date("2023-04-28T00:00:00.000Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					interval: "10",
					endType: EndType.Count,
					endValue: "10",
					frequency: RepeatPeriod.DAILY,
					excludedDates: [],
				}),
			})
			o(model.repeatInterval).equals(10)
			o(model.result.repeatRule?.interval).equals("10")
			model.repeatInterval = 5
			o(model.repeatInterval).equals(5)
			o(model.result.repeatRule?.interval).equals("5")
		})
	})

	o.spec("deleteExcludedDates", function () {
		o("clears the array of excluded dates", async function () {
			const model = await getModelBerlin(
				createTestEntity(CalendarEventTypeRef, {
					startTime: new Date("2023-03-13T00:00:00Z"),
					repeatRule: createTestEntity(RepeatRuleTypeRef, {
						excludedDates: [createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-13T00:00:00Z") })],
					}),
				}),
			)

			model.deleteExcludedDates()
			o(model.excludedDates).deepEquals([])
			o(model.result.repeatRule?.excludedDates).deepEquals([])
		})
		o("end occurrence changed to smaller -> delete exclusions", async function () {
			const model = await getModelBerlin(
				createTestEntity(CalendarEventTypeRef, {
					startTime: new Date("2023-03-13T00:00:00Z"),
					repeatRule: createTestEntity(RepeatRuleTypeRef, {
						endType: EndType.Count,
						endValue: "42",
						excludedDates: [createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-13T00:00:00Z") })],
					}),
				}),
			)
			model.repeatEndOccurrences = 30
			o(model.excludedDates.length).equals(1)
			o(model.result.repeatRule?.excludedDates.length).equals(0)
		})
		o("end occurrence changed to bigger -> delete exclusions", async function () {
			const model = await getModelBerlin(
				createTestEntity(CalendarEventTypeRef, {
					startTime: new Date("2023-03-13T00:00:00Z"),
					repeatRule: createTestEntity(RepeatRuleTypeRef, {
						endType: EndType.Count,
						endValue: "42",
						excludedDates: [createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-13T00:00:00Z") })],
					}),
				}),
			)
			model.repeatEndOccurrences = 300
			o(model.excludedDates.length).equals(1)
			o(model.result.repeatRule?.excludedDates.length).equals(0)
		})
		o("interval changes delete exclusions", async function () {
			const excludedDates = [new Date("2023-03-13T00:00:00Z")]
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-13T00:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: "1",
					interval: "1",
					endType: EndType.Count,
					endValue: "10",
					excludedDates: excludedDates.map((date) => createTestEntity(DateWrapperTypeRef, { date })),
					timeZone: "Europe/Berlin",
				}),
			})
			const model = getModelBerlin(event)

			model.repeatInterval = 1
			o(model.excludedDates).deepEquals(excludedDates)("model has same exclusions as original event")
			o(model.result.repeatRule?.excludedDates).deepEquals(event.repeatRule?.excludedDates)("result has same exclusion as original event")
			model.repeatInterval = 2
			o(model.excludedDates).deepEquals(excludedDates)
			o(model.result.repeatRule?.excludedDates).deepEquals([])
		})
		o("frequency changes delete exclusions", async function () {
			const excludedDates = [new Date("2023-03-13T00:00:00Z")]
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-03-13T00:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: "1",
					interval: "1",
					endType: EndType.Count,
					endValue: "10",
					excludedDates: excludedDates.map((date) => createTestEntity(DateWrapperTypeRef, { date })),
					timeZone: "Europe/Berlin",
				}),
			})
			const model = getModelBerlin(event)
			model.repeatPeriod = RepeatPeriod.WEEKLY
			o(model.excludedDates).deepEquals(excludedDates)
			o(model.result.repeatRule?.excludedDates).deepEquals(event.repeatRule?.excludedDates)
			model.repeatPeriod = RepeatPeriod.DAILY
			o(model.excludedDates).deepEquals(excludedDates)
			o(model.result.repeatRule?.excludedDates).deepEquals([])
		})
		o("repeat end date changes delete exclusions", async function () {
			const excludedDates = [new Date("2023-04-13T15:00:00Z")]
			const originalUntilDate = new Date("2023-05-13T00:00:00Z")
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-01-13T15:00:00Z"),
				endTime: new Date("2023-01-13T20:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					endType: EndType.UntilDate,
					endValue: originalUntilDate.getTime().toString(),
					excludedDates: excludedDates.map((date) => createTestEntity(DateWrapperTypeRef, { date })),
					timeZone: "Europe/Berlin",
				}),
			})
			const model = getModelBerlin(event)
			model.repeatEndDateForDisplay = new Date(model.repeatEndDateForDisplay.getTime())
			o(model.excludedDates).deepEquals(excludedDates)("we still have them available for display")
			o(model.result.repeatRule?.excludedDates).deepEquals(event.repeatRule?.excludedDates)(
				"in the result, they're still there because the end date did not change",
			)
			model.repeatEndDateForDisplay = new Date("2023-06-13T00:00:00Z")
			o(model.excludedDates).deepEquals(excludedDates)
			o(model.result.repeatRule?.excludedDates).deepEquals([])
		})
		o("repeat end date changes delete exclusions, all-day events", function () {
			const excludedDates = [new Date("2023-04-13T15:00:00Z")]
			const originalUntilDate = new Date("2023-05-13T00:00:00Z")
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-01-13T00:00:00Z"),
				endTime: new Date("2023-01-14T00:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					endType: EndType.UntilDate,
					endValue: originalUntilDate.getTime().toString(),
					excludedDates: excludedDates.map((date) => createTestEntity(DateWrapperTypeRef, { date })),
					timeZone: "Europe/Berlin",
				}),
			})
			const model = getModelBerlin(event)
			o(model.isAllDay).equals(true)
			model.repeatEndDateForDisplay = new Date(model.repeatEndDateForDisplay.getTime())
			o(model.excludedDates).deepEquals(excludedDates)("we still have them available for display")
			o(model.result.repeatRule?.excludedDates).deepEquals(event.repeatRule?.excludedDates)(
				"in the result, they're still there because the end date did not change",
			)
			model.repeatEndDateForDisplay = new Date("2023-06-13T00:00:00Z")
			o(model.excludedDates).deepEquals(excludedDates)
			o(model.result.repeatRule?.excludedDates).deepEquals([])
		})
		o("time zone changes do not delete exclusions", async function () {
			const excludedDates = [new Date("2023-04-13T15:00:00Z")]
			const originalUntilDate = new Date("2023-05-13T00:00:00Z")
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-01-13T00:00:00Z"),
				endTime: new Date("2023-01-14T00:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					endType: EndType.UntilDate,
					endValue: originalUntilDate.getTime().toString(),
					excludedDates: excludedDates.map((date) => createTestEntity(DateWrapperTypeRef, { date })),
					timeZone: "Asia/Krasnoyarsk",
				}),
			})
			const model = getModelBerlin(event)
			o(model.excludedDates).deepEquals(excludedDates)
			const result = model.result
			o(result.repeatRule?.excludedDates).deepEquals(event.repeatRule?.excludedDates)
			o(result.repeatRule?.timeZone).equals("Europe/Berlin")
		})
	})
	o.spec("excludeDate", function () {
		o("no exclusion is added if event has no repeat rule", async function () {
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-01-13T00:00:00Z"),
				endTime: new Date("2023-01-14T00:00:00Z"),
				repeatRule: null,
			})
			const model = getModelBerlin(event)
			model.excludeDate(new Date("2023-01-13T00:00:00Z"))
			o(model.repeatPeriod).equals(null)
			o(model.result.repeatRule).equals(null)
		})
		o("adding two exclusions in reverse order sorts them", async function () {
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-01-13T00:00:00Z"),
				endTime: new Date("2023-01-14T00:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					endType: EndType.Never,
					endValue: null,
					excludedDates: [],
				}),
			})
			const model = getModelBerlin(event)
			const exclusions = [new Date("2023-03-12T00:00:00Z"), new Date("2023-03-13T00:00:00Z")]
			model.excludeDate(exclusions[1])
			model.excludeDate(exclusions[0])

			o(model.result.repeatRule?.excludedDates).deepEquals(exclusions.map((date) => createTestEntity(DateWrapperTypeRef, { date })))
			o(model.excludedDates).deepEquals(exclusions)
		})
		o("adding two exclusions in order sorts them", async function () {
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-01-13T00:00:00Z"),
				endTime: new Date("2023-01-14T00:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					endType: EndType.Never,
					endValue: null,
					excludedDates: [],
				}),
			})
			const model = getModelBerlin(event)
			const exclusions = [new Date("2023-03-12T00:00:00Z"), new Date("2023-03-13T00:00:00Z")]
			model.excludeDate(exclusions[0])
			model.excludeDate(exclusions[1])

			o(model.result.repeatRule?.excludedDates).deepEquals(exclusions.map((date) => createTestEntity(DateWrapperTypeRef, { date })))
			o(model.excludedDates).deepEquals(exclusions)
		})
		o("adding the same exclusion multiple times deduplicates them", async function () {
			const event = createTestEntity(CalendarEventTypeRef, {
				startTime: new Date("2023-01-13T00:00:00Z"),
				endTime: new Date("2023-01-14T00:00:00Z"),
				repeatRule: createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
					endType: EndType.Never,
					endValue: null,
					excludedDates: [],
				}),
			})
			const model = getModelBerlin(event)
			const exclusion = new Date("2023-03-12T00:00:00Z")
			model.excludeDate(exclusion)
			model.excludeDate(exclusion)

			o(model.result.repeatRule?.excludedDates).deepEquals([createTestEntity(DateWrapperTypeRef, { date: exclusion })])
			o(model.excludedDates).deepEquals([exclusion])
		})
	})
})
