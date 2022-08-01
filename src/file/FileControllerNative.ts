import {Dialog} from "../gui/base/Dialog"
import {DataFile} from "../api/common/DataFile"
import {assertMainOrNode, isAndroidApp, isApp, isDesktop, isElectronClient, isIOSApp, isTest} from "../api/common/Env"
import {assert, neverNull, promiseMap, sortableTimestamp} from "@tutao/tutanota-utils"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {lang} from "../misc/LanguageViewModel"
import {File as TutanotaFile} from "../api/entities/tutanota/TypeRefs.js"
import {FileReference} from "../api/common/utils/FileUtils"
import {CancelledError} from "../api/common/error/CancelledError"
import type {NativeFileApp} from "../native/common/FileApp"
import {ArchiveDataType} from "../api/common/TutanotaConstants"
import {BlobFacade} from "../api/worker/facades/BlobFacade"
import {FileFacade} from "../api/worker/facades/FileFacade"
import {downloadAndDecryptDataFile, FileController, handleDownloadErrors, isLegacyFile, openDataFileInBrowser, zipDataFiles} from "./FileController.js"

assertMainOrNode()

export class FileControllerNative implements FileController {

	constructor(
		private readonly fileApp: NativeFileApp,
		private readonly blobFacade: BlobFacade,
		private readonly fileFacade: FileFacade
	) {
		assert(isElectronClient() || isApp() || isTest(), "Don't make native file controller when not in native")
	}

	/**
	 * Temporary files are deleted afterwards in apps.
	 */
	async download(file: TutanotaFile) {
		await guiDownload(this.doDownload(file))
	}

	async open(file: TutanotaFile) {
		await guiDownload(this.doOpen(file))
	}

	private async doDownload(tutanotaFile: TutanotaFile) {
		let temporaryFile: FileReference | null = null
		try {
			temporaryFile = await this.downloadAndDecryptInNative(tutanotaFile)
			if (isAndroidApp() || isDesktop()) {
				await this.fileApp.putFileIntoDownloadsFolder(temporaryFile.location)
			} else {
				await this.fileApp.open(temporaryFile)
			}
		} finally {
			if (temporaryFile) {
				try {
					await this.fileApp.deleteFile(temporaryFile.location)
				} catch (e) {
					console.log("failed to delete file", temporaryFile.location, e)
				}
			}
		}
	}

	private async doOpen(tutanotaFile: TutanotaFile) {
		let temporaryFile: FileReference | null = null
		try {
			temporaryFile = await this.downloadAndDecryptInNative(tutanotaFile)
			await this.fileApp.open(temporaryFile)
		} finally {
			if (temporaryFile && isApp()) {
				// can't delete on desktop as we can't wait until the viewer has actually loaded the file
				const {location} = temporaryFile
				this.fileApp.deleteFile(location).catch(e => console.log("failed to delete file", location, e))
			}
		}
	}

	/**
	 * Temporary files are deleted afterwards in apps.
	 *
	 * TODO this could probably just use this.doDownload. Temporary files are not being cleaned up on android
	 */
	async downloadAll(tutanotaFiles: Array<TutanotaFile>): Promise<void> {
		const downloadAll = async <T>(
			downloadFile: (file: TutanotaFile) => Promise<T>,
			processDownloadedFiles: (downloadedFiles: T[]) => Promise<unknown>
		) => {
			const downloadedFiles: Array<T> = []
			for (const file of tutanotaFiles) {
				try {
					const downloadedFile = await downloadFile(file)
					downloadedFiles.push(downloadedFile)
				} catch (e) {
					await handleDownloadErrors(e, msg => Dialog.message(() => lang.get(msg) + " " + file.name))
				}
			}
			await processDownloadedFiles(downloadedFiles)
		}

		if (isAndroidApp()) {
			await downloadAll(
				file => this.downloadAndDecryptInNative(file),
				files => promiseMap(files, file => this.fileApp.putFileIntoDownloadsFolder(file.location))
			)
		} else if (isIOSApp()) {
			await downloadAll(
				file => this.downloadAndDecryptInNative(file),
				files => promiseMap(
					files,
					async file => {
						try {
							await this.fileApp.open(file)
						} finally {
							await this.fileApp.deleteFile(file.location).catch(e => console.log("failed to delete file", file.location, e))
						}
					}
				)
			)
		} else {
			await downloadAll(
				file => this.downloadAndDecrypt(file),
				async files => openDataFileInBrowser(await zipDataFiles(files, `${sortableTimestamp()}-attachments.zip`))
			)
		}
	}

	/**
	 * Does not delete temporary file in app.
	 */
	async saveDataFile(file: DataFile): Promise<void> {
		// For apps "opening" DataFile currently means saving and opening it.
		try {
			const fileReference = await this.fileApp.writeDataFile(file)
			if (isAndroidApp()) {
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
			return await this.blobFacade.downloadAndDecryptNative(ArchiveDataType.Attachments, tutanotaFile.blobs, tutanotaFile, tutanotaFile.name, neverNull(tutanotaFile.mimeType))
		}
	}
}

async function guiDownload(downloadPromise: Promise<void>) {
	try {
		await showProgressDialog("pleaseWait_msg", downloadPromise)
	} catch (e) {
		// handle the user cancelling the dialog
		if (e instanceof CancelledError) {
			return
		}
		console.log("downloadAndOpen error", e.message)
		await handleDownloadErrors(e, Dialog.message)
	}
}
