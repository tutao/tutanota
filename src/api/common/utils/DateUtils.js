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


export function getDateIndicator(day: Date, selectedDate: ?Date, currentDate: Date): string {
	if (isSameDayOfDate(day, selectedDate)) {
		return ".date-selected"
	} else if (isSameDayOfDate(day, currentDate)) {
		return ".date-current"
	} else {
		return ""
	}
}

export function isSameDayOfDate(date1: ?Date, date2: ?Date): boolean {
	return !date1 && !date2
		|| date1 != null && date2 != null
		&& date1.getFullYear() === date2.getFullYear()
		&& date1.getMonth() === date2.getMonth()
		&& date1.getDate() === date2.getDate()
}
