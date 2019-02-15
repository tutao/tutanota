// @flow
import {Button, ButtonType} from "../gui/base/Button"
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {windowFacade} from "../misc/WindowFacade"
import {Icons} from "../gui/base/icons/Icons"
import type {ContactMergeActionEnum} from "../api/common/TutanotaConstants"
import {ContactMergeAction} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {TextField} from "../gui/base/TextField"
import {formatBirthdayNumeric, getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel} from "./ContactUtils"
import {defer} from "../api/common/utils/Utils"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"

export class ContactMergeView {
	view: Function;
	dialog: Dialog;
	contact1: Contact;
	contact2: Contact;
	resolveFunction: Function; // must be called after the user action

	constructor(contact1: Contact, contact2: Contact) {
		this.contact1 = contact1
		this.contact2 = contact2

		// following code prepares c1 and c2 for rendering in mithrill
		let mergeButton = new Button("mergeContacts_action", () => {
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
		const cancelAction = () => {
			this._close(ContactMergeAction.Cancel)
		}
		const headerBarAttrs = {
			left: [{label: 'cancel_action', click: cancelAction, type: ButtonType.Secondary}],
			right: [{label: 'skip_action', click: () => this._close(ContactMergeAction.Skip), type: ButtonType.Primary}],
			middle: () => lang.get("merge_action")
		}

		let mailAddresses1 = this.contact1.mailAddresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type: any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()

		})
		let phones1 = this.contact1.phoneNumbers.map(element => {
			return new TextField(() => getContactPhoneNumberTypeLabel((element.type: any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
		})
		let addresses1 = this.contact1.addresses.map(element => {
			return new HtmlEditor(() =>
				getContactAddressTypeLabel((element.type: any), element.customTypeName))
				.showBorders()
				.setValue(element.address)
				.setEnabled(false)
				.setMode(Mode.HTML)
				.setHtmlMonospace(false)
		})
		let socials1 = this.contact1.socialIds.map(element => {
			return new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
		})

		let mailAddresses2 = this.contact2.mailAddresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type: any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
		})
		let phones2 = this.contact2.phoneNumbers.map(element => {
			return new TextField(() => getContactPhoneNumberTypeLabel((element.type: any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
		})
		let addresses2 = this.contact2.addresses.map(element => {
			return new HtmlEditor(() =>
				getContactAddressTypeLabel((element.type: any), element.customTypeName))
				.showBorders()
				.setValue(element.address)
				.setEnabled(false)
				.setMode(Mode.HTML)
				.setHtmlMonospace(false)
		})
		let socials2 = this.contact2.socialIds.map(element => {
			return new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
		})

		//empty.. placeholders are used if one contact has an attribute while the other does not have it, so an empty one is shown for comparison
		let emptyFieldPlaceholder = new TextField("emptyString_msg").setValue("").setDisabled()
		let emptyHTMLFieldPlaceholder = new HtmlEditor("emptyString_msg").showBorders()
		                                                                 .setValue("")
		                                                                 .setEnabled(false)
		                                                                 .setMode(Mode.HTML)
		                                                                 .setHtmlMonospace(false)

		let titleFields = this._createTextFields(this.contact1.title, this.contact2.title, "title_placeholder")
		let firstNameFields = this._createTextFields(this.contact1.firstName, this.contact2.firstName, "firstName_placeholder")
		let lastNameFields = this._createTextFields(this.contact1.lastName, this.contact2.lastName, "lastName_placeholder")
		let nicknameFields = this._createTextFields(this.contact1.nickname, this.contact2.nickname, "nickname_placeholder")
		let companyFields = this._createTextFields(this.contact1.company, this.contact2.company, "company_label")
		let roleFields = this._createTextFields(this.contact1.role, this.contact2.role, "role_placeholder")
		let birthdayFields = this._createTextFields(this.contact1.birthday ? formatBirthdayNumeric(this.contact1.birthday) : "", this.contact2.birthday ? formatBirthdayNumeric(this.contact2.birthday) : "", "birthday_alt")
		let presharedPasswordFields = this._createTextFields(this.contact1.presharedPassword
		&& this.contact1.presharedPassword.length > 0 ? "***" : "", this.contact2.presharedPassword
		&& this.contact2.presharedPassword.length > 0 ? "***" : "", "presharedPassword_label")

		let comment1Field = null
		let comment2Field = null
		if (this.contact1.comment || this.contact2.comment) {
			comment1Field = new HtmlEditor("comment_label").showBorders()
			                                               .setValue(this.contact1.comment)
			                                               .setEnabled(false)
			                                               .setMode(Mode.HTML)
			                                               .setHtmlMonospace(false)
			comment2Field = new HtmlEditor("comment_label").showBorders()
			                                               .setValue(this.contact2.comment)
			                                               .setEnabled(false)
			                                               .setMode(Mode.HTML)
			                                               .setHtmlMonospace(false)
		}


		this.view = () => {
			return m("#contact-editor", [
				m(".flex-center.mt", [
					m(".full-width.max-width-s", [
						m(mergeButton)
					])
				]),
				m(".non-wrapping-row", [
					m(""/*first contact */, [
						m(".items-center", [
							m(".items-base.flex-space-between", [
								m(".h4.mt-l", lang.get("firstMergeContact_label")),
								m(delButton1)
							]),
						])
					]),
					m(""/*second contact */, [
						m(".items-center", [
							m(".items-base.flex-space-between", [
								m(".h4.mt-l", lang.get("secondMergeContact_label")),
								m(delButton2)
							]),
						]),
					])
				]),
				titleFields ? m(".non-wrapping-row", [
					m(titleFields[0]),
					m(titleFields[1])
				]) : null,
				firstNameFields ? m(".non-wrapping-row", [
					m(firstNameFields[0]),
					m(firstNameFields[1])
				]) : null,
				lastNameFields ? m(".non-wrapping-row", [
					m(lastNameFields[0]),
					m(lastNameFields[1])
				]) : null,
				nicknameFields ? m(".non-wrapping-row", [
					m(nicknameFields[0]),
					m(nicknameFields[1])
				]) : null,
				companyFields ? m(".non-wrapping-row", [
					m(companyFields[0]),
					m(companyFields[1])
				]) : null,
				birthdayFields ? m(".non-wrapping-row", [
					m(birthdayFields[0]),
					m(birthdayFields[1])
				]) : null,
				roleFields ? m(".non-wrapping-row", [
					m(roleFields[0]),
					m(roleFields[1])
				]) : null,
				mailAddresses1.length > 0 || mailAddresses2.length > 0 ? m(".non-wrapping-row", [
					m(".mail.mt-l", [
						m("", lang.get('email_label')),
						m(".aggregateEditors", [
							mailAddresses1.length > 0 ? mailAddresses1.map(ma => m(ma)) : m(emptyFieldPlaceholder),
						])
					]),
					m(".mail.mt-l", [
						m("", lang.get('email_label')),
						m(".aggregateEditors", [
							mailAddresses2.length > 0 ? mailAddresses2.map(ma => m(ma)) : m(emptyFieldPlaceholder),
						])
					]),
				]) : null,
				phones1.length > 0 || phones2.length > 0 ? m(".non-wrapping-row", [
					m(".phone.mt-l", [
						m("", lang.get('phone_label')),
						m(".aggregateEditors", [
							phones1.length > 0 ? phones1.map(ma => m(ma)) : m(emptyFieldPlaceholder),
						])
					]),
					m(".phone.mt-l", [
						m("", lang.get('phone_label')),
						m(".aggregateEditors", [
							phones2.length > 0 ? phones2.map(ma => m(ma)) : m(emptyFieldPlaceholder),
						])
					]),
				]) : null,
				addresses1.length > 0 || addresses2.length > 0 ? m(".non-wrapping-row", [
					m(".address.mt-l", [
						m("", lang.get('address_label')),
						m(".aggregateEditors", addresses1.length > 0 ?
							addresses1.map(ma => m(ma)) : m(emptyHTMLFieldPlaceholder))
					]),
					m(".address.mt-l", [
						m("", lang.get('address_label')),
						m(".aggregateEditors", addresses2.length > 0 ?
							addresses2.map(ma => m(ma)) : m(emptyHTMLFieldPlaceholder))
					]),
				]) : null,
				socials1.length > 0 || socials2.length > 0 ? m(".non-wrapping-row", [
					m(".social.mt-l", [
						m("", lang.get('social_label')),
						m(".aggregateEditors", socials1.length > 0 ?
							socials1.map(ma => m(ma)) : m(emptyFieldPlaceholder))
					]),
					m(".social.mt-l", [
						m("", lang.get('social_label')),
						m(".aggregateEditors", socials2.length > 0 ?
							socials2.map(ma => m(ma)) : m(emptyFieldPlaceholder))
					]),
				]) : null,
				(comment1Field && comment2Field) ? m(".non-wrapping-row", [
					m(".mt-l", [
						m(comment1Field)
					]),
					m(".mt-l", [
						m(comment2Field)
					]),
				]) : null,
				(presharedPasswordFields) ? m(".non-wrapping-row", [
					m(presharedPasswordFields[0]),
					m(presharedPasswordFields[1])
				]) : null,
				m("", {style: {height: "5px"}}/*Used as spacer so the last gui-element is not touching the window border*/),
			])
		}

		this.dialog = Dialog.largeDialog(headerBarAttrs, this)
		                    .setCloseHandler(cancelAction)
	}

	_createTextFields(value1: ? string, value2: ? string, labelTextId: string): ? TextField[] {
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
