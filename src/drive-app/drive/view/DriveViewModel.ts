import { EntityClient } from "../../../common/api/common/EntityClient"
import { BreadcrumbEntry, DriveFacade, UploadGuid } from "../../../common/api/worker/facades/DriveFacade"
import { File as TutaFile } from "../../../common/api/entities/tutanota/TypeRefs"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { DataFile } from "../../../common/api/common/DataFile"
import { Router } from "../../../common/gui/ScopedRouter"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import m from "mithril"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { locator } from "../../../common/api/main/CommonLocator"
import { ArchiveDataType } from "../../../common/api/common/TutanotaConstants"
import { arrayEquals, assertNotNull } from "@tutao/tutanota-utils"
import { UploadProgressListener } from "../../../common/api/main/UploadProgressListener"
import { DriveUploadStackModel } from "./DriveUploadStackModel"
import { getDefaultSenderFromUser } from "../../../common/mailFunctionality/SharedMailUtils"

export enum VirtualFolder {
	None,
	Favourites,
	Trash,
}

export interface DisplayFolder {
	// shared properties between virtual and real folders
	files: TutaFile[]
	parents: BreadcrumbEntry[]
	isVirtual: boolean

	// properties for real folders
	folder: TutaFile | null // null is only set for virtual folders

	// properties for virtual folders
	virtualFolder: VirtualFolder
}

export class DriveViewModel {
	public readonly driveUploadStackModel: DriveUploadStackModel
	public readonly userMailAddress: string

	// normal folder view
	currentFolder!: DisplayFolder
	rootFolder!: IdTuple

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
		private readonly router: Router,
		public readonly uploadProgressListener: UploadProgressListener,
	) {
		this.driveUploadStackModel = new DriveUploadStackModel(driveFacade)
		this.userMailAddress = getDefaultSenderFromUser(locator.logins.getUserController())
	}

	async initialize() {
		this.rootFolder = await this.driveFacade.loadRootFolderId()
	}

	/**
	 * Move to trash just like addToFavourites change the metadata of the file
	 * a file is
	 */
	async moveToTrash(file: TutaFile) {
		await this.driveFacade.moveToTrash(file)
		this.currentFolder.files = this.currentFolder.files.filter((f) => {
			return !arrayEquals(f._id as [string, string], file._id as [string, string])
		}) // performance issue here
	}

	/**
	 * We assume metadata are ALWAYS created along the uploaded file in the server
	 * but for compatibility reason the metadata property is marked as nullable
	 * so we force our way here to calm Typescript which is throwing a tantrum.
	 * @param file
	 */
	async changeFavoriteStatus(file: TutaFile) {
		// @ts-ignore
		file.metadata.isFavorite = !file.metadata.isFavorite
		// @ts-ignore
		await this.driveFacade.updateMetadata(file)
	}

	async loadVirtualFolder(virtualFolder: VirtualFolder) {
		if (virtualFolder === VirtualFolder.Favourites) {
			const files = await this.driveFacade.loadFavourites()

			this.currentFolder = {
				files: files,
				virtualFolder: VirtualFolder.Favourites,
				isVirtual: true,
				parents: [],
				folder: null,
			}
		} else if (virtualFolder === VirtualFolder.Trash) {
			const files = await this.driveFacade.loadTrash()

			this.currentFolder = {
				files: files,
				virtualFolder: VirtualFolder.Trash,
				isVirtual: true,
				parents: [],
				folder: null,
			}
		}
	}

	getCurrentParents(): BreadcrumbEntry[] {
		return this.currentFolder.parents
	}

	currentFolderIsRoot() {
		return this.currentFolder.folder?._id === this.rootFolder
	}

	async loadFileOrFolder(idTuple: IdTuple): Promise<TutaFile> {
		return this.driveFacade.loadFileFromIdTuple(idTuple)
	}

	async loadFolderContentsByIdTuple(idTuple: IdTuple): Promise<void> {
		try {
			const folder = await this.driveFacade.loadFileFromIdTuple(idTuple)
			const [currentFolderFiles, parents] = await this.driveFacade.getFolderContents(idTuple)

			this.currentFolder = {
				folder: folder,
				files: currentFolderFiles,
				parents: parents,
				isVirtual: false,
				virtualFolder: VirtualFolder.None,
			}
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

			this.driveFacade.uploadFile(file, fileId, assertNotNull(this.currentFolder.folder)._id).then((uploadedFile) => {
				if (uploadedFile != null) {
					this.currentFolder.files.push(uploadedFile)
				}
			})
		}
	}

	async createNewFolder(folderName: string): Promise<void> {
		const uploadedFolder = await this.driveFacade.createFolder(folderName, assertNotNull(this.currentFolder.folder)._id)
		this.currentFolder.files.push(uploadedFolder)
	}

	async navigateToFolder(folderId: IdTuple): Promise<void> {
		// Ideally we'd like to use Tuta's router, but navigating back from a folder then entering it again doesn't seem to work.
		// Using Mithril's router directly seems to avoid this problem.
		// this.router.routeTo("/drive/:folderListId/:folderElementId", { folderListId: listIdPart(folderId), folderElementId: elementIdPart(folderId) })
		m.route.set("/drive/:folderListId/:folderElementId", {
			folderListId: listIdPart(folderId),
			folderElementId: elementIdPart(folderId),
		})
	}

	async navigateToRootFolder(): Promise<void> {
		this.navigateToFolder(this.rootFolder)
	}

	async downloadFile(file: TutaFile): Promise<void> {
		// a bit ugly -- should we rename and move that one?
		locator.fileController.open(file, ArchiveDataType.DriveFile)
	}
}
