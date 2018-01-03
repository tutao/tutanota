// @flow
import {lang} from "./LanguageViewModel"
import {startsWith, pad} from "../api/common/utils/StringUtils"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()


export function formatDate(date: Date): string {
	return lang.formats.simpleDate.format(date)
}

export function formatDateWithMonth(date: Date): string {
	return lang.formats.dateWithMonth.format(date)
}

export function formatDateWithWeekday(date: Date): string {
	if (date.getFullYear() == new Date().getFullYear()) {
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

export function formatSortableDate(date: Date): string {
	const month = ("0" + (date.getMonth() + 1)).slice(-2)
	const day = ("0" + date.getDate()).slice(-2)
	return `${date.getFullYear()}-${month}-${day}`
}

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
 * @returns {number}
 */
export function parseDate(dateString: string) {
	let languageTag = lang.languageTag.toLowerCase()

	let referenceParts = _cleanupAndSplit(formatDate(referenceDate))
	let dayPos = referenceParts.findIndex(e => e == 23)
	let monthPos = referenceParts.findIndex(e => e == 6)
	let yearPos = referenceParts.findIndex(e => e == 2017)

	let parts = _cleanupAndSplit(dateString)
	if (parts.length != 3) {
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
function _cleanupAndSplit(dateString: string): number[] {
	let languageTag = lang.languageTag.toLowerCase()

	if (languageTag === 'bg-bg') {
		dateString = dateString.replace(" г.", "") // special bulgarian format, do not replace (special unicode char)
	}
	dateString = dateString.replace(/ /g, "")
	return dateString.split(/[.\/-]/g).filter(part => part.trim().length > 0).map(part => parseInt(part))
}

export function formatPrice(value: number, includeCurrency: boolean): string {
	if (includeCurrency) {
		return lang.formats.priceWithCurrency.format(value)
	} else {
		return lang.formats.priceWithoutCurrency.format(value)
	}
}

/**
 * Parses the given string for a name and mail address. The following formats are recognized: [name][<]mailAddress[>]
 * Additionally, whitespaces at any positions outside name and mailAddress are ignored.
 * @param string The string to check.
 * @return an object with the attributes "name" and "mailAddress" or null if nothing was found.
 */
export function stringToNameAndMailAddress(string: string): ?{name:string, mailAddress:string} {
	string = string.trim()
	if (string == "") {
		return null
	}
	var startIndex = string.indexOf("<")
	if (startIndex != -1) {
		var endIndex = string.indexOf(">", startIndex)
		if (endIndex == -1) {
			return null
		}
		var cleanedMailAddress = getCleanedMailAddress(string.substring(startIndex + 1, endIndex))

		if (cleanedMailAddress == null || !isMailAddress(cleanedMailAddress, false)) {
			return null
		}
		var name = string.substring(0, startIndex).trim()
		return {name: name, mailAddress: cleanedMailAddress}
	} else {
		var startIndex = string.lastIndexOf(" ")
		startIndex++
		var cleanedMailAddress = getCleanedMailAddress(string.substring(startIndex))
		if (cleanedMailAddress == null || !isMailAddress(cleanedMailAddress, false)) {
			return null
		}
		var name = string.substring(0, startIndex).trim()
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
 * Checks if the given string is a valid email address format.
 * @param string The string to check.
 * @param strictUserName If true checks that the part before the @ is not longer than 64 characters and does not contain special characters.
 * @return If the string is an email address.
 */
export function isMailAddress(string: string, strictUserName: boolean): boolean {
	/* KEEP IN SYNC WITH JAVA VERSION IN PhoneNumberUtils.js (except uppercase) */
	// check trailing whitespaces because they are not covered by the following regexp
	// allow uppercase addresses in input check, convert them before sending to server.
	if (string == null || string != string.trim()) {
		return false
	}
	if (string.indexOf("-") === 0) {
		return false
	}
	// check lengths (see https://tools.ietf.org/html/rfc5321#section-4.5.3)
	if (string.length > 254) { // 256 minus "<" and ">" of the path
		return false
	}
	if (strictUserName) {
		if (string.indexOf("@") > 64) {
			return false
		}
		// see http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
		return /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(string)
	} else {
		// see http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
		return /^[^\s\@]+\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(string)
	}
}

/**
 * Checks if the given string is a valid domain name.
 * @param {string} domainName The string to check.
 * @return {boolean} If the string is a domain name.
 */
export function isDomainName(domainName: string): boolean {
	if (domainName == null || domainName != domainName.trim()) {
		return false
	}
	if (startsWith(domainName, "-")) {
		return false
	}
	return /^[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(domainName)
}


export function isRegularExpression(value: string) {
	return /^\/.*\/$/.test(value)
}


/**
 * Parses the given string for a fist name and a last name separated by whitespace. If there is only one part it is regarded as first name. If there are more than two parts, only the first one is regarded as first name.
 * @param fullName The full name to check.
 * @return Returns an object with the attributes "firstName" and "lastName".
 */
export function fullNameToFirstAndLastName(fullName: string): {firstName:string, lastName:string} {
	fullName = fullName.trim()
	if (fullName == "") {
		return {firstName: "", lastName: ""}
	}
	var separator = fullName.indexOf(" ")
	if (separator != -1) {
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
export function mailAddressToFirstAndLastName(mailAddress: string): {firstName:string, lastName:string} {
	var addr = mailAddress.substring(0, mailAddress.indexOf("@"))
	var nameData = []
	if (addr.indexOf(".") != -1) {
		nameData = addr.split(".")
	} else if (addr.indexOf("_") != -1) {
		nameData = addr.split("_")
	} else if (addr.indexOf("-") != -1) {
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
	if (lastButOneDot == -1) {
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