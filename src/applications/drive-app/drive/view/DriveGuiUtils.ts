import { DropdownButtonAttrs, DropdownChildAttrs } from "../../../../ui/base/Dropdown"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel"
import { Dialog } from "../../../../ui/base/Dialog"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { FileFolderItem, FolderFolderItem, FolderItem, FolderItemId } from "./DriveUtils"
import { DropType } from "../../../../ui/base/GuiUtils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { styles } from "../../../../ui/styles"
import { DriveFolder } from "@tutao/entities/drive"
import { getFileBaseNameAndExtensions } from "../../../../ui/utils/FileUtils"
import { isBrowser, isDesktop } from "@tutao/app-env"
import { isNotNull } from "@tutao/utils"

export function newItemActions({
	onUploadFiles,
	onCreateFolder,
	onUploadFolders,
	onPaste,
}: {
	onUploadFiles: (event: MouseEvent, dom: HTMLElement) => unknown
	onUploadFolders: (event: MouseEvent, dom: HTMLElement) => unknown
	onCreateFolder: (event: MouseEvent, dom: HTMLElement) => unknown
	onPaste?: (event: MouseEvent, dom: HTMLElement) => unknown
}): DropdownButtonAttrs[] {
	let newItemDropdown: DropdownButtonAttrs[] = []
	newItemDropdown.push(
		{
			click: (event, dom) => {
				onCreateFolder(event, dom)
			},
			label: lang.getTranslation("createFolder_action"),
			icon: Icons.FolderFilled,
		},
		{
			click: (event, dom) => {
				onUploadFiles(event, dom)
			},
			label: lang.getTranslation("uploadFile_action"),
			icon: Icons.Upload,
		},
	)
	if (isBrowser() || isDesktop()) {
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
export function getContextActions(
	item: FileFolderItem | FolderFolderItem,
	onRename: (f: FolderItem) => unknown,
	onCopy: (f: FolderItem) => unknown,
	onCut: (f: FolderItem) => unknown,
	onRestore: (f: FolderItem) => unknown,
	onTrash: (f: FolderItem) => unknown,
	onStartMove: (f: FolderItem) => unknown,
	onDelete: (f: FolderItem) => unknown,
	onDownload: (f: FolderItem) => unknown,
): DropdownChildAttrs[] {
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

export function isMobileDriveLayout(): boolean {
	return styles.isUsingBottomNavigation()
}
