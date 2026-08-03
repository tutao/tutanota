import { CalendarEvent } from "@tutao/entities/tutanota"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { SearchBar, SearchBarAttrs } from "../mail-app/search/SearchBar"
import { lang } from "../../ui/utils/LanguageViewModel"
import { createRestriction } from "./calendar/search/model/SearchUtils"
import { formatEventDuration } from "./calendar/gui/CalendarGuiUtils"
import { getTimeZone } from "../common/calendar/date/CalendarUtils"
import { LiveSearchResult, SearchQuery } from "../common/search/SearchUtils"

export interface CalendarSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<LiveSearchResult<CalendarEvent>>
	selectResult: (searchQuery: SearchQuery, entry: CalendarEvent | null) => unknown
	shouldOfferUpgrade: boolean
}

export class CalendarSearchBar implements ClassComponent<CalendarSearchBarAttrs> {
	view({ attrs }: Vnode<CalendarSearchBarAttrs, this>): Children | null {
		return m(SearchBar<CalendarEvent>, {
			placeholder: lang.getTranslationText("searchCalendar_placeholder"),
			loadResults: (query) =>
				attrs.loadResults({
					query,
					maxResults: 10, // FIXME
					restriction: createRestriction(null, null, [], null),
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry) => [
				m(".top.flex-space-between", m(".name.text-ellipsis", { title: entry.summary }, entry.summary)),
				m(".bottom.flex-space-between", m("small.mail-address", formatEventDuration(entry, getTimeZone(), false))),
			],
			shouldOfferUpgrade: attrs.shouldOfferUpgrade,
		} satisfies SearchBarAttrs<CalendarEvent>)
	}
}
