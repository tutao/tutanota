import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager.js"
import { Keys } from "../../../common/api/common/TutanotaConstants.js"

export interface CalendarViewToolbarAttrs {
	event: CalendarEvent | null
	onEdit: (event: CalendarEvent) => unknown
	onDelete: (event: CalendarEvent) => unknown
	onExport: (event: CalendarEvent) => unknown
}

/**
 * Displays actions for calendar event in search view
 * Also registers shortcuts
 */
export class CalendarViewerActions implements Component<CalendarViewToolbarAttrs> {
	private shortcuts: Array<Shortcut> = []

	view({ attrs }: Vnode<CalendarViewToolbarAttrs>): Children {
		const { event, onDelete, onEdit, onExport } = attrs
		const actionButtons: Children[] = []
		if (event != null) {
			if (this.canEdit(event)) {
				actionButtons.push(
					m(IconButton, {
						title: "edit_action",
						click: () => onEdit(event),
						icon: Icons.Edit,
					}),
				)
			}

			if (this.canExport(event)) {
				actionButtons.push(
					m(IconButton, {
						title: "export_action",
						click: () => onExport(event),
						icon: Icons.Export,
					}),
				)
			}
			if (this.canDelete(event)) {
				actionButtons.push(
					m(IconButton, {
						title: "delete_action",
						click: () => onDelete(event),
						icon: Icons.Trash,
					}),
				)
			}
		}
		return actionButtons
	}

	onupdate(vnode: VnodeDOM<CalendarViewToolbarAttrs>) {
		keyManager.unregisterShortcuts(this.shortcuts)
		this.shortcuts.length = 0
		const { event, onEdit, onDelete, onExport } = vnode.attrs
		if (event == null) return
		if (this.canEdit(event)) {
			this.shortcuts.push({
				key: Keys.E,
				exec: () => {
					onEdit(event)
				},
				help: "edit_action",
			})
		}
		if (this.canExport(event)) {
			this.shortcuts.push({
				key: Keys.E,
				ctrlOrCmd: true,
				exec: () => {
					onExport(event)
				},
				help: "export_action",
			})
		}

		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	private canExport(event: CalendarEvent) {
		return true
	}

	private canDelete(event: CalendarEvent) {
		return true
	}

	private canEdit(event: CalendarEvent) {
		return true
	}
}
