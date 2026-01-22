import { DropdownChildAttrs } from "../../../common/gui/base/Dropdown"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showStandardsFileChooser } from "../../../common/file/FileController"
import { DriveFolderType, FolderItemId } from "./DriveViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"

export function newItemActions({ onNewFile, onNewFolder }: { onNewFile: () => unknown; onNewFolder: () => unknown }): DropdownChildAttrs[] {
	return [
		{
			click: (event, dom) => {
				onNewFile()
			},
			label: lang.getTranslation("uploadFile_action"),
		},
		{
			click: (event, dom) => {
				onNewFolder()
			},
			label: lang.getTranslation("createFolder_action"),
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
	Dialog.showProcessTextInputDialog(
		{
			title: lang.makeTranslation("newFolder_title", () => "New folder"),
			label: lang.makeTranslation("newFolder_label", () => "Folder name"),
			defaultValue: "Untitled folder",
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
