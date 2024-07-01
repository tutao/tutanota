import { DataFile } from "../api/common/DataFile"
import { assertMainOrNode } from "../api/common/Env"
import { File as TutanotaFile } from "../api/entities/tutanota/TypeRefs.js"
import { FileController, openDataFileInBrowser, ProgressObserver, zipDataFiles } from "./FileController.js"
import { sortableTimestamp } from "@tutao/tutanota-utils"
import { BlobFacade } from "../api/worker/facades/lazy/BlobFacade.js"
import { assertOnlyDataFiles, FileReference } from "../api/common/utils/FileUtils.js"

assertMainOrNode()

export class FileControllerBrowser extends FileController {
	constructor(blobFacade: BlobFacade, guiDownload: ProgressObserver) {
		super(blobFacade, guiDownload)
	}

	async saveDataFile(file: DataFile): Promise<void> {
		return openDataFileInBrowser(file)
	}

	async downloadAndDecrypt(file: TutanotaFile): Promise<DataFile | FileReference> {
		return this.getAsDataFile(file)
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
