import { DataFile } from "../api/common/DataFile"
import { assertMainOrNode } from "../api/common/Env"
import { File as TutanotaFile } from "../api/entities/tutanota/TypeRefs.js"
import { BlobFacade } from "../api/worker/facades/BlobFacade"
import { FileFacade } from "../api/worker/facades/FileFacade"
import { downloadAndDecryptDataFile, FileController, guiDownload, openDataFileInBrowser } from "./FileController.js"
import stream from "mithril/stream"
import { DownloadStrategyBrowserMultiple, DownloadStrategyBrowserSingle } from "./DownloadStrategy.js"

assertMainOrNode()

export class FileControllerBrowser implements FileController {
	constructor(private readonly blobFacade: BlobFacade, private readonly fileFacade: FileFacade) {}

	async download(file: TutanotaFile) {
		await guiDownload(new DownloadStrategyBrowserSingle(this).doDownload([file]))
	}

	async downloadAll(tutanotaFiles: Array<TutanotaFile>): Promise<void> {
		const progress = stream(0)
		await guiDownload(new DownloadStrategyBrowserMultiple(this).doDownload(tutanotaFiles, progress), progress)
	}

	async open(file: TutanotaFile) {
		return this.download(file)
	}

	async saveDataFile(file: DataFile): Promise<void> {
		return openDataFileInBrowser(file)
	}

	async downloadAndDecrypt(file: TutanotaFile): Promise<DataFile> {
		return downloadAndDecryptDataFile(file, this.fileFacade, this.blobFacade)
	}
}
