import type {Session} from "electron"
import type {DesktopConfig} from "./config/DesktopConfig.js"
import path from "path"
import {assertNotNull, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {lang} from "../misc/LanguageViewModel.js"
import type {DesktopNetworkClient} from "./DesktopNetworkClient.js"
import {FileOpenError} from "../api/common/error/FileOpenError.js"
import {log} from "./DesktopLog.js"
import {looksExecutable, nonClobberingFilename} from "./PathUtils.js"
import type {DesktopUtils} from "./DesktopUtils.js"
import type * as FsModule from "fs"
import {CancelledError} from "../api/common/error/CancelledError.js"
import {BuildConfigKey, DesktopConfigKey} from "./config/ConfigKeys.js"
import {WriteStream} from "fs-extra"
// Make sure to only import the type
import type {DownloadTaskResponse, FileUri} from "../native/common/FileApp.js"
import type http from "http"
import type * as stream from "stream"
import {DateProvider} from "../api/common/DateProvider"
import {sha256Hash} from "@tutao/tutanota-crypto"

type FsExports = typeof FsModule
type ElectronExports = typeof Electron.CrossProcessExports

const TAG = "[DownloadManager]"

export class DesktopDownloadManager {
	private readonly _conf: DesktopConfig
	private readonly _net: DesktopNetworkClient
	private readonly _dateProvider: DateProvider

	/** We don't want to spam opening file manager all the time so we throttle it. This field is set to the last time we opened it. */
	private _lastOpenedFileManagerAt: number | null
	private readonly _desktopUtils: DesktopUtils
	private readonly _fs: FsExports
	private readonly _electron: ElectronExports

	constructor(
		conf: DesktopConfig,
		net: DesktopNetworkClient,
		desktopUtils: DesktopUtils,
		dateProvider: DateProvider,
		fs: FsExports,
		electron: ElectronExports,
	) {
		this._conf = conf
		this._net = net
		this._dateProvider = dateProvider
		this._lastOpenedFileManagerAt = null
		this._desktopUtils = desktopUtils
		this._fs = fs
		this._electron = electron
	}

	manageDownloadsForSession(session: Session, dictUrl: string) {
		dictUrl = dictUrl + "/dictionaries/"
		log.debug(TAG, "getting dictionaries from:", dictUrl)
		session.setSpellCheckerDictionaryDownloadURL(dictUrl)
		session
			.removeAllListeners("spellcheck-dictionary-download-failure")
			.on("spellcheck-dictionary-initialized", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-initialized", lcode))
			.on("spellcheck-dictionary-download-begin", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-begin", lcode))
			.on("spellcheck-dictionary-download-success", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-success", lcode))
			.on("spellcheck-dictionary-download-failure", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-failure", lcode))
	}

	/**
	 * SHA256 of the file found at given URI
	 * @throws Error if file is not found
	 */
	async hashFile(fileUri: string): Promise<string> {
		const data = await this._fs.promises.readFile(fileUri)
		const checksum = sha256Hash(data)
		return uint8ArrayToBase64(checksum)
	}

	/**
	 * Download file into the encrypted files directory.
	 */
	async downloadNative(
		sourceUrl: string,
		fileName: string,
		headers: Dict,
	): Promise<DownloadTaskResponse> {
		// Propagate error in initial request if it occurs (I/O errors and such)
		const response = await this._net.executeRequest(sourceUrl, {
			method: "GET",
			timeout: 20000,
			headers,
		})

		// Must always be set for our types of requests
		const statusCode = assertNotNull(response.statusCode)

		let encryptedFilePath
		if (statusCode == 200) {
			const downloadDirectory = await this.getTutanotaTempDirectory("encrypted")
			encryptedFilePath = path.join(downloadDirectory, fileName)
			await this.pipeIntoFile(response, encryptedFilePath)
		} else {
			encryptedFilePath = null
		}

		const result = {
			statusCode: statusCode,
			encryptedFileUri: encryptedFilePath,
			errorId: getHttpHeader(response.headers, "error-id"),
			precondition: getHttpHeader(response.headers, "precondition"),
			suspensionTime: getHttpHeader(response.headers, "suspension-time") ?? getHttpHeader(response.headers, "retry-after"),
		}

		console.log("Download finished", result.statusCode, result.suspensionTime)

		return result
	}

	/**
	 * Open file at {@param itemPath} in default system handler
	 */
	open(itemPath: string): Promise<void> {
		const tryOpen = () =>
			this._electron.shell
				.openPath(itemPath) // may resolve with "" or an error message
				.catch(() => "failed to open path.")
				.then(errMsg => (errMsg === "" ? Promise.resolve() : Promise.reject(new FileOpenError("Could not open " + itemPath + ", " + errMsg))))

		if (looksExecutable(itemPath)) {
			return this._electron.dialog
					   .showMessageBox({
						   type: "warning",
						   buttons: [lang.get("yes_label"), lang.get("no_label")],
						   title: lang.get("executableOpen_label"),
						   message: lang.get("executableOpen_msg"),
						   defaultId: 1, // default button
					   })
					   .then(({response}) => {
						   if (response === 0) {
							   return tryOpen()
						   } else {
							   return Promise.resolve()
						   }
					   })
		} else {
			return tryOpen()
		}
	}

	/**
	 * Save {@param data} to the disk. Will pick the path based on user download dir preference and {@param filename}.
	 */
	async saveDataFile(filename: string, data: Uint8Array): Promise<FileUri> {
		const savePath = await this._pickSavePath(filename)
		await this._fs.promises.mkdir(path.dirname(savePath), {
			recursive: true,
		})
		await this._fs.promises.writeFile(savePath, data)
		return savePath
	}


	/**
	 * Copy {@param fileUri} to the downloads folder disk. Will pick the path based on user download dir preference.
	 */
	async putFileIntoDownloadsFolder(fileUri: string): Promise<FileUri> {
		const filename = path.basename(fileUri)
		const savePath = await this._pickSavePath(filename)
		await this._fs.promises.mkdir(path.dirname(savePath), {
			recursive: true,
		})
		await this._fs.promises.copyFile(fileUri, savePath)
		await this.showInFileExplorer(savePath)
		return savePath
	}

	async showInFileExplorer(savePath: string): Promise<void> {
		// See doc for _lastOpenedFileManagerAt on why we do this throttling.
		const lastOpenedFileManagerAt = this._lastOpenedFileManagerAt
		const fileManagerTimeout = await this._conf.getConst(BuildConfigKey.fileManagerTimeout)

		if (lastOpenedFileManagerAt == null || this._dateProvider.now() - lastOpenedFileManagerAt > fileManagerTimeout) {
			this._lastOpenedFileManagerAt = this._dateProvider.now()
			await this._electron.shell.openPath(path.dirname(savePath))
		}
	}


	private async _pickSavePath(filename: string): Promise<string> {
		const defaultDownloadPath = await this._conf.getVar(DesktopConfigKey.defaultDownloadPath)

		if (defaultDownloadPath != null) {
			const fileName = path.basename(filename)
			return path.join(defaultDownloadPath, nonClobberingFilename(await this._fs.promises.readdir(defaultDownloadPath), fileName))
		} else {
			const {canceled, filePath} = await this._electron.dialog.showSaveDialog({
				defaultPath: path.join(this._electron.app.getPath("downloads"), filename),
			})

			if (canceled) {
				throw new CancelledError("Path selection cancelled")
			} else {
				return assertNotNull(filePath)
			}
		}
	}

	/**
	 * Get a directory under tutanota's temporary directory, will create it if it doesn't exist
	 */
	async getTutanotaTempDirectory(...subdirs: string[]): Promise<string> {
		const dirPath = this._desktopUtils.getTutanotaTempPath(...subdirs)

		await this._fs.promises.mkdir(dirPath, {
			recursive: true,
		})
		return dirPath
	}

	deleteTutanotaTempDirectory() {
		if (this._fs.existsSync(this._desktopUtils.getTutanotaTempPath())) {
			this._fs.rmSync(this._desktopUtils.getTutanotaTempPath(), {
				recursive: true,
			})
		}
	}

	private async pipeIntoFile(response: stream.Readable, encryptedFilePath: string) {
		const fileStream: WriteStream = this._fs.createWriteStream(encryptedFilePath, {emitClose: true})
		try {
			await pipeStream(response, fileStream)
			await closeFileStream(fileStream)
		} catch (e) {
			// Close first, delete second
			// Also yes, we do need to close it manually:
			// > One important caveat is that if the Readable stream emits an error during processing, the Writable destination is not closed automatically.
			// > If an error occurs, it will be necessary to manually close each stream in order to prevent memory leaks.
			// see https://nodejs.org/api/stream.html#readablepipedestination-options
			await closeFileStream(fileStream)
			await this._fs.promises.unlink(encryptedFilePath)
			throw e
		}
	}

	async joinFiles(filename: string, files: Array<FileUri>): Promise<string> {
		const downloadDirectory = await this.getTutanotaTempDirectory("download")
		const fileUri = path.join(downloadDirectory, filename)
		const outStream = this._fs.createWriteStream(fileUri, {autoClose: false})

		for (const infile of files) {
			await new Promise((resolve, reject) => {
				const readStream = this._fs.createReadStream(infile)
				readStream.on('end', resolve)
				readStream.on('error', reject)
				readStream.pipe(outStream, {end: false})
			})
		}
		// Wait for the write stream to finish
		await new Promise((resolve) => {
			outStream.end(resolve)
		})
		return fileUri
	}

	async deleteFile(filename: string): Promise<void> {
		return this._fs.promises.unlink(filename)
	}

	async getSize(fileUri: FileUri): Promise<number> {
		const stats = await this._fs.promises.stat(fileUri)
		return stats.size
	}
}

function getHttpHeader(headers: http.IncomingHttpHeaders, name: string): string | null {
	// All headers are in lowercase. Lowercase them just to be sure
	const value = headers[name.toLowerCase()]
	if (Array.isArray(value)) {
		return value[0]
	} else {
		return value ?? null
	}
}

function pipeStream(stream: stream.Readable, into: stream.Writable): Promise<void> {
	return new Promise((resolve, reject) => {
		stream.pipe(into)
			  .on("finish", resolve)
			  .on("error", reject)
	})
}

function closeFileStream(stream: FsModule.WriteStream): Promise<void> {
	return new Promise((resolve) => {
		stream.on("close", resolve)
		stream.close()
	})
}