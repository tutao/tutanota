import o from "@tutao/otest"
import { Time } from "../../../../src/applications/common/calendar/date/Time"

o.spec("Time Class", function () {
	o.spec("parseFromString", function () {
		o("parses correct times", function () {
			for (const [timeString, expectedHour, expectedMinute] of [
				// 24-hour clock times
				["12:45", 12, 45],
				["2359", 23, 59],
				["0000", 0, 0],
				["0623", 6, 23],
				["08:09", 8, 9],
				// partial 24-hour clock times
				["12", 12, 0],
				["1:2", 1, 2],
				["102", 1, 2],
				["17", 17, 0],
				["6", 6, 0],
				["955", 9, 55],
				["12:3", 12, 3],
				["809", 8, 9],
				// AM/PM times
				["7PM", 19, 0],
				["11PM", 23, 0],
				["12PM", 12, 0],
				["11:30PM", 23, 30],
				["12AM", 0, 0],
				["12:30AM", 0, 30],
				["3:30AM", 3, 30],
				["3:30PM", 15, 30],
				["9:37am", 9, 37],
				["1:59pm", 13, 59],
				["3:30 AM", 3, 30],
				["3:30 PM", 15, 30],
				["9:37 am", 9, 37],
				["1:59 pm", 13, 59],
				["9:37 a.m.", 9, 37],
				["1:59 p.m.", 13, 59],
				["1052 P.M.", 22, 52],
				["1052 A.M.", 10, 52],
				["948 P.M.", 21, 48],
				["948 A.M.", 9, 48],
			] as [string, number, number][]) {
				const parsedTime = Time.parseFromString(timeString)
				o(parsedTime?.hour).equals(expectedHour)
				o(parsedTime?.minute).equals(expectedMinute)
			}
		})
		o("does not parse incorrect times", function () {
			for (const incorrectTimeString of ["12:3m", "A:3", "", ":2", "25:03", "22:93", "24", "13pm", "263PM", "1403PM", "14:03:33PM", "9:37 acme"]) {
				o(Time.parseFromString(incorrectTimeString)).equals(null)
			}
		})
	})
	o.test("to24HourString", function () {
		o(new Time(15, 25).to24HourString()).equals("15:25")
		o(new Time(0, 0).to24HourString()).equals("00:00")
		o(new Time(10, 55).to24HourString()).equals("10:55")
		o(new Time(22, 55).to24HourString()).equals("22:55")
	})

	o.spec("to12HourString", function () {
		o.test("with AM/PM suffix", function () {
			o(new Time(15, 25).to12HourString(true)).equals("3:25 pm")
			o(new Time(0, 0).to12HourString(true)).equals("12:00 am")
			o(new Time(10, 55).to12HourString(true)).equals("10:55 am")
			o(new Time(22, 55).to12HourString(true)).equals("10:55 pm")
		})

		o.test("without AM/PM suffix", function () {
			o(new Time(15, 25).to12HourString(false)).equals("3:25")
			o(new Time(0, 0).to12HourString(false)).equals("12:00")
			o(new Time(10, 55).to12HourString(false)).equals("10:55")
			o(new Time(22, 55).to12HourString(false)).equals("10:55")
		})
	})
	o.spec("diff", function () {
		o("A minor than B, with 15 min diff", function () {
			const timeA = new Time(8, 35)
			const timeB = new Time(8, 50)
			o(timeA.diff(timeB)).equals(15)
		})
		o("A greater than B", function () {
			const timeA = new Time(8, 50)
			const timeB = new Time(8, 35)
			o(timeA.diff(timeB)).equals(1425)
		})
		o("A minor than B, with one hour diff", function () {
			const timeA = new Time(8, 0)
			const timeB = new Time(9, 0)
			o(timeA.diff(timeB)).equals(60)
		})
		o("diff with midnight", function () {
			const timeA = new Time(23, 0)
			const timeB = new Time(0, 0)
			o(timeA.diff(timeB)).equals(60)
		})
		o("diff between two days - over midnight", function () {
			const timeA = new Time(23, 0)
			const timeB = new Time(1, 0)
			o(timeA.diff(timeB)).equals(120)
		})
	})
	o.spec("add", function () {
		o("add 15 minutes", function () {
			const timeA = new Time(8, 35)
			const timeB = new Time(8, 50)
			o(timeA.add({ minutes: 15 }).toObject()).deepEquals(timeB.toObject())
		})
		o("add 1 hours", function () {
			const timeA = new Time(8, 35)
			const timeB = new Time(9, 35)
			o(timeA.add({ hours: 1 }).toObject()).deepEquals(timeB.toObject())
		})
		o("add 1 hour and 15 minutes", function () {
			const timeA = new Time(8, 35)
			const timeB = new Time(9, 50)
			o(timeA.add({ hours: 1, minutes: 15 }).toObject()).deepEquals(timeB.toObject())
		})
		o("add 600 minutes overflowing to 'next day'", function () {
			const timeA = new Time(14, 0)
			const timeB = new Time(0, 0)
			o(timeA.add({ minutes: 600 }).toObject()).deepEquals(timeB.toObject())
		})
		o("add 10 hours overflowing to 'next day'", function () {
			const timeA = new Time(14, 0)
			const timeB = new Time(0, 0)
			o(timeA.add({ hours: 10 }).toObject()).deepEquals(timeB.toObject())
		})
		o("add 70 minutes and 11 hours overflowing to 'next day'", function () {
			const timeA = new Time(14, 0)
			const timeB = new Time(2, 10)
			o(timeA.add({ hours: 11, minutes: 70 }).toObject()).deepEquals(timeB.toObject())
		})
	})
	o.spec("sub", function () {
		o("sub 15 minutes", function () {
			const timeA = new Time(8, 35)
			const timeB = new Time(8, 20)
			o(timeA.sub({ minutes: 15 }).toObject()).deepEquals(timeB.toObject())
		})
		o("sub 30 minutes from minute 0", function () {
			const timeA = new Time(8, 0)
			const timeB = new Time(7, 30)
			o(timeA.sub({ minutes: 30 }).toObject()).deepEquals(timeB.toObject())
		})
		o("sub 1 hours", function () {
			const timeA = new Time(8, 35)
			const timeB = new Time(7, 35)
			o(timeA.sub({ hours: 1 }).toObject()).deepEquals(timeB.toObject())
		})
		o("sub 1 hour and 15 minutes", function () {
			const timeA = new Time(8, 35)
			const timeB = new Time(7, 20)
			o(timeA.sub({ hours: 1, minutes: 15 }).toObject()).deepEquals(timeB.toObject())
		})
		o("sub 90 minutes", function () {
			const timeA = new Time(8, 30)
			const timeB = new Time(7, 0)
			o(timeA.sub({ hours: 0, minutes: 90 }).toObject()).deepEquals(timeB.toObject())
		})
		o("sub 600 minutes overflowing to 'previous day'", function () {
			const timeA = new Time(9, 0)
			const timeB = new Time(23, 0)
			o(timeA.sub({ minutes: 600 }).toObject()).deepEquals(timeB.toObject())
		})
		o("sub 10 hours overflowing to 'previous day'", function () {
			const timeA = new Time(9, 0)
			const timeB = new Time(23, 0)
			o(timeA.sub({ hours: 10 }).toObject()).deepEquals(timeB.toObject())
		})
		o("sub 70 minutes and 11 hours overflowing to 'previous day'", function () {
			const timeA = new Time(9, 0)
			const timeB = new Time(20, 50)
			o(timeA.sub({ hours: 11, minutes: 70 }).toObject()).deepEquals(timeB.toObject())
		})
	})
	o.spec("compareTimes", function () {
		o("isEqual", function () {
			o(new Time(0, 0).isEqual(new Time(0, 0))).equals(true)
			o(new Time(12, 34).isEqual(new Time(12, 34))).equals(true)
			o(new Time(23, 59).isEqual(new Time(23, 59))).equals(true)
		})
		o("A is before B (isBefore)", function () {
			const timeA = new Time(9, 0)
			const timeB = new Time(23, 0)
			o(timeA.isBefore(timeB)).equals(true)
		})
		o("A is after B (isBefore)", function () {
			const timeA = new Time(23, 0)
			const timeB = new Time(9, 0)
			o(timeA.isBefore(timeB)).equals(false)
		})
		o("A is before B (isAfter)", function () {
			const timeA = new Time(9, 0)
			const timeB = new Time(23, 0)
			o(timeA.isAfter(timeB)).equals(false)
		})
		o("A is after B (isAfter)", function () {
			const timeA = new Time(23, 0)
			const timeB = new Time(9, 0)
			o(timeA.isAfter(timeB)).equals(true)
		})
		o("A is equal B", function () {
			const timeA = new Time(9, 0)
			const timeB = new Time(9, 0)
			o(timeA.isAfter(timeB)).equals(false)
			o(timeA.isBefore(timeB)).equals(false)
		})
	})
	o.spec("fromMinutes", function () {
		o.test("negative minutes", function () {
			const time = Time.fromMinutes(-65)

			o.check(time.hour).equals(1)
			o.check(time.minute).equals(5)
		})

		o.test("positive minutes", function () {
			const time = Time.fromMinutes(65)

			o.check(time.hour).equals(1)
			o.check(time.minute).equals(5)
		})

		o.test("zero minutes", function () {
			const time = Time.fromMinutes(0)

			o.check(time.hour).equals(0)
			o.check(time.minute).equals(0)
		})
	})
})
