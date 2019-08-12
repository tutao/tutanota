//@flow

import o from "ospec/ospec.js"
import {parseDuration, parseProperty, parsePropertySequence, StringIterator} from "../../../src/calendar/CalendarParser"

o.spec("CalendarParser", function () {
	o.spec("parsePropertySequence", function () {
		o("simple value", function () {
			o(parsePropertySequence(new StringIterator("DTSTART:20190531T083000Z"))).deepEquals(["DTSTART", null, ":", "20190531T083000Z"])
		})
		o.only("simple value, property parameter", function () {
			o(parsePropertySequence(new StringIterator("DTSTART;VALUE=DATE:20190607")))
				.deepEquals([
					"DTSTART",
					[";", [["VALUE", "=", "DATE"]]],
					":",
					"20190607"
				])
		})
		o("simple value, multiple property parameters", function () {
			o(parsePropertySequence(new StringIterator("DTSTART;VALUE=DATE;ANOTHER=VALUE:20190607"))).deepEquals([
				"DTSTART",
				[";", [["VALUE", "=", "DATE"], ["ANOTHER", "=", "VALUE"]]],
				":",
				"20190607"
			])
		})

		o("key-value value", function () {
			o(parsePropertySequence(new StringIterator("RRULE:FREQ=WEEKLY;BYDAY=SA"))).deepEquals([
				"RRULE",
				null,
				":",
				[["FREQ", "=", "WEEKLY"], ["BYDAY", "=", "SA"]]
			])
		})
	})

	o.spec("parseProperty", function () {
		o("simple value", function () {
			o(parseProperty("DTSTART:20190531T083000Z")).deepEquals({name: "DTSTART", params: {}, value: "20190531T083000Z"})
		})
		o("simple value, property parameter", function () {
			o(parseProperty("DTSTART;VALUE=DATE:20190607"))
				.deepEquals({
					name: "DTSTART",
					params: {"VALUE": "DATE"},
					value: "20190607"
				})
		})
	})

	o("parseDuraion", function () {
		o(parseDuration("PT3H15M")).deepEquals({positive: true, day: undefined, hour: 3, minute: 15, week: undefined})
		o(parseDuration("-PT3H15M")).deepEquals({positive: false, day: undefined, hour: 3, minute: 15, week: undefined})
		o(parseDuration("P60DT15M05S")).deepEquals({positive: true, day: 60, hour: undefined, minute: 15, week: undefined})
		o(parseDuration("P8W")).deepEquals({positive: true, day: undefined, hour: undefined, minute: undefined, week: 8})

		o(() => parseDuration("P8W15M")).throws(Error)
	})
})
