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

export class DriveViewModel {
	currentFolderFiles: File[] = []
	currentFolder!: File
	currentParents: BreadcrumbEntry[] = []
	rootFolder!: IdTuple

	// maybe we will need a File instance

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
		private readonly router: Router,
	) {}

	async initialize() {
		this.rootFolder = await this.driveFacade.loadDriveGroupRoot()
		await this.loadFolderContentsByIdTuple(this.rootFolder)
	}

	// metadata

	/**
	 * We assume metadata are ALWAYS created along the uploaded file in the server
	 * but for compatibility reason the metadata property is marked as nullable
	 * so we force our way here to calm Typescript which is throwing a tantrum.
	 * @param file
	 */
	async addToFavorite(file: File) {
		// @ts-ignore
		file.metadata.isFavorite = !file.metadata.isFavorite
		// @ts-ignore
		await this.driveFacade.updateMetadata(file)
	}

	// folder

	getCurrentFolder() {
		return this.currentFolder
	}

	getCurrentParents(): BreadcrumbEntry[] {
		return this.currentParents
	}

	currentFolderIsRoot() {
		return this.currentFolder._id === this.rootFolder
	}

	async loadFileOrFolder(idTuple: IdTuple): Promise<File> {
		return this.driveFacade.loadFileFromIdTuple(idTuple)
	}

	async loadFolderContentsByIdTuple(idTuple: IdTuple): Promise<void> {
		try {
			this.currentFolder = await this.driveFacade.loadFileFromIdTuple(idTuple)

			const [currentFolderFiles, parents] = await this.driveFacade.getFolderContents(idTuple)
			this.currentFolderFiles = currentFolderFiles
			this.currentParents = parents
		} catch (e) {
			if (e instanceof NotFoundError) {
				this.navigateToRootFolder()
			} else {
				throw e
			}
		}
	}

	async uploadFiles(files: (DataFile | FileReference)[]): Promise<void> {
		const uploadedFiles = await this.driveFacade.uploadFiles(files, this.currentFolder._id)
		this.currentFolderFiles.push(...uploadedFiles)
	}

	async createNewFolder(folderName: string): Promise<void> {
		const uploadedFolder = await this.driveFacade.createFolder(folderName, this.currentFolder._id)
		this.currentFolderFiles.push(uploadedFolder)
	}

	async navigateToFolder(folderId: IdTuple): Promise<void> {
		// Ideally we'd like to use Tuta's router, but navigating back from a folder then entering it again doesn't seem to work.
		// Using Mithril's router directly seems to avoid this problem.
		// this.router.routeTo("/drive/:folderListId/:folderElementId", { folderListId: listIdPart(folderId), folderElementId: elementIdPart(folderId) })
		m.route.set("/drive/:folderListId/:folderElementId", { folderListId: listIdPart(folderId), folderElementId: elementIdPart(folderId) })
	}

	async navigateToRootFolder(): Promise<void> {
		this.navigateToFolder(this.rootFolder)
	}

	async downloadFile(file: File): Promise<void> {
		// a bit ugly -- should we rename and move that one?
		locator.fileController.open(file, ArchiveDataType.DriveFile)
	}
}
