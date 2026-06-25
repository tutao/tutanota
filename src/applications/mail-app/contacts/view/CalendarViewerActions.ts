import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { IconButton } from "../../../../ui/base/IconButton.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { keyManager, Shortcut } from "../../../../ui/utils/KeyManager.js"
import { Keys } from "../../../../platform-kit/app-env"
import { CalendarEvent } from "@tutao/entities/tutanota"

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
						label: "edit_action",
						click: () => onEdit(event),
						icon: Icons.PenFilled,
					}),
				)
			}

			if (this.canExport(event)) {
				actionButtons.push(
					m(IconButton, {
						label: "export_action",
						click: () => onExport(event),
						icon: Icons.CloudDownloadFilled,
					}),
				)
			}
			if (this.canDelete(event)) {
				actionButtons.push(
					m(IconButton, {
						label: "delete_action",
						click: () => onDelete(event),
						icon: Icons.TrashFilled,
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
