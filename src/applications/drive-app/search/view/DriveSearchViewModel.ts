import { ListModel } from "../../../common/misc/ListModel"
import Id from "../../../../ui/translations/id"
import { emptyListModel } from "../../../common/search/SearchUtils"
import { SearchCategoryType, SearchRestriction } from "../../../common/api/worker/search/SearchTypes"
import { createRestriction, getRestriction, getSearchUrl, searchQueryEquals } from "../../../mail-app/search/model/SearchUtils"
import {
	assertNotNull,
	DateProvider,
	debounce,
	filterInt,
	findBy,
	getEndOfDay,
	getFirstOrThrow,
	getStartOfDay,
	isNotEmpty,
	isNotNull,
	noOp,
} from "@tutao/utils"
import { SearchRouter } from "../../../common/search/view/SearchRouter"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"
import { LoginController } from "../../../common/api/main/LoginController"
import {
	DriveOperationType,
	FileFolderItem,
	FolderFolderItem,
	FolderItem,
	folderItemEntity,
	folderItemid,
	FolderItemId,
	folderItemParent,
	folderItemToId,
	itemsIntoIds,
	moveItems,
	OperationUpdate,
	RunningOperation,
	toFolderItem,
} from "../../drive/view/DriveUtils"
import { DriveTransferController, DriveTransfers } from "../../drive/view/DriveTransferController"
import { TransferId } from "../../../../entities/drive/Utils"
import { elementIdPart, getElementId, isSameId } from "@tutao/meta"
import { DriveFacade, DriveRootFolders } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { CancelledError, OperationStatus } from "@tutao/app-env"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { MoveCycleError } from "../../../common/api/common/error/MoveCycleError"
import { UserError } from "../../../common/api/main/UserError"
import { MoveToTrashError } from "../../../common/api/common/error/MoveToTrashError"
import { MoveDestinationIsSourceError } from "../../../common/api/common/error/MoveDestinationIsSourceError"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { DriveFile } from "@tutao/entities/drive"
import { SortColumn, SortingPreference } from "../../drive/view/DriveViewModel"
import { Router } from "../../../../ui/ScopedThrottledRouter"
import { DRIVE_PREFIX } from "../../../../ui/utils/RouteChange"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { handleRestError } from "@tutao/rest-client/error"
import { EventController } from "../../../common/api/main/EventController"
import { DriveSearchModel, DriveSearchResult } from "../model/DriveSearchModel"
import { LiveSearchResult, SearchQuery } from "../../../common/search/CommonSearchModel"
import { ListState } from "../../../../ui/base/List"

