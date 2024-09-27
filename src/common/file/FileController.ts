import { Dialog } from "../gui/base/Dialog.js"
import { convertToDataFile, createDataFile, DataFile } from "../api/common/DataFile"
import { assertMainOrNode, isApp } from "../api/common/Env"
import { assertNotNull, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { BrowserType } from "../misc/ClientConstants.js"
import { client } from "../misc/ClientDetector.js"
import { File as TutanotaFile } from "../api/entities/tutanota/TypeRefs.js"
import { deduplicateFilenames, FileReference, sanitizeFilename } from "../api/common/utils/FileUtils"

import { BlobFacade } from "../api/worker/facades/lazy/BlobFacade.js"
import { ArchiveDataType } from "../api/common/TutanotaConstants.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { CancelledError } from "../api/common/error/CancelledError.js"
import { ConnectionError } from "../api/common/error/RestError.js"
import { elementIdPart, listIdPart } from "../api/common/utils/EntityUtils.js"
import { BlobReferencingInstance } from "../api/worker/facades/BlobAccessTokenFacade.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { isOfflineError } from "../api/common/utils/ErrorUtils.js"
import { locator } from "../api/main/CommonLocator.js"
import { PermissionError } from "../api/common/error/PermissionError.js"
import { FileNotFoundError } from "../api/common/error/FileNotFoundError.js"

assertMainOrNode()
export const CALENDAR_MIME_TYPE = "text/calendar"

// We want to handle both types of vCards
export enum VCARD_MIME_TYPES {
	X_VCARD = "text/x-vcard",
	VCARD = "text/vcard",
}

const enum DownloadPostProcessing {
	Open,
	Write,
}

export type ProgressObserver = (somePromise: Promise<void>, progress?: Stream<number>) => Promise<void>

/**
 * coordinates single and multiple downloads on different platforms
 */
export abstract class FileController {
	protected constructor(protected readonly blobFacade: BlobFacade, protected readonly observeProgress: ProgressObserver) {}

	private async doDownload(tutanotaFiles: TutanotaFile[], action: DownloadPostProcessing, progress?: stream<number>): Promise<void> {
		const downloadedFiles: Array<FileReference | DataFile> = []
		try {
			let isOffline = false
			for (const file of tutanotaFiles) {
				try {
					const downloadedFile = await this.downloadAndDecrypt(file)
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
				if (action === DownloadPostProcessing.Open) {
					this.openDownloadedFiles(downloadedFiles)
				} else {
					await this.writeDownloadedFiles(downloadedFiles)
				}
			}
			if (isOffline) {
				throw new ConnectionError("currently offline")
			}
		} finally {
			// we don't necessarily know when the user is done with the temporary file that was opened
			// because we don't have a handle to the opening application/process.
			if (action !== DownloadPostProcessing.Open) await this.cleanUp(downloadedFiles)
		}
	}

	/**
	 * get the referenced TutanotaFile as a DataFile without writing anything to disk
	 */
	async getAsDataFile(file: TutanotaFile): Promise<DataFile> {
		// using the browser's built-in download since we don't want to write anything to disk here
		return downloadAndDecryptDataFile(file, this.blobFacade)
	}

	/**
	 * Save a DataFile locally
	 */
	abstract saveDataFile(file: DataFile): Promise<void>

	/**
	 * Download a file from the server to the filesystem
	 */
	async download(file: TutanotaFile) {
		await this.observeProgress(this.doDownload([file], DownloadPostProcessing.Write))
	}

	/**
	 * Download all provided files
	 *
	 * Temporary files are deleted afterwards in apps.
	 */
	async downloadAll(files: Array<TutanotaFile>): Promise<void> {
		const progress = stream(0)
		await this.observeProgress(this.doDownload(files, DownloadPostProcessing.Write, progress), progress)
	}

	/**
	 * Open a file in the host system
	 * Temporary files are deleted afterwards in apps.
	 */
	async open(file: TutanotaFile) {
		await this.observeProgress(this.doDownload([file], DownloadPostProcessing.Open))
	}

	protected abstract writeDownloadedFiles(downloadedFiles: Array<FileReference | DataFile>): Promise<void>

	protected abstract openDownloadedFiles(downloadedFiles: Array<FileReference | DataFile>): Promise<void>

	protected abstract cleanUp(downloadedFiles: Array<FileReference | DataFile>): Promise<void>

	/**
	 * Get a file from the server and decrypt it
	 */
	protected abstract downloadAndDecrypt(file: TutanotaFile): Promise<FileReference | DataFile>
}

export function handleDownloadErrors<R>(e: Error, errorAction: (msg: TranslationKey) => R): R {
	if (isOfflineError(e)) {
		return errorAction("couldNotAttachFile_msg")
	} else if (e instanceof CryptoError) {
		return errorAction("corrupted_msg")
	} else {
		throw e
	}
}

export function readLocalFiles(fileList: FileList): Promise<Array<DataFile>> {
	// create an array of files form the FileList because we can not iterate the FileList directly
	let nativeFiles: File[] = []

	for (let i = 0; i < fileList.length; i++) {
		nativeFiles.push(fileList[i])
	}

	return promiseMap(
		nativeFiles,
		(nativeFile) => {
			return new Promise((resolve, reject) => {
				let reader = new FileReader()

				reader.onloadend = function (evt: ProgressEvent) {
					const target: any = evt.target

					if (target.readyState === reader.DONE && target.result) {
						// DONE == 2
						resolve(convertToDataFile(nativeFile, new Uint8Array(target.result)))
					} else {
						reject(new Error("could not load file"))
					}
				}

				reader.readAsArrayBuffer(nativeFile)
			})
		},
		{
			concurrency: 5,
		},
	)
}

/**
 * @param allowMultiple allow selecting multiple files
 * @param allowedExtensions Array of extensions strings without "."
 */
export function showFileChooser(allowMultiple: boolean, allowedExtensions?: Array<string>): Promise<Array<DataFile>> {
	// each time when called create a new file chooser to make sure that the same file can be selected twice directly after another
	// remove the last file input
	const fileInput = document.getElementById("hiddenFileChooser")
	const body = neverNull(document.body)

	if (fileInput) {
		// remove the old one because it may contain a file already
		body.removeChild(fileInput)
	}

	const newFileInput = document.createElement("input")
	newFileInput.setAttribute("type", "file")

	if (allowMultiple) {
		newFileInput.setAttribute("multiple", "multiple")
	}

	newFileInput.setAttribute("id", "hiddenFileChooser")

	if (allowedExtensions) {
		newFileInput.setAttribute("accept", allowedExtensions.map((e) => "." + e).join(","))
	}

	newFileInput.style.display = "none"
	const promise: Promise<Array<DataFile>> = new Promise((resolve) => {
		newFileInput.addEventListener("change", (e: Event) => {
			readLocalFiles((e.target as any).files)
				.then(resolve)
				.catch(async (e) => {
					console.log(e)
					await Dialog.message("couldNotAttachFile_msg")
					resolve([])
				})
		})
	})
	// the file input must be put into the dom, otherwise it does not work in IE
	body.appendChild(newFileInput)
	newFileInput.click()
	return promise
}

/**
 * takes a list of DataFiles and creates one DataFile from them that represents a zip
 * containing the the other files
 *
 * currently waits on all DataFiles being available before starting to add them to the zip.
 * It may be even faster to create the zip asap and adding the datafiles as they resolve.
 *
 * duplicate file names lead to the second file added overwriting the first one.
 *
 * @param dataFiles Promise resolving to an array of DataFiles
 * @param name the name of the new zip file
 */
export async function zipDataFiles(dataFiles: Array<DataFile>, name: string): Promise<DataFile> {
	const jsZip = await import("jszip")
	const zip = jsZip.default()
	const deduplicatedMap = deduplicateFilenames(dataFiles.map((df) => sanitizeFilename(df.name)))
	for (let file of dataFiles) {
		const filename = assertNotNull(deduplicatedMap[file.name].shift())
		zip.file(sanitizeFilename(filename), file.data, { binary: true })
	}
	const zipData = await zip.generateAsync({ type: "uint8array" })
	return createDataFile(name, "application/zip", zipData)
}

export async function openDataFileInBrowser(dataFile: DataFile): Promise<void> {
	try {
		const URL = window.URL ?? window.webkitURL

		// Workaround for new behaviour in firefox 98 where PDF attachments open in the same tab by default
		// Users can always change their settings to "always ask" or somesuch, but it's very not nice for this to happen at all
		// because the app gets clobbered, logging users out as well as losing their non-persistent sessions
		// There is a bug report: https://bugzilla.mozilla.org/show_bug.cgi?id=1756980
		// It is unclear whether this will be fixed on the firefox side as it seems that they consider it to be expected behaviour
		// Maybe it will gain enough traction that it will be reverted
		// It's unclear to me why target=_blank is being ignored. If there is a way to ensure that it always opens a new tab,
		// Then we should do that instead of this, because it's preferable to keep the mime type.
		const needsPdfWorkaround = dataFile.mimeType === "application/pdf" && client.browser === BrowserType.FIREFOX && client.browserVersion >= 98

		const mimeType = needsPdfWorkaround ? "application/octet-stream" : dataFile.mimeType

		const blob = new Blob([dataFile.data], { type: mimeType })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")

		if (typeof a.download !== "undefined") {
			a.href = url
			a.download = dataFile.name
			a.style.display = "none"
			a.target = "_blank"
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			// Do not revoke object URL right away so that the browser has a chance to open it
			setTimeout(() => {
				window.URL.revokeObjectURL(url)
			}, 2000)
		} else {
			if (client.isIos() && client.browser === BrowserType.CHROME && typeof FileReader === "function") {
				const reader = new FileReader()
				const downloadPromise = new Promise((resolve) => {
					reader.onloadend = async function () {
						const url = reader.result as any
						resolve(await Dialog.legacyDownload(dataFile.name, url))
					}
				})
				reader.readAsDataURL(blob)
				await downloadPromise
			} else {
				// if the download attribute is not supported try to open the link in a new tab.
				await Dialog.legacyDownload(dataFile.name, url)
			}
		}
	} catch (e) {
		console.log(e)
		return Dialog.message("canNotOpenFileOnDevice_msg")
	}
}

export async function downloadAndDecryptDataFile(file: TutanotaFile, blobFacade: BlobFacade): Promise<DataFile> {
	const bytes = await blobFacade.downloadAndDecrypt(ArchiveDataType.Attachments, createReferencingInstance(file))
	return convertToDataFile(file, bytes)
}

export function createReferencingInstance(tutanotaFile: TutanotaFile): BlobReferencingInstance {
	return {
		blobs: tutanotaFile.blobs,
		elementId: elementIdPart(tutanotaFile._id),
		listId: listIdPart(tutanotaFile._id),
		entity: tutanotaFile,
	}
}

export async function guiDownload(downloadPromise: Promise<void>, progress?: stream<number>): Promise<void> {
	try {
		await showProgressDialog("pleaseWait_msg", downloadPromise, progress)
	} catch (e) {
		// handle the user cancelling the dialog
		if (e instanceof CancelledError) {
			return
		}
		console.log("downloadAndOpen error", e.message)
		await handleDownloadErrors(e, Dialog.message)
	}
}

export async function showNativeFilePicker(fileTypes?: Array<string>): Promise<ReadonlyArray<DataFile>> {
	if (isApp()) {
		const rect = { width: 0, height: 0, left: 0, top: 0 } as DOMRect
		try {
			const fileApp = locator.fileApp
			const fileList = await fileApp.openFileChooser(rect, fileTypes)
			const readFiles: DataFile[] = []
			for (const file of fileList) {
				const data = await fileApp.readDataFile(file.location)

				if (!data) continue

				readFiles.push(data)
			}

			return Promise.resolve(readFiles)
		} catch (err) {
			if (err instanceof PermissionError) {
				Dialog.message("fileAccessDeniedMobile_msg")
			} else if (err instanceof FileNotFoundError) {
				Dialog.message("couldNotAttachFile_msg")
			}

			console.log("Failed read files", err)
		}
	}

	return Promise.resolve([])
}
