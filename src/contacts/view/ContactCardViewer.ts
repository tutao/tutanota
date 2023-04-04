import m, { Children, Component, Vnode } from "mithril"
import { mailViewerMargin } from "../../mail/view/MailViewerUtils.js"
import { theme } from "../../gui/theme.js"
import { px } from "../../gui/size.js"
import { conversationCardMargin } from "../../mail/view/ConversationViewer.js"
import { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactViewer } from "./ContactViewer.js"

export type ContactCardAttrs = {
	contact: Contact
}

export class ContactCardViewer implements Component<ContactCardAttrs> {
	view(vnode: Vnode<ContactCardAttrs>): Children {
		const contactViewer = new ContactViewer(vnode.attrs.contact)

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
				m(contactViewer),
			),
			m(".mt-l"),
		]
	}
}
