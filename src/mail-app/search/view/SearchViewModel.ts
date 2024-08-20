import { ListFilter, ListModel } from "../../../common/misc/ListModel.js"
import { SearchResultListEntry } from "./SearchListView.js"
import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes.js"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { ListElementEntity, SomeEntity } from "../../../common/api/common/EntityTypes.js"
import { FULL_INDEXED_TIMESTAMP, MailSetKind, NOTHING_INDEXED_TIMESTAMP, OperationType } from "../../../common/api/common/TutanotaConstants.js"
import {
	assertIsEntity,
	assertIsEntity2,
	elementIdPart,
	GENERATED_MAX_ID,
	getElementId,
	isSameId,
	ListElement,
	listIdPart,
	sortCompareByReverseId,
} from "../../../common/api/common/utils/EntityUtils.js"
import { ListLoadingState, ListState } from "../../../common/gui/base/List.js"
import {
	assertNotNull,
	deepEqual,
	defer,
	downcast,
	getEndOfDay,
	getStartOfDay,
	isSameDay,
	isSameTypeRef,
	isToday,
	LazyLoaded,
	lazyMemoized,
	neverNull,
	ofClass,
	TypeRef,
} from "@tutao/tutanota-utils"
import { areResultsForTheSameQuery, hasMoreResults, isSameSearchRestriction, SearchModel } from "../model/SearchModel.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { compareContacts } from "../../contacts/view/ContactGuiUtils.js"
import { ConversationViewModel, ConversationViewModelFactory } from "../../mail/view/ConversationViewModel.js"
import {
	createRestriction,
	decodeCalendarSearchKey,
	encodeCalendarSearchKey,
	getRestriction,
	getSearchUrl,
	searchCategoryForRestriction,
	SearchCategoryTypes,
} from "../model/SearchUtils.js"
import Stream from "mithril/stream"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { SearchFacade } from "../../workerUtils/index/SearchFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { Indexer } from "../../workerUtils/index/Indexer.js"
import { EntityClient, loadMultipleFromLists } from "../../../common/api/common/EntityClient.js"
import { SearchRouter } from "../../../common/search/view/SearchRouter.js"
import { MailOpenedListener } from "../../mail/view/MailViewModel.js"
import { containsEventOfType, EntityUpdateData, getEventOfType, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { CalendarInfo } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import m from "mithril"
import { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker.js"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"
import { getStartOfTheWeekOffsetForUser } from "../../../common/calendar/date/CalendarUtils.js"
import { mailLocator } from "../../mailLocator.js"
import { getMailFilterForType, MailFilterType } from "../../mail/view/MailViewerUtils.js"

const SEARCH_PAGE_SIZE = 100

export type SearchableTypes = Mail | Contact | CalendarEvent

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
	includeRepeatingEvents: boolean = true
	latestMailRestriction: SearchRestriction | null = null
	latestCalendarRestriction: SearchRestriction | null = null

	/**
	 * the type ref that determines which search filters and details
	 * viewers this view should show.
	 * taken from the current results' restriction or, if result is nonexistent,
	 * the URL.
	 *
	 * result might be nonexistent if there is no query or we're not done searching
	 * yet.
	 */
	get searchedType(): TypeRef<Mail> | TypeRef<Contact> | TypeRef<CalendarEvent> {
		return (this._searchResult?.restriction ?? this.router.getRestriction()).type
	}

	conversationViewModel: ConversationViewModel | null = null
	startDate: Date | null = null // null = current mail index date. this allows us to start the search (and the url) without end date set
	endDate: Date | null = null // null = today
	selectedMailFolder: Array<Id> = []
	// Isn't an IdTuple because it is two list ids
	selectedCalendar: readonly [Id, Id] | null = null
	mailboxes: MailboxDetail[] = []
	selectedMailField: string | null = null
	private mailboxSubscription: Stream<void> | null = null
	private resultSubscription: Stream<void> | null = null
	private listStateSubscription: Stream<unknown> | null = null
	loadingAllForSearchResult: SearchResult | null = null
	private readonly lazyCalendarInfos: LazyLoaded<ReadonlyMap<string, CalendarInfo>> = new LazyLoaded(async () => {
		const calendarModel = await locator.calendarModel()
		const calendarInfos = await calendarModel.getCalendarInfos()
		m.redraw()
		return calendarInfos
	})
	currentQuery: string = ""

	constructor(
		readonly router: SearchRouter,
		private readonly search: SearchModel,
		private readonly searchFacade: SearchFacade,
		private readonly mailboxModel: MailboxModel,
		private readonly logins: LoginController,
		private readonly indexerFacade: Indexer,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly mailOpenedListener: MailOpenedListener | null,
		private readonly calendarFacade: CalendarFacade,
		private readonly progressTracker: ProgressTracker,
		private readonly conversationViewModelFactory: ConversationViewModelFactory | null,
		private readonly updateUi: () => unknown,
		private readonly selectionBehavior: ListAutoSelectBehavior,
	) {
		this.currentQuery = this.search.result()?.query ?? ""
		this.listModel = this.createList()
	}

	getLazyCalendarInfos() {
		return this.lazyCalendarInfos
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

		this.mailboxSubscription = this.mailboxModel.mailboxDetails.map((mailboxes) => this.onMailboxesChanged(mailboxes))
		this.eventController.addEntityListener(this.entityEventsListener)
	})

	getRestriction(): SearchRestriction {
		return this.router.getRestriction()
	}

	private readonly entityEventsListener: EntityEventsListener = async (updates) => {
		for (const update of updates) {
			const mergedUpdate = this.mergeOperationsIfNeeded(update, updates)

			if (mergedUpdate == null) continue

			await this.entityEventReceived(mergedUpdate)
		}
	}

	private mergeOperationsIfNeeded(update: EntityUpdateData, updates: readonly EntityUpdateData[]): EntityUpdateData | null {
		// We are trying to keep the mails that are moved and would match the search criteria displayed.
		// This is a bit hacky as we reimplement part of the filtering by list.
		// Ideally search result would update by itself and we would only need to reconcile the changes.
		if (!isUpdateForTypeRef(MailTypeRef, update) || this._searchResult == null) {
			return update
		}
		if (update.operation === OperationType.CREATE && containsEventOfType(updates, OperationType.DELETE, update.instanceId)) {
			// This is a move operation, is destination list included in the restrictions?
			if (this.listIdMatchesRestriction(update.instanceListId, this._searchResult.restriction)) {
				// If it's included, we want to keep showing the item but we will simulate the UPDATE
				return { ...update, operation: OperationType.UPDATE }
			} else {
				// If it's not going to be included we might as well skip the create operation
				return null
			}
		} else if (update.operation === OperationType.DELETE && containsEventOfType(updates, OperationType.CREATE, update.instanceId)) {
			// This is a move operation and we are in the delete part of it.
			// Grab the other part to check the move destination.
			const createOperation = assertNotNull(getEventOfType(updates, OperationType.CREATE, update.instanceId))
			// Is destination included in the search?
			if (this.listIdMatchesRestriction(createOperation.instanceListId, this._searchResult.restriction)) {
				// If so, skip the delete.
				return null
			} else {
				// Otherwise delete
				return update
			}
		} else {
			return update
		}
	}

	private listIdMatchesRestriction(listId: string, restriction: SearchRestriction): boolean {
		return restriction.folderIds.length === 0 || restriction.folderIds.includes(listId)
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		let restriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			// if restriction is broken replace it with non-broken version
			this.router.routeTo(args.query, createRestriction(SearchCategoryTypes.mail, null, null, null, [], null))
			return
		}

		this.currentQuery = args.query
		const lastQuery = this.search.lastQueryString()
		const maxResults = isSameTypeRef(MailTypeRef, restriction.type) ? SEARCH_PAGE_SIZE : null
		const listModel = this.listModel
		// using hasOwnProperty to distinguish case when url is like '/search/mail/query='
		if (args.hasOwnProperty("query") && this.search.isNewSearch(args.query, restriction)) {
			this._searchResult = null
			listModel.updateLoadingStatus(ListLoadingState.Loading)
			this.search
				.search(
					{
						query: args.query,
						restriction,
						minSuggestionCount: 0,
						maxResults,
					},
					this.progressTracker,
				)
				.then(() => listModel.updateLoadingStatus(ListLoadingState.Done))
				.catch(() => listModel.updateLoadingStatus(ListLoadingState.ConnectionLost))
		} else if (lastQuery && this.search.isNewSearch(lastQuery, restriction)) {
			this._searchResult = null

			// If query is not set for some reason (e.g. switching search type), use the last query value
			listModel.selectNone()
			listModel.updateLoadingStatus(ListLoadingState.Loading)
			this.search
				.search(
					{
						query: lastQuery,
						restriction,
						minSuggestionCount: 0,
						maxResults,
					},
					this.progressTracker,
				)
				.then(() => listModel.updateLoadingStatus(ListLoadingState.Done))
				.catch(() => listModel.updateLoadingStatus(ListLoadingState.ConnectionLost))
		} else if (!args.hasOwnProperty("query") && !lastQuery) {
			// no query at all yet
			listModel.updateLoadingStatus(ListLoadingState.Done)
		}

		if (isSameTypeRef(restriction.type, ContactTypeRef)) {
			this.loadAndSelectIfNeeded(args.id)
		} else {
			if (isSameTypeRef(restriction.type, MailTypeRef)) {
				this.selectedMailField = restriction.field
				this.startDate = restriction.end ? new Date(restriction.end) : null
				this.endDate = restriction.start ? new Date(restriction.start) : null
				this.selectedMailFolder = restriction.folderIds
				this.loadAndSelectIfNeeded(args.id)
				this.latestMailRestriction = restriction
			} else if (isSameTypeRef(restriction.type, CalendarEventTypeRef)) {
				this.startDate = restriction.start ? new Date(restriction.start) : null
				this.endDate = restriction.end ? new Date(restriction.end) : null
				this.selectedCalendar = this.extractCalendarListIds(restriction.folderIds)
				this.includeRepeatingEvents = restriction.eventSeries ?? true
				this.lazyCalendarInfos.load()
				this.latestCalendarRestriction = restriction

				if (args.id != null) {
					const { start, id } = decodeCalendarSearchKey(args.id)
					this.loadAndSelectIfNeeded(id, ({ entry }: SearchResultListEntry) => {
						entry = entry as CalendarEvent
						return id === getElementId(entry) && start === entry.startTime.getTime()
					})
				}
			}
		}
	}

	private extractCalendarListIds(listIds: string[]): readonly [string, string] | null {
		if (listIds.length < 2) return null

		return [listIds[0], listIds[1]]
	}

	private loadAndSelectIfNeeded(id: string | null, finder?: (a: ListElement) => boolean) {
		// nothing to select
		if (id == null) {
			return
		}

		if (!this.listModel.isItemSelected(id)) {
			if (!this.listModel.isItemSelected(id)) {
				this.handleLoadAndSelection(id, finder)
			}
		}
	}

	private handleLoadAndSelection(id: string, finder: ((a: ListElement) => boolean) | undefined) {
		if (this.listModel.isLoadedCompletely()) {
			return this.selectItem(id, finder)
		}

		const listStateStream = Stream.combine((a) => a(), [this.listModel.stateStream])
		listStateStream.map((state) => {
			if (state.loadingStatus === ListLoadingState.Done) {
				this.selectItem(id, finder)
				listStateStream.end(true)
			}
		})
	}

	private selectItem(id: string, finder: ((a: ListElement) => boolean) | undefined) {
		const listModel = this.listModel
		this.listModel.loadAndSelect(id, () => !deepEqual(this.listModel, listModel), finder)
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
				console.log("setting end to null")
				this.endDate = null
			} else {
				this.endDate = end
			}

			let current = this.getCurrentMailIndexDate()

			if (start && current && isSameDay(current, start)) {
				console.log("setting start to null")
				this.startDate = null
			} else {
				this.startDate = start
			}

			return PaidFunctionResult.Success
		}
	}

	selectMailFolder(folder: Array<string>): PaidFunctionResult {
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
		if (startDate && startDate.getTime() < this.search.indexState().currentMailIndexTimestamp && this.getCategory() === SearchCategoryTypes.mail) {
			confirmCallback().then(async (confirmed) => {
				if (confirmed) {
					await this.indexerFacade.extendMailIndex(startDate.getTime())
					this.updateSearchUrl()
					this.updateUi()
				}
			})
		} else {
			this.updateSearchUrl()
			this.updateUi()
		}
	}

	getUrlFromSearchCategory(category: SearchCategoryTypes): string {
		if (this.currentQuery) {
			let latestRestriction: SearchRestriction | null = null
			switch (category) {
				case SearchCategoryTypes.mail:
					latestRestriction = this.latestMailRestriction
					break
				case SearchCategoryTypes.calendar:
					latestRestriction = this.latestCalendarRestriction
					break
				case SearchCategoryTypes.contact:
					// contacts do not have restrictions at this time
					break
			}

			if (latestRestriction) {
				return getSearchUrl(this.currentQuery, latestRestriction)
			} else {
				return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null))
			}
		} else {
			return getSearchUrl("", createRestriction(category, null, null, null, [], null))
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
		if (isSameTypeRef(this.searchedType, MailTypeRef)) {
			const filterFunction = getMailFilterForType(this._mailFilterType)
			const liftedFilter: ListFilter<SearchResultListEntry> | null = filterFunction ? (entry) => filterFunction(entry.entry as Mail) : null
			this.listModel?.setFilter(liftedFilter)
		}
	}

	private updateSearchUrl() {
		const selectedElement = this.listModel.state.selectedItems.size === 1 ? this.listModel.getSelectedAsArray().at(0) : null

		if (isSameTypeRef(this.searchedType, MailTypeRef)) {
			this.routeMail(
				(selectedElement?.entry as Mail) ?? null,
				createRestriction(
					this.getCategory(),
					this.endDate ? getEndOfDay(this.endDate).getTime() : null,
					this.startDate ? getStartOfDay(this.startDate).getTime() : null,
					this.selectedMailField,
					this.selectedMailFolder,
					null,
				),
			)
		} else if (isSameTypeRef(this.searchedType, CalendarEventTypeRef)) {
			this.routeCalendar(
				(selectedElement?.entry as CalendarEvent) ?? null,
				createRestriction(
					this.getCategory(),
					this.startDate ? getStartOfDay(this.startDate).getTime() : null,
					this.endDate ? getEndOfDay(this.endDate).getTime() : null,
					null,
					this.selectedCalendar == null ? [] : [...this.selectedCalendar],
					this.includeRepeatingEvents,
				),
			)
		} else if (isSameTypeRef(this.searchedType, ContactTypeRef)) {
			this.routeContact((selectedElement?.entry as Contact) ?? null, createRestriction(this.getCategory(), null, null, null, [], null))
		}
	}

	private routeCalendar(element: CalendarEvent | null, restriction: SearchRestriction) {
		const selectionKey = this.generateSelectionKey(element)
		this.router.routeTo(this.currentQuery, restriction, selectionKey)
	}

	private routeMail(element: Mail | null, restriction: SearchRestriction) {
		this.router.routeTo(this.currentQuery, restriction, this.generateSelectionKey(element))
	}

	private routeContact(element: Contact | null, restriction: SearchRestriction) {
		this.router.routeTo(this.currentQuery, restriction, this.generateSelectionKey(element))
	}

	private generateSelectionKey(element: SearchableTypes | null): string | null {
		if (element == null) return null
		if (assertIsEntity(element, CalendarEventTypeRef)) {
			return encodeCalendarSearchKey(element)
		} else {
			return getElementId(element)
		}
	}

	private getCategory(): SearchCategoryTypes {
		const restriction = this.router.getRestriction()
		return searchCategoryForRestriction(restriction)
	}

	private onMailboxesChanged(mailboxes: MailboxDetail[]) {
		this.mailboxes = mailboxes
		const folderStructures = mailLocator.mailModel.folders()

		// if selected folder no longer exist select another one
		const selectedMailFolder = this.selectedMailFolder
		if (
			selectedMailFolder[0] &&
			mailboxes.every((mailbox) => folderStructures[assertNotNull(mailbox.mailbox.folders)._id].getFolderById(selectedMailFolder[0]) == null)
		) {
			this.selectedMailFolder = [
				getElementId(assertNotNull(folderStructures[assertNotNull(mailboxes[0].mailbox.folders)._id].getSystemFolderByType(MailSetKind.INBOX))),
			]
		}
	}

	private async entityEventReceived(update: EntityUpdateData): Promise<void> {
		const lastType = this.searchedType
		if (!isUpdateForTypeRef(lastType, update)) {
			return
		}
		const { instanceListId, instanceId, operation } = update
		const id = [neverNull(instanceListId), instanceId] as const
		const typeRef = new TypeRef<SomeEntity>(update.application, update.type)
		if (!this.isInSearchResult(typeRef, id)) {
			return
		}

		if (isUpdateForTypeRef(MailTypeRef, update) && operation === OperationType.UPDATE) {
			if (this._searchResult && this._searchResult.results) {
				const index = this._searchResult?.results.findIndex(
					(email) => update.instanceId === elementIdPart(email) && update.instanceListId !== listIdPart(email),
				)
				if (index >= 0) {
					const restrictionLength = this._searchResult.restriction.folderIds.length
					if ((restrictionLength > 0 && this._searchResult.restriction.folderIds.includes(update.instanceListId)) || restrictionLength === 0) {
						// We need to update the listId of the updated item, since it was moved to another folder.
						const newIdTuple: IdTuple = [update.instanceListId, update.instanceId]
						this._searchResult.results[index] = newIdTuple
					}
				}
			}
		} else if (isUpdateForTypeRef(CalendarEventTypeRef, update) && isSameTypeRef(lastType, CalendarEventTypeRef)) {
			// due to the way calendar event changes are sort of non-local, we throw away the whole list and re-render it if
			// the contents are edited. we do the calculation on a new list and then swap the old list out once the new one is
			// ready
			const selectedItem = this.listModel.getSelectedAsArray().at(0)
			const listModel = this.createList()
			this.setMailFilter(this._mailFilterType)
			this.applyMailFilterIfNeeded()

			await listModel.loadInitial()
			if (selectedItem != null) {
				await listModel.loadAndSelect(elementIdPart(selectedItem._id), () => false)
			}
			this.listModel = listModel
			this.listStateSubscription?.end(true)
			this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state))
			this.updateSearchUrl()
			this.updateUi()
			return
		}

		this.listModel.getUnfilteredAsArray()
		await this.listModel.entityEventReceived(instanceListId, instanceId, operation)
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

	getSelectedEvents(): CalendarEvent[] {
		return this.listModel
			.getSelectedAsArray()
			.map((e) => e.entry)
			.filter(assertIsEntity2(CalendarEventTypeRef))
	}

	private onListStateChange(newState: ListState<SearchResultListEntry>) {
		if (isSameTypeRef(this.searchedType, MailTypeRef)) {
			if (!newState.inMultiselect && newState.selectedItems.size === 1) {
				const mail = this.getSelectedMails()[0]

				// Sometimes a stale state is passed through, resulting in no mail
				if (mail) {
					if (!this.conversationViewModel) {
						this.updateDisplayedConversation(mail)
					} else if (this.conversationViewModel) {
						const isSameElementId = isSameId(elementIdPart(this.conversationViewModel?.primaryMail._id), elementIdPart(mail._id))
						const isSameListId = isSameId(listIdPart(this.conversationViewModel?.primaryMail._id), listIdPart(mail._id))
						if (!isSameElementId || !isSameListId) {
							this.updateDisplayedConversation(mail)
						}
					}
				} else {
					this.conversationViewModel = null
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

	private updateDisplayedConversation(mail: Mail): void {
		if (this.conversationViewModelFactory && this.mailOpenedListener) {
			this.conversationViewModel = this.conversationViewModelFactory({ mail, showFolder: true })
			// Notify the admin client about the mail being selected
			this.mailOpenedListener.onEmailOpened(mail)
		}
	}

	private createList(): ListModel<SearchResultListEntry> {
		// since we recreate the list every time we set a new result object,
		// we bind the value of result for the lifetime of this list model
		// at this point
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent
		return new ListModel<SearchResultListEntry>({
			fetch: async (lastFetchedEntity: SearchResultListEntry, count: number) => {
				const startId = lastFetchedEntity == null ? GENERATED_MAX_ID : getElementId(lastFetchedEntity)

				const lastResult = this._searchResult
				if (lastResult !== this._searchResult) {
					console.warn("got a fetch request for outdated results object, ignoring")
					// this._searchResults was reassigned, we'll create a new ListModel soon
					return { items: [], complete: true }
				}
				await awaitSearchInitialized(this.search)

				if (!lastResult || (lastResult.results.length === 0 && !hasMoreResults(lastResult))) {
					return { items: [], complete: true }
				}

				const { items, newSearchResult } = await this.loadSearchResults(lastResult, startId, count)
				const entries = items.map((instance) => new SearchResultListEntry(instance))
				const complete = !hasMoreResults(newSearchResult)

				return { items: entries, complete }
			},
			loadSingle: async (_listId: Id, elementId: Id) => {
				const lastResult = this._searchResult
				if (!lastResult) {
					return null
				}
				const id = lastResult.results.find((resultId) => elementIdPart(resultId) === elementId)
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
				} else if (isSameTypeRef(o1.entry._type, CalendarEventTypeRef)) {
					return downcast(o1.entry).startTime.getTime() - downcast(o2.entry).startTime.getTime()
				} else {
					return sortCompareByReverseId(o1.entry, o2.entry)
				}
			},
			autoSelectBehavior: () => (isSameTypeRef(this.searchedType, MailTypeRef) ? this.selectionBehavior : ListAutoSelectBehavior.OLDER),
		})
	}

	isInSearchResult(typeRef: TypeRef<unknown>, id: IdTuple): boolean {
		const result = this._searchResult

		if (result && isSameTypeRef(typeRef, result.restriction.type)) {
			// The list id must be null/empty, otherwise the user is filtering by list, and it shouldn't be ignored

			const ignoreList = isSameTypeRef(typeRef, MailTypeRef) && result.restriction.folderIds.length === 0

			return result.results.some((r) => this.compareItemId(r, id, ignoreList))
		}

		return false
	}

	private compareItemId(id1: IdTuple, id2: IdTuple, ignoreList: boolean) {
		return ignoreList ? isSameId(elementIdPart(id1), elementIdPart(id2)) : isSameId(id1, id2)
	}

	private async loadSearchResults<T extends SearchableTypes>(
		currentResult: SearchResult,
		startId: Id,
		count: number,
	): Promise<{ items: T[]; newSearchResult: SearchResult }> {
		const updatedResult = hasMoreResults(currentResult) ? await this.searchFacade.getMoreSearchResults(currentResult, count) : currentResult

		// we need to override global reference for other functions
		this._searchResult = updatedResult

		let items
		if (isSameTypeRef(currentResult.restriction.type, MailTypeRef)) {
			let startIndex = 0

			if (startId !== GENERATED_MAX_ID) {
				// this relies on the results being sorted from newest to oldest ID
				startIndex = updatedResult.results.findIndex((id) => id[1] <= startId)
				if (elementIdPart(updatedResult.results[startIndex]) === startId) {
					// the start element is already loaded, so we exclude it from the next load
					startIndex++
				} else if (startIndex === -1) {
					// there is nothing in our result that's not loaded yet, so we
					// have nothing to do
					startIndex = Math.max(updatedResult.results.length - 1, 0)
				}
			}

			// Ignore count when slicing here because we would have to modify SearchResult too
			const toLoad = updatedResult.results.slice(startIndex)
			items = await this.loadAndFilterInstances(currentResult.restriction.type, toLoad, updatedResult, startIndex)
		} else if (isSameTypeRef(currentResult.restriction.type, ContactTypeRef)) {
			try {
				// load all contacts to sort them by name afterwards
				items = await this.loadAndFilterInstances(currentResult.restriction.type, updatedResult.results, updatedResult, 0)
			} finally {
				this.updateUi()
			}
		} else if (isSameTypeRef(currentResult.restriction.type, CalendarEventTypeRef)) {
			try {
				const { start, end } = currentResult.restriction
				if (start == null || end == null) {
					throw new ProgrammingError("invalid search time range for calendar")
				}
				items = await this.calendarFacade.reifyCalendarSearchResult(start, end, updatedResult.results)
			} finally {
				this.updateUi()
			}
		} else {
			// this type is not shown in the search view, e.g. group info
			items = []
		}

		return { items: items, newSearchResult: updatedResult }
	}

	/**
	 * take a list of IDs and load them by list, filtering out the ones that could not be loaded.
	 * updates the passed currentResult.result list to not include the failed IDs anymore
	 */
	private async loadAndFilterInstances<T extends ListElementEntity>(
		type: TypeRef<T>,
		toLoad: IdTuple[],
		currentResult: SearchResult,
		startIndex: number,
	): Promise<T[]> {
		const instances = await loadMultipleFromLists(type, this.entityClient, toLoad)
		// Filter not found instances from the current result as well so we don’t loop trying to load them
		if (instances.length < toLoad.length) {
			const resultLength = currentResult.results.length
			console.log(`Could not load some results: ${instances.length} out of ${toLoad.length}`)

			// loop backwards to remove correct elements by index
			for (let i = toLoad.length - 1; i >= 0; i--) {
				const toLoadId = toLoad[i]

				if (!instances.some((instance) => isSameId(instance._id, toLoadId))) {
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

	sendStopLoadingSignal() {
		this.search.sendCancelSignal()
	}

	dispose() {
		this.stopLoadAll()
		this.resultSubscription?.end(true)
		this.resultSubscription = null
		this.mailboxSubscription?.end(true)
		this.mailboxSubscription = null
		this.listStateSubscription?.end(true)
		this.listStateSubscription = null
		this.search.sendCancelSignal()
		this.eventController.removeEntityListener(this.entityEventsListener)
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
