// @flow

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
	let d = new Date(date.getTime())
	d.setHours(0, 0, 0, 0) // sets the beginning of the day in local time
	return d
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

export function getDayShifted(date: Date, days: number): Date {
	let d = new Date(date.getTime())
	d.setDate(date.getDate() + days);
	return d
}

/**
 * Result is positive or 0 if b > a, result is negative or 0 otherwise
 */
export function getDiffInDays(a: Date, b: Date): number {
	// discard the time and time-zone information
	const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
	const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())

	const MS_PER_DAY = 1000 * 60 * 60 * 24;
	return Math.floor((utc2 - utc1) / MS_PER_DAY)
}
