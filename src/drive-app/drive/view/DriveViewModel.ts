import { EntityClient } from "../../../common/api/common/EntityClient"
import { DriveFacade } from "../../../common/api/worker/facades/DriveFacade"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { DataFile } from "../../../common/api/common/DataFile"
import { Router } from "../../../common/gui/ScopedRouter"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import m from "mithril"

export class DriveViewModel {
	currentFolderFiles: File[] = []
	currentFolder!: IdTuple
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

	async loadFileOrFolder(idTuple: IdTuple): Promise<File> {
		return this.driveFacade.loadFileFromIdTuple(idTuple)
	}

	async loadFolderContentsByIdTuple(idTuple: IdTuple): Promise<void> {
		this.currentFolderFiles = await this.driveFacade.getFolderContents(idTuple)
		this.currentFolder = idTuple
	}

	async uploadFiles(files: (DataFile | FileReference)[]): Promise<void> {
		const uploadedFiles = await this.driveFacade.uploadFiles(files, this.currentFolder)
		this.currentFolderFiles.push(...uploadedFiles)
	}

	async createNewFolder(folderName: string): Promise<void> {
		const uploadedFolder = await this.driveFacade.createFolder(folderName, this.currentFolder)
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
}
