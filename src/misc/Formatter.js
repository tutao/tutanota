// @flow
import {lang} from "./LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {getByAbbreviation} from "../api/common/CountryList"
import {neverNull} from "../api/common/utils/Utils"
import type {Birthday} from "../api/entities/tutanota/Birthday"
import {createBirthday} from "../api/entities/tutanota/Birthday"
import {isMailAddress} from "./FormatValidator"
import type {UserSettingsGroupRoot} from "../api/entities/tutanota/UserSettingsGroupRoot"
import {TimeFormat} from "../api/common/TutanotaConstants"

assertMainOrNode()


export function formatMonthWithYear(date: Date): string {
	return lang.formats.monthWithYear.format(date)
}

export function formatMonthWithFullYear(date: Date): string {
	return lang.formats.monthWithFullYear.format(date)
}

export function formatDate(date: Date): string {
	return lang.formats.simpleDate.format(date)
}

export function formatDateWithMonth(date: Date): string {
	return lang.formats.dateWithMonth.format(date)
}

export function formatDateWithWeekday(date: Date): string {
	if (date.getFullYear() === new Date().getFullYear()) {
		return lang.formats.dateWithWeekday.format(date)
	} else {
		return lang.formats.dateWithWeekdayAndYear.format(date)
	}
}

export function formatDateTimeFromYesterdayOn(date: Date): string {
	let dateString = null
	let startOfToday = new Date().setHours(0, 0, 0, 0)
	let startOfYesterday = startOfToday - 1000 * 60 * 60 * 24
	if (date.getTime() >= startOfToday) {
		dateString = ""
	} else if (startOfToday > date.getTime() && date.getTime() >= startOfYesterday) {
		dateString = lang.get("yesterday_label")
	} else {
		dateString = formatDateWithWeekday(date)
	}
	return (dateString + " " + formatTime(date)).trim()
}

export function formatTime(date: Date): string {
	return lang.formats.time.format(date)
}

export function formatDateTime(date: Date): string {
	return lang.formats.dateTime.format(date)
}

export function formatDateTimeShort(date: Date): string {
	return lang.formats.dateTimeShort.format(date)
}

export function formatDateWithWeekdayAndTime(date: Date): string {
	return lang.formats.dateWithWeekdayAndTime.format(date)
}

export function formatDateWithTimeIfNotEven(date: Date): string {
	if (date.getHours() === 0 && date.getMinutes() === 0 // If it's beginning of the day
		|| date.getHours() === 23 && date.getMinutes() === 59 && date.getSeconds() === 59) { // or the end of the day
		return formatDate(date)
	} else {
		return formatDateTimeShort(date)
	}
}

export function formatWeekdayShort(date: Date): string {
	return lang.formats.weekdayShort.format(date)
}

export function formatWeekdayNarrow(date: Date): string {
	return lang.formats.weekdayNarrow.format(date)
}

export function dateWithWeekdayWoMonth(date: Date): string {
	return lang.formats.dateWithWeekdayWoMonth.format(date)
}


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

export function parseDate(dateString: string): Date {
	let languageTag = lang.languageTag.toLowerCase()

	let referenceParts = _cleanupAndSplit(formatDate(referenceDate))
	// for finding day month and year position of locale date format  in cleanAndSplit array
	const dayPos = referenceParts.findIndex(e => e === 23)
	const monthPos = referenceParts.findIndex(e => e === 6)
	const yearPos = referenceParts.findIndex(e => e === 2017)

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
		} else { // yearPos === 2
			day = parts[dayPos]
			month = parts[monthPos]
		}
		year = new Date().getFullYear()
	} else { // invalid parts length
		throw new Error(`could not parse dateString '${dateString}' for locale ${languageTag}`)

	}

	if (month < 1 || month > 12) {
		throw new Error(`Invalid value ${month} for month in ${dateString}`)
	}
	// maybe do better day clamping based on the month
	if (day < 1 || day > 31) {
		throw new Error(`Invalid value ${day} for day in ${dateString}`)
	}
	const date = new Date(year, month - 1, day)
	if (isNaN(date.getTime())) {
		throw new Error(`Couldn't parse date string ${dateString}`)
	}
	return date
}