const SEARCH_PAGE_SIZE = 100
export class DriveSearchViewModel {
	#listModel: ListModel<FolderItem, Id> = emptyListModel()
	#startDate: Date | null = null
	get startDate(): Date | null {
		return this.#startDate ?? new Date()
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
	private searchResult: LiveSearchResult<DriveSearchResult> | null = null
	private sortingPreference: Readonly<SortingPreference> = { order: "asc", column: SortColumn.name }
	private currentQuery: string = ""
	private operationUpdates: Stream<OperationUpdate | null> = stream(null)
	private readonly runningOperations: Map<Id, RunningOperation> = new Map()
	private readonly listStateSubscription: Stream<unknown> | null = null

	roots: DriveRootFolders | null = null
	constructor(
		private readonly searchRouter: SearchRouter,
		private readonly search: DriveSearchModel,
		private readonly router: Router,
		private readonly dateProvider: DateProvider,
		private readonly logins: LoginController,
		private readonly transferController: DriveTransferController,
		private readonly driveFacade: DriveFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly updateUi: () => unknown,
	) {}

	readonly init = async () => {
		if (this.roots) {
			return
		}
		this.roots = await this.driveFacade.loadRootFolders("withNetwork")
		this.eventController.addOperationStatusUpdateListener(async (update) => {
			const op = this.runningOperations.get(update.operationId)
			if (op != null) {
				let error: Error | null
				if (update.status === OperationStatus.FAILURE) {
					error = handleRestError(filterInt(assertNotNull(update.statusCode)), undefined, undefined, update.reason)
				} else {
					error = null
				}

				this.operationUpdates({
					type: op.type,
					count: op.count,
					status: update.status as OperationStatus,
					error,
				})
				if (update.status === OperationStatus.SUCCESS || update.status === OperationStatus.FAILURE) {
					this.runningOperations.delete(update.operationId)
				}
			}
		})
	}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null))
	}

	getCurrentQuery() {
		return this.currentQuery
	}

	onSearchQueryUpdated(text: string) {
		this.currentQuery = text
		this.#delayingSearch = true
		this.debouncedUpdateSearchUrl(() => {
			this.#delayingSearch = false
		})
	}

	getStartOfTheWeekOffset() {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}

	public checkDates(startDate: Date | null, endDate: Date | null): "long" | "extendIndex" | "startafterend" | null {
		if (startDate && endDate) {
			if (startDate.getTime() > endDate.getTime()) {
				return "startafterend"
			}
		}
		return null
	}

	selectStartDate(startDate: Date | null): void {
		this.#startDate = startDate
	}

	selectEndDate(endDate: Date) {
		this.#endDate = endDate
	}

	listState() {
		return this.#listModel.state
	}

	transfers(): DriveTransfers {
		return this.transferController.state
	}
	cancelTransfer(transferId: TransferId) {
		this.transferController.cancelTransfer(transferId)
	}
	flushTransfers() {
		this.transferController.flush()
	}
	anySelectedItemInTrash(): boolean {
		for (const item of this.listModel.state.selectedItems) {
			if (this.roots !== null) {
				if (isSameId(folderItemParent(item), this.roots.trash)) {
					return true
				}
			}
		}
		return false
	}
	allItemsInTrash(): boolean {
		if (this.roots != null) {
			const trashId = this.roots.trash
			const itemNotInTrash = findBy(this.#listModel.state.selectedItems, (item) => !isSameId(folderItemParent(item), trashId))
			return itemNotInTrash == null
		}
		return false
	}

	async moveToTrash(items: readonly FolderItemId[]) {
		const { fileIds, folderIds } = itemsIntoIds(items)
		try {
			await this.driveFacade.moveToTrash(fileIds, folderIds)
			this.operationUpdates({
				type: DriveOperationType.Trash,
				count: items.length,
				status: OperationStatus.SUCCESS,
				error: null,
			})
		} catch (e) {
			this.operationUpdates({
				type: DriveOperationType.Trash,
				count: items.length,
				status: OperationStatus.FAILURE,
				error: e,
			})
		}
		this.listModel.selectNone()
	}

	async deleteFromTrash(items: (FileFolderItem | FolderFolderItem)[]) {
		const operationId = await this.driveFacade.deleteFromTrash(items.map(folderItemEntity))
		this.runningOperations.set(operationId, { type: DriveOperationType.Delete, count: items.length })
		this.#listModel.selectNone()
	}

	async restoreFromTrash(items: readonly FolderItem[]) {
		const { fileIds, folderIds } = itemsIntoIds(items.map(folderItemToId))
		try {
			await this.driveFacade.restoreFromTrash(fileIds, folderIds)
			this.operationUpdates({
				type: DriveOperationType.Restore,
				count: items.length,
				status: OperationStatus.SUCCESS,
				error: null,
			})
		} catch (e) {
			this.operationUpdates({
				type: DriveOperationType.Restore,
				count: items.length,
				status: OperationStatus.FAILURE,
				error: e,
			})
		}
		this.#listModel.selectNone()
	}

	cut(selectedItems: (FileFolderItem | FolderFolderItem)[]) {
		return undefined
	}

	async moveItems(items: readonly FolderItemId[], destinationId: IdTuple) {
		try {
			await moveItems(this.entityClient, this.driveFacade, items, destinationId)
			this.operationUpdates({
				type: DriveOperationType.Move,
				count: items.length,
				status: OperationStatus.SUCCESS,
				error: null,
			})
		} catch (e) {
			if (e instanceof MoveCycleError) {
				throw new UserError("cannotMoveFolderIntoItself_msg")
			} else if (e instanceof MoveToTrashError) {
				throw new UserError("cannotMoveToTrash_msg")
			} else if (e instanceof MoveDestinationIsSourceError) {
				noOp()
			} else {
				this.operationUpdates({
					type: DriveOperationType.Move,
					count: items.length,
					status: OperationStatus.FAILURE,
					error: e,
				})
			}
		}
		this.#listModel.selectNone()
	}
	isDownloadPermitted(items: FolderItem[]): items is FileFolderItem[] {
		return !items.some((item) => item.type === "folder")
	}
	async downloadFile(file: DriveFile): Promise<void> {
		this.transferController.download(file, "download")
	}
	toggleSelectAll() {
		if (this.listModel.isSelectionEmpty()) {
			this.listModel.selectAll()
		} else {
			this.listModel.selectNone()
		}
	}

	selectNone() {
		this.#listModel.selectNone()
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

		this.listModel.sort()
	}

	enterMultiselect() {
		this.#listModel.enterMultiselect()
	}

	goToDriveView() {
		this.router.routeTo(DRIVE_PREFIX, {})
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		const query: string = args.query ?? ""
		let restriction: SearchRestriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			// if restriction is broken replace it with non-broken version
			this.searchRouter.routeTo(query, createRestriction(SearchCategoryType.drive, null, null, null, [], null))
			return
		}

		const lastQuery = this.currentQuery
		this.currentQuery = query

		// using hasOwnProperty to distinguish case when url is like '/search/mail/query='
		// If query is not set for some reason (e.g. switching search type), use the last query value
		const searchQuery = Object.hasOwn(args, "query") ? query : lastQuery

		const currentQuery: SearchQuery | null = this.searchResult
			? {
					query: this.searchResult.searchResult.query,
					restriction: this.searchResult.searchResult.restriction,
					maxResults: this.searchResult.searchResult.maxResults ?? null,
				}
			: null
		const newQuery: SearchQuery = { query: searchQuery ?? "", restriction, maxResults: null }
		const isNewSearch = currentQuery ? !searchQueryEquals(currentQuery, newQuery) : true
		if (isNewSearch) {
			this.searchResult?.dispose()
			this.#startDate = restriction.end ? new Date(restriction.end) : null
			this.#endDate = restriction.start ? new Date(restriction.start) : null
			const fileShips = this.logins.getUserController().getFileGroupMemberships()
			if (isNotEmpty(fileShips)) {
				const searchPromise = this.search
					.coolNewSearchDrive(
						{
							query: searchQuery ?? "",
							restriction,
							maxResults: null,
						},
						getFirstOrThrow(fileShips).group,
						() => 0, //FIXME
					)
					.then((result) => {
						this.applyLiveSearchResults(result)
						return result
					})
				const listModel = this.createList(searchPromise)
				this.#listModel = listModel
				listModel.loadInitial()
				this.loadAndSelectIfNeeded(args.id)

				this.listStateSubscription?.end(true)
				this.listModel.stateStream.map((state) => this.onListStateChange(state))
			}
		}
	}
	private loadAndSelectIfNeeded(id: string | null, finder?: (a: FolderItem) => boolean) {
		// nothing to select
		if (id == null) {
			return
		}

		if (!this.#listModel.isItemSelected(id)) {
			if (!this.#listModel.isItemSelected(id)) {
				this.handleLoadAndSelection(id, finder)
			}
		}
	}
	private handleLoadAndSelection(id: string, finder: ((a: FolderItem) => boolean) | undefined) {
		const listModel = this.#listModel
		let iterations = 0
		this.#listModel.loadAndSelect(finder ?? ((item) => isSameId(folderItemid(item), id)), () => listModel !== this.#listModel || iterations++ > 10)
	}

	private applyLiveSearchResults(result: LiveSearchResult<DriveSearchResult>) {
		this.searchResult = result
		result.updates.map((update) => {
			switch (update.type) {
				case "deleteitem":
					this.listModel.deleteLoadedItem(getElementId(update.item.item))
					break
				case "updateitem":
					this.listModel.updateLoadedItem(toFolderItem(update.item.item))
					break
			}
		})
	}

	private createList(deferredResult: Promise<LiveSearchResult<DriveSearchResult>>): ListModel<FolderItem, Id> {
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
				return { items: newItems.map((entity) => toFolderItem(entity.item)), complete }
			},
			getItemId(item: FolderItem): Id {
				return elementIdPart(folderItemid(item))
			},
			isSameId(id1, id2): boolean {
				return isSameId(id1, id2)
			},
			sortCompare: (o1: FolderItem, o2: FolderItem) => {
				//FIXME
				return 0
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
			createRestriction(
				SearchCategoryType.drive,
				this.endDate ? getEndOfDay(this.endDate).getTime() : null,
				this.startDate ? getStartOfDay(this.startDate).getTime() : null,
				null,
				[],
				null,
			),
			selectedElement ? elementIdPart(folderItemid(selectedElement)) : null,
		)
	}

	private onListStateChange(_state: ListState<FolderItem>) {
		this.updateUi()
	}
}
