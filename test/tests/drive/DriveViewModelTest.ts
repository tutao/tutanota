import o, { verify } from "@tutao/otest"
import { EntityClient } from "../../../src/platform-kit/network/EntityClient"
import { DriveFacade, DriveFolderType, DriveRootFolders } from "../../../src/applications/common/api/worker/facades/lazy/DriveFacade"
import { Router } from "../../../src/ui/ScopedThrottledRouter"
import { EventController } from "../../../src/applications/common/api/main/EventController"
import { LoginController } from "../../../src/applications/common/api/main/LoginController"
import { UserManagementFacade } from "../../../src/applications/common/api/worker/facades/lazy/UserManagementFacade"
import { DriveViewModel } from "../../../src/applications/drive-app/drive/view/DriveViewModel"
import { func, matchers, object, when } from "testdouble"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import { clientInitializedTypeModelResolver, createTestEntity, withOverriddenEnv } from "../TestUtils"
import { UserController } from "../../../src/applications/common/api/main/UserController"
import { WebFile } from "../../../src/entities/tutanota/Utils"
import { TutanotaPropertiesTypeRef } from "@tutao/entities/tutanota"
import { DriveFileTypeRef, DriveFolderTypeRef } from "@tutao/entities/drive"
import { CustomerInfoTypeRef, GroupInfoTypeRef, PlanConfigurationTypeRef } from "@tutao/entities/sys"
import { WindowFacade } from "../../../src/applications/common/misc/WindowFacade"
import { Mode } from "../../../src/platform-kit/app-env"
import { DriveModel } from "../../../src/applications/drive-app/drive/model/DriveModel"

