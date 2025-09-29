import { EntityClient } from "../../../common/api/common/EntityClient"
import { DriveFacade } from "../../../common/api/worker/facades/DriveFacade"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { DataFile } from "../../../common/api/common/DataFile"

export class DriveFolderViewModel {
	currentFolderFiles: File[] = []

	constructor(
		private readonly entityClient: EntityClient,
		private readonly driveFacade: DriveFacade,
	) {}

	async loadDriveRoot(): Promise<void> {
		this.currentFolderFiles = await this.driveFacade.getFolderContents(null)
	}

	async loadFolderContents(folder: File): Promise<void> {
		this.currentFolderFiles = await this.driveFacade.getFolderContents(folder)
	}

	async uploadFiles(files: (DataFile | FileReference)[]): Promise<void> {
		const uploadedFiles = await this.driveFacade.uploadFiles(files)
		this.currentFolderFiles.push(...uploadedFiles)
	}

	async createNewFolder(folderName: string): Promise<void> {
		await this.driveFacade.createFolder(folderName)
	}
}
