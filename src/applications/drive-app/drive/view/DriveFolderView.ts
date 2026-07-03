import m, { Children, Component, Vnode } from "mithril"
import { DriveClipboard, SortColumn, SortingPreference } from "./DriveViewModel"
import { DriveFolderNav, DriveSelectedItemsActions } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs, DriveFolderSelectionEvents, SelectionState } from "./DriveFolderContent"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { ListLoadingState, ListState } from "../../../../ui/base/List"
import { px, size } from "../../../../ui/size"
import { assertNotNull, isEmpty } from "../../../../platform-kit/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { IconMessageBox } from "../../../../ui/base/ColumnEmptyMessageBox"
import { LayerType } from "../../../../ui/base/RootView"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { DomRectReadOnlyPolyfilled, Dropdown, DropdownChildAttrs } from "../../../../ui/base/Dropdown"
import { getFileContextActions, getSelectionContextActions, isMobileDriveLayout, newItemActions, parseDragItems } from "./DriveGuiUtils"
import { modal } from "../../../../ui/base/Modal"
import { DropType } from "../../../../ui/base/GuiUtils"
import { FileActions } from "./DriveFolderContentEntry"
import { FolderFolderItem, FolderItem, FolderItemId } from "./DriveUtils"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { DriveFolder } from "@tutao/entities/drive"

export interface DriveFolderViewAttrs {
	selection: SelectionState
	selectedItemsActions: DriveSelectedItemsActions
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	listState: ListState<FolderItem>
	selectionEvents: DriveFolderSelectionEvents
	onDropFiles: (files: File[], folders: FileSystemDirectoryEntry[]) => unknown
	loadParents: () => Promise<DriveFolder[]>
	onUploadFiles: (event: MouseEvent, dom: HTMLElement) => unknown
	onCreateFolder: () => unknown
	onUploadFolders: (event: MouseEvent, dom: HTMLElement) => unknown
	fileActions: FileActions
	onMove: (items: FolderItemId[], into: FolderFolderItem) => unknown
	sortOrder: SortingPreference
	onSortColumn: (column: SortColumn) => unknown
	clipboard: DriveClipboard | null
	onPaste?: () => unknown
}

function canDropFilesToFolder(currentFolder: DriveFolder | null): boolean {
	return currentFolder != null && currentFolder.type !== DriveFolderType.Trash
}

