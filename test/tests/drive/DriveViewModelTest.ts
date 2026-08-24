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
import { clientInitializedTypeModelResolver, createTestEntity } from "../TestUtils"
import { UserController } from "../../../src/applications/common/api/main/UserController"
import { WebFile } from "../../../src/entities/tutanota/Utils"
import { TutanotaPropertiesTypeRef } from "@tutao/entities/tutanota"
import { DriveFolderTypeRef } from "@tutao/entities/drive"
import { CustomerInfoTypeRef, GroupInfoTypeRef, PlanConfigurationTypeRef } from "@tutao/entities/sys"
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
	let windowCloseConfirmation: () => Promise<boolean>
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

		driveViewModel = new DriveViewModel(
			entityClient,
			driveFacade,
			router,
			eventController,
			loginController,
			userManagementFacade,
			null,
			() => {},
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
	})
})
