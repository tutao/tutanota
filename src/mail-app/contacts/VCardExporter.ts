import { convertToDataFile } from "../../common/api/common/DataFile"
import type { Contact, ContactAddress, ContactMailAddress, ContactPhoneNumber, ContactSocialId } from "../../common/api/entities/tutanota/TypeRefs.js"
import { createFile } from "../../common/api/entities/tutanota/TypeRefs.js"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { ContactAddressType, ContactPhoneNumberType } from "../../common/api/common/TutanotaConstants"
import { assertMainOrNode } from "../../common/api/common/Env"
import { locator } from "../../common/api/main/CommonLocator"
import { getSocialUrl, getWebsiteUrl } from "../../common/contactsFunctionality/ContactUtils.js"

assertMainOrNode()

export function exportContacts(contacts: Contact[]): Promise<void> {
	let vCardFile = contactsToVCard(contacts)
	let data = stringToUtf8Uint8Array(vCardFile)
	let tmpFile = createFile({
		name: "vCard3.0.vcf",
		mimeType: "vCard/rfc2426",
		size: String(data.byteLength),
		blobs: [],
		cid: null,
		parent: null,
		subFiles: null,
	})
	return locator.fileController.saveDataFile(convertToDataFile(tmpFile, data))
}

/**
 * Converts an array of contacts to a vCard 3.0 compatible string.
 *
 * @param contacts
 * @returns vCard 3.0 compatible string which is the vCard of each all contacts concatanted.
 */
export function contactsToVCard(contacts: Contact[]): string {
	let vCardFile = ""
	for (const contact of contacts) {
		vCardFile += _contactToVCard(contact)
	}
	return vCardFile
}

/**
 * Export for testing
 */
export function _contactToVCard(contact: Contact): string {
	let contactToVCardString = "BEGIN:VCARD\nVERSION:3.0\n" //must be invcluded in vCard3.0

	//FN tag must be included in vCard3.0
	let fnString = "FN:"
	fnString += contact.title ? _getVCardEscaped(contact.title) + " " : ""
	fnString += contact.firstName ? _getVCardEscaped(contact.firstName) + " " : ""
	fnString += contact.middleName ? _getVCardEscaped(contact.middleName) + " " : ""
	fnString += contact.lastName ? _getVCardEscaped(contact.lastName) : ""
	fnString += contact.nameSuffix ? ", " + _getVCardEscaped(contact.nameSuffix) : ""
	contactToVCardString += _getFoldedString(fnString.trim()) + "\n"
	//N tag must be included in vCard3.0
	let nString = "N:"
	nString += contact.lastName ? _getVCardEscaped(contact.lastName) + ";" : ";"
	nString += contact.firstName ? _getVCardEscaped(contact.firstName) + ";" : ";"
	nString += contact.middleName ? _getVCardEscaped(contact.middleName) + ";" : ";"
	nString += contact.title ? _getVCardEscaped(contact.title) + ";" : ";"
	nString += contact.nameSuffix ? _getVCardEscaped(contact.nameSuffix) + "" : ""
	contactToVCardString += _getFoldedString(nString) + "\n"
	contactToVCardString += contact.nickname ? _getFoldedString("NICKNAME:" + _getVCardEscaped(contact.nickname)) + "\n" : ""

	//adds oldBirthday converted into a string if present else if available new birthday format is added to contactToVCardString
	if (contact.birthdayIso) {
		const bday = contact.birthdayIso
		// we use 1111 as marker if no year has been defined as vcard 3.0 does not support dates without year
		// vcard 4.0 supports iso date without year
		const bdayExported = bday.startsWith("--") ? bday.replace("--", "1111-") : bday
		contactToVCardString += "BDAY:" + bdayExported + "\n"
	}

	contactToVCardString += _vCardFormatArrayToString(_addressesToVCardAddresses(contact.addresses), "ADR")
	contactToVCardString += _vCardFormatArrayToString(_addressesToVCardAddresses(contact.mailAddresses), "EMAIL")
	contactToVCardString += _vCardFormatArrayToString(_phoneNumbersToVCardPhoneNumbers(contact.phoneNumbers), "TEL")
	contactToVCardString += _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact.socialIds), "URL")
	contactToVCardString += contact.role != "" ? _getFoldedString("TITLE:" + _getVCardEscaped(contact.role)) + "\n" : ""

	contact.websites.map((website) => {
		contactToVCardString += _getFoldedString("URL:" + getWebsiteUrl(website.url) + "\n")
	})

	const company = contact.company ? _getFoldedString("ORG:" + _getVCardEscaped(contact.company)) : ""
	if (contact.department) {
		contactToVCardString += company + ";" + _getVCardEscaped(contact.department) + "\n"
	} else {
		contactToVCardString += contact.company ? _getFoldedString("ORG:" + _getVCardEscaped(contact.company)) + "\n" : ""
	}

	contactToVCardString += contact.comment ? _getFoldedString("NOTE:" + _getVCardEscaped(contact.comment)) + "\n" : ""
	contactToVCardString += "END:VCARD\n\n" //must be included in vCard3.0

	return contactToVCardString
}

