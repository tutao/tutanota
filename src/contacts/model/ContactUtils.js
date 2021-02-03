// @flow
import {lang} from "../../misc/LanguageViewModel.js"
import {assertMainOrNode} from "../../api/common/Env"
import type {Contact} from "../../api/entities/tutanota/Contact"
import {neverNull} from "../../api/common/utils/Utils"
import type {Birthday} from "../../api/entities/tutanota/Birthday"
import {formatDate, formatDateWithMonth} from "../../misc/Formatter"
import {isoDateToBirthday} from "../../api/common/utils/BirthdayUtils"

assertMainOrNode()

export function getContactDisplayName(contact: Contact): string {
	if (contact.nickname) {
		return contact.nickname
	} else {
		return `${contact.firstName} ${contact.lastName}`.trim()
	}
}

export function getContactListName(contact: Contact): string {
	let name = `${contact.firstName} ${contact.lastName}`.trim()
	if (name.length === 0) {
		name = contact.company.trim()
	}
	return name
}


export function formatBirthdayNumeric(birthday: Birthday): string {
	if (birthday.year) {
		//in chromimum Intl.DateTimeFormat is buggy for some dates with years the format subtracts a day from the date
		//example date is 15.8.1911 ->format returns 14.8.1911
		//this issue does not happen with recent years so the formatting is done with the current year then this year is changed with the original of the birthday
		let refYear = new Date()
		let bdayString = formatDate(new Date(refYear.getFullYear(), Number(neverNull(birthday).month)
			- 1, Number(neverNull(birthday).day)))
		bdayString = bdayString.replace(/\d{4}/g, String(neverNull(birthday).year))
		return bdayString
	} else {
		return lang.formats.simpleDateWithoutYear.format(new Date(Number(2011), Number(neverNull(birthday).month)
			- 1, Number(neverNull(birthday).day)))
	}
}

export function formatBirthdayWithMonthName(birthday: Birthday): string {
	if (birthday.year) {
		//todo github issue #414
		//in chromimum Intl.DateTimeFormat is buggy for some dates with years the format subtracts a day from the date
		//example date is 15.8.1911 ->format returns 14.8.1911
		//this issue does not happen with recent years so the formatting is done with the current year then this year is changed with the original of the birthday
		let refYear = new Date()
		let bdayString = formatDateWithMonth(new Date(refYear.getFullYear(), Number(neverNull(birthday).month) - 1,
			Number(neverNull(birthday).day)))
		bdayString = bdayString.replace(/\d{4}/g, String(neverNull(birthday).year))
		return bdayString
	} else {
		return lang.formats.dateWithoutYear.format(new Date(Number(2011), Number(neverNull(birthday).month) - 1,
			Number(neverNull(birthday).day)))
	}
}

/**
 * Returns the birthday of the contact as formatted string using default date formatter including date, month and year.
 * If birthday contains no year only month and day will be included.
 * If there is no birthday an empty string returns.
 */
export function formatBirthdayOfContact(contact: Contact): string {
	if (contact.birthdayIso) {
		const isoDate = contact.birthdayIso
		try {
			return formatBirthdayNumeric(isoDateToBirthday(isoDate))
		} catch (e) {
			console.log("error while formating contact birthday", e)
			return ""
		}
	} else {
		return ""
	}
}