import { DomRectReadOnlyPolyfilled, Dropdown, DropdownButtonAttrs, DropdownChildAttrs } from "../../../../ui/base/Dropdown"
import { lang, Translation, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { Dialog } from "../../../../ui/base/Dialog"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { DriveOperationType, FileFolderItem, FolderFolderItem, FolderItem, FolderItemId, OperationUpdate } from "./DriveUtils"
import { DropType } from "../../../../ui/base/GuiUtils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Styles } from "../../../../ui/styles"
import { DriveFolder } from "@tutao/entities/drive"
import { getFileBaseNameAndExtensions } from "../../../../ui/utils/FileUtils"
import { EnvProvider, OperationStatus } from "@tutao/app-env"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { FileActions } from "./DriveFolderContentEntry"
import { DriveSelectedItemsActions } from "./DriveFolderNav"
import { modal } from "../../../../ui/base/Modal"
import { ListState } from "../../../../ui/base/List"
import { showSnackBar } from "../../../../ui/base/SnackBar"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { ListItemSelectionCallbacks } from "../../../../ui/base/ListUtils"
import { DriveTransferState } from "./DriveTransferController"
import { Shortcut } from "../../../../ui/utils/KeyManager"
import { Keys } from "../../../../ui/utils/KeyboardKeys"

export function newItemActions({
	onUploadFiles,
	onCreateFolder,
	onUploadFolders,
	onPaste,
}: {
	onUploadFiles: (event: MouseEvent, dom: HTMLElement) => unknown
	onUploadFolders: (event: MouseEvent, dom: HTMLElement) => unknown
	onCreateFolder?: (event: MouseEvent, dom: HTMLElement) => unknown
	onPaste?: (event: MouseEvent, dom: HTMLElement) => unknown
}): DropdownButtonAttrs[] {
	let newItemDropdown: DropdownButtonAttrs[] = []
	if (isNotNull(onCreateFolder)) {
		newItemDropdown.push({
			click: (event, dom) => {
				onCreateFolder(event, dom)
			},
			label: lang.getTranslation("createFolder_action"),
			icon: Icons.FolderFilled,
		})
	}
	newItemDropdown.push({
		click: (event, dom) => {
			onUploadFiles(event, dom)
		},
		label: lang.getTranslation("uploadFile_action"),
		icon: Icons.Upload,
	})
	if (EnvProvider.get().isBrowser() || EnvProvider.get().isDesktop()) {
		newItemDropdown.push({
			click: (event, dom) => {
				onUploadFolders(event, dom)
			},
			label: lang.getTranslation("uploadFolders_action"),
			icon: Icons.Upload,
		})
	}

	if (isNotNull(onPaste)) {
		newItemDropdown.push({
			click: (event, dom) => {
				onPaste(event, dom)
			},
			label: lang.getTranslation("paste_action"),
			icon: Icons.ClipboardFilled,
		})
	}

	return newItemDropdown
}

export async function showNewFolderDialog(createFolder: (folderName: string) => Promise<DriveFolder>, updateUi: () => void): Promise<void> {
	const defaultFolderName = lang.getTranslationText("untitledFolder_label")

	Dialog.showProcessTextInputDialog(
		{
			title: lang.makeTranslation("newFolder_title", () => "New folder"),
			label: lang.makeTranslation("newFolder_label", () => "Folder name"),
			defaultValue: defaultFolderName,
			selectionRange: [0, defaultFolderName.length],
		},
		async (newName) => {
			const folderName = newName
			if (folderName === "") {
				return
			}

			console.log("User called the folder: ", folderName)
			createFolder(folderName).then(() => updateUi())
		},
	)
}

export async function showRenameDialog(item: FolderItem, rename: (newName: string) => void): Promise<void> {
	const originalName = item.type === "file" ? item.file.name : item.folder.name

	// Determine how much of the original filename to pre-select,
	// for easier renaming of files with extensions.
	let selectionEnd = originalName.length
	const [basename] = getFileBaseNameAndExtensions(originalName)
	if (basename) {
		selectionEnd = basename.length
	}

	Dialog.showProcessTextInputDialog(
		{
			title: "renameItem_action",
			label: "enterNewName_label",
			defaultValue: originalName,
			selectionRange: [0, selectionEnd],
		},
		async (newName: string) => {
			rename(newName)
		},
	)
}

export const DUPLICATE_FILES_KEEP_CHOICE = 0

export interface DuplicateFilesDialogDecision {
	choice: "cancel" | "keepBoth" | "replace"
	applyToAll: boolean
}
export async function showDuplicateFilesChoiceDialog(fileName: string, fileCount: number): Promise<DuplicateFilesDialogDecision> {
	const options = []
	if (fileCount > 1) {
		options[DUPLICATE_FILES_KEEP_CHOICE] = { text: lang.getTranslation("applyToAllFiles_label"), value: false }
	}

	const result = await Dialog.choiceCancellable<DuplicateFilesDialogDecision["choice"]>(
		lang.getTranslation("duplicateFileName_msg", { "{fileName}": fileName }),
		[
			{ text: lang.getTranslation("cancel_action"), value: "cancel" },
			{ text: lang.getTranslation("keepBothFiles_action"), value: "keepBoth" },
			{ text: lang.getTranslation("replaceFile_action"), value: "replace" },
		],
		options,
	)
	return {
		choice: result.value ?? "cancel",
		applyToAll: result.options[0] ?? false,
	}
}

function isIdTuple(item: unknown): item is IdTuple {
	return Array.isArray(item) && item.length === 2 && typeof item[0] === "string" && typeof item[1] === "string"
}

export function parseDragItems(str: string): FolderItemId[] | null {
	const parsed = JSON.parse(str, (k, v) => (k === "__proto__" ? undefined : v))
	if (Array.isArray(parsed)) {
		for (const value of parsed) {
			if (typeof value === "object" && (value.type === "file" || value.type === "folder") && isIdTuple(value.id)) {
				continue
			} else {
				return null
			}
		}
	}
	return parsed
}

export function isDraggingDriveItems(dataTransfer: DataTransfer | null): boolean {
	// https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransfer-getdata-dev
	// "Returns the specified data. If there is no such data, returns the empty string."
	const maybeDriveItem = dataTransfer?.getData(DropType.DriveItems)
	return maybeDriveItem != null && maybeDriveItem !== ""
}

export function driveFolderName(folder: DriveFolder): Translation {
	switch (folder.type) {
		case DriveFolderType.Root:
			return lang.getTranslation("driveHome_label")
		case DriveFolderType.Trash:
			return lang.getTranslation("driveTrash_label")
		default:
			return lang.makeTranslation(`${folder.name}`, folder.name)
	}
}

// NOTE: Keep the order roughly in sync with getSelectionContextActions.
export function getFileContextActions(item: FileFolderItem | FolderFolderItem, fileActions: FileActions): DropdownChildAttrs[] {
	const { onRename, onCopy, onCut, onRestore, onTrash, onStartMove, onDelete, onDownload } = fileActions

	const itemInTrash = (item.type === "file" && item.file.originalParent != null) || (item.type === "folder" && item.folder.originalParent != null)

	// Caution: when adding actions, make sure they match the order in the action bar.
	const actions: DropdownChildAttrs[] = []
	if (!itemInTrash) {
		if (item.type === "file") {
			actions.push({
				label: "download_action",
				icon: Icons.DownloadFilled,
				click: () => {
					onDownload(item)
				},
			})
		}
		actions.push(
			{
				label: "rename_action",
				icon: Icons.PenFilled,
				click: () => {
					onRename(item)
				},
			},
			{
				label: "copy_action",
				icon: Icons.CopyFilled,
				click: () => {
					onCopy(item)
				},
			},
			{
				label: "cut_action",
				icon: Icons.ScissorsFilled,
				click: () => {
					onCut(item)
				},
			},
			{
				label: "move_action",
				icon: Icons.Move,
				click: () => {
					onStartMove(item)
				},
			},
			{
				label: "trash_action",
				icon: Icons.TrashFilled,
				click: () => {
					onTrash(item)
				},
			},
		)
	} else {
		actions.push(
			{
				label: "restoreFromTrash_action",
				icon: Icons.ArrowBackFilled,
				click: () => {
					onRestore(item)
				},
			},
			{
				label: "delete_action",
				icon: Icons.TrashCrossFilled,
				click: () => {
					onDelete(item)
				},
			},
		)
	}
	return actions
}

// NOTE: Keep the order roughly in sync with getFileContextActions.
export function getSelectionContextActions(selectionActions: DriveSelectedItemsActions): DropdownChildAttrs[] {
	const { onCopy, onCut, onDelete, onDownload, onMove, onPaste, onRestore, onTrash } = selectionActions

	const actions: DropdownChildAttrs[] = []

	if (onDownload) {
		actions.push({
			label: "download_action",
			icon: Icons.DownloadFilled,
			click: () => {
				onDownload()
			},
		})
	}

	if (onCopy) {
		actions.push({
			label: "copy_action",
			icon: Icons.CopyFilled,
			click: () => {
				onCopy()
			},
		})
	}

	if (onCut) {
		actions.push({
			label: "cut_action",
			icon: Icons.ScissorsFilled,
			click: () => {
				onCut()
			},
		})
	}

	if (onMove) {
		actions.push({
			label: "move_action",
			icon: Icons.Move,
			click: () => {
				onMove()
			},
		})
	}

	if (onTrash) {
		actions.push({
			label: "trash_action",
			icon: Icons.TrashFilled,
			click: () => {
				onTrash()
			},
		})
	}

	if (onRestore) {
		actions.push({
			label: "restoreFromTrash_action",
			icon: Icons.ArrowBackFilled,
			click: () => {
				onRestore()
			},
		})
	}

	if (onDelete) {
		actions.push({
			label: "delete_action",
			icon: Icons.TrashCrossFilled,
			click: () => {
				onDelete()
			},
		})
	}

	return actions
}

export async function cancelAllTransfersConfirmationDialog(activeTransfers: readonly DriveTransferState[]): Promise<boolean> {
	return await Dialog.confirm(lang.getTranslation("confirmCancelTransfers_msg", { "{count}": activeTransfers.length }), "confirmCancelTransfers_action")
}

export function driveItemContextMenu(
	selectionEvents: ListItemSelectionCallbacks<FolderItem>,
	selectedItemsActions: DriveSelectedItemsActions,
	fileActions: FileActions,
	listState: ListState<FolderItem>,
	item: FolderItem,
	e: MouseEvent,
) {
	let contextActions: DropdownChildAttrs[]

	if (listState.selectedItems.has(item) && listState.inMultiselect && listState.selectedItems.size > 1) {
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
export function operationUpdateSnackbar(maybeOperationUpdate: OperationUpdate | null) {
	if (isNotNull(maybeOperationUpdate)) {
		const { type, count, status, error } = maybeOperationUpdate

		switch (status) {
			case OperationStatus.SUCCESS: {
				let message: TranslationKey
				switch (type) {
					case DriveOperationType.Copy:
						message = "copyItemsSuccess_msg"
						break
					case DriveOperationType.Delete:
						message = "deleteItemsSuccess_msg"
						break
					case DriveOperationType.Move:
						message = "moveItemsSuccess_msg"
						break
					case DriveOperationType.Trash:
						message = "trashItemsSuccess_msg"
						break
					case DriveOperationType.Restore:
						message = "restoreItemsSuccess_msg"
				}
				showSnackBar({
					message: lang.getTranslation(message, {
						"{count}": String(count),
					}),
				})
				break
			}
			case OperationStatus.FAILURE: {
				handleUncaughtError(assertNotNull(error))
				break
			}
		}
	}
}

export function isMobileDriveLayout(): boolean {
	return Styles.get().isUsingBottomNavigation()
}
export interface DriveKeyboardShortcutActions {
	clear: () => unknown
	rename: () => unknown
	selectAll: () => unknown
	copy: () => unknown
	cut: () => unknown
	move: () => unknown
	delete: () => unknown
	open: () => unknown
	create?: () => unknown
	paste?: () => unknown
}

export function driveKeyboardShortcuts(actions: DriveKeyboardShortcutActions): Shortcut[] {
	const shortcuts: Shortcut[] = [
		{
			key: Keys.ESC,
			enabled: () => true,
			help: "clearFileSelection_action",
			ctrlOrCmd: false,
			exec: () => {
				actions.clear()
			},
		},
		{
			key: Keys.F2,
			enabled: () => true,
			help: "renameItem_action",
			ctrlOrCmd: false,
			exec: () => {
				actions.rename()
			},
		},
		{
			key: Keys.A,
			enabled: () => true,
			help: "selectAllFiles_action",
			ctrlOrCmd: true,
			exec: () => {
				actions.selectAll()
			},
		},
		{
			key: Keys.C,
			enabled: () => true,
			help: "copy_action",
			ctrlOrCmd: true,
			exec: () => {
				actions.copy()
			},
		},
		{
			key: Keys.X,
			enabled: () => true,
			help: "cut_action",
			ctrlOrCmd: true,
			exec: () => {
				actions.cut()
			},
		},
		{
			key: Keys.DELETE,
			enabled: () => true,
			help: "trash_action",
			exec: () => {
				actions.delete()
			},
		},
		{
			key: Keys.BACKSPACE,
			enabled: () => true,
			help: "trash_action",
			exec: () => {
				actions.delete()
			},
		},
		{
			key: Keys.RETURN,
			enabled: () => true,
			help: "open_action",
			exec: () => {
				actions.open()
			},
		},
		{
			key: Keys.V,
			enabled: () => true,
			help: "move_action",
			exec: () => {
				actions.move()
			},
		},
	]

	if (actions.create) {
		shortcuts.push({
			key: Keys.N,
			enabled: () => true,
			help: "newDriveItem_action",
			exec: () => {
				actions.create?.()
			},
		})
	}

	if (actions.paste) {
		shortcuts.push({
			key: Keys.V,
			enabled: () => true,
			help: "paste_action",
			ctrlOrCmd: true,
			exec: () => {
				actions.paste?.()
			},
		})
	}

	return shortcuts
}