/**
 * Parses a birthday string containing either day and month or day and month and year. The year may be 4 or 2 digits. If it is 2 digits and after the current year, 1900 + x is used, 2000 + x otherwise.
 * @return A birthday object containing the data form the given text or null if the text could not be parsed.
 */
export function parseBirthday(text: string): ?Birthday {
	try {
		const referenceDate = new Date(2017, 5, 23)
		let referenceParts = _cleanupAndSplit(formatDate(referenceDate))
		//for finding day month and year position of locale date format  in cleanAndSplit array
		let dayPos = referenceParts.findIndex(e => e === 23)
		let monthPos = referenceParts.findIndex(e => e === 6)
		let yearPos = referenceParts.findIndex(e => e === 2017)
		let birthdayValues = _cleanupAndSplit(text)
		let birthday = createBirthday()
		if (String(birthdayValues[dayPos]).length < 3 && String(birthdayValues[monthPos]).length < 3) {
			if (birthdayValues[dayPos] < 32) {
				birthday.day = String(birthdayValues[dayPos])
			} else {
				return null
			}
			if (birthdayValues[monthPos] < 13) {
				birthday.month = String(birthdayValues[monthPos])
			} else {
				return null
			}
		} else {
			return null
		}
		if (birthdayValues[yearPos]) {
			if (String(birthdayValues[yearPos]).length === 4) {
				birthday.year = String(birthdayValues[yearPos])
			} else if (String(birthdayValues[yearPos]).length === 2) {
				if (birthdayValues[yearPos] > Number(String(new Date().getFullYear()).substring(2))) {
					birthday.year = "19" + String(birthdayValues[yearPos])
				} else {
					birthday.year = "20" + String(birthdayValues[yearPos])
				}
			} else {
				return null
			}
		} else {
			birthday.year = null
		}
		return birthday
	} catch (e) {
		return null
	}
}

export function _cleanupAndSplit(dateString: string): number[] {
	let languageTag = lang.languageTag.toLowerCase()

	if (languageTag === 'bg-bg') {
		dateString = dateString.replace(" г.", "") // special bulgarian format, do not replace (special unicode char)
	}
	dateString = dateString.replace(/ /g, "")
	dateString = dateString.replace(/‎/g, "") // remove left-to-right character (included on Edge)
	return dateString.split(/[.\/-]/g).filter(part => part.trim().length > 0).map(part => parseInt(part))
}

/**
 * Parses the given string for a name and mail address. The following formats are recognized: [name][<]mailAddress[>]
 * Additionally, whitespaces at any positions outside name and mailAddress are ignored.
 * @param string The string to check.
 * @return an object with the attributes "name" and "mailAddress" or null if nothing was found.
 */
export function stringToNameAndMailAddress(string: string): ?{name: string, mailAddress: string} {
	string = string.trim()
	if (string === "") {
		return null
	}
	let startIndex = string.indexOf("<")
	if (startIndex !== -1) {
		const endIndex = string.indexOf(">", startIndex)
		if (endIndex === -1) {
			return null
		}
		const cleanedMailAddress = getCleanedMailAddress(string.substring(startIndex + 1, endIndex))

		if (cleanedMailAddress == null || !isMailAddress(cleanedMailAddress, false)) {
			return null
		}
		const name = string.substring(0, startIndex).trim()
		return {name: name, mailAddress: cleanedMailAddress}
	} else {
		startIndex = string.lastIndexOf(" ")
		startIndex++
		const cleanedMailAddress = getCleanedMailAddress(string.substring(startIndex))
		if (cleanedMailAddress == null || !isMailAddress(cleanedMailAddress, false)) {
			return null
		}
		const name = string.substring(0, startIndex).trim()
		return {name: name, mailAddress: cleanedMailAddress}
	}
}

