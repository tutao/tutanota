// @flow
import {createContact} from "../api/entities/tutanota/Contact"
import {createContactAddress} from "../api/entities/tutanota/ContactAddress"
import type {ContactPhoneNumberTypeEnum, ContactAddressTypeEnum} from "../api/common/TutanotaConstants"
import {ContactAddressType, ContactPhoneNumberType, ContactSocialType} from "../api/common/TutanotaConstants"
import {createContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import {createContactPhoneNumber} from "../api/entities/tutanota/ContactPhoneNumber"
import {createContactSocialId} from "../api/entities/tutanota/ContactSocialId"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

/**
 * @returns The list of created Contact instances (but not yet saved) or null if vCardFileData is not a valid vCard string.
 */
export function vCardFileToVCards(vCardFileData: string): ?string[] {
	let V = "\nVERSION:3.0"
	let B = "BEGIN:VCARD\n"
	let E = "END:VCARD"
	let vCardList = []
	if (vCardFileData.indexOf("BEGIN:VCARD") > -1 && vCardFileData.indexOf(E) > -1 && vCardFileData.indexOf(V) > -1) {
		vCardFileData = vCardFileData.replace(/\r/g, "")
		vCardFileData = vCardFileData.replace(/\n /g, "")
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
	let array = details.split(';')
	array = array.map(elem => {
		return elem.trim()
	})
	return array
}
export function vCardReescapingArray(details: string[]): string[] {
	return details.map(a => {
		a = a.replace("--bslashbslash++", "\\")
		a = a.replace("--semiColonsemiColon++", ";")
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
			let semiIndex = vCardLines[j].indexOf(";")
			if (semiIndex > -1 && semiIndex < indexAfterTag) {
				indexAfterTag = semiIndex
			}

			let tagAndTypeString = vCardLines[j].substring(0, vCardLines[j].indexOf(":"))
			switch (vCardLines[j].substring(0, indexAfterTag)) {
				case "N":
					let nameDetails = vCardLines[j].substring(indexAfterTag + 1)
					nameDetails = vCardReescapingArray(vCardEscapingSplit(nameDetails))
					contact.lastName = nameDetails[0]
					contact.firstName = (nameDetails[1] + " " + nameDetails[2]).trim() // nameDetails[2] (second first name) may be empty
					// contact.title = nameDetails[3] use "Anrede" here later
					break
				case "BDAY":
					let indexOfT = vCardLines[j].indexOf("T")
					let bDayDetails = vCardLines[j].substring(indexAfterTag + 1, (indexOfT != -1) ? indexOfT : vCardLines[j].length).split("-")
					bDayDetails = [bDayDetails[1], bDayDetails[2], bDayDetails[0]]
					let timestamp = new Date(bDayDetails.join("/")).getTime()
					contact.birthday = isNaN(timestamp) ? null : new Date(timestamp)
					break
				case "ORG":
					let orgDetails = vCardLines[j].substring(indexAfterTag + 1)
					orgDetails = vCardReescapingArray(vCardEscapingSplit(orgDetails))
					contact.company = orgDetails.join(" ")
					break
				case "NOTE":
					let note = vCardLines[j].substring(indexAfterTag + 1)
					note = vCardReescapingArray(vCardEscapingSplit(note))
					contact.comment = note.join(" ")
					break
				case "ADR":
				case "item1.ADR":// necessary for apple vcards
				case "item2.ADR":// necessary for apple vcards
					if (tagAndTypeString.indexOf("HOME") > (-1)) {
						_addAddress(vCardLines[j], contact, ContactAddressType.PRIVATE)
					} else if (tagAndTypeString.indexOf("WORK") > (-1)) {
						_addAddress(vCardLines[j], contact, ContactAddressType.WORK)
					} else {
						_addAddress(vCardLines[j], contact, ContactAddressType.OTHER)
					}
					break
				case "EMAIL":
					if (tagAndTypeString.indexOf("HOME") > (-1)) {
						_addMailAddress(vCardLines[j], contact, ContactAddressType.PRIVATE)
					} else if (tagAndTypeString.indexOf("WORK") > (-1)) {
						_addMailAddress(vCardLines[j], contact, ContactAddressType.WORK)
					} else {
						_addMailAddress(vCardLines[j], contact, ContactAddressType.OTHER)
					}
					break
				case "TEL":
					if (tagAndTypeString.indexOf("HOME") > (-1)) {
						_addPhoneNumber(vCardLines[j], contact, ContactPhoneNumberType.PRIVATE)
					} else if (tagAndTypeString.indexOf("WORK") > (-1)) {
						_addPhoneNumber(vCardLines[j], contact, ContactPhoneNumberType.WORK)
					} else if (tagAndTypeString.indexOf("FAX") > (-1)) {
						_addPhoneNumber(vCardLines[j], contact, ContactPhoneNumberType.FAX)
					} else if (tagAndTypeString.indexOf("CELL") > (-1)) {
						_addPhoneNumber(vCardLines[j], contact, ContactPhoneNumberType.MOBILE)
					} else {
						_addPhoneNumber(vCardLines[j], contact, ContactPhoneNumberType.OTHER)
					}
					break
				case "URL":
				case "item1.URL":// necessary for apple vcards
				case "item2.URL":// necessary for apple vcards
					let website = createContactSocialId()
					website.type = ContactSocialType.OTHER
					website.socialId = vCardLines[j].substring(indexAfterTag + 1)
					website.customTypeName = ""
					contact.socialIds.push(website)
					break
				case "NICKNAME":
					/*let nick=vCardLines[j].substring(vCardLines[j].indexOf(":") + 1)
					 nick= vCardReescapingArray(vCardEscapingSplit(nick))
					 contact.nickName=nick.join(" ")*///IM DATENMODEL NOCH NICHT VORHANDEN
					break
				case "PHOTO":
					/*Here will be the photo import*/
					break
				case "TITLE":
				case "ROLE":
					let titel = vCardLines[j].substring(indexAfterTag + 1)
					titel = vCardReescapingArray(vCardEscapingSplit(titel))
					contact.title += ((contact.title.length > 0) ? " " : "") + titel.join(" ")
					break
				default:

			}
		}
		contact.comment += ((contact.comment == "") ? "" : "\n\n") + lang.get("vCardDateOfImportInComment_msg", {"{date}": new Date().toDateString()})
		contacts[i] = contact
	}

	function _addAddress(vCardAddressLine: string, contact: Contact, type: ContactAddressTypeEnum) {
		let address = createContactAddress()
		address.type = type
		let addressDetails = vCardAddressLine.substring(vCardAddressLine.indexOf(":") + 1)
		addressDetails = vCardReescapingArray(vCardEscapingSplitAdr(addressDetails))
		address.address = addressDetails.join("").trim()
		address.customTypeName = ""
		contact.addresses.push(address)
	}

	function _addPhoneNumber(vCardPhoneNumberLine: string, contact: Contact, type: ContactPhoneNumberTypeEnum) {
		let phoneNumber = createContactPhoneNumber()
		phoneNumber.type = type
		let tel = vCardPhoneNumberLine.substring(vCardPhoneNumberLine.indexOf(":") + 1)
		if (tel.indexOf(":") > -1) {
			tel = tel.substring(tel.indexOf(":") + 1)
			phoneNumber.number = tel
		} else {
			phoneNumber.number = tel
		}
		phoneNumber.customTypeName = ""
		contact.phoneNumbers.push(phoneNumber)
	}

	function _addMailAddress(vCardMailAddressLine: string, contact: Contact, type: ContactAddressTypeEnum) {
		let email = createContactMailAddress()
		email.type = type
		email.address = vCardMailAddressLine.substring(vCardMailAddressLine.indexOf(":") + 1)
		email.customTypeName = ""
		contact.mailAddresses.push(email)
	}

	return contacts
}