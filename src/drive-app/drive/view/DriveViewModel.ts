import { EntityClient } from "../../../common/api/common/EntityClient"
import { BreadcrumbEntry, DriveFacade, UploadGuid } from "../../../common/api/worker/facades/DriveFacade"
import { File as TutaFile } from "../../../common/api/entities/tutanota/TypeRefs"
import { Router } from "../../../common/gui/ScopedRouter"
import { elementIdPart, generatedIdToTimestamp, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import m from "mithril"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { locator } from "../../../common/api/main/CommonLocator"
import { assertNotNull } from "@tutao/tutanota-utils"
import { UploadProgressListener } from "../../../common/api/main/UploadProgressListener"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { getDefaultSenderFromUser } from "../../../common/mailFunctionality/SharedMailUtils"
import { isFolder } from "./DriveFolderContentEntry"
import { DriveFile, DriveFileRefTypeRef, DriveFolder, DriveFolderTypeRef } from "../../../common/api/entities/drive/TypeRefs"
import { EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { ArchiveDataType } from "../../../common/api/common/TutanotaConstants"

export const enum DriveFolderType {
	Regular = "0",
	Root = "1",
	Trash = "2",
}

export interface RegularFolder {
	type: DriveFolderType.Regular
	files: readonly DriveFile[]
	folders: readonly DriveFolder[]
	parents: readonly BreadcrumbEntry[]
	folder: DriveFolder
}

export type SpecialFolderType = DriveFolderType.Root | DriveFolderType.Trash

export interface SpecialFolder {
	type: SpecialFolderType
	files: readonly DriveFile[]
	folders: readonly DriveFolder[]
	folder: DriveFolder
}

export type DisplayFolder = RegularFolder | SpecialFolder

const buildSortFunction = (order: "asc" | "desc", sort: (f1: TutaFile, f2: TutaFile) => number) => {
	if (order === "desc") {
		return (f1: TutaFile, f2: TutaFile) => {
			const compare = sort(f1, f2)
			return compare * -1 // reverse the order
		}
	}
	return sort
}

const compareString = (s1: string, s2: string) => {
	s1 = s1.toLowerCase()
	s2 = s2.toLowerCase()

	if (s1 > s2) {
		return 1
	} else if (s2 > s1) {
		return -1
	}
	return 0
}

const compareNumber = (n1: number | bigint, n2: number | bigint) => {
	if (n1 > n2) {
		return 1
	} else if (n1 < n2) {
		return -1
	} else {
		return 0
	}
}

const sortFoldersFirst = (f1: TutaFile, f2: TutaFile): number => {
	if (isFolder(f1) && !isFolder(f2)) {
		return -1
	} else if (!isFolder(f1) && isFolder(f2)) {
		return 1
	} else {
		return 0
	}
}

export class DriveViewModel {
	public readonly driveUploadStackModel: DriveUploadStackModel
	public readonly userMailAddress: string

	// column sorting
	private columnToSortOrder: [string, SortOrder] | null = null

	// normal folder view
	currentFolder: DisplayFolder | null = null
	roots!: Awaited<ReturnType<DriveFacade["loadRootFolders"]>>

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
		private readonly router: Router,
		public readonly uploadProgressListener: UploadProgressListener,
		private readonly eventController: EventController,
		private readonly updateUi: () => unknown,
	) {
		this.driveUploadStackModel = new DriveUploadStackModel(driveFacade)
		this.userMailAddress = getDefaultSenderFromUser(locator.logins.getUserController())
	}

	async initialize() {
		this.eventController.addEntityListener(async (events) => {
			await this.entityEventsReceived(events)
		})
		this.roots = await this.driveFacade.loadRootFolders()
	}

	private async entityEventsReceived(events: ReadonlyArray<EntityUpdateData>) {
		for (const update of events) {
			if (isUpdateForTypeRef(DriveFileRefTypeRef, update) && update.instanceListId === this.currentFolder?.folder.files) {
				await this.loadFolderContentsByIdTuple(this.currentFolder.folder._id)
				this.updateUi()
			}
		}
	}

	/**
	 * Move to trash just like addToFavourites change the metadata of the file
	 * a file is
	 */
	async moveToTrash(file: DriveFile) {
		await this.driveFacade.moveToTrash(file)
	}

	async loadVirtualFolder(virtualFolderType: SpecialFolderType) {
		if (virtualFolderType === DriveFolderType.Trash) {
			const { folder, files, folders } = await this.driveFacade.loadTrash()

			this.currentFolder = {
				folder,
				files,
				folders: folders,
				type: virtualFolderType,
			}
		}
	}

	getCurrentParents(): readonly BreadcrumbEntry[] {
		switch (this.currentFolder?.type) {
			case DriveFolderType.Regular:
				return this.currentFolder.parents
			default:
				return []
		}
	}

	// currentFolderIsRoot() {
	// 	return this.currentFolder.folder?._id === this.rootFolder
	// }

	async loadFolderContentsByIdTuple(idTuple: IdTuple): Promise<void> {
		try {
			const folder = await this.entityClient.load(DriveFolderTypeRef, idTuple)
			const { files, folders } = await this.driveFacade.getFolderContents(idTuple)

			this.currentFolder = {
				type: DriveFolderType.Regular,
				folder: folder,
				files,
				folders,
				parents: [],
			} satisfies RegularFolder
		} catch (e) {
			if (e instanceof NotFoundError) {
				this.navigateToRootFolder()
			} else {
				throw e
			}
		}
	}

	public generateUploadGuid(): UploadGuid {
		return crypto.randomUUID()
	}

	async uploadFiles(files: File[]): Promise<void> {
		for (const file of files) {
			const fileId = this.generateUploadGuid()
			this.driveUploadStackModel.addUpload(fileId, file.name, file.size)

			this.driveFacade.uploadFile(file, fileId, assertNotNull(this.currentFolder?.folder)._id)
		}
	}

	async createNewFolder(folderName: string): Promise<void> {
		await this.driveFacade.createFolder(folderName, assertNotNull(this.currentFolder?.folder)._id)
	}

	navigateToFolder(folderId: IdTuple) {
		// Ideally we'd like to use Tuta's router, but navigating back from a folder then entering it again doesn't seem to work.
		// Using Mithril's router directly seems to avoid this problem.
		// this.router.routeTo("/drive/:folderListId/:folderElementId", { folderListId: listIdPart(folderId), folderElementId: elementIdPart(folderId) })
		m.route.set("/drive/:folderListId/:folderElementId", {
			folderListId: listIdPart(folderId),
			folderElementId: elementIdPart(folderId),
		})
	}

	async navigateToRootFolder(): Promise<void> {
		this.navigateToFolder(this.roots.root)
	}

	async downloadFile(file: DriveFile): Promise<void> {
		// a bit ugly -- should we rename and move that one?
		locator.fileController.open(file, ArchiveDataType.DriveFile)
	}

	getCurrentColumnSortOrder() {
		return this.columnToSortOrder
	}

	sort(columnName: string, folderFirst: boolean = false) {
		if (this.columnToSortOrder === null) {
			this.columnToSortOrder = [columnName, "asc"]
		} else {
			// flip order
			this.columnToSortOrder = [columnName, this.columnToSortOrder[1] === "asc" ? "desc" : "asc"]
		}

		const sortOrder = this.columnToSortOrder[1]

		// TODO: Use the type system to catch errors here during compile time.
		const attrToComparisonFunction: Record<string, (f1: TutaFile, f2: TutaFile) => number> = {
			name: (f1: TutaFile, f2: TutaFile) => compareString(f1.name, f2.name),
			mimeType: (f1: TutaFile, f2: TutaFile) => compareString(f1.mimeType || "", f2.mimeType || ""),
			size: (f1: TutaFile, f2: TutaFile) => compareNumber(BigInt(f1.size), BigInt(f2.size)),
			date: (f1: TutaFile, f2: TutaFile) => compareNumber(generatedIdToTimestamp(elementIdPart(f1._id)), generatedIdToTimestamp(elementIdPart(f2._id))),
		}

		const comparisonFn = attrToComparisonFunction[columnName]
		const sortFunction = buildSortFunction(sortOrder, comparisonFn)

		// FIXME
		// this.currentFolder.files.sort(sortFunction)

		// FIXME
		// if (folderFirst) {
		// 	this.currentFolder.files.sort(sortFoldersFirst)
		// }
	}
}

type SortOrder = "asc" | "desc"
