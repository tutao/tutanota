import { EntityClient } from "../../../common/api/common/EntityClient"
import { BreadcrumbEntry, DriveFacade } from "../../../common/api/worker/facades/DriveFacade"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { DataFile } from "../../../common/api/common/DataFile"
import { Router } from "../../../common/gui/ScopedRouter"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import m from "mithril"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { locator } from "../../../common/api/main/CommonLocator"
import { ArchiveDataType } from "../../../common/api/common/TutanotaConstants"
import { arrayEquals, assertNotNull } from "@tutao/tutanota-utils"

export enum VirtualFolder {
	None,
	Favourites,
	Trash,
}

export interface DisplayFolder {
	// shared properties between virtual and real folders
	files: File[]
	parents: BreadcrumbEntry[]
	isVirtual: boolean

	// properties for real folders
	folder: File | null // null is only set for virtual folders

	// properties for virtual folders
	virtualFolder: VirtualFolder
}

export class DriveViewModel {
	// normal folder view
	currentFolder!: DisplayFolder
	rootFolder!: IdTuple

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
		private readonly router: Router,
	) {}

	async initialize() {
		this.rootFolder = await this.driveFacade.loadDriveGroupRoot()
	}

	/**
	 * Move to trash just like addToFavourites change the metadata of the file
	 * a file is
	 */
	async moveToTrash(file: File) {
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
	async changeFavoriteStatus(file: File) {
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

	async loadFileOrFolder(idTuple: IdTuple): Promise<File> {
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

	async uploadFiles(files: (DataFile | FileReference)[]): Promise<void> {
		const uploadedFiles = await this.driveFacade.uploadFiles(files, assertNotNull(this.currentFolder.folder)._id)
		this.currentFolder.files.push(...uploadedFiles)
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

	async downloadFile(file: File): Promise<void> {
		// a bit ugly -- should we rename and move that one?
		locator.fileController.open(file, ArchiveDataType.DriveFile)
	}
}
