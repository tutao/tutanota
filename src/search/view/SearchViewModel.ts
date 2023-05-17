import { ListFilter, ListModel } from "../../misc/ListModel.js"
import { SearchResultListEntry } from "./SearchListView.js"
import { SearchResult } from "../../api/worker/search/SearchTypes.js"
import { EntityEventsListener, EntityUpdateData, EventController, isUpdateForTypeRef } from "../../api/main/EventController.js"
import { Contact, ContactTypeRef, Mail, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { ListElementEntity, SomeEntity } from "../../api/common/EntityTypes.js"
import { FULL_INDEXED_TIMESTAMP, MailFolderType, NOTHING_INDEXED_TIMESTAMP, OperationType } from "../../api/common/TutanotaConstants.js"
import {
	assertIsEntity2,
	elementIdPart,
	GENERATED_MAX_ID,
	getElementId,
	isSameId,
	listIdPart,
	sortCompareByReverseId,
} from "../../api/common/utils/EntityUtils.js"
import m from "mithril"
import { ListState } from "../../gui/base/NewList.js"
import {
	assertNotNull,
	defer,
	getEndOfDay,
	getStartOfDay,
	groupBy,
	isSameDay,
	isSameTypeRef,
	isToday,
	lazyMemoized,
	neverNull,
	ofClass,
	TypeRef,
} from "@tutao/tutanota-utils"
import { areResultsForTheSameQuery, hasMoreResults, isSameSearchRestriction, SearchModel } from "../model/SearchModel.js"
import { NotFoundError } from "../../api/common/error/RestError.js"
import { compareContacts } from "../../contacts/view/ContactGuiUtils.js"
import { ConversationViewModel, ConversationViewModelFactory } from "../../mail/view/ConversationViewModel.js"
import { isDesktop } from "../../api/common/Env.js"
import { createRestriction, getRestriction, searchCategoryForRestriction } from "../model/SearchUtils.js"
import Stream from "mithril/stream"
import { MailboxDetail, MailModel } from "../../mail/model/MailModel.js"
import { getStartOfTheWeekOffsetForUser } from "../../calendar/date/CalendarUtils.js"
import { SearchFacade } from "../../api/worker/search/SearchFacade.js"
import { LoginController } from "../../api/main/LoginController.js"
import { Indexer } from "../../api/worker/search/Indexer.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { getMailFilterForType, MailFilterType } from "../../mail/model/MailUtils.js"
import { isSameTypeRefNullable } from "@tutao/tutanota-utils/dist/TypeRef.js"
import { SearchRouter } from "./SearchRouter.js"
import { MailOpenedListener } from "../../mail/view/MailViewModel.js"

const SEARCH_PAGE_SIZE = 100

export type SearchableTypes = Mail | Contact

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

export type ConfirmCallback = () => Promise<boolean>

export class SearchViewModel {
	listModel: ListModel<SearchResultListEntry>

	// Contains load more results even when searchModel doesn't.
	// Load more should probably be moved to the model to update it's result stream.
	_searchResult: SearchResult | null = null
	private _mailFilterType: MailFilterType | null = null

	get lastType(): TypeRef<Mail> | TypeRef<Contact> | null {
		return this._searchResult?.restriction.type ?? null
	}

	conversationViewModel: ConversationViewModel | null = null
	startDate: Date | null = null // null = current mail index date. this allows us to start the search (and the url) without end date set
	endDate: Date | null = null // null = today
	selectedMailFolder: Id | null = null
	mailboxes: MailboxDetail[] = []
	selectedMailField: string | null = null
	private mailboxSubscription: Stream<void> | null = null
	private resultSubscription: Stream<void> | null = null
	private listStateSubscription: Stream<unknown> | null = null
	loadingAllForSearchResult: SearchResult | null = null

	constructor(
		private readonly router: SearchRouter,
		private readonly search: SearchModel,
		private readonly searchFacade: SearchFacade,
		private readonly mailModel: MailModel,
		private readonly logins: LoginController,
		private readonly indexerFacade: Indexer,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly mailOpenedListener: MailOpenedListener,
		private readonly conversationViewModelFactory: ConversationViewModelFactory,
		private readonly updateUi: () => unknown,
	) {
		this.listModel = this.createList()
	}

	readonly init = lazyMemoized(() => {
		this.resultSubscription = this.search.result.map((result) => {
			if (!result || !isSameTypeRef(result.restriction.type, MailTypeRef)) {
				this._mailFilterType = null
			}

			if (this._searchResult == null || result == null || !areResultsForTheSameQuery(result, this._searchResult)) {
				this.listModel.cancelLoadAll()

				this._searchResult = result

				this.listModel = this.createList()
				this.setMailFilter(this._mailFilterType)
				this.applyMailFilterIfNeeded()
				this.listModel.loadInitial()
				this.listStateSubscription?.end(true)
				this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state))
			}
		})

		this.mailboxSubscription = this.mailModel.mailboxDetails.map((mailboxes) => this.onMailboxesChanged(mailboxes))
		this.eventController.addEntityListener(this.entityEventsListener)
	})

	private readonly entityEventsListener: EntityEventsListener = async (updates) => {
		for (const update of updates) {
			await this.entityEventReceived(update)
		}
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		let restriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			// if restriction is broken replace it with non-broken version
			this.router.routeTo(args.query, createRestriction("mail", null, null, null, null))
			return
		}

		const lastQuery = this.search.lastQuery()
		const maxResults = isSameTypeRef(MailTypeRef, restriction.type) ? SEARCH_PAGE_SIZE : null

		// using hasOwnProperty to distinguish case when url is like '/search/mail/query='
		if (args.hasOwnProperty("query")) {
			if (this.search.isNewSearch(args.query, restriction)) {
				this.search.search({
					query: args.query,
					restriction,
					minSuggestionCount: 0,
					maxResults,
				})
			}
		} else if (lastQuery && this.search.isNewSearch(lastQuery, restriction)) {
			// If query is not set for some reason (e.g. switching search type), use the last query value
			this.search.search({
				query: lastQuery,
				restriction,
				minSuggestionCount: 0,
				maxResults,
			})
		}

		// update the filters
		if (isSameTypeRef(restriction.type, MailTypeRef)) {
			this.endDate = restriction.start ? new Date(restriction.start) : null
			this.startDate = restriction.end ? new Date(restriction.end) : null
			this.selectedMailField = restriction.field
			this.selectedMailFolder = restriction.listId
		}

		if (args.id && !this.listModel.isItemSelected(args.id)) {
			// the mail list is visible already, just the selected mail is changed
			const listModel = this.listModel
			this.listModel.loadAndSelect(args.id, () => {
				return this.listModel !== listModel
			})
		}
	}

	async loadAll() {
		if (this.loadingAllForSearchResult != null) return
		this.loadingAllForSearchResult = this._searchResult ?? null
		this.listModel.selectAll()
		try {
			while (
				this._searchResult?.restriction &&
				this.loadingAllForSearchResult &&
				isSameSearchRestriction(this._searchResult?.restriction, this.loadingAllForSearchResult.restriction) &&
				!this.listModel.isLoadedCompletely()
			) {
				await this.listModel.loadMore()
				if (
					this._searchResult.restriction &&
					this.loadingAllForSearchResult.restriction &&
					isSameSearchRestriction(this._searchResult.restriction, this.loadingAllForSearchResult.restriction)
				) {
					this.listModel.selectAll()
				}
			}
		} finally {
			this.loadingAllForSearchResult = null
		}
	}

	stopLoadAll() {
		this.listModel.cancelLoadAll()
	}

	setSelectedField(field: string | null): PaidFunctionResult {
		if (this.logins.getUserController().isFreeAccount() && field != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this.selectedMailField = field
			return PaidFunctionResult.Success
		}
	}

	canSelectTimePeriod(): boolean {
		return !this.logins.getUserController().isFreeAccount()
	}

	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}

	async selectTimePeriod({ start, end }: { start: Date; end: Date }): Promise<PaidFunctionResult> {
		if (!this.canSelectTimePeriod()) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			if (end && isToday(end)) {
				this.endDate = null
			} else {
				this.endDate = end
			}

			let current = this.getCurrentMailIndexDate()

			if (start && current && isSameDay(current, start)) {
				this.startDate = null
			} else {
				this.startDate = start
			}

			return PaidFunctionResult.Success
		}
	}

	async selectMailFolder(folder: string | null): Promise<PaidFunctionResult> {
		if (this.logins.getUserController().isFreeAccount() && folder != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this.selectedMailFolder = folder
			return PaidFunctionResult.Success
		}
	}

	/**
	 * @returns null if the complete mailbox is indexed
	 */
	getCurrentMailIndexDate(): Date | null {
		let timestamp = this.search.indexState().currentMailIndexTimestamp

		if (timestamp === FULL_INDEXED_TIMESTAMP) {
			return null
		} else if (timestamp === NOTHING_INDEXED_TIMESTAMP) {
			return getEndOfDay(new Date())
		} else {
			return new Date(timestamp)
		}
	}

	searchAgain(confirmCallback: ConfirmCallback): void {
		const startDate = this.startDate

		if (startDate && startDate.getTime() < this.search.indexState().currentMailIndexTimestamp) {
			confirmCallback().then((confirmed) => {
				if (confirmed) {
					this.indexerFacade.extendMailIndex(startDate.getTime()).then(() => {
						this.updateSearchUrl()
						this.updateUi()
					})
				}
			})
		} else {
			this.updateSearchUrl()
			this.updateUi()
		}
	}

	get mailFilter(): MailFilterType | null {
		return this._mailFilterType
	}

	setMailFilter(filter: MailFilterType | null) {
		this._mailFilterType = filter
		this.applyMailFilterIfNeeded()
	}

	private applyMailFilterIfNeeded() {
		if (isSameTypeRefNullable(this.lastType, MailTypeRef)) {
			const filterFunction = getMailFilterForType(this._mailFilterType)
			const liftedFilter: ListFilter<SearchResultListEntry> | null = filterFunction ? (entry) => filterFunction(entry.entry as Mail) : null
			this.listModel?.setFilter(liftedFilter)
		}
	}

	private updateSearchUrl() {
		let restriction
		if (isSameTypeRefNullable(this.lastType, MailTypeRef)) {
			restriction = createRestriction(
				this.getCategory(),
				this.endDate ? getEndOfDay(this.endDate).getTime() : null,
				this.startDate ? getStartOfDay(this.startDate).getTime() : null,
				this.selectedMailField,
				this.selectedMailFolder,
			)
		} else {
			restriction = createRestriction(this.getCategory(), null, null, null, null)
		}
		this.router.routeTo(this.search.lastQuery() ?? "", restriction, this.getSingleSelectionId())
	}

	private getCategory(): string {
		const restriction = this.router.getRestriction()
		return searchCategoryForRestriction(restriction)
	}

	private onMailboxesChanged(mailboxes: MailboxDetail[]) {
		this.mailboxes = mailboxes

		// if selected folder no longer exist select another one
		const selectedMailFolder = this.selectedMailFolder
		if (selectedMailFolder && mailboxes.every((mailbox) => mailbox.folders.getFolderByMailListId(selectedMailFolder) == null)) {
			this.selectedMailFolder = assertNotNull(mailboxes[0].folders.getSystemFolderByType(MailFolderType.INBOX)).mails
		}
	}

	private async entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (this.lastType && !isUpdateForTypeRef(this.lastType, update)) {
			return
		}
		const { instanceListId, instanceId, operation } = update
		const id = [neverNull(instanceListId), instanceId] as const
		const typeRef = new TypeRef<SomeEntity>(update.application, update.type)
		if (!this.isInSearchResult(typeRef, id)) {
			return
		}
		await this.listModel.entityEventReceived(instanceId, operation)
		// run the mail or contact update after the update on the list is finished to avoid parallel loading
		if (operation === OperationType.UPDATE && this.listModel?.isItemSelected(elementIdPart(id))) {
			try {
				await this.entityClient.load(typeRef, id)
				this.updateUi()
			} catch (e) {
				// ignore. might happen if a mail was just sent
			}
		}
	}

	getSelectedMails(): Mail[] {
		return this.listModel
			.getSelectedAsArray()
			.map((e) => e.entry)
			.filter(assertIsEntity2(MailTypeRef))
	}

	getSelectedContacts(): Contact[] {
		return this.listModel
			.getSelectedAsArray()
			.map((e) => e.entry)
			.filter(assertIsEntity2(ContactTypeRef))
	}

	private onListStateChange(newState: ListState<SearchResultListEntry>) {
		if (isSameTypeRefNullable(this.lastType, MailTypeRef)) {
			if (!newState.inMultiselect && newState.selectedItems.size === 1) {
				const mail = this.getSelectedMails()[0]
				if (!this.conversationViewModel || !isSameId(this.conversationViewModel?.primaryMail._id, mail._id)) {
					this.updateDisplayedConversation(mail)
				}
			} else {
				this.conversationViewModel = null
			}
		} else {
			this.conversationViewModel = null
		}
		this.updateSearchUrl()
		this.updateUi()
	}

	private getSingleSelectionId(): Id | null {
		if (this.listModel.state.selectedItems.size === 1) {
			return getElementId(this.listModel.getSelectedAsArray()[0])
		} else {
			return null
		}
	}

	private updateDisplayedConversation(mail: Mail): void {
		this.conversationViewModel = this.conversationViewModelFactory({ mail, showFolder: true })
		// Notify the admin client about the mail being selected
		this.mailOpenedListener.onEmailOpened(mail)
	}

	private createList(): ListModel<SearchResultListEntry> {
		return new ListModel<SearchResultListEntry>({
			topId: GENERATED_MAX_ID,
			fetch: async (startId: Id, count: number) => {
				await awaitSearchInitialized(this.search)

				const lastResult = this._searchResult

				if (!lastResult || (lastResult.results.length === 0 && !hasMoreResults(lastResult))) {
					return { items: [], complete: true }
				}

				const { items, newSearchResult } = await this.loadSearchResults(lastResult, startId !== GENERATED_MAX_ID, startId, count)
				const entries = items.map((instance) => new SearchResultListEntry(instance))
				const complete = !hasMoreResults(newSearchResult)

				return { items: entries, complete }
			},
			loadSingle: async (elementId: Id) => {
				const lastResult = this._searchResult
				if (!lastResult) {
					return null
				}
				const id = lastResult.results.find((r) => r[1] === elementId)

				if (id) {
					return this.entityClient
						.load(lastResult.restriction.type, id)
						.then((entity) => new SearchResultListEntry(entity))
						.catch(
							ofClass(NotFoundError, (_) => {
								return null
							}),
						)
				} else {
					return null
				}
			},
			sortCompare: (o1: SearchResultListEntry, o2: SearchResultListEntry) => {
				if (isSameTypeRef(o1.entry._type, ContactTypeRef)) {
					return compareContacts(o1.entry as any, o2.entry as any)
				} else {
					return sortCompareByReverseId(o1.entry, o2.entry)
				}
			},
		})
	}

	isInSearchResult(typeRef: TypeRef<unknown>, id: IdTuple): boolean {
		const result = this._searchResult
		return !!(result && isSameTypeRef(typeRef, result.restriction.type) && result.results.find((r) => isSameId(r, id)))
	}

	private async loadSearchResults<T extends SearchableTypes>(
		currentResult: SearchResult,
		getMoreFromSearch: boolean,
		startId: Id,
		count: number,
	): Promise<{ items: T[]; newSearchResult: SearchResult }> {
		const result = getMoreFromSearch && hasMoreResults(currentResult) ? await this.searchFacade.getMoreSearchResults(currentResult, count) : currentResult

		// we need to override global reference for other functions
		this._searchResult = result

		let items
		if (isSameTypeRef(currentResult.restriction.type, MailTypeRef)) {
			let startIndex = 0

			if (startId !== GENERATED_MAX_ID) {
				startIndex = result.results.findIndex((id) => id[1] === startId)

				if (startIndex === -1) {
					throw new Error("start index not found")
				} else {
					// the start index is already in the list of loaded elements load from the next element
					startIndex++
				}
			}

			// Ignore count when slicing here because we would have to modify SearchResult too
			const toLoad = result.results.slice(startIndex)
			items = await this.loadAndFilterInstances(currentResult.restriction.type, toLoad, result, startIndex)
		} else if (isSameTypeRef(currentResult.restriction.type, ContactTypeRef)) {
			try {
				// load all contacts to sort them by name afterwards
				items = await this.loadAndFilterInstances(currentResult.restriction.type, result.results, result, 0)
			} finally {
				this.updateUi()
			}
		} else {
			// this type is not shown in the search view, e.g. group info
			items = []
		}

		return { items: items, newSearchResult: result }
	}

	private async loadAndFilterInstances<T extends ListElementEntity>(
		type: TypeRef<T>,
		toLoad: IdTuple[],
		currentResult: SearchResult,
		startIndex: number,
	): Promise<T[]> {
		let instances: T[] = []
		for (let [listId, ids] of groupBy(toLoad, listIdPart)) {
			const loaded = await this.entityClient.loadMultiple(type, listId, ids.map(elementIdPart))
			instances = instances.concat(loaded)
		}

		// Filter not found instances from the current result as well so we don’t loop trying to load them
		if (instances.length < toLoad.length) {
			const resultLength = currentResult.results.length
			console.log(`Could not load some results: ${instances.length} out of ${toLoad.length}`)

			// loop backwards to remove correct elements by index
			for (let i = toLoad.length - 1; i >= 0; i--) {
				const toLoadId = toLoad[i]

				if (instances.find((instance) => isSameId(instance._id, toLoadId)) == null) {
					currentResult.results.splice(startIndex + i, 1)

					if (instances.length === toLoad.length) {
						break
					}
				}
			}

			console.log(`Fixed results, before ${resultLength}, after: ${currentResult.results.length}`)
		}

		return instances
	}

	dispose() {
		this.stopLoadAll()
		this.resultSubscription?.end(true)
		this.resultSubscription = null
		this.mailboxSubscription?.end(true)
		this.mailboxSubscription = null
		this.listStateSubscription?.end(true)
		this.listStateSubscription = null
		this.eventController.removeEntityListener(this.entityEventsListener)
		this.listModel = this.createList()
	}
}

function awaitSearchInitialized(searchModel: SearchModel): Promise<unknown> {
	const deferred = defer<unknown>()
	const dep = searchModel.indexState.map((state) => {
		if (!state.initializing) {
			Promise.resolve().then(() => {
				dep.end(true)
				deferred.resolve(undefined)
			})
		}
	})
	return deferred.promise
}
