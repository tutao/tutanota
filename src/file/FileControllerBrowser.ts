import { Dialog } from "../gui/base/Dialog"
import { DataFile } from "../api/common/DataFile"
import { assertMainOrNode } from "../api/common/Env"
import { sortableTimestamp } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { File as TutanotaFile } from "../api/entities/tutanota/TypeRefs.js"
import { BlobFacade } from "../api/worker/facades/BlobFacade"
import { FileFacade } from "../api/worker/facades/FileFacade"
import { doDownload, downloadAndDecryptDataFile, FileController, handleDownloadErrors, openDataFileInBrowser, zipDataFiles } from "./FileController.js"
import stream from "mithril/stream"

assertMainOrNode()

export class FileControllerBrowser implements FileController {
	constructor(private readonly blobFacade: BlobFacade, private readonly fileFacade: FileFacade) {}

	async download(file: TutanotaFile) {
		try {
			await showProgressDialog(
				"pleaseWait_msg",
				this.downloadAndDecrypt(file).then((file) => this.saveDataFile(file)),
			)
		} catch (e) {
			console.log("downloadAndOpen error", e.message)
			await handleDownloadErrors(e, Dialog.message)
		}
	}

	async downloadAll(tutanotaFiles: Array<TutanotaFile>): Promise<void> {
		const progress = stream(0)
		try {
			await showProgressDialog(
				"pleaseWait_msg",
				doDownload({
					tutanotaFiles,
					downloadAction: (file) => this.downloadAndDecrypt(file),
					processDownloadedFiles: async (files) => openDataFileInBrowser(await zipDataFiles(files, `${sortableTimestamp()}-attachments.zip`)),
					cleanUp: async () => {},
					progress,
				}),
				progress,
			)
		} catch (e) {
			console.log("downloadAndOpen error", e.message)
			await handleDownloadErrors(e, Dialog.message)
		}
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
