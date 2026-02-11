import m, { Children, Component, Vnode } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { formatStorageSize } from "../../../common/misc/Formatter"
import { AllIcons, Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { filterInt } from "@tutao/tutanota-utils"
import { IconButton } from "../../../common/gui/base/IconButton"
import { attachDropdown, DomRectReadOnlyPolyfilled, Dropdown, DropdownChildAttrs } from "../../../common/gui/base/Dropdown"
import { theme } from "../../../common/gui/theme"
import { modal } from "../../../common/gui/base/Modal"
import { FileFolderItem, FolderFolderItem, FolderItem } from "./DriveUtils"

export interface FileActions {
	onCut: (f: FolderItem) => unknown
	onCopy: (f: FolderItem) => unknown
	onOpenItem: (f: FolderItem) => unknown
	onDelete: (f: FolderItem) => unknown
	onRename: (f: FolderItem) => unknown
	onRestore: (f: FolderItem) => unknown
	onStartMove: (f: FolderItem) => unknown
}

export const NoopFileActions: FileActions = {
	onCut: (f: FolderItem) => {},
	onCopy: (f: FolderItem) => {},
	onOpenItem: (f: FolderItem) => {},
	onDelete: (f: FolderItem) => {},
	onRename: (f: FolderItem) => {},
	onRestore: (f: FolderItem) => {},
	onStartMove: (f: FolderItem) => {},
}

export interface DriveFolderContentEntryAttrs {
	item: FolderItem
	selected: boolean
	onSingleSelection: (f: FolderItem) => unknown
	onRangeSelectionTowards: (f: FolderItem) => unknown
	onSingleInclusiveSelection: (f: FolderItem) => unknown
	onSingleExclusiveSelection: (f: FolderItem) => unknown
	checked: boolean
	fileActions: FileActions
	multiselect: boolean
	onDragStart: (f: FolderItem, event: DragEvent) => unknown
	onDropInto: (f: FolderItem, event: DragEvent) => unknown
	onDragEnd: () => unknown
	isCut: boolean
}

const isImageMimeType = (mimeType: string) => ["image/png", "image/jpeg"].includes(mimeType)

const isMusicMimeType = (mimeType: string) => ["audio/mpeg", "audio/wav", "audio/wave", "audio/x-wav", "audio/mp4"].includes(mimeType)

const isDocumentMimeType = (mimeType: string) => ["text/plain", "application/pdf"].includes(mimeType)

export function iconPerMimeType(mimeType: string): AllIcons {
	if (isImageMimeType(mimeType)) {
		return Icons.PictureFile
	} else if (isMusicMimeType(mimeType)) {
		return Icons.MusicFile
	} else if (isDocumentMimeType(mimeType)) {
		return Icons.TextFile
	}

	return Icons.GenericFile
}

const mimeTypeRepresentations: Record<string, string> = {
	"image/jpeg": "JPEG",
	"image/png": "PNG",
	"audio/mpeg": "MPEG",
	"audio/mp4": "AAC/ALAC",
	"application/pdf": "PDF",
	"text/plain": "Text",
}
const mimeTypeAsText = (mimeType: string) => {
	return mimeTypeRepresentations[mimeType] || "File"
}

export class DriveFolderContentEntry implements Component<DriveFolderContentEntryAttrs> {
	private isDraggedOver: boolean = false

	view({
		attrs: {
			multiselect,
			item,
			selected,
			checked,
			onSingleSelection,
			onSingleInclusiveSelection,
			onSingleExclusiveSelection,
			onRangeSelectionTowards,
			onDragStart,
			onDragEnd,
			onDropInto,
			isCut,
			fileActions: { onCopy, onCut, onDelete, onRestore, onOpenItem, onRename, onStartMove },
		},
	}: Vnode<DriveFolderContentEntryAttrs>): Children {
		const updatedDate = item.type === "file" ? item.file.updatedDate : item.folder.updatedDate
		const thisFileMimeType = item.type === "file" ? mimeTypeAsText(item.file.mimeType) : "Folder"

		return m(
			"div.flex.row.folder-row.cursor-pointer",
			{
				draggable: true,
				style: {
					"border-radius": "10px",
					"align-items": "center",
					"margin-bottom": "4px",
					padding: "6px 12px 6px 24px",
					"grid-column-start": "1",
					"grid-column-end": "8",
					display: "grid",
					"grid-template-columns": "subgrid",
					background: selected ? theme.state_bg_hover : theme.surface,
					border: item.type === "folder" && this.isDraggedOver ? `1px solid ${theme.primary}` : `1px solid transparent`,
				},
				ondragover: () => {
					this.isDraggedOver = true
				},
				ondragleave: () => {
					this.isDraggedOver = false
				},
				ondragstart: (event: DragEvent) => {
					onDragStart(item, event)
				},
				ondragend: () => {
					onDragEnd()
				},
				ondrop: (event: DragEvent) => {
					this.isDraggedOver = false
					onDropInto(item, event)
				},
				onclick: (event: MouseEvent) => {
					event.stopPropagation()

					if (event.detail === 1) {
						if (event.shiftKey) {
							onRangeSelectionTowards(item)
						} else if (event.ctrlKey) {
							onSingleInclusiveSelection(item)
						} else {
							// if we are not in multiselect, delay the selection so that
							// it's not very noticeable
							onSingleSelection(item)
						}
					} else if (event.detail === 2) {
						onOpenItem(item)
					}
				},
				oncontextmenu: (e: MouseEvent) => {
					e.preventDefault()
					e.stopPropagation()
					const dropdown = new Dropdown(() => this.getContextActions(item, onRename, onCopy, onCut, onRestore, onDelete, onStartMove), 300)
					dropdown.setOrigin(new DomRectReadOnlyPolyfilled(e.clientX, e.clientY, 0, 0))
					modal.displayUnique(dropdown, false)
				},
			},
			[
				m(
					"div",
					m("input.checkbox", {
						type: "checkbox",
						checked,
						onchange: () => onSingleExclusiveSelection(item),
						onclick: (e: MouseEvent) => {
							e.stopPropagation()
						},
					}),
				),
				m(
					"div",
					m(Icon, {
						icon: item.type === "folder" ? Icons.Folder : iconPerMimeType(item.file.mimeType),
						size: IconSize.PX24,
						style: {
							fill: theme.on_surface,
							display: "block",
							margin: "0 auto",
							opacity: isCut ? "0.5" : undefined,
						},
					}),
				),
				m("div.text-ellipsis", { style: {} }, m("span", item.type === "file" ? item.file.name : item.folder.name)),
				m("div", { style: {} }, thisFileMimeType),
				m("div", { style: {} }, item.type === "folder" ? "🐱" : formatStorageSize(filterInt(item.file.size))),
				m("div", { style: {} }, updatedDate.toLocaleString()),
				m(
					"div",
					m("div", [
						m(
							IconButton,
							attachDropdown({
								mainButtonAttrs: {
									icon: Icons.More,
									title: "more_label",
								},
								childAttrs: () => this.getContextActions(item, onRename, onCopy, onCut, onRestore, onDelete, onStartMove),
							}),
						),
					]),
				),
			],
		)
	}

	private getContextActions(
		item: FileFolderItem | FolderFolderItem,
		onRename: (f: FolderItem) => unknown,
		onCopy: (f: FolderItem) => unknown,
		onCut: (f: FolderItem) => unknown,
		onRestore: (f: FolderItem) => unknown,
		onDelete: (f: FolderItem) => unknown,
		onStartMove: (f: FolderItem) => unknown,
	): DropdownChildAttrs[] {
		return [
			{
				label: "rename_action",
				icon: Icons.Edit,
				click: () => {
					onRename(item)
				},
			},
			{
				label: "copy_action",
				icon: Icons.Copy,
				click: () => {
					onCopy(item)
				},
			},
			{
				label: "cut_action",
				icon: Icons.Cut,
				click: () => {
					onCut(item)
				},
			},
			{
				label: "move_action",
				icon: Icons.Folder,
				click: () => {
					onStartMove(item)
				},
			},
			(item.type === "file" && item.file.originalParent != null) || (item.type === "folder" && item.folder.originalParent != null)
				? {
						label: "restoreFromTrash_action",
						icon: Icons.Reply,
						click: () => {
							onRestore(item)
						},
					}
				: {
						label: "trash_action",
						icon: Icons.Trash,
						click: () => {
							onDelete(item)
						},
					},
		]
	}
}
