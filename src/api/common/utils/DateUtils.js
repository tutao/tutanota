// @flow

/**
 * @file DateUtils which do not use Luxon. Used in worker as well as in client parts.
 * As functions here do not use Luxon it cannot be used for calculating things in different time zones, they
 * are dependent on the system time zone.
 */

export const DAY_IN_MILLIS = 1000 * 60 * 60 * 24

/**
 * Provides a date representing the beginning of the next day of the given date in local time.
 */
export function getStartOfNextDay(date: Date): Date {
	let d = new Date(date.getTime())
	d.setDate(date.getDate() + 1);
	d.setHours(0, 0, 0, 0) // sets the beginning of the day in local time
	return d
}

/**
 * Provides a date representing the end of the given date in local time.
 */
export function getEndOfDay(date: Date): Date {
	let d = new Date(date.getTime())
	d.setHours(23, 59, 59, 999)
	return d
}

/**
 * Provides a date representing the beginning of the given date in local time.
 */
export function getStartOfDay(date: Date): Date {
	return getHourOfDay(date, 0)
}

/**
 * Provides a date representing the day of the given date at the given hour in local time.
 */
export function getHourOfDay(date: Date, hour: number): Date {
	let d = new Date(date.getTime())
	d.setHours(hour, 0, 0, 0)
	return d
}

export function isStartOfDay(date: Date): boolean {
	return date.getHours() === 0 && date.getMinutes() === 0
}

/**
 * Returns true if the given date is today in local time.
 */
export function isToday(date: Date): boolean {
	return new Date().toDateString() === date.toDateString()
}

/**
 * Returns true if the given dates represent the same day (time of day is ignored).
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return date1.toDateString() === date2.toDateString()
}

/**
 * Creates new date in with {@param days} added to it as if the days are just fixed
 * periods of time and are not subject to daylight saving.
 */
export function getDayShifted(date: Date, days: number): Date {
	return new Date(date.getTime() + days * DAY_IN_MILLIS)
}

export function incrementDate(date: Date, byValue: number): Date {
	date.setDate(date.getDate() + byValue)
	return date
}


export function isSameDayOfDate(date1: ?Date, date2: ?Date): boolean {
	return !date1 && !date2
		|| date1 != null && date2 != null
		&& date1.getFullYear() === date2.getFullYear()
		&& date1.getMonth() === date2.getMonth()
		&& date1.getDate() === date2.getDate()
}


/**
 * Formats as yyyy-mm-dd
 */
export function formatSortableDate(date: Date): string {
	const month = ("0" + (date.getMonth() + 1)).slice(-2)
	const day = ("0" + date.getDate()).slice(-2)
	return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Formats as yyyy-mm-dd-<hh>h-<mm>m-<ss>
 */
export function formatSortableDateTime(date: Date): string {
	const hours = ("0" + date.getHours()).slice(-2)
	const minutes = ("0" + date.getMinutes()).slice(-2)
	const seconds = ("0" + date.getSeconds()).slice(-2)
	return `${formatSortableDate(date)}-${hours}h${minutes}m${seconds}s`
}

/**
 * @returns {string} sortableDateTime of the current time
 */
export function sortableTimestamp(): string {
	return formatSortableDateTime(new Date())
}