import { ListModel } from "../../../../common/misc/ListModel.js"
import { CalendarSearchResultListEntry } from "./CalendarSearchListView.js"
import { SearchRestriction, SearchResult } from "../../../../common/api/worker/search/SearchTypes.js"
import { EntityEventsListener, EventController } from "../../../../common/api/main/EventController.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, Mail, MailTypeRef } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { SomeEntity } from "../../../../common/api/common/EntityTypes.js"
import { OperationType } from "../../../../common/api/common/TutanotaConstants.js"
import { assertIsEntity2, elementIdPart, GENERATED_MAX_ID, getElementId, isSameId, ListElement } from "../../../../common/api/common/utils/EntityUtils.js"
import { ListLoadingState, ListState } from "../../../../common/gui/base/List.js"
import {
	assertNotNull,
	deepEqual,
	downcast,
	getEndOfDay,
	getStartOfDay,
	isSameTypeRef,
	isToday,
	LazyLoaded,
	lazyMemoized,
	neverNull,
	ofClass,
	TypeRef,
} from "@tutao/tutanota-utils"
import { areResultsForTheSameQuery, CalendarSearchModel, hasMoreResults, isSameSearchRestriction } from "../model/CalendarSearchModel.js"
import { NotFoundError } from "../../../../common/api/common/error/RestError.js"
import { createRestriction, decodeCalendarSearchKey, encodeCalendarSearchKey, getRestriction } from "../model/SearchUtils.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { getStartOfTheWeekOffsetForUser } from "../../../../common/calendar/date/CalendarUtils.js"
import { LoginController } from "../../../../common/api/main/LoginController.js"
import { EntityClient } from "../../../../common/api/common/EntityClient.js"
import { containsEventOfType, EntityUpdateData, getEventOfType, isUpdateForTypeRef } from "../../../../common/api/common/utils/EntityUpdateUtils.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import m from "mithril"
import { CalendarFacade } from "../../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { ProgressTracker } from "../../../../common/api/main/ProgressTracker.js"
import { ListAutoSelectBehavior } from "../../../../common/misc/DeviceConfig.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { SearchRouter } from "../../../../common/search/view/SearchRouter.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { SearchResultListEntry } from "../../../../mail-app/search/view/SearchListView.js"

const SEARCH_PAGE_SIZE = 100

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

export type ConfirmCallback = () => Promise<boolean>

export class CalendarSearchViewModel {
	listModel: ListModel<CalendarSearchResultListEntry>

	// Contains load more results even when searchModel doesn't.
	// Load more should probably be moved to the model to update it's result stream.
	_searchResult: SearchResult | null = null
	includeRepeatingEvents: boolean = true
	latestCalendarRestriction: SearchRestriction | null = null

	startDate: Date | null = null // null = current mail index date. this allows us to start the search (and the url) without end date set
	endDate: Date | null = null // null = today
	// Isn't an IdTuple because it is two list ids
	selectedCalendar: readonly [Id, Id] | null = null
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
		private readonly search: CalendarSearchModel,
		private readonly logins: LoginController,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly calendarFacade: CalendarFacade,
		private readonly progressTracker: ProgressTracker,
		private readonly updateUi: () => unknown,
	) {
		this.currentQuery = this.search.result()?.query ?? ""
		this.listModel = this.createList()
	}

	getLazyCalendarInfos() {
		return this.lazyCalendarInfos
	}

	readonly init = lazyMemoized(() => {
		this.resultSubscription = this.search.result.map((result) => {
			if (this._searchResult == null || result == null || !areResultsForTheSameQuery(result, this._searchResult)) {
				this.listModel.cancelLoadAll()

				this._searchResult = result

				this.listModel = this.createList()
				this.listModel.loadInitial()
				this.listStateSubscription?.end(true)
				this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state))
			}
		})

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
			this.router.routeTo(args.query, createRestriction(null, null, [], false))
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

		this.startDate = restriction.start ? new Date(restriction.start) : null
		this.endDate = restriction.end ? new Date(restriction.end) : null
		this.selectedCalendar = this.extractCalendarListIds(restriction.folderIds)
		this.includeRepeatingEvents = restriction.eventSeries ?? true
		this.lazyCalendarInfos.load()
		this.latestCalendarRestriction = restriction

		if (args.id != null) {
			const { start, id } = decodeCalendarSearchKey(args.id)
			this.loadAndSelectIfNeeded(id, ({ entry }: CalendarSearchResultListEntry) => {
				entry = entry as CalendarEvent
				return id === getElementId(entry) && start === entry.startTime.getTime()
			})
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

			this.startDate = start

			return PaidFunctionResult.Success
		}
	}

	searchAgain(): void {
		this.updateSearchUrl()
		this.updateUi()
	}

	private updateSearchUrl() {
		const selectedElement = this.listModel.state.selectedItems.size === 1 ? this.listModel.getSelectedAsArray().at(0) : null
		this.routeCalendar(
			(selectedElement?.entry as CalendarEvent) ?? null,
			createRestriction(
				this.startDate ? getStartOfDay(this.startDate).getTime() : null,
				this.endDate ? getEndOfDay(this.endDate).getTime() : null,
				this.selectedCalendar == null ? [] : [...this.selectedCalendar],
				this.includeRepeatingEvents,
			),
		)
	}

	private routeCalendar(element: CalendarEvent | null, restriction: SearchRestriction) {
		const selectionKey = this.generateSelectionKey(element)
		this.router.routeTo(this.currentQuery, restriction, selectionKey)
	}

	private generateSelectionKey(element: CalendarEvent | null): string | null {
		if (element == null) return null
		return encodeCalendarSearchKey(element)
	}

	private async entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (!isUpdateForTypeRef(CalendarEventTypeRef, update)) {
			return
		}
		const { instanceListId, instanceId, operation } = update
		const id = [neverNull(instanceListId), instanceId] as const
		const typeRef = new TypeRef<SomeEntity>(update.application, update.type)
		if (!this.isInSearchResult(typeRef, id)) {
			return
		}

		// due to the way calendar event changes are sort of non-local, we throw away the whole list and re-render it if
		// the contents are edited. we do the calculation on a new list and then swap the old list out once the new one is
		// ready
		const selectedItem = this.listModel.getSelectedAsArray().at(0)
		const listModel = this.createList()

		await listModel.loadInitial()
		if (selectedItem != null) {
			await listModel.loadAndSelect(elementIdPart(selectedItem._id), () => false)
		}
		this.listModel = listModel
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
				const lastResult = this._searchResult
				if (lastResult !== this._searchResult) {
					console.warn("got a fetch request for outdated results object, ignoring")
					// this._searchResults was reassigned, we'll create a new ListModel soon
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
				const lastResult = this._searchResult
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

	private async loadSearchResults(
		currentResult: SearchResult,
		startId: Id,
		count: number,
	): Promise<{ items: CalendarEvent[]; newSearchResult: SearchResult }> {
		const updatedResult = currentResult

		// we need to override global reference for other functions
		this._searchResult = updatedResult

		let items: CalendarEvent[]
		if (isSameTypeRef(currentResult.restriction.type, CalendarEventTypeRef)) {
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

	sendStopLoadingSignal() {
		this.search.sendCancelSignal()
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
