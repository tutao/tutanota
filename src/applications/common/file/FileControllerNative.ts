import { Dialog } from "../../../ui/base/Dialog.js"
import { CancelledError, EnvProvider, ProgrammingError } from "@tutao/app-env"
import { assert, assertNotNull, getFirstOrThrow, isNotNull, promiseMap, sortableTimestamp } from "@tutao/utils"
import type { NativeFileApp } from "../../../app-kit/native-bridge/common/FileApp.js"
import { BlobFacade } from "../api/worker/facades/lazy/BlobFacade.js"
import { FileController, zipDataFiles } from "./FileController.js"
import { ArchiveDataType } from "../../../entities/sys/Utils"
import { assertOnlyFileReferences, DataFile, FileReference } from "../../../entities/tutanota/Utils"
import { TransferId } from "../../../entities/drive/Utils"
import { createReferencingInstance, DownloadableFileEntity } from "../../../entities/storage/BlobUtils"
import { Singletons } from "../../../platform-kit/singletons/singleton"

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
			Singletons.envProvider.isDesktop() || Singletons.envProvider.isAdminClient() || Singletons.envProvider.isApp() || Singletons.envProvider.isTest(),
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
			if (Singletons.envProvider.isAndroidApp() || Singletons.envProvider.isDesktop()) {
				await this.fileApp.putFileIntoDownloadsFolder(fileReference.location, fileReference.name)
				return
			} else if (Singletons.envProvider.isIOSApp()) {
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

	/**
	 * Writes to a temp file and opens it.
	 */
	async openDataFile(file: DataFile): Promise<void> {
		const fileReference = await this.fileApp.writeDataFile(file)
		await this.openFiles([fileReference])
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
		if (Singletons.envProvider.isIOSApp()) {
			await this.processDownloadedFilesIOS(downloadedFiles)
		} else if (Singletons.envProvider.isDesktop()) {
			await this.processDownloadedFilesDesktop(downloadedFiles)
		} else if (Singletons.envProvider.isAndroidApp()) {
			await promiseMap(downloadedFiles, (file) => this.fileApp.putFileIntoDownloadsFolder(file.location, file.name))
		} else {
			throw new ProgrammingError("in filecontroller native but not in ios, android or desktop? - tried to write")
		}
	}

	async openDownloadedFiles(downloadedFiles: readonly (FileReference | DataFile)[]): Promise<void> {
		if (Singletons.envProvider.isDesktop() || Singletons.envProvider.isAndroidApp() || Singletons.envProvider.isIOSApp()) {
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
				if (Singletons.envProvider.isApp())
					await this.fileApp.deleteFile(file.location).catch((e: any) => console.log("failed to delete file", file.location, e))
			}
		}
	}
}
