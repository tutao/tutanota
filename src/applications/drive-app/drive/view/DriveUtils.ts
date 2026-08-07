import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { DriveFacade, FolderContents } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { getFileBaseNameAndExtensions } from "../../../../ui/utils/FileUtils"
import { assertNotNull, defer, isEmpty, isNotEmpty, partition, promiseMap } from "../../../../platform-kit/utils"
import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "@tutao/entities/drive"
import { getElementId } from "@tutao/meta"
import { WebFile } from "../../../../entities/tutanota/Utils"
import { DriveTransferState } from "./DriveTransferController"
import { isDriveFile } from "../../../common/api/common/drive/DriveUtils"
import { OperationStatus } from "@tutao/app-env"
import { SortColumn } from "./DriveViewModel"

export function makeDuplicateFileName(fileName: string, indicator: string = "copy"): string {
	const [basename, ext] = getFileBaseNameAndExtensions(fileName)
	const safeExt = ext ?? ""
	return `${basename} (${indicator})${safeExt}`
}

export interface FileFolderItem {
	type: "file"
	file: DriveFile
	parentFolder: DriveFolder | null
}

export interface FolderFolderItem {
	type: "folder"
	folder: DriveFolder
	parentFolder: DriveFolder | null
}

export type FolderItem = FileFolderItem | FolderFolderItem

export function folderItemEntity(folderItem: FileFolderItem | FolderFolderItem): DriveFile | DriveFolder {
	return folderItem.type === "file" ? folderItem.file : folderItem.folder
}

export function toFolderItems(folderContents: FolderContents): FolderItem[] {
	return [
		...folderContents.folders.map((folder) => ({ type: "folder", folder, parentFolder: folder.parentFolder }) satisfies FolderFolderItem),
		...folderContents.files.map((file) => ({ type: "file", file, parentFolder: file.parentFolder }) satisfies FileFolderItem),
	]
}

export function toFolderItem(item: DriveFile | DriveFolder, parentFolder: DriveFolder | null): FolderItem {
	if (isDriveFile(item)) {
		return { type: "file", file: item, parentFolder: parentFolder }
	} else {
		return { type: "folder", folder: item, parentFolder: parentFolder }
	}
}

