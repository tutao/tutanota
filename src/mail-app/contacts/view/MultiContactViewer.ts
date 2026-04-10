import m, { Component, Vnode } from "mithril"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { theme } from "../../../common/gui/theme"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import { Icons } from "../../../common/gui/base/icons/Icons"

assertMainOrNode()

export interface MultiContactViewerAttrs {
	selectedEntities: tutanotaTypeRefs.Contact[]
	selectNone: () => unknown
}

/**
 * The ContactViewer displays the action buttons for multiple selected contacts.
 */
export class MultiContactViewer implements Component<MultiContactViewerAttrs> {
	view({ attrs }: Vnode<MultiContactViewerAttrs>) {
		return [
			m(ColumnEmptyMessageBox, {
				message: getContactSelectionMessage(attrs.selectedEntities.length),
				icon: Icons.PeopleFilled,
				color: theme.on_surface_variant,
				bottomContent:
					attrs.selectedEntities.length > 0
						? m(Button, {
								label: "cancel_action",
								type: ButtonType.Secondary,
								click: () => attrs.selectNone(),
							})
						: undefined,
				backgroundColor: theme.surface_container,
			}),
		]
	}
}

export function getContactSelectionMessage(numberEntities: number): Translation {
	if (numberEntities === 0) {
		return lang.getTranslation("noContact_msg")
	} else {
		return lang.getTranslation("nbrOfContactsSelected_msg", {
			"{1}": numberEntities,
		})
	}
}
