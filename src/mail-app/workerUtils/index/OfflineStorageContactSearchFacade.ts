import { ContactSearchFacade } from "./ContactSearchFacade"
import { OfflineStorageSearchFacade } from "./OfflineStorageSearchFacade"
import { ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"

/**
 * SQLite-based contact search
 */
export class OfflineStorageContactSearchFacade implements ContactSearchFacade {
	constructor(private readonly search: OfflineStorageSearchFacade) {}

	async findContacts(query: string, field: "mailAddresses" | null, minResults: number = 0): Promise<IdTuple[]> {
		const results = await this.search.search(
			query,
			{
				type: ContactTypeRef,
				field,

				// we use specific column names rather than attribute IDs
				attributeIds: null,

				// none of these apply to contacts
				start: null,
				end: null,
				folderIds: [],
				eventSeries: null,
			},
			minResults,
		)
		return results.results
	}
}
