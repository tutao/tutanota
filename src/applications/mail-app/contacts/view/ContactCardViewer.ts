import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../../../ui/theme.js"
import { ContactViewer } from "./ContactViewer.js"
import { responsiveCardHMargin } from "../../../../ui/cards.js"
import { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import { Contact } from "@tutao/entities/tutanota"

import { PartialRecipient } from "../../../../entities/tutanota/Utils"

export interface ContactCardAttrs {
	contact: Contact
	onWriteMail: (to: PartialRecipient) => unknown
	editAction?: (contact: Contact) => unknown
	deleteAction?: (contacts: Contact[]) => unknown
	extendedActions?: boolean
	style?: Record<string, any>
	highlightedStrings?: readonly SearchToken[]
}

/** Wraps contact viewer in a nice card. */
export class ContactCardViewer implements Component<ContactCardAttrs> {
	view({ attrs }: Vnode<ContactCardAttrs>): Children {
		const { contact, onWriteMail, editAction, deleteAction, extendedActions, highlightedStrings } = attrs
		return [
			m(
				".border-radius-12.rel",
				{
					class: responsiveCardHMargin(),
					style: {
						backgroundColor: theme.surface,
						...attrs.style,
					},
				},
				m(ContactViewer, {
					contact,
					onWriteMail,
					editAction,
					deleteAction,
					extendedActions,
					highlightedStrings,
				}),
			),
			m(".mt-32"),
		]
	}
}
