import o from "@tutao/otest"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { DriveFacade, DriveRootFolders } from "../../../src/common/api/worker/facades/lazy/DriveFacade"
import { Router } from "../../../src/common/gui/ScopedRouter"
import { TransferProgressDispatcher } from "../../../src/common/api/main/TransferProgressDispatcher"
import { EventController } from "../../../src/common/api/main/EventController"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { UserManagementFacade } from "../../../src/common/api/worker/facades/lazy/UserManagementFacade"
import { DriveFolderType, DriveViewModel } from "../../../src/drive-app/drive/view/DriveViewModel"
import { matchers, object, when } from "testdouble"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import { clientInitializedTypeModelResolver, createTestEntity } from "../TestUtils"
import { verify } from "@tutao/tutanota-test-utils"
import { createDriveFolder, DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "../../../src/common/api/entities/drive/TypeRefs"
import { UserController } from "../../../src/common/api/main/UserController"
import { TutanotaPropertiesTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { GroupInfoTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { elementIdPart, getElementId } from "../../../src/common/api/common/utils/EntityUtils"
import { FileController } from "../../../src/common/file/FileController"
import { FolderItemId } from "../../../src/drive-app/drive/view/DriveUtils"

o.spec("DriveViewModel", function () {
	let driveViewModel: DriveViewModel

	let entityRestClientMock: EntityRestClientMock
	let entityClient: EntityClient
	let driveFacade: DriveFacade
	let router: Router
	let uploadProgressController: TransferProgressDispatcher
	let eventController: EventController
	let loginController: LoginController
	let userController: UserController
	let userManagementFacade: UserManagementFacade
	let fileController: FileController

	let rootFolder: DriveFolder

	const roots: Readonly<DriveRootFolders> = {
		root: ["RootListID", "RootElementID"],
		trash: ["RootListID", "TrashElementID"],
	}

	o.beforeEach(async function () {
		entityRestClientMock = new EntityRestClientMock()
		entityClient = new EntityClient(entityRestClientMock, clientInitializedTypeModelResolver())
		driveFacade = object()
		router = object()
		uploadProgressController = object()
		eventController = object()
		loginController = object()
		fileController = object()

		const props = createTestEntity(TutanotaPropertiesTypeRef, {
			defaultSender: "user@tuta.com",
		})
		const userGroupInfo = createTestEntity(GroupInfoTypeRef, {
			mailAddress: props.defaultSender,
		})
		userController = {
			props,
			userGroupInfo: userGroupInfo,
		} satisfies Partial<UserController> as UserController
		userManagementFacade = object()

		when(loginController.getUserController()).thenReturn(userController)
		when(driveFacade.loadRootFolders()).thenResolve(roots)

		rootFolder = createDriveFolder({
			_id: roots.root,
			name: "",
			type: DriveFolderType.Root,
			parent: null,
			files: "rootChildrenId",
			originalParent: null,
			updatedDate: new Date(),
			createdDate: new Date(),
		})
		entityRestClientMock.addListInstances(rootFolder)

		driveViewModel = new DriveViewModel(
			entityClient,
			driveFacade,
			router,
			uploadProgressController,
			eventController,
			loginController,
			userManagementFacade,
			fileController,
			object(),
			() => {},
		)
		await driveViewModel.init()
	})

	o.spec("copyItems", function () {
		o.test("when copying into current folder without name conflicts it calls driveFacade with empty rename map", async function () {
			const files: FolderItemId[] = [
				{ type: "file", id: ["lid1", "eid1"] },
				{ type: "file", id: ["lid1", "eid2"] },
			]

			const folders: FolderItemId[] = [
				{ type: "folder", id: ["lid1", "eid3"] },
				{ type: "folder", id: ["lid1", "eid4"] },
			]

			const items: FolderItemId[] = [...files, ...folders]

			const driveFiles: DriveFile[] = files.map((f) => createTestEntity(DriveFileTypeRef, { _id: f.id, name: `my favorite file ${f.id}` }))
			const driveFolders: DriveFolder[] = folders.map((f) => createTestEntity(DriveFolderTypeRef, { _id: f.id, name: `my favorite folder ${f.id}` }))
			entityRestClientMock.addListInstances(...driveFiles, ...driveFolders)
			when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: [], folders: [] })

			await driveViewModel.displayFolder(roots.root)
			await driveViewModel.copyItems(items, driveViewModel.currentFolder!.folder)
			const renameCaptor = matchers.captor()
			verify(driveFacade.copyItems(driveFiles, driveFolders, driveViewModel.currentFolder!.folder, renameCaptor.capture()))
			o.check(renameCaptor.value).deepEquals(new Map())
		})

		o.test("when copying into current folder with file name conflicts it calls driveFacade with a partly-populated rename map", async function () {
			const files: FolderItemId[] = [
				{ type: "file", id: ["lid1", "eid1"] },
				{ type: "file", id: ["lid1", "eid2"] },
			]

			const folders: FolderItemId[] = [
				{ type: "folder", id: ["lid1", "eid3"] },
				{ type: "folder", id: ["lid1", "eid4"] },
			]

			const items: FolderItemId[] = [...files, ...folders]

			const driveFiles: DriveFile[] = files.map((f) => createTestEntity(DriveFileTypeRef, { _id: f.id, name: `file1` }))
			const driveFolders: DriveFolder[] = folders.map((f) => createTestEntity(DriveFolderTypeRef, { _id: f.id, name: `my favorite folder ${f.id}` }))

			entityRestClientMock.addListInstances(...driveFiles, ...driveFolders)
			when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: [], folders: [] })

			await driveViewModel.copyItems(items, rootFolder)

			const expectedRenameMap = new Map<Id, string>()
			expectedRenameMap.set(getElementId(driveFiles[1]), "file1 (copy)")

			const renameCaptor = matchers.captor()
			verify(driveFacade.copyItems(driveFiles, driveFolders, rootFolder, renameCaptor.capture()))
			o.check(renameCaptor.value).deepEquals(expectedRenameMap)
		})

		o.test("when copying into current folder with folder name conflicts it calls driveFacade with a partly-populated rename map", async function () {
			const files: FolderItemId[] = [
				{ type: "file", id: ["lid1", "eid1"] },
				{ type: "file", id: ["lid1", "eid2"] },
			]

			const folders: FolderItemId[] = [
				{ type: "folder", id: ["lid1", "eid3"] },
				{ type: "folder", id: ["lid1", "eid4"] },
			]

			const items: FolderItemId[] = [...files, ...folders]

			const driveFiles: DriveFile[] = files.map((f) => createTestEntity(DriveFileTypeRef, { _id: f.id, name: `my favorite file ${f.id}` }))
			const driveFolders: DriveFolder[] = folders.map((f) => createTestEntity(DriveFolderTypeRef, { _id: f.id, name: `folder1` }))

			entityRestClientMock.addListInstances(...driveFiles, ...driveFolders)
			when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: [], folders: [] })

			await driveViewModel.copyItems(items, rootFolder)

			const expectedRenameMap = new Map<Id, string>()
			expectedRenameMap.set(getElementId(driveFolders[1]), "folder1 (copy)")

			const renameCaptor = matchers.captor()
			verify(driveFacade.copyItems(driveFiles, driveFolders, rootFolder, renameCaptor.capture()))
			o.check(renameCaptor.value).deepEquals(expectedRenameMap)
		})

		o.test(
			"when copying into current folder with folder and file name conflicts it calls driveFacade with a partly-populated rename map",
			async function () {
				const files: FolderItemId[] = [{ type: "file", id: ["lid1", "eid1"] }]

				const folders: FolderItemId[] = [{ type: "folder", id: ["lid1", "eid3"] }]

				const items: FolderItemId[] = [...files, ...folders]

				const driveFiles: DriveFile[] = files.map((f) => createTestEntity(DriveFileTypeRef, { _id: f.id, name: `same name` }))
				const driveFolders: DriveFolder[] = folders.map((f) => createTestEntity(DriveFolderTypeRef, { _id: f.id, name: `same name` }))

				entityRestClientMock.addListInstances(...driveFiles, ...driveFolders)
				when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: [], folders: [] })

				await driveViewModel.copyItems(items, rootFolder)

				const expectedRenameMap = new Map<Id, string>([[getElementId(driveFolders[0]), "same name (copy)"]])

				const renameCaptor = matchers.captor()
				verify(driveFacade.copyItems(driveFiles, driveFolders, rootFolder, renameCaptor.capture()))
				o.check(renameCaptor.value).deepEquals(expectedRenameMap)
			},
		)

		o.test(
			"when copying files into current folder and there are name conflicts with existing files it calls driveFacade with a partly-populated rename map",
			async function () {
				const files: FolderItemId[] = [{ type: "file", id: ["lid1", "eid1"] }]
				const items: FolderItemId[] = [...files]
				const existingFiles: DriveFile[] = [createTestEntity(DriveFileTypeRef, { _id: ["lid1", "eid0"], name: `same name` })]
				when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: existingFiles, folders: [] })

				const driveFiles: DriveFile[] = files.map((f) => createTestEntity(DriveFileTypeRef, { _id: f.id, name: `same name` }))

				entityRestClientMock.addListInstances(...driveFiles)

				await driveViewModel.copyItems(items, rootFolder)

				const expectedRenameMap = new Map<Id, string>([[getElementId(driveFiles[0]), "same name (copy)"]])

				const renameCaptor = matchers.captor()
				verify(driveFacade.copyItems(driveFiles, [], rootFolder, renameCaptor.capture()))
				o.check(renameCaptor.value).deepEquals(expectedRenameMap)
			},
		)

		o.test(
			"when copying files into current folder and there are name conflicts with existing files it calls driveFacade with a partly-populated rename map",
			async function () {
				const folders: FolderItemId[] = [{ type: "folder", id: ["lid1", "eid1"] }]
				const items: FolderItemId[] = [...folders]
				const existingFiles: DriveFile[] = [createTestEntity(DriveFileTypeRef, { _id: ["lid1", "eid0"], name: `same name` })]
				when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: existingFiles, folders: [] })

				const driveFolders: DriveFolder[] = folders.map((f) => createTestEntity(DriveFolderTypeRef, { _id: f.id, name: `same name` }))

				entityRestClientMock.addListInstances(...driveFolders)

				await driveViewModel.copyItems(items, rootFolder)

				const expectedRenameMap = new Map<Id, string>([[getElementId(driveFolders[0]), "same name (copy)"]])

				const renameCaptor = matchers.captor()
				verify(driveFacade.copyItems([], driveFolders, rootFolder, renameCaptor.capture()))
				o.check(renameCaptor.value).deepEquals(expectedRenameMap)
			},
		)
	})

	o.spec("uploadFiles", function () {
		o.test("when uploading a single file it succeeds", async function () {
			const webFiles: File[] = [{ name: "meow", size: 10 } as File]

			when(driveFacade.uploadFile(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
				createTestEntity(DriveFileTypeRef),
			)

			await driveViewModel.displayFolder(roots.root)
			await driveViewModel.uploadFiles(webFiles)

			verify(driveFacade.uploadFile(webFiles[0], matchers.anything(), "meow", roots.root))
		})

		o.test("when uploading two files with the same name, the second one gets renamed", async function () {
			const webFiles: File[] = [{ name: "meow", size: 10 } as File, { name: "meow", size: 20 } as File]

			when(driveFacade.uploadFile(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
				createTestEntity(DriveFileTypeRef),
			)

			await driveViewModel.displayFolder(roots.root)
			await driveViewModel.uploadFiles(webFiles)

			verify(driveFacade.uploadFile(webFiles[0], matchers.anything(), "meow", roots.root))
			verify(driveFacade.uploadFile(webFiles[1], matchers.anything(), "meow (copy)", roots.root))
		})

		o.test(
			"when uploading two files with the same name, the second one conflicts with an existing folder after renaming but gets renamed again",
			async function () {
				const webFiles: File[] = [{ name: "meow", size: 10 } as File, { name: "meow", size: 20 } as File]

				const existingFolders: DriveFolder[] = [createTestEntity(DriveFolderTypeRef, { _id: ["lid1", "eid0"], name: `meow (copy)` })]
				when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: [], folders: existingFolders })

				when(driveFacade.uploadFile(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenResolve(
					createTestEntity(DriveFileTypeRef),
				)

				await driveViewModel.displayFolder(roots.root)
				await driveViewModel.uploadFiles(webFiles)

				verify(driveFacade.uploadFile(webFiles[0], matchers.anything(), "meow", roots.root))
				verify(driveFacade.uploadFile(webFiles[1], matchers.anything(), "meow (copy) (copy)", roots.root))
			},
		)
	})

	o.spec("moveItems", function () {
		o.test("when moving item with the same name as existing one the it gets renamed", async function () {
			const existingFiles: DriveFile[] = [createTestEntity(DriveFileTypeRef, { _id: ["lid1", "eid0"], name: `same name` })]
			when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: existingFiles, folders: [] })

			const files: FolderItemId[] = [{ type: "file", id: ["lid1", "eid1"] }]
			const driveFiles: DriveFile[] = files.map((f) => createTestEntity(DriveFileTypeRef, { _id: f.id, name: `same name` }))
			entityRestClientMock.addListInstances(...driveFiles)

			await driveViewModel.moveItems(files, roots.root)
			verify(driveFacade.move([driveFiles[0]], [], roots.root, new Map([[getElementId(driveFiles[0]), `same name (copy)`]])))
		})

		o.test("when moving items and the picked name conflicts with existing one it gets renamed", async function () {
			const existingFiles: DriveFile[] = [createTestEntity(DriveFileTypeRef, { _id: ["lid1", "eid0"], name: `same name (copy)` })]
			when(driveFacade.getFolderContents(rootFolder._id)).thenResolve({ files: existingFiles, folders: [] })

			const files: FolderItemId[] = [
				{ type: "file", id: ["lid1", "eid1"] },
				{ type: "file", id: ["lid1", "eid2"] },
			]
			const driveFiles: DriveFile[] = files.map((f) => createTestEntity(DriveFileTypeRef, { _id: f.id, name: `same name` }))
			entityRestClientMock.addListInstances(...driveFiles)

			await driveViewModel.moveItems(files, roots.root)
			const mapCaptor = matchers.captor()
			verify(driveFacade.move([driveFiles[0], driveFiles[1]], [], roots.root, mapCaptor.capture()))
			o.check(mapCaptor.value).deepEquals(new Map([[elementIdPart(files[1].id), `same name (copy) (copy)`]]))
		})
	})
})
