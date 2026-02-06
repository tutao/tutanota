import { EntityClient, loadMultipleFromLists } from "../../../common/api/common/EntityClient"
import { DriveFacade, FolderContents } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { getFileBaseNameAndExtensions } from "../../../common/api/common/utils/FileUtils"
import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "../../../common/api/entities/drive/TypeRefs"
import { getElementId } from "../../../common/api/common/utils/EntityUtils"
import { partition } from "@tutao/tutanota-utils"

export function makeDuplicateFileName(fileName: string, indicator: string = "copy"): string {
	const [basename, ext] = getFileBaseNameAndExtensions(fileName)
	const safeExt = ext ?? ""
	return `${basename} (${indicator})${safeExt}`
}

export interface FileFolderItem {
	type: "file"
	file: DriveFile
}

export interface FolderFolderItem {
	type: "folder"
	folder: DriveFolder
}

export type FolderItem = FileFolderItem | FolderFolderItem

export function folderItemEntity(folderItem: FileFolderItem | FolderFolderItem): DriveFile | DriveFolder {
	return folderItem.type === "file" ? folderItem.file : folderItem.folder
}

export function toFolderItems(folderContents: FolderContents): FolderItem[] {
	return [
		...folderContents.folders.map((folder) => ({ type: "folder", folder }) satisfies FolderFolderItem),
		...folderContents.files.map((file) => ({ type: "file", file }) satisfies FileFolderItem),
	]
}

function isFolderFolderItem(item: FolderItem): item is FolderFolderItem {
	return item.type === "folder"
}

export interface FolderItemId {
	type: "file" | "folder"
	id: IdTuple
}

export async function deduplicateItemNames(existingItems: FolderItem[], newFiles: Array<DriveFile>, newFolders: Array<DriveFolder>): Promise<Map<Id, string>> {
	// This is for tracking filenames that are not yet part of the list model
	// because we *just now* made them up when trying to find a free candidate name
	// and are therefore unsuited as candidate names as well.
	const takenFileNames: Set<string> = new Set(existingItems.map((item) => folderItemEntity(item).name))
	const renamedFiles: Map<Id, string> = new Map()

	for (const file of newFiles) {
		const newFileName = pickNewFileName(file.name, takenFileNames)
		if (newFileName !== file.name) {
			renamedFiles.set(getElementId(file), newFileName)
		}
		takenFileNames.add(newFileName)
	}

	for (const folder of newFolders) {
		const newFolderName = pickNewFileName(folder.name, takenFileNames)
		if (newFolderName !== folder.name) {
			renamedFiles.set(getElementId(folder), newFolderName)
		}
		takenFileNames.add(newFolderName)
	}
	return renamedFiles
}

export function pickNewFileName(originalName: string, takenFileNames: ReadonlySet<string>): string {
	let candidateName = originalName
	while (takenFileNames.has(candidateName)) {
		candidateName = makeDuplicateFileName(candidateName)
	}
	return candidateName
}

/**
 * @throws MoveCycleError
 */
export async function moveItems(entityClient: EntityClient, driveFacade: DriveFacade, items: readonly FolderItemId[], destinationFolder: DriveFolder) {
	const [fileItems, folderItems] = partition(items, (item) => item.type === "file")
	const files = await loadMultipleFromLists(
		DriveFileTypeRef,
		entityClient,
		fileItems.map((item) => item.id),
	)
	const folders = await loadMultipleFromLists(
		DriveFolderTypeRef,
		entityClient,
		folderItems.map((item) => item.id),
	)

	const renamedFiles = await deduplicateItemNames(await loadFolderContents(driveFacade, destinationFolder._id), files, folders)

	await driveFacade.move(files, folders, destinationFolder, renamedFiles)
}

export async function loadFolderContents(driveFacade: DriveFacade, folderId: IdTuple): Promise<FolderItem[]> {
	const contents = await driveFacade.getFolderContents(folderId)
	return toFolderItems(contents)
}

export function folderItemToId(item: FolderItem): FolderItemId {
	return {
		id: folderItemEntity(item)._id,
		type: item.type,
	}
}
