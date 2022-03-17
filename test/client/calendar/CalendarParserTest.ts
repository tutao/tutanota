import o from "ospec"
import {
	parseCalendarEvents,
	parseDuration,
	parseICalendar,
	parseProperty,
	parsePropertyKeyValue,
	parseTime,
	propertySequenceParser,
} from "../../../src/calendar/export/CalendarParser"
import {ParserError, StringIterator} from "../../../src/misc/parsing/ParserCombinator"

o.spec("CalendarParser", function () {
	o.spec("propertySequenceParser", function () {
		o("simple value", function () {
			o(propertySequenceParser(new StringIterator("DTSTART:20190531T083000Z"))).deepEquals([
				"DTSTART",
				null,
				":",
				"20190531T083000Z",
			])
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
			o(
				propertySequenceParser(
					new StringIterator('DTSTART;VALUE=DATE;ANOTHER=VALUE;QUOTED="IN ; QUOTES":20190607'),
				),
			).deepEquals([
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
			o(propertySequenceParser(new StringIterator("RRULE:FREQ=WEEKLY;BYDAY=SA"))).deepEquals([
				"RRULE",
				null,
				":",
				"FREQ=WEEKLY;BYDAY=SA",
			])
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
		o(parseDuration("PT3H15M")).deepEquals({
			positive: true,
			day: undefined,
			hour: 3,
			minute: 15,
			week: undefined,
		})
		o(parseDuration("-PT3H15M")).deepEquals({
			positive: false,
			day: undefined,
			hour: 3,
			minute: 15,
			week: undefined,
		})
		o(parseDuration("P60DT15M05S")).deepEquals({
			positive: true,
			day: 60,
			hour: undefined,
			minute: 15,
			week: undefined,
		})
		o(parseDuration("P8W")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: undefined,
			week: 8,
		})
		o(parseDuration("P")).deepEquals({
			positive: true,
			day: undefined,
			hour: undefined,
			minute: undefined,
			week: undefined,
		})
		o(() => parseDuration("P8W15M")).throws(Error)
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

	const mkEventWithStartEnd = (start, end) => parseICalendar("BEGIN:VCALENDAR\n" +
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
		"END:VCALENDAR")

	o("parseCalendarEvents fixes all-day-events with illegal endTime to a duration of 1 day", function () {
		const alldayEqual = mkEventWithStartEnd("20220315T", "20220315T")
		const {event: eventEqual} = parseCalendarEvents(alldayEqual, "Europe/Berlin").contents[0]
		o(eventEqual.endTime.getTime()).equals(parseTime("20220316T", "Europe/Berlin").date.getTime())("alldayEqual")

		const alldayFlipped = mkEventWithStartEnd("20220315T", "20220314T")
		const {event: flippedEvent} = parseCalendarEvents(alldayFlipped, "Europe/Berlin").contents[0]
		o(flippedEvent.endTime.getTime()).equals(parseTime("20220316T", "Europe/Berlin").date.getTime())("alldayFlipped")

		// allday with an endTime that has hours/minutes/seconds?
		const wack = mkEventWithStartEnd("20220315T", "20220314T225915Z")
		const {event: wackEvent} = parseCalendarEvents(wack, "Europe/Berlin").contents[0]
		o(wackEvent.endTime.getTime()).equals(parseTime("20220316T", "Europe/Berlin").date.getTime())("wack")
	})

	o("parseCalendarEvents fixes non-all-day-events with illegal endTime to a duration of 1 second", function () {
		const icalEqual = mkEventWithStartEnd("20220315T225900Z", "20220315T225900Z")
		const {event: eventEqual} = parseCalendarEvents(icalEqual, "Europe/Berlin").contents[0]
		o(eventEqual.endTime.getTime()).equals(new Date("2022-03-15T22:59:01.000Z").getTime())("equal non-allday")

		const icalFlipped = mkEventWithStartEnd("20220315T225900Z", "20220315T225800Z")
		const {event: eventFlipped} = parseCalendarEvents(icalFlipped, "Europe/Berlin").contents[0]
		o(eventFlipped.endTime.getTime()).equals(new Date("2022-03-15T22:59:01.000Z").getTime())("flipped non-allday")
	})
})