import stream from "mithril/stream"
import Stream from "mithril/stream"
import { elementIdPart, getElementId, ListElementEntity, listIdPart, OperationType, TypeRef } from "../../../../platform-kit/meta"
import { assertMainOrNode, isAdminClient, isBrowser, NOTHING_INDEXED_TIMESTAMP } from "../../../../platform-kit/app-env"
import { DbError } from "../../../common/api/common/error/DbError"
import { SearchCategoryType, SearchIndexStateInfo, SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import {
	assertNonNull,
	assertNotNull,
	collectToMap,
	incrementMonth,
	lazyAsync,
	mapAndFilterNull,
	ofClass,
	remove,
	tokenize,
} from "../../../../platform-kit/utils"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { SearchFacade } from "../../workerUtils/index/SearchFacade"
import { areResultsForTheSameQuery, hasMoreResults, isSameSearchRestriction, isSameSearchRestrictionWithRangeExtended, searchQueryEquals } from "./SearchUtils"
import { getMailIndexTimestampForSearch } from "../../../common/api/common/utils/IndexUtils"
import { ProgressMonitorInterface } from "../../../../platform-kit/network/ProgressMonitorInterface"
import { CalendarEvent, Contact, ContactTypeRef, Mail, MailTypeRef } from "@tutao/entities/tutanota"
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
	minSuggestionCount: number
	maxResults: number | null
}

export type ResultUpdate<T> = { type: "reset" } | { type: "newitem"; item: T } | { type: "updateitem"; item: T } | { type: "deleteitem"; item: T }

export interface LiveSearchResult<T> {
	// query: string
	// tokens: SearchToken []
	// restriction: SearchRestriction
	items: T[]
	searchResult: SearchResult
	// currentIndexTimestamp: number
	// maxResults?: number
	// moreResults: Array<MoreResultsIndexEntry>
	// moreResultsEntries: IdTuple[]
	// lastReadSearchIndexRow: Array<[string, number | null]>
	// // array of pairs (token, lastReadSearchIndexRowOldestElementTimestamp) lastRowReadSearchIndexRow: null = no result read, 0 = no more search results????
	// matchWordOrder: boolean
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
	cancelSignal: Stream<boolean>

	private readonly liveResults: LiveSearchResult<unknown>[] = []

	constructor(
		searchFacade: SearchFacade,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly calendarModel: lazyAsync<CalendarEventsRepository>,
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
		this.cancelSignal = stream(false)

		this.eventController.addEntityListener({
			onEntityUpdatesReceived: async (updates, eventOwnerGroupId, isInitialSyncDone) => {
				for (const liveResult of this.liveResults) {
					await liveResult.entityEventsReceived(updates)
				}
			},
			priority: OnEntityUpdateReceivedPriority.NORMAL,
		})
	}

	async coolNewSearchContacts(searchQuery: SearchQuery): Promise<LiveSearchResult<Contact>> {
		console.log("this is contact search")
		const searchResult: SearchResult = await this._searchFacade.search(
			searchQuery.query,
			searchQuery.restriction,
			searchQuery.minSuggestionCount,
			searchQuery.maxResults ?? undefined,
		)
		const contacts = await loadMultipleFromLists(ContactTypeRef, this.entityClient, searchResult.results)
		contacts.sort((a, b) => compareContacts(a, b))
		const initialResults = contacts.slice(0, searchQuery.maxResults ?? contacts.length)
		const result: LiveSearchResult<Contact> = {
			searchResult,
			items: initialResults,
			loadMoreResults: async () => contacts.slice(initialResults.length),
			get hasMoreResults() {
				return initialResults.length === contacts.length
			},
			updates: stream(),
			dispose: () => {
				remove(this.liveResults, result)
				result.updates.end(true)
			},
			entityEventsReceived: async (updates) => {
				await this.applyEntityUpdates(updates, result, ContactTypeRef)
			},
		}
		this.liveResults.push(result)
		return result
	}

