// @flow
import {Button, ButtonType} from "../gui/base/Button"
import m from "mithril"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Dialog} from "../gui/base/Dialog"
import {windowFacade} from "../misc/WindowFacade"
import {Icons} from "../gui/base/icons/Icons"
import type {
	ContactComparisonResultEnum,
	ContactMergeActionEnum,
	IndifferentContactComparisonResultEnum
} from "../api/common/TutanotaConstants"
import {
	ContactComparisonResult,
	ContactMergeAction,
	IndifferentContactComparisonResult
} from "../api/common/TutanotaConstants"
import {update} from "../api/main/Entity"
import {lang} from "../misc/LanguageViewModel"
import {TextField, Type as TextFieldType} from "../gui/base/TextField"
import {getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel} from "./ContactUtils"
import {formatDateWithMonth} from "../misc/Formatter"
import {defer, neverNull} from "../api/common/utils/Utils"

export class MergeView {
	view: Function;
	dialog: Dialog;
	contact1: Contact;
	contact2: Contact;
	resolveFunction: Function; // must be called after the user action

	constructor(contact1: Contact, contact2: Contact) {
		this.contact1 = contact1
		this.contact2 = contact2

		// following code prepares c1 and c2 for rendering in mithrill
		let mergeButton = new Button("mergeContact_action", () => {
			this._close(ContactMergeAction.Merge)
		}).setType(ButtonType.Login)
		let delButton1 = new Button('delete_action', () => {
			Dialog.confirm("deleteContact_msg").then((confirmed) => {
				if (confirmed) {
					this._close(ContactMergeAction.DeleteFirst)
				}
			})
		}, () => Icons.Trash)
		let delButton2 = new Button('delete_action', () => {
			Dialog.confirm("deleteContact_msg").then((confirmed) => {
				if (confirmed) {
					this._close(ContactMergeAction.DeleteSecond)
				}
			})
		}, () => Icons.Trash)
		let headerBar = new DialogHeaderBar()
			.addLeft(new Button('cancel_action', () => {
				this._close(ContactMergeAction.Cancel)
			}).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get("mergeView_label"))
			.addRight(new Button('next_action', () => {
				this._close(ContactMergeAction.Skip)
			}).setType(ButtonType.Primary))

		let mailAddresses1 = this.contact1.mailAddresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()

		})
		let phones1 = this.contact1.phoneNumbers.map(element => {
			return new TextField(() => getContactPhoneNumberTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
		})
		let addresses1 = this.contact1.addresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
		})
		let socials1 = this.contact1.socialIds.map(element => {
			return new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
		})

		let mailAddresses2 = this.contact2.mailAddresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
		})
		let phones2 = this.contact2.phoneNumbers.map(element => {
			return new TextField(() => getContactPhoneNumberTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
		})
		let addresses2 = this.contact2.addresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
		})
		let socials2 = this.contact2.socialIds.map(element => {
			return new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
		})

		let titleFields = this._createTextFields(this.contact1.title, this.contact2.title, "title_placeholder")


		let comment1Field = null
		let comment2Field = null
		if (this.contact1.comment || this.contact2.comment) {
			comment1Field = new TextField("comment_label").setValue(this.contact1.comment).setDisabled().setType(TextFieldType.Area)
			comment2Field = new TextField("comment_label").setValue(this.contact2.comment).setDisabled().setType(TextFieldType.Area)
		}

		this.view = () => {
			return m("#contact-editor", [

				m("", {style: {width: "120px", margin: "5px auto", paddingTop: "16px"}}, [m("", [m(mergeButton)])]),
				m(".wrapping-row", [
					m(""/*first contact */, [
						m(".items-center", [
							m(".items-base.flex", [
								m(".h4.mt-l", lang.get("firstMergeContact_placeholder")),
								m(delButton1)
							]),
							m(".small", lang.get("hereIsTheMergedConatct_msg")),
						])
					]),
					m(""/*second contact */, [
						m(".items-center", [
							m(".items-base.flex", [
								m(".h4.mt-l", lang.get("secondMergeContact_placeholder")),
								m(delButton2)
							]),
							m(".small", "test")
						]),
					])
				]),
				titleFields ? m(".wrapping-row", [
						m(titleFields[0]),
						m(titleFields[1])
					]) : null,
				this.contact1.firstName || this.contact2.firstName ? m(".wrapping-row", [
						this.contact1.firstName ? m(new TextField("firstName_placeholder").setValue(this.contact1.firstName).setDisabled()) : m(new TextField("firstName_placeholder").setValue("").setDisabled()),
						this.contact2.firstName ? m(new TextField("firstName_placeholder").setValue(this.contact2.firstName).setDisabled()) : m(new TextField("firstName_placeholder").setValue("").setDisabled())
					]) : null,
				this.contact1.lastName || this.contact2.lastName ? m(".wrapping-row", [
						this.contact1.lastName ? m(new TextField("lastName_placeholder").setValue(this.contact1.lastName).setDisabled()) : m(new TextField("lastName_placeholder").setValue("").setDisabled()),
						this.contact2.lastName ? m(new TextField("lastName_placeholder").setValue(this.contact2.lastName).setDisabled()) : m(new TextField("lastName_placeholder").setValue("").setDisabled())
					]) : null,
				this.contact1.nickname || this.contact2.nickname ? m(".wrapping-row", [
						this.contact1.nickname ? m(new TextField("nickname_placeholder").setValue(this.contact1.nickname).setDisabled()) : m(new TextField("nickname_placeholder").setValue("").setDisabled()),
						this.contact2.nickname ? m(new TextField("nickname_placeholder").setValue(this.contact2.nickname).setDisabled()) : m(new TextField("nickname_placeholder").setValue("").setDisabled())
					]) : null,
				this.contact1.oldBirthday || this.contact2.oldBirthday ? m(".wrapping-row", [
						this.contact1.oldBirthday ? m(new TextField("birthday_alt").setValue(formatDateWithMonth((this.contact1.oldBirthday:any))).setDisabled()) : m(new TextField("birthday_alt").setValue(null).setDisabled()),
						this.contact2.oldBirthday ? m(new TextField("birthday_alt").setValue(formatDateWithMonth((this.contact2.oldBirthday:any))).setDisabled()) : m(new TextField("birthday_alt").setValue(null).setDisabled())
					]) : null,
				this.contact1.company || this.contact2.company ? m(".wrapping-row", [
						this.contact1.company ? m(new TextField("company_placeholder").setValue(this.contact1.company).setDisabled()) : m(new TextField("company_placeholder").setValue("").setDisabled()),
						this.contact2.company ? m(new TextField("company_placeholder").setValue(this.contact2.company).setDisabled()) : m(new TextField("company_placeholder").setValue("").setDisabled())]) : null,
				this.contact1.role || this.contact2.role ? m(".wrapping-row", [
						this.contact1.role ? m(new TextField("role_placeholder").setValue(this.contact1.role).setDisabled()) : m(new TextField("role_placeholder").setValue("").setDisabled()),
						this.contact2.role ? m(new TextField("role_placeholder").setValue(this.contact2.role).setDisabled()) : m(new TextField("role_placeholder").setValue("").setDisabled())
					]) : null,
				mailAddresses1.length > 0 || mailAddresses2.length > 0 ? m(".wrapping-row", [
						m(".mail.mt-l", [
							m("", lang.get('email_label')),
							m(".aggregateEditors", [
								mailAddresses1.length > 0 ? mailAddresses1.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()),
							])
						]),
						m(".mail.mt-l", [
							m("", lang.get('email_label')),
							m(".aggregateEditors", [
								mailAddresses2.length > 0 ? mailAddresses2.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()),
							])
						]),
					]) : null,
				phones1.length > 0 || phones2.length > 0 ? m(".wrapping-row", [
						m(".phone.mt-l", [
							m("", lang.get('phone_label')),
							m(".aggregateEditors", [
								phones1.length > 0 ? phones1.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()),
							])
						]),
						m(".phone.mt-l", [
							m("", lang.get('phone_label')),
							m(".aggregateEditors", [
								phones2.length > 0 ? phones2.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()),
							])
						]),
					]) : null,
				addresses1.length > 0 || addresses2.length > 0 ? m(".wrapping-row", [
						m(".address.mt-l", [
							m("", lang.get('address_label')),
							m(".aggregateEditors", addresses1.length > 0 ? addresses1.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()))
						]),
						m(".address.mt-l", [
							m("", lang.get('address_label')),
							m(".aggregateEditors", addresses2.length > 0 ? addresses2.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()))
						]),
					]) : null,
				socials1.length > 0 || socials2.length > 0 ? m(".wrapping-row", [
						m(".social.mt-l", [
							m("", lang.get('social_label')),
							m(".aggregateEditors", socials1.length > 0 ? socials1.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()))
						]),
						m(".social.mt-l", [
							m("", lang.get('social_label')),
							m(".aggregateEditors", socials2.length > 0 ? socials2.map(ma => m(ma)) : m(new TextField("emptyString_msg").setValue("").setDisabled()))
						]),
					]) : null,
				(comment1Field && comment2Field) ? m(".wrapping-row", [
						m(".mt-l", [
							m(comment1Field)
						]),
						m(".mt-l", [
							m(comment2Field)
						]),
					]) : null, m("", {style: {height: "5px"}}),
				this.contact1.presharedPassword || this.contact2.presharedPassword ? m(".wrapping-row", [
						m(".phone.mt-l", [
							m("", lang.get("presharedPassword_label")),
							m(".aggregateEditors", this.contact1.presharedPassword && this.contact1.presharedPassword.length > 0 ? m(new TextField("presharedPassword_label").setValue("***").setDisabled()) : m(new TextField("presharedPassword_label").setValue("").setDisabled())),
						]),
						m(".phone.mt-l", [
							m("", lang.get("presharedPassword_label")),//todo testen im client geht mit meinem Stand noch nicht.
							m(".aggregateEditors", this.contact2.presharedPassword && this.contact2.presharedPassword.length > 0 ? m(new TextField("presharedPassword_label").setValue("***").setDisabled()) : m(new TextField("presharedPassword_label").setValue("").setDisabled())),
						]),
					]) : null, m("", {style: {height: "5px"}}),
			])
		}

		this.dialog = Dialog.largeDialog(headerBar, this)
	}

	_createTextFields(value1: ?string, value2: ?string, labelTextId: string): ?TextField[] {
		if (value1 || value2) {
			return [
				new TextField(labelTextId).setValue(value1 ? value1 : "").setDisabled(),
				new TextField(labelTextId).setValue(value2 ? value2 : "").setDisabled()
			]
		} else {
			return null
		}
	}

	show(): Promise<ContactMergeActionEnum> {
		this.dialog.show()
		windowFacade.checkWindowClosing(true)
		let d = defer()
		this.resolveFunction = d.resolve
		return d.promise
	}

	_close(action: ContactMergeActionEnum): void {
		windowFacade.checkWindowClosing(false)
		this.dialog.close()
		Promise.delay(200).then(() => {
			this.resolveFunction(action)
		})
	}
}

