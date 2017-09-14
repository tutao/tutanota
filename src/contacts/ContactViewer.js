// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {Button} from "../gui/base/Button"
import {ContactView} from "./ContactView"
import {formatDateWithMonth} from "../misc/Formatter"
import {ContactEditor} from "./ContactEditor"
import {getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel} from "./ContactUtils"
import {ActionBar} from "../gui/base/ActionBar"
import {TextField, Type} from "../gui/base/TextField"
import {erase} from "../api/main/Entity"
import {assertMainOrNode} from "../api/Env"
import {keyManager, Keys} from "../misc/KeyManager"
import {Dialog} from "../gui/base/Dialog"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {Icons} from "../gui/base/icons/Icons"

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
	contactView: ContactView;
	mailAddresses: TextField[];
	phones: TextField[];
	addresses: TextField[];
	socials: TextField[];
	oncreate: Function;
	onbeforeremove: Function;

	constructor(contact: Contact, contactView: ContactView) {
		this.contact = contact
		this.contactView = contactView

		let actions = new ActionBar()
			.add(new Button('edit_action', () => this.edit(), () => BootIcons.Edit))
			.add(new Button('delete_action', () => this.delete(), () => Icons.Trash))

		this.mailAddresses = this.contact.mailAddresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.address)
				.setDisabled()
		})
		this.phones = this.contact.phoneNumbers.map(element => {
			return new TextField(() => getContactPhoneNumberTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.number)
				.setDisabled()
		})
		this.addresses = this.contact.addresses.map(element => {
			return new TextField(() => getContactAddressTypeLabel((element.type:any), element.customTypeName))
				.setType(Type.Area)
				.setValue(element.address)
				.setDisabled()
		})
		this.socials = this.contact.socialIds.map(element => {
			return new TextField(() => getContactSocialTypeLabel((element.type:any), element.customTypeName))
				.setValue(element.socialId)
				.setDisabled()
		})


		this.view = () => {
			return [
				m("#contact-viewer.fill-absolute.scroll.plr-l", [
					m(".flex-space-between.pt", [
						m(".h2", this.contact.firstName + " " + contact.lastName),
						m(actions),
					]),
					insertBetween([
						this.contact.company ? m("span.company", this.contact.company) : null,
						this.contact.title ? m("span.title", this.contact.title) : null,
						this.contact.birthday ? m("span.birthday", formatDateWithMonth((this.contact.birthday:any))) : null,
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
									m(".aggregateEditors", [
										this.addresses.map(ma => m(ma)),
									])
								] : null),
							m(".social.mt-l", this.socials.length > 0 ? [
									m(".h4", lang.get('social_label')),
									m(".aggregateEditors", [
										this.socials.map(ma => m(ma)),
									])
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

	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.E,
				exec: () => this.edit(),
				help: "editContact_label"
			},
			{
				key: Keys.DELETE,
				exec: () => this.delete(),
				help: "delete_action"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	delete() {
		Dialog.confirm("deleteContact_msg").then((confirmed) => {
			if (confirmed) {
				erase(this.contact)
			}
		})
	}

	edit() {
		new ContactEditor(this.contact).show()
	}
}