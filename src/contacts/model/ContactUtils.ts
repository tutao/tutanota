import { lang } from "../../misc/LanguageViewModel"
import type { Birthday, Contact, ContactSocialId } from "../../api/entities/tutanota/TypeRefs.js"
import { formatDate } from "../../misc/Formatter"
import { isoDateToBirthday } from "../../api/common/utils/BirthdayUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { ContactSocialType } from "../../api/common/TutanotaConstants"

assertMainOrNode()

export type ContactNames = Pick<Contact, "nickname" | "firstName" | "lastName">

export function getContactDisplayName(contact: ContactNames): string {
	if (contact.nickname != null) {
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
		return formatDate(new Date(Number(birthday.year), Number(birthday.month) - 1, Number(birthday.day)))
	} else {
		//if no year is specified a leap year is used to allow 2/29 as birthday
		return lang.formats.simpleDateWithoutYear.format(new Date(Number(2016), Number(birthday.month) - 1, Number(birthday.day)))
	}
}

/**
 * Returns the birthday of the contact as formatted string using default date formatter including date, month and year.
 * If birthday contains no year only month and day will be included.
 * If there is no birthday or an invalid birthday format an empty string returns.
 */
export function formatBirthdayOfContact(contact: Contact): string {
	if (contact.birthdayIso) {
		const isoDate = contact.birthdayIso

		try {
			return formatBirthdayNumeric(isoDateToBirthday(isoDate))
		} catch (e) {
			// cant format, cant do anything
		}
	}

	return ""
}

export function getSocialUrl(contactId: ContactSocialId): string {
	let socialUrlType = ""
	let http = "https://"
	let worldwidew = "www."

	const isSchemePrefixed = contactId.socialId.indexOf("http") !== -1
	const isWwwDotPrefixed = contactId.socialId.indexOf(worldwidew) !== -1

	if (!isSchemePrefixed && !isWwwDotPrefixed) {
		switch (contactId.type) {
			case ContactSocialType.TWITTER:
				socialUrlType = "twitter.com/"
				break

			case ContactSocialType.FACEBOOK:
				socialUrlType = "facebook.com/"
				break

			case ContactSocialType.XING:
				socialUrlType = "xing.com/profile/"
				break

			case ContactSocialType.LINKED_IN:
				socialUrlType = "linkedin.com/in/"
		}
	}

	if (isSchemePrefixed) {
		http = ""
	}

	if (isSchemePrefixed || isWwwDotPrefixed) {
		worldwidew = ""
	}

	return `${http}${worldwidew}${socialUrlType}${contactId.socialId.trim()}`
}
