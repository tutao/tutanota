import { ParsingError } from "../error/ParsingError"

/**
 * Converts the birthday object to iso Date format (yyyy-mm-dd) or iso Date without year (--mm-dd)
 */
export function birthdayToIsoDate(birthday: { year: number | null; month: number; day: number }): string {
	let result = ""
	if (birthday.year) {
		result += birthday.year.toString().padStart(4, "0")
	} else {
		result += "-"
	}
	result += "-" + birthday.month.toString().padStart(2, "0")
	result += "-" + birthday.day.toString().padStart(2, "0")
	return result
}

/**
 * Converts iso Date (yyyy-mm-dd) or Date without year (--mm-dd) into Birthday object.
 */
export function isoDateToBirthday(birthdayIso: string): { year: number | null; month: number; day: number } {
	let year: number | null
	let month: number
	let day: number

	if (birthdayIso.startsWith("--")) {
		const monthAndDay = birthdayIso.substring(2).split("-")

		if (monthAndDay.length !== 2) {
			throw new ParsingError("invalid birthday without year: " + birthdayIso)
		}

		year = null
		month = parseInt(monthAndDay[0])
		day = parseInt(monthAndDay[1])
	} else {
		const yearMonthAndDay = birthdayIso.split("-")

		if (yearMonthAndDay.length !== 3) {
			throw new ParsingError("invalid birthday: " + birthdayIso)
		}

		year = parseInt(yearMonthAndDay[0])
		month = parseInt(yearMonthAndDay[1])
		day = parseInt(yearMonthAndDay[2])
	}

	const birthday = { year, month, day }

	if (!isValidBirthday(birthday)) {
		throw new ParsingError("Invalid birthday format: " + birthdayIso)
	}

	return birthday
}

export function isValidBirthday(birthday: { year: number | null; month: number; day: number }): boolean {
	if (birthday.year !== null && (!Number.isSafeInteger(birthday.year) || birthday.year <= 0 || birthday.year > 9999)) {
		return false
	}
	if (!Number.isSafeInteger(birthday.month) || birthday.month < 1 || birthday.month > 12) {
		return false
	}
	if (!Number.isSafeInteger(birthday.day) || birthday.day < 1 || birthday.day > 31) {
		return false
	}
	return true
}
