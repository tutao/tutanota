import { SearchRestriction } from "../../../common/api/worker/search/SearchTypes.js"
import { getRestriction, getSearchUrl } from "../model/SearchUtils.js"
import m from "mithril"
import { Router } from "../../../common/gui/ScopedRouter.js"
import { memoizedWithHiddenArgument } from "@tutao/tutanota-utils"

export type SearchSelection = {
	selectedId: Id | null
	selectedEventTime?: ReadonlyArray<number>
}

export class SearchRouter {
	constructor(private readonly router: Router) {}

	readonly getRestriction: () => SearchRestriction = memoizedWithHiddenArgument(() => m.route.get(), getRestriction)

	routeTo(query: string, restriction: SearchRestriction, selectionKey: string | null = null): void {
		const { path, params } = getSearchUrl(query, restriction, selectionKey)
		this.router.routeTo(path, params)
	}
}
