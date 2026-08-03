import { CalendarInfoBase, CalendarModel, isBirthdayCalendarInfo, isCalendarInfo } from "../../model/CalendarModel"
import Id from "../../../../../ui/translations/id"
import { getElementId, isSameId } from "@tutao/meta"
import { SearchCategoryType, SearchRestriction } from "../../../../common/api/worker/search/SearchTypes"
import { createRestriction, encodeCalendarSearchKey, getSearchUrl, searchQueryEquals } from "../../../../mail-app/search/model/SearchUtils"
import { debounce, getEndOfDay, getStartOfDay, incrementMonth, isNotNull, isSameDayOfDate, onceAsync, YEAR_IN_MILLIS } from "@tutao/utils"
import { ListModel } from "../../../../common/misc/ListModel"
import { CalendarEvent, Contact, ContactTypeRef } from "@tutao/entities/tutanota"
import { LoginController } from "../../../../common/api/main/LoginController"
import { SearchToken } from "../../../../../ui/utils/QueryTokenUtils"
import Stream from "mithril/stream"
import { SearchRouter } from "../../../../common/search/view/SearchRouter"
import { CancelledError } from "@tutao/app-env"
import { EventController } from "../../../../common/api/main/EventController"
import {
	EntityEventsListener,
	EntityUpdateData,
	isUpdateForTypeRef,
	OnEntityUpdateReceivedPriority,
} from "../../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient } from "../../../../../platform-kit/network/EntityClient"
import { OfflineStorageSettingsModel } from "../../../../common/offline/OfflineStorageSettingsModel"
import { getRestriction } from "../model/SearchUtils"
import { isBirthdayCalendar } from "../../../../common/calendar/date/CalendarUtils"
import { onlySingleSelection } from "../../../../../ui/base/ListUtils"
import { ListAutoSelectBehavior } from "../../../../common/misc/DeviceConfig"
import { getStartOfTheWeekOffsetForUser } from "../../../../common/misc/weekOffset"
import { emptyListModel, LiveSearchResult, PaidFunctionResult, SearchableTypes, SearchQuery } from "../../../../common/search/SearchUtils"
import { CalendarSearchModel } from "../../../search/model/CalendarSearchModel"

export class CalendarSearchViewModel {
	#listModel: ListModel<CalendarEvent, Id> = emptyListModel()
	private abortController: AbortController | null = null
	#delayingSearch: boolean = false
	private resultSubscription: Stream<void> | null = null
	private searchResult: LiveSearchResult<unknown> | null = null
	get busy(): boolean {
		return this.#delayingSearch
	}
	get listModel(): ListModel<CalendarEvent, Id> {
		return this.#listModel
	}
	#birthdayContactPreviewData: { id: Id; contact: Contact | null } | null = null
	get birthdayContact(): Contact | null {
		return this.#birthdayContactPreviewData?.contact ?? null
	}
	#startDate: Date | null = null
	#endDate: Date | null = null
	#selectedCalendar: readonly [Id, Id] | Id | null = null // [longListId, shorListId] || birthDay_calendar_id | null
	private currentQuery: string = ""
	#includeRepeatingEvents: boolean = true
	get includeRepeatingEvents(): boolean {
		return this.#includeRepeatingEvents
	}
	get selectedCalendar(): CalendarInfoBase | null {
		const calendars = this.getAvailableCalendars(true)
		const selectedCalendar =
			calendars.find((calendarInfo) => {
				if (isBirthdayCalendarInfo(calendarInfo)) {
					return calendarInfo.id === this.#selectedCalendar
				}
				if (isCalendarInfo(calendarInfo)) {
					const groupRoot = calendarInfo.groupRoot
					return isSameId([groupRoot.longEvents, groupRoot.shortEvents], this.#selectedCalendar)
				}
			}) ?? null
		return selectedCalendar
	}
	constructor(
		private readonly calendarModel: CalendarModel,
		private readonly logins: LoginController,
		private readonly search: CalendarSearchModel,
		private readonly router: SearchRouter,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly updateUi: () => unknown,
		private readonly offlineStorageSettings: OfflineStorageSettingsModel | null,
	) {}
	get startDate(): Date | null {
		return this.#startDate
	}
	get endDate(): Date {
		if (this.#endDate) {
			return this.#endDate
		} else {
			let returnDate = incrementMonth(new Date(), 3)
			returnDate.setDate(0)
			return returnDate
		}
	}
	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}
	getAvailableCalendars(includesBirthday: boolean): ReadonlyArray<CalendarInfoBase> {
		return this.calendarModel.getAvailableCalendars(includesBirthday)
	}

