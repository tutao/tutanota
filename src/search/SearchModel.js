//@flow
import stream from "mithril/stream/stream.js"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {assertMainOrNode} from "../api/Env"
import {NOTHING_INDEXED_TIMESTAMP} from "../api/common/TutanotaConstants"
import {DbError} from "../api/common/error/DbError"
import type {WorkerClient} from "../api/main/WorkerClient"
import type {SearchRestriction} from "../api/worker/search/SearchTypes"

assertMainOrNode()

export class SearchModel {
	_worker: WorkerClient;
	result: Stream<?SearchResult>;
	indexState: Stream<SearchIndexStateInfo>;
	lastQuery: Stream<?string>;
	indexingSupported: boolean;

	constructor(worker: WorkerClient) {
		this._worker = worker
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
	}

	search(query: string, restriction: SearchRestriction, minSuggestionCount: number,
	       maxResults: ?number): Promise<?SearchResult> {
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
			return Promise.resolve(result)
		} else {
			return this._worker.search(query, restriction, minSuggestionCount, maxResults).then(result => {
				this.result(result)
				return result
			}).catch(DbError, (e) => {
				console.log("DBError while search", e)
				if (isSameTypeRef(MailTypeRef, restriction.type) && !this.indexState().mailIndexEnabled) {
					console.log("Mail indexing was disabled, ignoring DBError")
					this.result(null)
				} else {
					throw e
				}
			})
		}
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
		return !isSameTypeRef(restriction.type, result.restriction.type)
			|| restriction.start !== result.restriction.start
			|| restriction.end !== result.restriction.end
			|| restriction.field !== result.restriction.field
			|| restriction.listId !== result.restriction.listId
	}
}

export function hasMoreResults(searchResult: SearchResult): boolean {
	return searchResult.moreResults.length > 0
		|| searchResult.lastReadSearchIndexRow.length > 0 && searchResult.lastReadSearchIndexRow.every(([word, id]) => id !== 0)
}
