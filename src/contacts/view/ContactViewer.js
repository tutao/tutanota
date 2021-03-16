// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {ContactEditor} from "../ContactEditor"
import {Type} from "../../gui/base/TextField"
import {assertMainOrNode} from "../../api/common/Env"
import {keyManager} from "../../misc/KeyManager"
import {Dialog} from "../../gui/base/Dialog"
import {Icons} from "../../gui/base/icons/Icons"
import {NotFoundError} from "../../api/common/error/RestError"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import type {ContactAddressTypeEnum} from "../../api/common/TutanotaConstants"
import {ContactSocialType, getContactSocialType, Keys} from "../../api/common/TutanotaConstants"
import type {Contact} from "../../api/entities/tutanota/Contact"
import type {ContactSocialId} from "../../api/entities/tutanota/ContactSocialId"
import {locator} from "../../api/main/MainLocator"
import {newMailEditorFromTemplate} from "../../mail/editor/MailEditor"
import {logins} from "../../api/main/LoginController"
import {NBSP} from "../../api/common/utils/StringUtils"
import {ActionBar} from "../../gui/base/ActionBar"
import {getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel} from "./ContactGuiUtils";
import {appendEmailSignature} from "../../mail/signature/Signature";
import {formatBirthdayOfContact} from "../model/ContactUtils"
import {TextFieldN} from "../../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import type {ContactAddress} from "../../api/entities/tutanota/ContactAddress"
import {ButtonN} from "../../gui/base/ButtonN"
import type {ContactPhoneNumber} from "../../api/entities/tutanota/ContactPhoneNumber"
import {downcast, noOp} from "../../api/common/utils/Utils"

assertMainOrNode()

function insertBetween(array: any[], spacer: () => VirtualElement) {
	let ret = []
	for (let e of array) {
		if (e != null) {
			if (ret.length > 0) {
				ret.push(spacer())
			}
			ret.push(e)
		}
	}
	return ret
}

export class ContactViewer implements Lifecycle<void> {
	contact: Contact;
	contactAppellation: string;
	+oncreate: (vnode: VnodeDOM<void>) => any;
	+onremove: (vnode: VnodeDOM<void>) => any;
	formattedBirthday: ?string;

