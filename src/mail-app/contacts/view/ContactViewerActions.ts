import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Contact } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager.js"
import { Keys } from "../../../common/api/common/TutanotaConstants.js"

export interface ContactViewToolbarAttrs {
	contacts: Contact[]
	onEdit: (contact: Contact) => unknown
	onDelete: (contacts: Contact[]) => unknown
	onMerge: (left: Contact, right: Contact) => unknown
	onExport: (contacts: Contact[]) => unknown
}

/**
 * Displays actions for contact or multiple contacts.
 * Also registers shortcuts
 */
export class ContactViewerActions implements Component<ContactViewToolbarAttrs> {
	private shortcuts: Array<Shortcut> = []

	view({ attrs }: Vnode<ContactViewToolbarAttrs>): Children {
		const { contacts, onDelete, onEdit, onMerge, onExport } = attrs
		const actionButtons: Children[] = []
		if (this.canEdit(contacts)) {
			actionButtons.push(
				m(IconButton, {
					title: "edit_action",
					click: () => onEdit(contacts[0]),
					icon: Icons.Edit,
				}),
			)
		} else if (this.canMerge(contacts)) {
			actionButtons.push(
				m(IconButton, {
					title: "merge_action",
					click: () => onMerge(contacts[0], contacts[1]),
					icon: Icons.People,
				}),
			)
		}

		if (this.canExport(contacts)) {
			actionButtons.push(
				m(IconButton, {
					title: "export_action",
					click: () => onExport(contacts),
					icon: Icons.Export,
				}),
			)
		}
		if (this.canDelete(contacts)) {
			actionButtons.push(
				m(IconButton, {
					title: "delete_action",
					click: () => onDelete(contacts),
					icon: Icons.Trash,
				}),
			)
		}
		return actionButtons
	}

	onupdate(vnode: VnodeDOM<ContactViewToolbarAttrs>) {
		keyManager.unregisterShortcuts(this.shortcuts)
		this.shortcuts.length = 0
		const { contacts, onEdit, onDelete, onMerge, onExport } = vnode.attrs
		if (this.canEdit(contacts)) {
			this.shortcuts.push({
				key: Keys.E,
				exec: () => {
					onEdit(contacts[0])
				},
				help: "edit_action",
			})
		}

		if (this.canMerge(contacts)) {
			this.shortcuts.push({
				key: Keys.M,
				ctrlOrCmd: true,
				exec: () => {
					onMerge(contacts[0], contacts[1])
				},
				help: "merge_action",
			})
		}

		if (this.canExport(contacts)) {
			this.shortcuts.push({
				key: Keys.E,
				ctrlOrCmd: true,
				exec: () => {
					onExport(contacts)
				},
				help: "export_action",
			})
		}
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	private canExport(contacts: Contact[]) {
		return contacts.length > 0
	}

	private canMerge(contacts: Contact[]) {
		return contacts.length === 2
	}

	private canDelete(contacts: Contact[]) {
		return contacts.length > 0
	}

	private canEdit(contacts: Contact[]) {
		return contacts.length === 1
	}
}
