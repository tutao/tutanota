import { assertMainOrNode } from "@tutao/app-env"
import { downloadAndDecryptFromArchive, FileController, openDataFileInBrowser, zipDataFiles } from "./FileController.js"
import { sortableTimestamp } from "@tutao/utils"
import { BlobFacade } from "../api/worker/facades/lazy/BlobFacade.js"
import { ArchiveDataType } from "../../entities/sys/Utils"
import { DataFile } from "@tutao/entities/tutanota"
import { assertOnlyDataFiles, FileReference } from "../../entities/tutanota/Utils"
import { TransferId } from "../../entities/drive/Utils"
import { DownloadableFileEntity } from "@tutao/entities/storage"

assertMainOrNode()

export class FileControllerBrowser extends FileController {
	constructor(blobFacade: BlobFacade) {
		super(blobFacade)
	}

	async saveDataFile(file: DataFile): Promise<void> {
		return openDataFileInBrowser(file)
	}

	async downloadAndDecrypt(file: DownloadableFileEntity, transferId: TransferId, archiveType: ArchiveDataType): Promise<DataFile | FileReference> {
		return downloadAndDecryptFromArchive(file, this.blobFacade, archiveType, transferId)
	}

	async writeDownloadedFiles(downloadedFiles: Array<FileReference | DataFile>): Promise<void> {
		if (downloadedFiles.length < 1) {
			return
		}
		assertOnlyDataFiles(downloadedFiles)
		const fileToSave = downloadedFiles.length > 1 ? await zipDataFiles(downloadedFiles, `${sortableTimestamp()}-attachments.zip`) : downloadedFiles[0]
		return await openDataFileInBrowser(fileToSave)
	}

	async cleanUp(downloadedFiles: DataFile[]): Promise<void> {
		// there is nothing to do since nothing gets saved until the browser puts it into the final location
	}

	protected async openDownloadedFiles(downloadedFiles: Array<FileReference | DataFile>): Promise<void> {
		// opening and downloading a file is the same thing in browser environment
		return await this.writeDownloadedFiles(downloadedFiles)
	}
}
