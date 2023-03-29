import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { styles } from "../../gui/styles.js"
import { px, size } from "../../gui/size.js"
import { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { noOp } from "@tutao/tutanota-utils"
import { IconButton } from "../../gui/base/IconButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { exportContacts } from "../VCardExporter.js"
import { keyManager, Shortcut } from "../../misc/KeyManager.js"
import { Keys } from "../../api/common/TutanotaConstants.js"

export interface ContactViewToolbarAttrs {
	contacts: Contact[]
	deleteAction?: () => void
	mergeAction?: () => void
	editAction?: () => void
}

export class ContactViewToolbar implements Component<ContactViewToolbarAttrs> {
	shortcuts: Array<Shortcut> = []

	view(vnode: Vnode<ContactViewToolbarAttrs>): Children {
		const { contacts } = vnode.attrs
		if (styles.isSingleColumnLayout()) {
			return null
		}

		return m(
			".flex.pt-xs.pb-xs.list-bg.plr-m.list-border-bottom.items-center.ml-between-s",
			// Height keeps the toolbar showing for consistency, even if there are no actions
			m(".flex-grow", { style: { height: px(size.button_height) } }),
			contacts.length ? this.renderActionButtons(vnode.attrs) : null,
		)
	}

	onupdate(vnode: VnodeDOM<ContactViewToolbarAttrs>) {
		keyManager.unregisterShortcuts(this.shortcuts)
		this.shortcuts.length = 0
		const { editAction, deleteAction, mergeAction, contacts } = vnode.attrs
		if (editAction) {
			this.shortcuts.push({
				key: Keys.E,
				exec: editAction,
				help: "edit_action",
			})
		}

		if (deleteAction) {
			this.shortcuts.push({
				key: Keys.DELETE,
				exec: deleteAction,
				help: "delete_action",
			})
		}

		if (mergeAction) {
			this.shortcuts.push({
				key: Keys.M,
				ctrl: true,
				exec: mergeAction,
				help: "merge_action",
			})
		}

		if (contacts.length > 0) {
			this.shortcuts.push({
				key: Keys.E,
				ctrl: true,
				exec: () => {
					// noinspection JSIgnoredPromiseFromCall
					exportContacts(contacts)
				},
				help: "export_action",
			})
		}
		keyManager.registerShortcuts(this.shortcuts)
	}

	renderActionButtons(attrs: ContactViewToolbarAttrs): Children {
		const { contacts, deleteAction, editAction, mergeAction } = attrs
		const actionButtons: Children[] = []
		if (editAction) {
			actionButtons.push(
				m(IconButton, {
					title: "edit_action",
					click: editAction,
					icon: Icons.Edit,
				}),
			)
		} else if (mergeAction) {
			actionButtons.push(
				m(IconButton, {
					title: "merge_action",
					click: mergeAction,
					icon: Icons.People,
				}),
			)
		}

		if (contacts.length > 0) {
			actionButtons.push(
				m(IconButton, {
					title: "export_action",
					click: () => exportContacts(contacts),
					icon: Icons.Export,
				}),
			)
			actionButtons.push(
				m(IconButton, {
					title: "delete_action",
					click: deleteAction ?? noOp,
					icon: Icons.Trash,
				}),
			)
		}
		return actionButtons
	}
}
