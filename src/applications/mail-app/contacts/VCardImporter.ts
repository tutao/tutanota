import { assertNotNull, decodeBase64, decodeQuotedPrintable, isEmpty, isNull } from "../../../platform-kit/utils"
import { birthdayToIsoDate, isValidDate } from "../../common/api/common/utils/BirthdayUtils"
import { ParsingError } from "../../common/api/common/error/ParsingError"
import { EnvProvider } from "../../../platform-kit/app-env"
import {
	Birthday,
	Contact,
	ContactAddress,
	ContactCustomDate,
	ContactMailAddress,
	ContactMessengerHandle,
	ContactPhoneNumber,
	ContactPronouns,
	ContactRelationship,
	ContactWebsite,
	createBirthday,
	createContact,
	createContactAddress,
	createContactCustomDate,
	createContactMailAddress,
	createContactMessengerHandle,
	createContactPhoneNumber,
	createContactPronouns,
	createContactRelationship,
	createContactWebsite,
} from "@tutao/entities/tutanota"
import {
	ContactAddressType,
	ContactCustomDateType,
	ContactMessengerHandleType,
	ContactPhoneNumberType,
	ContactRelationshipType,
	ContactWebsiteType,
} from "../../../entities/tutanota/Utils"
import { lang } from "../../../ui/utils/LanguageViewModel"

EnvProvider.assertMainOrNode()

/**
 * split file content with multiple vCards into a list of vCard strings
 * @param vCardFileData
 */
