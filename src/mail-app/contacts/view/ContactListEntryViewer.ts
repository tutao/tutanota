import m, { Children, Component, Vnode } from "mithril"
import { Contact, ContactListEntry, createContact, createContactMailAddress } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { theme } from "../../../common/gui/theme.js"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import { responsiveCardHMargin } from "../../../common/gui/cards.js"
import { ContactCardViewer } from "./ContactCardViewer.js"
import { ContactAddressType } from "../../../common/api/common/TutanotaConstants.js"
import { PartialRecipient } from "../../../common/api/common/recipients/Recipient.js"
import { lang, Translation } from "../../../common/misc/LanguageViewModel.js"

export interface ContactListEntryViewerAttrs {
	entry: ContactListEntry
	contacts: Contact[]
	contactEdit: (contact: Contact) => unknown
	contactDelete: (contacts: Contact[]) => unknown
	contactCreate: (contact: Contact) => unknown
	onWriteMail: (to: PartialRecipient) => unknown
	selectNone: () => unknown
}

export class ContactListEntryViewer implements Component<ContactListEntryViewerAttrs> {
	view({ attrs }: Vnode<ContactListEntryViewerAttrs>): Children {
		return m(".flex.flex-column", [
			m(
				".border-radius-12.rel",
				{
					class: responsiveCardHMargin(),
					style: {
						backgroundColor: theme.surface,
					},
				},
				m(".plr-24.pt-16.pb-16.mlr-safe-inset", m(".h2.selectable.text-break", attrs.entry.emailAddress)),
			),
			m(".mt-32"),
			attrs.contacts.length >= 1
				? attrs.contacts.map((contact) =>
						m(ContactCardViewer, {
							contact,
							onWriteMail: attrs.onWriteMail,
							editAction: attrs.contactEdit,
							deleteAction: attrs.contactDelete,
						}),
					)
				: m(
						".border-radius-12.rel",
						{
							class: responsiveCardHMargin(),
							style: {
								backgroundColor: theme.surface,
							},
						},
						m(
							".plr-24.pt-16.pb-16.mlr-safe-inset",
							lang.get("noContactFound_msg"),
							m(Button, {
								label: "createContact_action",
								click: () => {
									let newContact = createContact({
										mailAddresses: [
											createContactMailAddress({
												type: ContactAddressType.WORK,
												customTypeName: "",
												address: attrs.entry.emailAddress,
											}),
										],
										oldBirthdayAggregate: null,
										addresses: [],
										birthdayIso: null,
										comment: "",
										company: "",
										firstName: "",
										lastName: "",
										nickname: null,
										oldBirthdayDate: null,
										phoneNumbers: [],
										photo: null,
										role: "",
										presharedPassword: null,
										socialIds: [],
										title: null,
										department: null,
										middleName: null,
										nameSuffix: null,
										phoneticFirst: null,
										phoneticLast: null,
										phoneticMiddle: null,
										customDate: [],
										messengerHandles: [],
										pronouns: [],
										relationships: [],
										websites: [],
									})
									attrs.contactCreate(newContact)
								},
								type: ButtonType.Primary,
							}),
						),
					),
		])
	}
}

export function getContactListEntriesSelectionMessage(selectedEntities: ContactListEntry[] | undefined): Translation {
	if (selectedEntities && selectedEntities.length > 0) {
		return lang.getTranslation("nbrOfEntriesSelected_msg", { "{nbr}": selectedEntities.length })
	} else {
		return lang.getTranslation("noSelection_msg")
	}
}
