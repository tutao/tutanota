export class TimeConstants {
	static readonly SECOND_IN_MILLIS: number = 1000
	static readonly MINUTE_IN_MILLIS: number = TimeConstants.secondsToMillis(60)
	static readonly HOUR_IN_MILLIS: number = TimeConstants.minutesToMillis(60)
	static readonly DAY_IN_MILLIS = TimeConstants.hoursToMillis(24)
	static readonly DAY_IN_MINUTES = 24 * 60

	/**
	 * Convert the number of seconds to milliseconds.
	 * @param seconds seconds to convert
	 */
	static secondsToMillis(seconds: number): number {
		return seconds * TimeConstants.SECOND_IN_MILLIS
	}

	/*
	 * Convert the number of minutes to milliseconds.
	 * @param minutes: minutes to convert
	 */
	static minutesToMillis(minutes: number): number {
		return minutes * TimeConstants.MINUTE_IN_MILLIS
	}

	/**
	 * Convert the number of hours to milliseconds.
	 * @param hours hours to convert
	 */
	static hoursToMillis(hours: number): number {
		return hours * TimeConstants.HOUR_IN_MILLIS
	}

	/**
	 * Convert the number of days to milliseconds.
	 * @param days days to convert
	 */
	static daysToMillis(days: number): number {
		return days * TimeConstants.DAY_IN_MILLIS
	}
}
