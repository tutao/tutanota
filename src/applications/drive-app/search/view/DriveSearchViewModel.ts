import { ListFilter, ListModel } from "../../../common/misc/ListModel"
import Id from "../../../../ui/translations/id"
import { createEmptyRestriction, emptyListModel, getSearchUrl, isNewSearch, LiveSearchResult, SearchQuery } from "../../../common/search/SearchUtils"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import {
	DateProvider,
	debounce,
	filterInt,
	findBy,
	getEndOfDay,
	getFirstOrThrow,
	getStartOfDay,
	isNotEmpty,
	isNotNull,
	memoizedWithHiddenArgument,
	YEAR_IN_MILLIS,
} from "@tutao/utils"
import { SearchRouter } from "../../../common/search/view/SearchRouter"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"
import { LoginController } from "../../../common/api/main/LoginController"
import {
	comparisonFunction,
	ComparisonFunction,
	DiskFolder,
	FileFolderItem,
	FolderFolderItem,
	FolderItem,
	folderItemId,
	FolderItemId,
	folderItemParentId,
	folderItemToId,
	SortColumn,
	SortingPreference,
	toggleSort,
} from "../../drive/view/DriveUtils"
import { DriveTransfers, DriveTransferState } from "../../drive/view/DriveTransferController"
import { TransferId } from "../../../../entities/drive/Utils"
import { elementIdPart, isSameId, isSameSingleId, listIdPart } from "@tutao/meta"
import { DriveFacade, DriveRootFolders } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { CancelledError, EnvProvider } from "@tutao/app-env"
import Stream from "mithril/stream"
import { DriveFile } from "@tutao/entities/drive"
import { Router } from "../../../../ui/ScopedThrottledRouter"
import { DRIVE_PREFIX } from "../../../../ui/utils/RouteChange"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { DriveSearchModel } from "../model/DriveSearchModel"
import { ListState } from "../../../../ui/base/List"
import { TransferProgressDispatcher } from "../../../common/api/main/TransferProgressDispatcher"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel"
import { DriveClipboard, DriveModel } from "../../drive/model/DriveModel"
import { ListItemSelectionCallbacks } from "../../../../ui/base/ListUtils"
import { listItemSelectionCallbacksFor } from "../../../common/misc/ListModelUtils"
import { createDriveRestriction, getDriveRestriction } from "../model/DriveSearchUtils"
import { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import { DuplicateFilesDialogDecision } from "../../drive/view/DriveGuiUtils"
import { FileReference, WebFile } from "../../../../entities/tutanota/Utils"
import { WindowFacade } from "../../../common/misc/WindowFacade"
import { FileType, getDisplayType } from "../../drive/model/DriveMimeUtils"

const SEARCH_PAGE_SIZE = 100

export enum DriveSizeFilter {
	NoLimit,
	Below1MB,
	Below10MB,
	Below250MB,
	Below1000MB,
	Over1000MB,
}

export class DriveSearchViewModel {
	#listModel: ListModel<FolderItem, Id> = emptyListModel()
	#startDate: Date | null = null
	get startDate(): Date | null {
		return this.#startDate
	}

	#endDate: Date | null = null
	get endDate(): Date {
		if (this.#endDate) {
			return this.#endDate
		} else {
			return new Date(this.dateProvider.now())
		}
	}

	get listModel(): ListModel<FolderItem, Id> {
		return this.#listModel
	}

	#delayingSearch: boolean = false

	get busy(): boolean {
		return this.#delayingSearch
	}

	#driveSizeFilter: DriveSizeFilter = DriveSizeFilter.NoLimit
	get driveSizeFilter() {
		return this.#driveSizeFilter
	}

	#driveFileTypeFiler: FileType | null = null
	get driveFileTypeFiler() {
		return this.#driveFileTypeFiler
	}

	private searchResult: LiveSearchResult<FolderItem> | null = null
	private sortingPreference: Readonly<SortingPreference> = { order: "asc", column: SortColumn.name }
	private currentQuery: string = ""
	private listStateSubscription: Stream<unknown> | null = null

	roots: DriveRootFolders | null = null

	constructor(
		private readonly searchRouter: SearchRouter,
		private readonly search: DriveSearchModel,
		private readonly router: Router,
		private readonly dateProvider: DateProvider,
		private readonly logins: LoginController,
		private readonly driveFacade: DriveFacade,
		private readonly updateUi: () => unknown,
		public readonly transferProgressDispatcher: TransferProgressDispatcher,
		private readonly driveOperations: DriveModel,
		private readonly windowFacade: WindowFacade,
		private readonly showWindowCloseConfirmation: () => Promise<boolean>,
	) {}

	readonly init = async () => {
		if (this.roots) {
			return
		}
		this.roots = await this.driveFacade.loadRootFolders("withNetwork")
		await this.driveOperations.init()
	}

	get clipboard(): DriveClipboard | null {
		return this.driveOperations.clipboard
	}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createEmptyRestriction(category))
	}

	getCurrentQuery() {
		return this.currentQuery
	}

	getHighlightedStrings(): readonly SearchToken[] {
		return this.searchResult?.searchResult.tokens ?? []
	}

	onSearchQueryUpdated(text: string) {
		this.currentQuery = text
		this.#delayingSearch = true
		this.debouncedUpdateSearchUrl(() => {
			this.#delayingSearch = false
		})
	}

	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}

	labelForDriveSizeFilterChip(): Translation {
		switch (this.#driveSizeFilter) {
			case DriveSizeFilter.Below1MB:
				return lang.getTranslation("driveFileSizeLessThan1MB_label")
			case DriveSizeFilter.Below10MB:
				return lang.getTranslation("driveFileSizeLessThan10MB_label")
			case DriveSizeFilter.Below250MB:
				return lang.getTranslation("driveFileSizeLessThan250MB_label")
			case DriveSizeFilter.Below1000MB:
				return lang.getTranslation("driveFileSizeLessThan1GB_label")
			case DriveSizeFilter.Over1000MB:
				return lang.getTranslation("driveFileSizeBiggerThan1GB_label")
			case DriveSizeFilter.NoLimit:
				return lang.getTranslation("driveFileSizeFilter_label")
		}
	}

	labelForDriveFileTypeFilterChip(): Translation {
		switch (this.#driveFileTypeFiler) {
			case FileType.Audio:
				return lang.getTranslation("driveAudioFilter_label")
			case FileType.Document:
				return lang.getTranslation("driveDocumentFilter_label")
			case FileType.Generic:
				return lang.getTranslation("driveGenericFilter_label")
			case FileType.Video:
				return lang.getTranslation("driveVideoFilter_label")
			case FileType.Image:
				return lang.getTranslation("driveImageFilter_label")
			case null:
				return lang.getTranslation("driveFileTypeFilter_label")
		}
	}

	public checkDates(startDate: Date | null, endDate: Date | null): "long" | "startafterend" | null {
		if (startDate && endDate) {
			if (startDate.getTime() > endDate.getTime()) {
				return "startafterend"
			} else if (startDate && endDate.getTime() - startDate.getTime() > YEAR_IN_MILLIS) {
				return "long"
			}
		}
		return null
	}

	selectStartDate(startDate: Date | null): void {
		this.#startDate = startDate
		this.searchAgain()
	}

	selectEndDate(endDate: Date) {
		this.#endDate = endDate
		this.searchAgain()
	}

	listState(): ListState<FolderItem> {
		return this.#listModel.state
	}

	transfers(): DriveTransfers {
		return this.driveOperations.transfers()
	}

	cancelTransfer(transferId: TransferId) {
		this.driveOperations.cancelTransfer(transferId)
	}

	async cancelAllTransfers(confirmationDialog: (activeTransfers: DriveTransferState[]) => Promise<boolean>) {
		await this.driveOperations.cancelAllTransfers(confirmationDialog)
	}

	anySelectedItemInTrash(): boolean {
		for (const item of this.listModel.state.selectedItems) {
			if (this.roots !== null) {
				if (isSameId(folderItemParentId(item), this.roots.trash)) {
					return true
				}
			}
		}
		return false
	}

	allItemsInTrash(): boolean {
		if (this.roots != null) {
			const trashId = this.roots.trash
			const itemNotInTrash = findBy(this.#listModel.state.selectedItems, (item) => !isSameId(folderItemParentId(item), trashId))
			return itemNotInTrash == null
		}
		return false
	}

	async moveToTrash(items: readonly FolderItem[]) {
		if (this.roots == null) {
			return
		}
		const trashId = this.roots.trash
		const itemsToTrash = items.filter((item) => !isSameId(folderItemParentId(item), trashId))
		await this.driveOperations.moveToTrash(itemsToTrash.map(folderItemToId))
		this.listModel.selectNone()
	}

	async deleteFromTrash(items: readonly (FileFolderItem | FolderFolderItem)[]) {
		await this.driveOperations.deleteFromTrash(items)
		this.#listModel.selectNone()
	}

	async restoreFromTrash(items: readonly FolderItem[]) {
		await this.driveOperations.restoreFromTrash(items)
		this.#listModel.selectNone()
	}

	cut(selectedItems: readonly FolderItem[]) {
		this.driveOperations.cut(selectedItems)
		this.listModel.selectNone()
	}

	copy(items: readonly FolderItem[]) {
		this.driveOperations.copy(items)
		this.listModel.selectNone()
	}

	async moveItems(items: readonly FolderItemId[], destinationId: IdTuple): Promise<void> {
		await this.driveOperations.moveItems(items, destinationId)
		this.#listModel.selectNone()
	}

	isDownloadPermitted(items: readonly FolderItem[]): items is FileFolderItem[] {
		return this.driveOperations.isDownloadPermitted(items)
	}

	async downloadFile(file: DriveFile): Promise<void> {
		this.driveOperations.downloadFile(file)
	}

	getCurrentColumnSortOrder(): Readonly<SortingPreference> {
		return this.sortingPreference
	}

	sort(column: SortColumn) {
		this.sortingPreference = toggleSort(this.sortingPreference, column)
		this.listModel.sort()
	}

	enterMultiselect() {
		this.#listModel.enterMultiselect()
	}

	goToDriveView() {
		this.router.routeTo(DRIVE_PREFIX, {})
	}

	operationUpdates() {
		return this.driveOperations.operationUpdates
	}

	onNewUrl(args: Record<string, any>, _requestedPath: string) {
		const restriction = getDriveRestriction(args)

		this.currentQuery = args.query ?? this.currentQuery
		const newQuery: SearchQuery = { query: this.currentQuery, restriction, maxResults: null }
		if (isNewSearch(this.searchResult, newQuery)) {
			this.searchResult?.dispose()
			this.#startDate = restriction.end ? new Date(restriction.end) : null
			this.#endDate = restriction.start ? new Date(restriction.start) : null
			const fileShips = this.logins.getUserController().getFileGroupMemberships()
			if (isNotEmpty(fileShips)) {
				const searchPromise = this.search.searchDrive(newQuery, getFirstOrThrow(fileShips).group).then((result) => {
					this.applyLiveSearchResults(result)
					return result
				})
				const listModel = this.createList(searchPromise)
				this.#listModel = listModel
				listModel.loadInitial()

				this.listStateSubscription?.end(true)
				this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state))
			}
		}
	}

	setDriveFileSizeFilter(filter: DriveSizeFilter) {
		this.#driveSizeFilter = filter
		this.applyDriveFilterIfNeeded()
	}

	private applyDriveFilterIfNeeded() {
		const filters = [this.getDriveFileTypeFilterForType(this.#driveFileTypeFiler), this.getDriveSizeFilterForType(this.#driveSizeFilter)]
		const filterFunction = (item: FolderItem) => {
			for (const filter of filters) {
				if (!filter(item)) {
					return false
				}
			}
			return true
		}
		const liftedFilter: ListFilter<FolderItem> | null = (driveItem) => filterFunction(driveItem)
		this.#listModel?.setFilter(liftedFilter)
	}

	getDriveSizeFilterForType(filter: DriveSizeFilter): ListFilter<FolderItem> {
		const _1MB = 1024 * 1024
		const _10MB = 1024 * 1024 * 10
		const _250MB = 1024 * 1024 * 250
		const _1000MB = 1024 * 1024 * 1024

		const isFileAndSizeBetween = (item: FolderItem, minBytes: number, maxBytes: number | null): boolean => {
			if (item.type !== "file") return false

			const size = filterInt(item.file.size)
			const minCondition = minBytes <= size
			const maxCondition = maxBytes ? size < maxBytes : true
			return minCondition && maxCondition
		}

		switch (filter) {
			case DriveSizeFilter.NoLimit:
				return () => true
			case DriveSizeFilter.Below1MB:
				return (driveItem) => isFileAndSizeBetween(driveItem, 0, _1MB)
			case DriveSizeFilter.Below10MB:
				return (driveItem) => isFileAndSizeBetween(driveItem, _1MB, _10MB)
			case DriveSizeFilter.Below250MB:
				return (driveItem) => isFileAndSizeBetween(driveItem, _10MB, _250MB)
			case DriveSizeFilter.Below1000MB:
				return (driveItem) => isFileAndSizeBetween(driveItem, _250MB, _1000MB)
			case DriveSizeFilter.Over1000MB:
				return (driveItem) => isFileAndSizeBetween(driveItem, _1000MB, null)
		}
	}

	getDriveFileTypeFilterForType(filter: FileType | null): ListFilter<FolderItem> {
		switch (filter) {
			case FileType.Audio:
				return (driveItem) => (driveItem.type === "file" ? getDisplayType(driveItem.file.mimeType).fileType === FileType.Audio : false)
			case FileType.Image:
				return (driveItem) => (driveItem.type === "file" ? getDisplayType(driveItem.file.mimeType).fileType === FileType.Image : false)
			case FileType.Video:
				return (driveItem) => (driveItem.type === "file" ? getDisplayType(driveItem.file.mimeType).fileType === FileType.Video : false)
			case FileType.Document:
				return (driveItem) => (driveItem.type === "file" ? getDisplayType(driveItem.file.mimeType).fileType === FileType.Document : false)
			case FileType.Generic:
				return (driveItem) => (driveItem.type === "file" ? getDisplayType(driveItem.file.mimeType).fileType === FileType.Generic : false)
			case null:
				return () => true
		}
	}
	setFileTypeFilter(fileType: FileType | null) {
		this.#driveFileTypeFiler = fileType
		this.applyDriveFilterIfNeeded()
	}
	private applyLiveSearchResults(result: LiveSearchResult<FolderItem>) {
		this.searchResult = result
		// LiveSearchResult#dispose() will end the stream
		result.updates.map((update) => {
			switch (update.type) {
				case "deleteitem":
					this.listModel.deleteLoadedItem(elementIdPart(folderItemId(update.item)))
					break
				case "updateitem":
					this.listModel.updateLoadedItem(update.item)
					break
			}
		})
	}

	private createList(deferredResult: Promise<LiveSearchResult<FolderItem>>): ListModel<FolderItem, Id> {
		// the list is recreated every time a new search is performed, but not when the current result is extended
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent

		return new ListModel<FolderItem, Id>({
			fetch: async (lastFetchedEntity: FolderItem | null, count: number) => {
				let result
				try {
					result = await deferredResult
				} catch (e) {
					if (e instanceof CancelledError) {
						return { items: [], complete: true }
					} else {
						throw e
					}
				}
				let newItems
				if (isNotNull(lastFetchedEntity)) {
					newItems = await result.loadMoreResults(count)
				} else {
					newItems = result.items
				}
				const complete = !result.hasMoreResults
				return { items: newItems, complete }
			},
			getItemId(item: FolderItem): Id {
				return elementIdPart(folderItemId(item))
			},
			isSameId(id1, id2): boolean {
				return isSameSingleId(id1, id2)
			},
			sortCompare: (o1: FolderItem, o2: FolderItem) => {
				return this.comparisonFunction()(o1, o2)
			},
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
	}

	private readonly debouncedUpdateSearchUrl = debounce(200, (cb) => {
		this.updateSearchUrl()
		cb()
	})

	private updateSearchUrl() {
		const selectedElement = this.#listModel.state.selectedItems.size === 1 ? this.#listModel.getSelectedAsArray().at(0) : null
		this.searchRouter.routeTo(
			this.currentQuery,
			createDriveRestriction({
				start: this.endDate ? getEndOfDay(this.endDate).getTime() : null,
				end: this.startDate ? getStartOfDay(this.startDate).getTime() : null,
			}),
			selectedElement ? elementIdPart(folderItemId(selectedElement)) : null,
		)
	}

	private searchAgain() {
		this.updateSearchUrl()
		this.updateUi()
	}

	private onListStateChange(_state: ListState<FolderItem>) {
		this.updateUi()
	}

	private readonly comparisonFunction: () => ComparisonFunction = memoizedWithHiddenArgument(
		() => this.sortingPreference,
		() => comparisonFunction(this.sortingPreference.column, this.sortingPreference.order),
	)
	navigateToFolder(folderId: IdTuple) {
		this.router.routeTo("/drive/:folderListId/:folderElementId", {
			folderListId: listIdPart(folderId),
			folderElementId: elementIdPart(folderId),
		})
	}
	async openFile(file: DriveFile): Promise<void> {
		await this.driveOperations.openFile(file)
	}

	rename(item: FolderItem, newName: string) {
		this.driveOperations.rename(item, newName)
	}

	get selectionEvents(): ListItemSelectionCallbacks<FolderItem> {
		return listItemSelectionCallbacksFor(this.listModel)
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

	dispose() {
		this.listStateSubscription?.end(true)
		this.listStateSubscription = null
		this.searchResult?.dispose()
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
		files: FileReference[] | WebFile[],
		showDuplicateFilesChoiceDialog: (fileName: string, fileCount: number) => Promise<DuplicateFilesDialogDecision>,
		folders?: readonly DiskFolder<WebFile | FileReference>[],
	) {
		if (this.roots == null) {
			console.log("drive is not initialized")
			return
		}
		const targetFolderId: IdTuple = this.roots?.root
		await this.listModel.waitLoad()
		const uploading = await this.driveOperations.uploadFiles(files, targetFolderId, showDuplicateFilesChoiceDialog, folders)
		if (uploading) {
			this.ensureWindowCloseListener()
		}
	}
}
