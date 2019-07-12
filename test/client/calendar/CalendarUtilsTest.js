// @flow
import o from "ospec/ospec.js"
import type {CalendarMonth} from "../../../src/calendar/CalendarUtils"
import {getCalendarMonth, parseTime} from "../../../src/calendar/CalendarUtils"
import {lang} from "../../../src/misc/LanguageViewModel"

o.spec("calendar utils tests", function () {
	o.spec("getCalendarMonth", function () {
		o.before(function () {
			lang.init({})
			lang.setLanguage({code: "en", languageTag: "en"})
		})

		o("getCalendarMonth starting on sunday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 0, false))
			//console.log(result)
			o(result).deepEquals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n"
				+ "26,27,28,29,30,31,1\n"
				+ "2,3,4,5,6,7,8\n"
				+ "9,10,11,12,13,14,15\n"
				+ "16,17,18,19,20,21,22\n"
				+ "23,24,25,26,27,28,29\n"
				+ "30,1,2,3,4,5,6")
		})

		o("getCalendarMonth starting on monday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 1, false))
			//console.log(result)
			o(result).deepEquals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n"
				+ "27,28,29,30,31,1,2\n"
				+ "3,4,5,6,7,8,9\n"
				+ "10,11,12,13,14,15,16\n"
				+ "17,18,19,20,21,22,23\n"
				+ "24,25,26,27,28,29,30\n"
				+ "1,2,3,4,5,6,7")
		})

		o("getCalendarMonth starting on saturday - first day saturday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10), 6, false))
			//console.log(result)
			o(result).deepEquals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n"
				+ "1,2,3,4,5,6,7\n"
				+ "8,9,10,11,12,13,14\n"
				+ "15,16,17,18,19,20,21\n"
				+ "22,23,24,25,26,27,28\n"
				+ "29,30,1,2,3,4,5\n"
				+ "6,7,8,9,10,11,12")
		})

		o("getCalendarMonth starting on sunday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 0, false)) // september
			//console.log(result)
			o(result).deepEquals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n"
				+ "1,2,3,4,5,6,7\n"
				+ "8,9,10,11,12,13,14\n"
				+ "15,16,17,18,19,20,21\n"
				+ "22,23,24,25,26,27,28\n"
				+ "29,30,1,2,3,4,5\n"
				+ "6,7,8,9,10,11,12")
		})

		o("getCalendarMonth starting on monday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 1, false))
			//console.log(result)
			o(result).deepEquals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n"
				+ "26,27,28,29,30,31,1\n"
				+ "2,3,4,5,6,7,8\n"
				+ "9,10,11,12,13,14,15\n"
				+ "16,17,18,19,20,21,22\n"
				+ "23,24,25,26,27,28,29\n"
				+ "30,1,2,3,4,5,6")
		})

		o("getCalendarMonth starting on saturday - first day sunday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 8, 10), 6, false))
			//console.log(result)
			o(result).deepEquals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n"
				+ "31,1,2,3,4,5,6\n"
				+ "7,8,9,10,11,12,13\n"
				+ "14,15,16,17,18,19,20\n"
				+ "21,22,23,24,25,26,27\n"
				+ "28,29,30,1,2,3,4\n"
				+ "5,6,7,8,9,10,11")
		})


		o("getCalendarMonth starting on sunday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 0, false)) // july
			//console.log(result)
			o(result).deepEquals(
				"Sun,Mon,Tue,Wed,Thu,Fri,Sat\n"
				+ "30,1,2,3,4,5,6\n"
				+ "7,8,9,10,11,12,13\n"
				+ "14,15,16,17,18,19,20\n"
				+ "21,22,23,24,25,26,27\n"
				+ "28,29,30,31,1,2,3\n"
				+ "4,5,6,7,8,9,10")
		})

		o("getCalendarMonth starting on monday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 1, false))
			//console.log(result)
			o(result).deepEquals(
				"Mon,Tue,Wed,Thu,Fri,Sat,Sun\n"
				+ "1,2,3,4,5,6,7\n"
				+ "8,9,10,11,12,13,14\n"
				+ "15,16,17,18,19,20,21\n"
				+ "22,23,24,25,26,27,28\n"
				+ "29,30,31,1,2,3,4\n"
				+ "5,6,7,8,9,10,11")
		})

		o("getCalendarMonth starting on saturday - first day monday", function () {
			const result = toCalendarString(getCalendarMonth(new Date(2019, 6, 10), 6, false))
			//console.log(result)
			o(result).deepEquals(
				"Sat,Sun,Mon,Tue,Wed,Thu,Fri\n"
				+ "29,30,1,2,3,4,5\n"
				+ "6,7,8,9,10,11,12\n"
				+ "13,14,15,16,17,18,19\n"
				+ "20,21,22,23,24,25,26\n"
				+ "27,28,29,30,31,1,2\n"
				+ "3,4,5,6,7,8,9")
		})
	})

	o.spec("parseTimeTo", function () {
		o("parses full 24H time", function () {
			o(parseTime("12:45")).deepEquals({hours: 12, minutes: 45})
		})

		o("parses partial 24H time", function () {
			o(parseTime("12")).deepEquals({hours: 12, minutes: 0})
			o(parseTime("12:3")).deepEquals({hours: 12, minutes: 3})
		})

		o("not parses incorrect time", function () {
			o(parseTime("12:3m")).deepEquals(null)
			o(parseTime("A:3")).deepEquals(null)
			o(parseTime("")).deepEquals(null)
			o(parseTime(":2")).deepEquals(null)
			o(parseTime("25:03")).deepEquals(null)
			o(parseTime("22:93")).deepEquals(null)
		})

		o("parses AM/PM time", function () {
			o(parseTime("11PM")).deepEquals({hours: 23, minutes: 0})
			o(parseTime("11:30PM")).deepEquals({hours: 23, minutes: 30})
			o(parseTime("12AM")).deepEquals({hours: 0, minutes: 0})
			o(parseTime("12:30AM")).deepEquals({hours: 0, minutes: 30})
			o(parseTime("3:30AM")).deepEquals({hours: 3, minutes: 30})
			o(parseTime("3:30PM")).deepEquals({hours: 15, minutes: 30})
		})
	})
})


function toCalendarString(calenderMonth: CalendarMonth) {
	return calenderMonth.weekdays.join(",") + "\n"
		+ calenderMonth.weeks.map(w => w.map(d => d.day).join(",")).join("\n")
}
