import { DataFile } from "../api/common/DataFile"
import { assertMainOrNode } from "../api/common/Env"
import { File as TutanotaFile } from "../api/entities/tutanota/TypeRefs.js"
import {ProgressObserver, FileController, openDataFileInBrowser, zipDataFiles} from "./FileController.js"
import { sortableTimestamp } from "@tutao/tutanota-utils"
import { BlobFacade } from "../api/worker/facades/BlobFacade.js"
import { FileFacade } from "../api/worker/facades/FileFacade.js"
import { assertOnlyDataFiles, FileReference } from "../api/common/utils/FileUtils.js"
import {ProgrammingError} from "../api/common/error/ProgrammingError.js"

assertMainOrNode()

export class FileControllerBrowser extends FileController {
	constructor(blobFacade: BlobFacade, fileFacade: FileFacade, guiDownload: ProgressObserver) {
		super(blobFacade, fileFacade, guiDownload)
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

	protected openDownloadedFiles(downloadedFiles: Array<FileReference | DataFile>): Promise<void> {
		throw new ProgrammingError("can't open files in webapp")
	}
}
