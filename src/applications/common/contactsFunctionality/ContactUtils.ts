import { assertMainOrNode } from "@tutao/app-env"
import { formatDate } from "../../../ui/utils/Formatter.js"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { isoDateToBirthday } from "../api/common/utils/BirthdayUtils.js"
import {
	StructuredAddress,
	StructuredContact,
	StructuredCustomDate,
	StructuredMailAddress,
	StructuredMessengerHandle,
	StructuredPhoneNumber,
	StructuredRelationship,
	StructuredWebsite,
} from "@tutao/native-bridge/generatedIpc/types"
import { parseUrl } from "@tutao/utils"
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
} from "@tutao/entities/tutanota"
import {
	ContactAddressType,
	ContactCustomDateType,
	ContactMessengerHandleType,
	ContactPhoneNumberType,
	ContactRelationshipType,
	ContactSocialType,
	ContactWebsiteType,
} from "../../../entities/tutanota/Utils"

assertMainOrNode()

export type ContactNames = Pick<Contact, "nickname" | "firstName" | "lastName">

export function getContactDisplayName(contact: ContactNames): string {
	if (contact.nickname != null && contact.nickname !== "") {
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

export function getSocialUrl(contactId: ContactSocialId): string | null {
	if (parseUrl(contactId.socialId) != null) {
		// already a valid URL
		return contactId.socialId
	}

	let socialUrlType = ""

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
			break
		default:
			return null
	}

	return `https://${socialUrlType}${contactId.socialId.trim()}`
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
export function getContactTitle(contact: Contact) {
	const title = contact.title ? `${contact.title} ` : ""
	const middleName = contact.middleName != null ? ` ${contact.middleName} ` : " "
	const fullName = `${contact.firstName}${middleName}${contact.lastName} `
	const suffix = contact.nameSuffix ?? ""
	return (title + fullName + suffix).trim()
}
