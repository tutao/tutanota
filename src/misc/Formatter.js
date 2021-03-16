// @flow
import {lang} from "./LanguageViewModel"
import {assertMainOrNode} from "../api/common/Env"
import {getByAbbreviation} from "../api/common/CountryList"
import {neverNull} from "../api/common/utils/Utils"
import {isMailAddress} from "./FormatValidator"
import type {UserSettingsGroupRoot} from "../api/entities/tutanota/UserSettingsGroupRoot"
import {TimeFormat} from "../api/common/TutanotaConstants"
import {pad} from "../api/common/utils/StringUtils";

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

export function formatDateWithWeekdayAndYear(date: Date): string {
	return lang.formats.dateWithWeekdayAndYear.format(date)
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

export function timeStringFromParts(hours: number, minutes: number, amPm: boolean): string {
	let minutesString = pad(minutes, 2)
	if (amPm) {
		if (hours === 0) {
			return `12:${minutesString} am`
		} else if (hours === 12) {
			return `12:${minutesString} pm`
		} else if (hours > 12) {
			return `${hours - 12}:${minutesString} pm`
		} else {
			return `${hours}:${minutesString} am`
		}
	} else {
		let hoursString = pad(hours, 2)
		return hoursString + ":" + minutesString
	}
}

/**
 * Accepts 2, 2:30, 2:5, 02:05, 02:30, 24:30, 2430, 12:30pm, 12:30 p.m.
 */
export function parseTime(timeString: string): ?{hours: number, minutes: number} {
	let suffix  // am/pm indicator or undefined
	let hours   // numeric hours
	let minutes // numeric minutes
	// See if the time includes a colon separating hh:mm
	let mt = timeString.match(/^(\d{1,2}):(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)?$/i)
	if (mt != null) {
		suffix = mt[3]
		hours = parseInt(mt[1], 10)
		minutes = parseInt(mt[2], 10)
	} else {
		// Interpret 127am as 1:27am or 2311 as 11:11pm, e.g.
		mt = timeString.match(/^(\d{1,4})\s*(am|pm|a\.m\.|p\.m\.)?$/i)
		if (mt != null) {
			suffix = mt[2]
			const digits = mt[1]
			// Hours only?
			if (digits.length <= 2) {
				hours = parseInt(digits, 10)
				minutes = 0
			} else {
				hours = parseInt(digits.substr(0, digits.length - 2), 10)
				minutes = parseInt(digits.substr(-2, 2), 10)
			}
		} else {
			return null
		}
	}
	if (isNaN(hours) || isNaN(minutes) || minutes > 59) {
		return null
	}
	if (suffix) {
		suffix = suffix.toUpperCase()
	}
	if (suffix === "PM" || suffix === "P.M.") {
		if (hours > 12) return null
		if (hours !== 12) hours = hours + 12
	} else if (suffix === "AM" || suffix === "A.M.") {
		if (hours > 12) return null
		if (hours === 12) hours = 0
	} else if (hours > 23) {
		return null
	}
	return {hours, minutes}
}

export function formatMailAddressFromParts(name: string, domain: string): string {
	return `${name}@${domain}`.trim().toLowerCase()
}