//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {worker} from "../api/main/WorkerClient"


class SearchModel {
	result: stream<SearchResult>;

	constructor() {
		this.result = stream()
	}


	search(query: string, restriction: ?SearchRestriction): Promise<SearchResult> {
		return worker.search(query, restriction).then(result => {
			this.result(result)
			return result
		})
	}
}

export function getRestriction(route:string): ?SearchRestriction {
	if (route.startsWith('/mail') || route.startsWith('/search/mail')) {
		return {type: MailTypeRef, attributes: []}
	} else if (route.startsWith('/contact') || route.startsWith('/search/contact')) {
		return {type: ContactTypeRef, attributes: []}
	} else {
		return null
	}
}

export const searchModel = new SearchModel()