//@flow
import stream from "mithril/stream/stream.js"
import {worker} from "../api/main/WorkerClient"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {arrayEquals} from "../api/common/utils/ArrayUtils"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

export class SearchModel {
	result: stream<?SearchResult>;
	indexState: stream<SearchIndexStateInfo>;

	constructor() {
		this.result = stream()
		this.indexState = stream({
			mailIndexEnabled: false,
			progress: 0
		})
	}

	search(query: string, restriction: SearchRestriction): Promise<SearchResult> {
		let result = this.result()
		if (result && !isSameTypeRef(MailTypeRef, result.restriction.type)) {
			// reset the result in case only the search type has changed
			this.result(null)
		} else if (this.indexState().progress > 0 && result && isSameTypeRef(MailTypeRef, result.restriction.type)) {
			// reset the result if indexing is in progress and the current search result is of type mail
			this.result(null)
		}
		return worker.search(query, restriction).then(result => {
			this.result(result)
			return result
		})
	}

	isNewSearch(query: string, restriction: SearchRestriction): boolean {
		let result = this.result()
		if (result == null) {
			return true
		}
		if (query != result.query) {
			return true
		}
		if (result.restriction == restriction) { // both are the same instance
			return false
		}
		return !isSameTypeRef(restriction.type, result.restriction.type)
			|| restriction.start != result.restriction.start
			|| restriction.end != result.restriction.end
			|| restriction.field != result.restriction.field
			|| restriction.listId != result.restriction.listId
	}
}
