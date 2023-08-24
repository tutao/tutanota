import m, { Children, Component, Vnode } from "mithril"
import { Contact, ContactListEntry, createContact, createContactMailAddress } from "../../api/entities/tutanota/TypeRefs.js"
import { theme } from "../../gui/theme.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { responsiveCardHMargin } from "../../gui/cards.js"
import { ContactCardViewer } from "./ContactCardViewer.js"
import { ContactAddressType } from "../../api/common/TutanotaConstants.js"
import { PartialRecipient } from "../../api/common/recipients/Recipient.js"
import { lang } from "../../misc/LanguageViewModel.js"

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
				".border-radius-big.rel",
				{
					class: responsiveCardHMargin(),
					style: {
						backgroundColor: theme.content_bg,
					},
				},
				m(".plr-l.pt.pb.mlr-safe-inset", m(".h2.selectable.text-break", attrs.entry.emailAddress)),
			),
			m(".mt-l"),
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
						".border-radius-big.rel",
						{
							class: responsiveCardHMargin(),
							style: {
								backgroundColor: theme.content_bg,
							},
						},
						m(
							".plr-l.pt.pb.mlr-safe-inset",
							lang.get("noContactFound_msg"),
							m(Button, {
								label: "createContact_action",
								click: () => {
									let newContact = createContact()
									let newAddress = createContactMailAddress({
										type: ContactAddressType.WORK,
										customTypeName: "",
										address: attrs.entry.emailAddress,
									})
									newContact.mailAddresses.push(newAddress)
									attrs.contactCreate(newContact)
								},
								type: ButtonType.Primary,
							}),
						),
				  ),
		])
	}
}

export function getContactListEntriesSelectionMessage(selectedEntities: ContactListEntry[] | undefined): string {
	if (selectedEntities && selectedEntities.length > 0) {
		return lang.get("nbrOfEntriesSelected_msg", { "{nbr}": selectedEntities.length })
	} else {
		return lang.get("noSelection_msg")
	}
}