/**
 * returns all contacts that are deletable because another contact exists that is exactly the same, and all contacts that look similar and therfore may be merged.
 * contacts are never returned in both "mergable" and "deletable"
 * contact similarity is checked transitively, i.e. if a similar to b and b similar to c, then a similar to c
 */
export function getMergeableContacts(inputContacts: Contact[]): {mergeable:Contact[][], deletable: Contact[]} {
	let mergableContacts = []
	let duplicateContacts = []
	let contacts = inputContacts.slice()

	let firstContactIndex = 0
	while (firstContactIndex < contacts.length - 1) {
		let currentMergableContacts = []
		let firstContact = contacts[firstContactIndex]
		currentMergableContacts.push(firstContact)
		let secondContactIndex = firstContactIndex + 1
		// run through all contacts after the first and compare them with the first (+ all others already in the currentMergableArray)
		while (secondContactIndex < contacts.length) {
			let secondContact = contacts[secondContactIndex]
			if (firstContact._id[1] != secondContact._id[1]) { // should not happen, just to be safe
				let overallResult = ContactComparisonResult.Unique
				// compare the current second contact with all in the currentMergableArray to find out if the overall comparison result is equal, similar or unique
				for (let i = 0; i < currentMergableContacts.length; i++) {
					let result = _compareContactsForMerge(currentMergableContacts[i], secondContact)
					if (result == ContactComparisonResult.Equal) {
						overallResult = ContactComparisonResult.Equal
						break // equal is always the final result
					} else if (result == ContactComparisonResult.Similar) {
						overallResult = ContactComparisonResult.Similar
						// continue checking the other contacts in currentMergableContacts to see if there is an equal one
					} else {
						// the contacts are unique, so we do not have to check the others
						break
					}
				}
				if (overallResult == ContactComparisonResult.Equal) {
					duplicateContacts.push(secondContact)
					contacts.splice(secondContactIndex, 1)
				} else if (overallResult == ContactComparisonResult.Similar) {
					currentMergableContacts.push(secondContact)
					contacts.splice(secondContactIndex, 1)
				} else {
					secondContactIndex++
				}
			}
		}
		if (currentMergableContacts.length > 1) {
			mergableContacts.push(currentMergableContacts)
		}
		firstContactIndex++
	}

	return {mergeable: mergableContacts, deletable: duplicateContacts}
}

