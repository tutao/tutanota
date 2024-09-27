import stream from "mithril/stream"
import Stream from "mithril/stream"
import { CalendarEventTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { DbError } from "../../../common/api/common/error/DbError"
import type { SearchIndexStateInfo, SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { arrayEquals, assertNonNull, assertNotNull, incrementMonth, isSameTypeRef, lazyAsync, ofClass, tokenize } from "@tutao/tutanota-utils"
import type { SearchFacade } from "../../workerUtils/index/SearchFacade.js"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { IProgressMonitor } from "../../../common/api/common/utils/ProgressMonitor.js"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { CommonSearchModel } from "../../../common/search/CommonSearchModel.js"

assertMainOrNode()
export type SearchQuery = {
	query: string
	restriction: SearchRestriction
	minSuggestionCount: number
	maxResults: number | null
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
	cancelSignal: Stream<boolean>

	constructor(searchFacade: SearchFacade, private readonly calendarModel: lazyAsync<CalendarEventsRepository>) {
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
		this.cancelSignal = stream(false)
	}

	async search(searchQuery: SearchQuery, progressTracker: ProgressTracker): Promise<SearchResult | void> {
		if (this.lastQuery && searchQueryEquals(searchQuery, this.lastQuery)) {
			return this.lastSearchPromise
		}

		this.lastQuery = searchQuery
		const { query, restriction, minSuggestionCount, maxResults } = searchQuery
		this.lastQueryString(query)
		let result = this.result()

		if (result && !isSameTypeRef(restriction.type, result.restriction.type)) {
			// reset the result in case only the search type has changed
			this.result(null)
		} else if (this.indexState().progress > 0 && result && isSameTypeRef(MailTypeRef, result.restriction.type)) {
			// reset the result if indexing is in progress and the current search result is of type mail
			this.result(null)
		}

		if (query.trim() === "") {
			// if there was an empty query, just send empty result
			const result: SearchResult = {
				query: query,
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
		} else if (isSameTypeRef(CalendarEventTypeRef, restriction.type)) {
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
			}

			const monitorHandle = progressTracker.registerMonitorSync(daysInMonths.length)
			const monitor: IProgressMonitor = assertNotNull(progressTracker.getMonitor(monitorHandle))

			if (this.cancelSignal()) {
				this.result(calendarResult)
				this.lastSearchPromise = Promise.resolve(calendarResult)
				return this.lastSearchPromise
			}

			await calendarModel.loadMonthsIfNeeded(daysInMonths, monitor, this.cancelSignal)
			monitor.completed()

			const eventsForDays = calendarModel.getEventsForMonths()()

			assertNonNull(restriction.start)
			assertNonNull(restriction.end)

			const tokens = tokenize(query.trim())
			// we want event instances that occur on multiple days to only appear once, but want
			// separate instances of event series to occur on their own.
			const alreadyAdded: Set<string> = new Set()

			if (this.cancelSignal()) {
				this.result(calendarResult)
				this.lastSearchPromise = Promise.resolve(calendarResult)
				return this.lastSearchPromise
			}

			if (tokens.length > 0) {
				// we're iterating by event first to only have to sanitize the description once.
				// that's a smaller savings than one might think because for the vast majority of
				// events we're probably not matching and looking into the description anyway.
				for (const [startOfDay, eventsOnDay] of eventsForDays) {
					eventLoop: for (const event of eventsOnDay) {
						if (!(startOfDay >= restriction.start && startOfDay <= restriction.end)) {
							continue
						}
						const key = idToKey(event._id)
						if (alreadyAdded.has(key)) {
							// we only need the first event in the series, the view will load & then generate
							// the series for the searched time range.
							continue
						}

						if (restriction.folderIds.length > 0 && !restriction.folderIds.includes(listIdPart(event._id))) {
							// check that the event is in the searched calendar.
							continue
						}

						if (restriction.eventSeries === false && event.repeatRule != null) {
							// applied "repeating" search filter
							continue
						}

						for (const token of tokens) {
							if (event.summary.toLowerCase().includes(token)) {
								alreadyAdded.add(key)
								calendarResult.results.push(event._id)
								continue eventLoop
							}
						}
						// checking the summary was cheap, now we store the sanitized description to check it against
						// all tokens.
						const descriptionToSearch = event.description.replaceAll(/(<[^>]+>)/gi, " ").toLowerCase()
						for (const token of tokens) {
							if (descriptionToSearch.includes(token)) {
								alreadyAdded.add(key)
								calendarResult.results.push(event._id)
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
		} else {
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
		}

		return this.lastSearchPromise
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

function searchQueryEquals(a: SearchQuery, b: SearchQuery) {
	return (
		a.query === b.query &&
		isSameSearchRestriction(a.restriction, b.restriction) &&
		a.minSuggestionCount === b.minSuggestionCount &&
		a.maxResults === b.maxResults
	)
}

export function isSameSearchRestriction(a: SearchRestriction, b: SearchRestriction): boolean {
	const isSameAttributeIds = a.attributeIds === b.attributeIds || (!!a.attributeIds && !!b.attributeIds && arrayEquals(a.attributeIds, b.attributeIds))
	return (
		isSameTypeRef(a.type, b.type) &&
		a.start === b.start &&
		a.end === b.end &&
		a.field === b.field &&
		isSameAttributeIds &&
		(a.eventSeries === b.eventSeries || (a.eventSeries === null && b.eventSeries === true) || (a.eventSeries === true && b.eventSeries === null)) &&
		arrayEquals(a.folderIds, b.folderIds)
	)
}

export function areResultsForTheSameQuery(a: SearchResult, b: SearchResult) {
	return a.query === b.query && isSameSearchRestriction(a.restriction, b.restriction)
}

export function hasMoreResults(searchResult: SearchResult): boolean {
	return (
		searchResult.moreResults.length > 0 ||
		(searchResult.lastReadSearchIndexRow.length > 0 && searchResult.lastReadSearchIndexRow.every(([word, id]) => id !== 0))
	)
}
