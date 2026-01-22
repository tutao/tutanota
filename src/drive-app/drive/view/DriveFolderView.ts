import m, { Children, Component, Vnode } from "mithril"
import { DriveClipboard, DriveFolderType, SortColumn, SortingPreference } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs, DriveFolderSelectionEvents, SelectionState } from "./DriveFolderContent"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { lang } from "../../../common/misc/LanguageViewModel"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import { px, size } from "../../../common/gui/size"
import { assertNotNull, isEmpty } from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { theme } from "../../../common/gui/theme"
import { IconMessageBox } from "../../../common/gui/base/ColumnEmptyMessageBox"
import { LayerType } from "../../../RootView"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { DomRectReadOnlyPolyfilled, Dropdown } from "../../../common/gui/base/Dropdown"
import { newItemActions, parseDragItems } from "./DriveGuiUtils"
import { modal } from "../../../common/gui/base/Modal"
import { DropType } from "../../../common/gui/base/GuiUtils"
import { FileActions } from "./DriveFolderContentEntry"
import { FolderFolderItem, FolderItem, FolderItemId } from "./DriveUtils"

export interface DriveFolderViewAttrs {
	onUploadClick: (dom: HTMLElement) => void
	selection: SelectionState
	onTrash: (() => unknown) | null
	onDelete: (() => unknown) | null
	onRestore: (() => unknown) | null
	onCopy: (() => unknown) | null
	onCut: (() => unknown) | null
	onPaste: (() => unknown) | null
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	listState: ListState<FolderItem>
	selectionEvents: DriveFolderSelectionEvents
	onDropFiles: (files: File[]) => unknown
	loadParents: () => Promise<DriveFolder[]>
	onNewFile: () => unknown
	onNewFolder: () => unknown
	fileActions: FileActions
	onMove: (items: FolderItemId[], into: FolderFolderItem) => unknown
	sortOrder: SortingPreference
	onSortColumn: (column: SortColumn) => unknown
	clipboard: DriveClipboard | null
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
			onTrash,
			onDelete,
			onRestore,
			onCopy,
			onCut,
			onPaste,
			onUploadClick,
			onDropFiles,
			currentFolder,
			parents,
			selection,
			selectionEvents,
			listState,
			loadParents,
			onNewFile,
			onNewFolder,
			fileActions,
			onMove,
			sortOrder,
			onSortColumn,
			clipboard,
		},
	}: Vnode<DriveFolderViewAttrs>): Children {
		const onDropInto = (item: FolderItem, event: DragEvent) => {
			console.log(event.dataTransfer)
			const itemsData = event.dataTransfer?.getData(DropType.DriveItems)
			if (item.type === "folder" && itemsData) {
				const dragItems = parseDragItems(itemsData)
				if (dragItems) onMove(dragItems, item)
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
						// We need some fancier code to read the directories.
						const definitelyFileItems = Array.from(event.dataTransfer.items).filter((item) => item.webkitGetAsEntry()?.isFile)
						onDropFiles(definitelyFileItems.map((item) => assertNotNull(item.getAsFile())))
					}
				},
				ondragleave: (event: DragEvent) => {
					this.draggedOver = false
				},
				ondragend: () => {
					this.draggedOver = false
				},
				oncontextmenu: (e: MouseEvent) => {
					e.preventDefault()
					const dropdown = new Dropdown(() => newItemActions({ onNewFile, onNewFolder }), 300)
					dropdown.setOrigin(new DomRectReadOnlyPolyfilled(e.clientX, e.clientY, 0, 0))
					modal.displayUnique(dropdown, false)
				},
			},
			this.draggedOver ? this.renderDropView() : null,
			m(DriveFolderNav, {
				onTrash,
				onDelete,
				onRestore,
				onCopy,
				onCut,
				onPaste,
				onUploadClick,
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
						icon: Icons.TrashEmpty,
						color: theme.on_surface_variant,
					})
				: m(IconMessageBox, {
						message: lang.getTranslation("dropFilesHere_msg"),
						icon: Icons.Drive,
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
