import stream from "mithril/stream"
import Stream from "mithril/stream"
import { CalendarEventTypeRef, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { NOTHING_INDEXED_TIMESTAMP } from "../../api/common/TutanotaConstants"
import { DbError } from "../../api/common/error/DbError"
import type { SearchIndexStateInfo, SearchRestriction, SearchResult } from "../../api/worker/search/SearchTypes"
import { arrayEquals, assertNonNull, assertNotNull, incrementMonth, isSameTypeRef, lazy, ofClass } from "@tutao/tutanota-utils"
import type { SearchFacade } from "../../api/worker/search/SearchFacade"
import { assertMainOrNode } from "../../api/common/Env"
import { GroupInfo, WhitelabelChild } from "../../api/entities/sys/TypeRefs.js"
import { tokenize } from "../../api/worker/search/Tokenizer.js"
import { CalendarViewModel } from "../../calendar/view/CalendarViewModel.js"
import { listIdPart } from "../../api/common/utils/EntityUtils.js"

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
	lastQuery: Stream<string | null>
	indexingSupported: boolean
	lastSelectedGroupInfoResult: Stream<GroupInfo>
	lastSelectedWhitelabelChildrenInfoResult: Stream<WhitelabelChild>
	_searchFacade: SearchFacade
	_lastQuery: SearchQuery | null
	_lastSearchPromise: Promise<SearchResult | void>
	_groupInfoRestrictionListId: Id | null

	constructor(searchFacade: SearchFacade, private readonly calendarViewModelFactory: lazy<Promise<CalendarViewModel>>) {
		this._searchFacade = searchFacade
		this.result = stream()
		this.lastQuery = stream<string | null>("")
		this.lastSelectedGroupInfoResult = stream()
		this.lastSelectedWhitelabelChildrenInfoResult = stream()
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
		this._lastQuery = null
		this._lastSearchPromise = Promise.resolve(undefined)
		this._groupInfoRestrictionListId = null
	}

	async search(searchQuery: SearchQuery): Promise<SearchResult | void> {
		if (this._lastQuery && searchQueryEquals(searchQuery, this._lastQuery)) {
			return this._lastSearchPromise
		}

		this._lastQuery = searchQuery
		const { query, restriction, minSuggestionCount, maxResults } = searchQuery
		this.lastQuery(query)
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
			this._lastSearchPromise = Promise.resolve(result)
		} else if (isSameTypeRef(CalendarEventTypeRef, restriction.type)) {
			const calendarViewModel = await this.calendarViewModelFactory()

			// we interpret restriction.start as the start of the first day of the first month we want to search
			// restriction.end is the end of the last day of the last month we want to search
			let currentDate = new Date(assertNotNull(restriction.start))
			const endDate = new Date(assertNotNull(restriction.end))
			while (currentDate.getTime() <= endDate.getTime()) {
				await calendarViewModel.loadMonthIfNeeded(currentDate)
				currentDate = incrementMonth(currentDate, 1)
			}
			const eventsForDays = calendarViewModel.eventsForDays

			const result: SearchResult = {
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

			assertNonNull(restriction.start)
			assertNonNull(restriction.end)

			const tokens = tokenize(query.trim())
			// we want event instances that occur on multiple days to only appear once, but want
			// separate instances of event series to occur on their own.
			const alreadyAdded: Set<string> = new Set()

			if (tokens.length > 0) {
				for (const [startOfDay, eventsOnDay] of eventsForDays) {
					for (const event of eventsOnDay) {
						if (!(startOfDay >= restriction.start && startOfDay <= restriction.end)) {
							continue
						}
						const key = idToKey(event._id)
						if (alreadyAdded.has(key)) {
							// we only need the first event in the series, the view will load & then generate
							// the series for the searched time range.
							continue
						}

						if (restriction.listIds.length > 0 && !restriction.listIds.includes(listIdPart(event._id))) {
							// check that the event is in the searched calendar.
							continue
						}

						if (restriction.eventSeries === false && event.repeatRule != null) {
							// applied "repeating" search filter
							continue
						}

						for (const token of tokens) {
							if (event.summary.includes(token) || event.description.includes(token)) {
								alreadyAdded.add(key)
								result.results.push(event._id)
								break
							}
						}
					}
				}
			}

			this.result(result)
			this._lastSearchPromise = Promise.resolve(result)
		} else {
			this._lastSearchPromise = this._searchFacade
				.search(query, restriction, minSuggestionCount, maxResults ?? undefined)
				.then((result) => {
					this.result(result)
					return result
				})
				.catch(
					ofClass(DbError, (e) => {
						console.log("DBError while search", e)

						if (isSameTypeRef(MailTypeRef, restriction.type) && !this.indexState().mailIndexEnabled) {
							console.log("Mail indexing was disabled, ignoring DBError")
							this.result(null)
						} else {
							throw e
						}
					}),
				)
		}

		return this._lastSearchPromise
	}

	isNewSearch(query: string, restriction: SearchRestriction): boolean {
		let result = this.result()

		if (result == null) {
			return true
		}

		if (query !== result.query) {
			return true
		}

		if (result.restriction === restriction) {
			// both are the same instance
			return false
		}

		return !isSameSearchRestriction(restriction, result.restriction)
	}

	// TODO: remove this and take the list id from the url as soon as the list id is included in user and group settings
	setGroupInfoRestrictionListId(listId: Id) {
		this._groupInfoRestrictionListId = listId
	}

	getGroupInfoRestrictionListId(): Id | null {
		return this._groupInfoRestrictionListId
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
		a.eventSeries === b.eventSeries &&
		arrayEquals(a.listIds, b.listIds)
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
