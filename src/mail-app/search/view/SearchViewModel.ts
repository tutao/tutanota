import { ListElementListModel } from "../../../common/misc/ListElementListModel.js"
import { SearchResultListEntry } from "./SearchListView.js"
import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes.js"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailFolder, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { ListElementEntity, SomeEntity } from "../../../common/api/common/EntityTypes.js"
import {
	CLIENT_ONLY_CALENDARS,
	FULL_INDEXED_TIMESTAMP,
	MailSetKind,
	NOTHING_INDEXED_TIMESTAMP,
	OperationType,
} from "../../../common/api/common/TutanotaConstants.js"
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
	incrementMonth,
	isSameDayOfDate,
	isSameTypeRef,
	LazyLoaded,
	memoizedWithHiddenArgument,
	neverNull,
	ofClass,
	stringToBase64,
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
import { ClientOnlyCalendarsInfo, ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"
import { generateCalendarInstancesInRange, retrieveClientOnlyEventsForUser } from "../../../common/calendar/date/CalendarUtils.js"
import { mailLocator } from "../../mailLocator.js"
import { getMailFilterForType, MailFilterType } from "../../mail/view/MailViewerUtils.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { getClientOnlyCalendars } from "../../../calendar-app/calendar/gui/CalendarGuiUtils.js"
import { YEAR_IN_MILLIS } from "@tutao/tutanota-utils/dist/DateUtils.js"
import { ListFilter } from "../../../common/misc/ListModel"
import { client } from "../../../common/misc/ClientDetector"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"

const SEARCH_PAGE_SIZE = 100

export type SearchableTypes = Mail | Contact | CalendarEvent

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

export class SearchViewModel {
	private _listModel: ListElementListModel<SearchResultListEntry>
	get listModel(): ListElementListModel<SearchResultListEntry> {
		return this._listModel
	}

	private _includeRepeatingEvents: boolean = true
	get includeRepeatingEvents(): boolean {
		return this._includeRepeatingEvents
	}

	get warning(): "long" | "startafterend" | null {
		if (this.startDate && this.startDate.getTime() > this.endDate.getTime()) {
			return "startafterend"
		} else if (this.startDate && this.endDate.getTime() - this.startDate.getTime() > YEAR_IN_MILLIS) {
			return "long"
		} else {
			return null
		}
	}

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
		return (this.searchResult?.restriction ?? this.router.getRestriction()).type
	}

	private _conversationViewModel: ConversationViewModel | null = null
	get conversationViewModel(): ConversationViewModel | null {
		return this._conversationViewModel
	}

	private _startDate: Date | null = null // null = current mail index date. this allows us to start the search (and the url) without end date set
	get startDate(): Date | null {
		return this._startDate ?? this.getCurrentMailIndexDate()
	}

	private _endDate: Date | null = null // null = today (mail), end of 2 months in the future (calendar)
	get endDate(): Date {
		if (this._endDate) {
			return this._endDate
		} else {
			if (this.getCategory() === SearchCategoryTypes.calendar) {
				let returnDate = incrementMonth(new Date(), 3)
				returnDate.setDate(0)
				return returnDate
			} else {
				return new Date()
			}
		}
	}

	private _selectedMailFolder: Array<Id> = []
	get selectedMailFolder(): Array<Id> {
		return this._selectedMailFolder
	}

	// isn't an IdTuple because it is two list ids
	private _selectedCalendar: readonly [Id, Id] | string | null = null
	get selectedCalendar(): readonly [Id, Id] | string | null {
		return this._selectedCalendar
	}

	private _mailboxes: MailboxDetail[] = []
	get mailboxes(): MailboxDetail[] {
		return this._mailboxes
	}

	private _selectedMailField: string | null = null
	get selectedMailField(): string | null {
		return this._selectedMailField
	}

	// Contains load more results even when searchModel doesn't.
	// Load more should probably be moved to the model to update it's result stream.
	private searchResult: SearchResult | null = null
	private mailFilterType: MailFilterType | null = null
	private latestMailRestriction: SearchRestriction | null = null
	private latestCalendarRestriction: SearchRestriction | null = null
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

	private readonly userHasNewPaidPlan: LazyLoaded<boolean> = new LazyLoaded<boolean>(async () => {
		return await this.logins.getUserController().isNewPaidPlan()
	})

	currentQuery: string = ""

	private extendIndexConfirmationCallback: (() => Promise<boolean>) | null = null
	private freeToAskAboutExtendingIndex: boolean = true

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
		private readonly eventsRepository: CalendarEventsRepository,
		private readonly updateUi: () => unknown,
		private readonly selectionBehavior: ListAutoSelectBehavior,
		private readonly localCalendars: Map<Id, ClientOnlyCalendarsInfo>,
		private readonly offlineStorageSettings: OfflineStorageSettingsModel | null,
	) {
		this.currentQuery = this.search.result()?.query ?? ""
		this._listModel = this.createList()
	}

	getLazyCalendarInfos() {
		return this.lazyCalendarInfos
	}

	getUserHasNewPaidPlan() {
		return this.userHasNewPaidPlan
	}

	async init(extendIndexConfirmationCallback: SearchViewModel["extendIndexConfirmationCallback"]) {
		if (this.extendIndexConfirmationCallback) {
			return
		}
		this.extendIndexConfirmationCallback = extendIndexConfirmationCallback
		this.resultSubscription = this.search.result.map((result) => {
			if (!result || !isSameTypeRef(result.restriction.type, MailTypeRef)) {
				this.mailFilterType = null
			}

			if (this.searchResult == null || result == null || !areResultsForTheSameQuery(result, this.searchResult)) {
				this._listModel.cancelLoadAll()

				this.searchResult = result

				this._listModel = this.createList()
				this.setMailFilter(this.mailFilterType)
				this.applyMailFilterIfNeeded()
				this._listModel.loadInitial()
				this.listStateSubscription?.end(true)
				this.listStateSubscription = this._listModel.stateStream.map((state) => this.onListStateChange(state))
			}
		})

		this.mailboxSubscription = this.mailboxModel.mailboxDetails.map((mailboxes) => {
			this.onMailboxesChanged(mailboxes)
		})
		this.eventController.addEntityListener(this.entityEventsListener)
		await this.offlineStorageSettings?.init()
	}

	getRestriction(): SearchRestriction {
		return this.router.getRestriction()
	}

	isExportingMailsAllowed(): boolean {
		return mailLocator.mailModel.isExportingMailsAllowed() && !client.isMobileDevice()
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
		if (!isUpdateForTypeRef(MailTypeRef, update) || this.searchResult == null) {
			return update
		}
		if (update.operation === OperationType.CREATE && containsEventOfType(updates, OperationType.DELETE, update.instanceId)) {
			// This is a move operation, is destination list included in the restrictions?
			if (this.listIdMatchesRestriction(update.instanceListId, this.searchResult.restriction)) {
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
			if (this.listIdMatchesRestriction(createOperation.instanceListId, this.searchResult.restriction)) {
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
		const listModel = this._listModel
		// using hasOwnProperty to distinguish case when url is like '/search/mail/query='
		if (Object.hasOwn(args, "query") && this.search.isNewSearch(args.query, restriction)) {
			this.searchResult = null
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
			this.searchResult = null

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
		} else if (!Object.hasOwn(args, "query") && !lastQuery) {
			// no query at all yet
			listModel.updateLoadingStatus(ListLoadingState.Done)
		}

		if (isSameTypeRef(restriction.type, ContactTypeRef)) {
			this.loadAndSelectIfNeeded(args.id)
		} else {
			if (isSameTypeRef(restriction.type, MailTypeRef)) {
				this._selectedMailField = restriction.field
				this._startDate = restriction.end ? new Date(restriction.end) : null
				this._endDate = restriction.start ? new Date(restriction.start) : null
				this._selectedMailFolder = restriction.folderIds
				this.loadAndSelectIfNeeded(args.id)
				this.latestMailRestriction = restriction
			} else if (isSameTypeRef(restriction.type, CalendarEventTypeRef)) {
				this._startDate = restriction.start ? new Date(restriction.start) : null
				this._endDate = restriction.end ? new Date(restriction.end) : null
				this._includeRepeatingEvents = restriction.eventSeries ?? true
				this.lazyCalendarInfos.load()
				this.userHasNewPaidPlan.load()
				this.latestCalendarRestriction = restriction

				// Check if user is trying to search in a client only calendar while using a free account
				const selectedCalendar = this.extractCalendarListIds(restriction.folderIds)
				if (!selectedCalendar || Array.isArray(selectedCalendar)) {
					this._selectedCalendar = selectedCalendar
				} else if (CLIENT_ONLY_CALENDARS.has(selectedCalendar.toString())) {
					this.getUserHasNewPaidPlan()
						.getAsync()
						.then((isNewPaidPlan) => {
							if (!isNewPaidPlan) {
								return (this._selectedCalendar = null)
							}

							this._selectedCalendar = selectedCalendar
						})
				}

				if (args.id != null) {
					try {
						const { start, id } = decodeCalendarSearchKey(args.id)
						this.loadAndSelectIfNeeded(id, ({ entry }: SearchResultListEntry) => {
							entry = entry as CalendarEvent
							return id === getElementId(entry) && start === entry.startTime.getTime()
						})
					} catch (err) {
						console.log("Invalid ID, selecting none")
						this.listModel.selectNone()
					}
				}
			}
		}
	}

	private extractCalendarListIds(listIds: string[]): readonly [string, string] | string | null {
		if (listIds.length < 1) return null
		else if (listIds.length === 1) return listIds[0]

		return [listIds[0], listIds[1]]
	}

	private loadAndSelectIfNeeded(id: string | null, finder?: (a: ListElement) => boolean) {
		// nothing to select
		if (id == null) {
			return
		}

		if (!this._listModel.isItemSelected(id)) {
			if (!this._listModel.isItemSelected(id)) {
				this.handleLoadAndSelection(id, finder)
			}
		}
	}

	private handleLoadAndSelection(id: string, finder: ((a: ListElement) => boolean) | undefined) {
		if (this._listModel.isLoadedCompletely()) {
			return this.selectItem(id, finder)
		}

		const listStateStream = Stream.combine((a) => a(), [this._listModel.stateStream])
		listStateStream.map((state) => {
			if (state.loadingStatus === ListLoadingState.Done) {
				this.selectItem(id, finder)
				listStateStream.end(true)
			}
		})
	}

	private selectItem(id: string, finder: ((a: ListElement) => boolean) | undefined) {
		const listModel = this._listModel
		this._listModel.loadAndSelect(id, () => !deepEqual(this._listModel, listModel), finder)
	}

	async loadAll() {
		if (this.loadingAllForSearchResult != null) return
		this.loadingAllForSearchResult = this.searchResult ?? null
		this._listModel.selectAll()
		try {
			while (
				this.searchResult?.restriction &&
				this.loadingAllForSearchResult &&
				isSameSearchRestriction(this.searchResult?.restriction, this.loadingAllForSearchResult.restriction) &&
				!this._listModel.isLoadedCompletely()
			) {
				await this._listModel.loadMore()
				if (
					this.searchResult.restriction &&
					this.loadingAllForSearchResult.restriction &&
					isSameSearchRestriction(this.searchResult.restriction, this.loadingAllForSearchResult.restriction)
				) {
					this._listModel.selectAll()
				}
			}
		} finally {
			this.loadingAllForSearchResult = null
		}
	}

	stopLoadAll() {
		this._listModel.cancelLoadAll()
	}

	selectMailField(field: string | null): PaidFunctionResult {
		if (this.logins.getUserController().isFreeAccount() && field != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this._selectedMailField = field
			this.searchAgain()
			return PaidFunctionResult.Success
		}
	}

	canSelectTimePeriod(): boolean {
		return !this.logins.getUserController().isFreeAccount()
	}

	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}

	async selectStartDate(startDate: Date | null): Promise<PaidFunctionResult> {
		if (isSameDayOfDate(this.startDate, startDate)) {
			return PaidFunctionResult.Success
		}

		if (!this.canSelectTimePeriod()) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		}

		// If start date is outside the indexed range, suggest to extend the index and only if confirmed change the selected date.
		// Otherwise, keep the date as it was.
		if (
			this.freeToAskAboutExtendingIndex &&
			startDate &&
			this.getCategory() === SearchCategoryTypes.mail &&
			startDate.getTime() < this.search.indexState().currentMailIndexTimestamp &&
			startDate
		) {
			this.freeToAskAboutExtendingIndex = false
			const confirmed = (await this.extendIndexConfirmationCallback?.()) ?? true
			this.freeToAskAboutExtendingIndex = true
			if (confirmed) {
				this._startDate = startDate
				this.indexerFacade.extendMailIndex(startDate.getTime()).then(() => {
					this.offlineStorageSettings?.setTimeRange(startDate)
					this.updateSearchUrl()
					this.updateUi()
				})
			} else {
				// In this case it is not a success of payment, but we don't need to prompt for upgrade
				return PaidFunctionResult.Success
			}
		} else {
			this._startDate = startDate
		}

		this.searchAgain()

		return PaidFunctionResult.Success
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

	selectCalendar(calendarInfo: CalendarInfo | string | null) {
		if (typeof calendarInfo === "string" || calendarInfo == null) {
			this._selectedCalendar = calendarInfo
		} else {
			this._selectedCalendar = [calendarInfo.groupRoot.longEvents, calendarInfo.groupRoot.shortEvents]
		}
		this.searchAgain()
	}

	selectMailFolder(folder: Array<string>): PaidFunctionResult {
		if (this.logins.getUserController().isFreeAccount() && folder != null) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		} else {
			this._selectedMailFolder = folder
			this.searchAgain()
			return PaidFunctionResult.Success
		}
	}

	selectIncludeRepeatingEvents(include: boolean) {
		this._includeRepeatingEvents = include
		this.searchAgain()
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

	private searchAgain() {
		this.updateSearchUrl()
		this.updateUi()
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
		return this.mailFilterType
	}

	setMailFilter(filter: MailFilterType | null) {
		this.mailFilterType = filter
		this.applyMailFilterIfNeeded()
	}

	private applyMailFilterIfNeeded() {
		if (isSameTypeRef(this.searchedType, MailTypeRef)) {
			const filterFunction = getMailFilterForType(this.mailFilterType)
			const liftedFilter: ListFilter<SearchResultListEntry> | null = filterFunction ? (entry) => filterFunction(entry.entry as Mail) : null
			this._listModel?.setFilter(liftedFilter)
		}
	}

	private updateSearchUrl() {
		const selectedElement = this._listModel.state.selectedItems.size === 1 ? this._listModel.getSelectedAsArray().at(0) : null

		if (isSameTypeRef(this.searchedType, MailTypeRef)) {
			this.routeMail(
				(selectedElement?.entry as Mail) ?? null,
				createRestriction(
					this.getCategory(),
					this._endDate ? getEndOfDay(this._endDate).getTime() : null,
					this._startDate ? getStartOfDay(this._startDate).getTime() : null,
					this._selectedMailField,
					this._selectedMailFolder,
					null,
				),
			)
		} else if (isSameTypeRef(this.searchedType, CalendarEventTypeRef)) {
			this.routeCalendar(
				(selectedElement?.entry as CalendarEvent) ?? null,
				createRestriction(
					this.getCategory(),
					this._startDate ? getStartOfDay(this._startDate).getTime() : null,
					this._endDate ? getEndOfDay(this._endDate).getTime() : null,
					null,
					this.getFolderIds(),
					this._includeRepeatingEvents,
				),
			)
		} else if (isSameTypeRef(this.searchedType, ContactTypeRef)) {
			this.routeContact((selectedElement?.entry as Contact) ?? null, createRestriction(this.getCategory(), null, null, null, [], null))
		}
	}

	private getFolderIds() {
		if (typeof this.selectedCalendar === "string") {
			return [this.selectedCalendar]
		} else if (this.selectedCalendar != null) {
			return [...this.selectedCalendar]
		}

		return []
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

	private async onMailboxesChanged(mailboxes: MailboxDetail[]) {
		this._mailboxes = mailboxes

		// if selected folder no longer exist select another one
		const selectedMailFolder = this._selectedMailFolder

		if (selectedMailFolder[0]) {
			const mailFolder = await mailLocator.mailModel.getMailSetById(selectedMailFolder[0])
			if (!mailFolder) {
				const folderSystem = assertNotNull(mailLocator.mailModel.getFolderSystemByGroupId(mailboxes[0].mailGroup._id))
				this._selectedMailFolder = [getElementId(assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX)))]
				this.updateUi()
			}
		}
	}

	private isPossibleABirthdayContactUpdate(update: EntityUpdateData): boolean {
		if (isUpdateForTypeRef(ContactTypeRef, update) && isSameTypeRef(this.searchedType, CalendarEventTypeRef)) {
			const { instanceListId, instanceId } = update
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`)

			return this.listModel.stateStream().items.some((searchEntry) => searchEntry._id[1].endsWith(encodedContactId))
		}

		return false
	}

	private isSelectedEventAnUpdatedBirthday(update: EntityUpdateData): boolean {
		if (isUpdateForTypeRef(ContactTypeRef, update) && isSameTypeRef(this.searchedType, CalendarEventTypeRef)) {
			const { instanceListId, instanceId } = update
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`)

			const selectedItem = this.listModel.getSelectedAsArray().at(0)
			if (!selectedItem) {
				return false
			}

			return selectedItem._id[1].endsWith(encodedContactId)
		}

		return false
	}

	private async entityEventReceived(update: EntityUpdateData): Promise<void> {
		const lastType = this.searchedType
		const isPossibleABirthdayContactUpdate = this.isPossibleABirthdayContactUpdate(update)

		if (!isUpdateForTypeRef(lastType, update) && !isPossibleABirthdayContactUpdate) {
			return
		}

		const { instanceListId, instanceId, operation } = update
		const id = [neverNull(instanceListId), instanceId] as const
		const typeRef = new TypeRef<SomeEntity>(update.application, update.type)

		if (!this.isInSearchResult(typeRef, id) && !isPossibleABirthdayContactUpdate) {
			return
		}

		if (isUpdateForTypeRef(MailTypeRef, update) && operation === OperationType.UPDATE) {
			if (this.searchResult && this.searchResult.results) {
				const index = this.searchResult?.results.findIndex(
					(email) => update.instanceId === elementIdPart(email) && update.instanceListId !== listIdPart(email),
				)
				if (index >= 0) {
					const restrictionLength = this.searchResult.restriction.folderIds.length
					if ((restrictionLength > 0 && this.searchResult.restriction.folderIds.includes(update.instanceListId)) || restrictionLength === 0) {
						// We need to update the listId of the updated item, since it was moved to another folder.
						const newIdTuple: IdTuple = [update.instanceListId, update.instanceId]
						this.searchResult.results[index] = newIdTuple
					}
				}
			}
		} else if ((isUpdateForTypeRef(CalendarEventTypeRef, update) && isSameTypeRef(lastType, CalendarEventTypeRef)) || isPossibleABirthdayContactUpdate) {
			// due to the way calendar event changes are sort of non-local, we throw away the whole list and re-render it if
			// the contents are edited. we do the calculation on a new list and then swap the old list out once the new one is
			// ready
			const selectedItem = this._listModel.getSelectedAsArray().at(0)
			const listModel = this.createList()
			this.setMailFilter(this.mailFilterType)
			this.applyMailFilterIfNeeded()

			if (isPossibleABirthdayContactUpdate && (await this.eventsRepository.canLoadBirthdaysCalendar())) {
				await this.eventsRepository.loadContactsBirthdays(true)
			}

			await listModel.loadInitial()
			if (selectedItem != null) {
				if (isPossibleABirthdayContactUpdate && this.isSelectedEventAnUpdatedBirthday(update)) {
					// We must invalidate the selected item to refresh the contact preview
					this.listModel.selectNone()
				}
				await listModel.loadAndSelect(elementIdPart(selectedItem._id), () => false)
			}
			this._listModel = listModel
			this.listStateSubscription?.end(true)
			this.listStateSubscription = this._listModel.stateStream.map((state) => this.onListStateChange(state))
			this.updateSearchUrl()
			this.updateUi()
			return
		}

		this._listModel.getUnfilteredAsArray()
		await this._listModel.entityEventReceived(instanceListId, instanceId, operation)
		// run the mail or contact update after the update on the list is finished to avoid parallel loading
		if (operation === OperationType.UPDATE && this._listModel?.isItemSelected(elementIdPart(id))) {
			try {
				await this.entityClient.load(typeRef, id)
				this.updateUi()
			} catch (e) {
				// ignore. might happen if a mail was just sent
			}
		}
	}

	readonly getSelectedMails: () => readonly Mail[] = memoizedWithHiddenArgument(
		() => this._listModel.getSelectedAsArray(),
		(selected) => {
			return selected.map((e) => e.entry).filter(assertIsEntity2(MailTypeRef))
		},
	)

	readonly areMailsDeletable: () => boolean = memoizedWithHiddenArgument(
		() => this.getSelectedMails(),
		(selectedMails) => {
			return selectedMails.every((mail) => {
				const folder = mailLocator.mailModel.getMailFolderForMail(mail)
				return folder != null && (folder.folderType === MailSetKind.TRASH || folder.folderType === MailSetKind.SPAM)
			})
		},
	)

	getSelectedContacts(): Contact[] {
		return this._listModel
			.getSelectedAsArray()
			.map((e) => e.entry)
			.filter(assertIsEntity2(ContactTypeRef))
	}

	getSelectedEvents(): CalendarEvent[] {
		return this._listModel
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
					if (!this._conversationViewModel) {
						this.updateDisplayedConversation(mail)
					} else if (this._conversationViewModel) {
						const isSameElementId = isSameId(elementIdPart(this._conversationViewModel?.primaryMail._id), elementIdPart(mail._id))
						const isSameListId = isSameId(listIdPart(this._conversationViewModel?.primaryMail._id), listIdPart(mail._id))
						if (!isSameElementId || !isSameListId) {
							this.updateSearchUrl()
							this.updateDisplayedConversation(mail)
						}
					}
				} else {
					this._conversationViewModel = null
				}
			} else {
				this._conversationViewModel = null
			}
		} else {
			this._conversationViewModel = null
		}
		this.updateUi()
	}

	private updateDisplayedConversation(mail: Mail): void {
		if (this.conversationViewModelFactory && this.mailOpenedListener) {
			this._conversationViewModel = this.conversationViewModelFactory({
				mail,
				showFolder: true,
				loadLatestMail: false,
			})
			// Notify the admin client about the mail being selected
			this.mailOpenedListener.onEmailOpened(mail)
		}
	}

	private createList(): ListElementListModel<SearchResultListEntry> {
		// since we recreate the list every time we set a new result object,
		// we bind the value of result for the lifetime of this list model
		// at this point
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent
		return new ListElementListModel<SearchResultListEntry>({
			fetch: async (lastFetchedEntity: SearchResultListEntry, count: number) => {
				const startId = lastFetchedEntity == null ? GENERATED_MAX_ID : getElementId(lastFetchedEntity)

				const lastResult = this.searchResult
				if (lastResult !== this.searchResult) {
					console.warn("got a fetch request for outdated results object, ignoring")
					// this._searchResults was reassigned, we'll create a new ListElementListModel soon
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
				const lastResult = this.searchResult
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

	private isInSearchResult(typeRef: TypeRef<unknown>, id: IdTuple): boolean {
		const result = this.searchResult

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
		this.searchResult = updatedResult

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
				items = [
					...(await this.calendarFacade.reifyCalendarSearchResult(start, end, updatedResult.results)),
					...(await this.getClientOnlyEventsSeries(start, end, updatedResult.results)),
				]
			} finally {
				this.updateUi()
			}
		} else {
			// this type is not shown in the search view, e.g. group info
			items = []
		}

		return { items: items, newSearchResult: updatedResult }
	}

	private async getClientOnlyEventsSeries(start: number, end: number, events: IdTuple[]) {
		const eventList = await retrieveClientOnlyEventsForUser(this.logins, events, this.eventsRepository.getBirthdayEvents())
		return generateCalendarInstancesInRange(eventList, { start, end })
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

	getLocalCalendars() {
		return getClientOnlyCalendars(this.logins.getUserController().userId, this.localCalendars)
	}

	dispose() {
		this.stopLoadAll()
		this.extendIndexConfirmationCallback = null
		this.resultSubscription?.end(true)
		this.resultSubscription = null
		this.mailboxSubscription?.end(true)
		this.mailboxSubscription = null
		this.listStateSubscription?.end(true)
		this.listStateSubscription = null
		this.search.sendCancelSignal()
		this.eventController.removeEntityListener(this.entityEventsListener)
	}

	getLabelsForMail(mail: Mail): MailFolder[] {
		return mailLocator.mailModel.getLabelsForMail(mail)
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
