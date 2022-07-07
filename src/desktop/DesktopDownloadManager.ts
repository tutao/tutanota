import type {DesktopConfig} from "./config/DesktopConfig.js"
import path from "path"
import {assertNotNull, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {lang} from "../misc/LanguageViewModel.js"
import type {DesktopNetworkClient} from "./DesktopNetworkClient.js"
import {FileOpenError} from "../api/common/error/FileOpenError.js"
import {looksExecutable, nonClobberingFilename} from "./PathUtils.js"
import type {DesktopUtils} from "./DesktopUtils.js"
import type * as FsModule from "fs"
import {CancelledError} from "../api/common/error/CancelledError.js"
import {BuildConfigKey, DesktopConfigKey} from "./config/ConfigKeys.js"
import {WriteStream} from "fs-extra"
// Make sure to only import the type
import type {FileUri} from "../native/common/FileApp.js"
import type http from "http"
import type * as stream from "stream"
import {DateProvider} from "../api/common/DateProvider"
import {sha256Hash} from "@tutao/tutanota-crypto"
import {DownloadTaskResponse} from "../native/common/generatedipc/DownloadTaskResponse"
import {DataFile} from "../api/common/DataFile.js"
import url from "url"

type FsExports = typeof FsModule
type ElectronExports = typeof Electron.CrossProcessExports

export class DesktopDownloadManager {
	/** We don't want to spam opening file manager all the time so we throttle it. This field is set to the last time we opened it. */
	private lastOpenedFileManagerAt: number | null

	constructor(
		private readonly conf: DesktopConfig,
		private readonly net: DesktopNetworkClient,
		private readonly desktopUtils: DesktopUtils,
		private readonly dateProvider: DateProvider,
		private readonly fs: FsExports,
		private readonly electron: ElectronExports,
	) {
		this.lastOpenedFileManagerAt = null
	}

	/**
	 * SHA256 of the file found at given URI
	 * @throws Error if file is not found
	 */
	async hashFile(fileUri: string): Promise<string> {
		const data = await this.fs.promises.readFile(fileUri)
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
		const response = await this.net.executeRequest(sourceUrl, {
			method: "GET",
			timeout: 20000,
			headers,
		})

		// Must always be set for our types of requests
		const statusCode = assertNotNull(response.statusCode)

		let encryptedFilePath
		if (statusCode == 200) {
			const downloadDirectory = path.join(this.desktopUtils.getTutanotaTempPath(), "encrypted")
			await this.fs.promises.mkdir(downloadDirectory, {recursive: true})
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
			this.electron.shell
				.openPath(itemPath) // may resolve with "" or an error message
				.catch(() => "failed to open path.")
				.then(errMsg => (errMsg === "" ? Promise.resolve() : Promise.reject(new FileOpenError("Could not open " + itemPath + ", " + errMsg))))

		// only windows will happily execute a just downloaded program
		if (process.platform === "win32" && looksExecutable(itemPath)) {
			return this.electron.dialog
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
	 * Save {@param file} to the disk. Will pick the path based on user download dir preference and the name contained
	 * in {@param file}.
	 */
	async writeDataFile(file: DataFile): Promise<FileUri> {
		const savePath = await this.pickSavePath(file.name)
		await this.fs.promises.mkdir(path.dirname(savePath), {
			recursive: true,
		})
		await this.fs.promises.writeFile(savePath, file.data)
		return savePath
	}

	/**
	 * try to read a file into a DataFile. return null if it fails.
	 * @param uriOrPath a file path or a file URI to read the data from
	 * @returns {Promise<null|DataFile>}
	 */
	async readDataFile(uriOrPath: string): Promise<DataFile | null> {
		try {
			uriOrPath = url.fileURLToPath(uriOrPath)
		} catch (e) {
			// the thing already was a path, or at least not an URI
		}

		try {
			const data = await this.fs.promises.readFile(uriOrPath)
			const name = path.basename(uriOrPath)
			return {
				_type: "DataFile",
				data,
				name,
				mimeType: "application/octet-stream",
				size: data.length,
				id: undefined,
			}
		} catch (e) {
			return null
		}
	}


	/**
	 * Copy {@param fileUri} to the downloads folder disk. Will pick the path based on user download dir preference.
	 */
	async putFileIntoDownloadsFolder(fileUri: string): Promise<FileUri> {
		const filename = path.basename(fileUri)
		const savePath = await this.pickSavePath(filename)
		await this.fs.promises.mkdir(path.dirname(savePath), {
			recursive: true,
		})
		await this.fs.promises.copyFile(fileUri, savePath)
		await this.showInFileExplorer(savePath)
		return savePath
	}

	async showInFileExplorer(savePath: string): Promise<void> {
		// See doc for _lastOpenedFileManagerAt on why we do this throttling.
		const lastOpenedFileManagerAt = this.lastOpenedFileManagerAt
		const fileManagerTimeout = await this.conf.getConst(BuildConfigKey.fileManagerTimeout)

		if (lastOpenedFileManagerAt == null || this.dateProvider.now() - lastOpenedFileManagerAt > fileManagerTimeout) {
			this.lastOpenedFileManagerAt = this.dateProvider.now()
			await this.electron.shell.openPath(path.dirname(savePath))
		}
	}


	private async pickSavePath(filename: string): Promise<string> {
		const defaultDownloadPath = await this.conf.getVar(DesktopConfigKey.defaultDownloadPath)

		if (defaultDownloadPath != null) {
			const fileName = path.basename(filename)
			return path.join(defaultDownloadPath, nonClobberingFilename(await this.fs.promises.readdir(defaultDownloadPath), fileName))
		} else {
			const {canceled, filePath} = await this.electron.dialog.showSaveDialog({
				defaultPath: path.join(this.electron.app.getPath("downloads"), filename),
			})

			if (canceled) {
				throw new CancelledError("Path selection cancelled")
			} else {
				return assertNotNull(filePath)
			}
		}
	}

	private async pipeIntoFile(response: stream.Readable, encryptedFilePath: string) {
		const fileStream: WriteStream = this.fs.createWriteStream(encryptedFilePath, {emitClose: true})
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
			await this.fs.promises.unlink(encryptedFilePath)
			throw e
		}
	}

	async joinFiles(filename: string, files: Array<FileUri>): Promise<string> {
		const downloadDirectory = path.join(this.desktopUtils.getTutanotaTempPath(), "download")
		await this.fs.promises.mkdir(downloadDirectory, {recursive: true,})

		const fileUri = path.join(downloadDirectory, filename)
		const outStream = this.fs.createWriteStream(fileUri, {autoClose: false})

		for (const infile of files) {
			await new Promise((resolve, reject) => {
				const readStream = this.fs.createReadStream(infile)
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
		return this.fs.promises.unlink(filename)
	}

	async getSize(fileUri: FileUri): Promise<number> {
		const stats = await this.fs.promises.stat(fileUri)
		return stats.size
	}

	deleteTutanotaTempDirectory() {
		return this.desktopUtils.deleteTutanotaTempDir()
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