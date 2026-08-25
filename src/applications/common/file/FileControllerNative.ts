import { Dialog } from "../../../ui/base/Dialog.js"
import { CancelledError, EnvProvider, ProgrammingError } from "@tutao/app-env"
import { assert, assertNotNull, getFirstOrThrow, isNotNull, promiseMap, sortableTimestamp } from "@tutao/utils"
import type { NativeFileApp } from "../../../app-kit/native-bridge/common/FileApp.js"
import { BlobFacade } from "../api/worker/facades/lazy/BlobFacade.js"
import { FileController, zipDataFiles } from "./FileController.js"
import { ArchiveDataType } from "../../../entities/sys/Utils"
import { assertOnlyFileReferences, FileReference } from "../../../entities/tutanota/Utils"
import { TransferId } from "../../../entities/drive/Utils"
import { DataFile } from "../../../entities/tutanota/MailBundle"
import { createReferencingInstance, DownloadableFileEntity } from "../../../entities/storage/BlobUtils"

EnvProvider.assertMainOrNode()

/**
 * coordinates downloads when we have access to native functionality
 */
export class FileControllerNative extends FileController {
	constructor(
		blobFacade: BlobFacade,
		private readonly fileApp: NativeFileApp,
	) {
		assert(
			EnvProvider.get().isDesktop() || EnvProvider.get().isAdminClient() || EnvProvider.get().isApp() || EnvProvider.isTest(),
			"Don't make native file controller when not in native",
		)
		super(blobFacade)
	}

	protected async cleanUp(files: Array<FileReference | DataFile>) {
		assertOnlyFileReferences(files)
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
	 * Does not delete temporary file in app.
	 */
	async saveDataFile(file: DataFile): Promise<void> {
		// For apps "opening" DataFile currently means saving and opening it.
		try {
			const fileReference = await this.fileApp.writeDataFile(file)
			if (EnvProvider.get().isAndroidApp() || EnvProvider.get().isDesktop()) {
				await this.fileApp.putFileIntoDownloadsFolder(fileReference.location, fileReference.name)
				return
			} else if (EnvProvider.get().isIOSApp()) {
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

	/** Public for testing */
	async downloadAndDecrypt(tutanotaFile: DownloadableFileEntity, transferId: TransferId, archiveType: ArchiveDataType): Promise<FileReference> {
		return await this.blobFacade.downloadAndDecryptNative(
			archiveType,
			createReferencingInstance(tutanotaFile),
			tutanotaFile.name,
			assertNotNull(tutanotaFile.mimeType, "tried to call blobfacade.downloadAndDecryptNative with null mimeType"),
			transferId,
		)
	}

	async writeDownloadedFiles(downloadedFiles: readonly (DataFile | FileReference)[]): Promise<void> {
		assertOnlyFileReferences(downloadedFiles)
		if (EnvProvider.get().isIOSApp()) {
			await this.processDownloadedFilesIOS(downloadedFiles)
		} else if (EnvProvider.get().isDesktop()) {
			await this.processDownloadedFilesDesktop(downloadedFiles)
		} else if (EnvProvider.get().isAndroidApp()) {
			await promiseMap(downloadedFiles, (file) => this.fileApp.putFileIntoDownloadsFolder(file.location, file.name))
		} else {
			throw new ProgrammingError("in filecontroller native but not in ios, android or desktop? - tried to write")
		}
	}

	async openDownloadedFiles(downloadedFiles: readonly (FileReference | DataFile)[]): Promise<void> {
		if (EnvProvider.get().isDesktop() || EnvProvider.get().isAndroidApp() || EnvProvider.get().isIOSApp()) {
			assertOnlyFileReferences(downloadedFiles)
			await this.openFiles(downloadedFiles)
		} else {
			throw new ProgrammingError("in filecontroller native but not in ios, android or desktop? - tried to open")
		}
	}

	/**
	 * for downloading multiple files on desktop. multiple files are bundled in a zip file, single files
	 *
	 * we could use the same strategy as on android, but
	 * if the user doesn't have a default dl path selected on desktop,
	 * the client will ask for a location for each file separately, so we zip them for now.
	 */
	private async processDownloadedFilesDesktop(downloadedFiles: readonly FileReference[]): Promise<void> {
		if (downloadedFiles.length < 1) {
			return
		}
		console.log("downloaded files in processing", downloadedFiles.length)
		let fileInTemp: FileReference
		if (downloadedFiles.length > 1) {
			// If multiple files were downloaded they are zipped into one.
			// Currently used for mail attachments only.
			// Will fail if used with big data, use with caution.
			// Ideally we shouldn't do it in the renderer process.
			const dataFiles = (await promiseMap(downloadedFiles, (f) => this.fileApp.readDataFile(f.location))).filter(isNotNull)
			fileInTemp = await this.fileApp.writeDataFile(await zipDataFiles(dataFiles, `${sortableTimestamp()}-attachments.zip`))
		} else {
			fileInTemp = getFirstOrThrow(downloadedFiles)
		}
		await this.fileApp.putFileIntoDownloadsFolder(fileInTemp.location, fileInTemp.name)
	}

	private async processDownloadedFilesIOS(downloadedFiles: readonly FileReference[]): Promise<void> {
		for (const file of downloadedFiles) {
			try {
				await this.fileApp.putFileIntoDownloadsFolder(file.location, file.name)
			} finally {
				await this.fileApp.deleteFile(file.location).catch((e: any) => console.log("failed to delete file", file.location, e))
			}
		}
	}

	private async openFiles(downloadedFiles: readonly FileReference[]): Promise<void> {
		for (const file of downloadedFiles) {
			try {
				await this.fileApp.open(file)
			} finally {
				// on desktop, we don't get to know when the other app is done with the file, so we leave cleanup to the OS
				if (EnvProvider.get().isApp())
					await this.fileApp.deleteFile(file.location).catch((e: any) => console.log("failed to delete file", file.location, e))
			}
		}
	}
}
