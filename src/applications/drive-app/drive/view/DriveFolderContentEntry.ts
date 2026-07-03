import m, { _NoLifecycle, Children, CommonAttributes, Component, Vnode, VnodeDOM } from "mithril"
import { formatStorageSize } from "../../../../ui/utils/Formatter"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { assertNotNull, filterInt } from "../../../../platform-kit/utils"
import { IconButton, IconButtonAttrs } from "../../../../ui/base/IconButton"
import { attachDropdown } from "../../../../ui/base/Dropdown"
import { theme } from "../../../../ui/theme"
import { FolderItem } from "./DriveUtils"
import { TabIndex } from "../../../../platform-kit/app-env"
import { getFileContextActions, isDraggingDriveItems } from "./DriveGuiUtils"
import { getDisplayType, getFileIcon, getItemIconFill } from "../model/DriveMimeUtils"

export interface FileActions {
	onCut: (f: FolderItem) => unknown
	onCopy: (f: FolderItem) => unknown
	onOpenItem: (f: FolderItem) => unknown
	onDownload: (f: FolderItem) => unknown
	onTrash: (f: FolderItem) => unknown
	onRename: (f: FolderItem) => unknown
	onRestore: (f: FolderItem) => unknown
	onDelete: (f: FolderItem) => unknown
	onStartMove: (f: FolderItem) => unknown
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
	onContextMenu: (f: FolderItem, event: MouseEvent) => unknown
	onDomUpdated?: (dom: HTMLElement, moreActionsDom: HTMLElement) => unknown
}

export class DriveFolderContentEntry implements Component<DriveFolderContentEntryAttrs> {
	private isDraggedOver: boolean = false
	private moreButtonDom: HTMLElement | null = null

	onupdate(vnode: VnodeDOM<DriveFolderContentEntryAttrs, _NoLifecycle<this & {}>>) {
		vnode.attrs.onDomUpdated?.(vnode.dom as HTMLElement, assertNotNull(this.moreButtonDom))
	}

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
			onContextMenu,
			isCut,
			fileActions,
		},
	}: Vnode<DriveFolderContentEntryAttrs>): Children {
		const updatedDate = item.type === "file" ? item.file.updatedDate : item.folder.updatedDate

		const displayType = item.type === "file" ? getDisplayType(item.file.mimeType, item.file.name) : null
		const fileFormat = displayType?.fileFormat ?? "Folder"

		return m(
			"div.flex.row.folder-row.cursor-pointer",
			{
				role: "row",
				// we manually keep track of the focus in the table contents
				tabindex: TabIndex.Programmatic,
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
				ondragover: (event: DragEvent) => {
					this.isDraggedOver = isDraggingDriveItems(event.dataTransfer)
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
						fileActions.onOpenItem(item)
					}
				},
				oncontextmenu: (e: MouseEvent) => {
					onContextMenu(item, e)
					e.preventDefault()
					e.stopPropagation()
				},
			},
			[
				m(
					"div",
					{ role: "gridcell" },
					m("input.checkbox", {
						type: "checkbox",
						tabindex: TabIndex.Programmatic,
						checked,
						onchange: () => onSingleExclusiveSelection(item),
						onclick: (e: MouseEvent) => {
							e.stopPropagation()
						},
					}),
				),
				m(
					"div",
					{ role: "gridcell" },
					m(Icon, {
						icon: item.type === "folder" ? Icons.FolderFilled : getFileIcon(assertNotNull(displayType)),
						size: IconSize.PX24,
						style: {
							fill: getItemIconFill(displayType),
							display: "block",
							margin: "0 auto",
							opacity: isCut ? "0.5" : undefined,
						},
					}),
				),
				m(
					"div.text-ellipsis",
					{ "data-testid": "drivecontententry:name", role: "gridcell" },
					m("span", item.type === "file" ? item.file.name : item.folder.name),
				),
				m("div", { role: "gridcell" }, fileFormat),
				m("div", { role: "gridcell" }, item.type === "folder" ? "🐱" : formatStorageSize(filterInt(item.file.size))),
				m("div", { role: "gridcell" }, updatedDate.toLocaleString()),
				m(
					"div",
					{ role: "gridcell" },
					m("div", [
						m(IconButton, {
							...attachDropdown({
								mainButtonAttrs: {
									icon: Icons.More,
									title: "more_label",
									// is focused programmatically
									tabindex: TabIndex.Programmatic,
								},
								childAttrs: async () => getFileContextActions(item, fileActions),
							}),
							oncreate: (vnode: VnodeDOM<IconButtonAttrs, _NoLifecycle<IconButton>>) => {
								this.moreButtonDom = vnode.dom as HTMLElement
							},
						} satisfies IconButtonAttrs & CommonAttributes<IconButtonAttrs, _NoLifecycle<IconButton & {}>>),
					]),
				),
			],
		)
	}
}
