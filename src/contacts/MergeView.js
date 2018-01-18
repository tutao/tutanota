// @flow
import {Button, ButtonType} from "../gui/base/Button"
import m from "mithril"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Dialog} from "../gui/base/Dialog"
import {windowFacade} from "../misc/WindowFacade"
import {TextField} from "../gui/base/TextField"
import {Icons} from "../gui/base/icons/Icons"
import type {ContactComparisonResultEnum} from "../api/common/TutanotaConstants"
import {ContactComparisonResult} from "../api/common/TutanotaConstants"
import {erase} from "../api/main/Entity"

export class MergeView {
	view: Function;
	dialog: Dialog;


	constructor(allContacts: Contact[]) {
		let mergeableAndDuplicates
		let mergeButton = new Button("mergeContact_action", () => {
			mergeableAndDuplicates = getMergableContacts(allContacts)
			//todo confirm dialog plopt auf zum löschen
			mergeableAndDuplicates.deletable.forEach((dc) => {
				erase(dc)
			})
		}).setType(ButtonType.Login)

		let delButton = new Button('delete_action', () => null, () => Icons.Trash)
		//console.log(allContacts)
		let headerBar = new DialogHeaderBar()
			.addLeft(new Button('cancel_action', () => this._close()).setType(ButtonType.Secondary))
			.setMiddle("")
			.addRight(new Button('next_action', () => this._next()).setType(ButtonType.Primary))
		let mailAddresses = new TextField("email_label").setValue("anton_stein@tutanota.com")
		/*this.contact.mailAddresses.map(element => {
		 let textField = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
		 .setValue(element.address)
		 .setDisabled()
		 return textField
		 })*/
		let phones = new TextField("phone_label").setValue("0123098456")
		/*this.contact.phoneNumbers.map(element => {
		 let textField = new TextField(() =>  getContactPhoneNumberTypeLabel((element.type:any), element.customTypeName))
		 .setValue(element.number)
		 .setDisabled()
		 return textField
		 })*/
		let addresses = new TextField("address_label").setValue("Die Heide 79")
		/*this.contact.addresses.map(element => {
		 let showAddress = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
		 .setType(Type.Area)
		 .setValue(element.address)
		 .setDisabled()
		 return showAddress
		 })*/
		let socials = new TextField("social_label").setValue("twitter.com")
		/*this.contact.socialIds.map(element => {
		 let showURL = new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
		 .setValue(element.socialId)
		 .setDisabled()
		 let showButton = new Button('showURL_alt', () => null, () => Icons.ArrowForward)
		 showURL._injectionsRight = () => m(`a[href=${this.getSocialUrl(element)}][target=_blank]`, m(showButton))
		 return showURL
		 })*/


		this.view = () => m("#contact-editor", [
			m(".flex-space-around", [
				//todo phraseApp!!!!!
				m("", {style: {width: "300px"}}, [m("", [m("", [m(delButton)]), m("", "Contact 1")])]),
				m("", {style: {width: "120px"}}, [m("", [m(mergeButton)])]),
				m("", {style: {width: "300px"}}, [m("", [m("", [m("", "Contact 1"), m(delButton)])])])
			]),
			m(".wrapping-row", [
				m(""/*first contact */, [
					//todo !!!If abfrage zum rendern
					true == true ? m(new TextField("title_placeholder").setValue("Mr.")) : null,
					true == true ? m(new TextField("firstName_placeholder").setValue("Anton")) : null,
					true == true ? m(new TextField("lastName_placeholder").setValue("Stein")) : null,
					true == true ? m(new TextField("nickname_placeholder").setValue("ant")) : null,
					true == true ? m(new TextField("birthday_alt").setValue("14.08.1991")) : null,
					true == true ? m(new TextField("company_placeholder").setValue("Tutao GmbH")) : null,
					true == true ? m(new TextField("role_placeholder").setValue("JS ES6 Developer & Tester")) : null,
					true == true ? m(mailAddresses) : null,
					true == true ? m(addresses) : null,
					true == true ? m(phones) : null,
					true == true ? m(socials) : null,
					true == true ? m(new TextField("comment_label").setValue("Comment not HERE!!! Nooot")) : null

				]),
				m(""/*second contact */, [
					true == true ? m(new TextField("title_placeholder").setValue("Mr.")) : null,
					true == true ? m(new TextField("firstName_placeholder").setValue("Anton")) : null,
					true == true ? m(new TextField("lastName_placeholder").setValue("Stein")) : null,
					true == true ? m(new TextField("nickname_placeholder").setValue("ant")) : null,
					true == true ? m(new TextField("birthday_alt").setValue("14.08.1991")) : null,
					true == true ? m(new TextField("company_placeholder").setValue("Tutao GmbH")) : null,
					true == true ? m(new TextField("role_placeholder").setValue("JS ES6 Developer & Tester")) : null,
					true == true ? m(mailAddresses) : null,
					true == true ? m(addresses) : null,
					true == true ? m(phones) : null,
					true == true ? m(socials) : null,
					true == true ? m(new TextField("comment_label").setValue("Comment not HERE!!! Nooot")) : null]),


			])])

		this.dialog = Dialog.largeDialog(headerBar, this)

	}


