import o from "@tutao/otest"
import {
	parseCalendarEvents,
	parseDuration,
	parseExDates,
	parseICalendar,
	parseProperty,
	parsePropertyKeyValue,
	parseRecurrenceId,
	parseTime,
	parseUntilRruleTime,
	propertySequenceParser,
	triggerToAlarmInterval,
} from "../../../src/calendar-app/calendar/export/CalendarParser.js"
import { ParserError, StringIterator } from "../../../src/common/misc/parsing/ParserCombinator.js"
import { DateTime } from "luxon"
import { DateWrapperTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { getDateInUTC, zone } from "./CalendarTestUtils.js"
import { createTestEntity } from "../TestUtils.js"
import { AlarmIntervalUnit } from "../../../src/common/calendar/date/CalendarUtils.js"

o.spec("CalendarParser", function () {
	o.spec("propertySequenceParser", function () {
		o("simple value", function () {
			o(propertySequenceParser(new StringIterator("DTSTART:20190531T083000Z"))).deepEquals(["DTSTART", null, ":", "20190531T083000Z"])
		})

		o("simple value, property parameter", function () {
			o(propertySequenceParser(new StringIterator("DTSTART;VALUE=DATE:20190607"))).deepEquals([
				"DTSTART",
				[";", [["VALUE", "=", "DATE"]]],
				":",
				"20190607",
			])
		})

		o("simple value, multiple property parameters", function () {
			o(propertySequenceParser(new StringIterator('DTSTART;VALUE=DATE;ANOTHER=VALUE;QUOTED="IN ; QUOTES":20190607'))).deepEquals([
				"DTSTART",
				[
					";",
					[
						["VALUE", "=", "DATE"],
						["ANOTHER", "=", "VALUE"],
						["QUOTED", "=", "IN ; QUOTES"],
					],
				],
				":",
				"20190607",
			])
		})

		o("key-value value", function () {
			o(propertySequenceParser(new StringIterator("RRULE:FREQ=WEEKLY;BYDAY=SA"))).deepEquals(["RRULE", null, ":", "FREQ=WEEKLY;BYDAY=SA"])
		})
	})

	o.spec("parseProperty", function () {
		o("simple value", function () {
			o(parseProperty("DTSTART:20190531T083000Z")).deepEquals({
				name: "DTSTART",
				params: {},
				value: "20190531T083000Z",
			})
		})
		o("simple value, property parameter", function () {
			o(parseProperty("DTSTART;VALUE=DATE:20190607")).deepEquals({
				name: "DTSTART",
				params: {
					VALUE: "DATE",
				},
				value: "20190607",
			})
		})
		o("value with colon", function () {
			o(parseProperty("DTSTART:https://stuff")).deepEquals({
				name: "DTSTART",
				params: {},
				value: "https://stuff",
			})
		})
		o("value with semicolon", function () {
			o(parseProperty("DTSTART:some\\;things")).deepEquals({
				name: "DTSTART",
				params: {},
				value: "some;things",
			})
		})
		o("accept malformed custom property", function () {
			o(parseProperty("CUSTOM_PROP:some value")).deepEquals({
				name: "CUSTOM_PROP",
				params: {},
				value: "some value",
			})
		})
	})
	o("parsePropertyKeyValue", function () {
		o(parsePropertyKeyValue("KEY=VALUE")).deepEquals({
			KEY: "VALUE",
		})
		o(parsePropertyKeyValue("KEY=VALUE;ANOTHERKEY=ANOTHERVALUE")).deepEquals({
			KEY: "VALUE",
			ANOTHERKEY: "ANOTHERVALUE",
		})
	})
	o("parseDuration", function () {
		o(parseDuration("P")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("P8W")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: undefined,
			week: 8,
		})
		o(parseDuration("-P11W6D")).deepEquals({
			positive: false,
			day: 6,
			hour: undefined,
			minute: undefined,
			week: 11,
		})
		o(parseDuration("P36WT21H")).deepEquals({
			positive: true,
			day: undefined,
			hour: 21,
			minute: undefined,
			week: 36,
		})
		o(parseDuration("P1WT1M")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: 1,
			week: 1,
		})
		o(parseDuration("-P11W6DT15H")).deepEquals({
			positive: false,
			day: 6,
			hour: 15,
			minute: undefined,
			week: 11,
		})
		o(parseDuration("P2W5DT30M")).deepEquals({
			positive: true,
			day: 5,
			hour: undefined,
			minute: 30,
			week: 2,
		})
		o(parseDuration("-P11WT15H15M")).deepEquals({
			positive: false,
			day: undefined,
			hour: 15,
			minute: 15,
			week: 11,
		})
		o(parseDuration("-P5W4DT3H18M")).deepEquals({
			positive: false,
			day: 4,
			hour: 3,
			minute: 18,
			week: 5,
		})
		o(parseDuration("P3D")).deepEquals({
			positive: true,
			day: 3,
			hour: undefined,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("P22DT60H")).deepEquals({
			positive: true,
			day: 22,
			hour: 60,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("P4DT20M")).deepEquals({
			positive: true,
			day: 4,
			hour: undefined,
			minute: 20,
			week: undefined,
		})
		o(parseDuration("P40DT60H120M")).deepEquals({
			positive: true,
			day: 40,
			hour: 60,
			minute: 120,
			week: undefined,
		})
		o(parseDuration("-PT4H")).deepEquals({
			positive: false,
			day: undefined,
			hour: 4,
			minute: undefined,
			week: undefined,
		})
		o(parseDuration("PT3H15M")).deepEquals({
			positive: true,
			day: undefined,
			hour: 3,
			minute: 15,
			week: undefined,
		})
		o(parseDuration("PT18M")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: 18,
			week: undefined,
		})
		o(parseDuration("P60DT15M05S")).deepEquals({
			positive: true,
			day: 60,
			hour: undefined,
			minute: 15,
			week: undefined,
		})
		o(() => parseDuration("P8W15M")).throws(Error)
	})
	o("triggerToAlarmInterval", function () {
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-PT5H30M")).deepEquals({
			unit: AlarmIntervalUnit.MINUTE,
			value: 5 * 60 + 30,
		})
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-PT5H30M20S")).deepEquals({
			unit: AlarmIntervalUnit.MINUTE,
			value: 5 * 60 + 30,
		})
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-PT5H0M")).deepEquals({
			unit: AlarmIntervalUnit.HOUR,
			value: 5,
		})
		o(triggerToAlarmInterval(getDateInUTC("2023-10-01T15:00"), "-P1DT5H0M")).deepEquals({
			unit: AlarmIntervalUnit.HOUR,
			value: 29,
		})
	})
	o("parseTime", function () {
		o(parseTime("20180115T214000Z", "Europe/Berlin")).deepEquals({
			date: new Date(Date.UTC(2018, 0, 15, 21, 40, 0)),
			allDay: false,
		})
		o(parseTime("20180115T", "Europe/Berlin")).deepEquals({
			date: new Date(Date.UTC(2018, 0, 15, 0, 0, 0)),
			allDay: true,
		})
		o(() => parseTime("20180015T214000Z", "Europe/Berlin")).throws(ParserError)
	})
	o.spec("parseCalendarEvents: fix illegal end times", function () {
		const makeEvent = ({ start, end }) =>
			parseICalendar(
				"BEGIN:VCALENDAR\n" +
					"VERSION:2.0\n" +
					"BEGIN:VEVENT\n" +
					"UID:0c838926-f826-43c9-9f17-4836c565eece\n" +
					"DTSTAMP:20220106T214416Z\n" +
					"SUMMARY;LANGUAGE=de:Gelber Sack\n" +
					`DTSTART:${start}\n` +
					`DTEND:${end}\n` +
					"DESCRIPTION:Gelber Sack\n" +
					"LOCATION:test\n" +
					"END:VEVENT\n" +
					"END:VCALENDAR",
			)

		const testParseIllegalCalendarEvents = ({ start, end, expect }) => {
			const event = makeEvent({ start, end })
			const { event: parsedEvent } = parseCalendarEvents(event, "Europe/Berlin").contents[0]
			o(parsedEvent.endTime.getTime()).equals(expect)
		}

		o("allday equal", function () {
			testParseIllegalCalendarEvents({ start: "20220315T", end: "20220315T", expect: parseTime("20220316T", "Europe/Berlin").date.getTime() })
		})
		o("allday flipped", function () {
			testParseIllegalCalendarEvents({ start: "20220315T", end: "20220314T", expect: parseTime("20220316T", "Europe/Berlin").date.getTime() })
		})
		o("allday with an endTime that has hours/minutes/seconds", function () {
			testParseIllegalCalendarEvents({ start: "20220315T", end: "20220314T225915Z", expect: parseTime("20220316T", "Europe/Berlin").date.getTime() })
		})

		o("endTime equal", function () {
			testParseIllegalCalendarEvents({ start: "20220315T225900Z", end: "20220315T225900Z", expect: new Date("2022-03-15T22:59:01.000Z").getTime() })
		})
		o("endTime flipped", function () {
			testParseIllegalCalendarEvents({ start: "20220315T225900Z", end: "20220315T225800Z", expect: new Date("2022-03-15T22:59:01.000Z").getTime() })
		})
	})

	o.spec("parseUntilRruleTime", function () {
		o("when given full UTC date it gives the beginning of the next day", function () {
			// will take start of the next date because that's how we do it internally: end range is "exclusive" while it's questionable how it for ical but
			// mostly "inclusive"
			const zone = "Asia/Krasnoyarsk"
			o(parseUntilRruleTime("20190919T235959Z", zone)).deepEquals(DateTime.fromObject({ year: 2019, month: 9, day: 20 }, { zone: zone }).toJSDate())
		})
	})

	o.spec("parseExcludedDates", function () {
		o("are excluded dates deduplicated", function () {
			const parsedDates = parseExDates([{ name: "EXDATES", params: {}, value: "20230308T230000Z,20230308T230000Z,20230309T230000Z" }])
			o(parsedDates).deepEquals([
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-08T23:00:00Z") }),
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-09T23:00:00Z") }),
			])
		})
		o("are excluded dates sorted", function () {
			const parsedDates = parseExDates([{ name: "EXDATES", params: {}, value: "20230313T230000Z,20230309T230000Z" }])
			o(parsedDates).deepEquals([
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-09T23:00:00Z") }),
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-13T23:00:00Z") }),
			])
		})
		o("multiple exdates in separate lines are parsed", function () {
			const parsedDates = parseExDates([
				{ name: "EXDATES", params: {}, value: "20230309T230000Z" },
				{
					name: "EXDATES",
					params: {},
					value: "20230203T230000Z",
				},
			])
			o(parsedDates).deepEquals([
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-02-03T23:00:00Z") }),
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-09T23:00:00Z") }),
			])
		})
		o("deduplication over multiple lines works", function () {
			const parsedDates = parseExDates([
				{ name: "EXDATES", params: {}, value: "20230309T230000Z,20230302T230000Z" },
				{
					name: "EXDATES",
					params: {},
					value: "20230309T230000Z,20230114T230000Z",
				},
			])
			o(parsedDates).deepEquals([
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-01-14T23:00:00Z") }),
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-02T23:00:00Z") }),
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-09T23:00:00Z") }),
			])
		})
		o("is timezone parsed", function () {
			const parsedDates = parseExDates([{ name: "EXDATES", params: { TZID: "Europe/Berlin" }, value: "20230309T230000,20230302T230000" }])
			o(parsedDates).deepEquals([
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-02T22:00:00Z") }),
				createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-09T22:00:00Z") }),
			])
		})
		o(" deduplication over different timezones", function () {
			const parsedDates = parseExDates([
				{ name: "EXDATES", params: { TZID: "Europe/Berlin" }, value: "20230309T230000" },
				{ name: "EXDATES", params: { TZID: "Europe/Sofia" }, value: "20230310T000000" },
			])
			o(parsedDates).deepEquals([createTestEntity(DateWrapperTypeRef, { date: new Date("2023-03-09T22:00:00Z") })])
		})
	})

	o.spec("parseRecurrenceId", function () {
		o("it uses UTC for absolute time", function () {
			const parsedId = parseRecurrenceId({ name: "RECURRENCE-ID", params: { VALUE: "DATETIME" }, value: "20230809T060000Z" }, zone)
			o(parsedId).deepEquals(getDateInUTC("2023-08-09T06:00"))
		})

		o("it uses TZID from param for relative time", function () {
			const parsedId = parseRecurrenceId({ name: "RECURRENCE-ID", params: { VALUE: "DATETIME", TZID: "Europe/Sofia" }, value: "20230310T000000" }, zone)
			o(parsedId).deepEquals(getDateInUTC("2023-03-09T22:00:00Z"))
		})

		o("it uses TZID from param when none are in the value", function () {
			const parsedId = parseRecurrenceId({ name: "RECURRENCE-ID", params: { VALUE: "DATETIME" }, value: "20230310T000000" }, "Europe/Sofia")
			o(parsedId).deepEquals(getDateInUTC("2023-03-09T22:00:00Z"))
		})
	})
})