/**
 * Returns a cleaned mail address from the input mail address. Removes leading or trailing whitespaces and converters
 * the address to lower case.
 * @param mailAddress The input mail address.
 * @return The cleaned mail address.
 */
export function getCleanedMailAddress(mailAddress: string): ?string {
	var cleanedMailAddress = mailAddress.toLowerCase().trim()
	if (isMailAddress(cleanedMailAddress, false)) {
		return cleanedMailAddress
	}
	return null
}


export function getDomainPart(mailAddress: string): ?string {
	const cleanedMailAddress = getCleanedMailAddress(mailAddress)
	if (cleanedMailAddress) {
		const parts = mailAddress.split("@");
		if (parts.length === 2) {
			return parts[1]
		} else {
			null
		}
	} else {
		return null;
	}
}

/**
 * Parses the given string for a fist name and a last name separated by whitespace. If there is only one part it is regarded as first name. If there are more than two parts, only the first one is regarded as first name.
 * @param fullName The full name to check.
 * @return Returns an object with the attributes "firstName" and "lastName".
 */
export function fullNameToFirstAndLastName(fullName: string): {firstName: string, lastName: string} {
	fullName = fullName.trim()
	if (fullName === "") {
		return {firstName: "", lastName: ""}
	}
	var separator = fullName.indexOf(" ")
	if (separator !== -1) {
		return {firstName: fullName.substring(0, separator), lastName: fullName.substring(separator + 1)}
	} else {
		return {firstName: fullName, lastName: ""}
	}
}

/**
 * Parses the given email address for a fist name and a last name separated by whitespace, comma, dot or underscore.
 * @param mailAddress The email address to check.
 * @return Returns an object with the attributes "firstName" and "lastName".
 */
export function mailAddressToFirstAndLastName(mailAddress: string): {firstName: string, lastName: string} {
	var addr = mailAddress.substring(0, mailAddress.indexOf("@"))
	var nameData = []
	if (addr.indexOf(".") !== -1) {
		nameData = addr.split(".")
	} else if (addr.indexOf("_") !== -1) {
		nameData = addr.split("_")
	} else if (addr.indexOf("-") !== -1) {
		nameData = addr.split("-")
	} else {
		nameData = [addr]
	}
	// first character upper case
	for (let i = 0; i < nameData.length; i++) {
		if (nameData[i].length > 0) {
			nameData[i] = nameData[i].substring(0, 1).toUpperCase() + nameData[i].substring(1)
		}
	}
	return {firstName: nameData[0], lastName: nameData.slice(1).join(" ")}
}

/**
 * Formats the given size in bytes to a better human readable string using B, KB, MB, GB, TB.
 */
export function formatStorageSize(sizeInBytes: number): string {
	var units = ["B", "KB", "MB", "GB", "TB"]
	var narrowNoBreakSpace = " " // this space is the special unicode narrow no-break character
	var unitIndex = 0
	while (sizeInBytes >= 1000) {
		sizeInBytes /= 1000 // we use 1000 instead of 1024
		unitIndex++
	}
	// round to 1 digit after comma
	sizeInBytes = Math.floor(sizeInBytes * 10) / 10
	return sizeInBytes + narrowNoBreakSpace + units[unitIndex]
}

export function urlEncodeHtmlTags(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
}

export function formatNameAndAddress(name: string, address: string, countryCode: ?string): string {
	let result = ""
	if (name) {
		result += name
	}
	if (address) {
		if (result) {
			result += "\n"
		}
		result += address
	}
	if (countryCode) {
		if (result) {
			result += "\n"
		}
		result += neverNull(getByAbbreviation(countryCode)).n
	}
	return result
}

export function getHourCycle(userSettings: UserSettingsGroupRoot): string {
	return userSettings.timeFormat === TimeFormat.TWELVE_HOURS ? "h12" : "h23"
}