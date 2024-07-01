import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../../common/gui/theme.js"
import { Contact } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { ContactViewer } from "./ContactViewer.js"
import { PartialRecipient } from "../../../common/api/common/recipients/Recipient.js"
import { responsiveCardHMargin } from "../../../common/gui/cards.js"

export interface ContactCardAttrs {
	contact: Contact
	onWriteMail: (to: PartialRecipient) => unknown
	editAction?: (contact: Contact) => unknown
	deleteAction?: (contacts: Contact[]) => unknown
}

/** Wraps contact viewer in a nice card. */
export class ContactCardViewer implements Component<ContactCardAttrs> {
	view({ attrs }: Vnode<ContactCardAttrs>): Children {
		const { contact, onWriteMail, editAction, deleteAction } = attrs
		return [
			m(
				".border-radius-big.rel",
				{
					class: responsiveCardHMargin(),
					style: {
						backgroundColor: theme.content_bg,
					},
				},
				m(ContactViewer, {
					contact,
					onWriteMail,
					editAction,
					deleteAction,
				}),
			),
			m(".mt-l"),
		]
	}
}
