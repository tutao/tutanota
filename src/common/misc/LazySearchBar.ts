import m, { Children, ClassComponent, Vnode } from "mithril"
import type { SearchBar, SearchBarAttrs } from "../../mail-app/search/SearchBar.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { client } from "./ClientDetector.js"

/**
 * Lazy wrapper around SearchBar which unfortunately resides in the search chunk right now and cannot be imported from some files.
 *
 * Ideally this would be a generic component but it's not simple to implement.
 */
export class LazySearchBar implements ClassComponent<SearchBarAttrs> {
	private static searchBar: LazyLoaded<SearchBar> = new LazyLoaded(async () => {
		const searchbarPath = client.isCalendarApp() ? "../../calendar-app/search/CalendarSearchBar.js" : "../../mail-app/search/SearchBar.js"
		const { searchBar } = await import(searchbarPath)
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