export function vCardFileToVCards(vCardFileData: string): string[] | null {
	let V4 = "\nVERSION:4.0"
	let V3 = "\nVERSION:3.0"
	let V2 = "\nVERSION:2.1"
	let B = "BEGIN:VCARD\n"
	let E = "END:VCARD"
	vCardFileData = vCardFileData.replace(/begin:vcard/g, "BEGIN:VCARD")
	vCardFileData = vCardFileData.replace(/end:vcard/g, "END:VCARD")
	vCardFileData = vCardFileData.replace(/version:2.1/g, "VERSION:2.1")

	if (
		vCardFileData.indexOf("BEGIN:VCARD") > -1 &&
		vCardFileData.indexOf(E) > -1 &&
		(vCardFileData.indexOf(V4) > -1 || vCardFileData.indexOf(V3) > -1 || vCardFileData.indexOf(V2) > -1)
	) {
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
	let array = details.split(";")
	array = array.map((elem) => {
		return elem.trim()
	})
	return array
}

export function vCardReescapingArray(details: string[]): string[] {
	return details.map((a) => {
		a = a.replace(/--bslashbslash\+\+/g, "\\")
		a = a.replace(/--semiColonsemiColon\+\+/g, ";")
		a = a.replace(/--dPunktdPunkt\+\+/g, ":")
		a = a.replace(/\\n/g, "\n")
		a = a.replace(/\\,/g, ",")
		return a
	})
}

export function vCardEscapingSplitAdr(addressDetails: string): string[] {
	addressDetails = addressDetails.replace(/\\\\/g, "--bslashbslash++")
	addressDetails = addressDetails.replace(/\\;/g, "--semiColonsemiColon++")
	let array = addressDetails.split(";")
	return array.map((elem) => {
		if (elem.trim().length > 0) {
			return elem.trim().concat("\n")
		} else {
			// needed for only Space elements in Address
			return ""
		}
	})
}

function _decodeTag(encoding: string, charset: string, text: string): string {
	let decoder = (cs: string, l: string) => l

	switch (encoding.toLowerCase()) {
		case "quoted-printable:":
			decoder = decodeQuotedPrintable
			break

		case "base64:":
			decoder = decodeBase64
	}

	return text
		.split(";")
		.map((line) => decoder(charset, line))
		.join(";")
}

export function getPropertyValue(property: string, tagValue: string) {
	const exp = new RegExp(property + "=(.*?)[:;]", "gi")
	return (Array.from(tagValue.matchAll(exp), (m) => m[1])[0] ?? "").trim()
}

function parseImType(imRawType: string): { imType: ContactMessengerHandleType; customTypeName: string } {
	let imType: ContactMessengerHandleType
	let customTypeName = ""

	switch (imRawType.toLowerCase()) {
		case "telegram":
			imType = ContactMessengerHandleType.TELEGRAM
			break
		case "whatsapp":
			imType = ContactMessengerHandleType.WHATSAPP
			break
		case "signal":
			imType = ContactMessengerHandleType.SIGNAL
			break
		case "discord":
			imType = ContactMessengerHandleType.DISCORD
			break
		case "matrix":
			imType = ContactMessengerHandleType.MATRIX
			break
		default:
			if (imRawType.trim() !== "") {
				imType = ContactMessengerHandleType.CUSTOM
				customTypeName = imRawType.trim()
			} else {
				imType = ContactMessengerHandleType.OTHER
			}
	}
	return { imType, customTypeName }
}

// Returns date as isoString
function parseDate(parseString: string): string | null {
	let indexOfT = parseString.indexOf("T")
	// originally just used for birthday, but Birthday is just year, month, day so using for other dates works
	let dateDetails: Birthday | null = null

	if (parseString.match(/--\d{4}/g)) {
		dateDetails = createBirthday({
			month: parseString.substring(2, 4),
			day: parseString.substring(4, 6),
			year: null,
		})
	} else if (parseString.match(/\d{4}-\d{2}-\d{2}/g)) {
		let bDay = parseString.substring(0, indexOfT !== -1 ? indexOfT : parseString.length).split("-")
		dateDetails = createBirthday({
			year: bDay[0].trim(),
			month: bDay[1].trim(),
			day: bDay[2].trim(),
		})
	} else if (parseString.match(/\d{8}/g)) {
		dateDetails = createBirthday({
			year: parseString.substring(0, 4),
			month: parseString.substring(4, 6),
			day: parseString.substring(6, 8),
		})
	} else if (parseString.match(/--\d{2}-\d{2}/g)) {
		dateDetails = createBirthday({
			month: parseString.substring(2, 4),
			day: parseString.substring(5, 7),
			year: null,
		})
	} else {
		// We do not cover this format
		return null
	}

	if (dateDetails && dateDetails.year === "1111") {
		// we use 1111 as marker if no year has been defined as vcard 3.0 does not support dates without year
		dateDetails.year = null
	}

	try {
		return dateDetails && isValidDate(dateDetails) ? birthdayToIsoDate(dateDetails) : null
	} catch (e) {
		if (e instanceof ParsingError) {
			return null
		} else {
			throw e
		}
	}
}

/**
 * @returns The list of created Contact instances (but not yet saved) or null if vCardFileData is not a valid vCard string.
 */
export function vCardListToContacts(vCardList: string[], ownerGroupId: Id): Contact[] {
	let contacts: Contact[] = []

	for (let i = 0; i < vCardList.length; i++) {
		let lastName: string = ""
		let firstName: string = ""
		let title: string | null = null
		let birthdayIso: string | null = null
		let company: string = ""
		let comment: string = ""
		// unimportableFields: if the line cannot be parsed put it here and at the end it will be added to the comment field
		// This way that data is at least not lost, and the user can decide what to do
		let unimportableFields: string = ""
		let nickname: string | null = null
		let role = ""
		let department = ""
		let middleName = ""
		let suffix = ""
		const addresses: Array<ContactAddress> = []
		const mailAddresses: Array<ContactMailAddress> = []
		const phoneNumbers: Array<ContactPhoneNumber> = []
		const websites: Array<ContactWebsite> = []
		const relationships: Array<ContactRelationship> = []
		const pronouns: Array<ContactPronouns> = []
		const messengerHandles: Array<ContactMessengerHandle> = []
		const customDate: Array<ContactCustomDate> = []
		let vCardLines = vCardList[i].split("\n")
		let items: Map<string, { tagName: "ADR" | "TEL" | "URL" | "EMAIL"; value: string; type: string; typeCustomValue: string }> = new Map<
			string,
			{ tagName: "ADR" | "TEL" | "URL" | "EMAIL"; value: string; type: string; typeCustomValue: string }
		>()

		for (let j = 0; j < vCardLines.length; j++) {
			let indexAfterTag = vCardLines[j].indexOf(":")
			let tagAndTypeString = vCardLines[j].substring(0, indexAfterTag).toUpperCase()
			let tagName = tagAndTypeString.split(";")[0].toUpperCase()
			let tagValue = vCardLines[j].substring(indexAfterTag + 1)
			let encodingObj = vCardLines[j].split(";").find((line) => line.includes("ENCODING="))
			let encoding = encodingObj ? encodingObj.split("=")[1] : ""
			let charsetObj = vCardLines[j].split(";").find((line) => line.includes("CHARSET="))
			let charset = charsetObj ? charsetObj.split("=")[1] : "utf-8"
			tagValue = _decodeTag(encoding, charset, tagValue)
			let itemVal: string | null = null

			if (tagName.startsWith("ITEM")) {
				let itemInfo = tagName.split(".")
				itemVal = itemInfo[0]
				tagName = itemInfo[1]
				if (tagName.includes("LABEL")) {
					if (items.has(itemVal)) {
						let item = assertNotNull(items.get(itemVal))
						// For ContactAddressType and ContactWebsiteType, custom is 3. For phone it is 5
						let customTypeValue = "3"
						if (item.tagName === "TEL") {
							customTypeValue = ContactPhoneNumberType.CUSTOM
						}
						item.type = customTypeValue
						item.typeCustomValue = tagValue
					} else {
						// Not exactly sure what happened, but do not want data loss so add it in comment section
						unimportableFields += vCardLines[j] + "\n"
					}
					continue
				}
			}

			if (tagName.startsWith("X-")) {
				// This is a custom field
				unimportableFields += vCardLines[j] + "\n"
				continue
			}

			switch (tagName) {
				case "N": {
					let nameDetails = vCardReescapingArray(vCardEscapingSplit(tagValue))

					for (let i = nameDetails.length; nameDetails.length < 4; i++) {
						nameDetails.push("")
					}

					lastName = nameDetails[0]
					firstName = nameDetails[1]
					middleName = nameDetails[2]
					title = nameDetails[3]
					suffix = nameDetails[4]
					break
				}

				case "FN":
					//Thunderbird can export FULLNAME tag if that is given with the email address automatic contact creation. If there is no first name or second name the namestring will be saved as full name.
					if (firstName === "" && lastName === "" && title == null && middleName === "" && suffix === "") {
						let fullName = vCardReescapingArray(vCardEscapingSplit(tagValue))
						firstName = fullName.join(" ").replace(/"/g, "") //Thunderbird saves the Fullname in "quoteations marks" they are deleted here
					}

					break

				case "BDAY": {
					const bday = parseDate(tagValue)
					if (isNull(bday)) {
						// was unable to parse for some reason, put it in the comment so the user can see it
						unimportableFields += vCardLines[j]
					} else {
						birthdayIso = bday
					}
					break
				}

				case "ORG": {
					let orgDetails = vCardReescapingArray(vCardEscapingSplit(tagValue))
					for (let i = orgDetails.length; orgDetails.length < 2; i++) {
						orgDetails.push("")
					}

					department = orgDetails.pop() ?? ""
					company = orgDetails.join(" ")
					break
				}

				case "NOTE": {
					let note = vCardReescapingArray(vCardEscapingSplit(tagValue))
					if (comment !== "") {
						comment += "\n"
					}
					comment += note.join(" ")
					break
				}

				case "ADR": {
					let addressType = ContactAddressType.OTHER
					if (tagAndTypeString.indexOf("HOME") > -1) {
						addressType = ContactAddressType.PRIVATE
					} else if (tagAndTypeString.indexOf("WORK") > -1) {
						addressType = ContactAddressType.WORK
					}
					if (isNull(itemVal)) {
						_addAddress(tagValue, addresses, addressType, "")
					} else {
						// We may get more item information later
						items.set(itemVal, { type: addressType, tagName: "ADR", value: tagValue, typeCustomValue: "" })
					}

					break
				}
				case "EMAIL": {
					let emailType = ContactAddressType.OTHER
					if (tagAndTypeString.indexOf("HOME") > -1) {
						emailType = ContactAddressType.PRIVATE
					} else if (tagAndTypeString.indexOf("WORK") > -1) {
						emailType = ContactAddressType.WORK
					}
					if (isNull(itemVal)) {
						_addMailAddress(tagValue, mailAddresses, emailType, "")
					} else {
						// We may get more item information later
						items.set(itemVal, { type: emailType, tagName: "EMAIL", value: tagValue, typeCustomValue: "" })
					}

					break
				}
				case "TEL": {
					tagValue = tagValue.replace(/[\u2000-\u206F]/g, "")

					let phoneType = ContactPhoneNumberType.OTHER

					if (tagAndTypeString.indexOf("HOME") > -1) {
						phoneType = ContactPhoneNumberType.PRIVATE
					} else if (tagAndTypeString.indexOf("WORK") > -1) {
						phoneType = ContactPhoneNumberType.WORK
					} else if (tagAndTypeString.indexOf("FAX") > -1) {
						phoneType = ContactPhoneNumberType.FAX
					} else if (tagAndTypeString.indexOf("CELL") > -1) {
						phoneType = ContactPhoneNumberType.MOBILE
					}

					if (isNull(itemVal)) {
						_addPhoneNumber(tagValue, phoneNumbers, phoneType, "")
					} else {
						// We may get more item information later
						items.set(itemVal, { type: phoneType, tagName: "TEL", value: tagValue, typeCustomValue: "" })
					}

					break
				}
				case "URL": {
					let urlType = ContactWebsiteType.OTHER

					if (tagAndTypeString.indexOf("HOME") > -1) {
						urlType = ContactWebsiteType.PRIVATE
					} else if (tagAndTypeString.indexOf("WORK") > -1) {
						urlType = ContactWebsiteType.WORK
					}

					if (isNull(itemVal)) {
						addWebsite(tagValue, websites, urlType, "")
					} else {
						// We may get more item information later
						items.set(itemVal, { type: urlType, tagName: "URL", value: tagValue, typeCustomValue: "" })
					}

					break
				}
				case "NICKNAME": {
					let nick = vCardReescapingArray(vCardEscapingSplit(tagValue))
					nickname = nick.join(" ")
					break
				}

				case "PHOTO":
					// if (indexAfterTag < tagValue.indexOf(":")) {
					// 	indexAfterTag = tagValue.indexOf(":")
					// }
					// /*Here will be the photo import*/
					break

				case "ROLE":
				case "TITLE": {
					let vcardRole = vCardReescapingArray(vCardEscapingSplit(tagValue))
					role += (" " + vcardRole.join(" ")).trim()
					break
				}

				// The content bellow this comment is present only on vCard 4.0+ - RFC 6350
				case "RELATED": {
					let type = ContactRelationshipType.OTHER
					const vCardPropertyType = getPropertyValue("TYPE", tagAndTypeString).toLowerCase()
					if (vCardPropertyType === "friend") {
						type = ContactRelationshipType.FRIEND
					} else if (vCardPropertyType === "child") {
						type = ContactRelationshipType.CHILD
					} else if (vCardPropertyType === "parent") {
						type = ContactRelationshipType.PARENT
					} else if (vCardPropertyType === "spouse") {
						type = ContactRelationshipType.SPOUSE
					}

					addRelationship(tagValue, relationships, type)
					break
				}

				case "PRONOUNS": {
					const lang = getPropertyValue("LANG", tagAndTypeString)
					addPronouns(tagValue, pronouns, lang)
					break
				}

				case "IMPP": {
					const imRawType = getPropertyValue("TYPE", tagAndTypeString)
					const { imType, customTypeName } = parseImType(imRawType)
					// Remove the im:/xmpp: added by the vcard standard
					const handleData = tagValue.indexOf(":") > -1 ? tagValue.substring(tagValue.indexOf(":") + 1) : tagValue
					addMessengerHandle(handleData, messengerHandles, imType, customTypeName)
					break
				}
				case "ANNIVERSARY": {
					const anniDate = parseDate(tagValue)
					if (isNull(anniDate)) {
						// was unable to parse for some reason, put it in the comment so the user can see it
						unimportableFields += vCardLines[j]
					} else {
						customDate.push(createContactCustomDate({ dateIso: anniDate, type: ContactCustomDateType.ANNIVERSARY, customTypeName: "" }))
					}
					break
				}
				case "VERSION":
				case "UID":
					// We do not care about these lines and they do not need to be reported to the user
					break
				default:
					unimportableFields += vCardLines[j]
					break
			}
		}

		for (let item of items.values()) {
			switch (item.tagName) {
				case "ADR":
					_addAddress(item.value, addresses, item.type as ContactAddressType, item.typeCustomValue)
					break
				case "EMAIL":
					_addMailAddress(item.value, mailAddresses, item.type as ContactAddressType, item.typeCustomValue)
					break
				case "TEL":
					_addPhoneNumber(item.value, phoneNumbers, item.type as ContactPhoneNumberType, item.typeCustomValue)
					break
				case "URL":
					addWebsite(item.value, websites, item.type as ContactWebsiteType, item.typeCustomValue)
			}
		}

		if (unimportableFields !== "") {
			comment += "\n\n" + lang.getTranslationText("couldNotImportContactField_msg") + "\n"
			comment += unimportableFields
		}

		contacts[i] = createContact({
			lastName,
			firstName,
			title,
			birthdayIso,
			company,
			comment,
			nickname,
			role,
			addresses,
			mailAddresses,
			phoneNumbers,
			department,
			middleName,
			websites,
			relationships,
			pronouns,
			messengerHandles,
			nameSuffix: suffix,
			phoneticFirst: null,
			phoneticLast: null,
			phoneticMiddle: null,
			customDate,
			socialIds: [],
			presharedPassword: null,
			photo: null,
			oldBirthdayDate: null,
			oldBirthdayAggregate: null,
		})
		contacts[i]._id = ["dummyContactListId", "dummyContactElementId" + i]
		contacts[i]._ownerGroup = ownerGroupId
	}

	function _addAddress(vCardAddressValue: string, addresses: Array<ContactAddress>, type: ContactAddressType, customName: string) {
		let addressDetails = vCardReescapingArray(vCardEscapingSplitAdr(vCardAddressValue))
		let address = createContactAddress({
			type: type,
			address: addressDetails.join("").trim(),
			customTypeName: customName,
		})
		addresses.push(address)
	}

	function _addPhoneNumber(vCardPhoneNumberValue: string, phoneNumbers: Array<ContactPhoneNumber>, type: ContactPhoneNumberType, customTypeName: string) {
		let phoneNumber = createContactPhoneNumber({
			type: type,
			number: vCardPhoneNumberValue,
			customTypeName,
		})
		phoneNumbers.push(phoneNumber)
	}

	function _addMailAddress(vCardMailAddressValue: string, mailAddresses: Array<ContactMailAddress>, type: ContactAddressType, customTypeName: string) {
		let email = createContactMailAddress({
			type: type,
			address: vCardMailAddressValue,
			customTypeName,
		})
		mailAddresses.push(email)
	}

	function addRelationship(relationshipPerson: string, relationships: Array<ContactRelationship>, type: ContactRelationshipType) {
		const relationship = createContactRelationship({
			type: type,
			person: relationshipPerson,
			customTypeName: "",
		})
		relationships.push(relationship)
	}

	function addPronouns(pronouns: string, pronounsArray: Array<ContactPronouns>, lang: string) {
		const pronounsToAdd = createContactPronouns({
			language: lang,
			pronouns,
		})
		pronounsArray.push(pronounsToAdd)
	}

	function addMessengerHandle(handle: string, messengerHandleArray: Array<ContactMessengerHandle>, type: ContactMessengerHandleType, customTypeName: string) {
		const newHandle = createContactMessengerHandle({
			handle,
			type,
			customTypeName,
		})
		messengerHandleArray.push(newHandle)
	}

	function addWebsite(tagValue: string, websites: Array<ContactWebsite>, type: ContactWebsiteType, customTypeName: string) {
		let website = createContactWebsite({
			type,
			url: vCardReescapingArray(vCardEscapingSplit(tagValue)).join(""),
			customTypeName,
		})
		websites.push(website)
	}

	return contacts
}
