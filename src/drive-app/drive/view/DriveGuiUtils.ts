import { DropdownChildAttrs } from "../../../common/gui/base/Dropdown"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showStandardsFileChooser } from "../../../common/file/FileController"
import { DriveFolderType } from "./DriveViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { FileFolderItem, FolderFolderItem, FolderItem, FolderItemId } from "./DriveUtils"
import { DropType } from "../../../common/gui/base/GuiUtils"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { styles } from "../../../common/gui/styles"

export function newItemActions({ onNewFile, onNewFolder }: { onNewFile: () => unknown; onNewFolder: () => unknown }): DropdownChildAttrs[] {
	return [
		{
			click: (event, dom) => {
				onNewFolder()
			},
			label: lang.getTranslation("createFolder_action"),
			icon: Icons.Folder,
		},
		{
			click: (event, dom) => {
				onNewFile()
			},
			label: lang.getTranslation("uploadFile_action"),
			icon: Icons.Upload,
		},
	]
}

export async function showNewFileDialog(uploadFiles: (files: File[]) => Promise<void>): Promise<void> {
	const files = await showStandardsFileChooser(true)

	if (files) {
		uploadFiles(files)
	}
}

export async function showNewFolderDialog(createFolder: (folderName: string) => Promise<void>, updateUi: () => void): Promise<void> {
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
): DropdownChildAttrs[] {
	const itemInTrash = (item.type === "file" && item.file.originalParent != null) || (item.type === "folder" && item.folder.originalParent != null)

	// Caution: when adding actions, make sure they match the order in the action bar.
	const actions: DropdownChildAttrs[] = []
	if (!itemInTrash) {
		actions.push(
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
			{
				label: "trash_action",
				icon: Icons.Trash,
				click: () => {
					onTrash(item)
				},
			},
		)
	} else {
		actions.push(
			{
				label: "restoreFromTrash_action",
				icon: Icons.Reply,
				click: () => {
					onRestore(item)
				},
			},
			{
				label: "delete_action",
				icon: Icons.DeleteForever,
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
