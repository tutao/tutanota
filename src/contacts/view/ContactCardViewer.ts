import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../gui/theme.js"
import { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactViewer } from "./ContactViewer.js"
import { PartialRecipient } from "../../api/common/recipients/Recipient.js"
import { responsiveCardHMargin } from "../../gui/cards.js"

export interface ContactCardAttrs {
	contact: Contact
	onWriteMail: (to: PartialRecipient) => unknown
}

/** Wraps contact viewer in a nice card. */
export class ContactCardViewer implements Component<ContactCardAttrs> {
	view({ attrs }: Vnode<ContactCardAttrs>): Children {
		const { contact, onWriteMail } = attrs
		return [
			m(
				".border-radius-big.rel",
				{
					class: responsiveCardHMargin(),
					style: {
						backgroundColor: theme.content_bg,
					},
				},
				m(ContactViewer, { contact, onWriteMail }),
			),
			m(".mt-l"),
		]
	}
}
