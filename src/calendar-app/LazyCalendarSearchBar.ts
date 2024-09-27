import m, { Children, ClassComponent, Vnode } from "mithril"
import type { SearchBarAttrs } from "../mail-app/search/SearchBar.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { CalendarSearchBar } from "./calendar/search/CalendarSearchBar.js"

/**
 * Lazy wrapper around SearchBar which unfortunately resides in the search chunk right now and cannot be imported from some files.
 *
 * Ideally this would be a generic component but it's not simple to implement.
 */
export class LazyCalendarSearchBar implements ClassComponent<SearchBarAttrs> {
	private static searchBar: LazyLoaded<CalendarSearchBar> = new LazyLoaded(async () => {
		const { searchBar } = await import("./calendar/search/CalendarSearchBar.js")
		m.redraw()
		return searchBar
	})

	oninit(vnode: Vnode<SearchBarAttrs, this>): any {
		LazyCalendarSearchBar.searchBar.load()
	}

	view(vnode: Vnode<SearchBarAttrs, this>): Children | void | null {
		const searchBar = LazyCalendarSearchBar.searchBar.getSync()
		if (searchBar) {
			return m(searchBar, vnode.attrs)
		} else {
			return null
		}
	}
}

export const lazyCalendarSearchBar = new LazyCalendarSearchBar()
