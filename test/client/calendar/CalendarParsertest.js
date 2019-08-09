//@flow

import o from "ospec/ospec.js"
import {parseProperty, parsePropertySequence, StringIterator} from "../../../src/calendar/CalendarParser"

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
})
