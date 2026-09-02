import stream from "mithril/stream"
import Stream from "mithril/stream"
import { elementIdPart, listIdPart } from "../../../../platform-kit/meta"
import { EnvProvider, NOTHING_INDEXED_TIMESTAMP, ProgrammingError } from "../../../../platform-kit/app-env"
import { DbError } from "../../../common/api/common/error/DbError"
import { SearchIndexStateInfo, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { assertNotNull, isEmpty, ofClass } from "../../../../platform-kit/utils"
import { SearchFacade } from "../../workerUtils/index/SearchFacade"
import { areResultsForTheSameQuery, hasMoreResults, mailSearchComparator } from "./MailSearchUtils"
import { Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { EventController } from "../../../common/api/main/EventController"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { applyEntityUpdates, LiveSearchResult, SearchQuery } from "../../../common/search/SearchUtils"
import { compareMails } from "../../mail/model/MailUtils"
import { EntityUpdatesListener, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { getMailIndexTimestampForSearch } from "../../../common/api/common/utils/IndexUtils"

EnvProvider.assertMainOrNode()

export class MailSearchModel {
	readonly indexState: Stream<SearchIndexStateInfo>
	indexingSupported: boolean
	private lastSearchExtensionPromise: Promise<void>

	constructor(
		private readonly searchFacade: SearchFacade,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		registerIndexingNotAvailableHandler: (handler: () => unknown) => unknown,
	) {
		this.indexingSupported = true
		this.indexState = stream<SearchIndexStateInfo>({
			initializing: true,
			mailIndexEnabled: EnvProvider.get().isOfflineStorageAvailable(),
			progress: 0,
			currentMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			aimedMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			indexedMailCount: 0,
			failedIndexingUpTo: null,
		})
		this.lastSearchExtensionPromise = Promise.resolve()

		registerIndexingNotAvailableHandler(() => {
			this.indexingSupported = false
		})
	}

	async searchMails(searchQuery: SearchQuery): Promise<LiveSearchResult<Mail>> {
		if (!EnvProvider.get().isFullArchiveSearchAvailable() && searchQuery.restriction.end == null) {
			// we set search end when null to be able to tell when the same search is extended
			const indexState = this.indexState()
			searchQuery.restriction.end = getMailIndexTimestampForSearch(indexState.aimedMailIndexTimestamp)
		}
		const searchResult: SearchResult = await this.searchFacade.search(searchQuery.query, searchQuery.restriction, {
			maxResults: searchQuery.maxResults ?? undefined,
		})
		let mails = await loadMultipleFromLists(MailTypeRef, this.entityClient, searchResult.results)
		mails.sort(mailSearchComparator)
		const result: LiveSearchResult<Mail> = {
			searchResult,
			get items() {
				return mails
			},
			loadMoreResults: async (count) => {
				if (hasMoreResults(result.searchResult)) {
					// we do not change searchResult itself in response to entity updates so even if some entity was
					// deleted from the items list it doesn't affect index in searchResult
					const previousLength = result.searchResult.results.length
					result.searchResult = await this.searchFacade.getMoreSearchResults(result.searchResult, count)
					const toLoad = result.searchResult.results.slice(previousLength)
					let items: Mail[] = await loadMultipleFromLists(MailTypeRef, this.entityClient, toLoad)
					items.sort(mailSearchComparator)

					mails.push(...items)
					return items
				} else {
					return []
				}
			},
			get hasMoreResults() {
				return hasMoreResults(result.searchResult)
			},
			updates: stream(),
			dispose: () => {
				this.eventController.removeEntityUpdatesListener(entityUpdatesListener)
				result.updates.end(true)
			},
			extendResults: async (extendEnd) => {
				if (EnvProvider.get().isFullArchiveSearchAvailable()) {
					throw new ProgrammingError("Tried to extend search result but non-blocking search isn't available")
				}

				await this.lastSearchExtensionPromise.catch(
					ofClass(DbError, (e) => {
						console.log("DbError while extending search result", e)
					}),
				)

				const currentResult = result.searchResult
				if (currentResult == null || currentResult.query.trim() === "") {
					return
				}

				const currentResultEndCutoff = Math.max(
					// when searching, we set end restriction to aimedMailIndexTimestamp when null, so it should never be null when extending
					assertNotNull(currentResult.restriction.end, "null end restriction when extending search"),
					currentResult.currentIndexTimestamp,
				)
				// search result already complete, no need to extend
				if (currentResultEndCutoff <= extendEnd) {
					return
				}

				this.lastSearchExtensionPromise = this.searchFacade
					.extendSearchResult(currentResult, extendEnd)
					.then(async (extendedResult) => {
						const currentResultAgain = result.searchResult
						if (currentResultAgain == null || !areResultsForTheSameQuery(currentResult, currentResultAgain) || isEmpty(extendedResult.results)) {
							return
						}
						const listId = listIdPart(extendedResult.results[0])
						const elementIds = extendedResult.results.map((id) => elementIdPart(id))
						const newItems = await this.entityClient.loadMultiple(MailTypeRef, listId, elementIds)
						newItems.sort(compareMails)
						result.searchResult = extendedResult
						mails = newItems
						result.updates({ type: "reset" })
					})
					.catch(
						ofClass(DbError, (e) => {
							console.log("DbError while extending search result", e)
							throw e
						}),
					)
			},
		}
		const entityUpdatesListener: EntityUpdatesListener = {
			id: `Mail LiveSearchResult ${searchQuery.query}`,
			priority: ListenerPriority.LOW,
			onEntityUpdatesReceived: async (updates) => {
				await applyEntityUpdates(this.entityClient, MailTypeRef, mails, updates, result.updates)
			},
		}
		this.eventController.addEntityUpdatesListener(entityUpdatesListener)
		return result
	}
}
