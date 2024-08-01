import m, { Children, ClassComponent, Vnode } from "mithril"
import { lang } from "../../../common/misc/LanguageViewModel"
import { TextField, TextFieldType } from "../../../common/gui/base/TextField.js"
import { Icons } from "../../../common/gui/base/icons/Icons"
import {
	ContactAddressType,
	ContactPhoneNumberType,
	getContactSocialType,
	getCustomDateType,
	getRelationshipType,
} from "../../../common/api/common/TutanotaConstants"
import type {
	Contact,
	ContactAddress,
	ContactMessengerHandle,
	ContactPhoneNumber,
	ContactSocialId,
	ContactWebsite,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, downcast, memoized, NBSP, noOp } from "@tutao/tutanota-utils"
import {
	getContactAddressTypeLabel,
	getContactCustomDateTypeToLabel,
	getContactCustomWebsiteTypeToLabel,
	getContactMessengerHandleTypeToLabel,
	getContactPhoneNumberTypeLabel,
	getContactRelationshipTypeToLabel,
	getContactSocialTypeLabel,
} from "./ContactGuiUtils"
import { formatContactDate, getMessengerHandleUrl, getSocialUrl, getWebsiteUrl } from "../../../common/contactsFunctionality/ContactUtils.js"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { PartialRecipient } from "../../../common/api/common/recipients/Recipient.js"
import { attachDropdown } from "../../../common/gui/base/Dropdown.js"

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
		const middleName = contact.middleName != null ? ` ${contact.middleName} ` : " "
		const fullName = `${contact.firstName}${middleName}${contact.lastName} `
		const suffix = contact.nameSuffix ?? ""
		return (title + fullName + suffix).trim()
	})

	private readonly contactPhoneticName = memoized((contact: Contact): string | null => {
		const firstName = contact.phoneticFirst ?? ""
		const middleName = contact.phoneticMiddle ? ` ${contact.phoneticMiddle}` : ""
		const lastName = contact.phoneticLast ? ` ${contact.phoneticLast}` : ""

		const phoneticName = (firstName + middleName + lastName).trim()

		return phoneticName.length > 0 ? phoneticName : null
	})

	private readonly formattedBirthday = memoized((contact: Contact) => {
		return this.hasBirthday(contact) ? formatContactDate(contact.birthdayIso) : null
	})

	private hasBirthday(contact: Contact): boolean {
		return contact.birthdayIso != null
	}

	view({ attrs }: Vnode<ContactViewerAttrs>): Children {
		const { contact, onWriteMail } = attrs

		const phoneticName = this.contactPhoneticName(attrs.contact)

		return m(".plr-l.pb-floating.mlr-safe-inset", [
			m("", [
				m(
					".flex-space-between.flex-wrap.mt-m",
					m(".left.flex-grow-shrink-150", [
						m(".h2.selectable.text-break", [
							this.contactAppellation(contact),
							NBSP, // alignment in case nothing is present here
						]),
						phoneticName ? m("", phoneticName) : null,
						contact.pronouns.length > 0 ? this.renderPronounsInfo(contact) : null,
						contact.nickname ? m("", `"${contact.nickname}"`) : null,
						m("", this.renderJobInformation(contact)),
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
			this.renderCustomDatesAndRelationships(contact),
			this.renderMailAddressesAndPhones(contact, onWriteMail),
			this.renderAddressesAndSocialIds(contact),
			this.renderWebsitesAndInstantMessengers(contact),
			this.renderComment(contact),
		])
	}

	private renderJobInformation(contact: Contact): Children {
		const spacerFunction = () =>
			m(
				"span.plr-s",
				{
					style: {
						fontWeight: "900",
					},
				},
				" · ",
			)

		return insertBetween(
			[
				contact.role ? m("span", contact.role) : null,
				contact.department ? m("span", contact.department) : null,
				contact.company ? m("span", contact.company) : null,
			],
			spacerFunction,
		)
	}

	private renderPronounsInfo(contact: Contact): Children {
		const spacerFunction = () =>
			m(
				"span.plr-s",
				{
					style: {
						fontWeight: "900",
					},
				},
				" · ",
			)

		return insertBetween(
			contact.pronouns.map((pronouns) => {
				let language = ""
				if (pronouns.language != "") {
					language = `${pronouns.language}: `
				}

				return m("span", `${language}${pronouns.pronouns}`)
			}),
			spacerFunction,
		)
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

	private renderWebsitesAndInstantMessengers(contact: Contact): Children {
		const websites = contact.websites.map((element) => this.renderWebsite(element))
		const instantMessengers = contact.messengerHandles.map((element) => this.renderMessengerHandle(element))
		return websites.length > 0 || instantMessengers.length > 0
			? m(".wrapping-row", [
					m(".website.mt-l", websites.length > 0 ? [m(".h4", lang.get("websites_label")), m(".aggregateEditors", websites)] : null),
					m(
						".messenger-handles.mt-l",
						instantMessengers.length > 0 ? [m(".h4", lang.get("messenger_handles_label")), m(".aggregateEditors", instantMessengers)] : null,
					),
			  ])
			: null
	}

	private renderCustomDatesAndRelationships(contact: Contact): Children {
		const dates = contact.customDate.map((element) =>
			m(TextField, {
				label: () => getContactCustomDateTypeToLabel(getCustomDateType(element), element.customTypeName),
				value: formatContactDate(element.dateIso),
				isReadOnly: true,
			}),
		)
		const relationships = contact.relationships.map((element) =>
			m(TextField, {
				label: () => getContactRelationshipTypeToLabel(getRelationshipType(element), element.customTypeName),
				value: element.person,
				isReadOnly: true,
			}),
		)

		return dates.length > 0 || relationships.length > 0
			? m(".wrapping-row", [
					m(".dates.mt-l", dates.length > 0 ? [m(".h4", lang.get("dates_label")), m(".aggregateEditors", dates)] : null),
					m(
						".relationships.mt-l",
						relationships.length > 0 ? [m(".h4", lang.get("relationships_label")), m(".aggregateEditors", relationships)] : null,
					),
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
			isReadOnly: true,
			injectionsRight: () => m(`a[href=${getSocialUrl(contactSocialId)}][target=_blank]`, showButton),
		})
	}

	private renderWebsite(website: ContactWebsite): Children {
		const showButton = m(IconButton, {
			title: "showURL_alt",
			click: noOp,
			icon: Icons.ArrowForward,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactCustomWebsiteTypeToLabel(downcast(website.type), website.customTypeName),
			value: website.url,
			isReadOnly: true,
			injectionsRight: () => m(`a[href=${getWebsiteUrl(website.url)}][target=_blank]`, showButton),
		})
	}

	private renderMessengerHandle(messengerHandle: ContactMessengerHandle): Children {
		const showButton = m(IconButton, {
			title: "showURL_alt",
			click: noOp,
			icon: Icons.ArrowForward,
			size: ButtonSize.Compact,
		})
		return m(TextField, {
			label: () => getContactMessengerHandleTypeToLabel(downcast(messengerHandle.type), messengerHandle.customTypeName),
			value: messengerHandle.handle,
			isReadOnly: true,
			injectionsRight: () => m(`a[href=${getMessengerHandleUrl(messengerHandle)}][target=_blank]`, showButton),
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
			isReadOnly: true,
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
			isReadOnly: true,
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
			isReadOnly: true,
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
