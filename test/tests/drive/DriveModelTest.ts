import o, { verify } from "@tutao/otest"
import { DriveModel } from "../../../src/applications/drive-app/drive/model/DriveModel"
import { DriveTransferController } from "../../../src/applications/drive-app/drive/view/DriveTransferController"
import { DriveFacade, DriveFolderType, DriveRootFolders } from "../../../src/applications/common/api/worker/facades/lazy/DriveFacade"
import { EntityClient } from "../../../src/platform-kit/network/EntityClient"
import { EventController } from "../../../src/applications/common/api/main/EventController"
import { TransferProgressDispatcher } from "../../../src/applications/common/api/main/TransferProgressDispatcher"
import { matchers, object, when } from "testdouble"
import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "@tutao/entities/drive"
import { clientInitializedTypeModelResolver, createTestEntity } from "../TestUtils"
import { FileFolderItem, FolderFolderItem, FolderItem, FolderItemId, toFolderItem } from "../../../src/applications/drive-app/drive/view/DriveUtils"
import { elementIdPart, getElementId } from "../../../src/platform-kit/meta"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import { WebFile } from "../../../src/entities/tutanota/Utils"

o.spec("DriveModel", function () {
	let transferController: DriveTransferController
	let driveFacade: DriveFacade
	let entityRestClientMock: EntityRestClientMock
	let entityClient: EntityClient
	let eventController: EventController
	let transferProgressDispatcher: TransferProgressDispatcher

	let driveModel: DriveModel

	const rootIds: Readonly<DriveRootFolders> = {
		root: ["RootListID", "RootElementID"],
		trash: ["RootListID", "TrashElementID"],
	}

	const rootFolders = {
		root: createTestEntity(DriveFolderTypeRef, {
			_id: rootIds.root,
			type: DriveFolderType.Root,
			name: "",
			parent: null,
			files: "filesId",
			updatedDate: new Date(1),
			createdDate: new Date(1),
			originalParent: null,
		}),
		trash: createTestEntity(DriveFolderTypeRef, {
			_id: rootIds.trash,
			type: DriveFolderType.Trash,
			name: "",
			parent: null,
			files: "filesId",
			updatedDate: new Date(1),
			createdDate: new Date(1),
			originalParent: null,
		}),
	}

	o.beforeEach(async function () {
		transferController = object()
		driveFacade = object()
		entityRestClientMock = new EntityRestClientMock()
		entityClient = new EntityClient(entityRestClientMock, clientInitializedTypeModelResolver())
		eventController = object()
		transferProgressDispatcher = object()
		driveModel = new DriveModel(transferController, driveFacade, entityClient, eventController, transferProgressDispatcher)

		when(driveFacade.loadRootFolders(matchers.anything())).thenResolve(rootIds)

		await driveModel.init()
	})

	o.spec("paste", function () {
		o.test("when copying items without name conflicts it preserves the names", async function () {
			const files: DriveFile[] = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid1"],
					name: `my favorite file 1`,
				}),
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid2"],
					name: `my favorite file 2`,
				}),
			]
			const fileItems: FileFolderItem[] = files.map((f) => toFolderItem(f, null))

			const folders: DriveFolder[] = [
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid3"],
					name: `my favorite folder 3`,
				}),
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid4"],
					name: `my favorite folder 4`,
				}),
			]
			const folderItems: FolderFolderItem[] = folders.map((f) => toFolderItem(f, null))

			const items: FolderItem[] = [...fileItems, ...folderItems]

			entityRestClientMock.addListInstances(...files, ...folders)
			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: [], folders: [] })

			driveModel.copy(items)
			await driveModel.paste(rootFolders.root)
			verify(driveFacade.copyItems(files, folders, rootFolders.root, new Map()))
		})

		o.test("when copying files with the same name it renames some of them", async function () {
			const files: DriveFile[] = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid1"],
					name: `file1`,
				}),
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid2"],
					name: `file1`,
				}),
			]
			const fileItems: FileFolderItem[] = files.map((f) => toFolderItem(f, null))

			const folders: DriveFolder[] = [
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid3"],
					name: `my favorite folder 3`,
				}),
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid4"],
					name: `my favorite folder 4`,
				}),
			]
			const folderItems: FolderFolderItem[] = folders.map((f) => toFolderItem(f, null))

			const items: FolderItem[] = [...fileItems, ...folderItems]

			entityRestClientMock.addListInstances(...files, ...folders)
			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: [], folders: [] })

			driveModel.copy(items)
			await driveModel.paste(rootFolders.root)

			const expectedRenameMap = new Map<Id, string>([[getElementId(files[1]), "file1 (copy)"]])
			verify(driveFacade.copyItems(files, folders, rootFolders.root, expectedRenameMap))
		})

		o.test("when copying folders with the same name it renames some of them", async function () {
			const files: DriveFile[] = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid1"],
					name: `my favorite file 1`,
				}),
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid2"],
					name: `my favorite file 2`,
				}),
			]
			const fileItems: FileFolderItem[] = files.map((f) => toFolderItem(f, null))

			const folders: DriveFolder[] = [
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid3"],
					name: `folder1`,
				}),
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid4"],
					name: `folder1`,
				}),
			]
			const folderItems: FolderFolderItem[] = folders.map((f) => toFolderItem(f, null))

			const items: FolderItem[] = [...fileItems, ...folderItems]

			entityRestClientMock.addListInstances(...files, ...folders)
			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: [], folders: [] })

			driveModel.copy(items)
			await driveModel.paste(rootFolders.root)

			const expectedRenameMap = new Map<Id, string>([[getElementId(folders[1]), "folder1 (copy)"]])

			verify(driveFacade.copyItems(files, folders, rootFolders.root, expectedRenameMap))
		})
		o.test("when copying files & folders with the same name it renames some of them", async function () {
			const files: DriveFile[] = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid1"],
					name: "same name",
				}),
			]
			const fileItems: FileFolderItem[] = files.map((f) => toFolderItem(f, null))

			const folders: DriveFolder[] = [
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid3"],
					name: "same name",
				}),
			]
			const folderItems: FolderFolderItem[] = folders.map((f) => toFolderItem(f, null))

			const items: FolderItem[] = [...fileItems, ...folderItems]

			entityRestClientMock.addListInstances(...files, ...folders)
			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: [], folders: [] })

			driveModel.copy(items)
			await driveModel.paste(rootFolders.root)

			const expectedRenameMap = new Map<Id, string>([[getElementId(folders[0]), "same name (copy)"]])

			verify(driveFacade.copyItems(files, folders, rootFolders.root, expectedRenameMap))
		})

		o.test("when copying files that have the same name as existing files it renames the copied files", async function () {
			const existingFiles = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid1"],
					name: "same name",
				}),
			]

			const newFiles: DriveFile[] = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid2"],
					name: "same name",
				}),
			]
			const fileItems: FileFolderItem[] = newFiles.map((f) => toFolderItem(f, null))

			const items: FolderItem[] = [...fileItems]

			entityRestClientMock.addListInstances(...newFiles)
			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: existingFiles, folders: [] })

			driveModel.copy(items)
			await driveModel.paste(rootFolders.root)

			const expectedRenameMap = new Map<Id, string>([[getElementId(newFiles[0]), "same name (copy)"]])
			verify(driveFacade.copyItems(newFiles, [], rootFolders.root, expectedRenameMap))
		})

		o.test("when copying folders that have the same name as existing files it renames the copied folders", async function () {
			const existingFiles = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid1"],
					name: "same name",
				}),
			]

			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: existingFiles, folders: [] })

			const newFolders: DriveFolder[] = [
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid3"],
					name: "same name",
				}),
			]
			const folderItems: FolderFolderItem[] = newFolders.map((f) => toFolderItem(f, null))
			const items: FolderItem[] = [...folderItems]

			entityRestClientMock.addListInstances(...newFolders)

			driveModel.copy(items)
			await driveModel.paste(rootFolders.root)

			const expectedRenameMap = new Map<Id, string>([[getElementId(newFolders[0]), "same name (copy)"]])

			verify(driveFacade.copyItems([], newFolders, rootFolders.root, expectedRenameMap))
		})
	})

	o.spec("uploadFiles", function () {
		o.test("when uploading a single file it succeeds", async function () {
			const webFiles: WebFile[] = [
				{
					_type: "WebFile",
					file: {
						name: "meow",
						size: 1024,
					} as File,
				},
			]
			when(driveFacade.getFolderContents(rootIds.root)).thenResolve({ files: [], folders: [] })
			const result = await driveModel.uploadFiles(webFiles, rootIds.root, () => Promise.reject(new Error()))
			o.check(result).equals(true)("Upload result")

			verify(transferController.upload(webFiles[0], "meow", rootIds.root))
		})

		o.test("when uploading two files with the same name, the second one gets renamed", async function () {
			const webFiles: WebFile[] = [
				{
					_type: "WebFile",
					file: {
						name: "meow",
						size: 1024,
					} as File,
				},
				{
					_type: "WebFile",
					file: {
						name: "meow",
						size: 512,
					} as File,
				},
			]
			when(driveFacade.getFolderContents(rootIds.root)).thenResolve({ files: [], folders: [] })

			const result = await driveModel.uploadFiles(webFiles, rootIds.root, async (_fileName: string, _fileCount: number) => {
				return { choice: "keepBoth", applyToAll: true }
			})
			o.check(result).equals(true)("Upload result")

			verify(transferController.upload(webFiles[0], "meow", rootIds.root))
			verify(transferController.upload(webFiles[1], "meow (copy)", rootIds.root))
		})

		o.test(
			"when uploading two files with the same name, the second one conflicts with an existing folder after renaming but gets renamed again",
			async function () {
				const webFiles: WebFile[] = [
					{
						_type: "WebFile",
						file: {
							name: "meow",
							size: 1024,
						} as File,
					},
					{
						_type: "WebFile",
						file: {
							name: "meow",
							size: 512,
						} as File,
					},
				]

				const existingFolders: DriveFolder[] = [
					createTestEntity(DriveFolderTypeRef, {
						_id: ["lid1", "eid0"],
						name: `meow (copy)`,
					}),
				]

				when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: [], folders: existingFolders })
				const result = await driveModel.uploadFiles(webFiles, rootIds.root, async (_fileName: string, _fileCount: number) => {
					return { choice: "keepBoth", applyToAll: true }
				})
				o.check(result).equals(true)("Upload result")

				verify(transferController.upload(webFiles[0], "meow", rootIds.root))
				verify(transferController.upload(webFiles[1], "meow (copy) (copy)", rootIds.root))
			},
		)

		o.test("when upload gets canceled and nothing is uploaded it returns false", async function () {
			const webFiles: WebFile[] = [
				{
					_type: "WebFile",
					file: {
						name: "meow",
						size: 1024,
					} as File,
				},
			]

			const existingFolders: DriveFolder[] = [
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid0"],
					name: `meow`,
				}),
			]

			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: [], folders: existingFolders })
			const result = await driveModel.uploadFiles(webFiles, rootIds.root, async (_fileName: string, _fileCount: number) => {
				return { choice: "cancel", applyToAll: true }
			})
			o.check(result).equals(false)("Upload result")
			verify(transferController.upload(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o.test("when duplicate file name decision 'replace', the file is not renamed", async function () {
			const webFiles: WebFile[] = [
				{
					_type: "WebFile",
					file: {
						name: "meow",
						size: 1024,
					} as File,
				},
			]

			const existingFolders: DriveFolder[] = [
				createTestEntity(DriveFolderTypeRef, {
					_id: ["lid1", "eid0"],
					name: `meow`,
				}),
			]

			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: [], folders: existingFolders })
			const result = await driveModel.uploadFiles(webFiles, rootIds.root, async (_fileName: string, _fileCount: number) => {
				return { choice: "replace", applyToAll: true }
			})
			o.check(result).equals(true)("Upload result")
			verify(driveFacade.moveToTrash([], [existingFolders[0]._id]))
			verify(transferController.upload(webFiles[0], "meow", rootFolders.root._id))
		})
	})

	o.spec("moveItems", function () {
		o.test("when moving item with the same name as existing one the it gets renamed", async function () {
			const existingFiles: DriveFile[] = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid0"],
					name: `same name`,
				}),
			]
			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: existingFiles, folders: [] })

			const driveFile: DriveFile = createTestEntity(DriveFileTypeRef, {
				_id: ["lid1", "eid2"],
				name: `same name`,
			})

			entityRestClientMock.addListInstances(driveFile)

			await driveModel.moveItems([{ type: "file", id: driveFile._id }], rootFolders.root._id)
			verify(driveFacade.move([driveFile], [], rootFolders.root._id, new Map([[getElementId(driveFile), `same name (copy)`]])))
		})

		o.test("when moving items and the picked name conflicts with existing one it gets renamed", async function () {
			const existingFiles: DriveFile[] = [
				createTestEntity(DriveFileTypeRef, {
					_id: ["lid1", "eid0"],
					name: `same name (copy)`,
				}),
			]
			when(driveFacade.getFolderContents(rootFolders.root._id)).thenResolve({ files: existingFiles, folders: [] })

			const files: FolderItemId[] = [
				{ type: "file", id: ["lid1", "eid1"] },
				{ type: "file", id: ["lid1", "eid2"] },
			]
			const driveFiles: DriveFile[] = files.map((f) =>
				createTestEntity(DriveFileTypeRef, {
					_id: f.id,
					name: `same name`,
				}),
			)
			entityRestClientMock.addListInstances(...driveFiles)

			await driveModel.moveItems(files, rootFolders.root._id)
			verify(
				driveFacade.move([driveFiles[0], driveFiles[1]], [], rootFolders.root._id, new Map([[elementIdPart(files[1].id), `same name (copy) (copy)`]])),
			)
		})
	})
})
