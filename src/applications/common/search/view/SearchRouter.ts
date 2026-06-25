import { SearchRestriction } from "../../api/worker/search/SearchTypes.js"
import { Router } from "../../../../ui/ScopedThrottledRouter.js"
import { getSearchParameters } from "../SearchUtils"

export class SearchRouter {
	constructor(private readonly router: Router) {}

	routeTo(query: string, restriction: SearchRestriction, selectionKey: string | null = null): void {
		const { path, params } = getSearchParameters(query, restriction, selectionKey)
		this.router.routeTo(path, params)
	}
}
