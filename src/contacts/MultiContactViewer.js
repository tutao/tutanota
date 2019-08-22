// @flow
import m from "mithril"
import {Button} from "../gui/base/Button"
import {assertMainOrNode} from "../api/Env"
import {ActionBar} from "../gui/base/ActionBar"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox"
import {lang} from "../misc/LanguageViewModel"
import {Icons} from "../gui/base/icons/Icons"
import {ContactView} from "./ContactView"
import {exportContacts} from "./VCardExporter"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {theme} from "../gui/theme"

assertMainOrNode()

/**
 * The ContactViewer displays the action buttons for multiple selected contacts.
 */
export class MultiContactViewer {
	view: Function;
	_contactView: ContactView

	constructor(contactView: ContactView) {
		this._contactView = contactView
		let actionBar = this.createActionBar()
		this.view = () => {
			return [
				m(".fill-absolute.mt-xs.plr-l",
					(contactView._contactList && contactView._contactList.list.getSelectedEntities().length > 0) ? [
							m(".button-height"), // just for the margin
							m(".flex-space-between", [
								m(".flex.items-center", this._getContactSelectionMessage(contactView)),
								m(actionBar)
							])
						] :
						m(ColumnEmptyMessageBox, {
							message: () => this._getContactSelectionMessage(contactView),
							icon: BootIcons.Contacts,
							color: theme.content_message_bg,
						}))
			]
		}
	}

	_getContactSelectionMessage(contactView: ContactView): string {
		var nbrOfSelectedContacts = (contactView._contactList) ? contactView._contactList.list.getSelectedEntities().length : 0
		if (nbrOfSelectedContacts === 0) {
			return lang.get("noContact_msg")
		} else {
			return lang.get("nbrOfContactsSelected_msg", {"{1}": nbrOfSelectedContacts})
		}
	}

	createActionBar(actionCallback: (() => void) = () => {}, prependCancel: boolean = false): Component {

		const actions = new ActionBar()
		if (prependCancel) {
			actions.add(new Button("cancel_action", actionCallback, () => Icons.Cancel))
		}
		actions.add(new Button('delete_action',
			() => this._contactView._deleteSelected().then(actionCallback), () => Icons.Trash))
		actions.add(new Button("merge_action", () => this._contactView.mergeSelected().then(actionCallback),
			() => Icons.People)
			.setIsVisibleHandler(() => this._contactView._contactList.list.getSelectedEntities().length === 2))
		actions.add(new Button("exportSelectedAsVCard_action", () => {
			exportContacts(this._contactView._contactList.list.getSelectedEntities())
		}, () => Icons.Export))
		return actions
	}
}
