//@flow
import stream from "mithril/stream/stream.js"
import {worker} from "../api/main/WorkerClient"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {arrayEquals} from "../api/common/utils/ArrayUtils"


class SearchModel {
	result: stream<SearchResult>;

	constructor() {
		this.result = stream()
	}

	search(query: string, restriction: ?SearchRestriction): Promise<SearchResult> {
		let result = this.result()
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


export const searchModel = new SearchModel()