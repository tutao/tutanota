import o from "@tutao/otest"
import { DateTime } from "luxon"
import {
	buildGmtOffset,
	formatEventDuration,
	formatEventTime,
	formatTimeWithZoneInfo,
} from "../../../src/applications/calendar-app/calendar/gui/DateTimeTextFormatterUtils"
import { EventTextTimeOption } from "../../../src/platform-kit/app-env"

o.spec("DateTimeTextFormatterUtils", () => {
	const multiDayEventTimes = {
		startTime: new Date("2026-01-01T12:00:00"),
		endTime: new Date("2026-01-02T12:30:00"),
	}
	const sameDayEventTimes = {
		startTime: new Date("2026-01-01T12:00:00"),
		endTime: new Date("2026-01-01T12:30:00"),
	}
	const allDaySameDayEventTimes = {
		startTime: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)),
		endTime: new Date(Date.UTC(2026, 0, 2, 0, 0, 0)),
	}
	const allDayMultiDayEventTimes = {
		startTime: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)),
		endTime: new Date(Date.UTC(2026, 0, 3, 0, 0, 0)),
	}
	o.spec("formatEventDuration", () => {
		o.test("Handles same-day event time", () => {
			o(formatEventDuration(sameDayEventTimes, { calendarTimeZone: "Europe/Berlin" }, false)).equals("Jan 1, 2026, 12:00 PM - 12:30 PM")
		})
		o.test("Handles multi-day event times", () => {
			o(formatEventDuration(multiDayEventTimes, { calendarTimeZone: "Europe/Berlin" }, false)).equals("Jan 1, 2026, 12:00 PM - Jan 2, 2026, 12:30 PM")
		})
		o.test("Handles all-day (same-day) event times", () => {
			o(formatEventDuration(allDaySameDayEventTimes, { calendarTimeZone: "Europe/Berlin" }, false)).equals("All Day, Jan 1, 2026")
		})
		o.test("Handles all-day, multi-day event times", () => {
			o(formatEventDuration(allDayMultiDayEventTimes, { calendarTimeZone: "Europe/Berlin" }, false)).equals("All Day, Jan 1, 2026 - Jan 2, 2026")
		})
	})
	o.spec("formatTimeWithZoneInfo", () => {
		o.test("Only displays start time zone if end time zone is NOT provided", () => {
			o(
				formatTimeWithZoneInfo(sameDayEventTimes, EventTextTimeOption.START_END_TIME, {
					startTimeZone: "Europe/Stockholm",
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals("Stockholm 12:00 PM - 12:30 PM")
		})
		o.test("Time zone only included once if start and end time zones are the same", () => {
			o(
				formatTimeWithZoneInfo(sameDayEventTimes, EventTextTimeOption.START_END_TIME, {
					startTimeZone: "Europe/Stockholm",
					endTimeZone: "Europe/Stockholm",
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals("Stockholm 12:00 PM - 12:30 PM")
			o(
				formatTimeWithZoneInfo(sameDayEventTimes, EventTextTimeOption.START_END_TIME, {
					startTimeZone: undefined,
					endTimeZone: undefined,
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals("Berlin 12:00 PM - 12:30 PM")
		})
		o.test("Start and end time zone included separately if they differ", () => {
			o(
				formatTimeWithZoneInfo(sameDayEventTimes, EventTextTimeOption.START_END_TIME, {
					startTimeZone: "Europe/Stockholm",
					endTimeZone: "Europe/Berlin",
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals("Stockholm 12:00 PM - Berlin 12:30 PM")
			o(
				formatTimeWithZoneInfo(sameDayEventTimes, EventTextTimeOption.START_END_TIME, {
					startTimeZone: undefined,
					endTimeZone: "Europe/Stockholm",
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals("Berlin 12:00 PM - Stockholm 12:30 PM")
		})
		o.test("Test multiple time zones with EventTextTimeOption.START_TIME", () => {
			const calendarTimeZone = "Europe/Berlin"
			for (const [startTimeZone, expectedReturnValue] of [
				[undefined, "Berlin 12:00 PM"],
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
					formatTimeWithZoneInfo(sameDayEventTimes, EventTextTimeOption.START_TIME, {
						startTimeZone,
						calendarTimeZone,
					}),
				).equals(expectedReturnValue)
			}
		})
	})
	o.spec("formatEventTime", () => {
		o.test("Only displays start time when EventTextTimeOption.START_TIME is passed", () => {
			o(
				formatEventTime(sameDayEventTimes, EventTextTimeOption.START_TIME, false, {
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals("12:00 PM")
		})
		o.test("Only displays end time when EventTextTimeOption.END_TIME is passed", () => {
			o(
				formatEventTime(sameDayEventTimes, EventTextTimeOption.END_TIME, false, {
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals(" - 12:30 PM")
		})
		o.test("Displays both start and end time when EventTextTimeOption.START_END_TIME is passed", () => {
			o(
				formatEventTime(sameDayEventTimes, EventTextTimeOption.START_END_TIME, false, {
					calendarTimeZone: "Europe/Berlin",
				}),
			).equals("12:00 PM - 12:30 PM")
		})
	})
	o.test("buildGmtOffset", () => {
		const dateTime = DateTime.fromISO("2026-01-01T12:00:00")
		for (const [timeZone, expectedReturnValue] of [
			["Europe/London", "GMT+0"],
			["Europe/Berlin", "GMT+1"],
			["Europe/Kiev", "GMT+2"],
			["Africa/Nairobi", "GMT+3"],
			["Australia/Eucla", "GMT+8:45"],
			["Australia/Darwin", "GMT+9:30"],
			["Pacific/Auckland", "GMT+13"],
			["America/St_Johns", "GMT-3:30"],
			["America/New_York", "GMT-5"],
			["America/Los_Angeles", "GMT-8"],
			["America/Adak", "GMT-10"],
			["UTC", "GMT+0"],
			// Beware, 'Etc/GMT+<offset>' flip the sign of the GMT-offset because they were standardized
			// in an old POSIX standard; i.e. Etc/GMT+1 != UTC+1 && Etc/GMT+1 == UTC-1!
			["Etc/GMT+1", "GMT-1"],
		]) {
			o(buildGmtOffset(dateTime.setZone(timeZone))).equals(expectedReturnValue)
		}
	})
})
