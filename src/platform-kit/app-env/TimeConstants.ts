import { TsInt } from "@tutao/lang-api"

export class TimeConstants {
	static readonly SECOND_IN_MILLIS: TsInt = 1000
	static readonly MINUTE_IN_MILLIS: TsInt = TimeConstants.secondsToMillis(60)
	static readonly HOUR_IN_MILLIS: TsInt = TimeConstants.minutesToMillis(60)
	static readonly DAY_IN_MILLIS: TsInt = TimeConstants.hoursToMillis(24)
	static readonly DAY_IN_MINUTES: TsInt = 24 * 60

	constructor() {}

	/**
	 * Convert the number of seconds to milliseconds.
	 * @param seconds seconds to convert
	 */
	static secondsToMillis(seconds: TsInt): TsInt {
		return seconds * TimeConstants.SECOND_IN_MILLIS
	}

	/*
	 * Convert the number of minutes to milliseconds.
	 * @param minutes: minutes to convert
	 */
	static minutesToMillis(minutes: TsInt): TsInt {
		return minutes * TimeConstants.MINUTE_IN_MILLIS
	}

	/**
	 * Convert the number of hours to milliseconds.
	 * @param hours hours to convert
	 */
	static hoursToMillis(hours: TsInt): TsInt {
		return hours * TimeConstants.HOUR_IN_MILLIS
	}

	/**
	 * Convert the number of days to milliseconds.
	 * @param days days to convert
	 */
	static daysToMillis(days: TsInt): TsInt {
		return days * TimeConstants.DAY_IN_MILLIS
	}
}
