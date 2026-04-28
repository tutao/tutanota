import m, { Children, ClassComponent, Component, Vnode } from "mithril"
import type { SearchBarAttrs } from "../mail-app/search/SearchBar.js"
import { LazyLoaded } from "@tutao/utils"

export class DriveSearchBarStub implements Component<SearchBarAttrs> {
	view(vnode: m.Vnode<SearchBarAttrs, m._NoLifecycle<this & {}>>): m.Children | void | null {
		return null
	}
}

/**
 * Lazy wrapper around SearchBar which unfortunately resides in the search chunk right now and cannot be imported from some files.
 *
 * Ideally this would be a generic component but it's not simple to implement.
 */
export class LazyDriveSearchBar implements ClassComponent<SearchBarAttrs> {
	private static searchBar: LazyLoaded<DriveSearchBarStub> = new LazyLoaded(async () => {
		m.redraw()
		return new DriveSearchBarStub()
	})

	oninit(vnode: Vnode<SearchBarAttrs, this>): any {
		LazyDriveSearchBar.searchBar.load()
	}

	view(vnode: Vnode<SearchBarAttrs, this>): Children | void | null {
		const searchBar = LazyDriveSearchBar.searchBar.getSync()
		if (searchBar) {
			return m(searchBar, vnode.attrs)
		} else {
			return null
		}
	}
}

export const lazyDriveSearchBarStub = new LazyDriveSearchBar()
