import { ListModel } from "../../../common/misc/ListModel"
import { SearchResultListEntry } from "../../../mail-app/search/view/SearchListView"
import Id from "../../../../ui/translations/id"
import { emptyListModel } from "../../../common/search/SearchUtils"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { createRestriction, getSearchUrl } from "../../../mail-app/search/model/SearchUtils"
import { DateProvider } from "@tutao/utils"
import { SearchRouter } from "../../../common/search/view/SearchRouter"

export class DriveSearchViewModel {
	#listModel: ListModel<SearchResultListEntry, Id> = emptyListModel()
	#startDate: Date | null = null
	get startDate(): Date | null {
		return this.#startDate ?? new Date()
	}
	#endDate: Date | null = null
	get endDate(): Date {
		if (this.#endDate) {
			return this.#endDate
		} else {
			return new Date(this.dateProvider.now())
		}
	}
	get listModel(): ListModel<SearchResultListEntry, Id> {
		return this.#listModel
	}
	#delayingSearch: boolean = false
	get busy(): boolean {
		return this.#delayingSearch
	}
	private currentQuery: string = ""
	constructor(
		readonly router: SearchRouter,
		private readonly dateProvider: DateProvider,
	) {}

	getUrlFromSearchCategory(category: SearchCategoryType): string {
		return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null))
	}

	getCurrentQuery() {
		return ""
	}

	onSearchQueryUpdated(text: string) {}
}
