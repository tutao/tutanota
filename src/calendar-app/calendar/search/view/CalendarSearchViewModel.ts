import { CalendarSearchResultListEntry } from "./CalendarSearchListView.js"
import { SearchRestriction, SearchResult } from "../../../../common/api/worker/search/SearchTypes.js"
import { EntityEventsListener, EventController } from "../../../../common/api/main/EventController.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, MailTypeRef } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { assertIsEntity2, elementIdPart, GENERATED_MAX_ID, getElementId, isSameId, ListElement } from "../../../../common/api/common/utils/EntityUtils.js"
import { ListLoadingState, ListState } from "../../../../common/gui/base/List.js"
import {
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
import { generateCalendarInstancesInRange, retrieveBirthdayEventsForUser } from "../../../../common/calendar/date/CalendarUtils.js"
import { LoginController } from "../../../../common/api/main/LoginController.js"
import { EntityClient } from "../../../../common/api/common/EntityClient.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../common/api/common/utils/EntityUpdateUtils.js"
import { CalendarInfo } from "../../model/CalendarModel.js"
import m from "mithril"
import { CalendarFacade } from "../../../../common/api/worker/facades/lazy/CalendarFacade.js"
import { ProgressTracker } from "../../../../common/api/main/ProgressTracker.js"
import { ListAutoSelectBehavior } from "../../../../common/misc/DeviceConfig.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { SearchRouter } from "../../../../common/search/view/SearchRouter.js"
import { locator } from "../../../../common/api/main/CommonLocator.js"
import { CalendarEventsRepository } from "../../../../common/calendar/date/CalendarEventsRepository"
import { getClientOnlyCalendars } from "../../gui/CalendarGuiUtils"
import { ListElementListModel } from "../../../../common/misc/ListElementListModel"
import { getStartOfTheWeekOffsetForUser } from "../../../../common/misc/weekOffset"
import { getSharedGroupName } from "../../../../common/sharing/GroupUtils"
import { BIRTHDAY_CALENDAR_BASE_ID } from "../../../../common/api/common/TutanotaConstants"

const SEARCH_PAGE_SIZE = 100

export enum PaidFunctionResult {
	Success,
	PaidSubscriptionNeeded,
}

export class CalendarSearchViewModel {
	private _listModel: ListElementListModel<CalendarSearchResultListEntry>
	get listModel(): ListElementListModel<CalendarSearchResultListEntry> {
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
	get selectedCalendar(): CalendarInfo | string | null {
		const calendars = this.getAvailableCalendars()
		return (
			calendars.find((calendar) => {
				if (typeof calendar.info === "string") {
					return calendar.info === this._selectedCalendar
				}

				// It isn't a string, so it can be only a Calendar Info
				const calendarValue = calendar.info
				return isSameId([calendarValue.groupRoot.longEvents, calendarValue.groupRoot.shortEvents], this._selectedCalendar)
			})?.info ?? null
		)
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
	) {
		this.currentQuery = this.search.result()?.query ?? ""
		this._listModel = this.createList()
	}

	getLazyCalendarInfos() {
		return this.lazyCalendarInfos
	}

	getAvailableCalendars(): Array<{ info: CalendarInfo | string; name: string }> {
		if (this.getLazyCalendarInfos().isLoaded() && this.getUserHasNewPaidPlan().isLoaded()) {
			// Load user's calendar list
			const items: {
				info: CalendarInfo | string
				name: string
			}[] = Array.from(this.getLazyCalendarInfos().getLoaded().values()).map((ci) => ({
				info: ci,
				name: getSharedGroupName(ci.groupInfo, locator.logins.getUserController().userSettingsGroupRoot, true),
			}))

			if (this.getUserHasNewPaidPlan().getSync()) {
				const localCalendars = this.getLocalCalendars().map((cal) => ({
					info: cal.id,
					name: cal.name,
				}))

				items.push(...localCalendars)
			}

			return items
		} else {
			return []
		}
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
			await this.entityEventReceived(update)
		}
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

		this._startDate = restriction.start ? new Date(restriction.start) : null
		this._endDate = restriction.end ? new Date(restriction.end) : null

		// Check if user is trying to search in a client only calendar while using a free account
		const selectedCalendar = this.extractCalendarListIds(restriction.folderIds)
		if (!selectedCalendar || Array.isArray(selectedCalendar)) {
			this._selectedCalendar = selectedCalendar
		} else if (selectedCalendar.toString().includes(BIRTHDAY_CALENDAR_BASE_ID)) {
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
				this.getCalendarLists(),
				this._includeRepeatingEvents,
			),
		)
	}

	private getCalendarLists(): string[] {
		if (typeof this.selectedCalendar === "string") {
			return [this.selectedCalendar]
		} else if (this.selectedCalendar != null) {
			const calendarInfo = this.selectedCalendar
			return [calendarInfo.groupRoot.longEvents, calendarInfo.groupRoot.shortEvents]
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

	private isPossibleABirthdayContactUpdate(update: EntityUpdateData): update is EntityUpdateData<Contact> {
		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			const { instanceListId, instanceId } = update
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`)

			return this.listModel.stateStream().items.some((searchEntry) => searchEntry._id[1].endsWith(encodedContactId))
		} else {
			return false
		}
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

		const typeRef = update.typeRef

		if (!this.isInSearchResult(typeRef, id) && isPossibleABirthdayContactUpdate) {
			return
		}

		// due to the way calendar event changes are sort of non-local, we throw away the whole list and re-render it if
		// the contents are edited. we do the calculation on a new list and then swap the old list out once the new one is
		// ready
		const selectedItem = this.listModel.getSelectedAsArray().at(0)
		const listModel = this.createList()

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

	private createList(): ListElementListModel<CalendarSearchResultListEntry> {
		// since we recreate the list every time we set a new result object,
		// we bind the value of result for the lifetime of this list model
		// at this point
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent
		return new ListElementListModel<CalendarSearchResultListEntry>({
			fetch: async (lastFetchedEntity: CalendarSearchResultListEntry, count: number) => {
				const startId = lastFetchedEntity == null ? GENERATED_MAX_ID : getElementId(lastFetchedEntity)
				const lastResult = this.searchResult
				if (lastResult !== this.searchResult) {
					console.warn("got a fetch request for outdated results object, ignoring")
					// this.searchResults was reassigned, we'll create a new ListElementListModel soon
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
		const eventList = await retrieveBirthdayEventsForUser(this.logins, events, this.eventsRepository.getBirthdayEvents())
		return generateCalendarInstancesInRange(eventList, { start, end })
	}

	sendStopLoadingSignal() {
		this.search.sendCancelSignal()
	}

	getLocalCalendars() {
		return getClientOnlyCalendars(this.logins.getUserController().userId)
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
