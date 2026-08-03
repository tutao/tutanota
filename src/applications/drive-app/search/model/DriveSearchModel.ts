import { SearchResult } from "../../../common/api/worker/search/SearchTypes"
import stream from "mithril/stream"
import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef, DriveGroupRootTypeRef } from "@tutao/entities/drive"
import { collectToMap, isEmpty, isNotNull, lastThrow, remove, tokenize } from "@tutao/utils"
import { elementIdPart, GENERATED_MAX_ID, getElementId, isSameId, isSameTypeRef, OperationType } from "@tutao/meta"
import { isDriveFile } from "../../../common/api/common/drive/DriveUtils"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { hasMoreResults } from "../../../mail-app/search/model/SearchUtils"
import { isUpdateForTypeRef, OnEntityUpdateReceivedPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EventController } from "../../../common/api/main/EventController"
import { collectionUniqueBy } from "../../../../platform-kit/utils/CollectionUtils"
import { LiveSearchResult, ResultUpdate, SearchQuery } from "../../../common/search/SearchUtils"
import Stream from "mithril/stream"
import { folderItemParent, toFolderItem } from "../../drive/view/DriveUtils"

export interface DriveSearchResult {
	item: DriveFolder | DriveFile
	parent: DriveFolder | null
}

export class DriveSearchModel {
	private readonly liveResults: LiveSearchResult<unknown>[] = []

	constructor(
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
	) {
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

	async coolNewSearchDrive(
		searchQuery: SearchQuery,
		fileGroupId: string,
		compareDriveItems: (a: DriveFile | DriveFolder, b: DriveFile | DriveFolder) => number,
	): Promise<LiveSearchResult<DriveSearchResult>> {
		const groupRoot = await this.entityClient.load(DriveGroupRootTypeRef, fileGroupId)
		const resultItems: (DriveFolder | DriveFile)[] = []
		const tokens = tokenize(searchQuery.query.trim())
		for (const fileBagId of groupRoot.fileBags) {
			let currentId = GENERATED_MAX_ID
			while (true) {
				const chunk = await this.entityClient.loadRange(DriveFileTypeRef, fileBagId.files, currentId, 100, true)
				if (isEmpty(chunk)) {
					break
				}
				for (const item of chunk) {
					const name = item.name.toLowerCase()

					if (tokens.every((token) => name.includes(token))) {
						resultItems.push(item)
					}
				}

				currentId = getElementId(lastThrow(chunk))
			}
		}
		for (const folderBagId of groupRoot.folderBags) {
			let currentId = GENERATED_MAX_ID
			while (true) {
				const chunk = await this.entityClient.loadRange(DriveFolderTypeRef, folderBagId.folders, currentId, 100, true)
				if (isEmpty(chunk)) {
					break
				}
				for (const item of chunk) {
					const name = item.name.toLowerCase()

					if (tokens.every((token) => name.includes(token))) {
						resultItems.push(item)
					}
				}
				currentId = getElementId(lastThrow(chunk))
			}
		}

		resultItems.sort(compareDriveItems)

		const parentFolderIds = resultItems.map((item) => (isDriveFile(item) ? item.folder : item.parent)).filter(isNotNull)
		const uniqueParentFolderIds = [...collectionUniqueBy(parentFolderIds, (item) => elementIdPart(item))]
		const parentFolders = await loadMultipleFromLists(DriveFolderTypeRef, this.entityClient, uniqueParentFolderIds)
		const idToParentFolder = collectToMap(parentFolders, (parent) => elementIdPart(parent._id))

		const extendedResultItems: DriveSearchResult[] = resultItems.map((item) => {
			let parent: DriveFolder | null = null

			const parentFolderId = isDriveFile(item) ? item.folder : item.parent
			if (parentFolderId) {
				parent = idToParentFolder.get(elementIdPart(parentFolderId)) ?? null
			}

			return { item, parent }
		})

		const searchResult: SearchResult = {
			matchWordOrder: false,
			restriction: searchQuery.restriction,
			results: resultItems.map((item) => item._id),
			query: searchQuery.query,
			tokens: tokens.map((t) => {
				return { token: t, exact: false }
			}),
			// index related, keep empty
			currentIndexTimestamp: 0,
			moreResults: [],
			moreResultsEntries: [],
			lastReadSearchIndexRow: [],
		}
		const updatesStream: Stream<ResultUpdate<DriveSearchResult>> = stream<ResultUpdate<DriveSearchResult>>()
		const liveResult: LiveSearchResult<DriveSearchResult> = {
			searchResult,
			items: extendedResultItems,
			loadMoreResults: async (count) => {
				return []
			},
			extendResults: (extendEnd) => {},
			updates: updatesStream,
			dispose: () => {
				remove(this.liveResults, liveResult)
				liveResult.updates.end(true)
			},
			get hasMoreResults() {
				return hasMoreResults(liveResult.searchResult)
			},
			entityEventsReceived: async (updates) => {
				for (const update of updates) {
					if (isUpdateForTypeRef(DriveFolderTypeRef, update) || isUpdateForTypeRef(DriveFileTypeRef, update)) {
						if (update.operation === OperationType.DELETE) {
							const index = liveResult.items.findIndex((item) => isSameId(getElementId(item.item), update.instanceId))
							if (index !== -1) {
								const [item] = liveResult.items.splice(index, 1)
								updatesStream({ type: "deleteitem", item: item })
							}
						} else if (update.operation === OperationType.UPDATE) {
							const index = liveResult.items.findIndex((item) => isSameId(getElementId(item.item), update.instanceId))
							// surprisingly hard to convince ts that this is the correct id type
							const instanceIdTuple = [update.instanceListId, update.instanceId] as unknown as IdTuple
							const updatedItem = isSameTypeRef(update.typeRef, DriveFolderTypeRef)
								? await this.entityClient.load(DriveFolderTypeRef, instanceIdTuple)
								: await this.entityClient.load(DriveFileTypeRef, instanceIdTuple)
							const parentFolderId = folderItemParent(toFolderItem(updatedItem))
							const parentFolder = parentFolderId ? await this.entityClient.load(DriveFolderTypeRef, parentFolderId) : null
							if (index !== -1) {
								const updatedResult: DriveSearchResult = {
									item: updatedItem,
									parent: parentFolder,
								}
								liveResult.items.splice(index, 1, updatedResult)

								updatesStream({ type: "updateitem", item: updatedResult })
							}
						}
					}
				}
			},
		}
		this.liveResults.push(liveResult)
		return liveResult
	}
}
