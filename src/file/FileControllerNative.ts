import { Dialog } from "../gui/base/Dialog"
import { DataFile } from "../api/common/DataFile"
import { assertMainOrNode, isAndroidApp, isApp, isDesktop, isElectronClient, isIOSApp, isTest } from "../api/common/Env"
import { assert, neverNull } from "@tutao/tutanota-utils"
import { File as TutanotaFile } from "../api/entities/tutanota/TypeRefs.js"
import { FileReference } from "../api/common/utils/FileUtils"
import { CancelledError } from "../api/common/error/CancelledError"
import type { NativeFileApp } from "../native/common/FileApp"
import { ArchiveDataType } from "../api/common/TutanotaConstants"
import { BlobFacade } from "../api/worker/facades/BlobFacade"
import { FileFacade } from "../api/worker/facades/FileFacade"
import { downloadAndDecryptDataFile, FileController, guiDownload, isLegacyFile } from "./FileController.js"
import stream from "mithril/stream"
import {
	DownloadStrategyBrowserMultiple,
	DownloadStrategyDesktopMultiple,
	DownloadStrategyGenericSingleAndMultiple,
	DownloadStrategyOpenSingleAndMultiple,
} from "./DownloadStrategy.js"

assertMainOrNode()

export class FileControllerNative implements FileController {
	fileApp: NativeFileApp

	constructor(fileApp: NativeFileApp, private readonly blobFacade: BlobFacade, private readonly fileFacade: FileFacade) {
		assert(isElectronClient() || isApp() || isTest(), "Don't make native file controller when not in native")
		this.fileApp = fileApp
	}

	/**
	 * Temporary files are deleted afterwards in apps.
	 */
	async download(file: TutanotaFile) {
		await guiDownload(
			isAndroidApp() || isDesktop()
				? new DownloadStrategyGenericSingleAndMultiple(this).doDownload([file])
				: new DownloadStrategyOpenSingleAndMultiple(this).doDownload([file]),
		)
	}

	async open(file: TutanotaFile) {
		await guiDownload(new DownloadStrategyOpenSingleAndMultiple(this).doDownload([file]))
	}

	async cleanUp(files: FileReference[]) {
		if (files.length > 0) {
			for (const file of files) {
				try {
					await this.fileApp.deleteFile(file.location)
				} catch (e) {
					console.log("failed to delete file", file.location, e)
				}
			}
		}
	}

	/**
	 * Temporary files are deleted afterwards in apps.
	 */
	async downloadAll(tutanotaFiles: Array<TutanotaFile>): Promise<void> {
		const progress = stream(0)
		if (isAndroidApp()) {
			await guiDownload(new DownloadStrategyGenericSingleAndMultiple(this).doDownload(tutanotaFiles, progress), progress)
		} else if (isIOSApp()) {
			await guiDownload(new DownloadStrategyOpenSingleAndMultiple(this).doDownload(tutanotaFiles, progress), progress)
		} else if (isDesktop()) {
			await guiDownload(new DownloadStrategyDesktopMultiple(this).doDownload(tutanotaFiles, progress), progress)
		} else {
			await guiDownload(new DownloadStrategyBrowserMultiple(this).doDownload(tutanotaFiles, progress), progress)
		}
	}

	/**
	 * Does not delete temporary file in app.
	 */
	async saveDataFile(file: DataFile): Promise<void> {
		// For apps "opening" DataFile currently means saving and opening it.
		try {
			const fileReference = await this.fileApp.writeDataFile(file)
			if (isAndroidApp() || isDesktop()) {
				await this.fileApp.putFileIntoDownloadsFolder(fileReference.location)
				return
			} else if (isIOSApp()) {
				return this.fileApp.open(fileReference)
			}
		} catch (e) {
			if (e instanceof CancelledError) {
				// no-op. User cancelled file dialog
				console.log("saveDataFile cancelled")
			} else {
				console.warn("openDataFile failed", e)
				await Dialog.message("canNotOpenFileOnDevice_msg")
			}
		}
	}

	async downloadAndDecrypt(file: TutanotaFile): Promise<DataFile> {
		return downloadAndDecryptDataFile(file, this.fileFacade, this.blobFacade)
	}

	/** Public for testing */
	async downloadAndDecryptInNative(tutanotaFile: TutanotaFile): Promise<FileReference> {
		if (isLegacyFile(tutanotaFile)) {
			return await this.fileFacade.downloadFileContentNative(tutanotaFile)
		} else {
			return await this.blobFacade.downloadAndDecryptNative(
				ArchiveDataType.Attachments,
				tutanotaFile.blobs,
				tutanotaFile,
				tutanotaFile.name,
				neverNull(tutanotaFile.mimeType),
			)
		}
	}
}
