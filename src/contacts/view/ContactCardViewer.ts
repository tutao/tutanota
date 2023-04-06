import m, { Children, Component, Vnode } from "mithril"
import { mailViewerMargin } from "../../mail/view/MailViewerUtils.js"
import { theme } from "../../gui/theme.js"
import { px } from "../../gui/size.js"
import { conversationCardMargin } from "../../mail/view/ConversationViewer.js"
import { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactViewer } from "./ContactViewer.js"
import { PartialRecipient } from "../../api/common/recipients/Recipient.js"

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
					class: mailViewerMargin(),
					style: {
						border: `1px solid ${theme.list_border}`,
						backgroundColor: theme.content_bg,
						marginTop: px(conversationCardMargin),
					},
				},
				m(ContactViewer, { contact, onWriteMail }),
			),
			m(".mt-l"),
		]
	}
}
