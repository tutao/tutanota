import m, { Children, Component, Vnode } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { formatStorageSize } from "../../../common/misc/Formatter"
import { FolderItem } from "./DriveViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { filterInt } from "@tutao/tutanota-utils"
import { IconButton } from "../../../common/gui/base/IconButton"
import { attachDropdown } from "../../../common/gui/base/Dropdown"
import { theme } from "../../../common/gui/theme"

export interface FileActions {
	onCut: (f: FolderItem) => unknown
	onCopy: (f: FolderItem) => unknown
	onOpenItem: (f: FolderItem) => unknown
	onDelete: (f: FolderItem) => unknown
	onRename: (f: FolderItem) => unknown
	onRestore: (f: FolderItem) => unknown
}

export interface DriveFolderContentEntryAttrs {
	item: FolderItem
	selected: boolean
	onSelect: (f: FolderItem) => unknown
	checked: boolean // maybe should be inside a map inside the model
	fileActions: FileActions
}

const DriveFolderContentEntryRowStyle = {
	background: "white",
	"border-radius": "10px",
	"align-items": "center",
	"margin-bottom": "4px",
	padding: "6px 12px 6px 24px",
	"grid-column-start": "1",
	"grid-column-end": "8",
	display: "grid",
	"grid-template-columns": "subgrid",
}

const isImageMimeType = (mimeType: string) => ["image/png", "image/jpeg"].includes(mimeType)

const isMusicMimeType = (mimeType: string) => ["audio/mpeg", "audio/wav", "audio/wave", "audio/x-wav", "audio/mp4"].includes(mimeType)

const isDocumentMimeType = (mimeType: string) => ["text/plain", "application/pdf"].includes(mimeType)

const iconPerMimeType = (mimeType: string) => {
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
	view({
		attrs: {
			item,
			selected,
			onSelect,
			fileActions: { onCopy, onCut, onDelete, onRestore, onOpenItem, onRename },
		},
	}: Vnode<DriveFolderContentEntryAttrs>): Children {
		const uploadDate = item.type === "file" ? item.file.createdDate : item.folder.createdDate

		const thisFileIsAFolder = item.type === "folder"

		const thisFileMimeType = item.type === "file" ? mimeTypeAsText(item.file.mimeType) : "Folder"

		return m("div.flex.row.folder-row", { style: { ...DriveFolderContentEntryRowStyle, background: selected ? theme.state_bg_hover : theme.surface } }, [
			m("div", {}, m("input.checkbox", { type: "checkbox", checked: selected, onchange: () => onSelect(item) })),
			m(
				"div",
				{ style: {} },
				m(Icon, {
					icon: thisFileIsAFolder ? Icons.Folder : iconPerMimeType(item.file.mimeType),
					size: IconSize.Medium,
					style: { fill: theme.on_surface, display: "block", margin: "0 auto" },
				}),
			),
			m(
				"div",
				{ style: {} },
				m(
					"span",
					{
						onclick: () => {
							onOpenItem(item)
						},
						class: "cursor-pointer",
					},
					item.type === "file" ? item.file.name : item.folder.name,
				),
			),
			m("div", { style: {} }, thisFileMimeType),
			m("div", { style: {} }, item.type === "folder" ? "🐱" : formatStorageSize(filterInt(item.file.size))),
			m("div", { style: {} }, uploadDate.toLocaleString()),
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
							childAttrs: () => [
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
							],
						}),
					),
				]),
			),
		])
	}
}
