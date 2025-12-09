import { EntityClient } from "../../../common/api/common/EntityClient"
import { BreadcrumbEntry, DriveFacade, UploadGuid } from "../../../common/api/worker/facades/DriveFacade"
import { Router } from "../../../common/gui/ScopedRouter"
import { elementIdPart, getElementId, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import m from "mithril"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { locator } from "../../../common/api/main/CommonLocator"
import { assertNotNull, memoizedWithHiddenArgument } from "@tutao/tutanota-utils"
import { UploadProgressListener } from "../../../common/api/main/UploadProgressListener"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { getDefaultSenderFromUser } from "../../../common/mailFunctionality/SharedMailUtils"
import { DriveFile, DriveFileRefTypeRef, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "../../../common/api/entities/drive/TypeRefs"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { ArchiveDataType, OperationType } from "../../../common/api/common/TutanotaConstants"
import { ListModel } from "../../../common/misc/ListModel"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { ListFetchResult } from "../../../common/gui/base/ListUtils"
import { ListState } from "../../../common/gui/base/List"
import Stream from "mithril/stream"

export const enum DriveFolderType {
	Regular = "0",
	Root = "1",
	Trash = "2",
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

export interface RegularFolder {
	type: DriveFolderType.Regular
	parents: readonly BreadcrumbEntry[]
	folder: DriveFolder
}

export type SpecialFolderType = DriveFolderType.Root | DriveFolderType.Trash

export interface SpecialFolder {
	type: SpecialFolderType
	folder: DriveFolder
}

export type DisplayFolder = RegularFolder | SpecialFolder

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
interface FolderWithItems {
	folder: DriveFolder
	items: FolderItem[]
}

export const enum SortColumn {
	name = "name",
	mimeType = "mimeType",
	size = "size",
	date = "date",
}

export interface SortingPreference {
	column: SortColumn
	order: SortOrder
}

export const enum ClipboardAction {
	Cut,
	Copy,
}

export function folderItemEntity(folderItem: FileFolderItem | FolderFolderItem): DriveFile | DriveFolder {
	return folderItem.type === "file" ? folderItem.file : folderItem.folder
}

type DriveClipboard = { items: readonly FolderItem[]; action: ClipboardAction }

function emptyListModel<Item, Id>(): ListModel<Item, Id> {
	return new ListModel({
		async fetch(): Promise<ListFetchResult<Item>> {
			return { items: [], complete: true }
		},
		getItemId(item: Item): Id {
			throw new Error("Should not be called")
		},
		isSameId(id1: Id, id2: Id): boolean {
			throw new Error("Should not be called")
		},
		sortCompare(item1: Item, item2: Item): number {
			throw new Error("Should not be called")
		},
		autoSelectBehavior: () => ListAutoSelectBehavior.NONE,
	})
}

type ComparisonFunction = (f1: FolderItem, f2: FolderItem) => number
export class DriveViewModel {
	public readonly driveUploadStackModel: DriveUploadStackModel
	public readonly userMailAddress: string

	private sortingPreference: Readonly<SortingPreference> = { order: "asc", column: SortColumn.name }

	// normal folder view
	currentFolder: DisplayFolder | null = null
	// FIXME: should probably be a part of current folder?
	parents: readonly DriveFolder[] = []
	roots!: Awaited<ReturnType<DriveFacade["loadRootFolders"]>>

	private _clipboard: DriveClipboard | null = null

	get clipboard(): DriveClipboard | null {
		return this._clipboard
	}

	private listModel: ListModel<FolderItem, Id> = emptyListModel()
	private listStateSubscription: Stream<unknown> | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
		private readonly router: Router,
		public readonly uploadProgressListener: UploadProgressListener,
		private readonly eventController: EventController,
		private readonly updateUi: () => unknown,
	) {
		this.driveUploadStackModel = new DriveUploadStackModel(driveFacade)
		this.userMailAddress = getDefaultSenderFromUser(locator.logins.getUserController())
	}

	async initialize() {
		this.eventController.addEntityListener(async (events) => {
			await this.entityEventsReceived(events)
		})
		this.roots = await this.driveFacade.loadRootFolders()
	}

	private newListModel(folder: DriveFolder): ListModel<FolderItem, Id> {
		const newListModel = new ListModel<FolderItem, Id>({
			fetch: async (lastFetchedItem, count) => {
				if (lastFetchedItem == null) {
					return { items: await this.loadFolderContents(folder), complete: true }
				} else {
					return { items: [] satisfies FolderItem[], complete: true }
				}
			},
			getItemId(item: FolderItem): Id {
				return getElementId(folderItemEntity(item))
			},
			sortCompare: (item1: FolderItem, item2: FolderItem): number => {
				return this.comparisonFunction()(item1, item2)
			},
			isSameId: isSameId,
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
		this.listStateSubscription?.end(true)
		this.listStateSubscription = newListModel.stateStream.map(this.updateUi)
		return newListModel
	}

	private readonly comparisonFunction: () => ComparisonFunction = memoizedWithHiddenArgument(
		() => this.sortingPreference,
		() => {
			const column = this.sortingPreference.column
			const itemName = (item: FolderItem) => (item.type === "folder" ? item.folder.name : item.file.name)
			const itemDate = (item: FolderItem) => (item.type === "folder" ? item.folder.updatedDate : item.file.updatedDate)
			const itemSize = (item: FolderItem) => (item.type === "folder" ? 0n : BigInt(item.file.size))

			const itemMimeType = (item: FolderItem) => (item.type === "folder" ? "" : item.file.mimeType)

			const attrToComparisonFunction: Record<SortColumn, ComparisonFunction> = {
				name: (f1: FolderItem, f2: FolderItem) => compareString(itemName(f1), itemName(f2)),
				mimeType: (f1: FolderItem, f2: FolderItem) => compareString(itemMimeType(f1), itemMimeType(f2)),
				size: (f1: FolderItem, f2: FolderItem) => compareNumber(itemSize(f1), itemSize(f2)),
				date: (f1: FolderItem, f2: FolderItem) => compareNumber(itemDate(f1).getTime(), itemDate(f2).getTime()),
			}

			const comparisonFn = attrToComparisonFunction[column]

			// invert comparison function when the order is descending
			const sortFunction: typeof comparisonFn = this.sortingPreference.order === "asc" ? comparisonFn : (l, r) => -comparisonFn(l, r)
			return sortFunction
		},
	)

	private async entityEventsReceived(events: ReadonlyArray<EntityUpdateData>) {
		for (const update of events) {
			if (isUpdateForTypeRef(DriveFileRefTypeRef, update) && update.instanceListId === this.currentFolder?.folder.files) {
				if (update.operation === OperationType.DELETE) {
					await this.listModel.deleteLoadedItem(update.instanceId)
				}
				if (update.operation === OperationType.CREATE) {
					const fileRef = await this.entityClient.load(DriveFileRefTypeRef, [update.instanceListId, update.instanceId])
					const item = fileRef.file ? await this.loadItem("file", fileRef.file) : await this.loadItem("folder", assertNotNull(fileRef.folder))
					this.listModel.waitLoad(() => {
						if (this.listModel.canInsertItem(item)) {
							this.listModel.insertLoadedItem(item)
						}
					})
				}
			} else if (isUpdateForTypeRef(DriveFileTypeRef, update) || isUpdateForTypeRef(DriveFolderTypeRef, update)) {
				if (this.currentFolder == null) {
					continue
				}
				const item = await this.loadItem(isUpdateForTypeRef(DriveFolderTypeRef, update) ? "folder" : "file", [update.instanceListId, update.instanceId])
				this.listModel.updateLoadedItem(item)
			}
		}
	}

	async loadItem(type: "file" | "folder", id: IdTuple): Promise<FolderItem> {
		if (type === "file") {
			const file = await this.entityClient.load(DriveFileTypeRef, id)
			return { type, file }
		} else {
			const folder = await this.entityClient.load(DriveFolderTypeRef, id)
			return { type, folder }
		}
	}

	cut(items: readonly FolderItem[]) {
		this._clipboard = { items, action: ClipboardAction.Cut }
		this.selectNone()
	}

	copy(items: readonly FolderItem[]) {
		this._clipboard = { items, action: ClipboardAction.Copy }
		this.selectNone()
	}

	async paste() {
		if (this.currentFolder == null) return

		if (this._clipboard?.action === ClipboardAction.Cut) {
			const clipboardItems = this._clipboard.items
			await this.moveItems(clipboardItems, this.currentFolder.folder._id)
			this._clipboard = null
			this.updateUi()
		} else if (this._clipboard?.action === ClipboardAction.Copy) {
			await this.driveFacade.copyItems(this._clipboard.items.map(folderItemEntity), this.currentFolder.folder)
		}
	}

	private async moveItems(folderItems: readonly FolderItem[], destination: IdTuple) {
		await this.driveFacade.move(folderItems.map(folderItemEntity), destination)
		this.selectNone()
	}

	async moveToTrash(items: readonly FolderItem[]) {
		await this.driveFacade.moveToTrash(items.map(folderItemEntity))
		this.selectNone()
	}

	async restoreFromTrash(items: readonly FolderItem[]) {
		await this.driveFacade.restoreFromTrash(items.map(folderItemEntity))
		this.selectNone()
	}

	async loadSpecialFolder(specialFolderType: SpecialFolderType) {
		let folder: DriveFolder
		switch (specialFolderType) {
			case DriveFolderType.Trash:
				folder = await this.entityClient.load(DriveFolderTypeRef, this.roots.trash)
				break
			case DriveFolderType.Root:
				folder = await this.entityClient.load(DriveFolderTypeRef, this.roots.root)
				break
		}

		this.currentFolder = {
			folder: folder,
			type: specialFolderType,
		}
		await this.loadParents(folder)
	}

	private async loadParents(folder: DriveFolder) {
		if (folder.parent != null) {
			const directParent = await this.entityClient.load(DriveFolderTypeRef, folder.parent)
			const grandparent = directParent.parent ? await this.entityClient.load(DriveFolderTypeRef, directParent.parent) : null
			this.parents = grandparent ? [grandparent, directParent] : [directParent]
		} else {
			this.parents = []
		}
	}

	async loadFolder(folderId: IdTuple): Promise<void> {
		try {
			const folder = await this.entityClient.load(DriveFolderTypeRef, folderId)
			if (folder.type === DriveFolderType.Regular) {
				this.currentFolder = {
					type: folder.type,
					folder,
					parents: [],
				} satisfies RegularFolder
			} else {
				this.currentFolder = {
					folder,
					type: folder.type as SpecialFolderType,
				} satisfies SpecialFolder
			}

			this.listModel = this.newListModel(folder)
			this.listModel.loadInitial()
			await this.loadParents(folder)
		} catch (e) {
			if (e instanceof NotFoundError) {
				this.navigateToRootFolder()
			} else {
				throw e
			}
		}
	}

	async loadFolderContents(folder: DriveFolder): Promise<FolderItem[]> {
		const { files, folders } = await this.driveFacade.getFolderContents(folder._id)
		const items = [
			...folders.map((folder) => ({ type: "folder", folder }) satisfies FolderFolderItem),
			...files.map((file) => ({ type: "file", file }) satisfies FileFolderItem),
		]
		return items
	}

	public generateUploadGuid(): UploadGuid {
		return crypto.randomUUID()
	}

	async uploadFiles(files: File[]): Promise<void> {
		for (const file of files) {
			const fileId = this.generateUploadGuid()
			this.driveUploadStackModel.addUpload(fileId, file.name, file.size)

			this.driveFacade.uploadFile(file, fileId, assertNotNull(this.currentFolder?.folder)._id)
		}
	}

	async createNewFolder(folderName: string): Promise<void> {
		await this.driveFacade.createFolder(folderName, assertNotNull(this.currentFolder?.folder)._id)
	}

	navigateToFolder(folderId: IdTuple) {
		// Ideally we'd like to use Tuta's router, but navigating back from a folder then entering it again doesn't seem to work.
		// Using Mithril's router directly seems to avoid this problem.
		// this.router.routeTo("/drive/:folderListId/:folderElementId", { folderListId: listIdPart(folderId), folderElementId: elementIdPart(folderId) })
		m.route.set("/drive/:folderListId/:folderElementId", {
			folderListId: listIdPart(folderId),
			folderElementId: elementIdPart(folderId),
		})
	}

	async navigateToRootFolder(): Promise<void> {
		this.navigateToFolder(this.roots.root)
	}

	async downloadFile(file: DriveFile): Promise<void> {
		// a bit ugly -- should we rename and move that one?
		locator.fileController.open(file, ArchiveDataType.DriveFile)
	}

	getCurrentColumnSortOrder() {
		return this.sortingPreference
	}

	sort(column: SortColumn) {
		if (this.sortingPreference.column === column) {
			// flip order
			this.sortingPreference = { column: column, order: this.sortingPreference.order === "asc" ? "desc" : "asc" }
		} else {
			this.sortingPreference = { column: column, order: "asc" }
		}

		if (this.currentFolder == null) return
		this.listModel.sort()
	}

	rename(item: FolderItem, newName: string) {
		this.driveFacade.rename(folderItemEntity(item), newName)
	}

	onSingleInclusiveSelection(item: FolderItem) {
		this.listModel.onSingleInclusiveSelection(item)
	}

	areAllSelected(): boolean {
		return this.listModel.areAllSelected()
	}

	selectAll() {
		if (this.areAllSelected()) {
			this.listModel.selectNone()
		} else {
			this.listModel.selectAll()
		}
	}

	selectNone() {
		this.listModel.selectNone()
	}

	selectPrevious(multiselect: boolean) {
		this.listModel.selectPrevious(multiselect)
	}

	selectNext(multiselect: boolean) {
		this.listModel.selectNext(multiselect)
	}

	listState(): ListState<FolderItem> {
		return this.listModel.state
	}
}

export type SortOrder = "asc" | "desc"