	show() {
		this.dialog.show()
		windowFacade.checkWindowClosing(true)
	}

	_close() {
		windowFacade.checkWindowClosing(false)
		this.dialog.close()
	}

	_next() {
	}

}
export function getMergableContacts(allContacts: Contact[]): {mergeable:[], deletable: []} {
	let counterMainLoop = allContacts.length - 1
	let counterSubLoop = allContacts.length - 1
	let compareResult = ""
	let mergableContacts = []
	let duplicatContacts = []
	let mergeableResults = {mergeable: [], deletable: []}
	while (counterMainLoop > 0) {
		let mergableMemoryArray = []
		mergableMemoryArray.push(allContacts[counterMainLoop])
		while (counterSubLoop--) {
			if (allContacts[counterMainLoop]._id[1] != allContacts[counterSubLoop]._id[1]) {
				compareResult = compareContactsForMerge(allContacts[counterMainLoop], allContacts[counterSubLoop])
				if (compareResult == "similar") {
					mergableMemoryArray.push(allContacts[counterSubLoop])
					allContacts.splice(counterSubLoop, 1)
					counterMainLoop--
				} else if (compareResult == "equal") {
					duplicatContacts.push(allContacts[counterSubLoop])
					allContacts.splice(counterSubLoop, 1)
					counterMainLoop--
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
	mergeableResults.mergeable = mergableContacts
	mergeableResults.deletable = duplicatContacts
	console.log(mergeableResults)
	return mergeableResults
}

export function compareContactsForMerge(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let nameResult = compareFullname(contact1, contact2)
	let mailResult = compareMailaddresses(contact1, contact2)
	let phoneResult = comparePhonenumbers(contact1, contact2)
	let residualContactResult = compareResidualContactfields(contact1, contact2)
	//console.log(contact1, contact2, "\n", nameResult, mailResult, phoneResult, residualContactResult + "\n")
	if (nameResult == "unique" && (mailResult == "unique" || mailResult == null) && (phoneResult == "unique" || phoneResult == null)) {
		return ContactComparisonResult.Unique
	} else if ((nameResult == "equal" || nameResult == null) && (mailResult == "equal" || mailResult == null) && (phoneResult == "equal" || phoneResult == null) && residualContactResult == "equal") {
		return ContactComparisonResult.Equal
	} else if (nameResult == "equal" && (mailResult == "equal" || mailResult == "unique") && phoneResult !== "unique") {
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

	} else {
		return ContactComparisonResult.Unique
	}

}

export function compareFullname(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | null {
	//todo Leere strings und nulls abfangen**check Testfälle
	if (contact1.firstName == contact2.firstName && contact1.lastName == contact2.lastName || ((contact1.firstName == "" && contact1.lastName == "") || (contact2.firstName == "" && contact2.lastName == ""))) {
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
		return ContactComparisonResult.Unique
	}
}
export function compareMailaddresses(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | null {
	let zaehler = 0
	let lowerCaseZaehler = 0
	let moreAddresses
	let emptyAddress = false
	contact1.mailAddresses.length > contact2.mailAddresses.length ? moreAddresses = contact1.mailAddresses.length : moreAddresses = contact2.mailAddresses.length
	//todo Leere strings und nulls abfangen**check Testfälle
	//todo case sensitiv prüfen**check Testfälle
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
export function comparePhonenumbers(contact1: Contact, contact2: Contact): ContactComparisonResultEnum | null {
	let zaehler = 0
	let morePhoneNumbers
	let emptyNumber = false

	contact1.phoneNumbers.length > contact2.phoneNumbers.length ? morePhoneNumbers = contact1.phoneNumbers.length : morePhoneNumbers = contact2.phoneNumbers.length
	//todo Leere strings und nulls abfangen**check Testfälle
	if (((contact1.phoneNumbers == undefined || contact1.phoneNumbers == null || contact1.phoneNumbers.length == 0) && (contact2.phoneNumbers == undefined || contact2.phoneNumbers == null || contact2.phoneNumbers.length == 0))) {
		return null
	} else {
		contact1.phoneNumbers.map(pn1 => {
			contact2.phoneNumbers.map(pn2 => {
				//nicht Darstellbare sonderzeichen sollen entfernt werden
				if (pn1.number == "" && pn2.number == "") {
					emptyNumber = true
				}
				if (pn1.number == pn2.number) {
					zaehler++
				}
			})
		})
		if ((zaehler > 0 && zaehler < morePhoneNumbers)) {
			return ContactComparisonResult.Similar
		} else if (zaehler == morePhoneNumbers && emptyNumber == false) {
			return ContactComparisonResult.Equal
		} else if (emptyNumber == true) {
			return null
		} else {
			return ContactComparisonResult.Unique
		}
	}

}
export function compareResidualContactfields(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	let comparsionResultArray = []

	//todo Leere strings und nulls abfangen
	//todo anpassen der Comparefunctionen sammeln der ergebnise in einen Array suche das array auf meist sollte
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
	// todo photo compare needs to be done as soon as it will be implemented
	// console.log(comparsionResultArray)
	// console.log(comparsionResultArray.indexOf("equal"))
	if (comparsionResultArray.indexOf("similar") > 0) {
		return ContactComparisonResult.Similar

	} else if (comparsionResultArray.indexOf("equal") >= 0 && comparsionResultArray.indexOf("unique") == -1) {
		return ContactComparisonResult.Equal
	} else {
		return ContactComparisonResult.Unique
	}


}
export function compareComment(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	//todo Leere strings und nulls abfangen**check Testfälle
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
	//todo Leere strings und nulls abfangen**check Testfälle
	if (contact1.company == contact2.company) {
		if ((( contact1.company == null) && ( contact2.company == null))) {
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
	//todo Leere strings und nulls abfangen**check Testfälle
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
	//todo Leere strings und nulls abfangen**check Testfälle
	if (JSON.stringify(contact1.oldBirthday) == JSON.stringify(contact2.oldBirthday)) {
		//todo redundanz prüfen evtl doppelt gemoppelt
		if (((contact1.oldBirthday == undefined || contact1.oldBirthday == null) && (contact2.oldBirthday == undefined || contact2.oldBirthday == null))) {
			return ContactComparisonResult.Equal
		} else {
			return ContactComparisonResult.Equal
		}
	} else {
		return ContactComparisonResult.Unique
	}
}
export function compareRole(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
	//todo Leere strings und nulls abfangen**check Testfälle
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
	//todo Leere strings und nuls abfangen**check Testfälle
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
	//todo Leere strings und nulls abfangen**check Testfälle
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
	//todo Leere strings und nulls abfangen**check Testfälle
	//todo case sensitiv prüfen**check Testfälle
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
//export function comparePhoto(contact1: Contact, contact2: Contact): ContactComparisonResultEnum {
// todo
//}

