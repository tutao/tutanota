import Stream from "mithril/stream"
import type { SearchRestriction, SearchResult } from "../api/worker/search/SearchTypes.js"
import { SearchQuery } from "../../calendar-app/calendar/search/model/CalendarSearchModel.js"
import { ProgressTracker } from "../api/main/ProgressTracker.js"

export interface CommonSearchModel {
	result: Stream<SearchResult | null>
	lastQueryString: Stream<string | null>
	cancelSignal: Stream<boolean>

	search(searchQuery: SearchQuery, progressTracker: ProgressTracker): Promise<SearchResult | void>

	isNewSearch(query: string, restriction: SearchRestriction): boolean

	sendCancelSignal(): void
}
