// @flow
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {createDataFile} from "../api/common/DataFile"
import {assertMainOrNode, isAndroidApp, isApp, isDesktop} from "../api/Env"
import {fileApp, putFileIntoDownloadsFolder} from "../native/FileApp"
import {neverNull} from "../api/common/utils/Utils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {CryptoError} from "../api/common/error/CryptoError"
import {lang} from "../misc/LanguageViewModel"
import {BrowserType} from "../misc/ClientConstants"
import {client} from "../misc/ClientDetector"
import {ConnectionError} from "../api/common/error/RestError"
import {splitInChunks} from "../api/common/utils/ArrayUtils"

assertMainOrNode()

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
					                        ? putFileIntoDownloadsFolder(file.location)
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
	downloadAll(tutanotaFiles: TutanotaFile[]): Promise<void> {
		return Promise
			.map(tutanotaFiles, (tutanotaFile) => {
				return (isApp() ? worker.downloadFileContentNative(tutanotaFile) : worker.downloadFileContent(tutanotaFile))
				// We're returning dialogs here so they don't overlap each other
				// We're returning null to say that this file is not present.
				// (it's void by default and doesn't satisfy type checker)
					.catch(CryptoError, e => {
						return Dialog.error(() => lang.get("corrupted_msg") + " " + tutanotaFile.name)
						             .return(null)
					})
					.catch(ConnectionError, e => {
						return Dialog.error(() => lang.get("couldNotAttachFile_msg") + " " + tutanotaFile.name)
						             .return(null)
					})
			}, {concurrency: (isAndroidApp() ? 1 : 5)})
			.then((files) => files.filter(Boolean)) // filter out failed files
			.then((files) => {
				return Promise.each(files, (file) =>
					(isAndroidApp() ? putFileIntoDownloadsFolder(file.location) : fileController.open(file))
						.finally(() => this._deleteFile(file.location)))
			}).return()
	}

	downloadBatched(attachments: TutanotaFile[], batchSize: number, delay: number) {
		return splitInChunks(batchSize, attachments).reduce((p, chunk) => {
			return p.then(() => this.downloadAll(chunk)).delay(delay)
		}, Promise.resolve())
	}

	/**
	 * @param allowedExtensions Array of extensions strings without "."
	 */
	showFileChooser(multiple: boolean, allowedExtensions: ?string[]): Promise<Array<DataFile>> {
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
			newFileInput.addEventListener("change", e => {
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

	readLocalFiles(fileList: FileList): Promise<DataFile[]> {
		// create an array of files form the FileList because we can not iterate the FileList directly
		let nativeFiles = []
		for (let i = 0; i < fileList.length; i++) {
			nativeFiles.push(fileList[i])
		}
		return Promise.map(nativeFiles, nativeFile => {
			return Promise.fromCallback(cb => {
				let reader = new FileReader()
				reader.onloadend = function (evt) {
					if (evt.target.readyState === (FileReader: any).DONE && evt.target.result) { // DONE == 2
						cb(null, createDataFile(nativeFile, new Uint8Array(evt.target.result)))
					} else {
						cb(new Error("could not load file"))
					}
				}
				reader.readAsArrayBuffer(nativeFile)
			})
		})
	}

	/**
	 * Does not delete temporary file in app.
	 */
	open(file: DataFile | FileReference): Promise<void> {
		const _file = file
		if (_file._type === 'FileReference') {
			return fileApp.open(_file)
		} else {
			let dataFile: DataFile = _file
			if (isApp() || isDesktop()) {
				return fileApp.saveBlob(dataFile)
				              .catch(err => Dialog.error("canNotOpenFileOnDevice_msg")).return()
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
	}

	_deleteFile(filePath: string) {
		if (isApp()) {
			fileApp.deleteFile(filePath)
			       .catch((e) => console.log("failed to delete file", filePath, e))
		}
	}
}

export const fileController: FileController = new FileController()


