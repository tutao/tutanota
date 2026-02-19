import { EntityClient, loadMultipleFromLists } from "../../../common/api/common/EntityClient"
import { BreadcrumbEntry, DriveFacade, DriveRootFolders } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { Router } from "../../../common/gui/ScopedRouter"
import { elementIdPart, getElementId, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import m from "mithril"
import { NotAuthorizedError, NotFoundError } from "../../../common/api/common/error/RestError"
import { assertNotNull, debounceStart, filterInt, lazyMemoized, memoizedWithHiddenArgument, ofClass, partition, SECOND_IN_MILLIS } from "@tutao/tutanota-utils"
import { DriveTransferState, DriveTransferController } from "./DriveTransferController"
import { getDefaultSenderFromUser } from "../../../common/mailFunctionality/SharedMailUtils"
import { DriveFile, DriveFileRefTypeRef, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "../../../common/api/entities/drive/TypeRefs"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { ArchiveDataType, Const, OperationType } from "../../../common/api/common/TutanotaConstants"
import { ListModel } from "../../../common/misc/ListModel"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { ListFetchResult } from "../../../common/gui/base/ListUtils"
import { ListState } from "../../../common/gui/base/List"
import Stream from "mithril/stream"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade"
import { LoginController } from "../../../common/api/main/LoginController"
import { isDriveEnabled } from "../../../common/api/common/drive/DriveUtils"
import { CancelledError } from "../../../common/api/common/error/CancelledError"
import { TransferProgressDispatcher } from "../../../common/api/main/TransferProgressDispatcher"
import { ChunkedDownloadInfo, ChunkedUploadInfo, TransferId } from "../../../common/api/common/drive/DriveTypes"
import { FileController } from "../../../common/file/FileController"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import { deduplicateItemNames, FolderItem, folderItemEntity, FolderItemId, folderItemToId, loadFolderContents, moveItems, pickNewFileName } from "./DriveUtils"
import { UserError } from "../../../common/api/main/UserError"
import { MoveCycleError } from "../../../common/api/common/error/MoveCycleError"

export const enum DriveFolderType {
	Regular = "0",
	Root = "1",
	Trash = "2",
}

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

export interface DriveClipboard {
	items: readonly FolderItemId[]
	action: ClipboardAction
}

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

export interface DriveStorage {
	usedBytes: number
	totalBytes: number
}

type ComparisonFunction = (f1: FolderItem, f2: FolderItem) => number

export class DriveViewModel {
	public readonly userMailAddress: string

	private sortingPreference: Readonly<SortingPreference> = { order: "asc", column: SortColumn.name }

	// normal folder view
	currentFolder: DisplayFolder | null = null
	parents: readonly DriveFolder[] = []
	roots!: DriveRootFolders

	private _clipboard: DriveClipboard | null = null

	get clipboard(): DriveClipboard | null {
		return this._clipboard
	}

	private listModel: ListModel<FolderItem, Id> = emptyListModel()
	private listStateSubscription: Stream<unknown> | null = null
	private storage: DriveStorage | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
		private readonly router: Router,
		public readonly uploadProgressListener: TransferProgressDispatcher,
		private readonly eventController: EventController,
		private readonly loginController: LoginController,
		private readonly userManagementFacade: UserManagementFacade,
		private readonly transferController: DriveTransferController,
		public readonly updateUi: () => unknown,
	) {
		this.userMailAddress = getDefaultSenderFromUser(this.loginController.getUserController())
	}

	readonly init = lazyMemoized(async () => {
		this.eventController.addEntityListener(async (events) => {
			await this.entityEventsReceived(events)
		})
		this.roots = await this.driveFacade.loadRootFolders()

		this.uploadProgressListener.addUploadListener((info: ChunkedUploadInfo) => {
			this.transferController.onChunkUploaded(info.fileId, info.uploadedBytes)
			this.updateUi()
		})

		this.uploadProgressListener.addDownloadListener((info: ChunkedDownloadInfo) => {
			this.transferController.onChunkDownloaded(info.fileId, info.downloadedBytes)
			this.updateUi()
		})

		this.refreshStorage()
	})

	isDriveEnabledForCustomer(): boolean {
		return isDriveEnabled(this.loginController)
	}

	private newListModel(folder: DriveFolder): ListModel<FolderItem, Id> {
		const newListModel = new ListModel<FolderItem, Id>({
			fetch: async (lastFetchedItem, count) => {
				if (lastFetchedItem == null) {
					return { items: await loadFolderContents(this.driveFacade, folder._id), complete: true }
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
				if (update.operation === OperationType.UPDATE || update.operation === OperationType.CREATE) {
					const item = await this.loadItem(isUpdateForTypeRef(DriveFolderTypeRef, update) ? "folder" : "file", [
						update.instanceListId,
						update.instanceId,
					])
					this.listModel.updateLoadedItem(item)
				}
				this.refreshStorage()
			}
		}
	}

	private async loadItem(type: "file" | "folder", id: IdTuple): Promise<FolderItem> {
		if (type === "file") {
			const file = await this.entityClient.load(DriveFileTypeRef, id)
			return { type, file }
		} else {
			const folder = await this.entityClient.load(DriveFolderTypeRef, id)
			return { type, folder }
		}
	}

	cut(items: readonly FolderItem[]) {
		this._clipboard = { items: items.map(folderItemToId), action: ClipboardAction.Cut }
		this.selectNone()
	}

	copy(items: readonly FolderItem[]) {
		this._clipboard = { items: items.map(folderItemToId), action: ClipboardAction.Copy }
		this.selectNone()
	}

	copySelectedItems() {
		if (!this.listModel.isSelectionEmpty()) {
			this.copy(this.listModel.getSelectedAsArray())
		}
	}

	cutSelectedItems() {
		if (!this.listModel.isSelectionEmpty()) {
			this.cut(this.listModel.getSelectedAsArray())
		}
	}

	/**
	 * @throws UserError
	 */
	async paste() {
		if (this.currentFolder == null) return

		if (this._clipboard?.action === ClipboardAction.Cut) {
			const clipboardItems = this._clipboard.items
			await this.moveItems(clipboardItems, this.currentFolder.folder)
			this._clipboard = null
			this.updateUi()
		} else if (this._clipboard?.action === ClipboardAction.Copy) {
			const clipboardItems = this._clipboard.items
			await this.copyItems(clipboardItems, this.currentFolder.folder)
			this.updateUi()
		}
	}

	async copyItems(items: readonly FolderItemId[], destination: DriveFolder) {
		const [fileItems, folderItems] = partition(items, (item) => item.type === "file")
		const files = await loadMultipleFromLists(
			DriveFileTypeRef,
			this.entityClient,
			fileItems.map((item) => item.id),
		)
		const folders = await loadMultipleFromLists(
			DriveFolderTypeRef,
			this.entityClient,
			folderItems.map((item) => item.id),
		)

		const renamedFiles = await deduplicateItemNames(await loadFolderContents(this.driveFacade, destination._id), files, folders)

		await this.driveFacade.copyItems(files, folders, destination, renamedFiles)
	}

	/**
	 * @throws UserError
	 */
	async moveItems(items: readonly FolderItemId[], destination: DriveFolder) {
		try {
			await moveItems(this.entityClient, this.driveFacade, items, destination)
		} catch (e) {
			if (e instanceof MoveCycleError) {
				throw new UserError("cannotMoveFolderIntoItself_msg")
			}
		}
		this.selectNone()
	}

	private itemsIntoIds(items: readonly FolderItem[]): { fileIds: IdTuple[]; folderIds: IdTuple[] } {
		const [fileFolderItems, folderFolderItems] = partition(items, (item) => item.type === "file")
		return {
			fileIds: fileFolderItems.map((item) => item.file._id),
			folderIds: folderFolderItems.map((item) => item.folder._id),
		}
	}

	async moveToTrash(items: readonly FolderItem[]) {
		const { fileIds, folderIds } = this.itemsIntoIds(items)
		await this.driveFacade.moveToTrash(fileIds, folderIds)
		this.selectNone()
	}

	async restoreFromTrash(items: readonly FolderItem[]) {
		const { fileIds, folderIds } = this.itemsIntoIds(items)
		await this.driveFacade.restoreFromTrash(fileIds, folderIds)
		this.selectNone()
	}

	async deleteFromTrash(items: readonly FolderItem[]) {
		await this.driveFacade.deleteFromTrash(items.map(folderItemEntity))
		this.selectNone()
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

	async displayFolder(folderId: IdTuple): Promise<void> {
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
			if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
				this.navigateToRootFolder()
			} else {
				throw e
			}
		}
	}

	openActiveItem() {
		const activeItem = this.listModel.getActiveItem()
		if (activeItem != null) {
			if (activeItem.type === "folder") {
				this.navigateToFolder(activeItem.folder._id)
			} else {
				this.downloadFile(activeItem.file)
			}
		}
	}

	async uploadFiles(files: File[]): Promise<void> {
		const targetFolderId: IdTuple =
			this.currentFolder == null || this.currentFolder.type === DriveFolderType.Trash ? this.roots?.root : this.currentFolder.folder._id

		await this.listModel.waitLoad()
		const folderItems = this.listModel.getUnfilteredAsArray()
		const takenFileNames: Set<string> = new Set(folderItems.map((item) => folderItemEntity(item).name))

		for (const file of files) {
			const newName = pickNewFileName(file.name, takenFileNames)
			takenFileNames.add(newName)
			await this.transferController.upload(file, newName, targetFolderId)
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
		this.transferController.download(file)
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

	onSingleSelection(item: FolderItem) {
		this.listModel.onSingleSelection(item)
	}

	onSingleInclusiveSelection(item: FolderItem) {
		this.listModel.onSingleInclusiveSelection(item)
	}

	onSingleExclusiveSelection(item: FolderItem) {
		this.listModel.onSingleExclusiveSelection(item)
	}

	onRangeSelectionTowards(item: FolderItem) {
		this.listModel.selectRangeTowards(item)
	}

	areAllSelected(): boolean {
		return this.listModel.areAllSelected()
	}

	selectAll() {
		if (this.listModel.isSelectionEmpty()) {
			this.listModel.selectAll()
		} else {
			this.listModel.selectNone()
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

	trashSelectedItems() {
		this.moveToTrash(this.listModel.getSelectedAsArray())
	}

	getUsedStorage(): DriveStorage | null {
		return this.storage
	}

	async getMoreParents(): Promise<DriveFolder[]> {
		if (this.currentFolder == null) {
			return []
		}

		let firstLoadedParent = this.parents[0]
		if (firstLoadedParent == null) return []
		return this.driveFacade.getFolderParents(firstLoadedParent)
	}

	transfers(): DriveTransferState[] {
		return Array.from(this.transferController.state)
	}

	cancelTransfer(transferId: TransferId) {
		this.transferController.cancelTransfer(transferId)
	}

	/**
	 * Update the used storage. Debounce it so that we don't request it too frequently.
	 */
	private readonly refreshStorage = debounceStart(60 * SECOND_IN_MILLIS, async () => {
		const customerInfo = await this.loginController.getUserController().loadCustomerInfo()
		this.storage = {
			usedBytes: await this.userManagementFacade.readUsedUserStorage(this.loginController.getUserController().user),
			totalBytes: Number(customerInfo.perUserStorageCapacity) * Const.MEMORY_GB_FACTOR,
		}
		this.updateUi()
	})
}

export type SortOrder = "asc" | "desc"
