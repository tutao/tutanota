import type { Birthday } from "../../entities/tutanota/TypeRefs.js"
import { createBirthday } from "../../entities/tutanota/TypeRefs.js"
import { formatSortableDate } from "@tutao/tutanota-utils"
import { ParsingError } from "../error/ParsingError"

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
	//return new Date(Number(newBirthday.year), Number(newBirthday.month) - 1, Number(newBirthday.day))
	const birthdayInitializer: Partial<Birthday> = {}
	if (birthdayIso.startsWith("--")) {
		const monthAndDay = birthdayIso.substring(2).split("-")

		if (monthAndDay.length !== 2) {
			throw new ParsingError("invalid birthday without year: " + birthdayIso)
		}

		birthdayInitializer.month = monthAndDay[0]
		birthdayInitializer.day = monthAndDay[1]
		birthdayInitializer.year = null
	} else {
		const yearMonthAndDay = birthdayIso.split("-")

		if (yearMonthAndDay.length !== 3) {
			throw new ParsingError("invalid birthday: " + birthdayIso)
		}

		birthdayInitializer.year = yearMonthAndDay[0]
		birthdayInitializer.month = yearMonthAndDay[1]
		birthdayInitializer.day = yearMonthAndDay[2]
	}

	if (!isValidBirthday(birthdayInitializer)) {
		throw new ParsingError("Invalid birthday format: " + birthdayIso)
	}

	return createBirthday(birthdayInitializer)
}

export function isValidBirthday(birthday: Partial<Birthday>): birthday is Birthday {
	const day = Number(birthday.day)
	const month = Number(birthday.month)
	const year = birthday.year ? Number(birthday.year) : null
	return day > 0 && day < 32 && month > 0 && month < 13 && (year === null || (year > 0 && year < 10000))
}

/**
 * returns new birthday format from old birthday format
 * Export for testing
 */
export function oldBirthdayToBirthday(oldBirthday: Date): Birthday {
	let birthdayString = formatSortableDate(oldBirthday).split("-")
	return createBirthday({
		day: String(Number(birthdayString[2])),
		month: String(Number(birthdayString[1])),
		year: String(Number(birthdayString[0])),
	})
}
