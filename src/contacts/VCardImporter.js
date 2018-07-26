// @flow
import {createContact} from "../api/entities/tutanota/Contact"
import {createContactAddress} from "../api/entities/tutanota/ContactAddress"
import type {ContactPhoneNumberTypeEnum, ContactAddressTypeEnum} from "../api/common/TutanotaConstants"
import {ContactAddressType, ContactPhoneNumberType, ContactSocialType} from "../api/common/TutanotaConstants"
import {createContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import {createContactPhoneNumber} from "../api/entities/tutanota/ContactPhoneNumber"
import {createContactSocialId} from "../api/entities/tutanota/ContactSocialId"
import {assertMainOrNode} from "../api/Env"
import {createBirthday} from "../api/entities/tutanota/Birthday"

assertMainOrNode()

/**
 * @returns The list of created Contact instances (but not yet saved) or null if vCardFileData is not a valid vCard string.
 */
export function vCardFileToVCards(vCardFileData: string): ?string[] {
	let V3 = "\nVERSION:3.0"
	let V2 = "\nVERSION:2.1"
	let B = "BEGIN:VCARD\n"
	let E = "END:VCARD"
	vCardFileData = vCardFileData.replace(/begin:vcard/g, "BEGIN:VCARD")
	vCardFileData = vCardFileData.replace(/end:vcard/g, "END:VCARD")
	vCardFileData = vCardFileData.replace(/version:2.1/g, "VERSION:2.1")
	let vCardList = []
	if (vCardFileData.indexOf("BEGIN:VCARD") > -1 && vCardFileData.indexOf(E) > -1 && vCardFileData.indexOf(V3) > -1 || vCardFileData.indexOf(V2) > -1) {
		vCardFileData = vCardFileData.replace(/\r/g, "")
		vCardFileData = vCardFileData.replace(/\n /g, "") //folding symbols removed
		vCardFileData = vCardFileData.replace(/\nEND:VCARD\n\n/g, "")
		vCardFileData = vCardFileData.replace(/\nEND:VCARD\n/g, "")
		vCardFileData = vCardFileData.replace(/\nEND:VCARD/g, "")
		vCardFileData = vCardFileData.substring(vCardFileData.indexOf(B) + B.length)

		return vCardFileData.split(B)
	} else {
		return null
	}
}


export function vCardEscapingSplit(details: string): string[] {
	details = details.replace(/\\\\/g, "--bslashbslash++")
	details = details.replace(/\\;/g, "--semiColonsemiColon++")
	details = details.replace(/\\:/g, "--dPunktdPunkt++")
	let array = details.split(';')
	array = array.map(elem => {
		return elem.trim()
	})
	return array
}
export function vCardReescapingArray(details: string[]): string[] {
	return details.map(a => {
		a = a.replace(/\-\-bslashbslash\+\+/g, "\\")
		a = a.replace(/\-\-semiColonsemiColon\+\+/g, ";")
		a = a.replace(/\-\-dPunktdPunkt\+\+/g, ":")
		a = a.replace(/\\n/g, "\n")
		a = a.replace(/\\,/g, ",")

		return a
	})
}

export function vCardEscapingSplitAdr(addressDetails: string): string[] {
	addressDetails = addressDetails.replace(/\\\\/g, "--bslashbslash++")
	addressDetails = addressDetails.replace(/\\;/g, "--semiColonsemiColon++")
	let array = addressDetails.split(';')
	return array.map(elem => {
		if (elem.trim().length > 0) {
			return elem.trim().concat("\n")
		} else { // needed for only Space elements in Address
			return ""
		}
	})
}


export function vCardListToContacts(vCardList: string[], ownerGroupId: Id): Contact[] {
	let contacts = []
	for (let i = 0; i < vCardList.length; i++) {
		let contact = createContact()
		contact._area = "0" // legacy
		contact._owner = ownerGroupId // legacy
		contact.autoTransmitPassword = ""
		contact._ownerGroup = ownerGroupId
		let vCardLines = vCardList[i].split('\n')
		for (let j = 0; j < vCardLines.length; j++) {
			let indexAfterTag = vCardLines[j].indexOf(":")
			let tagAndTypeString = vCardLines[j].substring(0, indexAfterTag).toUpperCase()
			let tagName = tagAndTypeString.split(";")[0]
			let tagValue = vCardLines[j].substring(indexAfterTag + 1)
			switch (tagName) {
				case "N":
					let nameDetails = vCardReescapingArray(vCardEscapingSplit(tagValue))

					for (let i = nameDetails.length; nameDetails.length < 3; i++) {
						nameDetails.push("")
					}
					contact.lastName = nameDetails[0]
					contact.firstName = (nameDetails[1] + " " + nameDetails[2]).trim() // nameDetails[2] (second first name) may be empty
					contact.title = nameDetails[3]
					break
				case "FN"://Thunderbird can export FULLNAME tag if that is given with the email address automatic contact creation. If there is no first name or second name the namestring will be saved as full name.
					if (contact.firstName === "" && contact.lastName === "" && contact.title == null) {

						let fullName = vCardReescapingArray(vCardEscapingSplit(tagValue))
						contact.firstName = fullName.join(" ").replace(/"/g, "") //Thunderbird saves the Fullname in "quoteations marks" they are deleted here
					}
					break
				case "BDAY":
					let indexOfT = tagValue.indexOf("T")
					let bDayDetails = null
					if (tagValue.match(/--\d{4}/g)) {
						bDayDetails = createBirthday()
						bDayDetails.month = tagValue.substring(2, 4)
						bDayDetails.day = tagValue.substring(4, 6)
					} else if (tagValue.match(/\d{4}-\d{2}-\d{2}/g)) {
						let bDay = tagValue.substring(0, (indexOfT !== -1) ? indexOfT : tagValue.length).split("-")
						bDayDetails = createBirthday()
						bDayDetails.year = bDay[0].trim()
						bDayDetails.month = bDay[1].trim()
						bDayDetails.day = bDay[2].trim()
					} else if (tagValue.match(/\d{8}/g)) {
						bDayDetails = createBirthday()
						bDayDetails.year = tagValue.substring(0, 4)
						bDayDetails.month = tagValue.substring(4, 6)
						bDayDetails.day = tagValue.substring(6, 8)
					}
					if (bDayDetails && bDayDetails.year === "1111") {
						// we use 1111 as marker if no year has been defined as vcard 3.0 does not support dates without year
						bDayDetails.year = null
					}
					contact.birthday = bDayDetails
					break
				case "ORG":
					let orgDetails = vCardReescapingArray(vCardEscapingSplit(tagValue))
					contact.company = orgDetails.join(" ")
					break
				case "NOTE":
					let note = vCardReescapingArray(vCardEscapingSplit(tagValue))
					contact.comment = note.join(" ")
					break
				case "ADR":
				case "ITEM1.ADR":// necessary for apple vcards
				case "ITEM2.ADR":// necessary for apple vcards
					if (tagAndTypeString.indexOf("HOME") > (-1)) {
						_addAddress(tagValue, contact, ContactAddressType.PRIVATE)
					} else if (tagAndTypeString.indexOf("WORK") > (-1)) {
						_addAddress(tagValue, contact, ContactAddressType.WORK)
					} else {
						_addAddress(tagValue, contact, ContactAddressType.OTHER)
					}
					break
				case "EMAIL":
				case "ITEM1.EMAIL":// necessary for apple vcards
				case "ITEM2.EMAIL":// necessary for apple vcards
					if (tagAndTypeString.indexOf("HOME") > (-1)) {
						_addMailAddress(tagValue, contact, ContactAddressType.PRIVATE)
					} else if (tagAndTypeString.indexOf("WORK") > (-1)) {
						_addMailAddress(tagValue, contact, ContactAddressType.WORK)
					} else {
						_addMailAddress(tagValue, contact, ContactAddressType.OTHER)
					}
					break
				case "TEL":
				case "ITEM1.TEL":// necessary for apple vcards
				case "ITEM2.TEL":// necessary for apple vcards
					tagValue = tagValue.replace(/[\u2000-\u206F]/g, "")
					if (tagAndTypeString.indexOf("HOME") > (-1)) {
						_addPhoneNumber(tagValue, contact, ContactPhoneNumberType.PRIVATE)
					} else if (tagAndTypeString.indexOf("WORK") > (-1)) {
						_addPhoneNumber(tagValue, contact, ContactPhoneNumberType.WORK)
					} else if (tagAndTypeString.indexOf("FAX") > (-1)) {
						_addPhoneNumber(tagValue, contact, ContactPhoneNumberType.FAX)
					} else if (tagAndTypeString.indexOf("CELL") > (-1)) {
						_addPhoneNumber(tagValue, contact, ContactPhoneNumberType.MOBILE)
					} else {
						_addPhoneNumber(tagValue, contact, ContactPhoneNumberType.OTHER)
					}
					break
				case "URL":
				case "ITEM1.URL":// necessary for apple vcards
				case "ITEM2.URL":// necessary for apple vcards
					let website = createContactSocialId()
					website.type = ContactSocialType.OTHER
					website.socialId = vCardReescapingArray(vCardEscapingSplit(tagValue)).join("")
					website.customTypeName = ""
					contact.socialIds.push(website)
					break
				case "NICKNAME":
					let nick = vCardReescapingArray(vCardEscapingSplit(tagValue))
					contact.nickname = nick.join(" ")
					break
				case "PHOTO":
					// if (indexAfterTag < tagValue.indexOf(":")) {
					// 	indexAfterTag = tagValue.indexOf(":")
					// }
					// /*Here will be the photo import*/
					break
				case "ROLE":
				case "TITLE":
					let role = vCardReescapingArray(vCardEscapingSplit(tagValue))
					contact.role += (" " + role.join(" ")).trim()
					break
				default:

			}
		}

		contacts[i] = contact
	}

	function _addAddress(vCardAddressValue: string, contact: Contact, type: ContactAddressTypeEnum) {
		let address = createContactAddress()
		address.type = type
		let addressDetails = vCardReescapingArray(vCardEscapingSplitAdr(vCardAddressValue))
		address.address = addressDetails.join("").trim()
		address.customTypeName = ""
		contact.addresses.push(address)
	}

	function _addPhoneNumber(vCardPhoneNumberValue: string, contact: Contact, type: ContactPhoneNumberTypeEnum) {
		let phoneNumber = createContactPhoneNumber()
		phoneNumber.type = type
		phoneNumber.number = vCardPhoneNumberValue
		phoneNumber.customTypeName = ""
		contact.phoneNumbers.push(phoneNumber)
	}

	function _addMailAddress(vCardMailAddressValue: string, contact: Contact, type: ContactAddressTypeEnum) {
		let email = createContactMailAddress()
		email.type = type
		email.address = vCardMailAddressValue
		email.customTypeName = ""
		contact.mailAddresses.push(email)
	}

	return contacts
}