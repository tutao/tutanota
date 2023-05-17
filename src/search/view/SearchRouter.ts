import { SearchRestriction } from "../../api/worker/search/SearchTypes.js"
import { getRestriction, getSearchUrl } from "../model/SearchUtils.js"
import m from "mithril"

export class SearchRouter {
	getRestriction(): SearchRestriction {
		return getRestriction(m.route.get())
	}

	routeTo(query: string, restriction: SearchRestriction, selectedId?: Id | null): void {
		m.route.set(getSearchUrl(query, restriction, selectedId ?? undefined))
	}
}