o.spec("DriveViewModel", function () {
	let driveViewModel: DriveViewModel

	let entityRestClientMock: EntityRestClientMock
	let entityClient: EntityClient
	let driveFacade: DriveFacade
	let router: Router
	let eventController: EventController
	let loginController: LoginController
	let userController: UserController
	let userManagementFacade: UserManagementFacade
	let windowFacade: WindowFacade
	let windowCloseConfirmation: () => Promise<boolean>
	let allTransfersDoneNotification = func() as () => void
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
		entityRestClientMock = new EntityRestClientMock()
		entityClient = new EntityClient(entityRestClientMock, clientInitializedTypeModelResolver())
		driveFacade = object()
		router = object()
		eventController = object()
		loginController = object()
		windowFacade = object()
		driveModel = object()
		windowCloseConfirmation = func() as () => Promise<boolean>

		const props = createTestEntity(TutanotaPropertiesTypeRef, {
			defaultSender: "user@tuta.com",
		})
		const userGroupInfo = createTestEntity(GroupInfoTypeRef, {
			mailAddress: props.defaultSender,
		})
		userController = {
			props,
			userGroupInfo: userGroupInfo,
			getPlanConfig: async () => createTestEntity(PlanConfigurationTypeRef, { drive: true }),
			loadCustomerInfo: async () => createTestEntity(CustomerInfoTypeRef),
		} satisfies Partial<UserController> as UserController
		userManagementFacade = object()

		when(loginController.getUserController()).thenReturn(userController)
		when(loginController.waitForFullLogin()).thenResolve()
		when(driveFacade.loadRootFolders(matchers.anything())).thenResolve(rootIds)
		when(driveFacade.getFolderContents(matchers.anything())).thenResolve({ files: [], folders: [] })
		when(windowCloseConfirmation()).thenResolve(true)

		entityRestClientMock.addListInstances(rootFolders.root)

		when(driveModel.setAllTransfersDoneListener(matchers.anything())).thenDo((listener: () => void) => {
			allTransfersDoneNotification = listener
		})

		driveViewModel = new DriveViewModel(
			entityClient,
			driveFacade,
			router,
			eventController,
			loginController,
			userManagementFacade,
			null,
			windowFacade,
			() => {},
			windowCloseConfirmation,
			object(),
			object(),
			object(),
			driveModel,
		)
		await driveViewModel.init()
	})

	o.spec("uploadFiles", function () {
		const webFiles: WebFile[] = [
			{
				_type: "WebFile",
				file: {
					name: "meow",
					size: 1024,
				} as File,
			},
		]

		o.spec("destination", function () {
			o.test("when in normal folder without target it uploads there", async function () {
				const showDuplicateFilesChoiceDialog = () => Promise.reject(new Error())

				await driveViewModel.uploadFiles(webFiles, showDuplicateFilesChoiceDialog)

				verify(driveModel.uploadFiles(webFiles, rootIds.root, showDuplicateFilesChoiceDialog, undefined))
			})

			o.test("when in trash folder without target it uploads to root", async function () {
				const showDuplicateFilesChoiceDialog = () => Promise.reject(new Error())
				await driveViewModel.displayFolder(rootIds.trash)

				await driveViewModel.uploadFiles(webFiles, showDuplicateFilesChoiceDialog)

				verify(driveModel.uploadFiles(webFiles, rootIds.root, showDuplicateFilesChoiceDialog, undefined))
			})

			o.test("when in normal folder with a target it uploads to that target", async function () {
				const showDuplicateFilesChoiceDialog = () => Promise.reject(new Error())
				const customFolderTarget: IdTuple = ["customList", "customElement"]

				await driveViewModel.uploadFiles(webFiles, showDuplicateFilesChoiceDialog, [], customFolderTarget)

				verify(driveModel.uploadFiles(webFiles, customFolderTarget, showDuplicateFilesChoiceDialog, []))
			})

			o.test("when in trash folder with a target it uploads to that target", async function () {
				const showDuplicateFilesChoiceDialog = () => Promise.reject(new Error())
				const customFolderTarget: IdTuple = ["customList", "customElement"]
				await driveViewModel.displayFolder(rootIds.trash)

				await driveViewModel.uploadFiles(webFiles, showDuplicateFilesChoiceDialog, [], customFolderTarget)

				verify(driveModel.uploadFiles(webFiles, customFolderTarget, showDuplicateFilesChoiceDialog, []))
			})
		})

		o.spec("windows close listener", function () {
			o.beforeEach(function () {
				when(driveModel.uploadFiles(matchers.anything(), matchers.anything(), matchers.anything()), { ignoreExtraArgs: true }).thenResolve(true)
			})

			o.test("should set up a close listener when uploading and remove it and close the window on user request", async function () {
				const deleteListenerFunction = func() as () => void
				let windowCloseRequest: () => void
				when(windowFacade.addWindowCloseListener(matchers.anything())).thenDo((listener: () => void) => {
					windowCloseRequest = listener
					return deleteListenerFunction
				})
				await driveViewModel.displayFolder(rootIds.root)

				await driveViewModel.uploadFiles(webFiles, () => Promise.reject(new Error()))

				verify(driveModel.uploadFiles(matchers.anything(), matchers.anything(), matchers.anything()), { ignoreExtraArgs: true })
				await withOverriddenEnv({ mode: Mode.Desktop }, async () => {
					await windowCloseRequest!()

					verify(deleteListenerFunction())
					verify(windowFacade.closeWindow())
				})
			})

			o.test("does not set up a close listener if nothing is uploaded", async function () {
				const deleteListenerFunction = func() as () => void
				let windowCloseRequest: (() => void) | null = null
				when(windowFacade.addWindowCloseListener(matchers.anything())).thenDo((listener: () => void) => {
					windowCloseRequest = listener
					return deleteListenerFunction
				})
				await driveViewModel.displayFolder(rootIds.root)
				when(driveModel.uploadFiles(matchers.anything(), matchers.anything(), matchers.anything()), { ignoreExtraArgs: true }).thenResolve(false)

				await driveViewModel.uploadFiles(webFiles, () => Promise.reject(new Error()))

				o.check(windowCloseRequest).equals(null)
			})

			o.test("should set up a close listener when uploading and remove it once all uploads are done", async function () {
				const deleteListenerFunction = func() as () => void
				when(windowFacade.addWindowCloseListener(matchers.anything())).thenDo((listener: () => void) => {
					return deleteListenerFunction
				})

				await driveViewModel.displayFolder(rootIds.root)
				await driveViewModel.uploadFiles(webFiles, () => Promise.reject(new Error()))

				allTransfersDoneNotification()

				verify(driveModel.uploadFiles(matchers.anything(), matchers.anything(), matchers.anything()), { ignoreExtraArgs: true })
				verify(deleteListenerFunction())
			})

			o.test("should set up a close listener when uploading and do not remove it before the upload is done", async function () {
				const deleteListenerFunction = func() as () => void
				let windowCloseListenerRan = false
				when(windowFacade.addWindowCloseListener(matchers.anything())).thenDo((listener: () => void) => {
					windowCloseListenerRan = true
					return deleteListenerFunction
				})

				await driveViewModel.displayFolder(rootIds.root)
				await driveViewModel.uploadFiles(webFiles, () => Promise.reject(new Error()))

				verify(driveModel.uploadFiles(matchers.anything(), matchers.anything(), matchers.anything()), { ignoreExtraArgs: true })
				await withOverriddenEnv({ mode: Mode.Desktop }, async () => {
					o.check(windowCloseListenerRan).equals(true)
					verify(deleteListenerFunction(), { times: 0 })
				})
			})
		})
	})

	o.spec("download", function () {
		o.test("should set up a close listener when downloading and remove it and close the window on user request", async function () {
			const fileToDownload = createTestEntity(DriveFileTypeRef)

			const deleteListenerFunction = func() as () => void
			let windowCloseRequest: () => void
			when(windowFacade.addWindowCloseListener(matchers.anything())).thenDo((listener: () => void) => {
				windowCloseRequest = listener
				return deleteListenerFunction
			})

			await driveViewModel.downloadFile(createTestEntity(DriveFileTypeRef))

			verify(driveModel.downloadFile(fileToDownload))
			await withOverriddenEnv({ mode: Mode.Desktop }, async () => {
				await windowCloseRequest!()

				verify(deleteListenerFunction())
				verify(windowFacade.closeWindow())
			})
		})

		o.test("should set up a close listener when downloading and remove it once all downloads are done", async function () {
			const fileToDownload = createTestEntity(DriveFileTypeRef)

			const deleteListenerFunction = func() as () => void
			when(windowFacade.addWindowCloseListener(matchers.anything())).thenDo((listener: () => void) => {
				return deleteListenerFunction
			})

			await driveViewModel.downloadFile(createTestEntity(DriveFileTypeRef))

			allTransfersDoneNotification()

			verify(driveModel.downloadFile(fileToDownload))
			verify(deleteListenerFunction())
		})

		o.test("should set up a close listener when downloading and do not remove it before the download is done", async function () {
			const fileToDownload = createTestEntity(DriveFileTypeRef)

			const deleteListenerFunction = func() as () => void
			let windowCloseListenerRan = false
			when(windowFacade.addWindowCloseListener(matchers.anything())).thenDo((listener: () => void) => {
				windowCloseListenerRan = true
				return deleteListenerFunction
			})

			await driveViewModel.downloadFile(createTestEntity(DriveFileTypeRef))

			verify(driveModel.downloadFile(fileToDownload))
			await withOverriddenEnv({ mode: Mode.Desktop }, async () => {
				o.check(windowCloseListenerRan).equals(true)
				verify(deleteListenerFunction(), { times: 0 })
			})
		})
	})
})
