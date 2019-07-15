// @flow
import {lang} from "./LanguageViewModel"
import {pad} from "../api/common/utils/StringUtils"
import {assertMainOrNode} from "../api/Env"
import {getByAbbreviation} from "../api/common/CountryList"
import {neverNull} from "../api/common/utils/Utils"
import {createBirthday} from "../api/entities/tutanota/Birthday"
import {isMailAddress} from "./FormatValidator"

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
	return (dateString + " " + pad(date.getHours(), 2) + ":" + pad(date.getMinutes(), 2)).trim()
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

/**
 * Formats as yyyy-mm-dd
 */
export function formatSortableDate(date: Date): string {
	const month = ("0" + (date.getMonth() + 1)).slice(-2)
	const day = ("0" + date.getDate()).slice(-2)
	return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Formats as yyyy-mm-dd <hh>h-<mm>m-<ss>s
 */
export function formatSortableDateTime(date: Date): string {
	const hours = ("0" + date.getHours()).slice(-2)
	const minutes = ("0" + date.getMinutes()).slice(-2)
	const seconds = ("0" + date.getSeconds()).slice(-2)
	return `${formatSortableDate(date)} ${hours}h${minutes}m${seconds}s`
}

const referenceDate = new Date(2017, 5, 23)

/**
 * parses the following formats:
 *
 * sq        23.6.2017
 * hr        23. 06. 2017.
 * zh-hant    2017/6/23
 * en        6/23/2017
 * nl        23-6-2017
 * de        23.6.2017
 * el        23/6/2017
 * fr        23/06/2017
 * it        23/6/2017
 * pl        23.06.2017
 * pt-pt    23/06/2017
 * pt-br    23/06/2017
 * ro        23.06.2017
 * ru        23.06.2017
 * es        23/6/2017
 * tr        23.06.2017
 * fi        23.6.2017
 * lt-lt    2017-06-23
 * mk        23.6.2017
 * sr        23.6.2017.
 * bg-bg    23.06.2017 г.
 * cs-cz    23. 6. 2017
 * da-dk    23/6/2017
 * et-ee    23.6.2017
 * fil-ph    6/23/2017
 * hu        2017. 06. 23.
 * id        23/6/2017
 * no        6/23/2017
 *
 * @param dateString
 * @returns The timestamp from the given date string
 */
export function parseDate(dateString: string): number {
	let languageTag = lang.languageTag.toLowerCase()

	let referenceParts = _cleanupAndSplit(formatDate(referenceDate))
	// for finding day month and year position of locale date format  in cleanAndSplit array
	let dayPos = referenceParts.findIndex(e => e === 23)
	let monthPos = referenceParts.findIndex(e => e === 6)
	let yearPos = referenceParts.findIndex(e => e === 2017)

	let parts = _cleanupAndSplit(dateString)
	if (parts.length !== 3) {
		throw new Error(`could not parse dateString '${dateString}' for locale ${languageTag}`)
	}
	// default dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy
	let day = parts[dayPos]
	let month = parts[monthPos] - 1
	let year = parts[yearPos]
	let parsed = new Date(year, month, day).getTime()
	if (isNaN(parsed)) {
		throw new Error(`could not parse date '${dateString}' for locale ${languageTag}`)
	}
	return parsed
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

export function getDomainWithoutSubdomains(mailAddress: string): string {
	var domain = mailAddress.substring(mailAddress.indexOf("@") + 1).toLowerCase()
	var lastDot = domain.lastIndexOf(".")
	var lastButOneDot = domain.lastIndexOf(".", lastDot - 1)
	if (lastButOneDot === -1) {
		return domain
	} else {
		return domain.substring(lastButOneDot + 1)
	}
}

/**
 * Formats the given size in bytes to a better human readable string using B, KB, MB, GB, TB.
 */
export function formatStorageSize(sizeInBytes: number) {
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

export function urlEncodeHtmlTags(text: string) {
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
