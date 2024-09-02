import m, { Children, ClassComponent, Vnode } from "mithril"
import type { SearchBar, SearchBarAttrs } from "./search/SearchBar.js"
import { LazyLoaded } from "@tutao/tutanota-utils"

/**
 * Lazy wrapper around SearchBar which unfortunately resides in the search chunk right now and cannot be imported from some files.
 *
 * Ideally this would be a generic component but it's not simple to implement.
 */
export class LazySearchBar implements ClassComponent<SearchBarAttrs> {
	private static searchBar: LazyLoaded<SearchBar> = new LazyLoaded(async () => {
		const { searchBar } = await import("./search/SearchBar.js")
		m.redraw()
		return searchBar
	})

	oninit(vnode: Vnode<SearchBarAttrs, this>): any {
		LazySearchBar.searchBar.load()
	}

	view(vnode: Vnode<SearchBarAttrs, this>): Children | void | null {
		const searchBar = LazySearchBar.searchBar.getSync()
		if (searchBar) {
			return m(searchBar, vnode.attrs)
		} else {
			return null
		}
	}
}

export const lazySearchBar = new LazySearchBar()
