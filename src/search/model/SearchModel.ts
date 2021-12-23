//@flow
import stream from "mithril/stream/stream.js"
import {MailTypeRef} from "../../api/entities/tutanota/Mail"
import {NOTHING_INDEXED_TIMESTAMP} from "../../api/common/TutanotaConstants"
import {DbError} from "../../api/common/error/DbError"
import type {SearchIndexStateInfo, SearchRestriction, SearchResult} from "../../api/worker/search/SearchTypes"
import {isSameTypeRef} from "@tutao/tutanota-utils";
import {ofClass} from "@tutao/tutanota-utils"
import {arrayEquals} from "@tutao/tutanota-utils"
import type {SearchFacade} from "../../api/worker/search/SearchFacade"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export type SearchQuery = {
	query: string,
	restriction: SearchRestriction,
	minSuggestionCount: number,
	maxResults: ?number
}

export class SearchModel {
	result: Stream<?SearchResult>;
	indexState: Stream<SearchIndexStateInfo>;
	lastQuery: Stream<?string>;
	indexingSupported: boolean;
	_searchFacade: SearchFacade
	_lastQuery: ?SearchQuery
	_lastSearchPromise: Promise<?SearchResult>

	constructor(searchFacade: SearchFacade) {
		this._searchFacade = searchFacade
		this.result = stream()
		this.lastQuery = stream("")
		this.indexingSupported = true
		this.indexState = stream({
			initializing: true,
			mailIndexEnabled: false,
			progress: 0,
			currentMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			indexedMailCount: 0,
			failedIndexingUpTo: null
		})
		this._lastQuery = null
		this._lastSearchPromise = Promise.resolve()
	}

	async search(searchQuery: SearchQuery): Promise<?SearchResult> {
		if (this._lastQuery && searchQueryEquals(searchQuery, this._lastQuery)) {
			return this._lastSearchPromise
		}

		this._lastQuery = searchQuery

		const {query, restriction, minSuggestionCount, maxResults} = searchQuery

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
				moreResults: []
			}
			this.result(result)
			this._lastSearchPromise = Promise.resolve(result)
		} else {
			this._lastSearchPromise = this._searchFacade.search(query, restriction, minSuggestionCount, maxResults).then(result => {
				this.result(result)
				return result
			}).catch(ofClass(DbError, (e) => {
				console.log("DBError while search", e)
				if (isSameTypeRef(MailTypeRef, restriction.type) && !this.indexState().mailIndexEnabled) {
					console.log("Mail indexing was disabled, ignoring DBError")
					this.result(null)
				} else {
					throw e
				}
			}))
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
		if (result.restriction === restriction) { // both are the same instance
			return false
		}

		return !searchRestrictionEquals(restriction, result.restriction)
	}
}

function searchQueryEquals(a: SearchQuery, b: SearchQuery) {
	return a.query === b.query
		&& searchRestrictionEquals(a.restriction, b.restriction)
		&& a.minSuggestionCount === b.minSuggestionCount
		&& a.maxResults === b.maxResults
}

function searchRestrictionEquals(a: SearchRestriction, b: SearchRestriction): boolean {

	const isSameAttributeIds = a.attributeIds === b.attributeIds
		|| (!!a.attributeIds && !!b.attributeIds && arrayEquals(a.attributeIds, b.attributeIds))

	return isSameTypeRef(a.type, b.type)
		&& a.start === b.start
		&& a.end === b.end
		&& a.field === b.field
		&& isSameAttributeIds
		&& a.listId === b.listId
}

export function hasMoreResults(searchResult: SearchResult): boolean {
	return searchResult.moreResults.length > 0
		|| searchResult.lastReadSearchIndexRow.length > 0 && searchResult.lastReadSearchIndexRow.every(([word, id]) => id !== 0)
}
