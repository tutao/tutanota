import { DateTime } from "luxon"
import type { Birthday } from "../api/entities/tutanota/TypeRefs.js"
import { createBirthday } from "../api/entities/tutanota/TypeRefs.js"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"

/**
 * parses the following formats:
 *
 * zh-hant    2017/6/23
 * hu         2017. 06. 23.
 * lt-lt      2017-06-23
 *
 * en        6/23/2017
 * fil-ph    6/23/2017
 * no        6/23/2017

 * sq        23.6.2017
 * hr        23. 06. 2017.
 * nl        23-6-2017
 * de        23.6.2017
 * el        23/6/2017
 * fr        23/06/2017
 * it        23/6/2017
 * pl        23.06.2017
 * pt-pt     23/06/2017
 * pt-br     23/06/2017
 * ro        23.06.2017
 * ru        23.06.2017
 * es        23/6/2017
 * tr        23.06.2017
 * fi        23.6.2017
 * mk        23.6.2017
 * sr        23.6.2017.
 * cs-cz     23. 6. 2017
 * da-dk     23/6/2017
 * et-ee     23.6.2017
 * id        23/6/2017
 * bg-bg     23.06.2017 г.

 * @param dateString
 * @returns The timestamp from the given date string
 */
const referenceDate = new Date(2017, 5, 23)

export function parseDate(dateString: string, referenceDateRenderer: (refdate: Date) => string): Date {
	const referenceParts = _cleanupAndSplit(referenceDateRenderer(referenceDate))

	// for finding day month and year position of locale date format  in cleanAndSplit array
	const dayPos = referenceParts.findIndex((e) => e === 23)
	const monthPos = referenceParts.findIndex((e) => e === 6)
	const yearPos = referenceParts.findIndex((e) => e === 2017)

	const parts = _cleanupAndSplit(dateString)

	let day, month, year

	if (parts.length === 3) {
		// default dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy
		day = parts[dayPos]
		month = parts[monthPos]
		year = parts[yearPos]
	} else if (parts.length === 2) {
		// if only two numbers are provided then we interpret that as a day and a month
		// year pos *should* only ever be 0 or 2 (at the front or the back)
		if (yearPos === 0) {
			day = parts[dayPos - 1]
			month = parts[monthPos - 1]
		} else {
			// yearPos === 2
			day = parts[dayPos]
			month = parts[monthPos]
		}

		year = new Date().getFullYear()
	} else {
		// invalid parts length
		throw new ProgrammingError(`could not parse dateString '${dateString}' with reference date ${referenceParts}`)
	}

	// if 1 or 2 digit year, then make it be in the 2000
	if (year < 1000) {
		year += 2000
	}

	if (month < 1 || month > 12) {
		throw new Error(`Invalid value ${month} for month in ${dateString}`)
	}

	// maybe do better day clamping based on the month
	if (day < 1 || day > _getNumDaysInMonth(month, year)) {
		throw new Error(`Invalid value ${day} for day in ${dateString}`)
	}

	const date = new Date(year, month - 1, day)

	if (isNaN(date.getTime())) {
		throw new Error(`Couldn't parse date string ${dateString}`)
	}

	return date
}

/**
 * Get the number of days in a month in a given year
 * @param month as a number between 1 and 12
 * @param year
 * @return the number of days in the month
 * @private
 */
export function _getNumDaysInMonth(month: number, year: number): number {
	const { daysInMonth } = DateTime.fromObject({
		month,
		year,
	})

	if (!daysInMonth) {
		throw new ProgrammingError(`could not get daysInMonth for month-year ${month}-${year}`)
	}

	return daysInMonth
}

/**
 * Parses a birthday string containing either day and month or day and month and year. The year may be 4 or 2 digits. If it is 2 digits and after the current year, 1900 + x is used, 2000 + x otherwise.
 * @return A birthday object containing the data form the given text or null if the text could not be parsed.
 */
export function parseBirthday(text: string, referenceDateRenderer: (refdate: Date) => string): Birthday | null {
	try {
		const referenceParts = _cleanupAndSplit(referenceDateRenderer(referenceDate))

		//for finding day month and year position of locale date format  in cleanAndSplit array
		let dayPos = referenceParts.findIndex((e) => e === 23)
		let monthPos = referenceParts.findIndex((e) => e === 6)
		let yearPos = referenceParts.findIndex((e) => e === 2017)

		let birthdayValues = _cleanupAndSplit(text)

		let day, month, year

		if (String(birthdayValues[dayPos]).length < 3 && String(birthdayValues[monthPos]).length < 3) {
			if (birthdayValues[dayPos] < 32) {
				day = String(birthdayValues[dayPos])
			} else {
				return null
			}

			if (birthdayValues[monthPos] < 13) {
				month = String(birthdayValues[monthPos])
			} else {
				return null
			}
		} else {
			return null
		}

		if (birthdayValues[yearPos]) {
			if (String(birthdayValues[yearPos]).length === 4) {
				year = String(birthdayValues[yearPos])
			} else if (String(birthdayValues[yearPos]).length === 2) {
				if (birthdayValues[yearPos] > Number(String(new Date().getFullYear()).substring(2))) {
					year = "19" + String(birthdayValues[yearPos])
				} else {
					year = "20" + String(birthdayValues[yearPos])
				}
			} else {
				return null
			}
		} else {
			year = null
		}
		return createBirthday({ day, month, year })
	} catch (e) {
		return null
	}
}

export function _cleanupAndSplit(dateString: string): number[] {
	// Clean up any characters that can't be dealt with
	dateString = dateString.replace(/[^ 0-9.\/-]/g, "")
	return dateString
		.split(/[.\/-]/g)
		.slice(0, 3) // keep at most three date parts even if the string contains more than two separators (e.g., extra '.' at the end)
		.map((part) => parseInt(part))
}