/**
 * merges two contacts c1~c2 => c2 is merged into c1
 */
export function mergeContacts(contact1: Contact, contact2: Contact): Promise<void> {
	contact1.firstName = _getMergedNameField(contact1.firstName, contact2.firstName)
	contact1.lastName = _getMergedNameField(contact1.lastName, contact2.lastName)
	contact1.title = neverNull(_getMergedOtherField(contact1.title, contact2.title, ", "))
	contact1.comment = neverNull(_getMergedOtherField(contact1.comment, contact2.comment, "\n\n"))
	contact1.company = neverNull(_getMergedOtherField(contact1.company, contact2.company, ", "))
	contact1.nickname = _getMergedOtherField(contact1.nickname, contact2.nickname, ", ")
	contact1.role = neverNull(_getMergedOtherField(contact1.role, contact2.role, ", "))
	contact1.oldBirthday = _getMergedOldBirthday(contact1.oldBirthday, contact2.oldBirthday)
	contact1.birthday = _getMergedBirthday(contact1.birthday, contact2.birthday)
	contact1.mailAddresses = _getMergedEmailAddresses(contact1.mailAddresses, contact2.mailAddresses)
	contact1.phoneNumbers = _getMergedPhoneNumbers(contact1.phoneNumbers, contact2.phoneNumbers)
	contact1.socialIds = _getMergedSocialIds(contact1.socialIds, contact2.socialIds)
	contact1.addresses = _getMergedAddresses(contact1.addresses, contact2.addresses)
	contact1.presharedPassword = neverNull(_getMergedOtherField(contact1.presharedPassword, contact2.presharedPassword, "")) // the passwords are never different and not null
	return update(contact1)
}

