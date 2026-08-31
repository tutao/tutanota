import { ListFilter, ListModel } from "../../../common/misc/ListModel"
import Id from "../../../../ui/translations/id"
import { Mail, MailSet } from "@tutao/entities/tutanota"
import { ConversationViewModel, ConversationViewModelFactory } from "../../mail/view/ConversationViewModel"
import { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import Stream from "mithril/stream"
import { SearchCategoryType, SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import {
	assertNotNull,
	DateProvider,
	debounce,
	getEndOfDay,
	getStartOfDay,
	isEmpty,
	isNotNull,
	isSameDayOfDate,
	memoizedWithHiddenArgument,
	onceAsync,
} from "@tutao/utils"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { CancelledError, FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "@tutao/app-env"
import { elementIdToId, getElementId, isSameIdTuple, isSameSingleId } from "@tutao/meta"
import { MailSetKind } from "../../../../entities/tutanota/Utils"
import {
	createMailRestriction,
	getFreeSearchStartDate,
	getMailRestriction,
	isIncompleteMailResult,
	isNonBlockingSearchAvailable,
	isSameSearchRestriction,
	isSameSearchWithExtendedRange,
	mailSearchComparator,
} from "../model/MailSearchUtils"
import { SearchRouter } from "../../../common/search/view/SearchRouter"
import { MailModel } from "../../mail/model/MailModel"
import { ListLoadingState, ListState } from "../../../../ui/base/List"
import { Indexer } from "../../workerUtils/index/Indexer"
import { LoginController } from "../../../common/api/main/LoginController"
import { isMailDeletable } from "../../mail/model/MailChecks"
import { isPermanentDeleteAllowedForFolder } from "../../mail/MailUtils"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { getMailFilterForType, MailFilterType } from "../../mail/view/MailViewerUtils"
import { MailOpenedListener } from "../../mail/view/MailViewModel"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"
import {
	createEmptyRestriction,
	emptyListModel,
	getSearchUrl,
	isNewSearch,
	LiveSearchResult,
	PaidFunctionResult,
	SearchQuery,
	searchResultQuery,
} from "../../../common/search/SearchUtils"
import { ListFetchResult, onlySingleSelection } from "../../../../ui/base/ListUtils"
import { MailSearchModel } from "../model/MailSearchModel"
import { ClientDetector } from "../../../../platform-kit/app-env/boot/ClientDetector"
import { isDriveEnabled } from "../../../common/misc/DriveUtils"

const SEARCH_PAGE_SIZE = 100
export class MailSearchViewModel {
	#listModel: ListModel<Mail, Id> = emptyListModel()
	#selectedMailField: string | null = null
	#conversationViewModel: ConversationViewModel | null = null
	get selectedMailField(): string | null {
		return this.#selectedMailField
	}
	get listModel(): ListModel<Mail, Id> {
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
	#startDate: Date | null = null // null = aimed mail index date. this allows us to start the search (and the url) without end date set
	get startDate(): Date | null {
		return this.#startDate ?? this.getAimedMailIndexDate()
	}
	#endDate: Date | null = null
	get endDate(): Date {
		if (this.#endDate) {
			return this.#endDate
		} else {
			return new Date(this.dateProvider.now())
		}
	}
	private loadingAllForSearchResult: LiveSearchResult<Mail> | null = null
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
		private readonly search: MailSearchModel,
		private readonly mailboxModel: MailboxModel,
		private readonly mailModel: MailModel,
		private readonly logins: LoginController,
		private readonly indexerFacade: Indexer,
		private readonly selectionBehavior: ListAutoSelectBehavior,
		private readonly conversationViewModelFactory: ConversationViewModelFactory | null,
		private readonly mailOpenedListener: MailOpenedListener | null,
		private readonly dateProvider: DateProvider,
		private readonly updateUi: () => unknown,
	) {}

	readonly init = onceAsync(async () => {
		this.indexStateSubscription = this.search.indexState.map((newState) => {
			this.onMailIndexStateChanged(newState)
			this.updateUi()
		})
		this.mailboxSubscription = this.mailboxModel.mailboxDetails.map((mailboxes) => {
			this.onMailboxesChanged(mailboxes)
		})
	})

	isFreeAccount(): boolean {
		return this.logins.getUserController().isFreeAccount()
	}

	isDriveEnabled(): boolean {
		return isDriveEnabled(this.logins)
	}

	getSelectedMails(): readonly Mail[] {
		return this.#listModel.getSelectedAsArray()
	}

	getCurrentQuery(): string {
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
			createMailRestriction({
				start: this.endDate ? getEndOfDay(this.endDate).getTime() : null,
				end: this.startDate ? getStartOfDay(this.startDate).getTime() : null,
				field: this.#selectedMailField,
				folderIds: this.#selectedMailFolder,
			}),
			selectedElement ? getElementId(selectedElement) : null,
		)
	}

	onNewUrl(args: Record<string, any>, _requestedPath: string) {
		const restriction = getMailRestriction(args, this.logins.getUserController().isFreeAccount())

		this.currentQuery = args.query ?? this.currentQuery
		const newQuery: SearchQuery = { query: this.currentQuery, restriction, maxResults: SEARCH_PAGE_SIZE }

		if (
			this.searchResult &&
			isNonBlockingSearchAvailable() &&
			restriction.end &&
			isSameSearchWithExtendedRange(searchResultQuery(this.searchResult.searchResult), newQuery)
		) {
			this.searchResult?.extendResults(restriction.end)
		} else if (isNewSearch(this.searchResult, newQuery)) {
			this.performNewSearch(newQuery)
			this.loadAndSelectIfNeeded(args.id)
		}
	}

	private performNewSearch(newQuery: SearchQuery) {
		const { restriction } = newQuery
		this.searchResult?.dispose()
		this.#selectedMailField = restriction.field
		this.#startDate = restriction.end ? new Date(restriction.end) : null
		this.#endDate = restriction.start ? new Date(restriction.start) : null
		this.#selectedMailFolder = restriction.folderIds

		const searchPromise = this.search.searchMails(newQuery).then((result) => {
			this.applyLiveSearchResults(result)
			return result
		})

		const listModel = this.createList(searchPromise)
		this.#listModel = listModel
		this.applyMailFilterIfNeeded()
		listModel.loadInitial()

		this.listStateSubscription?.end(true)
		this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state))
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
		const liftedFilter: ListFilter<Mail> | null = (mail) => filterFunction(mail)
		this.#listModel?.setFilter(liftedFilter)
	}

	private loadAndSelectIfNeeded(id: string | null, finder?: (a: Mail) => boolean) {
		// nothing to select
		if (id == null) {
			return
		}

		if (!this.#listModel.isItemSelected(id)) {
			this.handleLoadAndSelection(id, finder)
		}
	}

	private handleLoadAndSelection(id: string, finder: ((a: Mail) => boolean) | undefined) {
		const listModel = this.#listModel
		let iterations = 0
		this.#listModel.loadAndSelect(finder ?? ((item) => isSameSingleId(getElementId(item), id)), () => listModel !== this.#listModel || iterations++ > 10)
	}

	private createList(deferredResult: Promise<LiveSearchResult<Mail>>): ListModel<Mail, Id> {
		// the list is recreated every time a new search is performed, but not when the current result is extended
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent

		return new ListModel<Mail, Id>({
			fetch: async (lastFetchedEntity: Mail | null | undefined, count: number) => {
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
				return { items: newItems, complete } satisfies ListFetchResult<Mail>
			},
			getItemId(item: Mail): Id {
				return getElementId(item)
			},
			isSameId(id1, id2): boolean {
				return isSameSingleId(id1, id2)
			},
			sortCompare: (o1: Mail, o2: Mail) => {
				return mailSearchComparator(o1, o2)
			},
			autoSelectBehavior: () => this.selectionBehavior,
		})
	}

	private onListStateChange(newState: ListState<Mail>) {
		if (!newState.inMultiselect && newState.selectedItems.size === 1) {
			const mail = this.getSelectedMails()[0]

			// Sometimes a stale state is passed through, resulting in no mail
			if (mail) {
				// displayed conversation has changed
				if (!this.#conversationViewModel || !isSameIdTuple(this.#conversationViewModel.primaryMail._id, mail._id)) {
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
		return !this.isFreeAccount()
	}
	private searchAgain() {
		this.updateSearchUrl()
		this.updateUi()
	}

	selectStartDate(startDate: Date | null): PaidFunctionResult {
		const canSelectStartDate = this.canSelectTimePeriod()

		const targetStartDate = canSelectStartDate ? startDate : getFreeSearchStartDate()
		const isSameDay = isSameDayOfDate(this.startDate, targetStartDate)
		this.#startDate = targetStartDate

		// extend mail index when searching mails and start date is outside the indexed range
		const indexState = this.search.indexState()
		if (
			indexState.currentMailIndexTimestamp !== FULL_INDEXED_TIMESTAMP &&
			(targetStartDate == null || targetStartDate.getTime() < indexState.currentMailIndexTimestamp)
		) {
			if (this.listModel.state.loadingStatus === ListLoadingState.Done) {
				// set list state to Idle so an empty row at the end of the list is shown where the progress indicator will be rendered
				this.listModel.updateLoadingStatus(ListLoadingState.Idle)
			}

			// for non-blocking search, the current search result will be extended as the range extends.
			// for full-archive-download search, once indexing is done, the list will reload automatically if empty and
			// by user action if not.
			void this.indexerFacade.extendMailIndex(targetStartDate?.getTime() ?? FULL_INDEXED_TIMESTAMP)
		} else if (!isSameDay) {
			this.searchAgain()
		}

		return canSelectStartDate ? PaidFunctionResult.Success : PaidFunctionResult.PaidSubscriptionNeeded
	}

	extendMailIndex(time: number): Promise<void> {
		return this.indexerFacade.extendMailIndex(time)
	}

	cancelMailIndexing() {
		this.indexerFacade.cancelMailIndexing()
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
		return this.mailModel.isExportingMailsAllowed() && !ClientDetector.get().isMobileDevice()
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

	loadingAll(): "loading" | "can_load" | "none" {
		return this.loadingAllForSearchResult != null ? "loading" : this.listModel.isLoadedCompletely() || this.isIndexingMails() ? "none" : "can_load"
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
		const isIndexingDoneOrCanceled = newState.progress === 0 && newState.error == null

		const currentResult = this.searchResult
		if (isNonBlockingSearchAvailable()) {
			// Free users are not permitted to search beyond a certain date; avoid searching beyond this date if the index
			// extended beyond it
			const dateLimit = this.canSelectTimePeriod()
				? newState.currentMailIndexTimestamp
				: Math.max(newState.currentMailIndexTimestamp, getFreeSearchStartDate().getTime())
			if (
				isIndexingDoneOrCanceled &&
				newState.currentMailIndexTimestamp !== FULL_INDEXED_TIMESTAMP &&
				(this.#startDate == null || this.#startDate.getTime() < newState.currentMailIndexTimestamp)
			) {
				// Indexing was cancelled and _startDate is outside the index range
				this.#startDate = newState.currentMailIndexTimestamp === NOTHING_INDEXED_TIMESTAMP ? getEndOfDay(new Date()) : new Date(dateLimit)
			}

			const isCurrentResultComplete =
				currentResult == null || (this.#startDate != null && this.#startDate.getTime() > currentResult.searchResult.currentIndexTimestamp)

			// only extend result when index is extended and result isn't already complete
			if (!isCurrentResultComplete && currentResult.searchResult.currentIndexTimestamp > newState.currentMailIndexTimestamp) {
				currentResult.extendResults(newState.currentMailIndexTimestamp)
			}
		} else if (isIndexingDoneOrCanceled && currentResult && isEmpty(currentResult.items) && !currentResult.hasMoreResults) {
			// Indexing is done or cancelled and list is empty, run another search
			this.performNewSearch(searchResultQuery(currentResult.searchResult))
		}
	}

	private async onMailboxesChanged(mailboxes: MailboxDetail[]) {
		this.#mailboxes = mailboxes

		// if selected folder no longer exist select another one
		const selectedMailFolder = this.#selectedMailFolder

		if (selectedMailFolder[0]) {
			const mailFolder = await this.mailModel.getMailSetById(selectedMailFolder[0])
			if (!mailFolder) {
				const folderSystem = assertNotNull(this.mailModel.getFolderSystemByGroupId(elementIdToId(mailboxes[0].mailGroup._id)))
				this.#selectedMailFolder = [getElementId(assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX)))]
				this.updateUi()
			}
		}
	}

	isIncompleteMailList(): boolean {
		const currentResult = this.searchResult?.searchResult
		return currentResult != null && isIncompleteMailResult(currentResult, this.search.indexState().currentMailIndexTimestamp)
	}

	searchAgainAndRecreateList(): void {
		const searchResult = this.searchResult?.searchResult
		if (searchResult) {
			this.performNewSearch(searchResultQuery(searchResult))
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
		// LiveSearchResult#dispose() will end the stream
		result.updates.map((update) => {
			switch (update.type) {
				case "deleteitem":
					this.listModel.deleteLoadedItem(getElementId(update.item))
					break
				case "updateitem":
					this.listModel.updateLoadedItem(update.item)
					break
				case "reset": {
					const selectedItem = onlySingleSelection(this.listModel.state)
					this.listModel.reload()
					if (selectedItem) {
						this.loadAndSelectIfNeeded(getElementId(selectedItem))
					}
				}
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

	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}

	public checkDates(startDate: Date | null, endDate: Date | null): "extendIndex" | "startafterend" | null {
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

		this.#endDate = endDate

		this.searchAgain()

		return PaidFunctionResult.Success
	}
	selectMailFolder(folder: Array<string>): PaidFunctionResult {
		if (this.isFreeAccount() && folder != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this.#selectedMailFolder = folder
			this.searchAgain()
			return PaidFunctionResult.Success
		}
	}

	selectMailField(field: string | null): PaidFunctionResult {
		if (this.isFreeAccount() && field != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this.#selectedMailField = field
			this.searchAgain()
			return PaidFunctionResult.Success
		}
	}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createEmptyRestriction(category))
	}
}
