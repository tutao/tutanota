// @flow
import type {Contact} from "../api/entities/tutanota/Contact"
import {convertToDataFile} from "../api/common/DataFile"
import {createFile} from "../api/entities/tutanota/File"
import {stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {fileController} from "../file/FileController"
import {ContactAddressType, ContactPhoneNumberType} from "../api/common/TutanotaConstants"
import type {ContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import type {ContactAddress} from "../api/entities/tutanota/ContactAddress"
import type {ContactPhoneNumber} from "../api/entities/tutanota/ContactPhoneNumber"
import type {ContactSocialId} from "../api/entities/tutanota/ContactSocialId"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()


export function exportContacts(contacts: Contact[]): Promise<void> {
	let vCardFile = contactsToVCard(contacts)
	let data = stringToUtf8Uint8Array(vCardFile)
	let tmpFile = createFile()
	tmpFile.name = "vCard3.0.vcf"
	tmpFile.mimeType = "vCard/rfc2426"
	tmpFile.size = String(data.byteLength)
	return fileController.open(convertToDataFile(tmpFile, data))
}

/**
 * Turns given contacts separately into a vCard version 3.0 compatible string then the string is concatenated into a multiple contact vCard string witch is then returned
 */
export function contactsToVCard(allContacts: Contact[]): string {
	let vCardFile = ""
	allContacts.forEach((contact) => {
		vCardFile += _contactToVCard(contact)
	})
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
	fnString += contact.lastName ? _getVCardEscaped(contact.lastName) : ""
	contactToVCardString += _getFoldedString(fnString.trim()) + "\n"

	//N tag must be included in vCard3.0
	let nString = "N:"
	nString += contact.lastName ? _getVCardEscaped(contact.lastName) + ";" : ";"
	nString += contact.firstName ? _getVCardEscaped(contact.firstName) + ";;" : ";;"
	nString += contact.title ? _getVCardEscaped(contact.title) + ";" : ";"
	contactToVCardString += _getFoldedString(nString) + "\n"

	contactToVCardString += contact.nickname ? _getFoldedString("NICKNAME:" + _getVCardEscaped(contact.nickname))
		+ "\n" : ""
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
	contactToVCardString += contact.role ? _getFoldedString("ROLE:" + _getVCardEscaped(contact.role)) + "\n" : ""
	contactToVCardString += contact.company ? _getFoldedString("ORG:" + _getVCardEscaped(contact.company)) + "\n" : ""
	contactToVCardString += contact.comment ? _getFoldedString("NOTE:" + _getVCardEscaped(contact.comment)) + "\n" : ""
	contactToVCardString += "END:VCARD\n\n" //must be included in vCard3.0
	return contactToVCardString
}

/**
 * export for testing
 * Works for mail addresses the same as for addresses
 * Returns all mail-addresses/addresses and their types in an object array
 */
export function _addressesToVCardAddresses(addresses: ContactMailAddress[] | ContactAddress[]): {KIND: string, CONTENT: string}[] {
	return addresses.map(ad => {
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
		return {KIND: kind, CONTENT: ad.address}
	})
}

/**
 * export for testing
 * Returns all phone numbers and their types in an object array
 */
export function _phoneNumbersToVCardPhoneNumbers(numbers: ContactPhoneNumber[]): {KIND: string, CONTENT: string}[] {
	return numbers.map(num => {
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
		return {KIND: kind, CONTENT: num.number}
	})
}

/**
 *  export for testing
 *  Returns all socialIds as a vCard Url in an object array
 *  Type is not defined here. URL tag has no fitting type implementation
 */
export function _socialIdsToVCardSocialUrls(socialIds: ContactSocialId[]): {KIND: string, CONTENT: string}[] {
	return socialIds.map(sId => {
		//IN VCARD 3.0 is no type for URLS
		return {KIND: "", CONTENT: sId.socialId}
	})
}

/**
 * export for testing
 * Returns a multiple line string from the before created object arrays of addresses, mail addresses and socialIds
 */
export function _vCardFormatArrayToString(typeAndContentArray: {KIND: string, CONTENT: string}[], tagContent: string): string {
	return typeAndContentArray.reduce((result, elem) => {
		if (elem.KIND) {
			return result + _getFoldedString(tagContent + ";TYPE=" + elem.KIND + ":" + _getVCardEscaped(elem.CONTENT))
				+ "\n"
		} else {
			return result + _getFoldedString(tagContent + ":" + _getVCardEscaped(elem.CONTENT)) + "\n"
		}
	}, "")
}

// Used for line folding as needed for vCard 3.0 if CONTENT line exceeds 75 characters
function _getFoldedString(text: string): string {
	let separateLinesArray = []
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
	content = content.replace(/:/g, "\\:")
	content = content.replace(/,/g, "\\,")
	return content
}