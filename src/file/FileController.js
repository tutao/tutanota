// @flow
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {convertToDataFile, createDataFile} from "../api/common/DataFile"
import {assertMainOrNode, isAndroidApp, isApp, isDesktop} from "../api/common/Env"
import {downcast, neverNull} from "../api/common/utils/Utils"
import {showProgressDialog} from "../gui/ProgressDialog"
import {CryptoError} from "../api/common/error/CryptoError"
import {lang} from "../misc/LanguageViewModel"
import {BrowserType} from "../misc/ClientConstants"
import {client} from "../misc/ClientDetector"
import {ConnectionError} from "../api/common/error/RestError"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import {sortableTimestamp} from "../api/common/utils/DateUtils"
import {deduplicateFilenames, sanitizeFilename} from "../api/common/utils/FileUtils"

assertMainOrNode()

export const CALENDAR_MIME_TYPE = "text/calendar"

export class FileController {

	/**
	 * Temporary files are deleted afterwards in apps.
	 */
	downloadAndOpen(tutanotaFile: TutanotaFile, open: boolean): Promise<void> {
		let downloadPromise
		if (isApp()) {
			downloadPromise = worker.downloadFileContentNative(tutanotaFile)
			                        .then((file) => {
				                        return (isAndroidApp() && !open
					                        ? import("../native/common/FileApp")
						                        .then((fileApp) => fileApp.putFileIntoDownloadsFolder(file.location))
					                        : this.open(file))
					                        .finally(() => this._deleteFile(file.location))
			                        })
		} else if (isDesktop()) {
			downloadPromise = (open
					? worker.downloadFileContentNative(tutanotaFile)
					: worker.downloadFileContent(tutanotaFile)
			).then(file => this.open(file))
		} else {
			downloadPromise = worker.downloadFileContent(tutanotaFile)
			                        .then((file) => this.open(file))
		}

		return showProgressDialog("pleaseWait_msg", downloadPromise.catch(CryptoError, e => {
			console.log(e)
			return Dialog.error("corrupted_msg")
		}).catch(ConnectionError, e => {
			console.log(e)
			return Dialog.error("couldNotAttachFile_msg")
		}))
	}

	/**
	 * Temporary files are deleted afterwards in apps.
	 */
	downloadAll(tutanotaFiles: Array<TutanotaFile>): Promise<void> {
		const showErr = (msg, name) => Dialog.error(() => lang.get(msg) + " " + name).return(null)
		let downloadContent, concurrency, save
		if (isAndroidApp()) {
			downloadContent = f => worker.downloadFileContentNative(f)
			concurrency = {concurrency: 1}
			save = p => p.then(files => files.forEach(file =>
				import("../native/common/FileApp").then((fileApp) => fileApp.putFileIntoDownloadsFolder(file.location))))
		} else if (isApp()) {
			downloadContent = f => worker.downloadFileContentNative(f)
			concurrency = {concurrency: 1}
			save = p => p.then(files => files.forEach(file => this.openFileReference(file).finally(() => this._deleteFile(file.location))))
		} else {
			downloadContent = f => worker.downloadFileContent(f)
			concurrency = {concurrency: 1}
			save = p => p.then(files => this.zipDataFiles(files, `${sortableTimestamp()}-attachments.zip`).then(zip => this.openDataFile(zip)))
		}

		// We're returning dialogs here so they don't overlap each other
		// We're returning null to say that this file is not present.
		// (it's void by default and doesn't satisfy type checker)
		const p = Promise
			.map(tutanotaFiles,
				tutanotaFile => downloadContent(tutanotaFile)
					.catch(CryptoError, () => showErr("corrupted_msg", tutanotaFile.name))
					.catch(ConnectionError, () => showErr("couldNotAttachFile_msg", tutanotaFile.name)),
				concurrency)
			.then((results) => results.filter(Boolean)) // filter out failed files
		// in apps, p is a  Promise<FileReference[]> that have location props.
		// otherwise, it's a Promise<DataFile[]> and can be handled by zipDataFiles
		return save(downcast(p)).return()
	}

	/**
	 * @param allowedExtensions Array of extensions strings without "."
	 */
	showFileChooser(multiple: boolean, allowedExtensions: ?Array<string>): Promise<Array<DataFile>> {
		// each time when called create a new file chooser to make sure that the same file can be selected twice directly after another
		// remove the last file input

		const fileInput = document.getElementById("hiddenFileChooser");
		const body = neverNull(document.body)
		if (fileInput) {
			// remove the old one because it may contain a file already
			body.removeChild(fileInput)
		}

		const newFileInput = document.createElement("input")
		newFileInput.setAttribute("type", "file")
		if (multiple) {
			newFileInput.setAttribute("multiple", "multiple")
		}
		newFileInput.setAttribute("id", "hiddenFileChooser")
		if (allowedExtensions) {
			newFileInput.setAttribute("accept", allowedExtensions.map(e => "." + e).join(","))
		}
		newFileInput.style.display = "none"

		let promise = Promise.fromCallback(cb => {
			newFileInput.addEventListener("change", (e: Event) => {
				this.readLocalFiles((e.target: any).files).then(dataFiles => {
					cb(null, dataFiles)
				}).catch(e => {
					console.log(e)
					return Dialog.error("couldNotAttachFile_msg").then(() => {
						cb(null, [])
					})
				})
			})
		})

		// the file input must be put into the dom, otherwise it does not work in IE
		body.appendChild(newFileInput)
		newFileInput.click()

		return promise
	}