export function folderItemid(item: FolderItem): IdTuple {
	return folderItemEntity(item)._id
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
 * @throws MoveToTrashError
 * @throws MoveDestinationIsSourceError
 */
export async function moveItems(entityClient: EntityClient, driveFacade: DriveFacade, items: readonly FolderItemId[], destinationFolderId: IdTuple) {
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

	const renamedFiles = await deduplicateItemNames(await loadFolderContents(driveFacade, destinationFolderId), files, folders)

	await driveFacade.move(files, folders, destinationFolderId, renamedFiles)
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

export interface DiskFolder<FileType> {
	// not present for root-level
	entry?: FileSystemDirectoryEntry

	name: string
	files: FileType[]
	folders: DiskFolder<FileType>[]
}

export async function childFileFromEntry(entry: FileSystemFileEntry): Promise<WebFile> {
	const resolver = defer<globalThis.File>()
	entry.file(
		(fileResult) => {
			resolver.resolve(fileResult)
		},
		(error) => {
			throw error
		},
	)

	const file = await resolver.promise
	return { _type: "WebFile", file: file }
}

// assumes that files and folders passed in have the same parent
export async function traverse<FileType>(
	folders: FileSystemDirectoryEntry[],
	resolveFileEntry: (fileEntry: FileSystemFileEntry) => Promise<FileType>,
): Promise<DiskFolder<FileType>[]> {
	const virtualRoot: DiskFolder<FileType> = {
		name: "\0",
		files: [],
		folders: [],
	}

	for (const rootFolder of folders) {
		await walkTree({ folder: rootFolder, parent: virtualRoot }, async ({ folder, parent }) => {
			const childEntries = await readAllFolderEntries(folder)
			const childFileEntries = childEntries.filter((e) => e.isFile) as FileSystemFileEntry[]
			const childFiles = await promiseMap(childFileEntries, resolveFileEntry)
			const childFolderEntries = childEntries.filter((e) => e.isDirectory) as FileSystemDirectoryEntry[]
			const resultFolder: DiskFolder<FileType> = {
				name: folder.name,
				files: childFiles,
				folders: [],
			}
			parent.folders.push(resultFolder)
			return childFolderEntries.map((f) => ({ folder: f, parent: resultFolder }))
		})
	}
	return virtualRoot.folders
}

async function readFolderEntriesChunk(folderReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
	const folderHasBeenRead = defer<FileSystemEntry[]>()
	folderReader.readEntries(
		(entries) => {
			folderHasBeenRead.resolve(entries)
		},
		(e) => folderHasBeenRead.reject(e),
	)
	return await folderHasBeenRead.promise
}

async function readAllFolderEntries(folder: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
	const folderReader = folder.createReader()
	const result: FileSystemEntry[] = []
	// MDN says on Chrome you need to call readEntries() multiple times because it only returns up to 100 entries.
	while (true) {
		const entriesChunk = await readFolderEntriesChunk(folderReader)
		if (isEmpty(entriesChunk)) {
			break
		} else {
			result.push(...entriesChunk)
		}
	}
	return result
}

export function calculatePercentage(currentTransfers: readonly DriveTransferState[]): number {
	const totalSize = currentTransfers.reduce((acc, cur) => BigInt(cur.totalSize) + acc, 0n)
	const totalTransferredSize = currentTransfers.reduce((acc, cur) => BigInt(cur.transferredSize) + acc, 0n)
	return totalSize === 0n ? 0 : Math.round(Number((totalTransferredSize * 10000n) / totalSize) / 100)
}

/**
 * Walk a tree-link data structure.
 * @param root starting point/(sub)tree root
 * @param processNode callback invoked for every node in the tree. Returns children of that node that need to be processed
 */
export async function walkTree<EL>(root: EL, processNode: (el: EL) => Promise<EL[]>) {
	const stack: EL[] = []
	stack.push(root)
	while (isNotEmpty(stack)) {
		const currentEl = assertNotNull(stack.pop())
		const newElements = await processNode(currentEl)
		stack.push(...newElements)
	}
}

export function folderItemParent(item: FolderItem): IdTuple | null {
	if (item.type === "file") {
		return item.file.folder
	} else {
		return item.folder.parent
	}
}

export function itemsIntoIds(items: readonly FolderItemId[]): { fileIds: IdTuple[]; folderIds: IdTuple[] } {
	const [fileFolderItems, folderFolderItems] = partition(items, (item) => item.type === "file")
	return {
		fileIds: fileFolderItems.map((item) => item.id),
		folderIds: folderFolderItems.map((item) => item.id),
	}
}
export type ComparisonFunction = (f1: FolderItem, f2: FolderItem) => number

export function comparisonFunction(column: SortColumn, order: "asc" | "desc"): ComparisonFunction {
	const itemName = (item: FolderItem) => (item.type === "folder" ? item.folder.name : item.file.name)
	const itemDate = (item: FolderItem) => (item.type === "folder" ? item.folder.updatedDate : item.file.updatedDate)
	const itemSize = (item: FolderItem) => (item.type === "folder" ? 0n : BigInt(item.file.size))

	const itemMimeType = (item: FolderItem) => (item.type === "folder" ? "" : item.file.mimeType)
	const itemLocation = (item: FolderItem) => item.parentFolder?.name || ""

	const attrToComparisonFunction: Record<SortColumn, ComparisonFunction> = {
		name: (f1: FolderItem, f2: FolderItem) => compareString(itemName(f1), itemName(f2)),
		mimeType: (f1: FolderItem, f2: FolderItem) => compareString(itemMimeType(f1), itemMimeType(f2)),
		location: (f1: FolderItem, f2: FolderItem) => compareString(itemLocation(f1), itemLocation(f2)),
		size: (f1: FolderItem, f2: FolderItem) => compareNumber(itemSize(f1), itemSize(f2)),
		date: (f1: FolderItem, f2: FolderItem) => compareNumber(itemDate(f1).getTime(), itemDate(f2).getTime()),
	}

	const comparisonFn = attrToComparisonFunction[column]

	// invert comparison function when the order is descending
	const sortFunction: typeof comparisonFn = order === "asc" ? comparisonFn : (l, r) => -comparisonFn(l, r)
	return sortFunction
}

const compareString = (s1: string, s2: string) => {
	s1 = s1.toLowerCase()
	s2 = s2.toLowerCase()

	if (s1 > s2) {
		return 1
	} else if (s2 > s1) {
		return -1
	}
	return 0
}

const compareNumber = (n1: number | bigint, n2: number | bigint) => {
	if (n1 > n2) {
		return 1
	} else if (n1 < n2) {
		return -1
	} else {
		return 0
	}
}

export enum DriveOperationType {
	Copy,
	Delete,
	Move,
	Trash,
	Restore,
}

export interface RunningOperation {
	type: DriveOperationType
	count: number
}

export interface OperationUpdate {
	type: DriveOperationType
	count: number
	status: OperationStatus
	error: Error | null
}