/**
 * Result is unique if preshared passwords are not equal  are not empty.
 * Result is equal if all fields are equal or empty (types are ignored).
 * Result is similar if one of:
 * 1. name result is equal or similar
 * 2. name result (bothEmpty or oneEmpty) and mail or phone result is similar or equal
 * Otherwise the result is unique
 * Export for testing
 */
export function _compareContactsForMerge(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let nameResult = _compareFullName(contact1, contact2)
	let mailResult = _compareMailAddresses(contact1.mailAddresses, contact2.mailAddresses)
	let phoneResult = _comparePhoneNumbers(contact1.phoneNumbers, contact2.phoneNumbers)
	let residualContactFieldsEqual = _areResidualContactFieldsEqual(contact1, contact2)

	if (!contact1.presharedPassword || !contact2.presharedPassword || (contact1.presharedPassword == contact2.presharedPassword)) {
		if ((nameResult == ContactComparisonResult.Equal || nameResult == IndifferentContactComparisonResult.BothEmpty) && (mailResult == ContactComparisonResult.Equal || mailResult == IndifferentContactComparisonResult.BothEmpty) && (phoneResult == ContactComparisonResult.Equal || phoneResult == IndifferentContactComparisonResult.BothEmpty) && residualContactFieldsEqual) {
			return ContactComparisonResult.Equal
		} else if (nameResult == ContactComparisonResult.Equal || nameResult == ContactComparisonResult.Similar) {
			return ContactComparisonResult.Similar
		} else if ((nameResult == IndifferentContactComparisonResult.BothEmpty || nameResult == IndifferentContactComparisonResult.OneEmpty) && (mailResult == ContactComparisonResult.Similar || phoneResult == ContactComparisonResult.Similar || mailResult == ContactComparisonResult.Equal || phoneResult == ContactComparisonResult.Equal)) {
			return ContactComparisonResult.Similar
		} else {
			return ContactComparisonResult.Unique
		}
	} else {
		return ContactComparisonResult.Unique
	}
}

