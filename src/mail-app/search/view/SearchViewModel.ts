import { ListElementListModel } from "../../../common/misc/ListElementListModel.js"
import { SearchResultListEntry } from "./SearchListView.js"
import { SearchIndexStateInfo, SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailSet, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { ListElementEntity } from "../../../common/api/common/EntityTypes.js"
import {
	FULL_INDEXED_TIMESTAMP,
	isPermanentDeleteAllowedForFolder,
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
	collectToMap,
	deepEqual,
	defer,
	downcast,
	getEndOfDay,
	getStartOfDay,
	incrementMonth,
	isEmpty,
	isSameDayOfDate,
	isSameTypeRef,
	mapAndFilterNull,
	memoizedWithHiddenArgument,
	neverNull,
	ofClass,
	stringToBase64,
	TypeRef,
	YEAR_IN_MILLIS,
} from "@tutao/tutanota-utils"
import { SearchModel } from "../model/SearchModel.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { compareContacts } from "../../contacts/view/ContactGuiUtils.js"
import { ConversationViewModel, ConversationViewModelFactory } from "../../mail/view/ConversationViewModel.js"
import {
	areResultsForTheSameQuery,
	areResultsForTheSameQueryWithRangeExtended,
	createRestriction,
	decodeCalendarSearchKey,
	encodeCalendarSearchKey,
	getRestriction,
	getSearchUrl,
	hasMoreResults,
	isSameSearchRestriction,
	searchCategoryForRestriction,
	SearchCategoryTypes,
} from "../model/SearchUtils.js"
import Stream from "mithril/stream"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { EntityClient, loadMultipleFromLists } from "../../../common/api/common/EntityClient.js"
import { SearchRouter } from "../../../common/search/view/SearchRouter.js"
import { MailOpenedListener } from "../../mail/view/MailViewModel.js"
import {
	EntityEventsListener,
	EntityUpdateData,
	isUpdateForTypeRef,
	OnEntityUpdateReceivedPriority,
} from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { CalendarInfoBase, CalendarModel, isBirthdayCalendarInfo, isCalendarInfo } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { CalendarFacade } from "../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker.js"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"
import { generateCalendarInstancesInRange, isBirthdayCalendar, retrieveBirthdayEventsForUser } from "../../../common/calendar/date/CalendarUtils.js"
import { mailLocator } from "../../mailLocator.js"
import { getMailFilterForType, MailFilterType } from "../../mail/view/MailViewerUtils.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { ListFilter } from "../../../common/misc/ListModel"
import { client } from "../../../common/misc/ClientDetector"
import { OfflineStorageSettingsModel } from "../../../common/offline/OfflineStorageSettingsModel"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"
import { Indexer } from "../../workerUtils/index/Indexer"
import { isOfflineStorageAvailable } from "../../../common/api/common/Env"
import { SearchToken } from "../../../common/api/common/utils/QueryTokenUtils"
import { isMailDeletable } from "../../mail/model/MailChecks"
import { SearchFacade } from "../../workerUtils/index/SearchFacade"

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

	public checkDates(startDate: Date | null, endDate: Date | null): "long" | "extendIndex" | "startafterend" | null {
		if (startDate && endDate) {
			if (startDate.getTime() > endDate.getTime()) {
				return "startafterend"
			} else if (isSameTypeRef(this.searchedType, MailTypeRef)) {
				// extending index only applies to mails
				const currentIndex = this.getAimedMailIndexDate()
				if (currentIndex && startDate < currentIndex) {
					return "extendIndex"
				}
			} else {
				// We do not care about long for mail search, only if the index is being extended
				if (startDate && endDate.getTime() - startDate.getTime() > YEAR_IN_MILLIS) {
					return "long"
				}
			}
		}
		return null
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
	get searchedType(): TypeRef<Mail | Contact | CalendarEvent> {
		return (this.search.result()?.restriction ?? this.router.getRestriction()).type
	}

	private _conversationViewModel: ConversationViewModel | null = null
	get conversationViewModel(): ConversationViewModel | null {
		return this._conversationViewModel
	}

	private _startDate: Date | null = null // null = aimed mail index date. this allows us to start the search (and the url) without end date set
	get startDate(): Date | null {
		return this._startDate ?? this.getAimedMailIndexDate()
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
	private _selectedCalendar: readonly [Id, Id] | Id | null = null // [longListId, shorListId] || birthDay_calendar_id | null
	get selectedCalendar(): CalendarInfoBase | null {
		const calendars = this.getAvailableCalendars(true)
		const selectedCalendar =
			calendars.find((calendarInfo) => {
				if (isBirthdayCalendarInfo(calendarInfo)) {
					return calendarInfo.id === this._selectedCalendar
				}
				if (isCalendarInfo(calendarInfo)) {
					const groupRoot = calendarInfo.groupRoot
					return isSameId([groupRoot.longEvents, groupRoot.shortEvents], this._selectedCalendar)
				}
			}) ?? null
		return selectedCalendar
	}

	private _mailboxes: MailboxDetail[] = []
	get mailboxes(): MailboxDetail[] {
		return this._mailboxes
	}

	private _selectedMailField: string | null = null
	get selectedMailField(): string | null {
		return this._selectedMailField
	}

	private previousResult: SearchResult | null = null
	private searchResultIdToIndex: Map<Id, number> | null = null

	private updateSearchResultIdToIndex(searchResult: SearchResult | null) {
		if (searchResult == null) {
			this.searchResultIdToIndex = null
		} else if (isOfflineStorageAvailable()) {
			this.searchResultIdToIndex = new Map()
			for (let i = 0; i < searchResult.results.length; i++) {
				this.searchResultIdToIndex.set(elementIdPart(searchResult.results[i]), i)
			}
		}
	}

	private mailFilterType: ReadonlySet<MailFilterType> = new Set()
	private latestMailRestriction: SearchRestriction | null = null
	private latestCalendarRestriction: SearchRestriction | null = null
	private mailboxSubscription: Stream<void> | null = null
	private resultSubscription: Stream<void> | null = null
	private listStateSubscription: Stream<unknown> | null = null
	private indexStateSubscription: Stream<unknown> | null = null
	loadingAllForSearchResult: SearchResult | null = null

	private currentQuery: string = ""

	constructor(
		readonly router: SearchRouter,
		private readonly search: SearchModel,
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
		private readonly calendarModel: CalendarModel,
		private readonly updateUi: () => unknown,
		private readonly selectionBehavior: ListAutoSelectBehavior,
		private readonly offlineStorageSettings: OfflineStorageSettingsModel | null,
	) {
		this.currentQuery = this.search.result()?.query ?? ""
		this._listModel = this.createList()
	}

	async init() {
		this.resultSubscription = this.search.result.map((result) => this.onSearchResultChanged(result))
		this.indexStateSubscription = this.search.indexState.map((newState) => this.onMailIndexStateChanged(newState))
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

	/**
	 * We only care about indexingState when searching mails because indexState only reflects mail indexing
	 */
	isIndexingMails(): boolean {
		return isSameTypeRef(MailTypeRef, this.searchedType) && this.search.indexState().progress > 0
	}

	private readonly entityEventsListener: EntityEventsListener = {
		onEntityUpdatesReceived: async (updates) => {
			for (const update of updates) {
				await this.entityEventReceived(update)
			}
		},
		priority: OnEntityUpdateReceivedPriority.NORMAL,
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		const query = args.query ?? ""
		let restriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			// if restriction is broken replace it with non-broken version
			this.router.routeTo(query, createRestriction(SearchCategoryTypes.mail, null, null, null, [], null))
			return
		}

		this.currentQuery = query
		const lastQuery = this.search.lastQueryString()
		const maxResults = isSameTypeRef(MailTypeRef, restriction.type) ? SEARCH_PAGE_SIZE : null
		const listModel = this._listModel
		// using hasOwnProperty to distinguish case when url is like '/search/mail/query='
		if (Object.hasOwn(args, "query") && this.search.isNewSearch(query, restriction)) {
			listModel.updateLoadingStatus(ListLoadingState.Loading)
			this.search
				.search(
					{
						query,
						restriction,
						minSuggestionCount: 0,
						maxResults,
					},
					this.progressTracker,
				)
				.then(() => listModel.updateLoadingStatus(ListLoadingState.Done))
				.catch(() => listModel.updateLoadingStatus(ListLoadingState.ConnectionLost))
		} else if (lastQuery && this.search.isNewSearch(lastQuery, restriction)) {
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
				this.latestCalendarRestriction = restriction

				// Check if user is trying to search in a birthday calendar while using a free account
				const listIdsOrBirthdayCalendarId = this.extractCalendarListIds(restriction.folderIds)
				if (!listIdsOrBirthdayCalendarId || Array.isArray(listIdsOrBirthdayCalendarId)) {
					this._selectedCalendar = listIdsOrBirthdayCalendarId
				} else if (isBirthdayCalendar(listIdsOrBirthdayCalendarId.toString())) {
					const availableCalendars = this.getAvailableCalendars(true)
					if (availableCalendars.some(isBirthdayCalendarInfo)) {
						this._selectedCalendar = listIdsOrBirthdayCalendarId
					}
					this._selectedCalendar = null
					return
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
		if (this.isIndexingMails()) return
		if (this.loadingAllForSearchResult != null) return

		const currentResult = this.search.result()
		this.loadingAllForSearchResult = currentResult ?? null
		this._listModel.selectAll()
		try {
			while (
				currentResult?.restriction &&
				this.loadingAllForSearchResult &&
				isSameSearchRestriction(currentResult?.restriction, this.loadingAllForSearchResult.restriction) &&
				!this._listModel.isLoadedCompletely()
			) {
				await this._listModel.loadMore()
				if (
					currentResult.restriction &&
					this.loadingAllForSearchResult.restriction &&
					isSameSearchRestriction(currentResult.restriction, this.loadingAllForSearchResult.restriction)
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

		this._startDate = startDate

		// If start date is outside the indexed range, suggest to extend the index and only if confirmed change the selected date.
		// Otherwise, keep the date as it was.
		if (startDate && this.getCategory() === SearchCategoryTypes.mail && startDate.getTime() < this.search.indexState().currentMailIndexTimestamp) {
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

				if (this.offlineStorageSettings?.available() && this.offlineStorageSettings.getTimeRange().getTime() > newState.currentMailIndexTimestamp) {
					// Update offline storage range as index extends so we don't lose what's already indexed if the user logs out before indexing is done
					this.offlineStorageSettings.setTimeRange(new Date(newState.currentMailIndexTimestamp))
				}
			}
		} else {
			this.searchAgain()
		}

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

	selectCalendar(calendarInfo: CalendarInfoBase | null) {
		if (!calendarInfo) {
			this._selectedCalendar = null
		} else if (isBirthdayCalendarInfo(calendarInfo)) {
			this._selectedCalendar = calendarInfo.id
		} else if (isCalendarInfo(calendarInfo)) {
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
	getAimedMailIndexDate(): Date | null {
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

	get mailFilter(): ReadonlySet<MailFilterType> {
		return this.mailFilterType
	}

	setMailFilter(filter: ReadonlySet<MailFilterType>) {
		this.mailFilterType = filter
		this.applyMailFilterIfNeeded()
	}

	private applyMailFilterIfNeeded() {
		if (isSameTypeRef(this.searchedType, MailTypeRef)) {
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
					this.getCalendarLists(),
					this._includeRepeatingEvents,
				),
			)
		} else if (isSameTypeRef(this.searchedType, ContactTypeRef)) {
			this.routeContact((selectedElement?.entry as Contact) ?? null, createRestriction(this.getCategory(), null, null, null, [], null))
		}
	}

	private getCalendarLists(): string[] {
		const selectedCalendar = this.selectedCalendar
		if (!selectedCalendar) {
			return []
		} else if (isBirthdayCalendarInfo(selectedCalendar)) {
			return [this.selectedCalendar.id]
		} else if (isCalendarInfo(selectedCalendar)) {
			return [selectedCalendar.groupRoot.longEvents, selectedCalendar.groupRoot.shortEvents]
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

	private isPossibleABirthdayContactUpdate(update: EntityUpdateData): update is EntityUpdateData<Contact> {
		if (isUpdateForTypeRef(ContactTypeRef, update) && isSameTypeRef(this.searchedType, CalendarEventTypeRef)) {
			const { instanceListId, instanceId } = update
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`)

			return this.listModel.stateStream().items.some((searchEntry) => searchEntry._id[1].endsWith(encodedContactId))
		} else {
			return false
		}
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
		const lastType: TypeRef<Mail | CalendarEvent | Contact> = this.searchedType
		const isPossibleABirthdayContactUpdate = this.isPossibleABirthdayContactUpdate(update)

		if (!isUpdateForTypeRef(lastType, update) && !isPossibleABirthdayContactUpdate) {
			return
		}

		const { instanceListId, instanceId, operation } = update
		const id = [neverNull(instanceListId), instanceId] as const
		const typeRef = update.typeRef

		if (!this.isInSearchResult(typeRef, id) && !isPossibleABirthdayContactUpdate) {
			return
		}

		if ((isUpdateForTypeRef(CalendarEventTypeRef, update) && isSameTypeRef(lastType, CalendarEventTypeRef)) || isPossibleABirthdayContactUpdate) {
			// due to the way calendar event changes are sort of non-local, we throw away the whole list and re-render it if
			// the contents are edited. we do the calculation on a new list and then swap the old list out once the new one is
			// ready
			const selectedItem = this._listModel.getSelectedAsArray().at(0)
			const listModel = this.createList()
			this.setMailFilter(this.mailFilterType)
			this.applyMailFilterIfNeeded()

			if (isPossibleABirthdayContactUpdate && (await this.eventsRepository.canLoadBirthdaysCalendar())) {
				await this.eventsRepository.handleContactEvent(update.operation, [update.instanceListId, update.instanceId])
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

	readonly isPermanentDeleteAllowed: () => boolean = memoizedWithHiddenArgument(
		() => this.getSelectedMails(),
		(selectedMails) => {
			return selectedMails.every((mail) => {
				if (!isMailDeletable(mail)) {
					return false
				}

				const folder = mailLocator.mailModel.getMailFolderForMail(mail)
				return folder != null && isPermanentDeleteAllowedForFolder(folder)
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
				highlightedTokens: this.getHighlightedStrings(),
			})
			// Notify the admin client about the mail being selected
			this.mailOpenedListener.onEmailOpened(mail)
		}
	}

	getHighlightedStrings(): readonly SearchToken[] {
		return this.search.result()?.tokens ?? []
	}

	private createList(): ListElementListModel<SearchResultListEntry> {
		// the list is recreated every time a new search is performed, but not when the current result is extended
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent

		return new ListElementListModel<SearchResultListEntry>({
			fetch: async (lastFetchedEntity: SearchResultListEntry, count: number) => {
				const startId = lastFetchedEntity == null ? GENERATED_MAX_ID : getElementId(lastFetchedEntity)

				await awaitSearchInitialized(this.search)

				const updatedResult = await this.search.getMoreSearchResults(count)
				if (!updatedResult || (isEmpty(updatedResult.results) && !hasMoreResults(updatedResult))) {
					return { items: [], complete: !this.isIndexingMails() }
				}

				const { items, newSearchResult } = await this.loadSearchResults(updatedResult, startId)
				const entries = items.map((instance) => new SearchResultListEntry(instance))
				const complete = !hasMoreResults(newSearchResult) && !this.isIndexingMails()

				return { items: entries, complete }
			},
			loadSingle: async (_listId: Id, elementId: Id) => {
				const lastResult = this.search.result()
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
				} else if (isSameTypeRef(o1.entry._type, MailTypeRef)) {
					if (isOfflineStorageAvailable()) {
						if (this.searchResultIdToIndex == null) {
							return 0
						}

						// SQLite results are already sorted, thus we don't need to do any further sorting here (and we
						// want to avoid changing sort order anyway)
						const resultA = this.searchResultIdToIndex.get(getElementId(o1.entry))
						const resultB = this.searchResultIdToIndex.get(getElementId(o2.entry))

						if (resultA == null || resultB == null) {
							return sortCompareByReverseId(o1.entry, o2.entry)
						}

						return resultA - resultB
					} else {
						// IndexedDb only loads a small amount of results at once, expanding the results as we scroll
						// through the list, and since it's loaded by ID range, results can jump around mid-scroll.
						return sortCompareByReverseId(o1.entry, o2.entry)
					}
				} else {
					return sortCompareByReverseId(o1.entry, o2.entry)
				}
			},
			autoSelectBehavior: () => (isSameTypeRef(this.searchedType, MailTypeRef) ? this.selectionBehavior : ListAutoSelectBehavior.OLDER),
		})
	}

	private isInSearchResult(typeRef: TypeRef<unknown>, id: IdTuple): boolean {
		const result = this.search.result()

		if (result && isSameTypeRef(typeRef, result.restriction.type)) {
			return result.results.some((r) => isSameId(r, id))
		}

		return false
	}

	private onMailIndexStateChanged(newState: SearchIndexStateInfo): void {
		if (
			newState.progress === 0 &&
			isSameTypeRef(MailTypeRef, this.searchedType) &&
			(this._startDate == null || this._startDate.getTime() < newState.currentMailIndexTimestamp)
		) {
			// Indexing stopped and _startDate is outside the index range
			this._startDate = new Date(newState.currentMailIndexTimestamp)
		}

		const currentResult = this.search.result()
		if (currentResult != null && currentResult.currentIndexTimestamp > newState.currentMailIndexTimestamp) {
			// only extend current result if the index was extended
			this.search.extendCurrentResult(newState.currentMailIndexTimestamp)
		}
	}
	private onSearchResultChanged(newResult: SearchResult | null): void {
		if (newResult == null || !isSameTypeRef(MailTypeRef, newResult.restriction.type)) {
			this.mailFilterType = new Set()
		}

		this._listModel.cancelLoadAll()
		this.updateSearchResultIdToIndex(newResult)

		if (
			this.previousResult != null &&
			newResult != null &&
			(areResultsForTheSameQuery(this.previousResult, newResult) || areResultsForTheSameQueryWithRangeExtended(this.previousResult, newResult))
		) {
			if (this.listModel.state.loadingStatus === ListLoadingState.Done) {
				this.listModel.updateLoadingStatus(ListLoadingState.Idle)
			}

			this.applyMailFilterIfNeeded()
		} else {
			this._listModel = this.createList()
			this.applyMailFilterIfNeeded()
			this._listModel.loadInitial()
			this.listStateSubscription?.end(true)
			this.listStateSubscription = this._listModel.stateStream.map((state) => this.onListStateChange(state))
		}

		this.previousResult = newResult
	}

	private async loadSearchResults<T extends SearchableTypes>(
		searchResult: SearchResult,
		startId: Id,
	): Promise<{ items: T[]; newSearchResult: SearchResult }> {
		let items
		if (isSameTypeRef(searchResult.restriction.type, MailTypeRef)) {
			let startIndex = 0

			if (startId !== GENERATED_MAX_ID) {
				if (isOfflineStorageAvailable()) {
					// offline storage is always sorted correctly
					startIndex = searchResult.results.findIndex((id) => id[1] === startId)
				} else {
					// this relies on the results being sorted from newest to oldest ID
					startIndex = searchResult.results.findIndex((id) => id[1] <= startId)
				}

				if (elementIdPart(searchResult.results[startIndex]) === startId) {
					// the start element is already loaded, so we exclude it from the next load
					startIndex++
				} else if (startIndex === -1) {
					// there is nothing in our result that's not loaded yet, so we
					// have nothing to do
					startIndex = Math.max(searchResult.results.length - 1, 0)
				}
			}

			// Ignore count when slicing here because we would have to modify SearchResult too
			const toLoad = searchResult.results.slice(startIndex)
			items = (await this.loadAndFilterInstances(searchResult.restriction.type, toLoad, searchResult, startIndex)) as Mail[]

			// Restore the original sorting order
			if (isOfflineStorageAvailable()) {
				const itemsMapped = collectToMap(items, getElementId)
				items = mapAndFilterNull(searchResult.results, (id) => itemsMapped.get(elementIdPart(id)))
			}
		} else if (isSameTypeRef(searchResult.restriction.type, ContactTypeRef)) {
			try {
				// load all contacts to sort them by name afterwards
				items = await this.loadAndFilterInstances(searchResult.restriction.type, searchResult.results, searchResult, 0)
			} finally {
				this.updateUi()
			}
		} else if (isSameTypeRef(searchResult.restriction.type, CalendarEventTypeRef)) {
			try {
				const { start, end } = searchResult.restriction
				if (start == null || end == null) {
					throw new ProgrammingError("invalid search time range for calendar")
				}
				items = [
					...(await this.calendarFacade.reifyCalendarSearchResult(start, end, searchResult.results)),
					...(await this.getClientOnlyEventsSeries(start, end, searchResult.results)),
				]
			} finally {
				this.updateUi()
			}
		} else {
			// this type is not shown in the search view, e.g. group info
			items = []
		}

		return { items: items, newSearchResult: searchResult }
	}

	private async getClientOnlyEventsSeries(start: number, end: number, events: IdTuple[]) {
		const eventList = await retrieveBirthdayEventsForUser(this.logins, events, this.eventsRepository.getBirthdayEvents())
		return generateCalendarInstancesInRange(eventList, { start, end })
	}

	getAvailableCalendars(includesBirthday: boolean): ReadonlyArray<CalendarInfoBase> {
		return this.calendarModel.getAvailableCalendars(includesBirthday)
	}

	loadCalendarInfos() {
		return this.calendarModel.getCalendarInfos()
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
		this.indexStateSubscription?.end(true)
		this.indexStateSubscription = null
		this.search.sendCancelSignal()
		this.eventController.removeEntityListener(this.entityEventsListener)
	}

	getLabelsForMail(mail: Mail): MailSet[] {
		return mailLocator.mailModel.getLabelsForMail(mail)
	}

	getSearchIndexStateStream(): Stream<SearchIndexStateInfo> {
		return this.search.indexState
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
