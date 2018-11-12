// @flow
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {createDataFile} from "../api/common/DataFile"
import {assertMainOrNode, isAndroidApp, isApp} from "../api/Env"
import {fileApp, putFileIntoDownloadsFolder} from "../native/FileApp"
import {neverNull} from "../api/common/utils/Utils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {CryptoError} from "../api/common/error/CryptoError"
import {lang} from "../misc/LanguageViewModel"
import {BrowserType} from "../misc/ClientConstants"
import {client} from "../misc/ClientDetector"

assertMainOrNode()

export class FileController {

	downloadAndOpen(tutanotaFile: TutanotaFile, open: boolean): Promise<void> {
		return showProgressDialog("pleaseWait_msg",
			worker.downloadFileContent(tutanotaFile).then(file => {
				if (isAndroidApp() && !open && file._type === 'FileReference') {
					// move the file to download folder on android app.
					return putFileIntoDownloadsFolder(file.location)
				} else {
					return this.open(file)
				}
			}).catch(err => {
				if (err instanceof CryptoError) {
					return Dialog.error("corrupted_msg")
				} else {
					return Dialog.error("couldNotAttachFile_msg")
				}
			})
		).finally(() => this._cleanup())
	}

	downloadAll(tutanotaFiles: TutanotaFile[]): Promise<void> {
		return showProgressDialog("pleaseWait_msg",
			Promise.map(tutanotaFiles, (tutanotaFile) => {
				return worker.downloadFileContent(tutanotaFile)
				             .catch(err => {
					             if (err instanceof CryptoError) {
						             return Dialog.error(() => lang.get("corrupted_msg") + " " + tutanotaFile.name)
					             } else {
						             return Dialog.error(() => lang.get("couldNotAttachFile_msg") + " "
							             + tutanotaFile.name)
					             }
				             })
			}, {concurrency: (isAndroidApp() ? 1 : 5)}).each((file) => {
				if (isAndroidApp()) {
					return putFileIntoDownloadsFolder(file.location)
				} else {
					return fileController.open(file)
				}
			})
		).return()
		 .catch(() => Dialog.error("couldNotAttachFile_msg"))
		 .finally(() => this._cleanup())
	}

	/**
	 * @param allowedExtensions Array of extensions strings without "."
	 */
	showFileChooser(multiple: boolean, allowedExtensions: ?string[]): Promise<Array<DataFile>> {
		// if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_WINDOWS_PHONE) {
		// 	return tutao.tutanota.gui.alert(tutao.lang("addAttachmentNotPossibleIe_msg")).then(function() {
		// 		return []
		// 	})
		// }
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

	open(file: DataFile | FileReference): Promise<void> {
		const _file = file
		if (_file._type === 'FileReference') {
			return fileApp.open(_file)
		} else {
			let dataFile: DataFile = _file
			if (isApp()) {
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
						const body = neverNull(document.body)
						body.appendChild(a)
						a.click()
						body.removeChild(a)
						window.URL.revokeObjectURL(url)
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

	_cleanup() {
		if (isApp()) {
			fileApp.clearFileData()
			       .catch((e) => console.warn("Failed to clear file data", e))
		}
	}
}

export const fileController: FileController = new FileController()


