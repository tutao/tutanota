// @flow
import o from "ospec/ospec.js"
import type {CalendarMonth} from "../../../src/api/common/utils/DateUtils"
import {getCalendarMonth} from "../../../src/api/common/utils/DateUtils"

o.spec("calendar month tests", function () {

	o.only("getCalendarMonth", function () {
		const result = toCalendarString(getCalendarMonth(new Date(2019, 5, 10)))
		//console.log(result)
		o(result).deepEquals(
			"S,M,T,W,T,F,S\n"
			+ "26,27,28,29,30,31,1\n"
			+ "2,3,4,5,6,7,8\n"
			+ "9,10,11,12,13,14,15\n"
			+ "16,17,18,19,20,21,22\n"
			+ "23,24,25,26,27,28,29\n"
			+ "30,1,2,3,4,5,6")
	})
})


function toCalendarString(calenderMonth: CalendarMonth) {
	return calenderMonth.weekdays.join(",") + "\n"
		+ calenderMonth.weeks.map(w => w.map(d => d.day).join(",")).join("\n")
}
