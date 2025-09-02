export const SECOND_IN_MILLIS: number = 1000

/**
 * Convert the number of seconds to milliseconds.
 * @param seconds seconds to convert
 */
export function secondsToMillis(seconds: number): number {
	return seconds * SECOND_IN_MILLIS
}

export const MINUTE_IN_MILLIS: number = secondsToMillis(60)

/**
 * Convert the number of minutes to milliseconds.
 * @param minutes minutes to convert
 */
export function minutesToMillis(minutes: number): number {
	return minutes * MINUTE_IN_MILLIS
}

export const HOUR_IN_MILLIS: number = minutesToMillis(60)

/**
 * Convert the number of hours to milliseconds.
 * @param hours hours to convert
 */
export function hoursToMillis(hours: number): number {
	return hours * HOUR_IN_MILLIS
}

export const DAY_IN_MILLIS = hoursToMillis(24)

/**
 * Convert the number of days to milliseconds.
 * @param days days to convert
 */
export function daysToMillis(days: number): number {
	return days * DAY_IN_MILLIS
}
