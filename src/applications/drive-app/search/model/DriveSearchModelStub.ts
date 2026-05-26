import { SearchQuery } from "../../../calendar-app/calendar/search/model/CalendarSearchModel"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker"
import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { CommonSearchModel } from "../../../common/search/CommonSearchModel"
import Stream from "mithril/stream"
import stream from "mithril/stream"

export class DriveSearchModelStub implements CommonSearchModel {
	result: Stream<SearchResult | null> = stream()
	lastQueryString: Stream<string | null> = stream()
	cancelSignal: Stream<boolean> = stream()
	search(searchQuery: SearchQuery, progressTracker: ProgressTracker): Promise<SearchResult | void> {
		throw new Error("Method not implemented.")
	}
	isNewSearch(query: string, restriction: SearchRestriction): boolean {
		throw new Error("Method not implemented.")
	}
	sendCancelSignal(): void {
		throw new Error("Method not implemented.")
	}
}
