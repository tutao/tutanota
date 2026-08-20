import { CalendarEvent } from "@tutao/entities/tutanota"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { QuickSearchBar, SearchBarAttrs } from "../../../common/gui/QuickSearchBar"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { getTimeZone } from "../../../common/calendar/date/CalendarUtils"
import { LiveSearchResult, QuickSearchQuery, SearchQuery } from "../../../common/search/SearchUtils"
import { formatEventDuration } from "../gui/DateTimeTextFormatterUtils"

export interface CalendarSearchBarAttrs {
	loadResults: (searchQuery: QuickSearchQuery) => Promise<LiveSearchResult<CalendarEvent>>
	selectResult: (searchQuery: SearchQuery, entry: CalendarEvent | null) => unknown
	shouldOfferUpgrade: boolean
}

/** Search bar that shows the results in the overlay. */
export class CalendarQuickSearchBar implements ClassComponent<CalendarSearchBarAttrs> {
	view({ attrs }: Vnode<CalendarSearchBarAttrs, this>): Children {
		return m(QuickSearchBar<CalendarEvent>, {
			placeholder: lang.getTranslationText("searchCalendar_placeholder"),
			loadResults: (query) =>
				attrs.loadResults({
					query,
					maxResults: 10,
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
