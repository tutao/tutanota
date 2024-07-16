<<<<<<<< HEAD:src/common/contactsFunctionality/ContactUtils.ts
import { lang } from "../misc/LanguageViewModel.js"
========
import { lang } from "../../../common/misc/LanguageViewModel"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/contacts/model/ContactUtils.ts
import {
	Birthday,
	Contact,
	ContactAddress,
	ContactCustomDate,
	ContactMailAddress,
	ContactMessengerHandle,
	ContactPhoneNumber,
	ContactRelationship,
	ContactSocialId,
	ContactWebsite,
<<<<<<<< HEAD:src/common/contactsFunctionality/ContactUtils.ts
} from "../api/entities/tutanota/TypeRefs.js"
import { formatDate } from "../misc/Formatter.js"
import { isoDateToBirthday } from "../api/common/utils/BirthdayUtils.js"
import { assertMainOrNode } from "../api/common/Env.js"
========
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { formatDate } from "../../../common/misc/Formatter"
import { isoDateToBirthday } from "../../../common/api/common/utils/BirthdayUtils"
import { assertMainOrNode } from "../../../common/api/common/Env"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/contacts/model/ContactUtils.ts
import {
	ContactAddressType,
	ContactCustomDateType,
	ContactMessengerHandleType,
	ContactPhoneNumberType,
	ContactRelationshipType,
	ContactSocialType,
	ContactWebsiteType,
<<<<<<<< HEAD:src/common/contactsFunctionality/ContactUtils.ts
} from "../api/common/TutanotaConstants.js"
import { StructuredMailAddress } from "../native/common/generatedipc/StructuredMailAddress.js"
import { StructuredPhoneNumber } from "../native/common/generatedipc/StructuredPhoneNumber.js"
import { StructuredAddress } from "../native/common/generatedipc/StructuredAddress.js"
import { StructuredContact } from "../native/common/generatedipc/StructuredContact.js"
import { StructuredCustomDate } from "../native/common/generatedipc/StructuredCustomDate.js"
import { StructuredWebsite } from "../native/common/generatedipc/StructuredWebsite.js"
import { StructuredRelationship } from "../native/common/generatedipc/StructuredRelationship.js"
import { StructuredMessengerHandle } from "../native/common/generatedipc/StructuredMessengerHandle.js"
========
} from "../../../common/api/common/TutanotaConstants"
import { StructuredMailAddress } from "../../../common/native/common/generatedipc/StructuredMailAddress.js"
import { StructuredPhoneNumber } from "../../../common/native/common/generatedipc/StructuredPhoneNumber.js"
import { StructuredAddress } from "../../../common/native/common/generatedipc/StructuredAddress.js"
import { StructuredContact } from "../../../common/native/common/generatedipc/StructuredContact.js"
import { StructuredCustomDate } from "../../../common/native/common/generatedipc/StructuredCustomDate.js"
import { StructuredWebsite } from "../../../common/native/common/generatedipc/StructuredWebsite.js"
import { StructuredRelationship } from "../../../common/native/common/generatedipc/StructuredRelationship.js"
import { StructuredMessengerHandle } from "../../../common/native/common/generatedipc/StructuredMessengerHandle.js"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/contacts/model/ContactUtils.ts

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
 * Returns the given date of the contact as formatted string using default date formatter including date, month and year.
 * If date contains no year only month and day will be included.
 * If there is no date or an invalid birthday format an empty string returns.
 */
export function formatContactDate(isoDate: string | null): string {
	if (isoDate) {
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

export function getWebsiteUrl(websiteUrl: string): string {
	let http = "https://"
	let worldwidew = "www."

	const isSchemePrefixed = websiteUrl.indexOf("http") !== -1
	const isWwwDotPrefixed = websiteUrl.indexOf(worldwidew) !== -1

	if (isSchemePrefixed) {
		http = ""
	}

	if (isSchemePrefixed || isWwwDotPrefixed) {
		worldwidew = ""
	}

	return `${http}${worldwidew}${websiteUrl}`.trim()
}

export function getMessengerHandleUrl(handle: ContactMessengerHandle): string {
	const replaceNumberExp = new RegExp(/[^0-9+]/g)
	switch (handle.type) {
		case ContactMessengerHandleType.SIGNAL:
			return `sgnl://signal.me/#p/${handle.handle.replaceAll(replaceNumberExp, "")}`
		case ContactMessengerHandleType.WHATSAPP:
			return `whatsapp://send?phone=${handle.handle.replaceAll(replaceNumberExp, "")}`
		case ContactMessengerHandleType.TELEGRAM:
			return `tg://resolve?domain=${handle.handle}`
		case ContactMessengerHandleType.DISCORD:
			return `discord://-/users/${handle.handle}`
		default:
			return ""
	}
}

export function extractStructuredMailAddresses(addresses: ContactMailAddress[]): ReadonlyArray<StructuredMailAddress> {
	return addresses.map((address) => ({
		address: address.address,
		type: address.type as ContactAddressType,
		customTypeName: address.customTypeName,
	}))
}

export function extractStructuredAddresses(addresses: ContactAddress[]): ReadonlyArray<StructuredAddress> {
	return addresses.map((address) => ({
		address: address.address,
		type: address.type as ContactAddressType,
		customTypeName: address.customTypeName,
	}))
}

export function extractStructuredPhoneNumbers(numbers: ContactPhoneNumber[]): ReadonlyArray<StructuredPhoneNumber> {
	return numbers.map((number) => ({
		number: number.number,
		type: number.type as ContactPhoneNumberType,
		customTypeName: number.customTypeName,
	}))
}

export function extractStructuredCustomDates(dates: ContactCustomDate[]): ReadonlyArray<StructuredCustomDate> {
	return dates.map((date) => ({
		dateIso: date.dateIso,
		type: date.type as ContactCustomDateType,
		customTypeName: date.customTypeName,
	}))
}

export function extractStructuredWebsites(websites: ContactWebsite[]): ReadonlyArray<StructuredWebsite> {
	return websites.map((website) => ({
		url: website.url,
		type: website.type as ContactWebsiteType,
		customTypeName: website.customTypeName,
	}))
}

export function extractStructuredRelationships(relationships: ContactRelationship[]): ReadonlyArray<StructuredRelationship> {
	return relationships.map((relation) => ({
		person: relation.person,
		type: relation.type as ContactRelationshipType,
		customTypeName: relation.customTypeName,
	}))
}

export function extractStructuredMessengerHandle(handles: ContactMessengerHandle[]): ReadonlyArray<StructuredMessengerHandle> {
	return handles.map((handle) => ({
		type: handle.type as ContactMessengerHandleType,
		customTypeName: handle.customTypeName,
		handle: handle.handle,
	}))
}

export function validateBirthdayOfContact(contact: StructuredContact) {
	if (contact.birthday != null) {
		try {
			isoDateToBirthday(contact.birthday)
			return contact.birthday
		} catch (_) {
			return null
		}
	} else {
		return null
	}
}
