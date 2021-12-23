// @flow
import {lang} from "./LanguageViewModel"
import {getByAbbreviation} from "../api/common/CountryList"
import {neverNull} from "@tutao/tutanota-utils"
import type {UserSettingsGroupRoot} from "../api/entities/tutanota/UserSettingsGroupRoot"
import {TimeFormat} from "../api/common/TutanotaConstants"
import {pad} from "@tutao/tutanota-utils";
import {assertMainOrNode} from "../api/common/Env"

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

export function formatDateWithWeekdayAndYearLong(date: Date): string {
	return lang.formats.dateWithWeekdayAndYearLong.format(date)
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

export function formatMailAddressFromParts(name: string, domain: string): string {
	return `${name}@${domain}`.trim().toLowerCase()
}