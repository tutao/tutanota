import o from "@tutao/otest"
import { DriveSearchModel } from "../../../src/applications/drive-app/search/model/DriveSearchModel"
import { EntityClient } from "../../../src/platform-kit/network/EntityClient"
import { clientInitializedTypeModelResolver, createTestEntity, EventControllerMock } from "../TestUtils"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import {
	DriveFile,
	DriveFileBagTypeRef,
	DriveFileTypeRef,
	DriveFolder,
	DriveFolderBagTypeRef,
	DriveFolderTypeRef,
	DriveGroupRootTypeRef,
} from "@tutao/entities/drive"

import { SearchCategoryType } from "../../../src/applications/common/api/worker/search/SearchTypes"
import { SearchQuery } from "../../../src/applications/common/search/SearchUtils"
import { EntityEventsListener, OnEntityUpdateReceivedPriority } from "../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"

o.spec("DriveSearchModel", function () {
	o.spec("Entity updates", function () {
		let searchModel: DriveSearchModel
		let eventController: EventControllerMock
		let entityRestClientMock: EntityRestClientMock
		let entityClient: EntityClient
		o.beforeEach(function () {
			eventController = new EventControllerMock()
			entityRestClientMock = new EntityRestClientMock()
			entityClient = new EntityClient(entityRestClientMock, clientInitializedTypeModelResolver())
			searchModel = new DriveSearchModel(eventController, entityClient)
		})
		o("when file is deleted it is removed from the result", async function () {
			const fileListId = "listId"
			const file1: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file1", _id: [fileListId, "file1"] })
			const file2: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file2", _id: [fileListId, "file2"] })
			const file3: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file3", _id: [fileListId, "file3"] })
			const file4: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file4", _id: [fileListId, "file4"] })
			const folderListId = "folderlistId"
			const folder1: DriveFolder = createTestEntity(DriveFolderTypeRef, { name: "f1", _id: [folderListId, "f1"] })
			const folder2: DriveFolder = createTestEntity(DriveFolderTypeRef, { name: "f2", _id: [folderListId, "f2"] })
			const folder3: DriveFolder = createTestEntity(DriveFolderTypeRef, { name: "f3", _id: [folderListId, "f3"] })
			const folder4: DriveFolder = createTestEntity(DriveFolderTypeRef, { name: "f4", _id: [folderListId, "f4"] })
			const groupRoot = createTestEntity(DriveGroupRootTypeRef, {
				_id: "123",
				fileBags: [createTestEntity(DriveFileBagTypeRef, { files: fileListId })],
				folderBags: [createTestEntity(DriveFolderBagTypeRef, { folders: folderListId })],
			})
			entityRestClientMock.addElementInstances(groupRoot)
			entityRestClientMock.addListInstances(file1, file2, file3, file4, folder3, folder1, folder2, folder4)
			const searchQuery: SearchQuery = {
				query: "file1",
				maxResults: null,
				restriction: {
					type: SearchCategoryType.drive,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					eventSeries: null,
					folderIds: [],
				},
			}

			const searchResult = await searchModel.coolNewSearchDrive(searchQuery, groupRoot._id, () => 0)
			o.check(searchResult.items).deepEquals([{ item: file1, parent: null }])
			const updateListener: EntityEventsListener = {
				onEntityUpdatesReceived: async (updates, eventOwnerGroupId, isInitialSyncDone) => {
					await searchResult.entityEventsReceived(updates)
				},
				priority: OnEntityUpdateReceivedPriority.LOW,
			}
			eventController.addEntityListener(updateListener)
			entityRestClientMock.erase(file1)
			o.check(searchResult.items).deepEquals([])
		})
	})
})
