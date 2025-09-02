import o from "@tutao/otest"
import {
	DAY_IN_MILLIS,
	daysToMillis,
	HOUR_IN_MILLIS,
	hoursToMillis,
	MINUTE_IN_MILLIS,
	minutesToMillis,
	SECOND_IN_MILLIS,
	secondsToMillis,
} from "../lib/TimeUtils.js"

o.spec("TimeUtils", () => {
	o.test("seconds", () => {
		o.check(SECOND_IN_MILLIS).equals(1000)

		o.check(secondsToMillis(10)).equals(10000)
		o.check(secondsToMillis(30)).equals(30000)
		o.check(secondsToMillis(60)).equals(60000)
		o.check(secondsToMillis(72.5)).equals(72500)
	})
	o.test("minutes", () => {
		o.check(MINUTE_IN_MILLIS).equals(60000)

		o.check(minutesToMillis(10)).equals(600000)
		o.check(minutesToMillis(30)).equals(1800000)
		o.check(minutesToMillis(60)).equals(3600000)
		o.check(minutesToMillis(72.5)).equals(4350000)
	})
	o.test("hours", () => {
		o.check(HOUR_IN_MILLIS).equals(3600000)

		o.check(hoursToMillis(10)).equals(36000000)
		o.check(hoursToMillis(30)).equals(108000000)
		o.check(hoursToMillis(60)).equals(216000000)
		o.check(hoursToMillis(72.5)).equals(261000000)
	})
	o.test("days", () => {
		o.check(DAY_IN_MILLIS).equals(86400000)

		o.check(daysToMillis(10)).equals(864000000)
		o.check(daysToMillis(30)).equals(2592000000)
		o.check(daysToMillis(60)).equals(5184000000)
		o.check(daysToMillis(72.5)).equals(6264000000)
	})
})
