//@flow
import stream from "mithril/stream/stream.js"
import {worker} from "../api/main/WorkerClient"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {arrayEquals} from "../api/common/utils/ArrayUtils"
import {MailTypeRef} from "../api/entities/tutanota/Mail"


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

	search(query: string, restriction: ?SearchRestriction): Promise<SearchResult> {
		let result = this.result()
		if (result && restriction && result.restriction && !isSameTypeRef(MailTypeRef, result.restriction.type)) {
			// reset the result in case only the search type has changed
			this.result(null)
		} else if (this.indexState().progress > 0 && result && result.restriction && isSameTypeRef(MailTypeRef, result.restriction.type)) {
			// reset the result if indexing is in progress and the current search result is of type mail
			this.result(null)
		}
		return worker.search(query, restriction).then(result => {
			this.result(result)
			return result
		})
	}

	isNewSearch(query: string, restriction: ?SearchRestriction): boolean {
		let result = this.result()
		if (result == null) {
			return true
		}
		if (query != result.query) {
			return true
		}
		if (result.restriction == restriction) { // both are null or same instance
			return false
		}
		if (restriction != null && result.restriction != null && isSameTypeRef(restriction.type, result.restriction.type)) {
			return !arrayEquals(restriction.attributes, result.restriction.attributes)
		}
		return true
	}
}
