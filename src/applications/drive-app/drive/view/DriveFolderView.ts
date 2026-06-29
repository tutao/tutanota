import m, { Children, Component, Vnode } from "mithril"
import { DriveClipboard, SortColumn, SortingPreference } from "./DriveViewModel"
import { DriveFolderNav, DriveSelectedItemsActions } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs, DriveFolderSelectionEvents, SelectionState } from "./DriveFolderContent"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { ListLoadingState, ListState } from "../../../../ui/base/List"
import { px, size } from "../../../../ui/size"
import { assertNotNull, isEmpty, partition } from "../../../../platform-kit/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { IconMessageBox } from "../../../../ui/base/ColumnEmptyMessageBox"
import { LayerType } from "../../../../ui/base/RootView"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { DomRectReadOnlyPolyfilled, Dropdown } from "../../../../ui/base/Dropdown"
import { isMobileDriveLayout, newItemActions, parseDragItems } from "./DriveGuiUtils"
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
						const [files, folder] = partition(Array.from(event.dataTransfer.items), (item) => item.webkitGetAsEntry()?.isFile ?? false)
						onDropFiles(
							files.map((item) => assertNotNull(item.getAsFile())),
							folder.map((item) => item.webkitGetAsEntry() as FileSystemDirectoryEntry),
						)
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
					} satisfies DriveFolderContentAttrs),
		)
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
