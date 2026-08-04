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
import { getElementId, OperationType } from "../../../src/platform-kit/meta"
import { noPatchesAndInstance } from "../api/worker/EventBusClientTest"

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

			let searchResult = await searchModel.coolNewSearchDrive(searchQuery, groupRoot._id, () => 0)
			o.check(searchResult.items).deepEquals([{ item: file1, parent: null }])

			await eventController.onEntityUpdateReceived(
				[
					{
						typeRef: DriveFileTypeRef,
						operation: OperationType.DELETE,
						instanceListId: fileListId,
						instanceId: getElementId(file1),
						...noPatchesAndInstance,
					},
				],
				"fileGroupId",
				true,
			)
			o.check(searchResult.items).deepEquals([])
		})
		o("when file name is updated and its new name is not included in the query, it is removed from the search result", async function () {
			const fileListId = "listId"
			let file1: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file1", _id: [fileListId, "file1"] })
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

			let searchResult = await searchModel.coolNewSearchDrive(searchQuery, groupRoot._id, () => 0)
			o.check(searchResult.items).deepEquals([{ item: file1, parent: null }])
			file1.name = "updated"
			await eventController.onEntityUpdateReceived(
				[
					{
						typeRef: DriveFileTypeRef,
						operation: OperationType.UPDATE,
						instanceListId: fileListId,
						instanceId: getElementId(file1),
						...noPatchesAndInstance,
					},
				],
				"fileGroupId",
				true,
			)
			o.check(searchResult.items).deepEquals([])
		})
		o("when a new file is created, it should be included in the search result if its name matches the query", async function () {
			const fileListId = "listId"
			let file1: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file1", _id: [fileListId, "file1"] })
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
			entityRestClientMock.addListInstances(file1, file3, file4, folder3, folder1, folder2, folder4)
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

			let searchResult = await searchModel.coolNewSearchDrive(searchQuery, groupRoot._id, () => 0)
			o.check(searchResult.items).deepEquals([{ item: file1, parent: null }])
			const file2: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file12", _id: [fileListId, "file2"] })
			entityRestClientMock.addListInstances(file2)
			await eventController.onEntityUpdateReceived(
				[
					{
						typeRef: DriveFileTypeRef,
						operation: OperationType.CREATE,
						instanceListId: fileListId,
						instanceId: getElementId(file2),
						...noPatchesAndInstance,
					},
				],
				"fileGroupId",
				true,
			)
			o.check(searchResult.items).deepEquals([
				{ item: file1, parent: null },
				{ item: file2, parent: null },
			])
		})
		o("when a file is renamed, it should be included in the search result if its name matches the query", async function () {
			const fileListId = "listId"
			let file1: DriveFile = createTestEntity(DriveFileTypeRef, { name: "file1", _id: [fileListId, "file1"] })
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

			let searchResult = await searchModel.coolNewSearchDrive(searchQuery, groupRoot._id, () => 0)
			o.check(searchResult.items).deepEquals([{ item: file1, parent: null }])
			file2.name = "file12"
			await eventController.onEntityUpdateReceived(
				[
					{
						typeRef: DriveFileTypeRef,
						operation: OperationType.UPDATE,
						instanceListId: fileListId,
						instanceId: getElementId(file2),
						...noPatchesAndInstance,
					},
				],
				"fileGroupId",
				true,
			)
			o.check(searchResult.items).deepEquals([
				{ item: file1, parent: null },
				{ item: file2, parent: null },
			])
		})
	})
})
