import { ContactSearchFacade } from "./ContactSearchFacade"
import { OfflineStorageSearchFacade } from "./OfflineStorageSearchFacade"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"

/**
 * SQLite-based contact search
 */
export class OfflineStorageContactSearchFacade implements ContactSearchFacade {
	constructor(private readonly search: OfflineStorageSearchFacade) {}

	async findContacts(query: string, field: "mailAddresses" | null, minResults: number = 0): Promise<IdTuple[]> {
		const results = await this.search.search(
			query,
			{
				type: SearchCategoryType.contact,
				field,

				// we use specific column names rather than attribute IDs
				attributeIds: null,

				// none of these apply to contacts
				start: null,
				end: null,
				folderIds: [],
				eventSeries: null,
			},
			{ minSuggestionCount: minResults },
		)
		return results.results
	}
}
