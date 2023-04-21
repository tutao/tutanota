import m, { Component, Vnode } from "mithril"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import { lang } from "../../misc/LanguageViewModel"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { theme } from "../../gui/theme"
import { assertMainOrNode } from "../../api/common/Env"
import { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { Button, ButtonType } from "../../gui/base/Button.js"

assertMainOrNode()

export interface MultiContactViewerAttrs {
	selectedEntities: Contact[]
	selectNone: () => unknown
}

/**
 * The ContactViewer displays the action buttons for multiple selected contacts.
 */
export class MultiContactViewer implements Component<MultiContactViewerAttrs> {
	view({ attrs }: Vnode<MultiContactViewerAttrs>) {
		return [
			m(ColumnEmptyMessageBox, {
				message: () => getContactSelectionMessage(attrs.selectedEntities),
				icon: BootIcons.Contacts,
				color: theme.content_message_bg,
				bottomContent:
					attrs.selectedEntities.length > 0
						? m(Button, {
								label: "cancel_action",
								type: ButtonType.Secondary,
								click: () => attrs.selectNone(),
						  })
						: undefined,
				backgroundColor: theme.navigation_bg,
			}),
		]
	}
}

export function getContactSelectionMessage(selectedEntities: Contact[]): string {
	if (selectedEntities.length === 0) {
		return lang.get("noContact_msg")
	} else {
		return lang.get("nbrOfContactsSelected_msg", {
			"{1}": selectedEntities.length,
		})
	}
}