	loadCalendarInfos() {
		return this.calendarModel.getCalendarInfos()
	}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null))
	}

	canSelectTimePeriod() {
		return !this.logins.getUserController().isFreeAccount()
	}

	checkDates(startDate: Date | null, endDate: Date | null): "long" | "extendIndex" | "startafterend" | null {
		if (startDate && endDate) {
			if (startDate.getTime() > endDate.getTime()) {
				return "startafterend"
			} else {
				if (startDate && endDate.getTime() - startDate.getTime() > YEAR_IN_MILLIS) {
					return "long"
				}
			}
		}
		return null
	}

	selectStartDate(startDate: Date | null) {
		if (isSameDayOfDate(this.startDate, startDate)) {
			return PaidFunctionResult.Success
		}

		if (!this.canSelectTimePeriod()) {
			return PaidFunctionResult.PaidSubscriptionNeeded
		}

		this.#startDate = startDate
		this.searchAgain()
		return PaidFunctionResult.Success
	}

	selectEndDate(endDate: Date) {
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

	private searchAgain() {
		this.updateSearchUrl()
		this.updateUi()
	}

	selectCalendar(calendarInfo: CalendarInfoBase | null) {
		if (!calendarInfo) {
			this.#selectedCalendar = null
		} else if (isBirthdayCalendarInfo(calendarInfo)) {
			this.#selectedCalendar = calendarInfo.id
		} else if (isCalendarInfo(calendarInfo)) {
			this.#selectedCalendar = [calendarInfo.groupRoot.longEvents, calendarInfo.groupRoot.shortEvents]
		}
		this.searchAgain()
	}

	selectIncludeRepeatingEvents(include: boolean) {
		this.#includeRepeatingEvents = include
		this.searchAgain()
	}

	getSelectedEvents(): CalendarEvent[] {
		return this.#listModel.getSelectedAsArray()
	}

	getUserId() {
		return this.logins.getUserController().userId
	}

	sendStopLoadingSignal() {
		this.abortController?.abort()
	}
	getHighlightedStrings(): readonly SearchToken[] {
		return this.searchResult?.searchResult.tokens ?? []
	}
	getCurrentQuery(): string {
		return this.currentQuery
	}

	onSearchQueryUpdated(query: string) {
		this.currentQuery = query
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
		this.routeCalendar(
			selectedElement ?? null,
			createRestriction(
				SearchCategoryType.calendar,
				this.#startDate ? getStartOfDay(this.#startDate).getTime() : null,
				this.#endDate ? getEndOfDay(this.#endDate).getTime() : null,
				null,
				this.getCalendarLists(),
				this.#includeRepeatingEvents,
			),
		)
	}
	private routeCalendar(event: CalendarEvent | null, restriction: SearchRestriction) {
		const selectionKey = event ? encodeCalendarSearchKey(event) : null
		this.router.routeTo(this.currentQuery, restriction, selectionKey)
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

	readonly init = onceAsync(async () => {
		this.eventController.addEntityListener(this.entityEventsListener)
		await this.offlineStorageSettings?.init()
	})
	private readonly entityEventsListener: EntityEventsListener = {
		onEntityUpdatesReceived: async (updates) => {
			for (const update of updates) {
				await this.entityEventReceived(update)
			}
		},
		priority: OnEntityUpdateReceivedPriority.NORMAL,
	}
	private async entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(ContactTypeRef, update) && this.#birthdayContactPreviewData?.id === update.instanceId) {
			const updatedContact = await this.entityClient.load(ContactTypeRef, [update.instanceListId, update.instanceId])
			if (getElementId(updatedContact) === this.#birthdayContactPreviewData.id) {
				this.#birthdayContactPreviewData.contact = updatedContact
				this.updateUi()
			}
		}
	}
	private extractCalendarListIds(listIds: string[]): readonly [string, string] | string | null {
		if (listIds.length < 1) return null
		else if (listIds.length === 1) return listIds[0]

		return [listIds[0], listIds[1]]
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		const query: string = args.query ?? ""
		let restriction: SearchRestriction
		try {
			restriction = getRestriction(requestedPath)
		} catch (e) {
			// if restriction is broken replace it with non-broken version
			this.router.routeTo(query, createRestriction(SearchCategoryType.calendar, null, null, null, [], null))
			return
		}

		const lastQuery = this.currentQuery
		this.currentQuery = query
		const maxResults = null
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
			this.stopLoadAll()
			this.abortController?.abort()
			this.#startDate = restriction.start ? new Date(restriction.start) : null
			this.#endDate = restriction.end ? new Date(restriction.end) : null
			this.#includeRepeatingEvents = restriction.eventSeries ?? true

			// Check if user is trying to search in a birthday calendar while using a free account
			const listIdsOrBirthdayCalendarId = this.extractCalendarListIds(restriction.folderIds)
			if (!listIdsOrBirthdayCalendarId || Array.isArray(listIdsOrBirthdayCalendarId)) {
				this.#selectedCalendar = listIdsOrBirthdayCalendarId
			} else if (isBirthdayCalendar(listIdsOrBirthdayCalendarId.toString())) {
				const availableCalendars = this.getAvailableCalendars(true)
				if (availableCalendars.some(isBirthdayCalendarInfo)) {
					this.#selectedCalendar = listIdsOrBirthdayCalendarId
				}
				this.#selectedCalendar = null
				return
			}

			const restartSearch = () => {
				this.abortController = new AbortController()

				const searchPromise = this.search
					.coolNewSearchCalendar(
						{
							query: searchQuery ?? "",
							restriction,
							maxResults,
						},
						this.abortController.signal,
					)
					.then((result) => {
						this.applyLiveSearchResults(result)
						return result
					})
				const listModel = this.createList(searchPromise, restartSearch)
				this.#listModel = listModel
				listModel.loadInitial()

				this.loadAndSelectIfNeeded(args.id, (item) => encodeCalendarSearchKey(item) === args.id)
			}

			restartSearch()
		}
	}

	private createList(deferredResult: Promise<LiveSearchResult<CalendarEvent>>, restartSearch: () => unknown): ListModel<CalendarEvent, Id> {
		// the list is recreated every time a new search is performed, but not when the current result is extended
		// note in case of refactor: the fact that the list updates the URL every time it changes
		// its state is a major source of complexity and makes everything very order-dependent

		let initialLoadAborted = false
		return new ListModel<CalendarEvent, Id>({
			fetch: async (lastFetchedEntity: CalendarEvent | null, count: number) => {
				let result
				try {
					result = await deferredResult
					initialLoadAborted = false
				} catch (e) {
					if (e instanceof CancelledError) {
						if (initialLoadAborted) {
							restartSearch()
						}
						initialLoadAborted = true
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
				return { items: newItems, complete }
			},
			getItemId(item: CalendarEvent): Id {
				return encodeCalendarSearchKey(item)
			},
			isSameId(id1, id2): boolean {
				return isSameId(id1, id2)
			},
			sortCompare: (o1: CalendarEvent, o2: CalendarEvent) => o1.startTime.getTime() - o2.startTime.getTime(),
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
	}

	private applyLiveSearchResults(result: LiveSearchResult<SearchableTypes>) {
		this.searchResult = result
		result.updates.map((update) => {
			switch (update.type) {
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
	private loadAndSelectIfNeeded(id: string | null, finder?: (a: CalendarEvent) => boolean) {
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
	private handleLoadAndSelection(id: string, finder: ((a: CalendarEvent) => boolean) | undefined) {
		const listModel = this.#listModel
		let iterations = 0
		this.#listModel.loadAndSelect(finder ?? ((item) => isSameId(getElementId(item), id)), () => listModel !== this.#listModel || iterations++ > 10)
	}
	stopLoadAll() {
		this.#listModel.cancelLoadAll()
	}

	dispose() {
		this.searchResult?.dispose()
		this.abortController?.abort()
		this.eventController.removeEntityListener(this.entityEventsListener)
		this.stopLoadAll()
		this.resultSubscription?.end(true)
		this.resultSubscription = null
	}
}
