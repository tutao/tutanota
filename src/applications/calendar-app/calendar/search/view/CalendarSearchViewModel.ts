import { CalendarInfo, CalendarInfoBase, CalendarModel, isBirthdayCalendarInfo, isCalendarInfo } from "../../model/CalendarModel"
import Id from "../../../../../ui/translations/id"
import { getElementId, isSameId, isSameIdTuple, isSameSingleId } from "@tutao/meta"
import { SearchCategoryType, SearchRestriction } from "../../../../common/api/worker/search/SearchTypes"
import {
	assertNotNull,
	debounce,
	getEndOfDay,
	getStartOfDay,
	incrementMonth,
	isNotNull,
	isSameDayOfDate,
	Nullable,
	onceAsync,
	YEAR_IN_MILLIS,
} from "@tutao/utils"
import { ListModel } from "../../../../common/misc/ListModel"
import { CalendarEvent, Contact, ContactTypeRef } from "@tutao/entities/tutanota"
import { LoginController } from "../../../../common/api/main/LoginController"
import { SearchToken } from "../../../../../ui/utils/QueryTokenUtils"
import Stream from "mithril/stream"
import { SearchRouter } from "../../../../common/search/view/SearchRouter"
import { CancelledError } from "@tutao/app-env"
import { EventController } from "../../../../common/api/main/EventController"
import {
	EntityUpdateData,
	EntityUpdatesListener,
	isUpdateForTypeRef,
	ListenerPriority,
} from "../../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient } from "../../../../../platform-kit/network/EntityClient"
import { createCalendarRestriction, encodeCalendarSearchKey, getCalendarRestriction } from "../model/CalendarSearchUtils"
import { birthdayCalendarEventContactId, isBirthdayCalendar, isBirthdayEvent } from "../../../../common/calendar/date/CalendarUtils"
import { onlySingleSelection } from "../../../../../ui/base/ListUtils"
import { ListAutoSelectBehavior } from "../../../../common/misc/DeviceConfig"
import { getStartOfTheWeekOffsetForUser } from "../../../../common/misc/weekOffset"
import {
	createEmptyRestriction,
	emptyListModel,
	getSearchUrl,
	isNewSearch,
	LiveSearchResult,
	PaidFunctionResult,
	SearchableTypes,
	SearchQuery,
} from "../../../../common/search/SearchUtils"
import { CalendarSearchModel } from "../../../search/model/CalendarSearchModel"
import { getEventWithDefaultTimes, setNextHalfHour } from "../../../../common/api/common/utils/CommonCalendarUtils"
import { CalendarEventModel, CalendarEventModelFactory, CalendarOperation } from "../../gui/eventeditor-model/CalendarEventModel"
import { MailboxModel } from "../../../../common/mailFunctionality/MailboxModel"
import { ListState } from "../../../../../ui/base/List"
import { CalendarEventPreviewViewModel } from "../../gui/eventpopup/CalendarEventPreviewViewModel"
import { isDriveEnabled } from "../../../../common/misc/DriveUtils"

type EventPreviewData =
	| {
			type: "birthday"
			id: IdTuple
			contact: Contact | null
	  }
	| {
			type: "event"
			id: IdTuple
			model: CalendarEventPreviewViewModel | null
	  }

interface SelectedCalendarId {
	birthdayCalendarId: Id | null
	longListShortList: IdTuple | null
}

export class CalendarSearchViewModel {
	#listModel: ListModel<CalendarEvent, Id> = emptyListModel()
	private abortController: AbortController | null = null
	#delayingSearch: boolean = false
	private searchResult: LiveSearchResult<unknown> | null = null
	private listStateSubscription: Stream<void> | null = null
	get busy(): boolean {
		return this.#delayingSearch
	}
	get listModel(): ListModel<CalendarEvent, Id> {
		return this.#listModel
	}

	#eventPreviewData: EventPreviewData | null = null
	get birthdayContact(): Contact | null {
		return this.#eventPreviewData?.type === "birthday" ? this.#eventPreviewData.contact : null
	}
	get eventPreviewData(): CalendarEventPreviewViewModel | null {
		return this.#eventPreviewData?.type === "event" ? this.#eventPreviewData.model : null
	}

