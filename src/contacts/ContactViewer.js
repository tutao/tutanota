// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {Button} from "../gui/base/Button"
import {ContactEditor} from "./ContactEditor"
import {getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel} from "./ContactUtils"
import {ActionBar} from "../gui/base/ActionBar"
import {TextField, Type} from "../gui/base/TextField"
import {erase} from "../api/main/Entity"
import {assertMainOrNode} from "../api/Env"
import {keyManager, Keys} from "../misc/KeyManager"
import {Dialog} from "../gui/base/Dialog"
import {Icons} from "../gui/base/icons/Icons"
import {formatDateWithMonth} from "../misc/Formatter"
import {NotFoundError} from "../api/common/error/RestError"
import {MailEditor} from "../mail/MailEditor"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {ContactSocialType} from "../api/common/TutanotaConstants"
import {mailModel} from "../mail/MailModel"
import {getEmailSignature} from "../mail/MailUtils"

assertMainOrNode()

function insertBetween(array: any[], spacer: Object) {
	let ret = []
	for (let e of array) {
		if (e != null) {
			if (ret.length > 0) {
				ret.push(spacer)
			}
			ret.push(e)
		}
	}
	return ret
}


export class ContactViewer {
	view: Function;
	contact: Contact;
	mailAddresses: TextField[];
	phones: TextField[];
	addresses: TextField[];
	socials: TextField[];
	oncreate: Function;
	onbeforeremove: Function;

	constructor(contact: Contact) {
		this.contact = contact

		let actions = new ActionBar()
			.add(new Button('edit_action', () => this.edit(), () => Icons.Edit))
			.add(new Button('delete_action', () => this.delete(), () => Icons.Trash))

		this.mailAddresses = this.contact.mailAddresses.map(element => {
			let textField = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
			let newMailButton = new Button('sendMail_alt', () => this._writeMail(element.address), () => BootIcons.Mail)
			textField._injectionsRight = () => [m(newMailButton)]
			return textField
		})
		this.phones = this.contact.phoneNumbers.map(element => {
			let textField = new TextField(() => getContactPhoneNumberTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
			let callButton = new Button('callNumber_alt', () => null, () => Icons.Call)
			textField._injectionsRight = () => m(`a[href="tel:${element.number}"][target=_blank]`, m(callButton))
			return textField
		})
		this.addresses = this.contact.addresses.map(element => {
			let showAddress = new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setType(Type.Area)
				.setValue(element.address)
				.setDisabled()
			let prepAddress
			if (element.address.indexOf("\n") != -1) {
				prepAddress = encodeURIComponent(element.address.split("\n").join(" "))
			} else {
				prepAddress = encodeURIComponent(element.address)
			}
			let showButton = new Button('showAddress_alt', () => null, () => Icons.Pin)
			showAddress._injectionsRight = () => m(`a[href="https://www.openstreetmap.org/search?query=${prepAddress}"][target=_blank]`, m(showButton))
			return showAddress
		})
		this.socials = this.contact.socialIds.map(element => {
			let showURL = new TextField(() => getContactSocialTypeLabel(element.type, element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
			let showButton = new Button('showURL_alt', () => null, () => Icons.ArrowForward)
			showURL._injectionsRight = () => m(`a[href=${this.getSocialUrl(element)}][target=_blank]`, m(showButton))
			return showURL
		})


		this.view = () => {
			return [
				m("#contact-viewer.fill-absolute.scroll.plr-l.pb-floating", [
					m(".flex-space-between.pt", [
						m(".h2", (this.contact.title ? this.contact.title : "") + " " + this.contact.firstName + " " + this.contact.lastName + (this.contact.nickname ? ' | "' + this.contact.nickname + '"' : "")),
						m(actions),
					]),
					insertBetween([
						this.contact.company ? m("span.company", this.contact.company) : null,
						this.contact.role ? m("span.title", this.contact.role) : null,
						this.contact.oldBirthday ? m("span.birthday", formatDateWithMonth((this.contact.oldBirthday:any))) : null,
					], m("span", " | ")),
					m("hr.hr.mt-l"),

					this.mailAddresses.length > 0 || this.phones.length > 0 ? m(".wrapping-row", [
							m(".mail.mt-l", this.mailAddresses.length > 0 ? [
									m(".h4", lang.get('email_label')),
									m(".aggregateEditors", [
										this.mailAddresses.map(ma => m(ma)),
									])
								] : null),
							m(".phone.mt-l", this.phones.length > 0 ? [
									m(".h4", lang.get('phone_label')),
									m(".aggregateEditors", [
										this.phones.map(ma => m(ma)),
									])
								] : null),
						]) : null,

					this.addresses.length > 0 || this.socials.length > 0 ? m(".wrapping-row", [
							m(".address.mt-l", this.addresses.length > 0 ? [
									m(".h4", lang.get('address_label')),
									m(".aggregateEditors", this.addresses.map(ma => m(ma)))
								] : null),
							m(".social.mt-l", this.socials.length > 0 ? [
									m(".h4", lang.get('social_label')),
									m(".aggregateEditors", this.socials.map(ma => m(ma)))
								] : null),
						]) : null,

					this.contact.comment && this.contact.comment.trim().length > 0 ? [
							m("hr.hr.mt-l"),
							m("p.mt-l.text-prewrap.text-break", this.contact.comment),
						] : null,

				]),

			]
		}
		this._setupShortcuts()
	}

	getSocialUrl(element: ContactSocialId) {
		let socialUrlType = ""
		let http = "https://"
		let worldwidew = "www."
		switch (element.type) {
			case ContactSocialType.TWITTER:
				socialUrlType = "twitter.com/"
				if (element.socialId.indexOf("http") != -1 || element.socialId.indexOf(worldwidew) != -1) {
					socialUrlType = ""
				}
				break
			case ContactSocialType.FACEBOOK:
				socialUrlType = "facebook.com/"
				if (element.socialId.indexOf("http") != -1 || element.socialId.indexOf(worldwidew) != -1) {
					socialUrlType = ""
				}
				break
			case ContactSocialType.XING:
				socialUrlType = "xing.com/profile/"
				if (element.socialId.indexOf("http") != -1 || element.socialId.indexOf(worldwidew) != -1) {
					socialUrlType = ""
				}
				break
			case ContactSocialType.LINKED_IN:
				socialUrlType = "linkedin.com/in/"
				if (element.socialId.indexOf("http") != -1 || element.socialId.indexOf(worldwidew) != -1) {
					socialUrlType = ""
				}
			default:
		}
		if (element.socialId.indexOf("http") != -1) {
			http = ""
		}
		if (element.socialId.indexOf(worldwidew) != -1) {
			worldwidew = ""
		}
		let socialURL = `${http}${worldwidew}${socialUrlType}${element.socialId.trim()}`
		return socialURL
	}


	_writeMail(mailAddress: string) {
		let editor = new MailEditor(mailModel.getUserMailboxDetails())
		editor.initWithTemplate(`${this.contact.firstName} ${this.contact.lastName}`.trim(), mailAddress, "", getEmailSignature(), null).then(() => {
			editor.show()
		})
	}

	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.E,
				exec: () => this.edit(),
				help: "editContact_label"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	delete() {
		Dialog.confirm("deleteContact_msg").then((confirmed) => {
			if (confirmed) {
				erase(this.contact).catch(NotFoundError, e => {
					// ignore because the delete key shortcut may be executed again while the contact is already deleted
				})
			}
		})
	}

	edit() {
		new ContactEditor(this.contact).show()
	}
}