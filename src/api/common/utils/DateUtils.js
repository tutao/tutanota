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

/**
 * Result is positive or 0 if b > a, result is negative or 0 otherwise
 */
export function getDiffInDays(a: Date, b: Date): number {
	// discard the time and time-zone information
	const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
	const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())

	return Math.floor((utc2 - utc1) / DAY_IN_MILLIS)
}


export type CalendarDay = {
	date: Date,
	year: number,
	month: number,
	day: number,
	paddingDay: boolean
}

export type CalendarMonth = {
	weekdays: Array<string>,
	weeks: Array<Array<CalendarDay>>
}


export function getCalendarMonth(date: Date): CalendarMonth {
	const weeks = [[]]
	const calculationDate = getStartOfDay(date)
	calculationDate.setDate(1)
	let currentYear = calculationDate.getFullYear()
	let month = calculationDate.getMonth()
	// add "padding" days
	// getDay returns the day of the week (from 0 to 6) for the specified date
	let firstDay = calculationDate.getDay()
	let dayCount

	incrementDate(calculationDate, -firstDay)
	for (dayCount = 0; dayCount < firstDay; dayCount++) {
		weeks[0].push({
			date: new Date(calculationDate),
			day: calculationDate.getDate(),
			month: calculationDate.getMonth(),
			year: calculationDate.getFullYear(),
			paddingDay: true
		})
		incrementDate(calculationDate, 1)
	}

	// add actual days
	while (calculationDate.getMonth() === month) {
		if (weeks[0].length && dayCount % 7 === 0) {
			// start new week
			weeks.push([])
		}
		const dayInfo = {
			date: new Date(currentYear, month, calculationDate.getDate()),
			year: currentYear,
			month: month,
			day: calculationDate.getDate(),
			paddingDay: false
		}
		weeks[weeks.length - 1].push(dayInfo)
		incrementDate(calculationDate, 1)
		dayCount++
	}
	// add remaining "padding" days
	while (dayCount < 42) {
		if (dayCount % 7 === 0) {
			weeks.push([])
		}
		weeks[weeks.length - 1].push({
			day: calculationDate.getDate(),
			year: calculationDate.getFullYear(),
			month: calculationDate.getMonth(),
			date: new Date(calculationDate),
			paddingDay: true
		})
		incrementDate(calculationDate, 1)
		dayCount++
	}
	const weekdays = []
	const weekdaysDate = new Date()
	incrementDate(weekdaysDate, -weekdaysDate.getDay())
	for (let i = 0; i < 7; i++) {
		weekdays.push(weekdaysDate.toLocaleDateString([], {weekday: "narrow"}))
		incrementDate(weekdaysDate, 1)
	}
	return {
		weekdays,
		weeks
	}
}


export function incrementDate(date: Date, byValue: number): Date {
	date.setDate(date.getDate() + byValue)
	return date
}
