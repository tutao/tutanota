// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import {lang} from "../../misc/LanguageViewModel"
import {Icons} from "../../gui/base/icons/Icons"
import type {ContactView} from "./ContactView"
import {exportContacts} from "../VCardExporter"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {theme} from "../../gui/theme"
import {NBSP} from "../../api/common/utils/StringUtils"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ActionBar} from "../../gui/base/ActionBar"

assertMainOrNode()

/**
 * The ContactViewer displays the action buttons for multiple selected contacts.
 */
export class MultiContactViewer {
	view: Function;
	_contactView: ContactView

	constructor(contactView: ContactView) {
		this._contactView = contactView
		let actionBarButtons = this.createActionBarButtons()
		this.view = () => {
			return [
				m(".fill-absolute.mt-xs.plr-l",
					(contactView._contactList && contactView._contactList.list.getSelectedEntities().length > 0) ? [
							// Add spacing so buttons for contacts also align with the regular client view's buttons
							m(".header.pt-ml.flex-space-between",
								m(".left.flex-grow", [
									m(".contact-actions.flex-wrap.flex-grow-shrink", [
										m(".h2", NBSP),
										m(".flex-space-between", m(".flex-wrap.items-center", this._getContactSelectionMessage(contactView)))
									]),
								]),
								m(".action-bar.align-self-end", m(ActionBar, {buttons: actionBarButtons}))
							)
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

	createActionBarButtons(actionCallback: (() => void) = () => {}, prependCancel: boolean = false): ButtonAttrs[] {
		return [
			{
				label: "cancel_action",
				click: actionCallback,
				icon: () => Icons.Cancel,
				isVisible: () => prependCancel
			},
			{
				label: "delete_action",
				click: () => this._contactView._deleteSelected().then(actionCallback),
				icon: () => Icons.Trash
			},
			{
				label: "merge_action",
				click: () => this._contactView.mergeSelected().then(actionCallback),
				icon: () => Icons.People,
				isVisible: () => this._contactView._contactList.list.getSelectedEntities().length === 2
			},
			{
				label: "exportSelectedAsVCard_action",
				click: () => exportContacts(this._contactView._contactList.list.getSelectedEntities()),
				icon: () => Icons.Export
			}
		]
	}
}
