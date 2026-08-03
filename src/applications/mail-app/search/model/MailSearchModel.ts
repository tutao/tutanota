import stream from "mithril/stream"
import Stream from "mithril/stream"
import { elementIdPart, getElementId } from "../../../../platform-kit/meta"
import { assertMainOrNode, isAdminClient, isBrowser, NOTHING_INDEXED_TIMESTAMP } from "../../../../platform-kit/app-env"
import { DbError } from "../../../common/api/common/error/DbError"
import { SearchIndexStateInfo, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import { assertNotNull, collectToMap, mapAndFilterNull, ofClass, remove } from "../../../../platform-kit/utils"
import { SearchFacade } from "../../workerUtils/index/SearchFacade"
import { areResultsForTheSameQuery, hasMoreResults } from "./SearchUtils"
import { Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { EventController } from "../../../common/api/main/EventController"
import { OnEntityUpdateReceivedPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { applyEntityUpdates, LiveSearchResult, mailSearchComparator, SearchQuery } from "../../../common/search/SearchUtils"

assertMainOrNode()

export class MailSearchModel {
	indexState: Stream<SearchIndexStateInfo>
	indexingSupported: boolean
	private lastSearchPromise: Promise<SearchResult | void>
	private lastSearchExtensionPromise: Promise<void>

	private readonly liveResults: LiveSearchResult<unknown>[] = []

	constructor(
		private readonly searchFacade: SearchFacade,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
	) {
		this.indexingSupported = true
		this.indexState = stream<SearchIndexStateInfo>({
			initializing: true,
			mailIndexEnabled: false,
			progress: 0,
			currentMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			aimedMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			indexedMailCount: 0,
			failedIndexingUpTo: null,
		})
		this.lastSearchPromise = Promise.resolve()
		this.lastSearchExtensionPromise = Promise.resolve()

		this.eventController.addEntityListener({
			onEntityUpdatesReceived: async (updates, eventOwnerGroupId, isInitialSyncDone) => {
				for (const liveResult of this.liveResults) {
					await liveResult.entityEventsReceived(updates)
				}
			},
			// receive updates after models
			priority: OnEntityUpdateReceivedPriority.LOW,
		})
	}

	async coolNewSearchMails(searchQuery: SearchQuery): Promise<LiveSearchResult<Mail>> {
		const searchResult: SearchResult = await this.searchFacade.search(searchQuery.query, searchQuery.restriction, {
			maxResults: searchQuery.maxResults ?? undefined,
		})
		const mails = await loadMultipleFromLists(MailTypeRef, this.entityClient, searchResult.results)
		mails.sort(mailSearchComparator)
		const result: LiveSearchResult<Mail> = {
			searchResult,
			items: mails,
			loadMoreResults: async (count) => {
				if (hasMoreResults(result.searchResult)) {
					// we do not change searchResult itself in response to entity updates so even if some entity was
					// deleted from the items list it doesn't affect index in searchResult
					const previousLength = result.searchResult.results.length
					result.searchResult = await this.searchFacade.getMoreSearchResults(result.searchResult, count)
					const toLoad = result.searchResult.results.slice(previousLength)
					let items: Mail[] = await loadMultipleFromLists(MailTypeRef, this.entityClient, toLoad)
					items.sort(mailSearchComparator)

					// Restore the original sorting order
					if (!isBrowser() && !isAdminClient()) {
						const itemsMapped = collectToMap(items, getElementId)
						items = mapAndFilterNull<IdTuple, Mail>(searchResult.results, (id) => itemsMapped.get(elementIdPart(id)) ?? null)
					}
					result.items.push(...items)
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
				remove(this.liveResults, result)
				result.updates.end(true)
			},
			extendResults: async (extendEnd) => {
				await this.lastSearchPromise
				await this.lastSearchExtensionPromise

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
						if (currentResultAgain == null || !areResultsForTheSameQuery(currentResult, currentResultAgain)) {
							return
						}
						const newItems = await Promise.all(extendedResult.results.map(async (id) => await this.entityClient.load(MailTypeRef, id)))
						result.searchResult = extendedResult
						result.items.push(...newItems)
					})
					.catch(
						ofClass(DbError, (e) => {
							console.log("DbError while extending search result", e)
							throw e
						}),
					)
			},
			entityEventsReceived: async (updates) => {
				await applyEntityUpdates(this.entityClient, MailTypeRef, result.items, updates, result.updates)
			},
		}
		this.liveResults.push(result)
		return result
	}
}
