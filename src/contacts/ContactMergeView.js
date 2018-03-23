// @flow
import {Button, ButtonType} from "../gui/base/Button"
import m from "mithril"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Dialog} from "../gui/base/Dialog"
import {windowFacade} from "../misc/WindowFacade"
import {Icons} from "../gui/base/icons/Icons"
import type {ContactComparisonResultEnum, ContactMergeActionEnum} from "../api/common/TutanotaConstants"
import {ContactComparisonResult, ContactMergeAction} from "../api/common/TutanotaConstants"
import {update} from "../api/main/Entity"
import {createContact} from "../api/entities/tutanota/Contact"
import {lang} from "../misc/LanguageViewModel"
import {createBirthday} from "../api/entities/tutanota/Birthday"
import {TextField} from "../gui/base/TextField"
import {getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel} from "./ContactUtils"
import {formatDateWithMonth} from "../misc/Formatter"
import {defer} from "../api/common/utils/Utils"

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
		let mailAddresses1
		let phones1
		let addresses1
		let socials1
		mailAddresses1 = this.contact1.mailAddresses.map(element => {
			let showMail = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
			return showMail
		})
		phones1 = this.contact1.phoneNumbers.map(element => {
			let showPhone = new TextField(() => getContactPhoneNumberTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
			return showPhone
		})
		addresses1 = this.contact1.addresses.map(element => {
			let showAddress = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
			return showAddress
		})
		socials1 = this.contact1.socialIds.map(element => {
			let showURL = new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
			return showURL
		})
		let mailAddresses2
		let phones2
		let addresses2
		let socials2
		mailAddresses2 = this.contact2.mailAddresses.map(element => {
			let textField = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
			return textField
		})
		phones2 = this.contact2.phoneNumbers.map(element => {
			let textField = new TextField(() => getContactPhoneNumberTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
			return textField
		})
		addresses2 = this.contact2.addresses.map(element => {
			let showAddress = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
			return showAddress
		})
		socials2 = this.contact2.socialIds.map(element => {
			let showURL = new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
			return showURL
		})
		this.view = () => {
			return m("#contact-editor", [

				m("", {style: {width: "120px", margin: "5px auto", paddingTop: "16px"}}, [m("", [m(mergeButton)])]),
				m(".wrapping-row", [
					m(""/*first contact */, [
						m("", [
							m(".items-center", [
								m(".items-base.flex", [
									m(".h4.mt-l", lang.get("firstMergeContact_placeholder")),
									m(delButton1)
								]),
								m(".small", lang.get("hereIsTheMergedConatct_msg")),
							])
						])
					]),
					m(""/*second contact */, [
						m("", [
							m(".items-center", [
								m(".items-base.flex", [
									m(".h4.mt-l", lang.get("secondMergeContact_placeholder")),
									m(delButton2)
								]),
								m(".small", /*hier kann noch ne kleine beschreibung stehen*/)
							]),
						])
					])
				]),
				this.contact1.title || this.contact2.title ? m(".wrapping-row2", [
						this.contact1.title ? m(new TextField("title_placeholder").setValue(this.contact1.title).setDisabled()) : m(new TextField("title_placeholder").setValue("").setDisabled()),
						this.contact2.title ? m(new TextField("title_placeholder").setValue(this.contact2.title).setDisabled()) : m(new TextField("title_placeholder").setValue("").setDisabled())
					]) : null,
				this.contact1.firstName || this.contact2.firstName ? m(".wrapping-row2", [
						this.contact1.firstName ? m(new TextField("firstName_placeholder").setValue(this.contact1.firstName).setDisabled()) : m(new TextField("firstName_placeholder").setValue("").setDisabled()),
						this.contact2.firstName ? m(new TextField("firstName_placeholder").setValue(this.contact2.firstName).setDisabled()) : m(new TextField("firstName_placeholder").setValue("").setDisabled())
					]) : null,
				this.contact1.lastName || this.contact2.lastName ? m(".wrapping-row2", [
						this.contact1.lastName ? m(new TextField("lastName_placeholder").setValue(this.contact1.lastName).setDisabled()) : m(new TextField("lastName_placeholder").setValue("").setDisabled()),
						this.contact2.lastName ? m(new TextField("lastName_placeholder").setValue(this.contact2.lastName).setDisabled()) : m(new TextField("lastName_placeholder").setValue("").setDisabled())
					]) : null,
				this.contact1.nickname || this.contact2.nickname ? m(".wrapping-row2", [
						this.contact1.nickname ? m(new TextField("nickname_placeholder").setValue(this.contact1.nickname).setDisabled()) : m(new TextField("nickname_placeholder").setValue("").setDisabled()),
						this.contact2.nickname ? m(new TextField("nickname_placeholder").setValue(this.contact2.nickname).setDisabled()) : m(new TextField("nickname_placeholder").setValue("").setDisabled())
					]) : null,
				this.contact1.oldBirthday || this.contact2.oldBirthday ? m(".wrapping-row2", [
						this.contact1.oldBirthday ? m(new TextField("birthday_alt").setValue(formatDateWithMonth((this.contact1.oldBirthday:any))).setDisabled()) : m(new TextField("birthday_alt").setValue(null).setDisabled()),
						this.contact2.oldBirthday ? m(new TextField("birthday_alt").setValue(formatDateWithMonth((this.contact2.oldBirthday:any))).setDisabled()) : m(new TextField("birthday_alt").setValue(null).setDisabled())
					]) : null,
				this.contact1.company || this.contact2.company ? m(".wrapping-row2", [
						this.contact1.company ? m(new TextField("company_placeholder").setValue(this.contact1.company).setDisabled()) : m(new TextField("company_placeholder").setValue("").setDisabled()),
						this.contact2.company ? m(new TextField("company_placeholder").setValue(this.contact2.company).setDisabled()) : m(new TextField("company_placeholder").setValue("").setDisabled())]) : null,
				this.contact1.role || this.contact2.role ? m(".wrapping-row2", [
						this.contact1.role ? m(new TextField("role_placeholder").setValue(this.contact1.role).setDisabled()) : m(new TextField("role_placeholder").setValue("").setDisabled()),
						this.contact2.role ? m(new TextField("role_placeholder").setValue(this.contact2.role).setDisabled()) : m(new TextField("role_placeholder").setValue("").setDisabled())
					]) : null,
				mailAddresses1.length > 0 || mailAddresses2.length > 0 ? m(".wrapping-row2", [
						m(".mail.mt-l", [
							m("", lang.get('email_label')),
							m(".aggregateEditors", [
								mailAddresses1.length > 0 ? mailAddresses1.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()),
							])
						]),
						m(".mail.mt-l", [
							m("", lang.get('email_label')),
							m(".aggregateEditors", [
								mailAddresses2.length > 0 ? mailAddresses2.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()),
							])
						]),
					]) : null,
				phones1.length > 0 || phones2.length > 0 ? m(".wrapping-row2", [
						m(".phone.mt-l", [
							m("", lang.get('phone_label')),
							m(".aggregateEditors", [
								phones1.length > 0 ? phones1.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()),
							])
						]),
						m(".phone.mt-l", [
							m("", lang.get('phone_label')),
							m(".aggregateEditors", [
								phones2.length > 0 ? phones2.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()),
							])
						]),
					]) : null,
				addresses1.length > 0 || addresses2.length > 0 ? m(".wrapping-row2", [
						m(".address.mt-l", [
							m("", lang.get('address_label')),
							m(".aggregateEditors", addresses1.length > 0 ? addresses1.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()))
						]),
						m(".address.mt-l", [
							m("", lang.get('address_label')),
							m(".aggregateEditors", addresses2.length > 0 ? addresses2.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()))
						]),
					]) : null,
				socials1.length > 0 || socials2.length > 0 ? m(".wrapping-row2", [
						m(".social.mt-l", [
							m("", lang.get('social_label')),
							m(".aggregateEditors", socials1.length > 0 ? socials1.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()))
						]),
						m(".social.mt-l", [
							m("", lang.get('social_label')),
							m(".aggregateEditors", socials2.length > 0 ? socials2.map(ma => m(ma)) : m(new TextField("other_label").setValue("").setDisabled()))
						]),
					]) : null,
				this.contact1.comment || this.contact2.comment ? m(".wrapping-row2", [
						m(".phone.mt-l", [
							m("", lang.get("comment_label")),
							m(".aggregateEditors", this.contact1.comment && this.contact1.comment.trim().length > 0 ? m(new TextField("commentContent_lable").setValue(this.contact1.comment).setDisabled()) : m(new TextField("comment_label").setValue("").setDisabled())),
						]),
						m(".phone.mt-l", [
							m("", lang.get("comment_label")),
							m(".aggregateEditors", this.contact2.comment && this.contact2.comment.trim().length > 0 ? m(new TextField("commentContent_lable").setValue(this.contact2.comment).setDisabled()) : m(new TextField("comment_label").setValue("").setDisabled())),
						]),
					]) : null, m("", {style: {height: "5px"}}),
				this.contact1.presharedPassword || this.contact2.presharedPassword ? m(".wrapping-row2", [
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
//merges similar contacts c1~c2=> c2 is merged into c1
export function mergeContacts(contact1: Contact, contact2: Contact): Promise<void> {
	let promise = Promise.resolve()
	contact1.firstName = _getMergedNameField(contact1.firstName, contact2.firstName)
	contact1.lastName = _getMergedNameField(contact1.lastName, contact2.lastName)
	contact1.title = _getMergedOtherField(contact1.title, contact2.title)
	contact1.comment = _getMergedOtherField(contact1.comment, contact2.comment)
	contact1.company = _getMergedOtherField(contact1.company, contact2.company)
	contact1.nickname = _getMergedOtherField(contact1.nickname, contact2.nickname)
	contact1.role = _getMergedOtherField(contact1.role, contact2.role)
	if (contact1.oldBirthday != null || contact2.oldBirthday != null) {
		contact1.oldBirthday = _getMergedOldBirthday(contact1.oldBirthday, contact2.oldBirthday)
	}
	if (contact1.birthday != null || contact2.birthday != null) {
		let birthdayForMerge = _getMergedBirthday(contact1.birthday, contact2.birthday)
		if (birthdayForMerge != null) {
			contact1.birthday = birthdayForMerge
		}
	}
	contact1.mailAddresses = _getMergedEmails(contact1.mailAddresses, contact2.mailAddresses) == null ? contact1.mailAddresses : _getMergedEmails(contact1.mailAddresses, contact2.mailAddresses)
	contact1.phoneNumbers = _getMergedPhoneNumbers(contact1.phoneNumbers, contact2.phoneNumbers) == null ? contact1.phoneNumbers : _getMergedPhoneNumbers(contact1.phoneNumbers, contact2.phoneNumbers)
	contact1.socialIds = _getMergedSocialIds(contact1.socialIds, contact2.socialIds) == null ? contact1.socialIds : _getMergedSocialIds(contact1.socialIds, contact2.socialIds)
	contact1.addresses = _getMergedAddresses(contact1.addresses, contact2.addresses) == null ? contact1.addresses : _getMergedAddresses(contact1.addresses, contact2.addresses)
	if (contact1.presharedPassword != null) {
		contact1.presharedPassword = contact1.presharedPassword
	} else if (contact2.presharedPassword != null) {
		contact1.presharedPassword = contact2.presharedPassword
	} else {
	}
	update(contact1)
	//todo photo:? IdTuple;
	return promise
}
//function returns contacts that wer classified as similar or 100% equal als mergeable and deletable
export function getMergableContacts(allContacts: Contact[]): {mergeable:Array<Contact[]>, deletable: Array<Contact>} {
	let counterMainLoop = allContacts.length - 1
	let counterSubLoop = allContacts.length - 1
	let compareResult = ""
	let mergableContacts = []
	let duplicatContacts = []
	while (counterMainLoop > 0) {
		let mergableMemoryArray = []
		mergableMemoryArray.push(allContacts[counterMainLoop])
		while (counterSubLoop--) {
			if (allContacts[counterMainLoop]._id[1] != allContacts[counterSubLoop]._id[1]) {
				compareResult = compareContactsForMerge(allContacts[counterMainLoop], allContacts[counterSubLoop])
				if (compareResult == "similar") {
					mergableMemoryArray.push(allContacts[counterSubLoop])
					allContacts.splice(counterSubLoop, 1)
					counterMainLoop == 1 ? null : counterMainLoop--
				} else if (compareResult == "equal") {
					duplicatContacts.push(allContacts[counterSubLoop])
					allContacts.splice(counterSubLoop, 1)
					counterMainLoop == 1 ? null : counterMainLoop--
				} else {
				}
			}
		}
		counterSubLoop = allContacts.length
		if (mergableMemoryArray.length > 1) {
			mergableContacts.push(mergableMemoryArray)
		} else {
			mergableMemoryArray = []
		}
		counterMainLoop--
	}

	return {mergeable: mergableContacts, deletable: duplicatContacts}
}
// multiple compare function to find out mergeable contacts. functions are called in getMergeableContacts
export function compareContactsForMerge(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let nameResult = compareFullname(contact1, contact2)
	let mailResult = compareMailAddresses(contact1, contact2)
	let phoneResult = comparePhoneNumbers(contact1, contact2)
	let residualContactResult = compareResidualContactFields(contact1, contact2)
	if (contact1.presharedPassword == null || contact2.presharedPassword == null || (contact1.presharedPassword == contact2.presharedPassword)) {
		if (nameResult == "unique" && (mailResult == "unique" || mailResult == null) && (phoneResult == "unique" || phoneResult == null)) {
			return ContactComparisonResult.Unique
		} else if ((nameResult == "equal" || nameResult == null) && (mailResult == "equal" || mailResult == null) && (phoneResult == "equal" || phoneResult == null) && residualContactResult == "equal") {
			return ContactComparisonResult.Equal
		} else if (nameResult == "equal" && (mailResult == "equal" || mailResult == "unique") && (phoneResult !== "unique")) {
			return ContactComparisonResult.Similar
		} else if (nameResult == "unique" && (mailResult == null || mailResult == "unique")) {
			return ContactComparisonResult.Unique
		} else if (mailResult == "similar") {
			return ContactComparisonResult.Similar
		} else if ((mailResult == "unique" || mailResult == null) && (residualContactResult != "unique" && ((phoneResult == "equal" || phoneResult == "similar") || (nameResult == "equal" || nameResult == "similar")))) {
			return ContactComparisonResult.Similar
		} else if (mailResult == "equal" && (residualContactResult != "unique" && ((phoneResult != "equal" || phoneResult == "similar") || (nameResult != "equal" || nameResult == "similar")))) {
			return ContactComparisonResult.Similar
		} else if (mailResult == "equal" && (residualContactResult == "unique" && ((phoneResult == null || phoneResult == "similar") || (nameResult == null || nameResult == "similar")))) {
			return ContactComparisonResult.Similar
		} else if (mailResult == null && ((phoneResult == "equal" || phoneResult == "similar") || (nameResult == "equal" || nameResult == "similar"))) {
			return ContactComparisonResult.Similar
		} else if (nameResult == "equal" && (mailResult == "equal" || mailResult == "unique") && (phoneResult == "unique" || phoneResult == "equal")) {
			return ContactComparisonResult.Similar
		} else if (nameResult == "similar" && ((mailResult != "unique" ) || (phoneResult != "unique"))) {
			return ContactComparisonResult.Similar
		} else {
			return ContactComparisonResult.Unique
		}
	} else {
		return ContactComparisonResult.Unique
	}

}
export function compareFullname(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | null {
	if (contact1.firstName == contact2.firstName && contact1.lastName == contact2.lastName || ((contact1.firstName == "" && contact1.lastName == "") && (contact2.firstName == "" && contact2.lastName == ""))) {
		if ((contact1.firstName == "" && contact1.lastName == "") || (contact2.firstName == "" && contact2.lastName == "")) {
			return null
		} else {
			return ContactComparisonResult.Equal
		}
	} else if (contact1.firstName.toLowerCase() == contact2.firstName.toLowerCase() && contact1.lastName.toLowerCase() == contact2.lastName.toLowerCase()) {
		return ContactComparisonResult.Similar
	} else if (((contact1.firstName.toLowerCase() == "" || contact2.firstName.toLowerCase() == "") && (contact1.lastName.toLowerCase() == contact2.lastName.toLowerCase())) && (contact1.lastName.toLowerCase() != "" || contact2.lastName.toLowerCase() != "")) {
		return ContactComparisonResult.Similar
	} else {
		if ((contact1.firstName == "" && contact1.lastName == "") || (contact2.firstName == "" && contact2.lastName == "")) {
			return null
		} else {
			return ContactComparisonResult.Unique
		}
	}
}
export function compareMailAddresses(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | null {
	let zaehler = 0
	let lowerCaseZaehler = 0
	let moreAddresses
	let emptyAddress = false
	contact1.mailAddresses.length > contact2.mailAddresses.length ? moreAddresses = contact1.mailAddresses.length : moreAddresses = contact2.mailAddresses.length
	if (((contact1.mailAddresses == undefined || contact1.mailAddresses == null || contact1.mailAddresses.length == 0) && (contact2.mailAddresses == undefined || contact2.mailAddresses == null || contact1.mailAddresses.length == 0))) {
		return null
	} else {
		contact1.mailAddresses.map(ma1 => {
			contact2.mailAddresses.map(ma2 => {
				if ((ma1.address == "" || ma1.address == undefined) && (ma2.address == "" || ma2.address == undefined)) {
					emptyAddress = true
				}
				ma1.address == ma2.address ? zaehler++ : zaehler = zaehler
				ma1.address.toLowerCase() == ma2.address.toLowerCase() ? lowerCaseZaehler++ : lowerCaseZaehler = lowerCaseZaehler
			})
		})
		if ((zaehler > 0 && zaehler < moreAddresses) || zaehler != lowerCaseZaehler) {
			return ContactComparisonResult.Similar
		} else if (zaehler == moreAddresses && emptyAddress == false) {
			return ContactComparisonResult.Equal
		} else if (emptyAddress == true && zaehler == lowerCaseZaehler) {
			return ContactComparisonResult.Unique
		} else if (emptyAddress == true) {
			return null
		} else {
			return ContactComparisonResult.Unique
		}
	}
}
export function comparePhoneNumbers(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | null {
	let zaehler = 0
	let morePhoneNumbers
	let emptyNumbers = false
	let emptyNumber = false
	contact1.phoneNumbers.length > contact2.phoneNumbers.length ? morePhoneNumbers = contact1.phoneNumbers.length : morePhoneNumbers = contact2.phoneNumbers.length

	if (((contact1.phoneNumbers == undefined || contact1.phoneNumbers == null || contact1.phoneNumbers.length == 0) && (contact2.phoneNumbers == undefined || contact2.phoneNumbers == null || contact2.phoneNumbers.length == 0))) {
		return null
	} else {
		contact1.phoneNumbers.map(pn1 => {
			if (pn1.number == undefined && contact2.phoneNumbers == undefined) {
				emptyNumbers = true
			} else if (pn1.number == undefined || contact2.phoneNumbers == undefined) {
				emptyNumber = true
			}
			contact2.phoneNumbers.map(pn2 => {
				if (pn1.number == pn2.number) {
					zaehler++
				}
			})
		})
		if ((zaehler > 0 && zaehler < morePhoneNumbers)) {
			return ContactComparisonResult.Similar
		} else if (zaehler == morePhoneNumbers && emptyNumber == false) {
			return ContactComparisonResult.Equal
		} else if (emptyNumbers) {
			return null
		} else if (emptyNumber) {
			return "onlyOneEmpty" //there is a cases where it should not be null ore one of the ContactComparrisonResults
		} else {
			return ContactComparisonResult.Unique
		}
	}
}
export function compareResidualContactFields(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let comparsionResultArray = []
	// Dient zur absicherund der uniq und equal fälle muss in compare Contacts berücksichtigt werden
	comparsionResultArray.push(compareComment(contact1, contact2))
	comparsionResultArray.push(compareCompany(contact1, contact2))
	comparsionResultArray.push(compareNickname(contact1, contact2))
	comparsionResultArray.push(compareOldBirthday(contact1, contact2))
	comparsionResultArray.push(compareRole(contact1, contact2))
	comparsionResultArray.push(compareTitle(contact1, contact2))
	comparsionResultArray.push(compareOldBirthday(contact1, contact2))
	comparsionResultArray.push(compareBirthday(contact1, contact2))
	comparsionResultArray.push(compareSocialIds(contact1, contact2))
	comparsionResultArray.push(compareAddresses(contact1, contact2))
	comparsionResultArray.push(comparePresharedPassword(contact1, contact2))
	// todo photo compare needs to be done as soon as it will be implemented
	if (comparsionResultArray.indexOf("similar") > 0) {
		return ContactComparisonResult.Similar
	} else if (comparsionResultArray.indexOf("equal") >= 0 && comparsionResultArray.indexOf("unique") == -1) {
		return ContactComparisonResult.Equal
	} else {
		return ContactComparisonResult.Unique
	}
}
export function compareComment(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	if (contact1.comment == contact2.comment) {
		if ((( contact1.comment == null) && (contact2.comment == null))) {
			return ContactComparisonResult.Unique
		} else {
			return ContactComparisonResult.Equal
		}
	} else if (contact1.comment.toLowerCase() == contact2.comment.toLowerCase()) {
		return ContactComparisonResult.Similar
	} else {
		return ContactComparisonResult.Unique
	}
}
export function compareCompany(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	if (contact1.company == contact2.company) {
		if (contact1.company == null && contact2.company == null) {
			return ContactComparisonResult.Unique
		} else {
			return ContactComparisonResult.Equal
		}
	} else if (contact1.company.toLowerCase() == contact2.company.toLowerCase()) {
		return ContactComparisonResult.Similar
	} else
		return ContactComparisonResult.Unique
}
export function compareNickname(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let nickname1 = contact1.nickname ? contact1.nickname : ""
	let nickname2 = contact2.nickname ? contact2.nickname : ""
	if (nickname1 == nickname2) {
		if ((( nickname1 == null) && (nickname2 == null))) {
			return ContactComparisonResult.Unique
		} else {
			return ContactComparisonResult.Equal
		}
	} else if (nickname1.toLowerCase() == nickname2.toLowerCase()) {
		return ContactComparisonResult.Similar
	} else
		return ContactComparisonResult.Unique
}
export function compareOldBirthday(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	if (JSON.stringify(contact1.oldBirthday) == JSON.stringify(contact2.oldBirthday)) {
		return ContactComparisonResult.Equal
		// }
	} else {
		return ContactComparisonResult.Unique
	}
}
export function compareRole(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	if (contact1.role == contact2.role) {
		if ((( contact1.role == null) && ( contact2.role == null))) {
			return ContactComparisonResult.Unique
		} else {
			return ContactComparisonResult.Equal
		}
	} else if (contact1.role.toLowerCase() == contact2.role.toLowerCase()) {
		return ContactComparisonResult.Similar
	} else
		return ContactComparisonResult.Unique
}
export function compareTitle(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let title1 = contact1.title ? contact1.title : ""
	let title2 = contact2.title ? contact2.title : ""
	if (title1 == title2) {
		if (title1 == null && title2 == null) {
			return ContactComparisonResult.Unique
		} else {
			return ContactComparisonResult.Equal
		}
	} else if (title1.toLowerCase() == title2.toLowerCase()) {
		return ContactComparisonResult.Similar
	} else
		return ContactComparisonResult.Unique
}
export function compareBirthday(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let contact1Bday = ""
	let contact2Bday = ""
	if (contact1.birthday) {
		contact1Bday = contact1.birthday.day + contact1.birthday.month + (contact1.birthday.year ? contact1.birthday.year : "")
	}
	if (contact2.birthday) {
		contact2Bday = contact2.birthday.day + contact2.birthday.month + (contact2.birthday.year ? contact2.birthday.year : "")
	}
	if (contact1Bday == contact2Bday) {
		if (((contact1Bday == null) && ( contact2Bday == null))) {
			return ContactComparisonResult.Unique
		} else {
			return ContactComparisonResult.Equal
		}
	} else {
		return ContactComparisonResult.Unique
	}
}
export function compareSocialIds(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let zaehler = 0
	let moreSocialIds
	contact1.socialIds.length > contact2.socialIds.length ? moreSocialIds = contact1.socialIds.length : moreSocialIds = contact2.socialIds.length
	if (((contact1.socialIds == undefined || contact1.socialIds == null) && (contact2.socialIds == undefined || contact2.socialIds == null))) {
		return ContactComparisonResult.Unique
	} else {
		contact1.socialIds.map(si1 => {
			contact2.socialIds.map(si2 => {
				si1.socialId.toLowerCase() == si2.socialId.toLowerCase() ? zaehler++ : zaehler = zaehler
			})
		})
		if (zaehler > 0 && zaehler < moreSocialIds) {
			return ContactComparisonResult.Similar
		} else if (zaehler == moreSocialIds) {
			return ContactComparisonResult.Equal
		} else {
			return ContactComparisonResult.Unique
		}
	}
}
export function compareAddresses(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let zaehler = 0
	let moreAddresses
	contact1.addresses.length > contact2.addresses.length ? moreAddresses = contact1.addresses.length : moreAddresses = contact2.addresses.length
	if (((contact1.addresses == undefined || contact1.addresses == null) && (contact2.addresses == undefined || contact2.addresses == null))) {
		return ContactComparisonResult.Unique
	} else {
		contact1.addresses.map(ad1 => {
			contact2.addresses.map(ad2 => {
				ad1.address.toLowerCase() == ad2.address.toLowerCase() ? zaehler++ : zaehler = zaehler
			})
		})
		if (zaehler > 0 && zaehler < moreAddresses) {
			return ContactComparisonResult.Similar
		} else if (zaehler == moreAddresses) {
			return ContactComparisonResult.Equal
		} else {
			return ContactComparisonResult.Unique
		}
	}
}
export function comparePresharedPassword(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	if (contact1.presharedPassword == contact2.presharedPassword) {
		return ContactComparisonResult.Equal
	}
	else {
		return ContactComparisonResult.Unique
	}
}
//todo export function comparePhoto(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {...}
//_get... functions are used to compare the contacts attributes and update c1 if sometihing mergeable is found between c1 and c2. functions are called in mergeContacts
export function _getMergedNameField(name1: string, name2: string) {
	if (name1 == name2) {
		return name2
	} else if (name1 == "" && name2 != "") {
		return name2
	} else if (name1 != "" && name2 == "") {
		return name1
	} else {
		return name1
	}
}
export function _getMergedOtherField(otherAttribute1: string, otherAttribute2: string) {
	if (otherAttribute1 == otherAttribute2) {
		return otherAttribute2
	} else if ((otherAttribute2 != "" && otherAttribute2 != null) && (otherAttribute1 != "" && otherAttribute1 != null)) {
		return (otherAttribute1 + ", " + otherAttribute2)
	} else if ((otherAttribute1 == "" || otherAttribute1 == null) && otherAttribute2 != "") {
		return otherAttribute2
	} else {
		return otherAttribute1
	}
}
export function _getMergedOldBirthday(birthday1: ?Date, birthday2: ?Date) {
	if (birthday1 != null) {
		return birthday1
	} else if (birthday2 != null) {
		return birthday2
	} else {
		return null
	}
}
export function _getMergedBirthday(birthday1: ?Birthday, birthday2: ?Birthday) {
	let bDayDetails = createBirthday()
	if (birthday1 != null) {
		if (birthday1.year == null || birthday1.year == undefined) {
			birthday1.year = ""
		}
		bDayDetails.day = birthday1.day
		bDayDetails.month = birthday1.month
		bDayDetails.month = birthday1.year
		return bDayDetails
	} else if (birthday2 != null) {
		if (birthday2.year == null || birthday2.year == undefined) {
			birthday2.year = ""
		}
		bDayDetails.day = birthday2.day
		bDayDetails.month = birthday2.month
		bDayDetails.month = birthday2.year
		return bDayDetails
	} else {
		return null
	}
}
export function _getMergedEmails(mailAddresses1: ContactMailAddress[], mailAddresses2: ContactMailAddress[]): ContactMailAddress[] {
	let mergedContact = createContact()
	let alreadyIncluded = false
	let spacer
	// spacer needed so empty mailaddreses will not be checked
	if (mailAddresses1.length > mailAddresses2.length) {
		spacer = mailAddresses1
		mailAddresses1 = mailAddresses2
		mailAddresses2 = spacer
	}
	mailAddresses2.map(ma2 => {
		mergedContact.mailAddresses.push(ma2)
	})
	mailAddresses1.map(ma1 => {
		mergedContact.mailAddresses.map(maMerged => {
			if (maMerged.address == ma1.address && maMerged.type != ma1.type) {
				mergedContact.mailAddresses.push(ma1)
			} else if (maMerged.address != ma1.address) {
				mergedContact.mailAddresses.map(maId => {
					if (ma1.address == maId.address && ma1.type == maId.type) {
						alreadyIncluded = true
					}
				})
				alreadyIncluded == false ? mergedContact.mailAddresses.push(ma1) : alreadyIncluded
				alreadyIncluded = false
			}
		})
	})
	return mergedContact.mailAddresses
}
export function _getMergedAddresses(addresses1: ContactAddress[], addresses2: ContactAddress[]) {
	let mergedContact = createContact()
	let alreadyIncluded = false
	let spacer
	// spacer needed so empty mailaddreses will not be checked
	if (addresses1.length > addresses2.length) {
		spacer = addresses1
		addresses1 = addresses2
		addresses2 = spacer
	}
	addresses2.map(ma2 => {
		mergedContact.addresses.push(ma2)
	})
	addresses1.map(ma1 => {
		mergedContact.addresses.map(maMerged => {
			if (maMerged.address == ma1.address && maMerged.type != ma1.type) {
				mergedContact.addresses.push(ma1)
			} else if (maMerged.address != ma1.address) {
				mergedContact.addresses.map(maId => {
					if (ma1.address == maId.address && ma1.type == maId.type) {
						alreadyIncluded = true
					}
				})
				alreadyIncluded == false ? mergedContact.addresses.push(ma1) : alreadyIncluded
				alreadyIncluded = false
			}
		})
	})
	return mergedContact.addresses
}
export function _getMergedPhoneNumbers(phoneNumbers1: ContactPhoneNumber[], phoneNumbers2: ContactPhoneNumber[]): ContactPhoneNumber[] {
	let mergedContact = createContact()
	let alreadyIncluded = false
	let spacer
	// spacer needed so empty mailaddreses will not be checked
	if (phoneNumbers1.length > phoneNumbers2.length) {
		spacer = phoneNumbers1
		phoneNumbers1 = phoneNumbers2
		phoneNumbers2 = spacer
	}
	phoneNumbers2.map(ma2 => {
		mergedContact.phoneNumbers.push(ma2)
	})
	phoneNumbers1.map(ma1 => {
		mergedContact.phoneNumbers.map(maMerged => {
			if (maMerged.number == ma1.number && maMerged.type != ma1.type) {
				mergedContact.phoneNumbers.push(ma1)
			} else if (maMerged.number != ma1.number) {
				mergedContact.phoneNumbers.map(maId => {
					if (ma1.number == maId.number && ma1.type == maId.type) {
						alreadyIncluded = true
					}
				})
				alreadyIncluded == false ? mergedContact.phoneNumbers.push(ma1) : alreadyIncluded
				alreadyIncluded = false
			}
		})
	})
	return mergedContact.phoneNumbers
}
export function _getMergedSocialIds(socialIds1: ContactSocialId[], socialIds2: ContactSocialId[]) {
	let mergedContact = createContact()
	let alreadyIncluded = false
	let spacer
	// spacer needed so empty mailaddreses will not be checked
	if (socialIds1.length > socialIds2.length) {
		spacer = socialIds1
		socialIds1 = socialIds2
		socialIds2 = spacer
	}
	socialIds2.map(ma2 => {
		mergedContact.socialIds.push(ma2)
	})
	socialIds1.map(ma1 => {
		mergedContact.socialIds.map(maMerged => {
			if (maMerged.socialId == ma1.socialId && maMerged.type != ma1.type) {
				mergedContact.socialIds.push(ma1)
			} else if (maMerged.socialId != ma1.socialId) {
				mergedContact.socialIds.map(maId => {
					if (ma1.socialId == maId.socialId && ma1.type == maId.type) {
						alreadyIncluded = true
					}
				})
				alreadyIncluded == false ? mergedContact.socialIds.push(ma1) : alreadyIncluded
				alreadyIncluded = false
			}
		})
	})
	return mergedContact.socialIds
}

//todo export function _getMergedPhoto(photo1: idTupel, photo1: idTupel): ContactComparisonResultEnum {...}


