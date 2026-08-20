import { Contact, ContactTypeRef } from "@tutao/entities/tutanota"
import { SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { isNotEmpty, lastIndex } from "@tutao/utils"
import stream from "mithril/stream"
import { SearchFacade } from "../../workerUtils/index/SearchFacade"
import { EventController } from "../../../common/api/main/EventController"
import { applyEntityUpdates, LiveSearchResult, SearchQuery } from "../../../common/search/SearchUtils"
import { EntityUpdatesListener, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { compareContacts } from "../../contacts/ContactUtils"

export class ContactSearchModel {
	indexingSupported: boolean = true

	constructor(
		private readonly searchFacade: SearchFacade,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		registerIndexingNotAvailableHandler: (handler: () => unknown) => unknown,
	) {
		registerIndexingNotAvailableHandler(() => {
			this.indexingSupported = false
		})
	}

	async searchContacts(searchQuery: SearchQuery): Promise<LiveSearchResult<Contact>> {
		const searchResult: SearchResult = await this.searchFacade.search(searchQuery.query, searchQuery.restriction, {
			maxResults: searchQuery.maxResults ?? undefined,
		})
		const resultItems = await loadMultipleFromLists(ContactTypeRef, this.entityClient, searchResult.results)
		resultItems.sort((a, b) => compareContacts(a, b))
		let loadedUntil = Math.min(searchQuery.maxResults ?? resultItems.length, resultItems.length)
		const result: LiveSearchResult<Contact> = {
			searchResult,
			get items() {
				return resultItems.slice(0, loadedUntil)
			},
			loadMoreResults: async (count) => {
				const oldLoadedUntil = loadedUntil
				loadedUntil = Math.min(loadedUntil + count, resultItems.length)
				return resultItems.slice(oldLoadedUntil, loadedUntil)
			},
			get hasMoreResults() {
				return isNotEmpty(resultItems) && loadedUntil < lastIndex(resultItems)
			},
			updates: stream(),
			dispose: () => {
				this.eventController.removeEntityUpdatesListener(entityUpdatesListener)
				result.updates.end(true)
			},
			extendResults: (_extendEnd) => {},
		}

		const entityUpdatesListener: EntityUpdatesListener = {
			id: `Contact LiveSearchResult ${searchQuery.query}`,
			onEntityUpdatesReceived: async (updates) => {
				await applyEntityUpdates(this.entityClient, ContactTypeRef, resultItems, updates, result.updates)
			},
			priority: ListenerPriority.LOW,
		}
		this.eventController.addEntityUpdatesListener(entityUpdatesListener)
		return result
	}
}
