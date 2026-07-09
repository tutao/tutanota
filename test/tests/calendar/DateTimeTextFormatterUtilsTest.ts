import o from "@tutao/otest"
import { DateTime } from "luxon"
import {
	formatEventDuration,
	formatEventTime,
	formatEventTimesAtDate,
	formatTimeWithZoneInfo,
	getTimeZoneGmtOffset,
	getTimeZoneOffsetLongName,
	shouldShowTimeZones,
} from "../../../src/applications/calendar-app/calendar/gui/DateTimeTextFormatterUtils"
import { EventTextTimeOption } from "../../../src/platform-kit/app-env"
import assert from "node:assert"

o.spec("DateTimeTextFormatterUtils", () => {
	o.test("getTimeZoneGmtOffset", () => {
		const dateTime = DateTime.fromISO("2026-01-01T12:00:00")
		for (const [timeZone, expectedReturnValue] of [
			["Europe/London", "GMT+0"],
			["Europe/Berlin", "GMT+1"],
			["Europe/Kiev", "GMT+2"],
			["Africa/Nairobi", "GMT+3"],
			["Australia/Eucla", "GMT+8:45"],
			["Australia/Darwin", "GMT+9:30"],
			["Pacific/Auckland", "GMT+13"],
			["America/Buenos_Aires", "GMT-3"],
			["America/Argentina/Buenos_Aires", "GMT-3"],
			["America/St_Johns", "GMT-3:30"],
			["America/New_York", "GMT-5"],
			["America/Los_Angeles", "GMT-8"],
			["America/Adak", "GMT-10"],
			["UTC", "GMT+0"],
			// Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
			// in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
			["Etc/GMT+1", "GMT-1"],
		]) {
			o(getTimeZoneGmtOffset(dateTime, timeZone)).equals(expectedReturnValue)
		}
	})
	o.spec("getTimeZoneOffsetLongName", () => {
		o.test("Returns correct offset names for standard time", () => {
			const dateTime = DateTime.fromISO("2026-01-01T12:00:00")
			for (const [timeZone, expectedReturnValue] of [
				["Europe/Berlin", "Central European Standard Time"],
				["America/Buenos_Aires", "Argentina Standard Time"],
				["America/Argentina/Buenos_Aires", "Argentina Standard Time"],
				["UTC", "UTC"],
				// Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
				// in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
				["Etc/GMT+1", "GMT-01:00"],
			]) {
				o(getTimeZoneOffsetLongName(dateTime, timeZone)).equals(expectedReturnValue)
			}
		})
		o.test("Returns correct offset names for daylight saving time", () => {
			const dateTime = DateTime.fromISO("2026-07-01T12:00:00")
			for (const [timeZone, expectedReturnValue] of [
				["Europe/Berlin", "Central European Summer Time"],

				// The following should remain unaffected by daylight saving
				["UTC", "UTC"],
				// Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
				// in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
				["Etc/GMT+1", "GMT-01:00"],
			]) {
				o(getTimeZoneOffsetLongName(dateTime, timeZone)).equals(expectedReturnValue)
			}
		})
	})

	const sameDayEventStartTime = new Date("2026-01-01T12:00:00")
	const sameDayEventEndTime = new Date("2026-01-01T12:30:00")

	const multiDayEventStartTime = new Date("2026-01-01T12:00:00")
	const multiDayEventEndTime = new Date("2026-01-03T12:30:00")

	const allDaySameDayEventStartTime = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))
	const allDaySameDayEventEndTime = new Date(Date.UTC(2026, 0, 2, 0, 0, 0))

	const allDayMultiDayEventStartTime = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))
	const allDayMultiDayEventEndTime = new Date(Date.UTC(2026, 0, 4, 0, 0, 0))

	o.spec("formatEventDuration", () => {
		o.test("Handles same-day event time", () => {
			o(
				formatEventDuration(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					"Europe/Berlin",
					false,
				),
			).equals("Jan 1, 2026, 12:00 PM - 12:30 PM")
		})
		o.test("Handles multi-day event times", () => {
			o(
				formatEventDuration(
					{
						startTime: multiDayEventStartTime,
						endTime: multiDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					"Europe/Berlin",
					false,
				),
			).equals("Jan 1, 2026, 12:00 PM - Jan 3, 2026, 12:30 PM")
		})
		o.test("Handles all-day (same-day) event times", () => {
			o(
				formatEventDuration(
					{
						startTime: allDaySameDayEventStartTime,
						endTime: allDaySameDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					"Europe/Berlin",
					false,
				),
			).equals("All Day, Jan 1, 2026")
		})
		o.test("Handles all-day, multi-day event times", () => {
			o(
				formatEventDuration(
					{
						startTime: allDayMultiDayEventStartTime,
						endTime: allDayMultiDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					"Europe/Berlin",
					false,
				),
			).equals("All Day, Jan 1, 2026 - Jan 3, 2026")
		})
	})
	o.spec("formatTimeWithZoneInfo", () => {
		o.test("Only displays start time zone if end time zone is NOT provided", () => {
			o(
				formatTimeWithZoneInfo(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: "Europe/Stockholm",
						endTimeZone: null,
					},
					EventTextTimeOption.START_END_TIME,
					"Europe/Berlin",
				),
			).equals("Stockholm 12:00 PM - 12:30 PM")
		})
		o.test("Time zone only included once if start and end time zones are the same", () => {
			o(
				formatTimeWithZoneInfo(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: "Europe/Stockholm",
						endTimeZone: "Europe/Stockholm",
					},
					EventTextTimeOption.START_END_TIME,
					"Europe/Berlin",
				),
			).equals("Stockholm 12:00 PM - 12:30 PM")
			o(
				formatTimeWithZoneInfo(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					EventTextTimeOption.START_END_TIME,
					"Europe/Berlin",
				),
			).equals("Berlin 12:00 PM - 12:30 PM")
		})
		o.test("Start and end time zone included separately if they differ", () => {
			o(
				formatTimeWithZoneInfo(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: "Europe/Stockholm",
						endTimeZone: "Europe/Berlin",
					},
					EventTextTimeOption.START_END_TIME,
					"Europe/Berlin",
				),
			).equals("Stockholm 12:00 PM - Berlin 12:30 PM")
			o(
				formatTimeWithZoneInfo(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: null,
						endTimeZone: "Europe/Stockholm",
					},
					EventTextTimeOption.START_END_TIME,
					"Europe/Berlin",
				),
			).equals("Berlin 12:00 PM - Stockholm 12:30 PM")
		})
		o.test("Test multiple time zones with EventTextTimeOption.START_TIME", () => {
			const calendarTimeZone = "Europe/Berlin"
			for (const [startTimeZone, expectedReturnValue] of [
				[null, "Berlin 12:00 PM"],
				["Europe/Berlin", "Berlin 12:00 PM"],
				["America/New_York", "New York 6:00 AM"],
				["America/Argentina/Buenos_Aires", "Buenos Aires 8:00 AM"],
				["Australia/Eucla", "Eucla 7:45 PM"],
				["UTC", "UTC 11:00 AM"],
				// Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
				// in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
				["Etc/GMT+1", "GMT-1 10:00 AM"],
				["Etc/GMT-1", "GMT+1 12:00 PM"],
				["Etc/GMT+12", "GMT-12 11:00 PM"],
				["Etc/GMT-12", "GMT+12 11:00 PM"],
			]) {
				o(
					formatTimeWithZoneInfo(
						{
							startTime: sameDayEventStartTime,
							endTime: sameDayEventEndTime,
							startTimeZone,
							endTimeZone: null,
						},
						EventTextTimeOption.START_TIME,
						calendarTimeZone,
					),
				).equals(expectedReturnValue)
			}
		})
	})
	o.spec("formatEventTime", () => {
		o.test("Only displays start time when EventTextTimeOption.START_TIME is passed", () => {
			o(
				formatEventTime(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					EventTextTimeOption.START_TIME,
					false,
					"Europe/Berlin",
				),
			).equals("12:00 PM")
		})
		o.test("Only displays end time when EventTextTimeOption.END_TIME is passed", () => {
			o(
				formatEventTime(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					EventTextTimeOption.END_TIME,
					false,
					"Europe/Berlin",
				),
			).equals(" - 12:30 PM")
		})
		o.test("Displays both start and end time when EventTextTimeOption.START_END_TIME is passed", () => {
			o(
				formatEventTime(
					{
						startTime: sameDayEventStartTime,
						endTime: sameDayEventEndTime,
						startTimeZone: null,
						endTimeZone: null,
					},
					EventTextTimeOption.START_END_TIME,
					false,
					"Europe/Berlin",
				),
			).equals("12:00 PM - 12:30 PM")
		})
	})
	o.spec("formatEventTimesAtDate", () => {
		const startDay = new Date("2026-01-01T00:00:00")
		const middleDay = new Date("2026-01-02T00:00:00")
		const endDay = new Date("2026-01-03T00:00:00")

		assert(startDay.getDate() === multiDayEventStartTime.getDate())
		assert(endDay.getDate() === multiDayEventEndTime.getDate())

		o.test("Correctly handles multi-day event", () => {
			const event = {
				startTime: multiDayEventStartTime,
				endTime: multiDayEventEndTime,
				startTimeZone: null,
				endTimeZone: null,
			}
			o(formatEventTimesAtDate(startDay, event, "Europe/Berlin")).equals("12:00 PM - 11:59 PM")
			o(formatEventTimesAtDate(middleDay, event, "Europe/Berlin")).equals("All Day")
			o(formatEventTimesAtDate(endDay, event, "Europe/Berlin")).equals("12:00 AM - 12:30 PM")
		})
		o.test("Correctly handles multi-day event with start time zone", () => {
			const event = {
				startTime: multiDayEventStartTime,
				endTime: multiDayEventEndTime,
				startTimeZone: "America/New_York",
				endTimeZone: null,
			}
			o(formatEventTimesAtDate(startDay, event, "Europe/Berlin")).equals("12:00 PM - 11:59 PM (New York 6:00 AM - 5:59 PM)")
			o(formatEventTimesAtDate(middleDay, event, "Europe/Berlin")).equals("All Day")
			o(formatEventTimesAtDate(endDay, event, "Europe/Berlin")).equals("12:00 AM - 12:30 PM")
		})
		o.test("Correctly handles multi-day event with start time zone same as calendar time zone", () => {
			const event = {
				startTime: multiDayEventStartTime,
				endTime: multiDayEventEndTime,
				startTimeZone: "Europe/Berlin",
				endTimeZone: "America/New_York",
			}
			o(formatEventTimesAtDate(startDay, event, "Europe/Berlin")).equals("12:00 PM - 11:59 PM")
			o(formatEventTimesAtDate(middleDay, event, "Europe/Berlin")).equals("All Day")
			o(formatEventTimesAtDate(endDay, event, "Europe/Berlin")).equals("12:00 AM - 12:30 PM (New York 6:00 PM - 6:30 AM)")
		})
		o.test("Correctly handles multi-day event with different start and end time zone", () => {
			const event = {
				startTime: multiDayEventStartTime,
				endTime: multiDayEventEndTime,
				startTimeZone: "America/New_York",
				endTimeZone: "Asia/Tokyo",
			}
			o(formatEventTimesAtDate(startDay, event, "Europe/Berlin")).equals("12:00 PM - 11:59 PM (New York 6:00 AM - 5:59 PM)")
			o(formatEventTimesAtDate(middleDay, event, "Europe/Berlin")).equals("All Day")
			o(formatEventTimesAtDate(endDay, event, "Europe/Berlin")).equals("12:00 AM - 12:30 PM (Tokyo 8:00 AM - 8:30 PM)")
		})
	})
	o.spec("shouldShowTimeZones", () => {
		o.test("true if start time zone differs from calendar time zone", () => {
			o(shouldShowTimeZones({ startTimeZone: "Europe/Stockholm", endTimeZone: "Europe/Berlin" }, "Europe/Berlin")).equals(true)
			// null resolves to calendarTimeZone
			o(shouldShowTimeZones({ startTimeZone: "Europe/Stockholm", endTimeZone: null }, "Europe/Berlin")).equals(true)
		})
		o.test("true if end time zone differs from calendar time zone", () => {
			o(shouldShowTimeZones({ startTimeZone: "Europe/Berlin", endTimeZone: "Europe/Stockholm" }, "Europe/Berlin")).equals(true)
			// null resolves to calendarTimeZone
			o(shouldShowTimeZones({ startTimeZone: null, endTimeZone: "Europe/Stockholm" }, "Europe/Berlin")).equals(true)
		})
		o.test("true if start and end time zone differ from calendar time zone", () => {
			o(shouldShowTimeZones({ startTimeZone: "Europe/Stockholm", endTimeZone: "Europe/Stockholm" }, "Europe/Berlin")).equals(true)
			o(shouldShowTimeZones({ startTimeZone: "Europe/Stockholm", endTimeZone: "America/Buenos_Aires" }, "Europe/Berlin")).equals(true)
		})

		o.test("false if no start nor end time zone", () => {
			o(shouldShowTimeZones({ startTimeZone: null, endTimeZone: null }, "Europe/Berlin")).equals(false)
		})
		o.test("false if start time zone is calendar time zone and no end time zone", () => {
			o(shouldShowTimeZones({ startTimeZone: "Europe/Berlin", endTimeZone: null }, "Europe/Berlin")).equals(false)
		})
		o.test("false if no start time zone and end time zone is calendar time zone", () => {
			o(shouldShowTimeZones({ startTimeZone: null, endTimeZone: "Europe/Berlin" }, "Europe/Berlin")).equals(false)
		})
		o.test("false if start time zone and end time zone are calendar time zone", () => {
			o(shouldShowTimeZones({ startTimeZone: "Europe/Berlin", endTimeZone: "Europe/Berlin" }, "Europe/Berlin")).equals(false)
		})
	})
})
