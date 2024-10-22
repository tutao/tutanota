import { ListModel } from "../../../../common/misc/ListModel.js"
import { CalendarSearchResultListEntry } from "./CalendarSearchListView.js"
import { SearchRestriction, SearchResult } from "../../../../common/api/worker/search/SearchTypes.js"
import { EntityEventsListener, EventController } from "../../../../common/api/main/EventController.js"
import { CalendarEvent, CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { SomeEntity } from "../../../../common/api/common/EntityTypes.js"
import { CLIENT_ONLY_CALENDARS, OperationType } from "../../../../common/api/common/TutanotaConstants.js"
import { assertIsEntity2, elementIdPart, GENERATED_MAX_ID, getElementId, isSameId, ListElement } from "../../../../common/api/common/utils/EntityUtils.js"
import { ListLoadingState, ListState } from "../../../../common/gui/base/List.js"
import {
	assertNotNull,
	deepEqual,
	downcast,
	getEndOfDay,
	getStartOfDay,
	incrementMonth,
	isSameDayOfDate,
	isSameTypeRef,
	LazyLoaded,
	lazyMemoized,
	neverNull,
	ofClass,
	stringToBase64,
	TypeRef,
	YEAR_IN_MILLIS,
} from "@tutao/tutanota-utils"
import { areResultsForTheSameQuery, CalendarSearchModel, hasMoreResults, isSameSearchRestriction } from "../model/CalendarSearchModel.js"
import { NotFoundError } from "../../../../common/api/common/error/RestError.js"
import { createRestriction, decodeCalendarSearchKey, encodeCalendarSearchKey, getRestriction } from "../model/SearchUtils.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import {
	generateCalendarInstancesInRange,
	getStartOfTheWeekOffsetForUser,
	retrieveClientOnlyEventsForUser,
} from "../../../../common/calendar/date/CalendarUtils.js"
import { LoginController } from "../../../../common/api/main/LoginController.js"
import { EntityClient } from "../../../../common/api/common/EntityClient.js"
import { containsEventOfType, EntityUpdateData, getEventOfType, isUpdateForTypeRef } from "../../../../common/api/common/utils/EntityUpdateUtils.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import m from "mithril"
import { CalendarFacade } from "../../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { ProgressTracker } from "../../../../common/api/main/ProgressTracker.js"
import { ClientOnlyCalendarsInfo, ListAutoSelectBehavior } from "../../../../common/misc/DeviceConfig.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { SearchRouter } from "../../../../common/search/view/SearchRouter.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { CalendarEventsRepository } from "../../../../common/calendar/date/CalendarEventsRepository"
import { getClientOnlyCalendars } from "../../gui/CalendarGuiUtils"

const SEARCH_PAGE_SIZE = 100

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