	readLocalFiles(fileList: FileList): Promise<Array<DataFile>> {
		// create an array of files form the FileList because we can not iterate the FileList directly
		let nativeFiles = []
		for (let i = 0; i < fileList.length; i++) {
			nativeFiles.push(fileList[i])
		}
		return Promise.map(nativeFiles, nativeFile => {
			return Promise.fromCallback(cb => {
				let reader = new FileReader()
				reader.onloadend = function (evt: ProgressEvent) {
					const target: any = evt.target
					if (target.readyState === reader.DONE && target.result) { // DONE == 2
						cb(null, convertToDataFile(nativeFile, new Uint8Array(target.result)))
					} else {
						cb(new Error("could not load file"))
					}
				}
				reader.readAsArrayBuffer(nativeFile)
			})
		})
	}

	openFileReference(file: FileReference): Promise<void> {
		return import("../native/common/FileApp").then(({fileApp}) => fileApp.open(file))
	}

	openDataFile(dataFile: DataFile): Promise<void> {
		if (isApp() || isDesktop()) {
			return import("../native/common/FileApp").then(({fileApp}) => fileApp.saveBlob(dataFile))
			                                         .catch(err => Dialog.error("canNotOpenFileOnDevice_msg"))
			                                         .return()
		}
		let saveFunction: Function = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs
			|| (navigator: any).saveBlob || (navigator: any).msSaveOrOpenBlob || (navigator: any).msSaveBlob
			|| (navigator: any).mozSaveBlob || (navigator: any).webkitSaveBlob
		if (saveFunction) {
			let blob = new Blob([dataFile.data], {"type": dataFile.mimeType})
			try {
				const navAny = (navigator: any)
				// in IE the save function must be called directly, otherwise an error is thrown
				if (navAny.msSaveOrOpenBlob) {
					navAny.msSaveOrOpenBlob(blob, dataFile.name)
				} else if (navAny.msSaveBlob) {
					navAny.msSaveBlob(blob, dataFile.name)
				} else {
					saveFunction(blob, dataFile.name)
				}
				return Promise.resolve()
			} catch (e) {
				console.log(e)
				return Dialog.error("saveDownloadNotPossibleIe_msg")
			}
		} else {
			try {
				let URL = window.URL || window.webkitURL || window.mozURL || window.msURL
				let blob = new Blob([dataFile.data], {type: dataFile.mimeType})
				let url = URL.createObjectURL(blob)
				let a = document.createElement("a")
				if (typeof a.download !== "undefined") {
					a.href = url
					a.download = dataFile.name
					a.style.display = "none"
					a.target = "_blank"
					const body = neverNull(document.body)
					body.appendChild(a)
					a.click()
					body.removeChild(a)
					// Do not revoke object URL right away so that the browser has a chance to open it
					setTimeout(() => {
						window.URL.revokeObjectURL(url)
					}, 2000)
				} else {
					if (client.isIos() && client.browser === BrowserType.CHROME && typeof FileReader === 'function') {
						var reader = new FileReader()
						reader.onloadend = function () {
							let url = (reader.result: any)
							return Dialog.legacyDownload(dataFile.name, url)
						}
						reader.readAsDataURL(blob)
					} else {
						// if the download attribute is not supported try to open the link in a new tab.
						return Dialog.legacyDownload(dataFile.name, url)
					}
				}
				return Promise.resolve()
			} catch (e) {
				console.log(e)
				return Dialog.error("canNotOpenFileOnDevice_msg")
			}
		}
	}

	/**
	 * Does not delete temporary file in app.
	 */
	open(file: DataFile | FileReference): Promise<void> {
		if (file._type === 'FileReference') {
			return this.openFileReference(file)
		} else {
			return this.openDataFile(file)
		}
	}

	_deleteFile(filePath: string) {
		if (isApp()) {
			import("../native/common/FileApp").then(({fileApp}) =>
				fileApp.deleteFile(filePath)
				       .catch((e) => console.log("failed to delete file", filePath, e))
			)
		}
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
	zipDataFiles(dataFiles: Array<DataFile>, name: string): Promise<DataFile> {
		//$FlowFixMe[cannot-resolve-module] - we are missing definitions for it
		return import("jszip").then(jsZip => {
			const zip = jsZip.default()
			// fileName should already be sanitized anyway
			const deduplicatedMap = deduplicateFilenames(dataFiles.map(df => sanitizeFilename(df.name)))
			for (let file of dataFiles) {
				zip.file(sanitizeFilename(deduplicatedMap[file.name].shift()), file.data, {binary: true})
			}
			return zip.generateAsync({type: 'uint8array'})
		}).then((zipData: Uint8Array) => createDataFile(name, "application/zip", zipData))
	}
}

export const fileController: FileController = new FileController()