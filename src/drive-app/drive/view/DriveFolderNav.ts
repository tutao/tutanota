import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumbs } from "./DriveBreadcrumbs"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { isNotNull } from "@tutao/tutanota-utils"
import { theme } from "../../../common/gui/theme"
import { component_size, px, size } from "../../../common/gui/size"

import { FolderItem } from "./DriveUtils"

export interface DriveFolderNavAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	loadParents: () => Promise<DriveFolder[]>
	onDropInto: (f: FolderItem, event: DragEvent) => unknown
	selectedItemsActions: DriveSelectedItemsActions
}

export interface DriveSelectedItemsActions {
	onTrash: (() => unknown) | null
	onDelete: (() => unknown) | null
	onRestore: (() => unknown) | null
	onCopy: (() => unknown) | null
	onCut: (() => unknown) | null
	onPaste: (() => unknown) | null
	onMove: (() => unknown) | null
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view({
		attrs: {
			currentFolder,
			parents,
			loadParents,
			onDropInto,
			selectedItemsActions: { onTrash, onDelete, onRestore, onCopy, onCut, onPaste, onMove },
		},
	}: Vnode<DriveFolderNavAttrs>): Children {
		return m(
			".flex.items-center.justify-between.border-radius-12",
			{
				style: {
					background: theme.surface,
					padding: `${size.base_4}px ${size.spacing_12}px ${size.base_4}px ${size.spacing_24}px`,
				},
			},
			m(DriveBreadcrumbs, { currentFolder, parents, loadParents, onDropInto }),
			m(".flex.items-center.column-gap-4", [
				// Ensure that the height of the bar remains the same even when no buttons are shown
				m("", {
					style: {
						width: px(1),
						height: px(component_size.button_height),
					},
				}),

				// Caution: when adding actions, make sure they match the order in the file context menu.
				onPaste
					? m(IconButton, {
							title: "paste_action",
							click: onPaste,
							icon: Icons.Clipboard,
						})
					: null,
				isNotNull(onPaste) && [onRestore, onDelete, onCopy, onCut, onTrash].some(isNotNull) ? m(".nav-bar-spacer") : null,
				onRestore
					? m(IconButton, {
							title: "restoreFromTrash_action",
							click: onRestore,
							icon: Icons.Reply,
						})
					: null,
				onDelete
					? m(IconButton, {
							title: "delete_action",
							click: onDelete,
							icon: Icons.DeleteForever,
						})
					: null,
				onCopy
					? m(IconButton, {
							title: "copy_action",
							click: onCopy,
							icon: Icons.Copy,
						})
					: null,
				onCut
					? m(IconButton, {
							title: "cut_action",
							click: onCut,
							icon: Icons.Cut,
						})
					: null,
				onMove
					? m(IconButton, {
							title: "move_action",
							click: onMove,
							icon: Icons.Move,
						})
					: null,
				onTrash
					? m(IconButton, {
							title: "trash_action",
							click: onTrash,
							icon: Icons.Trash,
						})
					: null,
			]),
		)
	}
}
