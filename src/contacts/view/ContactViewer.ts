import m, { Child, Children, ClassComponent, Component } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { ContactEditor } from "../ContactEditor"
import { TextField, TextFieldType } from "../../gui/base/TextField.js"
import { keyManager, Shortcut } from "../../misc/KeyManager"
import { Dialog } from "../../gui/base/Dialog"
import { Icons } from "../../gui/base/icons/Icons"
import { NotFoundError } from "../../api/common/error/RestError"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import type { ContactAddressType } from "../../api/common/TutanotaConstants"
import { getContactSocialType, Keys } from "../../api/common/TutanotaConstants"
import type { Contact, ContactAddress, ContactPhoneNumber, ContactSocialId } from "../../api/entities/tutanota/TypeRefs.js"
import { locator } from "../../api/main/MainLocator"
import { newMailEditorFromTemplate } from "../../mail/editor/MailEditor"
import { downcast, NBSP, noOp, ofClass } from "@tutao/tutanota-utils"
import { ActionBar } from "../../gui/base/ActionBar"
import { getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel } from "./ContactGuiUtils"
import { appendEmailSignature } from "../../mail/signature/Signature"
import { formatBirthdayOfContact, getSocialUrl } from "../model/ContactUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

assertMainOrNode()

function insertBetween(array: Children[], spacer: () => Children) {
	let ret: Children = []

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

export class ContactViewer implements ClassComponent {
	readonly contact: Contact
	readonly contactAppellation: string
	readonly oncreate: Component["oncreate"]
	readonly onremove: Component["onremove"]
	readonly formattedBirthday: string | null

	constructor(contact: Contact) {
		this.contact = contact
		let title = this.contact.title ? this.contact.title + " " : ""
		let nickname = this.contact.nickname ? ' | "' + this.contact.nickname + '"' : ""
		let fullName = this.contact.firstName + " " + this.contact.lastName
		this.contactAppellation = (title + fullName + nickname).trim()
		this.formattedBirthday = this._hasBirthday() ? formatBirthdayOfContact(this.contact) : null
		let shortcuts: Array<Shortcut> = [
			{
				key: Keys.E,
				exec: () => this.edit(),
				help: "editContact_label",
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)

		this.onremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	view(): Children {
		return [
			m("#contact-viewer.fill-absolute.scroll.plr-l.pb-floating.mlr-safe-inset", [
				m(".header.pt-ml", [
					m(".contact-actions.flex-space-between.flex-wrap.mt-xs", [
						m(".left.flex-grow-shrink-150", [
							m(".h2.selectable.text-break", [
								this.contactAppellation,
								NBSP, // alignment in case nothing is present here
							]),
							m(".flex-wrap.selectable", [
								insertBetween(
									[
										this.contact.company ? m("span.company", this.contact.company) : null,
										this.contact.role ? m("span.title", this.contact.role) : null,
										this.formattedBirthday ? m("span.birthday", this.formattedBirthday) : null,
									],
									() => m("span", " | "),
								),
								NBSP, // alignment in case nothing is present here
							]),
						]),
						m(".action-bar.align-self-end", [
							//css align self needed otherwise the buttons will float in the top right corner instead of bottom right
							this._createActionbar(),
						]),
					]),
					m("hr.hr.mt.mb"),
				]),
				this._renderMailAddressesAndPhones(),
				this._renderAddressesAndSocialIds(),
				this._renderComment(),
			]),
		]
	}

	_renderAddressesAndSocialIds(): Children {
		const addresses = this.contact.addresses.map((element) => this._createAddress(element))
		const socials = this.contact.socialIds.map((element) => this._createSocialId(element))
		return addresses.length > 0 || socials.length > 0
			? m(".wrapping-row", [
					m(".address.mt-l", addresses.length > 0 ? [m(".h4", lang.get("address_label")), m(".aggregateEditors", addresses)] : null),
					m(".social.mt-l", socials.length > 0 ? [m(".h4", lang.get("social_label")), m(".aggregateEditors", socials)] : null),
			  ])
			: null
	}

	_renderMailAddressesAndPhones(): Children {
		const mailAddresses = this.contact.mailAddresses.map((element) => this._createMailAddress(element))
		const phones = this.contact.phoneNumbers.map((element) => this._createPhone(element))
		return mailAddresses.length > 0 || phones.length > 0
			? m(".wrapping-row", [
					m(".mail.mt-l", mailAddresses.length > 0 ? [m(".h4", lang.get("email_label")), m(".aggregateEditors", [mailAddresses])] : null),
					m(".phone.mt-l", phones.length > 0 ? [m(".h4", lang.get("phone_label")), m(".aggregateEditors", [phones])] : null),
			  ])
			: null
	}

	_renderComment(): Children {
		return this.contact.comment && this.contact.comment.trim().length > 0
			? [m("hr.hr.mt-l"), m("p.mt-l.text-prewrap.text-break.selectable", this.contact.comment)]
			: null
	}

	_createActionbar(): Children {
		const actionBarButtons: IconButtonAttrs[] = [
			{
				title: "edit_action",
				click: () => this.edit(),
				icon: Icons.Edit,
			},
			{
				title: "delete_action",
				click: () => this.delete(),
				icon: Icons.Trash,
			},
		]
		return m(ActionBar, {
			buttons: actionBarButtons,
		})
	}

	_createSocialId(contactSocialId: ContactSocialId): Children {
		const showButton = m(IconButton, {
			title: "showURL_alt",
			click: noOp,
			icon: Icons.ArrowForward,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactSocialTypeLabel(getContactSocialType(contactSocialId), contactSocialId.customTypeName),
			value: contactSocialId.socialId,
			disabled: true,
			injectionsRight: () => m(`a[href=${getSocialUrl(contactSocialId)}][target=_blank]`, showButton),
		})
	}

	_createMailAddress(address: ContactAddress): Child {
		const newMailButton = m(IconButton, {
			title: "sendMail_alt",
			click: () => this._writeMail(address.address),
			icon: BootIcons.Mail,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactAddressTypeLabel(address.type as any, address.customTypeName),
			value: address.address,
			disabled: true,
			injectionsRight: () => [newMailButton],
		})
	}

	_createPhone(phone: ContactPhoneNumber): Children {
		const callButton = m(IconButton, {
			title: "callNumber_alt",
			click: () => null,
			icon: Icons.Call,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactPhoneNumberTypeLabel(phone.type as any, phone.customTypeName),
			value: phone.number,
			disabled: true,
			injectionsRight: () => m(`a[href="tel:${phone.number}"][target=_blank]`, callButton),
		})
	}

	_createAddress(address: ContactAddress): Children {
		let prepAddress: string

		if (address.address.indexOf("\n") !== -1) {
			prepAddress = encodeURIComponent(address.address.split("\n").join(" "))
		} else {
			prepAddress = encodeURIComponent(address.address)
		}

		const showButton = m(IconButton, {
			title: "showAddress_alt",
			click: () => null,
			icon: Icons.Pin,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactAddressTypeLabel(downcast<ContactAddressType>(address.type), address.customTypeName),
			value: address.address,
			disabled: true,
			type: TextFieldType.Area,
			injectionsRight: () => m(`a[href="https://www.openstreetmap.org/search?query=${prepAddress}"][target=_blank]`, showButton),
		})
	}

	_writeMail(mailAddress: string): Promise<any> {
		return locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
			const name = `${this.contact.firstName} ${this.contact.lastName}`.trim()
			return newMailEditorFromTemplate(
				mailboxDetails,
				{
					to: [
						{
							name,
							address: mailAddress,
						},
					],
				},
				"",
				appendEmailSignature("", locator.logins.getUserController().props),
			).then((editor) => editor.show())
		})
	}

	delete() {
		Dialog.confirm("deleteContact_msg").then((confirmed) => {
			if (confirmed) {
				locator.entityClient.erase(this.contact).catch(
					ofClass(NotFoundError, (e) => {
						// ignore because the delete key shortcut may be executed again while the contact is already deleted
					}),
				)
			}
		})
	}

	edit() {
		new ContactEditor(locator.entityClient, this.contact).show()
	}

	_hasBirthday(): boolean {
		return !!this.contact.birthdayIso
	}
}
