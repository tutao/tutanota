import { ParsingError } from "../error/ParsingError"
import { Birthday, createBirthday } from "@tutao/entities/tutanota"

/**
 * Converts the birthday object to iso Date format (yyyy-mm-dd) or iso Date without year (--mm-dd)
 */
export function birthdayToIsoDate(birthday: Birthday): string {
	const month = ("0" + birthday.month).slice(-2)
	const day = ("0" + birthday.day).slice(-2)
	const year = birthday.year ? ("0000" + birthday.year).slice(-4) : "-"
	return `${year}-${month}-${day}`
}

/**
 * Converts iso Date (yyyy-mm-dd) or Date without year (--mm-dd) into Birthday object.
 */
export function isoDateToBirthday(birthdayIso: string): Birthday {
	return createBirthday(parseBirthdayIsoDate(birthdayIso))
}

export function parseBirthdayIsoDate(birthdayIso: string): { year: string | null; month: string; day: string } {
	let year: string | null
	let month: string
	let day: string

	if (birthdayIso.startsWith("--")) {
		const monthAndDay = birthdayIso.substring(2).split("-")

		if (monthAndDay.length !== 2) {
			throw new ParsingError("invalid birthday without year: " + birthdayIso)
		}

		month = monthAndDay[0]
		day = monthAndDay[1]
		year = null
	} else {
		const yearMonthAndDay = birthdayIso.split("-")

		if (yearMonthAndDay.length !== 3) {
			throw new ParsingError("invalid birthday: " + birthdayIso)
		}

		year = yearMonthAndDay[0]
		month = yearMonthAndDay[1]
		day = yearMonthAndDay[2]
	}

	const parseResult = { year, month, day }

	if (!isValidBirthday(parseResult)) {
		throw new ParsingError("Invalid birthday format: " + birthdayIso)
	}

	return parseResult
}

export function isValidBirthday(birthday: Partial<Birthday>): birthday is Birthday {
	const day = Number(birthday.day)
	const month = Number(birthday.month)
	const year = birthday.year ? Number(birthday.year) : null
	return day > 0 && day < 32 && month > 0 && month < 13 && (year === null || (year > 0 && year < 10000))
}
