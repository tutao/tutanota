import { elementIdPart, getElementId, isSameIdTuple, isSameSingleId, listIdPart, OperationType } from "@tutao/meta"
import { EntityUpdateData, isUpdateForTypeRef, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { BreadcrumbEntry, DriveFacade, DriveFolderType, DriveRootFolders } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { Router } from "../../../../ui/ScopedThrottledRouter"
import { assertNotNull, debounceStart, last, lazyAsync, memoizedWithHiddenArgument, promiseMap } from "@tutao/utils"
import { DriveTransfers, DriveTransferState } from "./DriveTransferController"
import { getDefaultSenderFromUser } from "../../../common/mailFunctionality/SharedMailUtils"
import { EventController } from "../../../common/api/main/EventController"
import { Const, EnvProvider, TimeConstants } from "@tutao/app-env"
import { ListModel } from "../../../common/misc/ListModel"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { ListFetchResult, ListItemSelectionCallbacks } from "../../../../ui/base/ListUtils"
import { ListState } from "../../../../ui/base/List"
import Stream from "mithril/stream"
import { UserManagementFacade } from "../../../common/api/worker/facades/lazy/UserManagementFacade"
import { LoginController } from "../../../common/api/main/LoginController"
import { isDriveEnabled } from "../../../common/misc/DriveUtils"
import {
	childFileFromEntry,
	comparisonFunction,
	ComparisonFunction,
	DiskFolder,
	FileFolderItem,
	FolderItem,
	folderItemEntity,
	folderItemId,
	FolderItemId,
	folderItemToId,
	loadFolderContents,
	OperationUpdate,
	SortColumn,
	SortingPreference,
	toggleSort,
	traverse,
} from "./DriveUtils"
import { UserError } from "../../../common/api/main/UserError"
import { FileReference, WebFile } from "../../../../entities/tutanota/Utils"
import { TransferId } from "../../../../entities/drive/Utils"
import { DriveFile, DriveFileRefTypeRef, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "@tutao/entities/drive"
import { isOfflineError, NotAuthorizedError, NotFoundError } from "@tutao/rest-client/error"
import { WebFileResolver } from "./WebFileResolver"
import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel"
import { SearchRouter } from "../../../common/search/view/SearchRouter"
import { DriveSearchModel } from "../../search/model/DriveSearchModel"
import { DriveClipboard, DriveModel } from "../model/DriveModel"
import { listItemSelectionCallbacksFor } from "../../../common/misc/ListModelUtils"
import { isDriveFile } from "../../../common/api/common/drive/DriveUtils"
import { LiveSearchResult, QuickSearchQuery, SearchQuery } from "../../../common/search/SearchUtils"
import { DuplicateFilesDialogDecision, showDuplicateFilesChoiceDialog } from "./DriveGuiUtils"
import { WsConnectionState } from "../../../../platform-kit/network/Constants"
import { WindowFacade } from "../../../common/misc/WindowFacade"

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

export class DriveViewModel {
	public readonly userMailAddress: string

	private sortingPreference: Readonly<SortingPreference> = { order: "asc", column: SortColumn.name }

	// normal folder view
	currentFolder: DisplayFolder | null = null
	parents: readonly DriveFolder[] = []
	roots: DriveRootFolders | null = null

	private listModel: ListModel<FolderItem, Id> = emptyListModel()
	private listStateSubscription: Stream<unknown> | null = null
	private storage: DriveStorage | null = null

	public readonly initialized: Promise<void>
	public resolveInitialized: (value: PromiseLike<void> | void) => void = (value: void) => {}

	private readonly connectionStateListener = {
		id: "DriveViewModel",
		priority: ListenerPriority.NORMAL,
		onConnectionStateChanged: async (connectionState: WsConnectionState) => {
			if (connectionState === WsConnectionState.connected) {
				await this.listModel.reload()
			}
		},
	}

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
		private readonly router: Router,
		private readonly eventController: EventController,
		public readonly loginController: LoginController,
		private readonly userManagementFacade: UserManagementFacade,
		private readonly webFileResolver: WebFileResolver | null,
		private readonly windowFacade: WindowFacade,
		public readonly updateUi: () => unknown,
		private readonly showWindowCloseConfirmation: () => Promise<boolean>,
		private readonly connectivityModel: WebsocketConnectivityModel,
		private readonly searchModel: lazyAsync<DriveSearchModel>,
		private readonly searchRouter: SearchRouter,
		private readonly driveModel: DriveModel,
	) {
		this.userMailAddress = getDefaultSenderFromUser(this.loginController.getUserController())
		this.initialized = new Promise((resolve, reject) => {
			this.resolveInitialized = resolve
		})
		this.driveModel.setAllTransfersDoneListener(() => {
			if (this.deleteWindowCloseListener != null) {
				this.deleteWindowCloseListener()
				this.deleteWindowCloseListener = null
			}
		})
	}

	get clipboard(): DriveClipboard | null {
		return this.driveModel.clipboard
	}
	readonly init = async () => {
		// if the roots have already been loaded the init must have been finished
		if (this.roots) {
			return
		}

		try {
			this.roots = await this.driveFacade.loadRootFolders("cached")
		} catch (e) {
			if (isOfflineError(e)) {
				await this.loginController.waitForFullLogin()

				// do not finish init if the plan does not support it
				if (await this.currentPlanSupportsDrive()) {
					this.roots = await this.driveFacade.loadRootFolders("withNetwork")
				} else {
					return
				}
			} else {
				throw e
			}
		}

		this.eventController.addEntityUpdatesListener({
			id: "DriveViewModel",
			onEntityUpdatesReceived: async (events) => {
				await this.onEntityUpdatesReceived(events)
			},
			priority: ListenerPriority.NORMAL,
		})

		this.connectivityModel.addConnectionStateListener(this.connectionStateListener)
		this.loginController.waitForFullLogin().then(() => this.refreshStorage())
		await this.driveModel.init()
		this.resolveInitialized()
	}

	public waitForInit(): Promise<void> {
		return this.initialized
	}

	public async currentPlanSupportsDrive(): Promise<boolean> {
		return (await this.loginController.getUserController().getPlanConfig()).drive
	}
	operationUpdates(): Stream<OperationUpdate | null> {
		return this.driveModel.operationUpdates
	}
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
			isSameId: isSameSingleId,
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
		this.listStateSubscription?.end(true)
		this.listStateSubscription = newListModel.stateStream.map(this.updateUi)
		return newListModel
	}

	private readonly comparisonFunction: () => ComparisonFunction = memoizedWithHiddenArgument(
		() => this.sortingPreference,
		() => comparisonFunction(this.sortingPreference.column, this.sortingPreference.order),
	)

	deinit() {
		this.connectivityModel.removeConnectionStateListener(this.connectionStateListener)
	}

	private async onEntityUpdatesReceived(events: ReadonlyArray<EntityUpdateData>) {
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
						assertNotNull(update.instanceListId),
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
			return { type, file, parentFolder: null }
		} else {
			const folder = await this.entityClient.load(DriveFolderTypeRef, id)
			return { type, folder, parentFolder: null }
		}
	}

	cut(items: readonly FolderItem[]) {
		this.driveModel.cut(items)
		this.listModel.selectNone()
	}

	copy(items: readonly FolderItem[]) {
		this.driveModel.copy(items)
		this.listModel.selectNone()
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
		this.driveModel.paste(this.currentFolder.folder)
		this.updateUi()
	}

	/**
	 * @throws UserError
	 */

	/**
	 * @throws UserError
	 */
	async moveItems(items: readonly FolderItemId[], destinationId: IdTuple) {
		await this.driveModel.moveItems(items, destinationId)
		this.listModel.selectNone()
	}

	async moveToTrash(items: readonly FolderItemId[]) {
		if (this.roots == null) {
			return
		}
		await this.driveModel.moveToTrash(items)
		this.listModel.selectNone()
	}

	async restoreFromTrash(items: readonly FolderItem[]) {
		await this.driveModel.restoreFromTrash(items)
		this.listModel.selectNone()
	}

	async deleteFromTrash(items: readonly FolderItem[]) {
		await this.driveModel.deleteFromTrash(items)
		this.listModel.selectNone()
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

	goToParentFolder() {
		const parents = this.parents
		const directParent = last(parents)
		if (directParent != null) {
			this.navigateToFolder(directParent._id)
		}
	}

	openActiveItem() {
		const activeItem = this.listModel.getActiveItem()
		if (activeItem != null) {
			if (activeItem.type === "folder") {
				this.navigateToFolder(activeItem.folder._id)
			} else {
				this.openFile(activeItem.file)
			}
		}
	}

	getSelectedItem(): FolderItem | null {
		if (this.listModel.getSelectedAsArray().length === 1) {
			return this.listModel.getActiveItem()
		} else {
			return null
		}
	}

	private deleteWindowCloseListener: (() => unknown) | null = null

	private ensureWindowCloseListener() {
		if (this.deleteWindowCloseListener == null) {
			this.deleteWindowCloseListener = this.windowFacade.addWindowCloseListener(async () => {
				if (EnvProvider.get().isDesktop()) {
					const cancelAndClose: boolean = await this.showWindowCloseConfirmation()

					if (cancelAndClose) {
						this.deleteWindowCloseListener?.()
						this.windowFacade.closeWindow()
					}
				}
			})
		}
	}

	async uploadFiles(
		files: (WebFile | FileReference)[],
		showDuplicateFilesChoiceDialog: (fileName: string, fileCount: number) => Promise<DuplicateFilesDialogDecision>,
		folders?: DiskFolder<WebFile | FileReference>[],
		customTargetFolderId?: IdTuple,
	): Promise<void> {
		if (this.roots == null) {
			console.log("drive is not initialized")
			return
		}
		const targetFolderId: IdTuple = customTargetFolderId
			? customTargetFolderId
			: this.currentFolder == null || this.currentFolder.type === DriveFolderType.Trash
				? this.roots?.root
				: this.currentFolder.folder._id

		await this.listModel.waitLoad()
		const uploading = await this.driveModel.uploadFiles(files, targetFolderId, showDuplicateFilesChoiceDialog, folders)
		if (uploading) {
			this.ensureWindowCloseListener()
		}
	}

	async createNewFolder(folderName: string, parentFolderId?: IdTuple): Promise<DriveFolder> {
		if (parentFolderId == null) {
			const currentFolder = assertNotNull(this.currentFolder).folder
			if (currentFolder.type === DriveFolderType.Trash) {
				parentFolderId = assertNotNull(this.roots).root
			} else {
				parentFolderId = currentFolder._id
			}
		}
		return this.driveFacade.createFolder(folderName, parentFolderId)
	}

	navigateToFolder(folderId: IdTuple) {
		this.router.routeTo("/drive/:folderListId/:folderElementId", { folderListId: listIdPart(folderId), folderElementId: elementIdPart(folderId) })
	}

	navigateToRootFolder() {
		if (this.roots) {
			this.navigateToFolder(this.roots.root)
		}
	}

	async openFile(file: DriveFile): Promise<void> {
		this.ensureWindowCloseListener()
		await this.driveModel.openFile(file)
	}

	async downloadFile(file: DriveFile): Promise<void> {
		this.ensureWindowCloseListener()
		await this.driveModel.downloadFile(file)
	}

	// Multi-select downloading is only permitted if the selection does not contain any folders.
	isDownloadPermitted(items: readonly FolderItem[]): items is FileFolderItem[] {
		return this.driveModel.isDownloadPermitted(items)
	}

	getCurrentColumnSortOrder() {
		return this.sortingPreference
	}

	sort(column: SortColumn) {
		this.sortingPreference = toggleSort(this.sortingPreference, column)
		if (this.currentFolder == null) return
		this.listModel.sort()
	}

	rename(item: FolderItem, newName: string) {
		this.driveModel.rename(item, newName)
	}

	toggleSelectAll() {
		if (this.listModel.isSelectionEmpty()) {
			this.listModel.selectAll()
		} else {
			this.listModel.selectNone()
		}
	}

	listState(): ListState<FolderItem> {
		return this.listModel.state
	}

	trashSelectedItems() {
		this.moveToTrash(this.listModel.getSelectedAsArray().map(folderItemToId))
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
		return this.driveFacade.getFolderParents(firstLoadedParent._id)
	}

	transfers(): DriveTransfers {
		return this.driveModel.transfers()
	}

	cancelTransfer(transferId: TransferId) {
		this.driveModel.cancelTransfer(transferId)
	}

	retryTransfer(transferId: TransferId) {
		this.driveModel.retryTransfer(transferId)
	}

	retryFailedTransfers() {
		this.driveModel.retryFailedTransfers()
	}

	flushTransfers() {
		this.driveModel.flushTransfers()
	}

	/**
	 * Update the used storage. Debounce it so that we don't request it too frequently.
	 */
	private readonly refreshStorage = debounceStart(60 * TimeConstants.SECOND_IN_MILLIS, async () => {
		const customerInfo = await this.loginController.getUserController().loadCustomerInfo()
		this.storage = {
			usedBytes: await this.userManagementFacade.readUsedUserStorage(this.loginController.getUserController().user),
			totalBytes: Number(customerInfo.perUserStorageCapacity) * Const.MEMORY_GB_FACTOR,
		}
		this.updateUi()
	})

	enterMultiselect() {
		this.listModel.enterMultiselect()
	}

	async filesDropped(files: File[], folderTransferItems: FileSystemDirectoryEntry[]) {
		if (EnvProvider.get().isDesktop()) {
			const webFileResolver = assertNotNull(this.webFileResolver)
			const fileRefs = await promiseMap(files, (file) => webFileResolver.resolveWebFile(file))

			async function fileEntryToFileRef(entry: FileSystemFileEntry): Promise<FileReference> {
				const file = await childFileFromEntry(entry)
				return await webFileResolver.resolveWebFile(file.file)
			}

			const tree = await traverse<FileReference>(folderTransferItems, fileEntryToFileRef)
			await this.uploadFiles(fileRefs, showDuplicateFilesChoiceDialog, tree)
		} else {
			const tree = await traverse(folderTransferItems, childFileFromEntry)
			await this.uploadFiles(
				files.map((f) => {
					return { _type: "WebFile", file: f } satisfies WebFile
				}),
				showDuplicateFilesChoiceDialog,
				tree,
			)
		}
	}

	selectSearchResult(searchQuery: SearchQuery, driveSearchResult: FolderItem | null) {
		this.searchRouter.routeTo(searchQuery.query, searchQuery.restriction, driveSearchResult ? elementIdPart(folderItemId(driveSearchResult)) : null)
	}
	async getSearchResult({ query, maxResults }: QuickSearchQuery): Promise<LiveSearchResult<FolderItem>> {
		const fileGroupId = await this.driveFacade.getFileGroupId()
		const { createDriveRestriction } = await import("../../search/model/DriveSearchUtils.js")
		const restriction = createDriveRestriction({ start: null, end: null })
		return await (
			await this.searchModel()
		).searchDrive({ query, maxResults, restriction }, fileGroupId, (a: DriveFile | DriveFolder, b: DriveFile | DriveFolder) =>
			this.compareDriveItemsForSearch(a, b),
		)
	}

	compareDriveItemsForSearch(a: DriveFile | DriveFolder, b: DriveFile | DriveFolder): number {
		const parentA = isDriveFile(a) ? a.folder : a.parent
		const parentB = isDriveFile(b) ? b.folder : b.parent

		const currentFolderId = assertNotNull(this.currentFolder?.folder)._id
		const rootFolderId = assertNotNull(this.roots?.root)
		const trashFolderId = assertNotNull(this.roots?.trash)

		// First, prioritize results in the currently shown folder.
		if (isSameIdTuple(currentFolderId, parentA) && !isSameIdTuple(currentFolderId, parentB)) {
			return -1
		}
		if (!isSameIdTuple(currentFolderId, parentA) && isSameIdTuple(currentFolderId, parentB)) {
			return 1
		}

		// Then, list files in "home" folder.
		if (isSameIdTuple(rootFolderId, parentA) && !isSameIdTuple(currentFolderId, parentB)) {
			return -1
		}
		if (!isSameIdTuple(currentFolderId, parentA) && isSameIdTuple(currentFolderId, parentB)) {
			return 1
		}

		// Finally, prioritize items that are not in "trash" folder.
		if (!isSameIdTuple(trashFolderId, parentA) && isSameIdTuple(trashFolderId, parentB)) {
			return -1
		}
		if (isSameIdTuple(trashFolderId, parentA) && !isSameIdTuple(trashFolderId, parentB)) {
			return 1
		}

		return 0
	}

	get selectionEvents(): ListItemSelectionCallbacks<FolderItem> {
		return listItemSelectionCallbacksFor(this.listModel)
	}

	async cancelAllTransfers(confirmationDialog: (activeTransfers: DriveTransferState[]) => Promise<boolean>) {
		await this.driveModel.cancelAllTransfers(confirmationDialog)
	}
	goToSearchMobile() {
		this.router.routeTo("/search/drive/", {})
	}
}
