import m, { Children, Component, Vnode } from "mithril"
import { Contact, ContactListEntry, createContact, createContactMailAddress } from "../../api/entities/tutanota/TypeRefs.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../gui/theme.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { responsiveCardHMargin } from "../../gui/cards.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { ContactCardViewer } from "./ContactCardViewer.js"
import { ContactAddressType } from "../../api/common/TutanotaConstants.js"
import { PartialRecipient } from "../../api/common/recipients/Recipient.js"
import { lang } from "../../misc/LanguageViewModel.js"

export interface ContactListRecipientViewerAttrs {
	recipients: ContactListEntry[] | undefined
	contacts: Contact[]
	contactEdit: (contact: Contact) => unknown
	contactDelete: (contacts: Contact[]) => unknown
	contactCreate: (contact: Contact) => unknown
	onWriteMail: (to: PartialRecipient) => unknown
	selectNone: () => unknown
}

export class ContactListRecipientViewer implements Component<ContactListRecipientViewerAttrs> {
	view({ attrs }: Vnode<ContactListRecipientViewerAttrs>): Children {
		if (attrs.recipients && attrs.recipients.length === 1) {
			return m(".flex.flex-column", [
				m(
					".border-radius-big.rel",
					{
						class: responsiveCardHMargin(),
						style: {
							backgroundColor: theme.content_bg,
						},
					},
					m(".plr-l.pt.pb.mlr-safe-inset", m(".h2.selectable.text-break", attrs.recipients[0].emailAddress)),
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
									label: () => "Create Contact",
									click: () => {
										let newContact = createContact()
										let newAddress = createContactMailAddress({
											type: ContactAddressType.WORK,
											customTypeName: "",
											address: assertNotNull(attrs.recipients)[0].emailAddress,
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
		return m(ColumnEmptyMessageBox, {
			message: () => this.getRecipientSelectionMessage(attrs.recipients),
			icon: Icons.People,
			color: theme.content_message_bg,
			bottomContent:
				attrs.recipients && attrs.recipients.length > 0
					? m(Button, {
							label: "cancel_action",
							type: ButtonType.Secondary,
							click: () => attrs.selectNone(),
					  })
					: undefined,
			backgroundColor: theme.navigation_bg,
		})
	}

	private getRecipientSelectionMessage(selectedEntities: ContactListEntry[] | undefined): string {
		if (selectedEntities && selectedEntities.length > 0) {
			return lang.get("nbrOfEntriesSelected_msg", { "{nbr}": selectedEntities.length })
		} else {
			return lang.get("noSelection_msg")
		}
	}
}
