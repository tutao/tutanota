import o from "@tutao/otest"
import { getDateWithSameDayButTimeAtNearestNextHalfHour, getNextHalfHour } from "../../../../../src/applications/common/api/common/utils/CommonCalendarUtils"

o.spec("CommonCalendarUtils", function () {
	let testDate = new Date(0)

	const dateWithMinute0 = new Date(2000, 1, 1, 12, 0, 1, 1)
	const dateWithMinute1 = new Date(2000, 1, 1, 12, 1, 1, 1)
	const dateWithMinute29 = new Date(2000, 1, 1, 12, 29, 1, 1)
	const dateWithMinute30 = new Date(2000, 1, 1, 12, 30, 1, 1)
	const dateWithMinute31 = new Date(2000, 1, 1, 12, 31, 1, 1)
	const dateWithMinute59 = new Date(2000, 1, 1, 12, 59, 1, 1)

	const RealDateClass = globalThis.Date
	class MockDateClass {
		constructor(arg0: any) {
			// Preserve cloning behaviour in mock
			if (arg0 instanceof RealDateClass) {
				return new RealDateClass(arg0)
			}

			// Clone to prevent modification of return values effecting subsequent tests
			return new RealDateClass(testDate)
		}
	}

	o.spec("getNextHalfHour", function () {
		o.test("Minute value is moved forward to 30 for dates with minute values <= 30", function () {
			for (testDate of [dateWithMinute0, dateWithMinute1, dateWithMinute29, dateWithMinute30]) {
				globalThis.Date = MockDateClass as unknown as typeof Date
				const result = getNextHalfHour()
				globalThis.Date = RealDateClass

				o.check(result.getHours()).equals(12)
				o.check(result.getMinutes()).equals(30)
				o.check(result.getSeconds()).equals(0)
				o.check(result.getMilliseconds()).equals(0)
			}
		})
		o.test("Minute value is moved forward to next hour for dates with minute values > 30", function () {
			for (testDate of [dateWithMinute31, dateWithMinute59]) {
				globalThis.Date = MockDateClass as unknown as typeof Date
				const result = getNextHalfHour()
				globalThis.Date = RealDateClass

				o.check(result.getHours()).equals(13)
				o.check(result.getMinutes()).equals(0)
				o.check(result.getSeconds()).equals(0)
				o.check(result.getMilliseconds()).equals(0)
			}
		})
	})

	o.spec("getDateWithSameDayButTimeAtNearestNextHalfHour", function () {
		const year = 2026
		const month = 11
		const day = 10
		const inputDate = new Date(year, month - 1, day)

		o.test("The result's time is set to 12:30 if the current time is between 12:00 and 12:30 and year, month, day are preserved", function () {
			for (testDate of [dateWithMinute0, dateWithMinute1, dateWithMinute29, dateWithMinute30]) {
				globalThis.Date = MockDateClass as unknown as typeof Date
				const result = getDateWithSameDayButTimeAtNearestNextHalfHour(inputDate)
				globalThis.Date = RealDateClass

				o.check(result.getFullYear()).equals(year)
				o.check(result.getMonth() + 1).equals(month)
				o.check(result.getDate()).equals(day)
				o.check(result.getHours()).equals(12)
				o.check(result.getMinutes()).equals(30)
				o.check(result.getSeconds()).equals(0)
				o.check(result.getMilliseconds()).equals(0)
			}
		})
		o.test("The result's time is set to 13:00 if the current time is between 12:31 and 12:59 and year, month, day are preserved", function () {
			for (testDate of [dateWithMinute31, dateWithMinute59]) {
				globalThis.Date = MockDateClass as unknown as typeof Date
				const result = getDateWithSameDayButTimeAtNearestNextHalfHour(inputDate)
				globalThis.Date = RealDateClass

				o.check(result.getFullYear()).equals(year)
				o.check(result.getMonth() + 1).equals(month)
				o.check(result.getDate()).equals(day)
				o.check(result.getHours()).equals(13)
				o.check(result.getMinutes()).equals(0)
				o.check(result.getSeconds()).equals(0)
				o.check(result.getMilliseconds()).equals(0)
			}
		})
	})
})