export class CalendarSearchViewModel {
	private _listModel: ListModel<CalendarSearchResultListEntry>
	get listModel(): ListModel<CalendarSearchResultListEntry> {
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

	private _startDate: Date | null = null // null = the beginning of the current month
	get startDate(): Date | null {
		let returnDate = this._startDate
		if (!returnDate) {
			returnDate = new Date()
			returnDate.setDate(1)
		}
		return returnDate
	}

	private _endDate: Date | null = null // null = end of 2 months in the future
	get endDate(): Date {
		let returnDate = this._endDate
		if (!returnDate) {
			returnDate = incrementMonth(new Date(), 3)
			returnDate.setDate(0)
		}
		return returnDate
	}

	// isn't an IdTuple because it is two list ids
	private _selectedCalendar: readonly [Id, Id] | string | null = null
	get selectedCalendar(): readonly [Id, Id] | string | null {
		return this._selectedCalendar
	}

	// Contains load more results even when searchModel doesn't.
	// Load more should probably be moved to the model to update it's result stream.
	private searchResult: SearchResult | null = null
	private latestCalendarRestriction: SearchRestriction | null = null
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

	constructor(
		readonly router: SearchRouter,
		private readonly search: CalendarSearchModel,
		private readonly logins: LoginController,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly calendarFacade: CalendarFacade,
		private readonly progressTracker: ProgressTracker,
		private readonly eventsRepository: CalendarEventsRepository,
		private readonly updateUi: () => unknown,
		private readonly localCalendars: Map<Id, ClientOnlyCalendarsInfo>,
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

	readonly init = lazyMemoized(() => {
		this.resultSubscription = this.search.result.map((result) => {
			if (this.searchResult == null || result == null || !areResultsForTheSameQuery(result, this.searchResult)) {
				this.listModel.cancelLoadAll()

				this.searchResult = result

				this._listModel = this.createList()
				this.listModel.loadInitial()
				this.listStateSubscription?.end(true)
				this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state))
			}
		})

		this.eventController.addEntityListener(this.entityEventsListener)
	})

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
			this.router.routeTo(args.query, createRestriction(null, null, [], false))
			return
		}

		this.currentQuery = args.query
		const lastQuery = this.search.lastQueryString()
		const maxResults = isSameTypeRef(MailTypeRef, restriction.type) ? SEARCH_PAGE_SIZE : null
		const listModel = this.listModel
		// using hasOwnProperty to distinguish case when url is like '/search/mail/query='
		if (args.hasOwnProperty("query") && this.search.isNewSearch(args.query, restriction)) {
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
		} else if (!args.hasOwnProperty("query") && !lastQuery) {
			// no query at all yet
			listModel.updateLoadingStatus(ListLoadingState.Done)
		}

		this._startDate = restriction.start ? new Date(restriction.start) : null
		this._endDate = restriction.end ? new Date(restriction.end) : null

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

		this._includeRepeatingEvents = restriction.eventSeries ?? true
		this.lazyCalendarInfos.load()
		this.userHasNewPaidPlan.load()
		this.latestCalendarRestriction = restriction

		if (args.id != null) {
			try {
				const { start, id } = decodeCalendarSearchKey(args.id)
				this.loadAndSelectIfNeeded(id, ({ entry }: CalendarSearchResultListEntry) => {
					entry = entry as CalendarEvent
					return id === getElementId(entry) && start === entry.startTime.getTime()
				})
			} catch (err) {
				console.log("Invalid ID, selecting none")
				this.listModel.selectNone()
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

		if (!this.listModel.isItemSelected(id)) {
			this.handleLoadAndSelection(id, finder)
		}
	}

	private handleLoadAndSelection(id: string, finder: ((a: ListElement) => boolean) | undefined) {
		if (this.listModel.isLoadedCompletely()) {
			return this.selectItem(id, finder)
		}

		const listStateStream = stream.combine((a) => a(), [this.listModel.stateStream])
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
		this.loadingAllForSearchResult = this.searchResult ?? null
		this.listModel.selectAll()
		try {
			while (
				this.searchResult?.restriction &&
				this.loadingAllForSearchResult &&
				isSameSearchRestriction(this.searchResult?.restriction, this.loadingAllForSearchResult.restriction) &&
				!this.listModel.isLoadedCompletely()
			) {
				await this.listModel.loadMore()
				if (
					this.searchResult.restriction &&
					this.loadingAllForSearchResult.restriction &&
					isSameSearchRestriction(this.searchResult.restriction, this.loadingAllForSearchResult.restriction)
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

	canSelectTimePeriod(): boolean {
		return !this.logins.getUserController().isFreeAccount()
	}

	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}

	selectCalendar(calendarInfo: CalendarInfo | string | null) {
		if (typeof calendarInfo === "string" || calendarInfo == null) {
			this._selectedCalendar = calendarInfo
		} else {
			this._selectedCalendar = [calendarInfo.groupRoot.longEvents, calendarInfo.groupRoot.shortEvents]
		}
		this.searchAgain()
	}

	selectStartDate(startDate: Date | null): PaidFunctionResult {
		if (isSameDayOfDate(this.startDate, startDate)) {
			return PaidFunctionResult.Success
		}

		if (!this.canSelectTimePeriod()) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		}

		this._startDate = startDate

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

	selectIncludeRepeatingEvents(include: boolean) {
		this._includeRepeatingEvents = include
		this.searchAgain()
	}

	private searchAgain(): void {
		this.updateSearchUrl()
		this.updateUi()
	}

	private updateSearchUrl() {
		const selectedElement = this.listModel.state.selectedItems.size === 1 ? this.listModel.getSelectedAsArray().at(0) : null
		this.routeCalendar(
			(selectedElement?.entry as CalendarEvent) ?? null,
			createRestriction(
				this._startDate ? getStartOfDay(this._startDate).getTime() : null,
				this._endDate ? getEndOfDay(this._endDate).getTime() : null,
				this.getFolderIds(),
				this._includeRepeatingEvents,
			),
		)
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

	private generateSelectionKey(element: CalendarEvent | null): string | null {
		if (element == null) return null
		return encodeCalendarSearchKey(element)
	}

	private isPossibleABirthdayContactUpdate(update: EntityUpdateData): boolean {
		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			const { instanceListId, instanceId } = update
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`)

			return this.listModel.stateStream().items.some((searchEntry) => searchEntry._id[1].endsWith(encodedContactId))
		}

		return false
	}

	private isSelectedEventAnUpdatedBirthday(update: EntityUpdateData): boolean {
		if (isUpdateForTypeRef(ContactTypeRef, update)) {
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
		const isPossibleABirthdayContactUpdate = this.isPossibleABirthdayContactUpdate(update)

		if (!isUpdateForTypeRef(CalendarEventTypeRef, update) && !isPossibleABirthdayContactUpdate) {
			return
		}

		const { instanceListId, instanceId, operation } = update
		const id = [neverNull(instanceListId), instanceId] as const
		const typeRef = new TypeRef<SomeEntity>(update.application, update.type)
		if (!this.isInSearchResult(typeRef, id) && isPossibleABirthdayContactUpdate) {
			return
		}

		// due to the way calendar event changes are sort of non-local, we throw away the whole list and re-render it if
		// the contents are edited. we do the calculation on a new list and then swap the old list out once the new one is
		// ready
		const selectedItem = this.listModel.getSelectedAsArray().at(0)
		const listModel = this.createList()

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
		this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state))
		this.updateSearchUrl()
		this.updateUi()
	}

	getSelectedEvents(): CalendarEvent[] {
		return this.listModel
			.getSelectedAsArray()
			.map((e) => e.entry)
			.filter(assertIsEntity2(CalendarEventTypeRef))
	}

	private onListStateChange(newState: ListState<CalendarSearchResultListEntry>) {
		this.updateSearchUrl()
		this.updateUi()
	}

	private createList(): ListModel<CalendarSearchResultListEntry> {
		// since we recreate the list every time we set a new result object,
		// we bind the value of result for the lifetime of this list model
		// at this point
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent
		return new ListModel<CalendarSearchResultListEntry>({
			fetch: async (lastFetchedEntity: CalendarSearchResultListEntry, count: number) => {
				const startId = lastFetchedEntity == null ? GENERATED_MAX_ID : getElementId(lastFetchedEntity)
				const lastResult = this.searchResult
				if (lastResult !== this.searchResult) {
					console.warn("got a fetch request for outdated results object, ignoring")
					// this.searchResults was reassigned, we'll create a new ListModel soon
					return { items: [], complete: true }
				}

				if (!lastResult || (lastResult.results.length === 0 && !hasMoreResults(lastResult))) {
					return { items: [], complete: true }
				}

				const { items, newSearchResult } = await this.loadSearchResults(lastResult, startId, count)
				const entries = items.map((instance) => new CalendarSearchResultListEntry(instance))
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
						.then((entity) => new CalendarSearchResultListEntry(entity))
						.catch(
							ofClass(NotFoundError, (_) => {
								return null
							}),
						)
				} else {
					return null
				}
			},
			sortCompare: (o1: CalendarSearchResultListEntry, o2: CalendarSearchResultListEntry) =>
				downcast(o1.entry).startTime.getTime() - downcast(o2.entry).startTime.getTime(),
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
	}

	isInSearchResult(typeRef: TypeRef<unknown>, id: IdTuple): boolean {
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

	private async loadSearchResults(
		currentResult: SearchResult,
		startId: Id,
		count: number,
	): Promise<{ items: CalendarEvent[]; newSearchResult: SearchResult }> {
		const updatedResult = currentResult
		// we need to override global reference for other functions
		this.searchResult = updatedResult

		let items: CalendarEvent[]
		if (isSameTypeRef(currentResult.restriction.type, CalendarEventTypeRef)) {
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

	sendStopLoadingSignal() {
		this.search.sendCancelSignal()
	}

	getLocalCalendars() {
		return getClientOnlyCalendars(this.logins.getUserController().userId, this.localCalendars)
	}

	dispose() {
		this.stopLoadAll()
		this.resultSubscription?.end(true)
		this.resultSubscription = null
		this.listStateSubscription?.end(true)
		this.listStateSubscription = null
		this.search.sendCancelSignal()
		this.eventController.removeEntityListener(this.entityEventsListener)
	}
}
