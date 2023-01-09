import { Dialog } from "../gui/base/Dialog.js"
import { lang } from "../misc/LanguageViewModel.js"
import { ConnectionError } from "../api/common/error/RestError.js"
import { FileController, handleDownloadErrors, openDataFileInBrowser, zipDataFiles } from "./FileController.js"
import stream from "mithril/stream"
import { File as TutanotaFile } from "../api/entities/tutanota/TypeRefs.js"
import { FileReference } from "../api/common/utils/FileUtils.js"
import { DataFile } from "../api/common/DataFile.js"
import { promiseMap, sortableTimestamp } from "@tutao/tutanota-utils"
import { isApp } from "../api/common/Env.js"
import { FileControllerNative } from "./FileControllerNative.js"

export abstract class DownloadStrategy<T> {
	async doDownload(tutanotaFiles: TutanotaFile[], progress?: stream<number>) {
		const downloadedFiles: Array<T> = []
		try {
			let isOffline = false
			for (const file of tutanotaFiles) {
				try {
					const downloadedFile = await this.downloadAction(file)
					downloadedFiles.push(downloadedFile)
					if (progress != null) {
						progress(((tutanotaFiles.indexOf(file) + 1) / tutanotaFiles.length) * 100)
					}
				} catch (e) {
					await handleDownloadErrors(e, (msg) => {
						if (msg === "couldNotAttachFile_msg") {
							isOffline = true
						} else {
							Dialog.message(() => lang.get(msg) + " " + file.name)
						}
					})
					if (isOffline) break // don't try to download more files, but the previous ones (if any) will still be downloaded
				}
			}
			if (downloadedFiles.length > 0) {
				await this.processDownloadedFiles(downloadedFiles)
			}
			if (isOffline) {
				throw new ConnectionError("currently offline")
			}
		} finally {
			await this.cleanUp(downloadedFiles)
		}
	}

	abstract downloadAction(file: TutanotaFile): Promise<T>

	abstract processDownloadedFiles(downloadedFiles: T[]): Promise<unknown>

	abstract cleanUp(downloadedFiles: T[]): Promise<unknown>
}

/**
 * for downloading multiple files in a browser. Files are bundled in a zip file
 */
export class DownloadStrategyBrowserMultiple extends DownloadStrategy<DataFile> {
	constructor(private host: FileController) {
		super()
	}

	async downloadAction(file: TutanotaFile): Promise<DataFile> {
		return this.host.downloadAndDecrypt(file)
	}

	async processDownloadedFiles(downloadedFiles: DataFile[]): Promise<unknown> {
		return openDataFileInBrowser(await zipDataFiles(downloadedFiles, `${sortableTimestamp()}-attachments.zip`))
	}

	cleanUp(downloadedFiles: DataFile[]): Promise<unknown> {
		return Promise.resolve(undefined)
	}
}

/**
 * for downloading a single file in a browser
 */
export class DownloadStrategyBrowserSingle extends DownloadStrategy<DataFile> {
	constructor(private host: FileController) {
		super()
	}

	downloadAction(file: TutanotaFile): Promise<DataFile> {
		return this.host.downloadAndDecrypt(file)
	}

	processDownloadedFiles(downloadedFiles: DataFile[]): Promise<void> {
		return openDataFileInBrowser(downloadedFiles[0])
	}

	cleanUp(downloadedFiles: DataFile[]): Promise<unknown> {
		return Promise.resolve(undefined)
	}
}

/**
 * for Downloading single and multiple files natively and copying them to the downloads folder
 */
export class DownloadStrategyGenericSingleAndMultiple extends DownloadStrategy<FileReference> {
	constructor(private host: FileControllerNative) {
		super()
	}

	downloadAction(file: TutanotaFile): Promise<FileReference> {
		return this.host.downloadAndDecryptInNative(file)
	}

	processDownloadedFiles(downloadedFiles: FileReference[]): Promise<string[]> {
		return promiseMap(downloadedFiles, (file) => this.host.fileApp.putFileIntoDownloadsFolder(file.location))
	}

	cleanUp(downloadedFiles: FileReference[]): Promise<void> {
		return this.host.cleanUp(downloadedFiles)
	}
}

/**
 * for Downloading single and multiple files natively and opening them.
 */
export class DownloadStrategyOpenSingleAndMultiple extends DownloadStrategy<FileReference> {
	constructor(private host: FileControllerNative) {
		super()
	}

	downloadAction(file: TutanotaFile): Promise<FileReference> {
		return this.host.downloadAndDecryptInNative(file)
	}

	processDownloadedFiles(downloadedFiles: FileReference[]): Promise<void[]> {
		return promiseMap(downloadedFiles, async (file) => {
			try {
				await this.host.fileApp.open(file)
			} finally {
				if (isApp()) await this.host.fileApp.deleteFile(file.location).catch((e: any) => console.log("failed to delete file", file.location, e))
			}
		})
	}

	cleanUp(downloadedFiles: FileReference[]): Promise<unknown> {
		if (isApp()) return this.host.cleanUp(downloadedFiles)
		return Promise.resolve(undefined)
	}
}

/**
 * for downloading multiple files on desktop. Files are bundled in a zip file.
 */
export class DownloadStrategyDesktopMultiple extends DownloadStrategy<FileReference> {
	constructor(private host: FileControllerNative) {
		super()
	}

	downloadAction(file: TutanotaFile): Promise<FileReference> {
		return this.host.downloadAndDecryptInNative(file)
	}

	async processDownloadedFiles(downloadedFiles: FileReference[]): Promise<string> {
		const dataFiles = (await promiseMap(downloadedFiles, (f) => this.host.fileApp.readDataFile(f.location))).filter(Boolean)
		const zipFileInTemp = await this.host.fileApp.writeDataFile(await zipDataFiles(dataFiles as Array<DataFile>, `${sortableTimestamp()}-attachments.zip`))
		return this.host.fileApp.putFileIntoDownloadsFolder(zipFileInTemp.location).finally(async () => {
			try {
				await this.host.fileApp.deleteFile(zipFileInTemp.location)
			} catch (e) {
				console.log("failed to delete file", zipFileInTemp.location, e)
			}
		})
	}

	cleanUp(downloadedFiles: FileReference[]): Promise<void> {
		return this.host.cleanUp(downloadedFiles)
	}
}