	private async applyEntityUpdates<T extends SearchableTypes & ListElementEntity>(
		updates: readonly EntityUpdateData[],
		result: LiveSearchResult<T>,
		typeRef: TypeRef<T>,
	) {
		for (const update of updates) {
			if (isUpdateForTypeRef(typeRef, update)) {
				if (update.operation === OperationType.DELETE) {
					const contactIndex = result.items.findIndex((mail) => getElementId(mail) === update.instanceId)
					if (contactIndex !== -1) {
						const [mail] = result.items.splice(contactIndex, 1)
						result.updates({ type: "deleteitem", item: mail })
					}
				} else if (update.operation === OperationType.UPDATE) {
					const contactIndex = result.items.findIndex((mail) => getElementId(mail) === update.instanceId)
					// surprisingly hard to convince ts that this is the correct id type
					const instanceIdTuple = [update.instanceListId, update.instanceId] as unknown as PropertyType<T, "_id">
					const updatedContact = await this.entityClient.load<T>(typeRef, instanceIdTuple)
					if (contactIndex !== -1) {
						result.items.splice(contactIndex, 1, updatedContact)
						result.updates({ type: "updateitem", item: updatedContact })
					}
				}
				// FIXME: the rest of updates
			}
		}
	}

	async coolNewSearchMails(searchQuery: SearchQuery): Promise<LiveSearchResult<Mail>> {
		const searchResult: SearchResult = await this._searchFacade.search(
			searchQuery.query,
			searchQuery.restriction,
			searchQuery.minSuggestionCount,
			searchQuery.maxResults ?? undefined,
		)
		const mails = await loadMultipleFromLists(MailTypeRef, this.entityClient, searchResult.results)
		mails.sort(compareMails)

		const result: LiveSearchResult<Mail> = {
			searchResult,
			items: mails,
			loadMoreResults: async (count) => {
				if (hasMoreResults(result.searchResult)) {
					result.searchResult = await this._searchFacade.getMoreSearchResults(result.searchResult, count)
					const previousLength = result.searchResult.results.length
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
				this.applyEntityUpdates(updates, result, MailTypeRef)
			},
		}
		this.liveResults.push(result)
		return result
	}

	async coolNewSearchCalendar(searchQuery: SearchQuery): Promise<LiveSearchResult<CalendarEvent>> {
		throw new Error("FIXME: Not implemented")
	}

	async search(searchQuery: SearchQuery, progressTracker: ProgressTracker): Promise<SearchResult | void> {
		const lastQueryDates = {
			start: this.lastQuery?.restriction?.start,
			end: this.lastQuery?.restriction?.end,
		}

		if (this.lastQuery && searchQueryEquals(searchQuery, this.lastQuery)) {
			return this.lastSearchPromise
		}

		this.lastQuery = searchQuery
		const { query, restriction, minSuggestionCount, maxResults } = searchQuery
		this.lastQueryString(query)
		let result = this.result()

		if (result && restriction.type !== result.restriction.type) {
			// reset the result in case only the search type has changed
			this.result(null)
		}

		if (query.trim() === "") {
			// if there was an empty query, just send empty result
			const result: SearchResult = {
				query: query,
				tokens: [],
				restriction: restriction,
				results: [],
				currentIndexTimestamp: this.indexState().currentMailIndexTimestamp,
				lastReadSearchIndexRow: [],
				maxResults: 0,
				matchWordOrder: false,
				moreResults: [],
				moreResultsEntries: [],
			}
			this.result(result)
			this.lastSearchPromise = Promise.resolve(result)
		} else {
			switch (restriction.type) {
				case SearchCategoryType.calendar: {
					// we interpret restriction.start as the start of the first day of the first month we want to search
					// restriction.end is the end of the last day of the last month we want to search
					let currentDate = new Date(assertNotNull(restriction.start))
					const endDate = new Date(assertNotNull(restriction.end))
					const calendarModel = await this.calendarModel()
					const daysInMonths: Array<Date> = []
					while (currentDate.getTime() <= endDate.getTime()) {
						daysInMonths.push(currentDate)
						currentDate = incrementMonth(currentDate, 1)
					}

					const tokens = tokenize(query.trim())

					const calendarResult: SearchResult = {
						// index related, keep empty
						currentIndexTimestamp: 0,
						moreResults: [],
						moreResultsEntries: [],
						lastReadSearchIndexRow: [],
						// data that is relevant to calendar search
						matchWordOrder: false,
						restriction,
						results: [],
						query,
						tokens: tokens.map((t) => {
							return { token: t, exact: false }
						}),
					}

					const monitorHandle = progressTracker.registerMonitorSync(daysInMonths.length)
					const monitor: ProgressMonitorInterface = assertNotNull(progressTracker.getMonitor(monitorHandle))

					if (this.cancelSignal()) {
						this.result(calendarResult)
						this.lastSearchPromise = Promise.resolve(calendarResult)
						return this.lastSearchPromise
					}

					const hasNewPaidPlan = await calendarModel.canLoadBirthdaysCalendar()
					const isNewSearchRange = lastQueryDates.start !== searchQuery.restriction.start || lastQueryDates.end !== searchQuery.restriction.end
					if (hasNewPaidPlan && isNewSearchRange) {
						await calendarModel.loadContactsBirthdays()
					}

					await calendarModel.loadMonthsIfNeeded(daysInMonths, this.cancelSignal, monitor)
					monitor.completed()

					const eventsForDays = calendarModel.getDaysToEvents()()

					assertNonNull(restriction.start)
					assertNonNull(restriction.end)

					// we want event instances that occur on multiple days to only appear once, but want
					// separate instances of event series to occur on their own.
					const alreadyAdded: Set<string> = new Set()

					if (this.cancelSignal()) {
						this.result(calendarResult)
						this.lastSearchPromise = Promise.resolve(calendarResult)
						return this.lastSearchPromise
					}

					const followCommonRestrictions = (key: string, event: CalendarEvent) => {
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
								alreadyAdded.add(key)
								calendarResult.results.push(event._id)
								return false
							}
						}

						return true
					}

					if (tokens.length > 0) {
						// we're iterating by event first to only have to sanitize the description once.
						// that's a smaller savings than one might think because for the vast majority of
						// events we're probably not matching and looking into the description anyway.
						for (const [startOfDay, eventsOnDay] of eventsForDays) {
							eventLoop: for (const wrapper of eventsOnDay) {
								if (!(startOfDay >= restriction.start && startOfDay <= restriction.end)) {
									continue
								}

								const key = idToKey(wrapper.event._id)

								if (!followCommonRestrictions(key, wrapper.event)) {
									continue
								}

								for (const token of tokens) {
									if (wrapper.event.summary.toLowerCase().includes(token)) {
										alreadyAdded.add(key)
										calendarResult.results.push(wrapper.event._id)
										continue eventLoop
									}
								}

								// checking the summary was cheap, now we store the sanitized description to check it against
								// all tokens.
								const descriptionToSearch = wrapper.event.description.replaceAll(/(<[^>]+>)/gi, " ").toLowerCase()
								for (const token of tokens) {
									if (descriptionToSearch.includes(token)) {
										alreadyAdded.add(key)
										calendarResult.results.push(wrapper.event._id)
										continue eventLoop
									}
								}

								if (this.cancelSignal()) {
									this.result(calendarResult)
									this.lastSearchPromise = Promise.resolve(calendarResult)
									return this.lastSearchPromise
								}
							}
						}

						const startDate = new Date(restriction.start)
						const endDate = new Date(restriction.end)

						if (hasNewPaidPlan) {
							const birthdayEvents = Array.from(calendarModel.getBirthdayEvents().values()).flat()

							eventLoop: for (const eventRegistry of birthdayEvents) {
								// Birthdays should still appear on search even if the date itself doesn't comply to the whole restriction
								// we only care about months
								const month = eventRegistry.event.startTime.getMonth()
								if (!(month >= startDate.getMonth() && month <= endDate.getMonth())) {
									continue
								}

								const key = idToKey(eventRegistry.event._id)

								if (!followCommonRestrictions(key, eventRegistry.event)) {
									continue
								}

								for (const token of tokens) {
									if (eventRegistry.event.summary.toLowerCase().includes(token)) {
										alreadyAdded.add(key)
										calendarResult.results.push(eventRegistry.event._id)
										continue eventLoop
									}
								}

								if (this.cancelSignal()) {
									this.result(calendarResult)
									this.lastSearchPromise = Promise.resolve(calendarResult)
									return this.lastSearchPromise
								}
							}
						}
					}

					this.result(calendarResult)
					this.lastSearchPromise = Promise.resolve(calendarResult)
					break
				}
				case SearchCategoryType.mail: {
					// we set search end when null to be able to tell when the same search is extended
					const indexState = this.indexState()

					const aimedTimestamp = indexState.aimedMailIndexTimestamp
					const currentTimestamp = indexState.currentMailIndexTimestamp

					if (restriction.end == null) {
						restriction.end = getMailIndexTimestampForSearch(aimedTimestamp)
					}

					// We modify the query because we need SearchFacade to not give us mails older than the current
					// timestamp, as the offline cleaner may not have purged all emails yet.
					//
					// We can only be certain about mails up to currentTimestamp.
					const truncatedRestriction = { ...restriction, end: Math.max(currentTimestamp, restriction.end) }

					this.lastSearchPromise = this._searchFacade
						.search(query, truncatedRestriction, minSuggestionCount, maxResults ?? undefined)
						.then((result) => {
							// we put back in the original restriction as we want the user's query to be put in here, not the
							// modified request
							result.restriction = restriction
							this.result(result)
							return result
						})
						.catch(
							ofClass(DbError, (e) => {
								console.log("DBError while search", e)
								throw e
							}),
						)
					break
				}
				case SearchCategoryType.contact: {
					// contacts are assumed to be fully indexed, thus restriction dates are meaningless here
					this.lastSearchPromise = this._searchFacade
						.search(query, restriction, minSuggestionCount, maxResults ?? undefined)
						.then((result) => {
							this.result(result)
							return result
						})
						.catch(
							ofClass(DbError, (e) => {
								console.log("DBError while search", e)
								throw e
							}),
						)
					break
				}
				case SearchCategoryType.drive:
					this.lastSearchPromise = this._searchFacade.search(query, restriction, minSuggestionCount, maxResults ?? undefined).then((result) => {
						this.result(result)
						return result
					})
			}
		}
		return this.lastSearchPromise
	}

	/**
	 * Extend the current search result if needed to {@link extensionEnd}.
	 *
	 * @param extensionEnd timestamp to which current result should be extended
	 */
	async extendCurrentResult(extensionEnd: number): Promise<void> {
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

	isSameSearchWithExtendedRange(query: string, restriction: SearchRestriction): boolean {
		if (!this.isSearchResultExtendableForType(restriction.type)) {
			return false
		}

		const lastQuery = this.lastQuery
		if (!lastQuery) {
			return false
		}

		return lastQuery.query === query && isSameSearchRestrictionWithRangeExtended(lastQuery.restriction, restriction)
	}

	isNewSearch(query: string, restriction: SearchRestriction): boolean {
		let isNew = false
		let lastQuery = this.lastQuery
		if (lastQuery == null) {
			isNew = true
		} else if (lastQuery.query !== query) {
			isNew = true
		} else if (lastQuery.restriction !== restriction) {
			// both are the same instance
			isNew = !isSameSearchRestriction(restriction, lastQuery.restriction)
		}

		if (isNew) this.sendCancelSignal()
		return isNew
	}

	sendCancelSignal() {
		this.cancelSignal(true)
		this.cancelSignal.end(true)
		this.cancelSignal = stream(false)
	}
}

function idToKey(id: IdTuple): string {
	return id.join("/")
}
