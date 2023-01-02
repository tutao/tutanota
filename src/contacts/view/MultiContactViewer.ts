import m, { Children } from "mithril"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import { lang } from "../../misc/LanguageViewModel"
import { Icons } from "../../gui/base/icons/Icons"
import type { ContactView } from "./ContactView"
import { exportContacts } from "../VCardExporter"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { theme } from "../../gui/theme"
import { isNotNull, NBSP, noOp, Thunk } from "@tutao/tutanota-utils"
import type { ButtonAttrs } from "../../gui/base/Button.js"
import { ActionBar } from "../../gui/base/ActionBar"
import { assertMainOrNode } from "../../api/common/Env"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"

assertMainOrNode()

/**
 * The ContactViewer displays the action buttons for multiple selected contacts.
 */
export class MultiContactViewer {
	view: (...args: Array<any>) => any
	_contactView: ContactView

	constructor(contactView: ContactView) {
		this._contactView = contactView

		this.view = () => {
			return [
				m(
					".fill-absolute.mt-xs.plr-l",
					contactView._contactList && contactView._contactList.list.getSelectedEntities().length > 0
						? [
								// Add spacing so buttons for contacts also align with the regular client view's buttons
								m(".header.pt-ml.flex-space-between", [
									m(".left.flex-grow", [
										m(".contact-actions.flex-wrap.flex-grow-shrink", [
											m(".h2", NBSP),
											m(".flex-space-between", m(".flex-wrap.items-center", this._getContactSelectionMessage(contactView))),
										]),
									]),
									this._renderActionBar(),
								]),
						  ]
						: m(ColumnEmptyMessageBox, {
								message: () => this._getContactSelectionMessage(contactView),
								icon: BootIcons.Contacts,
								color: theme.content_message_bg,
						  }),
				),
			]
		}
	}

	private _renderActionBar(): Children {
		return m(
			".action-bar.align-self-end",
			m(ActionBar, {
				buttons: this.createActionBarButtons(),
			}),
		)
	}

	_getContactSelectionMessage(contactView: ContactView): string {
		var nbrOfSelectedContacts = contactView._contactList ? contactView._contactList.list.getSelectedEntities().length : 0

		if (nbrOfSelectedContacts === 0) {
			return lang.get("noContact_msg")
		} else {
			return lang.get("nbrOfContactsSelected_msg", {
				"{1}": nbrOfSelectedContacts,
			})
		}
	}

	createActionBarButtons(actionCallback: Thunk = noOp, prependCancel: boolean = false): IconButtonAttrs[] {
		const contactList = this._contactView._contactList

		const buttons: (IconButtonAttrs | null)[] = [
			prependCancel
				? {
						title: "cancel_action",
						click: actionCallback,
						icon: Icons.Cancel,
				  }
				: null,
			{
				title: "delete_action",
				click: () => this._contactView._deleteSelected().then(actionCallback),
				icon: Icons.Trash,
			},
			contactList?.list.getSelectedEntities().length === 2
				? {
						title: "merge_action",
						click: () => this._contactView.mergeSelected().then(actionCallback),
						icon: Icons.People,
				  }
				: null,
			contactList
				? {
						title: "exportSelectedAsVCard_action",
						click: () => {
							exportContacts(contactList.list.getSelectedEntities())
						},
						icon: Icons.Export,
				  }
				: null,
		]
		return buttons.filter(isNotNull)
	}
}