	constructor(contact: Contact) {
		this.contact = contact
		let title = this.contact.title ? this.contact.title + " " : ""
		let nickname = (this.contact.nickname ? ' | "' + this.contact.nickname + '"' : "")
		let fullName = this.contact.firstName + " " + this.contact.lastName
		this.contactAppellation = (title + fullName + nickname).trim()
		this.formattedBirthday = this._hasBirthday() ? formatBirthdayOfContact(this.contact) : null

		let shortcuts = [
			{
				key: Keys.E,
				exec: () => this.edit(),
				help: "editContact_label"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onremove = () => keyManager.unregisterShortcuts(shortcuts)
	}


	view(): Children {
		return [
			m("#contact-viewer.fill-absolute.scroll.plr-l.pb-floating", [
				m(".header.pt-ml", [
					m(".contact-actions.flex-space-between.flex-wrap.mt-xs", [
						m(".left.flex-grow-shrink-150", [
							m(".h2.selectable.text-break", [
								this.contactAppellation,
								NBSP // alignment in case nothing is present here
							]),
							m(".flex-wrap.selectable", [
								insertBetween([
									this.contact.company ? m("span.company", this.contact.company) : null,
									this.contact.role ? m("span.title", this.contact.role) : null,
									this.formattedBirthday ? m("span.birthday", this.formattedBirthday) : null
								], () => m("span", " | ")),
								NBSP // alignment in case nothing is present here
							])
						]),
						m(".action-bar.align-self-end", [//css align self needed otherwise the buttons will float in the top right corner instead of bottom right
							this._createActionbar()
						]),
					]),
					m("hr.hr.mt.mb"),
				]),
				this._renderMailAddressesAndPhones(),
				this._renderAddressesAndSocialIds(),
				this._renderComment(),
			])
		]
	}

	_renderAddressesAndSocialIds(): Children {
		const addresses = this.contact.addresses.map(element => this._createAddress(element))
		const socials = this.contact.socialIds.map(element => this._createSocialId(element))

		return addresses.length > 0 || socials.length > 0
			? m(".wrapping-row", [
				m(".address.mt-l", addresses.length > 0 ? [
						m(".h4", lang.get('address_label')),
						m(".aggregateEditors", addresses)
					]
					: null),
				m(".social.mt-l", socials.length > 0
					? [
						m(".h4", lang.get('social_label')),
						m(".aggregateEditors", socials)
					]
					: null),
			])
			: null
	}

	_renderMailAddressesAndPhones(): Children {
		const mailAddresses = this.contact.mailAddresses.map(element => this._createMailAddress(element))
		const phones = this.contact.phoneNumbers.map(element => this._createPhone(element))

		return mailAddresses.length > 0 || phones.length > 0
			? m(".wrapping-row", [
				m(".mail.mt-l", mailAddresses.length > 0 ? [
						m(".h4", lang.get('email_label')),
						m(".aggregateEditors", [
							mailAddresses,
						])
					]
					: null),
				m(".phone.mt-l", phones.length > 0
					? [
						m(".h4", lang.get('phone_label')),
						m(".aggregateEditors", [
							phones,
						])
					]
					: null),
			])
			: null
	}

	_renderComment(): Children {
		return this.contact.comment && this.contact.comment.trim().length > 0
			? [
				m("hr.hr.mt-l"),
				m("p.mt-l.text-prewrap.text-break", this.contact.comment),
			]
			: null
	}

	_createActionbar(): Children {
		const actionBarButtons = [
			{
				label: "edit_action",
				click: () => this.edit(),
				icon: () => Icons.Edit
			},
			{
				label: "delete_action",
				click: () => this.delete(),
				icon: () => Icons.Trash
			}
		]
		return m(ActionBar, {buttons: actionBarButtons})
	}

	_createSocialId(contactSocialId: ContactSocialId): Children {
		const showButton = m(ButtonN, {
			label: 'showURL_alt',
			click: noOp,
			icon: () => Icons.ArrowForward,
		})
		return m(TextFieldN, {
			label: () => getContactSocialTypeLabel(getContactSocialType(contactSocialId), contactSocialId.customTypeName),
			value: stream(contactSocialId.socialId),
			disabled: true,
			injectionsRight: () => m(`a[href=${this.getSocialUrl(contactSocialId)}][target=_blank]`, showButton)
		})
	}

	_createMailAddress(address: ContactAddress): Child {
		const newMailButton = m(ButtonN, {
			label: 'sendMail_alt',
			click: () => this._writeMail(address.address),
			icon: () => BootIcons.Mail
		})

		return m(TextFieldN, {
			label: () => getContactAddressTypeLabel((address.type: any), address.customTypeName),
			value: stream(address.address),
			disabled: true,
			injectionsRight: () => [newMailButton],
		})
	}

	_createPhone(phone: ContactPhoneNumber): Children {
		const callButton = m(ButtonN, {
			label: 'callNumber_alt',
			click: () => null,
			icon: () => Icons.Call
		})

		return m(TextFieldN, {
			label: () =>
				getContactPhoneNumberTypeLabel((phone.type: any), phone.customTypeName),
			value: stream(phone.number),
			disabled: true,
			injectionsRight: () => m(`a[href="tel:${phone.number}"][target=_blank]`, callButton)
		})
	}

	_createAddress(address: ContactAddress): Children {
		let prepAddress
		if (address.address.indexOf("\n") !== -1) {
			prepAddress = encodeURIComponent(address.address.split("\n").join(" "))
		} else {
			prepAddress = encodeURIComponent(address.address)
		}

		const showButton = m(ButtonN, {
			label: 'showAddress_alt',
			click: () => null,
			icon: () => Icons.Pin
		})

		return m(TextFieldN, {
			label: () => getContactAddressTypeLabel(downcast<ContactAddressTypeEnum>(address.type), address.customTypeName),
			value: stream(address.address),
			disabled: true,
			type: Type.Area,
			injectionsRight: () => m(`a[href="https://www.openstreetmap.org/search?query=${prepAddress}"][target=_blank]`, showButton),
		})
	}


	getSocialUrl(element: ContactSocialId): string {
		let socialUrlType = ""
		let http = "https://"
		let worldwidew = "www."
		switch (element.type) {
			case ContactSocialType.TWITTER:
				socialUrlType = "twitter.com/"
				if (element.socialId.indexOf("http") !== -1 || element.socialId.indexOf(worldwidew) !== -1) {
					socialUrlType = ""
				}
				break
			case ContactSocialType.FACEBOOK:
				socialUrlType = "facebook.com/"
				if (element.socialId.indexOf("http") !== -1 || element.socialId.indexOf(worldwidew) !== -1) {
					socialUrlType = ""
				}
				break
			case ContactSocialType.XING:
				socialUrlType = "xing.com/profile/"
				if (element.socialId.indexOf("http") !== -1 || element.socialId.indexOf(worldwidew) !== -1) {
					socialUrlType = ""
				}
				break
			case ContactSocialType.LINKED_IN:
				socialUrlType = "linkedin.com/in/"
				if (element.socialId.indexOf("http") !== -1 || element.socialId.indexOf(worldwidew) !== -1) {
					socialUrlType = ""
				}
		}
		if (element.socialId.indexOf("http") !== -1) {
			http = ""
		}
		if (element.socialId.indexOf(worldwidew) !== -1) {
			worldwidew = ""
		}
		return `${http}${worldwidew}${socialUrlType}${element.socialId.trim()}`
	}


	_writeMail(mailAddress: string): Promise<*> {
		return locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
			const name = `${this.contact.firstName} ${this.contact.lastName}`.trim()
			return newMailEditorFromTemplate(mailboxDetails, {to: [{name, address: mailAddress}]},
				"", appendEmailSignature("", logins.getUserController().props))
				.then(editor => editor.show())
		})
	}

	delete() {
		Dialog.confirm("deleteContact_msg").then((confirmed) => {
			if (confirmed) {
				locator.entityClient.erase(this.contact).catch(NotFoundError, e => {
					// ignore because the delete key shortcut may be executed again while the contact is already deleted
				})
			}
		})
	}

	edit() {
		new ContactEditor(locator.entityClient, this.contact).show()
	}


	_hasBirthday(): boolean {
		return (!!this.contact.birthdayIso)
	}
}
