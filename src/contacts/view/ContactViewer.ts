import m, { Children, ClassComponent, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { TextField, TextFieldType } from "../../gui/base/TextField.js"
import { Icons } from "../../gui/base/icons/Icons"
import type { ContactAddressType } from "../../api/common/TutanotaConstants"
import { ContactPhoneNumberType, getContactSocialType } from "../../api/common/TutanotaConstants"
import type { Contact, ContactAddress, ContactPhoneNumber, ContactSocialId } from "../../api/entities/tutanota/TypeRefs.js"
import { assertNotNull, downcast, memoized, NBSP, noOp } from "@tutao/tutanota-utils"
import { getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel } from "./ContactGuiUtils"
import { formatBirthdayOfContact, getSocialUrl } from "../model/ContactUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { PartialRecipient } from "../../api/common/recipients/Recipient.js"
import { attachDropdown } from "../../gui/base/Dropdown.js"

assertMainOrNode()

export interface ContactViewerAttrs {
	contact: Contact
	onWriteMail: (to: PartialRecipient) => unknown
	editAction?: (contact: Contact) => unknown
	deleteAction?: (contacts: Contact[]) => unknown
}

/**
 *  Displays information about a single contact
 */
export class ContactViewer implements ClassComponent<ContactViewerAttrs> {
	private readonly contactAppellation = memoized((contact: Contact) => {
		const title = contact.title ? `${contact.title} ` : ""
		// const nickname = contact.nickname ? ` | "${contact.nickname}"` : ""
		const fullName = `${contact.firstName} ${contact.lastName}`
		return (title + fullName).trim()
	})

	private readonly formattedBirthday = memoized((contact: Contact) => {
		return this.hasBirthday(contact) ? formatBirthdayOfContact(contact) : null
	})

	private hasBirthday(contact: Contact): boolean {
		return contact.birthdayIso != null
	}

	view({ attrs }: Vnode<ContactViewerAttrs>): Children {
		const { contact, onWriteMail } = attrs
		return m(".plr-l.pb-floating.mlr-safe-inset", [
			m("", [
				m(
					".flex-space-between.flex-wrap.mt-m",
					m(".left.flex-grow-shrink-150", [
						m(".h2.selectable.text-break", [
							this.contactAppellation(contact),
							NBSP, // alignment in case nothing is present here
						]),
						contact.nickname ? m("", `"${contact.nickname}"`) : null,
						m(
							"",
							insertBetween([contact.role ? m("span", contact.role) : null, contact.company ? m("span", contact.company) : null], () =>
								m(
									"span.plr-s",
									{
										style: {
											fontWeight: "900",
										},
									},
									" · ",
								),
							),
						),
						this.hasBirthday(contact) ? m("", this.formattedBirthday(contact)) : null,
					]),
					contact && (attrs.editAction || attrs.deleteAction)
						? m(
								".flex-end",
								m(
									IconButton,
									attachDropdown({
										mainButtonAttrs: {
											title: "more_label",
											icon: Icons.More,
										},
										childAttrs: () => {
											return [
												attrs.editAction
													? {
															label: "edit_action",
															icon: Icons.Edit,
															click: () => {
																assertNotNull(attrs.editAction, "Edit action in Contact Viewer has disappeared")(contact)
															},
													  }
													: null,
												attrs.deleteAction
													? {
															label: "delete_action",
															icon: Icons.Trash,
															click: () => {
																assertNotNull(attrs.deleteAction, "Delete action in Contact Viewer has disappeared")([contact])
															},
													  }
													: null,
											]
										},
									}),
								),
						  )
						: null,
				),
				m("hr.hr.mt.mb"),
			]),
			this.renderMailAddressesAndPhones(contact, onWriteMail),
			this.renderAddressesAndSocialIds(contact),
			this.renderComment(contact),
		])
	}

	private renderAddressesAndSocialIds(contact: Contact): Children {
		const addresses = contact.addresses.map((element) => this.renderAddress(element))
		const socials = contact.socialIds.map((element) => this.renderSocialId(element))
		return addresses.length > 0 || socials.length > 0
			? m(".wrapping-row", [
					m(".address.mt-l", addresses.length > 0 ? [m(".h4", lang.get("address_label")), m(".aggregateEditors", addresses)] : null),
					m(".social.mt-l", socials.length > 0 ? [m(".h4", lang.get("social_label")), m(".aggregateEditors", socials)] : null),
			  ])
			: null
	}

	private renderMailAddressesAndPhones(contact: Contact, onWriteMail: ContactViewerAttrs["onWriteMail"]): Children {
		const mailAddresses = contact.mailAddresses.map((element) => this.renderMailAddress(contact, element, onWriteMail))
		const phones = contact.phoneNumbers.map((element) => this.renderPhoneNumber(element))
		return mailAddresses.length > 0 || phones.length > 0
			? m(".wrapping-row", [
					m(".mail.mt-l", mailAddresses.length > 0 ? [m(".h4", lang.get("email_label")), m(".aggregateEditors", [mailAddresses])] : null),
					m(".phone.mt-l", phones.length > 0 ? [m(".h4", lang.get("phone_label")), m(".aggregateEditors", [phones])] : null),
			  ])
			: null
	}

	private renderComment(contact: Contact): Children {
		return contact.comment && contact.comment.trim().length > 0
			? [m(".h4.mt-l", lang.get("comment_label")), m("p.mt-l.text-prewrap.text-break.selectable", contact.comment)]
			: null
	}

	private renderSocialId(contactSocialId: ContactSocialId): Children {
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

	private renderMailAddress(contact: Contact, address: ContactAddress, onWriteMail: ContactViewerAttrs["onWriteMail"]): Children {
		const newMailButton = m(IconButton, {
			title: "sendMail_alt",
			click: () => onWriteMail({ name: `${contact.firstName} ${contact.lastName}`.trim(), address: address.address, contact: contact }),
			icon: Icons.PencilSquare,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactAddressTypeLabel(address.type as any, address.customTypeName),
			value: address.address,
			disabled: true,
			injectionsRight: () => [newMailButton],
		})
	}

	private renderPhoneNumber(phone: ContactPhoneNumber): Children {
		const callButton = m(IconButton, {
			title: "callNumber_alt",
			click: () => null,
			icon: Icons.Call,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactPhoneNumberTypeLabel(phone.type as ContactPhoneNumberType, phone.customTypeName),
			value: phone.number,
			disabled: true,
			injectionsRight: () => m(`a[href="tel:${phone.number}"][target=_blank]`, callButton),
		})
	}

	private renderAddress(address: ContactAddress): Children {
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
}

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
