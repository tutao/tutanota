import { FileFacade } from "../../native/common/generatedipc/FileFacade.js"
import { DownloadTaskResponse } from "../../native/common/generatedipc/DownloadTaskResponse.js"
import { IpcClientRect } from "../../native/common/generatedipc/IpcClientRect.js"
import { ElectronExports, FsExports } from "../ElectronExportTypes.js"
import { UploadTaskResponse } from "../../native/common/generatedipc/UploadTaskResponse.js"
import { DataFile } from "../../api/common/DataFile.js"
import { FileUri } from "../../native/common/FileApp.js"
import path from "node:path"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { assertNotNull, splitUint8ArrayInChunks, stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { looksExecutable, nonClobberingFilename } from "../PathUtils.js"
import url from "node:url"
import FsModule from "node:fs"
import { Buffer } from "node:buffer"
import { default as stream } from "node:stream"
import type { ReadableStream } from "node:stream/web"
import { FileOpenError } from "../../api/common/error/FileOpenError.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { log } from "../DesktopLog.js"
import { WriteStream } from "fs-extra"
import { BuildConfigKey, DesktopConfigKey } from "../config/ConfigKeys.js"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { DesktopConfig } from "../config/DesktopConfig.js"
import { DateProvider } from "../../api/common/DateProvider.js"
import { TempFs } from "./TempFs.js"
import { HttpMethod } from "../../api/common/EntityFunctions"
import { FetchImpl } from "../net/NetAgent"
import { OpenDialogOptions } from "electron"

const TAG = "[DesktopFileFacade]"

export class DesktopFileFacade implements FileFacade {
	/** We don't want to spam opening file manager all the time so we throttle it. This field is set to the last time we opened it. */
	private lastOpenedFileManagerAt: number | null

	constructor(
		private readonly win: ApplicationWindow,
		private readonly conf: DesktopConfig,
		private readonly dateProvider: DateProvider,
		private readonly fetch: FetchImpl,
		private readonly electron: ElectronExports,
		private readonly tfs: TempFs,
		private readonly fs: FsExports,
	) {
		this.lastOpenedFileManagerAt = null
	}

	clearFileData(): Promise<void> {
		this.tfs.clear()
		return Promise.resolve()
	}

	async deleteFile(filename: string): Promise<void> {
		return await this.fs.promises.unlink(filename)
	}

	async download(sourceUrl: string, fileName: string, headers: Record<string, string>): Promise<DownloadTaskResponse> {
		const { status, headers: headersIncoming, body } = await this.fetch(sourceUrl, { method: "GET", headers })
		let encryptedFilePath
		if (status == 200 && body != null) {
			const downloadDirectory = await this.tfs.ensureEncryptedDir()
			encryptedFilePath = path.join(downloadDirectory, fileName)
			const readable: stream.Readable = bodyToReadable(body)
			await this.pipeIntoFile(readable, encryptedFilePath)
		} else {
			encryptedFilePath = null
		}

		const result = {
			statusCode: status,
			encryptedFileUri: encryptedFilePath,
			errorId: getHttpHeader(headersIncoming, "error-id"),
			precondition: getHttpHeader(headersIncoming, "precondition"),
			suspensionTime: getHttpHeader(headersIncoming, "suspension-time") ?? getHttpHeader(headersIncoming, "retry-after"),
		}

		log.info(TAG, "Download finished", result.statusCode, result.suspensionTime)
		return result
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

	async getMimeType(file: string): Promise<string> {
		return await getMimeTypeForFile(file)
	}

	async getName(file: string): Promise<string> {
		return path.basename(file)
	}

	async getSize(fileUri: string): Promise<number> {
		const stats = await this.fs.promises.stat(fileUri)
		return stats.size
	}

	async hashFile(fileUri: string): Promise<string> {
		const data = await this.fs.promises.readFile(fileUri)
		const checksum = sha256Hash(data).slice(0, 6)
		return uint8ArrayToBase64(checksum)
	}

	async joinFiles(filename: string, files: Array<string>): Promise<string> {
		const downloadDirectory = await this.tfs.ensureUnencrytpedDir()

		const filesInDirectory = await this.fs.promises.readdir(downloadDirectory)
		const newFilename = nonClobberingFilename(filesInDirectory, filename)
		const fileUri = path.join(downloadDirectory, newFilename)
		const outStream = this.fs.createWriteStream(fileUri, { autoClose: false })

		for (const infile of files) {
			await new Promise<void>((resolve, reject) => {
				const readStream = this.fs.createReadStream(infile)
				readStream.on("end", resolve)
				readStream.on("error", reject)
				readStream.pipe(outStream, { end: false })
			})
		}
		await closeFileStream(outStream)
		return fileUri
	}

	open(location: string /* , mimeType: string omitted */): Promise<void> {
		const tryOpen = () =>
			this.electron.shell
				.openPath(location) // may resolve with "" or an error message
				.catch(() => "failed to open path.")
				.then((errMsg) => (errMsg === "" ? Promise.resolve() : Promise.reject(new FileOpenError("Could not open " + location + ", " + errMsg))))

		// only windows will happily execute a just downloaded program
		if (process.platform === "win32" && looksExecutable(location)) {
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

	async openFileChooser(boundingRect: IpcClientRect, filter: ReadonlyArray<string> | null): Promise<Array<string>> {
		const opts: OpenDialogOptions = { properties: ["openFile", "multiSelections"] }
		if (filter != null) {
			opts.filters = [{ name: "Filter", extensions: filter.slice() }]
		}
		const { filePaths } = await this.electron.dialog.showOpenDialog(this.win._browserWindow, opts)
		return filePaths
	}

	openFolderChooser(): Promise<string | null> {
		// open folder dialog
		return this.electron.dialog
			.showOpenDialog(this.win._browserWindow, {
				properties: ["openDirectory"],
			})
			.then(({ filePaths }) => filePaths[0] ?? null)
	}

	async putFileIntoDownloadsFolder(localFileUri: string, fileNameToUse: string): Promise<string> {
		const savePath = await this.pickSavePath(fileNameToUse)
		await this.fs.promises.mkdir(path.dirname(savePath), {
			recursive: true,
		})
		await this.fs.promises.copyFile(localFileUri, savePath)
		await this.showInFileExplorer(savePath)
		return savePath
	}

	async splitFile(fileUri: string, maxChunkSizeBytes: number): Promise<Array<string>> {
		const tempDir = await this.tfs.ensureUnencrytpedDir()
		const fullBytes = await this.fs.promises.readFile(fileUri)
		const chunks = splitUint8ArrayInChunks(maxChunkSizeBytes, fullBytes)
		// this could just be randomized, we don't seem to care about the blob file names
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

	async upload(fileUri: string, targetUrl: string, method: HttpMethod, headers: Record<string, string>): Promise<UploadTaskResponse> {
		const fileStream = this.fs.createReadStream(fileUri)
		const stat = await this.fs.promises.stat(fileUri)
		headers["Content-Length"] = `${stat.size}`
		const response = await this.fetch(targetUrl, { method, headers, body: fileStream })

		let responseBody: Uint8Array
		if ((response.status == 200 || response.status == 201) && response.body != null) {
			const readable: stream.Readable = bodyToReadable(response.body)
			responseBody = await readStreamToBuffer(readable)
		} else {
			// this is questionable, should probably change the type
			responseBody = new Uint8Array([])
		}
		return {
			statusCode: assertNotNull(response.status),
			errorId: getHttpHeader(response.headers, "error-id"),
			precondition: getHttpHeader(response.headers, "precondition"),
			suspensionTime: getHttpHeader(response.headers, "suspension-time") ?? getHttpHeader(response.headers, "retry-after"),
			responseBody,
		}
	}

	// this is only used to write decrypted data into our tmp
	async writeDataFile(file: DataFile): Promise<string> {
		return await this.tfs.writeToDisk(file.data, "decrypted")
	}

	async writeDataFileToDirectory(file: DataFile, directory: string): Promise<string> {
		const filePath = path.join(directory, file.name)
		await this.fs.promises.writeFile(filePath, file.data)
		return filePath
	}

	// this is used to read unencrypted data from arbitrary locations
	async readDataFile(uriOrPath: FileUri): Promise<DataFile | null> {
		try {
			uriOrPath = url.fileURLToPath(uriOrPath)
		} catch (e) {
			// the thing already was a path, or at least not an URI
		}
		const name = path.basename(uriOrPath)
		try {
			const [data, mimeType] = await Promise.all([this.fs.promises.readFile(uriOrPath), this.getMimeType(uriOrPath)])
			if (data == null) return null
			return {
				_type: "DataFile",
				data,
				name,
				mimeType,
				size: data.length,
				id: undefined,
			}
		} catch (e) {
			return null
		}
	}

	/** select a non-colliding name in the configured downloadPath, preferably with the given file name
	 * public for testing */
	async pickSavePath(filename: string): Promise<string> {
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

	/** public for testing */
	async showInFileExplorer(savePath: string): Promise<void> {
		// See doc for _lastOpenedFileManagerAt on why we do this throttling.
		const lastOpenedFileManagerAt = this.lastOpenedFileManagerAt
		const fileManagerTimeout = await this.conf.getConst(BuildConfigKey.fileManagerTimeout)

		if (lastOpenedFileManagerAt == null || this.dateProvider.now() - lastOpenedFileManagerAt > fileManagerTimeout) {
			this.lastOpenedFileManagerAt = this.dateProvider.now()
			await this.electron.shell.openPath(path.dirname(savePath))
		}
	}
}

export async function getMimeTypeForFile(file: string): Promise<string> {
	const ext = path.extname(file).slice(1)
	const { mimes } = await import("../flat-mimes.js")
	const candidates = mimes[ext]
	// sometimes there are multiple options, but we'll take the first and reorder if issues arise.
	return candidates != null ? candidates[0] : "application/octet-stream"
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

function getHttpHeader(headers: Headers, name: string): string | null {
	// All headers are in lowercase. Lowercase them just to be sure
	return headers.get(name.toLowerCase())
}

function pipeStream(stream: stream.Readable, into: stream.Writable): Promise<void> {
	return new Promise((resolve, reject) => {
		stream.on("error", reject)
		stream.pipe(into)
		into.on("finish", resolve)
		into.on("error", reject)
	})
}

function bodyToReadable(body: ReadableStream<unknown>): stream.Readable {
	// https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542
	return stream.Readable.fromWeb(body)
}
