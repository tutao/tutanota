import { ParsingError } from "../error/ParsingError"
import { Birthday } from "@tutao/entities/tutanota"
import { isValidDateYearMonthDay } from "../../../calendar/date/CalendarUtils"

/**
 * Converts the birthday object to iso Date format (yyyy-mm-dd) or iso Date without year (--mm-dd)
 */
export function birthdayToIsoDate(birthday: Birthday): string {
	const month = ("0" + birthday.month).slice(-2)
	const day = ("0" + birthday.day).slice(-2)
	const year = birthday.year ? ("0000" + birthday.year).slice(-4) : "-"
	return `${year}-${month}-${day}`
}

export function parseBirthdayIsoDate(birthdayIso: string): { year: number | null; month: number; day: number } {
	let year: number | null
	let month: number
	let day: number

	if (birthdayIso.startsWith("--")) {
		const monthAndDay = birthdayIso.substring(2).split("-")

		if (monthAndDay.length !== 2) {
			throw new ParsingError("invalid birthday without year: " + birthdayIso)
		}

		month = parseInt(monthAndDay[0])
		day = parseInt(monthAndDay[1])
		year = null
	} else {
		const yearMonthAndDay = birthdayIso.split("-")

		if (yearMonthAndDay.length !== 3) {
			throw new ParsingError("invalid birthday: " + birthdayIso)
		}

		year = parseInt(yearMonthAndDay[0])
		month = parseInt(yearMonthAndDay[1])
		day = parseInt(yearMonthAndDay[2])
	}

	if (isValidBirthdayYearMonthDay(year, month, day)) {
		throw new ParsingError("Invalid birthday format: " + birthdayIso)
	}

	return { year, month, day }
}

export function isValidBirthdayYearMonthDay(year: number | null, month: number, day: number) {
	// We use a leap year as a fallback year to allow Feb. 29 to be valid
	return (
		(year === null || !Number.isNaN(year)) && !Number.isNaN(month) && !Number.isNaN(day) && isValidDateYearMonthDay(year === null ? 2004 : year, month, day)
	)
}

export function isValidBirthday(birthday: Partial<Birthday>): birthday is Birthday {
	return (
		birthday.year !== undefined &&
		birthday.month !== undefined &&
		birthday.day !== undefined &&
		isValidBirthdayYearMonthDay(birthday.year === null ? null : parseInt(birthday.year), parseInt(birthday.month), parseInt(birthday.day))
	)
}
