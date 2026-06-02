import o from "@tutao/otest"
import { TimeConstants } from "../../../src/platform-kit/app-env"

o.spec("TimeUtils", () => {
	o.test("seconds", () => {
		o.check(TimeConstants.SECOND_IN_MILLIS).equals(1000)

		o.check(TimeConstants.secondsToMillis(10)).equals(10000)
		o.check(TimeConstants.secondsToMillis(30)).equals(30000)
		o.check(TimeConstants.secondsToMillis(60)).equals(60000)
		o.check(TimeConstants.secondsToMillis(72.5)).equals(72500)
	})
	o.test("minutes", () => {
		o.check(TimeConstants.MINUTE_IN_MILLIS).equals(60000)

		o.check(TimeConstants.minutesToMillis(10)).equals(600000)
		o.check(TimeConstants.minutesToMillis(30)).equals(1800000)
		o.check(TimeConstants.minutesToMillis(60)).equals(3600000)
		o.check(TimeConstants.minutesToMillis(72.5)).equals(4350000)
	})
	o.test("hours", () => {
		o.check(TimeConstants.HOUR_IN_MILLIS).equals(3600000)

		o.check(TimeConstants.hoursToMillis(10)).equals(36000000)
		o.check(TimeConstants.hoursToMillis(30)).equals(108000000)
		o.check(TimeConstants.hoursToMillis(60)).equals(216000000)
		o.check(TimeConstants.hoursToMillis(72.5)).equals(261000000)
	})
	o.test("days", () => {
		o.check(TimeConstants.DAY_IN_MILLIS).equals(86400000)

		o.check(TimeConstants.daysToMillis(10)).equals(864000000)
		o.check(TimeConstants.daysToMillis(30)).equals(2592000000)
		o.check(TimeConstants.daysToMillis(60)).equals(5184000000)
		o.check(TimeConstants.daysToMillis(72.5)).equals(6264000000)
	})
})