/**
 * export for testing
 * Works for mail addresses the same as for addresses
 * Returns all mail-addresses/addresses and their types in an object array
 */
export function _addressesToVCardAddresses(addresses: ContactMailAddress[] | ContactAddress[]): {
	KIND: string
	CONTENT: string
}[] {
	return addresses.map((ad) => {
		let kind = ""

		switch (ad.type) {
			case ContactAddressType.PRIVATE:
				kind = "home"
				break

			case ContactAddressType.WORK:
				kind = "work"
				break

			default:
		}

		return {
			KIND: kind,
			CONTENT: ad.address,
		}
	})
}

/**
 * export for testing
 * Returns all phone numbers and their types in an object array
 */
export function _phoneNumbersToVCardPhoneNumbers(numbers: ContactPhoneNumber[]): {
	KIND: string
	CONTENT: string
}[] {
	return numbers.map((num) => {
		let kind = ""

		switch (num.type) {
			case ContactPhoneNumberType.PRIVATE:
				kind = "home"
				break

			case ContactPhoneNumberType.WORK:
				kind = "work"
				break

			case ContactPhoneNumberType.MOBILE:
				kind = "cell"
				break

			case ContactPhoneNumberType.FAX:
				kind = "fax"
				break

			default:
		}

		return {
			KIND: kind,
			CONTENT: num.number,
		}
	})
}

/**
 *  export for testing
 *  Returns all socialIds as a vCard Url in an object array
 *  Type is not defined here. URL tag has no fitting type implementation
 */
export function _socialIdsToVCardSocialUrls(socialIds: ContactSocialId[]): {
	KIND: string
	CONTENT: string
}[] {
	return socialIds.map((sId) => {
		//IN VCARD 3.0 is no type for URLS
		return {
			KIND: "",
			CONTENT: getSocialUrl(sId),
		}
	})
}

/**
 * export for testing
 * Returns a multiple line string from the before created object arrays of addresses, mail addresses and socialIds
 */
export function _vCardFormatArrayToString(
	typeAndContentArray: {
		KIND: string
		CONTENT: string
	}[],
	tagContent: string,
): string {
	return typeAndContentArray.reduce((result, elem) => {
		if (elem.KIND) {
			return result + _getFoldedString(tagContent + ";TYPE=" + elem.KIND + ":" + _getVCardEscaped(elem.CONTENT)) + "\n"
		} else {
			return result + _getFoldedString(tagContent + ":" + _getVCardEscaped(elem.CONTENT)) + "\n"
		}
	}, "")
}

/**
 * Adds line breaks and padding in a CONTENT line to adhere to the vCard
 * specifications.
 *
 * @param text The text to fold.
 * @returns The same text but folded every 75 characters.
 * @see https://datatracker.ietf.org/doc/html/rfc6350#section-3.2
 */
function _getFoldedString(text: string): string {
	let separateLinesArray: string[] = []

	while (text.length > 75) {
		separateLinesArray.push(text.substring(0, 75))
		text = text.substring(75, text.length)
	}

	separateLinesArray.push(text)
	text = separateLinesArray.join("\n ")
	return text
}

function _getVCardEscaped(content: string): string {
	content = content.replace(/\n/g, "\\n")
	content = content.replace(/;/g, "\\;")
	content = content.replace(/,/g, "\\,")
	return content
}
