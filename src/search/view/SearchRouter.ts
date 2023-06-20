import { SearchRestriction } from "../../api/worker/search/SearchTypes.js"
import { getRestriction, getSearchUrl } from "../model/SearchUtils.js"
import m from "mithril"
import { Router } from "../../gui/ScopedRouter.js"
import { memoizedWithHiddenArgument } from "@tutao/tutanota-utils/dist/Utils.js"

export class SearchRouter {
	constructor(private readonly router: Router) {}

	readonly getRestriction: () => SearchRestriction = memoizedWithHiddenArgument(() => m.route.get(), getRestriction)

	routeTo(query: string, restriction: SearchRestriction, selectedId?: Id | null): void {
		const { path, params } = getSearchUrl(query, restriction, selectedId ?? undefined)
		this.router.routeTo(path, params)
	}
}