/**
 * Names are equal if the last names are available and equal and first names are equal or first names are available and equal and last names are equal.
 * Names are similar if the last names are available and equal and at least one first name is empty or like equal but case insensitive.
 * Returns null if the contacts names are not comparable, i.e. one of the contacts first and last names are empty.
 * Export for testing
 */
export function _compareFullName(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	if (contact1.firstName == contact2.firstName && contact1.lastName == contact2.lastName && (contact1.lastName || contact1.firstName)) {
		return ContactComparisonResult.Equal
	} else if ((!contact1.firstName && !contact1.lastName) && (!contact2.firstName && !contact2.lastName)) {
		return IndifferentContactComparisonResult.BothEmpty
	} else if ((!contact1.firstName && !contact1.lastName) || (!contact2.firstName && !contact2.lastName)) {
		return IndifferentContactComparisonResult.OneEmpty
	} else if (contact1.firstName.toLowerCase() == contact2.firstName.toLowerCase() && contact1.lastName.toLowerCase() == contact2.lastName.toLowerCase() && contact1.lastName) {
		return ContactComparisonResult.Similar
	} else if (((!contact1.firstName || !contact2.firstName) && (contact1.lastName.toLowerCase() == contact2.lastName.toLowerCase())) && contact1.lastName) {
		return ContactComparisonResult.Similar
	} else {
		return ContactComparisonResult.Unique
	}
}

/**
 * Provides name1 if it is not empty, otherwise name2
 */
function _getMergedNameField(name1: string, name2: string) {
	if (name1) {
		return name1
	} else {
		return name2
	}
}

/**
 * If the mail addresses (type is ignored) are all equal (order in array is ignored), the addresses are equal.
 * If at least one mail address is equal and all others are unique, the result is similar. If the mail addresses are equal (only case insensitive), then the result is also similar.
 * If one mail address list is empty, the result is oneEmpty because the mail addresses are not comparable.
 * If both are empty the result is both empty because the mail addresses are not comparable.
 * Otherwise the result is unique.
 * Export for testing
 */
export function _compareMailAddresses(contact1MailAddresses: ContactMailAddress[], contact2MailAddresses: ContactMailAddress[]): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	return _compareValues(contact1MailAddresses.map(m => m.address), contact2MailAddresses.map(m => m.address))
}

function _getMergedEmailAddresses(mailAddresses1: ContactMailAddress[], mailAddresses2: ContactMailAddress[]): ContactMailAddress[] {
	let filteredMailAddresses2 = mailAddresses2.filter(ma2 => {
		return !mailAddresses1.find(ma1 => ma1.address.toLowerCase() == ma2.address.toLowerCase())
	})
	return mailAddresses1.concat(filteredMailAddresses2)
}

/**
 * Export for testing
 */
export function _comparePhoneNumbers(contact1PhoneNumbers: ContactPhoneNumber[], contact2PhoneNumbers: ContactPhoneNumber[]): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	return _compareValues(contact1PhoneNumbers.map(m => m.number), contact2PhoneNumbers.map(m => m.number))
}

function _getMergedPhoneNumbers(phoneNumbers1: ContactPhoneNumber[], phoneNumbers2: ContactPhoneNumber[]): ContactPhoneNumber[] {
	let filteredNumbers2 = phoneNumbers2.filter(ma2 => {
		return !phoneNumbers1.find(ma1 => ma1.number == ma2.number)
	})
	return phoneNumbers1.concat(filteredNumbers2)
}

/**
 * used for clarifying of the unique and equal cases in compareContacts
 * Export for testing
 * returns similar only if socialids ore addresses are similar. Return of similar is basicaly not needed
 */
export function _areResidualContactFieldsEqual(contact1: Contact, contact2: Contact): boolean {
	return _isEqualOtherField(contact1.comment, contact2.comment) &&
		_isEqualOtherField(contact1.company, contact2.company) &&
		_isEqualOtherField(contact1.nickname, contact2.nickname) &&
		_isEqualOtherField(contact1.role, contact2.role) &&
		_isEqualOtherField(contact1.title, contact2.title) &&
		_isEqualOtherField(contact1.presharedPassword, contact2.presharedPassword) &&
		_isEqualOldBirthday(contact1, contact2) &&
		_isEqualBirthday(contact1, contact2) &&
		_areSocialIdsEqual(contact1.socialIds, contact2.socialIds) &&
		_areAddressesEqual(contact1.addresses, contact2.addresses)
}

