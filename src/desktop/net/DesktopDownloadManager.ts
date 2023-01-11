import type { DesktopConfig } from "../config/DesktopConfig.js"
import path from "path"
import { assertNotNull, splitUint8ArrayInChunks, stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel.js"
import type { DesktopNetworkClient } from "./DesktopNetworkClient.js"
import { FileOpenError } from "../../api/common/error/FileOpenError.js"
import { looksExecutable, nonClobberingFilename } from "../PathUtils.js"
import type { DesktopUtils } from "../DesktopUtils.js"
import type * as FsModule from "fs"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { BuildConfigKey, DesktopConfigKey } from "../config/ConfigKeys.js"
import { WriteStream } from "fs-extra"
// Make sure to only import the type
import type { FileUri } from "../../native/common/FileApp.js"
import type http from "http"
import type * as stream from "stream"
import { DateProvider } from "../../api/common/DateProvider.js"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { DownloadTaskResponse } from "../../native/common/generatedipc/DownloadTaskResponse.js"
import { DataFile } from "../../api/common/DataFile.js"
import url from "url"
import { log } from "../DesktopLog.js"
import { UploadTaskResponse } from "../../native/common/generatedipc/UploadTaskResponse.js"
import { Buffer } from "buffer"

type FsExports = typeof FsModule
type ElectronExports = typeof Electron.CrossProcessExports
const TAG = "[DesktopDownloadManager]"

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
	async blobHashFile(fileUri: string): Promise<string> {
		const data = await this.fs.promises.readFile(fileUri)
		const checksum = sha256Hash(data).slice(0, 6)
		return uint8ArrayToBase64(checksum)
	}

	/**
	 * Download file into the encrypted files directory.
	 */
	async downloadNative(sourceUrl: string, fileName: string, headers: Dict): Promise<DownloadTaskResponse> {
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
			const downloadDirectory = await this.ensureEncryptedDir()
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

		log.info(TAG, "Download finished", result.statusCode, result.suspensionTime)
		return result
	}

	async upload(fileUri: string, targetUrl: string, method: string, headers: Record<string, string>): Promise<UploadTaskResponse> {
		const fileStream = this.fs.createReadStream(fileUri)
		const response = await this.net.executeRequest(targetUrl, { method, headers, timeout: 20000 }, fileStream)

		let responseBody: Uint8Array
		if (response.statusCode == 200 || response.statusCode == 201) {
			responseBody = await readStreamToBuffer(response)
		} else {
			// this is questionable, should probably change the type
			responseBody = new Uint8Array([])
		}
		return {
			statusCode: assertNotNull(response.statusCode),
			errorId: getHttpHeader(response.headers, "error-id"),
			precondition: getHttpHeader(response.headers, "precondition"),
			suspensionTime: getHttpHeader(response.headers, "suspension-time") ?? getHttpHeader(response.headers, "retry-after"),
			responseBody,
		}
	}

	/**
	 * Open file at {@param itemPath} in default system handler
	 */
	open(itemPath: string): Promise<void> {
		const tryOpen = () =>
			this.electron.shell
				.openPath(itemPath) // may resolve with "" or an error message
				.catch(() => "failed to open path.")
				.then((errMsg) => (errMsg === "" ? Promise.resolve() : Promise.reject(new FileOpenError("Could not open " + itemPath + ", " + errMsg))))

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
				.then(({ response }) => {
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
		const tempDir = await this.ensureUnencrytpedDir()
		// We do not check if file exists and then write, this is generally a no-no for security reasons. We write and catch instead.
		const files = await this.fs.promises.readdir(tempDir)
		const filename = nonClobberingFilename(files, file.name)
		const savePath = path.join(tempDir, filename)
		try {
			await this.fs.promises.writeFile(savePath, file.data)
		} catch (e) {
			if (e.code === "EEXIST") {
				// if the file exists we will try again and will pick another name
				return this.writeDataFile(file)
			} else {
				throw e
			}
		}
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
			const { canceled, filePath } = await this.electron.dialog.showSaveDialog({
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
		const fileStream: WriteStream = this.fs.createWriteStream(encryptedFilePath, { emitClose: true })
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
		const downloadDirectory = await this.ensureUnencrytpedDir()

		const filesInDirectory = await this.fs.promises.readdir(downloadDirectory)
		const newFilename = nonClobberingFilename(filesInDirectory, filename)
		const fileUri = path.join(downloadDirectory, newFilename)
		const outStream = this.fs.createWriteStream(fileUri, { autoClose: false })

		for (const infile of files) {
			await new Promise((resolve, reject) => {
				const readStream = this.fs.createReadStream(infile)
				readStream.on("end", resolve)
				readStream.on("error", reject)
				readStream.pipe(outStream, { end: false })
			})
		}
		// Wait for the write stream to finish
		await new Promise((resolve) => {
			outStream.end(resolve)
		})
		return fileUri
	}

	async splitFile(fileUri: string, maxChunkSizeBytes: number): Promise<Array<string>> {
		const tempDir = await this.ensureUnencrytpedDir()
		const fullBytes = await this.fs.promises.readFile(fileUri)
		const chunks = splitUint8ArrayInChunks(maxChunkSizeBytes, fullBytes)
		const filenameHash = uint8ArrayToHex(sha256Hash(stringToUtf8Uint8Array(fileUri)))
		const chunkPaths: string[] = []

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i]
			const fileName = `${filenameHash}.${i}.blob`
			const chunkPath = path.join(tempDir, fileName)
			await this.fs.promises.writeFile(chunkPath, chunk)
			chunkPaths.push(chunkPath)
		}

		return chunkPaths
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

	private async ensureEncryptedDir() {
		const downloadDirectory = this.getEncryptedTempDir()
		await this.fs.promises.mkdir(downloadDirectory, { recursive: true })
		return downloadDirectory
	}

	private async ensureUnencrytpedDir() {
		const downloadDirectory = this.getUnenecryptedTempDir()
		await this.fs.promises.mkdir(downloadDirectory, { recursive: true })
		return downloadDirectory
	}

	private getEncryptedTempDir() {
		return path.join(this.desktopUtils.getTutanotaTempPath(), "encrypted")
	}

	private getUnenecryptedTempDir() {
		return path.join(this.desktopUtils.getTutanotaTempPath(), "download")
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
		stream.on("error", reject)
		stream
			.pipe(into)
			// pipe returns destination
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

export async function readStreamToBuffer(stream: stream.Readable): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		const data: Buffer[] = []

		stream.on("data", (chunk) => {
			data.push(chunk as Buffer)
		})

		stream.on("end", () => {
			resolve(Buffer.concat(data))
		})

		stream.on("error", (err) => {
			reject(err)
		})
	})
}
