import { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef, DriveGroupRootTypeRef } from "@tutao/entities/drive"
import { collectToMap, isEmpty, isNotEmpty, isNotNull, lastIndex, lastThrow, tokenize } from "@tutao/utils"
import { assertIsEntity, elementIdPart, GENERATED_MAX_ID, getElementId, idToElementId, isSameSingleId, isSameTypeRef, OperationType } from "@tutao/meta"
import { isDriveFile } from "../../../common/api/common/drive/DriveUtils"
import { EntityClient, loadMultipleFromLists } from "../../../../platform-kit/network/EntityClient"
import { EntityUpdatesListener, isUpdateForTypeRef, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { EventController } from "../../../common/api/main/EventController"
import { collectionUniqueBy } from "../../../../platform-kit/utils/CollectionUtils"
import { LiveSearchResult, SearchQuery, SearchResultUpdate } from "../../../common/search/SearchUtils"
import { FolderItem, folderItemId, toFolderItem } from "../../drive/view/DriveUtils"

export class DriveSearchModel {
	constructor(
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
	) {}
	async searchDrive(
		searchQuery: SearchQuery,
		fileGroupId: string,
		compareDriveItems?: (a: DriveFile | DriveFolder, b: DriveFile | DriveFolder) => number,
	): Promise<LiveSearchResult<FolderItem>> {
		const groupRoot = await this.entityClient.load(DriveGroupRootTypeRef, idToElementId(fileGroupId))
		const resultItems: (DriveFolder | DriveFile)[] = []
		const tokens = tokenize(searchQuery.query.trim())
		if (searchQuery.query !== "") {
			for (const fileBagId of groupRoot.fileBags) {
				let currentId = GENERATED_MAX_ID
				while (true) {
					const chunk = await this.entityClient.loadRange(DriveFileTypeRef, fileBagId.files, currentId, 100, true)
					if (isEmpty(chunk)) {
						break
					}
					for (const item of chunk) {
						if (this.isDriveItemInDateRange(item, searchQuery.restriction)) {
							const name = item.name.toLowerCase()

							if (tokens.every((token) => name.includes(token))) {
								resultItems.push(item)
							}
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
						if (this.isDriveItemInDateRange(item, searchQuery.restriction)) {
							const name = item.name.toLowerCase()

							if (tokens.every((token) => name.includes(token))) {
								resultItems.push(item)
							}
						}
					}
					currentId = getElementId(lastThrow(chunk))
				}
			}
		}
		if (compareDriveItems) {
			resultItems.sort(compareDriveItems)
		}
		const parentFolderIds = resultItems.map((item) => (isDriveFile(item) ? item.folder : item.parent)).filter(isNotNull)
		const uniqueParentFolderIds = [...collectionUniqueBy(parentFolderIds, (item) => elementIdPart(item))]
		const parentFolders = await loadMultipleFromLists(DriveFolderTypeRef, this.entityClient, uniqueParentFolderIds)
		const idToParentFolder = collectToMap(parentFolders, (parent) => elementIdPart(parent._id))

		const extendedResultItems: FolderItem[] = resultItems.map((item) => {
			let parent: DriveFolder | null = null

			const parentFolderId = isDriveFile(item) ? item.folder : item.parent
			if (parentFolderId) {
				parent = idToParentFolder.get(elementIdPart(parentFolderId)) ?? null
			}
			return toFolderItem(item, parent)
		})
		let loadedUntil = Math.min(searchQuery.maxResults ?? extendedResultItems.length, extendedResultItems.length)
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
		const updatesStream: Stream<SearchResultUpdate<FolderItem>> = stream<SearchResultUpdate<FolderItem>>()
		const liveResult: LiveSearchResult<FolderItem> = {
			searchResult,
			get items() {
				return extendedResultItems.slice(0, loadedUntil)
			},
			loadMoreResults: async (count) => {
				const oldLoadedUntil = loadedUntil
				loadedUntil = Math.min(loadedUntil + count, extendedResultItems.length)
				return extendedResultItems.slice(oldLoadedUntil, loadedUntil)
			},
			extendResults: (extendEnd) => {},
			updates: updatesStream,
			dispose: () => {
				this.eventController.removeEntityUpdatesListener(entityUpdatesListener)
				liveResult.updates.end(true)
			},
			get hasMoreResults() {
				return isNotEmpty(extendedResultItems) && loadedUntil < lastIndex(extendedResultItems)
			},
		}
		const entityUpdatesListener: EntityUpdatesListener = {
			id: `Drive LiveSearchResult ${searchQuery.query}`,
			onEntityUpdatesReceived: async (updates) => {
				for (const update of updates) {
					if (isUpdateForTypeRef(DriveFolderTypeRef, update) || isUpdateForTypeRef(DriveFileTypeRef, update)) {
						if (update.operation === OperationType.DELETE) {
							const index = extendedResultItems.findIndex((item) => isSameSingleId(elementIdPart(folderItemId(item)), update.instanceId))
							if (index !== -1) {
								const [item] = extendedResultItems.splice(index, 1)
								updatesStream({ type: "deleteitem", item: item })
							}
						} else if (update.operation === OperationType.UPDATE) {
							const index = extendedResultItems.findIndex((item) => isSameSingleId(elementIdPart(folderItemId(item)), update.instanceId))
							// surprisingly hard to convince ts that this is the correct id type
							const instanceIdTuple = [update.instanceListId, update.instanceId] as unknown as IdTuple
							const updatedItem = isSameTypeRef(update.typeRef, DriveFolderTypeRef)
								? await this.entityClient.load(DriveFolderTypeRef, instanceIdTuple)
								: await this.entityClient.load(DriveFileTypeRef, instanceIdTuple)
							const parentFolderId = assertIsEntity(updatedItem, DriveFileTypeRef) ? updatedItem.folder : updatedItem.parent
							const parentFolder = parentFolderId ? await this.entityClient.load(DriveFolderTypeRef, parentFolderId) : null
							const updatedResult: FolderItem = toFolderItem(updatedItem, parentFolder)
							if (tokens.every((token) => updatedItem.name.toLowerCase().includes(token))) {
								if (index !== -1) {
									extendedResultItems.splice(index, 1, updatedResult)
									updatesStream({ type: "updateitem", item: updatedResult })
								}
							} else if (index !== -1) {
								extendedResultItems.splice(index, 1)
								updatesStream({ type: "deleteitem", item: updatedResult })
							}
						}
					}
				}
			},
			priority: ListenerPriority.LOW,
		}
		this.eventController.addEntityUpdatesListener(entityUpdatesListener)
		return liveResult
	}

	private isDriveItemInDateRange(item: DriveFile | DriveFolder, { start, end }: SearchRestriction): boolean {
		return (end ? item.createdDate.getTime() >= end : true) && (start ? item.createdDate.getTime() <= start : true)
	}
}