	#startDate: Date | null = null
	#endDate: Date | null = null
	#selectedCalendar: SelectedCalendarId | null = null
	private currentQuery: string = ""
	#includeRepeatingEvents: boolean = true
	get includeRepeatingEvents(): boolean {
		return this.#includeRepeatingEvents
	}
	get selectedCalendar(): CalendarInfoBase | null {
		const calendars = this.getAvailableCalendars(true)
		const selectedCalendar =
			calendars.find((calendarInfo) => {
				if (this.#selectedCalendar == null) {
					return false
				}
				if (isBirthdayCalendarInfo(calendarInfo)) {
					return calendarInfo.id === this.#selectedCalendar.birthdayCalendarId
				} else if (isCalendarInfo(calendarInfo)) {
					const groupRoot = calendarInfo.groupRoot
					return isSameIdTuple([groupRoot.longEvents, groupRoot.shortEvents], this.#selectedCalendar.longListShortList)
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
		private readonly mailboxModel: MailboxModel,
		private readonly createCalendarEventModel: CalendarEventModelFactory,
		private readonly createEventPreviewModel: (
			selectedEvent: CalendarEvent,
			calendars: ReadonlyMap<string, CalendarInfo>,
			highlightedTokens: readonly SearchToken[],
		) => Promise<CalendarEventPreviewViewModel>,
		private readonly updateUi: () => unknown,
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

	readonly init = onceAsync(async () => {
		this.eventController.addEntityUpdatesListener(this.entityEventsListener)
	})

	isDriveEnabled(): boolean {
		return isDriveEnabled(this.logins)
	}

	getStartOfTheWeekOffset(): number {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot)
	}
	getAvailableCalendars(includesBirthday: boolean): ReadonlyArray<CalendarInfoBase> {
		return this.calendarModel.getAvailableCalendars(includesBirthday)
	}

	loadCalendarInfos(): Promise<ReadonlyMap<Id, CalendarInfo>> {
		return this.calendarModel.getCalendarInfos()
	}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createEmptyRestriction(category))
	}

	canSelectTimePeriod(): boolean {
		return !this.logins.getUserController().isFreeAccount()
	}

	checkDates(startDate: Date | null, endDate: Date | null): "long" | "startafterend" | null {
		if (startDate && endDate) {
			if (startDate.getTime() > endDate.getTime()) {
				return "startafterend"
			} else if (startDate && endDate.getTime() - startDate.getTime() > YEAR_IN_MILLIS) {
				return "long"
			}
		}
		return null
	}

	selectStartDate(startDate: Date | null): PaidFunctionResult {
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

	private searchAgain() {
		this.updateSearchUrl()
		this.updateUi()
	}

	selectCalendar(calendarInfo: CalendarInfoBase | null) {
		if (!calendarInfo) {
			this.#selectedCalendar = null
		} else if (isBirthdayCalendarInfo(calendarInfo)) {
			this.#selectedCalendar = { birthdayCalendarId: calendarInfo.id, longListShortList: null }
		} else if (isCalendarInfo(calendarInfo)) {
			this.#selectedCalendar = { birthdayCalendarId: null, longListShortList: [calendarInfo.groupRoot.longEvents, calendarInfo.groupRoot.shortEvents] }
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

	/**
	 * Abort current search.
	 * Searching calendar events requires loading and calculating occurrences for the whole time period. User has an
	 * option to abort this if it takes too long.
	 */
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
			createCalendarRestriction({
				start: this.#startDate ? getStartOfDay(this.#startDate).getTime() : null,
				end: this.#endDate ? getEndOfDay(this.#endDate).getTime() : null,
				folderIds: this.getCalendarLists(),
				eventSeries: this.#includeRepeatingEvents,
			}),
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

	private readonly entityEventsListener: EntityUpdatesListener = {
		id: "CalendarSearchViewModel",
		onEntityUpdatesReceived: async (updates) => {
			for (const update of updates) {
				await this.entityEventReceived(update)
			}
		},
		priority: ListenerPriority.NORMAL,
	}

	private async entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(ContactTypeRef, update) && this.isPreviewingContact([assertNotNull(update.instanceListId), update.instanceId])) {
			await this.loadBirthdayContact([assertNotNull(update.instanceListId), update.instanceId])
		}
	}

	private isPreviewingContact(contactId: IdTuple): boolean {
		return this.#eventPreviewData != null && this.#eventPreviewData.type === "birthday" && isSameId(this.#eventPreviewData.id, contactId)
	}

	private isPreviewingEvent(eventId: IdTuple): boolean {
		return this.#eventPreviewData != null && this.#eventPreviewData.type === "event" && isSameId(this.#eventPreviewData.id, eventId)
	}

	private async loadEventPreview(selectedEvent: CalendarEvent) {
		const calendars = this.calendarModel.getAvailableCalendars(false)
		const calendarInfosMap = new Map(calendars.map((calendarInfo) => [calendarInfo.id, calendarInfo]))
		void this.createEventPreviewModel(selectedEvent, calendarInfosMap, this.searchResult?.searchResult.tokens ?? []).then(async (model) => {
			await model.sanitizeDescription()
			// only change data if selection hasn't changed
			if (this.isPreviewingEvent(selectedEvent._id)) {
				this.#eventPreviewData = { type: "event", id: selectedEvent._id, model: model }
				this.updateUi()
			}
		})
	}

	private async loadBirthdayContact(id: IdTuple) {
		const updatedContact = await this.entityClient.load(ContactTypeRef, id)
		// only update if the selection hasn't changed while loading
		if (this.isPreviewingContact(id)) {
			this.#eventPreviewData = { type: "birthday", id: id, contact: updatedContact }
			this.updateUi()
		}
	}

	private extractCalendarListIds(listIds: string[]): Nullable<SelectedCalendarId> {
		if (listIds.length < 1) return null
		else if (listIds.length === 1) return { birthdayCalendarId: listIds[0], longListShortList: null }

		return { birthdayCalendarId: null, longListShortList: [listIds[0], listIds[1]] }
	}

	onNewUrl(args: Record<string, any>, _requestedPath: string) {
		const restriction = getCalendarRestriction(args)

		this.currentQuery = args.query ?? this.currentQuery
		const newQuery: SearchQuery = { query: this.currentQuery, restriction, maxResults: null }
		if (isNewSearch(this.searchResult, newQuery)) {
			this.searchResult?.dispose()
			this.stopLoadAll()
			this.abortController?.abort()
			this.#startDate = restriction.start ? new Date(restriction.start) : null
			this.#endDate = restriction.end ? new Date(restriction.end) : null
			this.#includeRepeatingEvents = restriction.eventSeries ?? true

			// Check if user is trying to search in a birthday calendar while using a free account
			const listIdsOrBirthdayCalendarId = this.extractCalendarListIds(restriction.folderIds)
			if (listIdsOrBirthdayCalendarId == null || listIdsOrBirthdayCalendarId.longListShortList != null) {
				this.#selectedCalendar = listIdsOrBirthdayCalendarId
			} else if (isBirthdayCalendar(listIdsOrBirthdayCalendarId.toString())) {
				const availableCalendars = this.getAvailableCalendars(true)
				if (availableCalendars.some(isBirthdayCalendarInfo)) {
					this.#selectedCalendar = listIdsOrBirthdayCalendarId
				}
				this.#selectedCalendar = null
				return
			}

			// Calendar search can be canceled and restarted again via "load more"
			const restartSearch = () => {
				this.abortController = new AbortController()

				const searchPromise = this.search.searchCalendar(newQuery, this.abortController.signal).then((result) => {
					this.applyLiveSearchResults(result)
					return result
				})
				this.listStateSubscription?.end(true)
				const listModel = this.createList(searchPromise, restartSearch)
				this.#listModel = listModel
				this.listStateSubscription = listModel.stateStream.map((state) => {
					this.onListStateUpdate(state)
				})

				void listModel.loadInitial()
				this.loadAndSelectIfNeeded(args.id, (item) => encodeCalendarSearchKey(item) === args.id)
			}

			restartSearch()
		}
	}

	private onListStateUpdate(state: ListState<CalendarEvent>) {
		// handled birthday contact preview data
		const selectedEvent = onlySingleSelection(state)
		if (selectedEvent != null && isBirthdayEvent(selectedEvent.uid)) {
			const contactId = birthdayCalendarEventContactId(selectedEvent._id)
			if (contactId && this.isPreviewingContact(contactId)) {
				// nothing to do
			} else if (contactId == null) {
				// not a valid contact id? nothing to do
				this.#eventPreviewData = null
			} else {
				this.#eventPreviewData = { type: "birthday", id: contactId, contact: null }
				void this.loadBirthdayContact(contactId)
			}
		} else if (selectedEvent) {
			if (this.isPreviewingEvent(selectedEvent._id)) {
				// nothing to do
			} else {
				this.#eventPreviewData = { type: "event", id: selectedEvent._id, model: null }
				void this.loadEventPreview(selectedEvent)
			}
		} else {
			this.#eventPreviewData = null
		}
		this.updateUi()
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
				return isSameSingleId(id1, id2)
			},
			sortCompare: (o1: CalendarEvent, o2: CalendarEvent) => o1.startTime.getTime() - o2.startTime.getTime(),
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
	}

	private applyLiveSearchResults(result: LiveSearchResult<SearchableTypes>) {
		this.searchResult = result
		// LiveSearchResult#dispose() will end the stream
		result.updates.map((update) => {
			switch (update.type) {
				case "reset": {
					// reset preview to not show outdated data
					this.#eventPreviewData = null
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
			this.handleLoadAndSelection(id, finder)
		}
	}
	private handleLoadAndSelection(id: string, finder: ((a: CalendarEvent) => boolean) | undefined) {
		const listModel = this.#listModel
		let iterations = 0
		this.#listModel.loadAndSelect(finder ?? ((item) => isSameSingleId(getElementId(item), id)), () => listModel !== this.#listModel || iterations++ > 10)
	}
	stopLoadAll() {
		this.#listModel.cancelLoadAll()
	}

	dispose() {
		this.searchResult?.dispose()
		this.abortController?.abort()
		this.eventController.removeEntityUpdatesListener(this.entityEventsListener)
		this.stopLoadAll()
	}

	async newEventModel(): Promise<CalendarEventModel | null> {
		const dateToUse = this.startDate ? setNextHalfHour(new Date(this.startDate)) : setNextHalfHour(new Date())
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		return await this.createCalendarEventModel(CalendarOperation.Create, getEventWithDefaultTimes(dateToUse), mailboxDetails, mailboxProperties, null)
	}
}
