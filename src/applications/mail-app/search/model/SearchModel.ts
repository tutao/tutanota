import stream from "mithril/stream"
import Stream from "mithril/stream"
import { elementIdPart, getElementId, isSameId, ListElementEntity, listIdPart, OperationType, TypeRef } from "../../../../platform-kit/meta"
import { assertMainOrNode, CancelledError, isAdminClient, isBrowser, NOTHING_INDEXED_TIMESTAMP } from "../../../../platform-kit/app-env"
import { DbError } from "../../../common/api/common/error/DbError"
import { SearchCategoryType, SearchIndexStateInfo, SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import {
	assertNonNull,
	assertNotNull,
	collectToMap,
	incrementMonth,
	isNotEmpty,
	lastIndex,
	lazyAsync,
	mapAndFilterNull,
	ofClass,
	remove,
	stringToBase64,
	tokenize,
} from "../../../../platform-kit/utils"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { SearchFacade } from "../../workerUtils/index/SearchFacade"
import { areResultsForTheSameQuery, encodeCalendarSearchKey, hasMoreResults } from "./SearchUtils"
import { ProgressMonitorInterface } from "../../../../platform-kit/network/ProgressMonitorInterface"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef, OnEntityUpdateReceivedPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { SearchableTypes } from "../view/SearchViewModel"
import { compareContacts } from "../../contacts/view/ContactGuiUtils"
import { compareMails } from "../../mail/model/MailUtils"

assertMainOrNode()
export type SearchQuery = {
	query: string
	restriction: SearchRestriction
	maxResults: number | null
}

export type ResultUpdate<T> = { type: "reset" } | { type: "newitem"; item: T } | { type: "updateitem"; item: T } | { type: "deleteitem"; item: T }

export interface LiveSearchResult<T> {
	items: T[]
	searchResult: SearchResult
	hasMoreResults: boolean
	loadMoreResults: (max: number) => Promise<T[]>
	updates: Stream<ResultUpdate<T>>
	dispose: () => unknown
	entityEventsReceived: (data: readonly EntityUpdateData[]) => Promise<unknown>
}

export class SearchModel {
	result: Stream<SearchResult | null>
	indexState: Stream<SearchIndexStateInfo>
	// we store this as a reference to the currently running search. if we don't, we only have the last result's query info
	// to compare against incoming new queries
	lastQueryString: Stream<string | null>
	indexingSupported: boolean
	_searchFacade: SearchFacade
	private lastQuery: SearchQuery | null
	private lastSearchPromise: Promise<SearchResult | void>
	private lastSearchExtensionPromise: Promise<void>

	private readonly liveResults: LiveSearchResult<unknown>[] = []

	constructor(
		searchFacade: SearchFacade,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly calendarModel: lazyAsync<CalendarEventsRepository>,
		private readonly progressTracker: ProgressTracker,
	) {
		this._searchFacade = searchFacade
		this.result = stream()
		this.lastQueryString = stream<string | null>("")
		this.indexingSupported = true
		this.indexState = stream<SearchIndexStateInfo>({
			initializing: true,
			mailIndexEnabled: false,
			progress: 0,
			currentMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			aimedMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			indexedMailCount: 0,
			failedIndexingUpTo: null,
		})
		this.lastQuery = null
		this.lastSearchPromise = Promise.resolve()
		this.lastSearchExtensionPromise = Promise.resolve()

		this.eventController.addEntityListener({
			onEntityUpdatesReceived: async (updates, eventOwnerGroupId, isInitialSyncDone) => {
				for (const liveResult of this.liveResults) {
					await liveResult.entityEventsReceived(updates)
				}
			},
			// receive updates after models
			priority: OnEntityUpdateReceivedPriority.LOW,
		})
	}

	async coolNewSearchContacts(searchQuery: SearchQuery): Promise<LiveSearchResult<Contact>> {
		const searchResult: SearchResult = await this._searchFacade.search(searchQuery.query, searchQuery.restriction, {
			maxResults: searchQuery.maxResults ?? undefined,
		})
		const resultItems = await loadMultipleFromLists(ContactTypeRef, this.entityClient, searchResult.results)
		resultItems.sort((a, b) => compareContacts(a, b))
		let loadedUntil = Math.min(searchQuery.maxResults ?? resultItems.length, resultItems.length)
		const result: LiveSearchResult<Contact> = {
			searchResult,
			get items() {
				return resultItems.slice(0, loadedUntil)
			},
			loadMoreResults: async (count) => {
				const oldLoadedUntil = loadedUntil
				loadedUntil = Math.min(loadedUntil + count, resultItems.length)
				return resultItems.slice(oldLoadedUntil, loadedUntil)
			},
			get hasMoreResults() {
				return isNotEmpty(resultItems) && loadedUntil < lastIndex(resultItems)
			},
			updates: stream(),
			dispose: () => {
				remove(this.liveResults, result)
				result.updates.end(true)
			},
			entityEventsReceived: async (updates) => {
				await this.applyEntityUpdates(ContactTypeRef, resultItems, updates, result.updates)
			},
		}
		this.liveResults.push(result)
		return result
	}

	private async applyEntityUpdates<T extends SearchableTypes & ListElementEntity>(
		typeRef: TypeRef<T>,
		items: T[],
		updates: readonly EntityUpdateData[],
		sendUpdate: (update: ResultUpdate<T>) => unknown,
	) {
		for (const update of updates) {
			if (isUpdateForTypeRef(typeRef, update)) {
				if (update.operation === OperationType.DELETE) {
					const index = items.findIndex((mail) => getElementId(mail) === update.instanceId)
					if (index !== -1) {
						const [item] = items.splice(index, 1)
						sendUpdate({ type: "deleteitem", item: item })
					}
				} else if (update.operation === OperationType.UPDATE) {
					const index = items.findIndex((mail) => getElementId(mail) === update.instanceId)
					// surprisingly hard to convince ts that this is the correct id type
					const instanceIdTuple = [update.instanceListId, update.instanceId] as unknown as PropertyType<T, "_id">
					const updatedItem = await this.entityClient.load<T>(typeRef, instanceIdTuple)
					if (index !== -1) {
						items.splice(index, 1, updatedItem)
						sendUpdate({ type: "updateitem", item: updatedItem })
					}
				}
			}
		}
	}

	async coolNewSearchMails(searchQuery: SearchQuery): Promise<LiveSearchResult<Mail>> {
		// FIXME: wait for index to be initialized
		const searchResult: SearchResult = await this._searchFacade.search(searchQuery.query, searchQuery.restriction, {
			maxResults: searchQuery.maxResults ?? undefined,
		})
		const mails = await loadMultipleFromLists(MailTypeRef, this.entityClient, searchResult.results)
		mails.sort(compareMails)

		const result: LiveSearchResult<Mail> = {
			searchResult,
			items: mails,
			loadMoreResults: async (count) => {
				if (hasMoreResults(result.searchResult)) {
					// we do not change searchResult itself in response to entity updates so even if some entity was
					// deleted from the items list it doesn't affect index in searchResult
					const previousLength = result.searchResult.results.length
					result.searchResult = await this._searchFacade.getMoreSearchResults(result.searchResult, count)
					const toLoad = result.searchResult.results.slice(previousLength)
					let items: Mail[] = await loadMultipleFromLists(MailTypeRef, this.entityClient, toLoad)
					items.sort(compareMails)

					// Restore the original sorting order
					if (!isBrowser() && !isAdminClient()) {
						const itemsMapped = collectToMap(items, getElementId)
						items = mapAndFilterNull<IdTuple, Mail>(searchResult.results, (id) => itemsMapped.get(elementIdPart(id)) ?? null)
					}
					result.items.push(...items)
					return items
				} else {
					return []
				}
			},
			get hasMoreResults() {
				return hasMoreResults(result.searchResult)
			},
			updates: stream(),
			dispose: () => {
				remove(this.liveResults, result)
				result.updates.end(true)
			},
			entityEventsReceived: async (updates) => {
				await this.applyEntityUpdates(MailTypeRef, result.items, updates, result.updates)
			},
		}
		this.liveResults.push(result)
		return result
	}

	async coolNewSearchDrive(searchQuery: SearchQuery) {
		//FIXME not implemented
	}

	async coolNewSearchCalendar(searchQuery: SearchQuery, abortSignal: AbortSignal): Promise<LiveSearchResult<CalendarEvent>> {
		const { tokens, resultItems } = await this.runCalendarSearch(searchQuery, abortSignal)

		const searchResult: SearchResult = {
			// data that is relevant to calendar search
			matchWordOrder: false,
			restriction: searchQuery.restriction,
			results: resultItems.map((item) => item._id),
			query: searchQuery.query,
			tokens: tokens.map((t) => {
				return { token: t, exact: false }
			}),
			// index related, keep empty
			currentIndexTimestamp: 0,
			moreResults: [],
			moreResultsEntries: [],
			lastReadSearchIndexRow: [],
		}
		let loadedUntil = Math.min(searchQuery.maxResults ?? resultItems.length, resultItems.length)
		// const initialEvents = resultItems.slice(0, searchQuery.maxResults ?? resultItems.length)
		const liveResult: LiveSearchResult<CalendarEvent> = {
			searchResult,
			get items() {
				return resultItems.slice(0, loadedUntil)
			},
			loadMoreResults: async (count) => {
				const oldLoadedUntil = loadedUntil
				loadedUntil = Math.min(loadedUntil + count, resultItems.length)
				return resultItems.slice(oldLoadedUntil, loadedUntil)
			},
			get hasMoreResults() {
				return isNotEmpty(resultItems) && loadedUntil < lastIndex(resultItems)
			},
			updates: stream(),
			dispose: () => {
				remove(this.liveResults, liveResult)
				liveResult.updates.end(true)
			},
			entityEventsReceived: async (updates) => {
				for (const update of updates) {
					if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
						const updateId: IdTuple = [update.instanceListId, update.instanceId]
						const isItemInList = resultItems.some((item) => isSameId(updateId, item._id))
						if (isItemInList) {
							resultItems.splice(0, resultItems.length)
							const { resultItems: newItems } = await this.runCalendarSearch(searchQuery, abortSignal)
							resultItems.push(...newItems)
							searchResult.results = resultItems.map((item) => item._id)
							liveResult.updates({ type: "reset" })
						}
					} else if (isUpdateForTypeRef(ContactTypeRef, update) && this.isPossibleBirthdayContactUpdate(resultItems, update)) {
						const calendarModel = await this.calendarModel()
						await calendarModel.handleContactEvent(update.operation, [update.instanceListId, update.instanceId])

						resultItems.splice(0, resultItems.length)
						const { resultItems: newItems } = await this.runCalendarSearch(searchQuery, abortSignal)
						resultItems.push(...newItems)
						searchResult.results = resultItems.map((item) => item._id)
						liveResult.updates({ type: "reset" })
					}
				}
			},
		}
		this.liveResults.push(liveResult)
		return liveResult
	}
	private isPossibleBirthdayContactUpdate(items: readonly CalendarEvent[], update: EntityUpdateData<Contact>): boolean {
		const { instanceListId, instanceId } = update
		const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`)
		return items.some((searchEntry) => getElementId(searchEntry).endsWith(encodedContactId))
	}

	private async runCalendarSearch(searchQuery: SearchQuery, abortSignal: AbortSignal): Promise<{ tokens: string[]; resultItems: CalendarEvent[] }> {
		const calendarModel = await this.calendarModel()

		const query = searchQuery.query
		const tokens = tokenize(query.trim())
		const restriction = searchQuery.restriction

		// we interpret restriction.start as the start of the first day of the first month we want to search
		// restriction.end is the end of the last day of the last month we want to search
		const startDate = new Date(assertNotNull(restriction.start))
		const endDate = new Date(assertNotNull(restriction.end))
		const daysInMonths: Date[] = []

		let currentDate = startDate
		while (currentDate.getTime() <= endDate.getTime()) {
			daysInMonths.push(currentDate)
			currentDate = incrementMonth(currentDate, 1)
		}

		const monitorHandle = this.progressTracker.registerMonitorSync(daysInMonths.length)
		const monitor: ProgressMonitorInterface = assertNotNull(this.progressTracker.getMonitor(monitorHandle))

		if (abortSignal.aborted) {
			throw new CancelledError("search cancelled")
		}

		const resultItems: CalendarEvent[] = []

		const canLoadBirthdaysCalendar = await calendarModel.canLoadBirthdaysCalendar()
		if (canLoadBirthdaysCalendar) {
			await calendarModel.loadContactsBirthdays()
		}

		await calendarModel.loadMonthsIfNeeded(daysInMonths, abortSignal, monitor)
		monitor.completed()

		const daysToEvents = calendarModel.getDaysToEvents()()

		// This is taken over from the previous implementation, but these should always
		// be non-null unless due to some weird side effects. Do we need to keep these checks?
		assertNonNull(restriction.start)
		assertNonNull(restriction.end)

		// we want event instances that occur on multiple days to only appear once, but want
		// separate instances of event series to occur on their own.
		const alreadyAdded: Set<string> = new Set()

		if (abortSignal.aborted) {
			throw new CancelledError("search cancelled")
		}

		const shouldIncludeEvent = (key: string, event: CalendarEvent) => {
			if (alreadyAdded.has(key)) {
				// we only need the first event in the series, the view will load & then generate
				// the series for the searched time range.
				return false
			}

			if (restriction.folderIds.length > 0 && !restriction.folderIds.includes(listIdPart(event._id))) {
				// check that the event is in the searched calendar.
				return false
			}

			if (restriction.eventSeries === false && event.repeatRule != null) {
				// applied "repeating" search filter
				return false
			}

			for (const token of tokens) {
				if (event.summary.toLowerCase().includes(token)) {
					return true
				}
			}
			// check description last because it's a bit more expensive
			const description = event.description.replaceAll(/(<[^>]+>)/gi, " ").toLowerCase()
			for (const token of tokens) {
				if (description.includes(token)) {
					return true
				}
			}

			return false
		}

		if (tokens.length > 0) {
			// we're iterating by event first to only have to sanitize the description once.
			// that's a smaller savings than one might think because for the vast majority of
			// events we're probably not matching and looking into the description anyway.
			for (const [startOfDay, eventsOnDay] of daysToEvents) {
				for (const wrapper of eventsOnDay) {
					if (!(startOfDay >= restriction.start && startOfDay <= restriction.end)) {
						continue
					}

					const key = encodeCalendarSearchKey(wrapper.event)

					if (shouldIncludeEvent(key, wrapper.event)) {
						alreadyAdded.add(key)
						resultItems.push(wrapper.event)
					}

					if (abortSignal.aborted) {
						throw new CancelledError("search cancelled")
					}
				}
			}
		}
		return { tokens, resultItems }
	}

	async search(searchQuery: SearchQuery, progressTracker: ProgressTracker): Promise<SearchResult | void> {
		throw new Error("FIXME: delete me")
	}

	/**
	 * Extend the current search result if needed to {@link extensionEnd}.
	 *
	 * @param extensionEnd timestamp to which current result should be extended
	 */
	async extendCurrentResult(extensionEnd: number): Promise<void> {
		// FIXME: rewrite for LiveSearchResult
		await this.lastSearchPromise
		await this.lastSearchExtensionPromise

		const currentResult = this.result()
		if (currentResult == null || currentResult.query.trim() === "" || !this.isSearchResultExtendableForType(currentResult.restriction.type)) {
			return
		}

		const currentResultEndCutoff = Math.max(
			// when searching, we set end restriction to aimedMailIndexTimestamp when null, so it should never be null when extending
			assertNotNull(currentResult.restriction.end, "null end restriction when extending search"),
			currentResult.currentIndexTimestamp,
		)
		// search result already complete, no need to extend
		if (currentResultEndCutoff <= extensionEnd) {
			return
		}

		this.lastSearchExtensionPromise = this._searchFacade
			.extendSearchResult(currentResult, extensionEnd)
			.then((extendedResult) => {
				const currentResultAgain = this.result()
				if (currentResultAgain == null || !areResultsForTheSameQuery(currentResult, currentResultAgain)) {
					return
				}

				if (this.lastQuery != null) {
					// SearchResult share the same instance of SearchRestriction with its SearchQuery, but when extending
					// we create a shallow copy of restriction.
					//
					// So we make sure result and query share the same restriction instance (from initial search) again.
					Object.assign(this.lastQuery.restriction, extendedResult.restriction)
					extendedResult.restriction = this.lastQuery.restriction
				}

				this.result(extendedResult)
			})
			.catch(
				ofClass(DbError, (e) => {
					console.log("DbError while extending search result", e)
					throw e
				}),
			)
	}

	private isSearchResultExtendableForType(type: SearchCategoryType): boolean {
		return type === SearchCategoryType.mail
	}
}
