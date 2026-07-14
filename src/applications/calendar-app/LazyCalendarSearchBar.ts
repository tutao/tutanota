import m, { Children, ClassComponent, Vnode } from "mithril"
import { SearchBar, SearchBarAttrs } from "../mail-app/search/SearchBar.js"
import { LazyLoaded } from "../../platform-kit/utils"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { LiveSearchResult, SearchQuery } from "../mail-app/search/model/SearchModel"
import { createRestriction } from "./calendar/search/model/SearchUtils"
import { formatEventDuration } from "./calendar/gui/CalendarGuiUtils"
import { getTimeZone } from "../common/calendar/date/CalendarUtils"
import { lang } from "../../ui/utils/LanguageViewModel"

export interface CalendarSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<LiveSearchResult<CalendarEvent>>
	selectResult: (searchQuery: SearchQuery, entry: CalendarEvent) => unknown
}

// FIXME: rewrite with a LazyComponent
export class LazyCalendarSearchBar implements ClassComponent<CalendarSearchBarAttrs> {
	private static SearchBar: LazyLoaded<Class<SearchBar<CalendarEvent>>> = new LazyLoaded(async () => {
		const { SearchBar } = await import("../mail-app/search/SearchBar.js")
		m.redraw()
		return SearchBar
	})

	oninit() {
		LazyCalendarSearchBar.SearchBar.load()
	}

	view({ attrs }: Vnode<CalendarSearchBarAttrs, this>): Children | null {
		const searchBar = LazyCalendarSearchBar.SearchBar.getSync()
		if (searchBar) {
			return m(searchBar, {
				placeholder: lang.getTranslationText("searchCalendar_placeholder"),
				loadResults: (query) =>
					attrs.loadResults({
						query,
						maxResults: 10, // FIXME
						restriction: createRestriction(null, null, [], false),
					}),
				selectResult: attrs.selectResult,
				renderResult: (entry) => [
					m(".top.flex-space-between", m(".name.text-ellipsis", { title: entry.summary }, entry.summary)),
					m(".bottom.flex-space-between", m("small.mail-address", formatEventDuration(entry, getTimeZone(), false))),
				],
			} satisfies SearchBarAttrs<CalendarEvent>)
		} else {
			return null
		}
	}
}

export const lazyCalendarSearchBar = new LazyCalendarSearchBar()