export function _areSocialIdsEqual(contact1SocialIds: ContactSocialId[], contact2SocialIds: ContactSocialId[]): boolean {
	let result = _compareValues(contact1SocialIds.map(m => m.socialId), contact2SocialIds.map(m => m.socialId))
	return result == IndifferentContactComparisonResult.BothEmpty || result == ContactComparisonResult.Equal
}

function _getMergedSocialIds(socialIds1: ContactSocialId[], socialIds2: ContactSocialId[]): ContactSocialId[] {
	let filteredSocialIds2 = socialIds2.filter(ma2 => {
		return !socialIds1.find(ma1 => ma1.socialId == ma2.socialId)
	})
	return socialIds1.concat(filteredSocialIds2)
}

export function _areAddressesEqual(contact1Addresses: ContactAddress[], contact2Addresses: ContactAddress[]): boolean {
	let result = _compareValues(contact1Addresses.map(m => m.address), contact2Addresses.map(m => m.address))
	return result == IndifferentContactComparisonResult.BothEmpty || result == ContactComparisonResult.Equal
}

function _getMergedAddresses(addresses1: ContactAddress[], addresses2: ContactAddress[]): ContactAddress[] {
	let filteredAddresses2 = addresses2.filter(ma2 => {
		return !addresses1.find(ma1 => ma1.address == ma2.address)
	})
	return addresses1.concat(filteredAddresses2)
}

function _isEqualOldBirthday(contact1: Contact, contact2: Contact): boolean {
	return (JSON.stringify(contact1.oldBirthday) == JSON.stringify(contact2.oldBirthday))
}

function _getMergedOldBirthday(birthday1: ?Date, birthday2: ?Date): ?Date {
	if (birthday1) {
		return birthday1
	} else {
		return birthday2
	}
}

function _isEqualBirthday(contact1: Contact, contact2: Contact): boolean {
	if (contact1.birthday && contact2.birthday) {
		return contact1.birthday.day == contact2.birthday.day && contact1.birthday.month == contact2.birthday.month && contact1.birthday.year == contact2.birthday.year
	} else {
		return !contact1.birthday && !contact2.birthday
	}
}

function _getMergedBirthday(birthday1: ?Birthday, birthday2: ?Birthday): ?Birthday {
	if (birthday1) {
		return birthday1
	} else {
		return birthday2
	}
}

function _compareValues(values1: string[], values2: string[]): ContactComparisonResultEnum | IndifferentContactComparisonResultEnum {
	if (values1.length == 0 && values2.length == 0) {
		return IndifferentContactComparisonResult.BothEmpty
	} else if (values1.length == 0 || values2.length == 0) {
		return IndifferentContactComparisonResult.OneEmpty
	}
	let equalAddresses = values2.filter(c2 => values1.find(c1 => c1.trim() == c2.trim()))
	if (values1.length == values2.length && values1.length == equalAddresses.length) {
		return ContactComparisonResult.Equal
	}
	let equalAddressesInsensitive = values2.filter(c2 => values1.find(c1 => c1.trim().toLowerCase() == c2.trim().toLowerCase()))
	if (equalAddressesInsensitive.length > 0) {
		return ContactComparisonResult.Similar
	}
	return ContactComparisonResult.Unique
}

/**
 * Returns equal if both values are equal and unique otherwise
 */
function _isEqualOtherField(otherAttribute1: ?string, otherAttribute2: ?string): boolean {
	// regard null as ""
	if (otherAttribute1 == null) {
		otherAttribute1 = ""
	}
	if (otherAttribute2 == null) {
		otherAttribute2 = ""
	}
	return (otherAttribute1 == otherAttribute2)
}

/**
 * Provides the value that exists or both separated by the given separator if both have some content
 */
function _getMergedOtherField(otherAttribute1: ?string, otherAttribute2: ?string, separator: string): ?string {
	if (otherAttribute1 == otherAttribute2) {
		return otherAttribute2
	} else if (otherAttribute1 && otherAttribute2) {
		return (otherAttribute1 + separator + otherAttribute2)
	} else if (!otherAttribute1 && otherAttribute2) {
		return otherAttribute2
	} else {
		return otherAttribute1
	}
}