// @flow

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
	return new Date().toDateString() == date.toDateString()
}

/**
 * Returns true if the given dates represent the same day (time of day is ignored).
 */
export function isSameDay(date1: Date, date2: Date): boolean {
	return date1.toDateString() == date2.toDateString()
}

export function getDayShifted(date: Date, days: number): Date {
	let d = new Date(date.getTime())
	d.setDate(date.getDate() + days);
	return d
}