function isValidDataTransferItem(item: DataTransferItem): boolean {
	return item.kind === "file"
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	private draggedOver: boolean = false

	view({
		attrs: {
			selectedItemsActions,
			onDropFiles,
			currentFolder,
			parents,
			selection,
			selectionEvents,
			listState,
			loadParents,
			onUploadFiles,
			onCreateFolder,
			onUploadFolders,
			fileActions,
			onMove,
			sortOrder,
			onSortColumn,
			clipboard,
			onPaste,
		},
	}: Vnode<DriveFolderViewAttrs>): Children {
		const onDropInto = (item: FolderItem, event: DragEvent) => {
			console.log(event.dataTransfer)
			const itemsData = event.dataTransfer?.getData(DropType.DriveItems)
			if (item.type === "folder" && itemsData) {
				const dragItems = parseDragItems(itemsData)
				if (dragItems) onMove(dragItems, item)
				// this is a drive item move, to not bubble it up to the file handling
				event.preventDefault()
				event.stopPropagation()
			}
		}

		return m(
			"div.col.flex.plr-8.fill-absolute",
			{
				style: { gap: px(size.spacing_12) },
				ondragover: (event: DragEvent) => {
					event.preventDefault()
					if (
						canDropFilesToFolder(currentFolder) &&
						event.dataTransfer &&
						event.dataTransfer.items.length > 0 &&
						Array.from(event.dataTransfer.items).every(isValidDataTransferItem)
					) {
						this.draggedOver = true
					}
				},
				ondrop: (event: DragEvent) => {
					event.preventDefault()
					this.draggedOver = false

					if (canDropFilesToFolder(currentFolder) && event.dataTransfer) {
						const { files, folders } = parseDataTransferItems(event.dataTransfer)
						onDropFiles(files, folders)
					}
				},
				ondragleave: (event: DragEvent) => {
					this.draggedOver = false
				},
				ondragend: () => {
					this.draggedOver = false
				},
				oncontextmenu: (e: MouseEvent) => {
					if (!isMobileDriveLayout()) {
						e.preventDefault()
						const dropdown = new Dropdown(() => newItemActions({ onUploadFiles, onCreateFolder, onUploadFolders, onPaste }), 300)
						dropdown.setOrigin(new DomRectReadOnlyPolyfilled(e.clientX, e.clientY, 0, 0))
						modal.displayUnique(dropdown, false)

						selectionEvents.onSelectNone()
					}
				},
				onclick: (e: MouseEvent) => {
					if (!isMobileDriveLayout()) {
						selectionEvents.onSelectNone()
					}
				},
			},
			this.draggedOver ? this.renderDropView() : null,
			isMobileDriveLayout()
				? null
				: m(DriveFolderNav, {
						selectedItemsActions,
						currentFolder,
						parents,
						loadParents,
						onDropInto,
					}),
			listState.loadingStatus === ListLoadingState.Done && isEmpty(listState.items)
				? this.renderEmptyView(currentFolder)
				: m(DriveFolderContent, {
						sortOrder,
						fileActions,
						onSort: onSortColumn,
						onDropInto,
						selection,
						listState,
						selectionEvents,
						clipboard,
						onEntryContextMenu: (f, e) =>
							this.onEntryContextMenu(f, e, selection, selectionEvents, selectedItemsActions, fileActions, listState.selectedItems.has(f)),
					} satisfies DriveFolderContentAttrs),
		)
	}

	private onEntryContextMenu(
		item: FolderItem,
		e: MouseEvent,
		selection: SelectionState,
		selectionEvents: DriveFolderSelectionEvents,
		selectedItemsActions: DriveSelectedItemsActions,
		fileActions: FileActions,
		isItemSelected: boolean,
	) {
		let contextActions: DropdownChildAttrs[]

		if (isItemSelected && selection.type === "multiselect") {
			contextActions = getSelectionContextActions(selectedItemsActions)
		} else {
			selectionEvents.onSingleSelection(item)

			// Nothing is selected, open the context menu for the item that received the event.
			contextActions = getFileContextActions(item, fileActions)
		}

		const dropdown = new Dropdown(() => contextActions, 300)
		dropdown.setOrigin(new DomRectReadOnlyPolyfilled(e.clientX, e.clientY, 0, 0))
		modal.displayUnique(dropdown, false)
	}

	private renderEmptyView(folder: DriveFolder | null): Children {
		return m(
			"",
			{
				style: {
					marginTop: "6.4rem",
				},
			},
			folder && folder.type === DriveFolderType.Trash
				? m(IconMessageBox, {
						message: lang.getTranslation("trashIsEmpty_msg"),
						icon: Icons.TrashEmptyFilled,
						color: theme.on_surface_variant,
					})
				: m(IconMessageBox, {
						message: lang.getTranslation("dropFilesHere_msg"),
						icon: Icons.DriveFilled,
						color: theme.on_surface_variant,
						bottomContent: "Or use 'new' button",
					}),
		)
	}

	private renderDropView(): Children {
		return m(
			".fill-absolute.flex.items-center.justify-center",
			{
				style: { backgroundColor: "#00000080", zIndex: LayerType.Overlay },
			},
			m(
				".center.flex.col.items-center.justify-center.border-radius-12",
				{
					style: {
						backgroundColor: theme.surface,
						color: theme.on_surface,
						padding: `${size.spacing_32}px ${size.spacing_16}px`,
						fontSize: "1.4em",
						gap: px(size.core_16),
					},
				},
				[
					m(Icon, {
						icon: Icons.Upload,
						size: IconSize.PX64,
						style: {
							fill: theme.outline,
						},
					}),
					lang.getTranslationText("dropFilesHere_msg"),
				],
			),
		)
	}
}

function parseDataTransferItems(dataTransfer: DataTransfer): { files: File[]; folders: FileSystemDirectoryEntry[] } {
	const files: File[] = []
	const folders: FileSystemDirectoryEntry[] = []
	for (const item of Array.from(dataTransfer.items)) {
		const itemEntry = item.webkitGetAsEntry()
		if (itemEntry?.isFile) {
			files.push(assertNotNull(item.getAsFile()))
		} else if (itemEntry?.isDirectory) {
			folders.push(itemEntry as FileSystemDirectoryEntry)
		}
		// skip the rest, could be a drive item dragged and not handled, could be another random
		// item
	}
	return { files, folders }
}
