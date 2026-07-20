import { ListFilter, ListModel } from "../../../common/misc/ListModel"
import { SearchResultListEntry } from "./SearchListView"
import Id from "../../../../ui/translations/id"
import { emptyListModel, PaidFunctionResult, SearchableTypes } from "./SearchViewModel"
import { Mail, MailSet, MailTypeRef } from "@tutao/entities/tutanota"
import { ConversationViewModel, ConversationViewModelFactory } from "../../mail/view/ConversationViewModel"
import { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import Stream from "mithril/stream"
import { SearchCategoryType, SearchIndexStateInfo, SearchRestriction } from "../../../common/api/worker/search/SearchTypes"
import { LiveSearchResult, SearchModel, SearchQuery } from "../model/SearchModel"
import { assertNotNull, debounce, getEndOfDay, getStartOfDay, isNotNull, isSameDayOfDate, memoizedWithHiddenArgument, noOp, onceAsync } from "@tutao/utils"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { EventController } from "../../../common/api/main/EventController"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { CancelledError, FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "@tutao/app-env"
import { assertIsEntity2, elementIdPart, getElementId, isSameId, listIdPart } from "@tutao/meta"
import { MailSetKind } from "../../../../entities/tutanota/Utils"
import { createRestriction, getRestriction, getSearchUrl, isSameSearchRestriction, searchQueryEquals } from "../model/SearchUtils"
import { SearchRouter } from "../../../common/search/view/SearchRouter"
import { MailModel } from "../../mail/model/MailModel"
import { ListLoadingState, ListState } from "../../../../ui/base/List"
import { Indexer } from "../../workerUtils/index/Indexer"
import { LoginController } from "../../../common/api/main/LoginController"
import { isMailDeletable } from "../../mail/model/MailChecks"
import { isPermanentDeleteAllowedForFolder } from "../../mail/MailUtils"
import { client } from "../../../../platform-kit/app-env/boot/ClientDetector"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { getMailFilterForType, MailFilterType } from "../../mail/view/MailViewerUtils"
import { MailOpenedListener } from "../../mail/view/MailViewModel"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"

const SEARCH_PAGE_SIZE = 100
export class MailSearchViewModel {
	#listModel: ListModel<SearchResultListEntry, Id> = emptyListModel()
	#selectedMailField: string | null = null
	private latestMailRestriction: SearchRestriction | null = null
	#conversationViewModel: ConversationViewModel | null = null
	get selectedMailField(): string | null {
		return this.#selectedMailField
	}
	get listModel(): ListModel<SearchResultListEntry, Id> {
		return this.#listModel
	}

	#delayingSearch: boolean = false
	get busy(): boolean {
		return this.#delayingSearch
	}
	private mailFilterType: ReadonlySet<MailFilterType> = new Set()
	get conversationViewModel(): ConversationViewModel | null {
		return this.#conversationViewModel
	}
	private _startDate: Date | null = null // null = aimed mail index date. this allows us to start the search (and the url) without end date set
	get startDate(): Date | null {
		return this._startDate ?? this.getAimedMailIndexDate()
	}
	private _endDate: Date | null = null
	get endDate(): Date {
		if (this._endDate) {
			return this._endDate
		} else {
			// FIXME: date provider?
			return new Date()
		}
	}
	loadingAllForSearchResult: LiveSearchResult<Mail> | null = null
	private indexStateSubscription: Stream<unknown> | null = null
	private mailboxSubscription: Stream<void> | null = null
	#mailboxes: MailboxDetail[] = []
	get mailboxes(): readonly MailboxDetail[] {
		return this.#mailboxes
	}
	#selectedMailFolder: Id[] = []
	get selectedMailFolder(): Array<Id> {
		return this.#selectedMailFolder
	}
	private currentQuery: string = ""

	private listStateSubscription: Stream<unknown> | null = null
	private searchResult: LiveSearchResult<Mail> | null = null

	constructor(
		readonly router: SearchRouter,
		private readonly search: SearchModel,
		private readonly mailboxModel: MailboxModel,
		private readonly eventController: EventController,
		private readonly offlineStorageSettings: OfflineStorageSettingsModel | null = null,
		private readonly mailModel: MailModel,
		private readonly logins: LoginController,
		private readonly indexerFacade: Indexer,
		private readonly selectionBehavior: ListAutoSelectBehavior,
		private readonly conversationViewModelFactory: ConversationViewModelFactory | null,
		private readonly mailOpenedListener: MailOpenedListener | null,
		private readonly updateUi: () => unknown,
	) {}

	readonly init = onceAsync(async () => {
		this.indexStateSubscription = this.search.indexState.map((newState) => this.onMailIndexStateChanged(newState))
		this.mailboxSubscription = this.mailboxModel.mailboxDetails.map((mailboxes) => {
			this.onMailboxesChanged(mailboxes)
		})
		await this.offlineStorageSettings?.init()
	})

	readonly getSelectedMails: () => readonly Mail[] = memoizedWithHiddenArgument(
		() => this.#listModel.getSelectedAsArray(),
		(selected) => {
			return selected.map((e) => e.entry).filter(assertIsEntity2(MailTypeRef))
		},
	)

	getCurrenQuery() {
		return this.currentQuery
	}

	onSearchQueryUpdated(text: string) {
		this.currentQuery = text
		this.#delayingSearch = true
		this.debouncedUpdateSearchUrl(() => {
			this.#delayingSearch = false
		})
	}
	private readonly debouncedUpdateSearchUrl = debounce(200, (cb) => {
		this.updateSearchUrl()
		cb()
	})
	private updateSearchUrl() {
		const selectedElement = this.#listModel.state.selectedItems.size === 1 ? this.#listModel.getSelectedAsArray().at(0) : null
		this.router.routeTo(
			this.currentQuery,
			createRestriction(
				SearchCategoryType.mail,
				this._endDate ? getEndOfDay(this._endDate).getTime() : null,
				this._startDate ? getStartOfDay(this._startDate).getTime() : null,
				this.#selectedMailField,
				this.#selectedMailFolder,
				null,
			),
			selectedElement ? getElementId(selectedElement) : null,
		)
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		const query: string = args.query ?? ""
		let restriction: SearchRestriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			// if restriction is broken replace it with non-broken version
			this.router.routeTo(query, createRestriction(SearchCategoryType.mail, null, null, null, [], null))
			return
		}

		this.currentQuery = query
		const lastQuery = this.search.lastQueryString()
		const maxResults = SEARCH_PAGE_SIZE

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
		const newQuery: SearchQuery = { query: searchQuery ?? "", restriction, maxResults }
		const isNewSearch = currentQuery ? !searchQueryEquals(currentQuery, newQuery) : true
		if (isNewSearch) {
			this.searchResult?.dispose()
			this.#selectedMailField = restriction.field
			this._startDate = restriction.start ? new Date(restriction.start) : null
			this._endDate = restriction.end ? new Date(restriction.end) : null
			this.#selectedMailFolder = restriction.folderIds
			this.latestMailRestriction = restriction

			const searchPromise = this.search
				.coolNewSearchMails({
					query: searchQuery ?? "",
					restriction,
					maxResults,
				})
				.then((result) => {
					this.applyLiveSearchResults(result)
					return result
				})

			const listModel = this.createList(searchPromise, noOp, getElementId)
			this.#listModel = listModel
			this.applyMailFilterIfNeeded()
			listModel.loadInitial()
			this.loadAndSelectIfNeeded(args.id)

			this.listModel.stateStream.map((state) => this.onListStateChange(state))
		}
	}

	private applyMailFilterIfNeeded() {
		const filters = Array.from(this.mailFilterType).map(getMailFilterForType)
		const filterFunction = (item: Mail) => {
			for (const filter of filters) {
				if (!filter(item)) {
					return false
				}
			}
			return true
		}
		const liftedFilter: ListFilter<SearchResultListEntry> | null = (entry) => filterFunction(entry.entry as Mail)
		this.#listModel?.setFilter(liftedFilter)
	}

	private loadAndSelectIfNeeded(id: string | null, finder?: (a: SearchResultListEntry) => boolean) {
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

	private handleLoadAndSelection(id: string, finder: ((a: SearchResultListEntry) => boolean) | undefined) {
		const listModel = this.#listModel
		let iterations = 0
		this.#listModel.loadAndSelect(finder ?? ((item) => isSameId(getElementId(item), id)), () => listModel !== this.#listModel || iterations++ > 10)
	}

	private createList<T extends SearchableTypes>(
		deferredResult: Promise<LiveSearchResult<T>>,
		restartSearch: () => unknown,
		idExtractor: (entity: T) => Id,
	): ListModel<SearchResultListEntry, Id> {
		// the list is recreated every time a new search is performed, but not when the current result is extended
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent

		return new ListModel<SearchResultListEntry, Id>({
			fetch: async (lastFetchedEntity: SearchResultListEntry | null, count: number) => {
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
				const complete = !result.hasMoreResults && !this.isIndexingMails() && !this.isIndexingMailsFailed()
				return { items: newItems.map((entity) => new SearchResultListEntry(entity)), complete }
			},
			getItemId(item: SearchResultListEntry): Id {
				return idExtractor(item.entry as T)
			},
			isSameId(id1, id2): boolean {
				return isSameId(id1, id2)
			},
			sortCompare: (o1: SearchResultListEntry, o2: SearchResultListEntry) => {
				// FIXME maybe we actually need it when we insert new item
				return 0
			},
			autoSelectBehavior: () => this.selectionBehavior,
		})
	}

	private onListStateChange(newState: ListState<SearchResultListEntry>) {
		if (!newState.inMultiselect && newState.selectedItems.size === 1) {
			const mail = this.getSelectedMails()[0]

			// Sometimes a stale state is passed through, resulting in no mail
			if (mail) {
				// displayed conversation has changed
				if (
					!this.#conversationViewModel ||
					!isSameId(listIdPart(this.#conversationViewModel.primaryMail._id), listIdPart(mail._id)) ||
					!isSameId(elementIdPart(this.#conversationViewModel.primaryMail._id), elementIdPart(mail._id))
				) {
					this.updateDisplayedConversation(mail)
				}
			} else {
				this.#conversationViewModel = null
			}
		} else {
			this.#conversationViewModel = null
		}

		this.updateUi()
	}

	private updateDisplayedConversation(mail: Mail): void {
		if (this.conversationViewModelFactory && this.mailOpenedListener) {
			this.#conversationViewModel = this.conversationViewModelFactory({
				mail,
				showFolder: true,
				loadLatestMail: false,
				highlightedTokens: this.getHighlightedStrings(),
			})
			// Notify the admin client about the mail being selected
			this.mailOpenedListener.onEmailOpened(mail)
		}
	}

	//FIXME DO WE NEED THIS?
	sendStopLoadingSignal() {}

	getLabelsForMail(mail: Mail): MailSet[] {
		return this.mailModel.getLabelsForMail(mail)
	}

	getHighlightedStrings(): readonly SearchToken[] {
		return this.searchResult?.searchResult.tokens ?? []
	}

	getSearchIndexStateStream(): Stream<SearchIndexStateInfo> {
		return this.search.indexState
	}
	canSelectTimePeriod(): boolean {
		return !this.logins.getUserController().isFreeAccount()
	}
	private searchAgain() {
		this.updateSearchUrl()
		this.updateUi()
	}

	async selectStartDate(startDate: Date | null): Promise<PaidFunctionResult> {
		if (isSameDayOfDate(this.startDate, startDate)) {
			return PaidFunctionResult.Success
		}

		if (!this.canSelectTimePeriod()) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		}

		this._startDate = startDate

		// If start date is outside the indexed range, suggest to extend the index and only if confirmed change the selected date.
		// Otherwise, keep the date as it was.
		if (startDate && startDate.getTime() < this.search.indexState().currentMailIndexTimestamp) {
			if (this.listModel.state.loadingStatus === ListLoadingState.Done) {
				// set list state to Idle so an empty row at the end of the list is shown where the progress indicator will be rendered
				this.listModel.updateLoadingStatus(ListLoadingState.Idle)
			}

			// the current search result will be extended as the range extends
			void this.indexerFacade.extendMailIndex(startDate.getTime())

			let onIndexStateUpdate = (_: SearchIndexStateInfo) => {}
			// separate subscription to indexState so offline range is updated even when the user navigates away from search
			const dep = this.search.indexState.map((newState) => onIndexStateUpdate(newState))
			// when subscribing to a mithril stream, the callback is invoked immediately with the stream's current value,
			// but we only want this to be invoked once indexing starts
			onIndexStateUpdate = (newState) => {
				if (newState.progress === 0) {
					dep.end(true)
				}

				if (this.offlineStorageSettings?.available()) {
					const offlineRange = this.offlineStorageSettings.getTimeRange().getTime()
					const isIndexingDoneOrCancelled = newState.progress === 0 && newState.error == null

					// update offline storage range as index extends to not lose what's already indexed if the user logs
					// out before indexing is done.
					// Update offline range when indexing is cancelled to not continue indexing on next login
					if (offlineRange > newState.currentMailIndexTimestamp || isIndexingDoneOrCancelled) {
						this.offlineStorageSettings.setTimeRange(
							new Date(
								newState.currentMailIndexTimestamp !== FULL_INDEXED_TIMESTAMP
									? newState.currentMailIndexTimestamp
									: // aimedMailIndexTimestamp is set by the user and therefore might not be valid
										this.offlineStorageSettings.isValidDate(new Date(newState.aimedMailIndexTimestamp))
										? newState.aimedMailIndexTimestamp
										: FULL_INDEXED_TIMESTAMP,
							),
						)
					}
				}
			}
		} else {
			this.searchAgain()
		}

		return PaidFunctionResult.Success
	}
	getUserId(): string {
		return this.logins.getUserController().userId
	}

	readonly isPermanentDeleteAllowed: () => boolean = memoizedWithHiddenArgument(
		() => this.getSelectedMails(),
		(selectedMails) => {
			return selectedMails.every((mail) => {
				if (!isMailDeletable(mail)) {
					return false
				}

				const folder = this.mailModel.getMailFolderForMail(mail)
				return folder != null && isPermanentDeleteAllowedForFolder(folder)
			})
		},
	)

	isExportingMailsAllowed(): boolean {
		return this.mailModel.isExportingMailsAllowed() && !client.isMobileDevice()
	}

	async loadAll() {
		if (this.isIndexingMails()) return
		if (this.loadingAllForSearchResult != null) return

		const currentResult = this.searchResult
		this.loadingAllForSearchResult = currentResult ?? null
		this.#listModel.selectAll()
		try {
			while (
				currentResult?.searchResult.restriction &&
				this.loadingAllForSearchResult &&
				isSameSearchRestriction(currentResult.searchResult.restriction, this.loadingAllForSearchResult.searchResult.restriction) &&
				!this.#listModel.isLoadedCompletely()
			) {
				await this.#listModel.loadMore()
				if (
					currentResult.searchResult.restriction &&
					this.loadingAllForSearchResult.searchResult.restriction &&
					isSameSearchRestriction(currentResult.searchResult.restriction, this.loadingAllForSearchResult.searchResult.restriction)
				) {
					this.#listModel.selectAll()
				}
			}
		} finally {
			this.loadingAllForSearchResult = null
		}
	}

	stopLoadAll() {
		this.#listModel.cancelLoadAll()
	}

	isIndexingMails(): boolean {
		return this.search.indexState().progress > 0
	}

	isIndexingMailsFailed(): boolean {
		return this.search.indexState().failedIndexingUpTo != null
	}

	get mailFilter(): ReadonlySet<MailFilterType> {
		return this.mailFilterType
	}

	setMailFilter(filter: ReadonlySet<MailFilterType>) {
		this.mailFilterType = filter
		this.applyMailFilterIfNeeded()
	}

	private onMailIndexStateChanged(newState: SearchIndexStateInfo): void {
		if (
			newState.progress === 0 &&
			newState.error == null &&
			newState.currentMailIndexTimestamp !== FULL_INDEXED_TIMESTAMP &&
			(this._startDate == null || this._startDate.getTime() < newState.currentMailIndexTimestamp)
		) {
			// Indexing was cancelled and _startDate is outside the index range
			const newStartTimestamp =
				newState.currentMailIndexTimestamp === NOTHING_INDEXED_TIMESTAMP ? getEndOfDay(new Date()) : newState.currentMailIndexTimestamp
			this._startDate = new Date(newStartTimestamp)
		}

		const currentResult = this.search.result()
		const isCurrentResultComplete = currentResult == null || (this._startDate != null && this._startDate.getTime() > currentResult.currentIndexTimestamp)

		// only extend result when index is extended and result isn't already complete
		if (!isCurrentResultComplete && currentResult.currentIndexTimestamp > newState.currentMailIndexTimestamp) {
			void this.search.extendCurrentResult(newState.currentMailIndexTimestamp)
		}
	}

	private async onMailboxesChanged(mailboxes: MailboxDetail[]) {
		this.#mailboxes = mailboxes

		// if selected folder no longer exist select another one
		const selectedMailFolder = this.#selectedMailFolder

		if (selectedMailFolder[0]) {
			const mailFolder = await this.mailModel.getMailSetById(selectedMailFolder[0])
			if (!mailFolder) {
				const folderSystem = assertNotNull(this.mailModel.getFolderSystemByGroupId(mailboxes[0].mailGroup._id))
				this.#selectedMailFolder = [getElementId(assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX)))]
				this.updateUi()
			}
		}
	}
	dispose() {
		this.stopLoadAll()
		this.mailboxSubscription?.end(true)
		this.mailboxSubscription = null
		this.listStateSubscription?.end(true)
		this.listStateSubscription = null
		this.indexStateSubscription?.end(true)
		this.indexStateSubscription = null
		this.searchResult?.dispose()
	}

	private applyLiveSearchResults(result: LiveSearchResult<Mail>) {
		this.searchResult = result
		result.updates.map((update) => {
			switch (update.type) {
				case "deleteitem":
					this.listModel.deleteLoadedItem(getElementId(update.item))
					break
				case "updateitem":
					this.listModel.updateLoadedItem(new SearchResultListEntry(update.item))
					break
			}
		})
	}

	/**
	 * @returns null if the complete mailbox is indexed
	 */
	private getAimedMailIndexDate(): Date | null {
		const { currentMailIndexTimestamp, aimedMailIndexTimestamp } = this.search.indexState()
		// currentMailIndexTimestamp < aimedMailIndexTimestamp when fully indexed
		let timestamp = Math.min(aimedMailIndexTimestamp, currentMailIndexTimestamp)

		if (timestamp === FULL_INDEXED_TIMESTAMP) {
			return null
		} else if (timestamp === NOTHING_INDEXED_TIMESTAMP) {
			return getEndOfDay(new Date())
		} else {
			return new Date(timestamp)
		}
	}

	getStartOfTheWeekOffset() {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}
	public checkDates(startDate: Date | null, endDate: Date | null): "long" | "extendIndex" | "startafterend" | null {
		if (startDate && endDate) {
			if (startDate.getTime() > endDate.getTime()) {
				return "startafterend"
			}
			// extending index only applies to mails
			const currentIndex = this.getAimedMailIndexDate()
			if (currentIndex && startDate < currentIndex) {
				return "extendIndex"
			}
		}
		return null
	}

	selectEndDate(endDate: Date): PaidFunctionResult {
		if (isSameDayOfDate(this.endDate, endDate)) {
			return PaidFunctionResult.Success
		}

		if (!this.canSelectTimePeriod()) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		}

		this._endDate = endDate

		this.searchAgain()

		return PaidFunctionResult.Success
	}
	selectMailFolder(folder: Array<string>): PaidFunctionResult {
		if (this.logins.getUserController().isFreeAccount() && folder != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this.#selectedMailFolder = folder
			this.searchAgain()
			return PaidFunctionResult.Success
		}
	}

	selectMailField(field: string | null): PaidFunctionResult {
		if (this.logins.getUserController().isFreeAccount() && field != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this.#selectedMailField = field
			this.searchAgain()
			return PaidFunctionResult.Success
		}
	}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null))
	}
}
