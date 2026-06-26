import { default as stream, Readable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import {
	CommonNativeFacade,
	DirectoryContents,
	DownloadTaskResponse,
	FileFacade,
	IpcClientRect,
	UploadTaskResponse,
} from "@tutao/native-bridge/generatedIpc/types"
import { FileUri } from "../../../../app-kit/native-bridge/common/FileApp.js"
import { ElectronExports, FsExports, PathExports } from "../ElectronExportTypes.js"
import path from "node:path"
import { ApplicationWindow } from "../ApplicationWindow.js"
import { assertNotNull, DateProvider, first, newPromise, promiseFilter, throttle, uint8ArrayToBase64 } from "@tutao/utils"
import { looksExecutable, nonClobberingFilename } from "../PathUtils.js"
import { fileURLToPath, pathToFileURL } from "node:url"
import FsModule, { WriteStream } from "node:fs"
import { Buffer } from "node:buffer"
import { ReadableStream } from "node:stream/web"
import { FileOpenError } from "../../api/common/error/FileOpenError.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { log } from "../DesktopLog.js"
import { BuildConfigKey, CancelledError, DesktopConfigKey, ProgrammingError } from "@tutao/app-env"
import { DesktopConfig } from "../config/DesktopConfig.js"
import { TempFs } from "./TempFs.js"
import { HttpMethod } from "@tutao/rest-client/types"
import { FetchImpl } from "../net/NetAgent"
import { OpenDialogOptions } from "electron"
import { CommandExecutor } from "../CommandExecutor"
import { DataFile } from "../../../../entities/tutanota/MailBundle"
import { createHash } from "node:crypto"
import { fileUrlFromString } from "./fileUtils"

const TAG = "[DesktopFileFacade]"

export class DesktopFileFacade implements FileFacade {
	/** We don't want to spam opening file manager all the time so we throttle it. This field is set to the last time we opened it. */
	private lastOpenedFileManagerAt: number | null
	private activeRequests: Map<string, AbortController> = new Map()

	constructor(
		private readonly win: ApplicationWindow,
		private readonly conf: DesktopConfig,
		private readonly dateProvider: DateProvider,
		private readonly fetch: FetchImpl,
		private readonly electron: ElectronExports,
		private readonly tfs: TempFs,
		private readonly fs: FsExports,
		private readonly path: PathExports,
		private readonly commandExecutor: CommandExecutor,
		private readonly process: NodeJS.Process,
		private readonly progressTracker: Pick<CommonNativeFacade, "downloadProgress" | "uploadProgress">,
	) {
		this.lastOpenedFileManagerAt = null
	}

	clearFileData(): Promise<void> {
		this.tfs.clear()
		return Promise.resolve()
	}

	async deleteFile(filePath: string): Promise<void> {
		await this.tfs.deleteFile(filePath)
	}

	private async deleteFileQuietly(filePath: string): Promise<void> {
		try {
			await this.fs.promises.unlink(filePath)
		} catch (e) {
			if (e.code !== "ENOENT") {
				throw e
			}
		}
	}

	async download(sourceUrl: string, fileName: string, headers: Record<string, string>, fileId: string): Promise<DownloadTaskResponse> {
		const abortController = new AbortController()
		this.activeRequests.set(fileId, abortController)
		try {
			const { status, headers: headersIncoming, body } = await this.fetch(sourceUrl, { method: "GET", headers, signal: abortController.signal })

			let encryptedFileUrl: URL | null
			if (status === 200 && body != null) {
				const downloadDirectory = await this.tfs.ensureEncryptedDir()
				encryptedFileUrl = pathToFileURL(path.join(downloadDirectory, fileName))
				const readable: stream.Readable = bodyToReadable(body)
				// debounce so that we don't post the message too often
				const onProgress = throttle(100, (bytes: number) => {
					this.progressTracker.downloadProgress(fileId, bytes)
				})
				await this.pipeIntoFile(readable, encryptedFileUrl, onProgress)
			} else {
				encryptedFileUrl = null
			}

			const result = {
				statusCode: status,
				encryptedFileUri: encryptedFileUrl?.toString() ?? null,
				errorId: getHttpHeader(headersIncoming, "error-id"),
				precondition: getHttpHeader(headersIncoming, "precondition"),
				suspensionTime: getHttpHeader(headersIncoming, "suspension-time") ?? getHttpHeader(headersIncoming, "retry-after"),
			}

			log.info(TAG, "Download finished", result.statusCode, result.suspensionTime)

			return result
		} finally {
			this.activeRequests.delete(fileId)
		}
	}

	async abortDownload(fileId: string) {
		this.activeRequests.get(fileId)?.abort(new CancelledError("Request canceled"))
	}

	private async pipeIntoFile(response: stream.Readable, encryptedFileURL: URL, progress: (bytes: number) => unknown) {
		const fileStream: WriteStream = this.fs.createWriteStream(encryptedFileURL, { emitClose: true })
		try {
			await pipeline(
				response,
				async function* (source) {
					let downloadedBytes = 0
					for await (const chunk of source) {
						downloadedBytes += chunk.length
						progress(downloadedBytes)
						yield chunk
					}
				},
				fileStream,
			)
		} catch (e) {
			await this.fs.promises.unlink(encryptedFileURL)
			throw e
		}
	}

	/** can be used with arbitrary paths, is run on the selected file locations before the files are read */
	async getMimeType(filePath: string): Promise<string> {
		return await getMimeTypeForFile(fileUrlFromString(filePath))
	}

	/** can be used with arbitrary paths, is run on the selected file locations before the files are read */
	async getName(filePath: string): Promise<string> {
		return path.basename(fileURLToPath(filePath))
	}

	/** can be used with arbitrary paths, is run on the selected file locations before the files are read */
	async getSize(filePath: string): Promise<number> {
		return this.tfs.getFileSize(filePath)
	}

	async hashFile(filePath: string): Promise<string> {
		const fileStream = this.tfs.fileStream(filePath)
		try {
			const hash = createHash("sha256")
			await pipeline(fileStream, hash)
			const checksum = hash.digest().subarray(0, 6)
			return uint8ArrayToBase64(checksum)
		} finally {
			this.tfs.closeFileStream(fileStream)
		}
	}

	async joinFiles(filename: string, files: Array<string>): Promise<string> {
		const downloadDirectory = await this.tfs.ensureUnencrytpedDir()

		const filesInDirectory = await this.fs.promises.readdir(downloadDirectory)
		const newFilename = nonClobberingFilename(filesInDirectory, filename)
		const filePath = path.join(downloadDirectory, newFilename)
		const outStream = this.fs.createWriteStream(filePath, { autoClose: false })

		try {
			for (const infile of files) {
				const inFileUrl = this.tfs.assertInTmpDir(infile)
				const readStream = this.fs.createReadStream(inFileUrl)
				try {
					await newPromise<void>((resolve, reject) => {
						readStream.on("end", resolve)
						readStream.on("error", reject)
						readStream.pipe(outStream, { end: false })
					})
				} finally {
					readStream.close()
				}
				await this.fs.promises.unlink(inFileUrl)
			}

			await closeFileStream(outStream)
		} catch (e) {
			// clean up if we couldn't finish writing
			await closeFileStream(outStream)

			// The file might not exist yet if we didn't get to write anything,
			// so let's delete it if it exists.
			await this.deleteFileQuietly(filePath)
			throw e
		}

		return pathToFileURL(filePath).toString()
	}

	async open(fileUrl: string /* , mimeType: string omitted */): Promise<void> {
		this.tfs.assertInTmpDir(fileUrl)
		const filePath = fileURLToPath(fileUrl)
		const openWithElectronShell = () =>
			this.electron.shell
				.openPath(filePath) // may resolve with "" or an error message
				.catch((e) => {
					const message = "failed to open path." + e
					throw new FileOpenError("Could not open " + fileUrl + ", " + message)
				})

		// only windows will happily execute a just downloaded program
		if (this.process.platform === "win32" && looksExecutable(filePath)) {
			const { response } = await this.electron.dialog.showMessageBox({
				type: "warning",
				buttons: [lang.get("yes_label"), lang.get("no_label")],
				title: lang.get("executableOpen_label"),
				message: lang.get("executableOpen_msg"),
				defaultId: 1, // default button
			})
			if (response === 0) {
				await openWithElectronShell()
			}
		} else if (this.process.platform === "linux") {
			// temporary fix for the electron fix:
			// https://github.com/electron/electron/issues/45129#issuecomment-3334644846
			// https://github.com/tutao/tutanota/issues/9696
			await this.commandExecutor
				.run({
					executable: "xdg-open",
					args: [filePath],
					env:
						// electron replaces XDG_CURRENT_DESKTOP in some cases which breaks gio open which breaks xdg-open
						this.process.env.ORIGINAL_XDG_CURRENT_DESKTOP == null
							? undefined
							: {
									...this.process.env,
									XDG_CURRENT_DESKTOP: this.process.env.ORIGINAL_XDG_CURRENT_DESKTOP,
								},
				})
				.catch((e) => {
					throw new FileOpenError("Could not open " + fileUrl + ", " + e)
				})
		} else {
			await openWithElectronShell()
		}
	}

	async openFileChooser(_boundingRect: IpcClientRect, filter: ReadonlyArray<string> | null): Promise<Array<string>> {
		const opts: OpenDialogOptions = { properties: ["openFile", "multiSelections"] }
		if (filter != null) {
			opts.filters = [{ name: "Filter", extensions: filter.slice() }]
		}
		const { filePaths } = await this.electron.dialog.showOpenDialog(this.win._browserWindow, opts)
		// File pickers are odd and sometimes allow choosing directories or other files instead
		const onlyFilePaths = await promiseFilter(filePaths, async (f) => (await this.fs.promises.stat(f)).isFile())
		return onlyFilePaths.map((path) => pathToFileURL(path).toString())
	}

	async openFolderChooser(): Promise<string | null> {
		const { filePaths } = await this.electron.dialog.showOpenDialog(this.win._browserWindow, {
			properties: ["openDirectory"],
		})
		const firstPath = first(filePaths)
		if (firstPath && (await this.fs.promises.stat(firstPath)).isDirectory()) {
			return pathToFileURL(firstPath).toString()
		} else {
			return null
		}
	}

	/**
	 * Opens OS file picker for selecting either a file or a folder. The options "openDirectory", "openFile" simultaneously are only supported on macOS
	 * This is needed because Apple Mail uses a custom MBOX when format when exporting, which is a directory and not a file.
	 */
	async openMacImportFileChooser(): Promise<Array<string>> {
		const opts: OpenDialogOptions = { properties: ["openDirectory", "openFile", "multiSelections"] }
		opts.filters = [{ name: "Filter", extensions: ["eml", "mbox"].slice() }]
		const { filePaths } = await this.electron.dialog.showOpenDialog(this.win._browserWindow, opts)
		return filePaths.map((path) => pathToFileURL(path).toString())
	}

	async putFileIntoDownloadsFolder(localFileUri: string, fileNameToUse: string): Promise<string> {
		const url = this.tfs.assertInTmpDir(localFileUri)
		const savedFileUrl = await this.pickSavePath(fileNameToUse)
		await this.fs.promises.mkdir(path.dirname(fileURLToPath(savedFileUrl)), {
			recursive: true,
		})
		await this.fs.promises.copyFile(url, savedFileUrl)
		await this.showInFileExplorer(savedFileUrl)
		return savedFileUrl.toString()
	}

	async upload(fileUri: string, targetUrl: string, method: HttpMethod, headers: Record<string, string>, fileId: string): Promise<UploadTaskResponse> {
		const size = await this.tfs.getFileSize(fileUri)
		headers["Content-Length"] = `${size}`

		const abortController = new AbortController()
		this.activeRequests.set(fileId, abortController)

		const onProgress = throttle(100, (bytes) => {
			this.progressTracker.uploadProgress(fileId, bytes)
		})

		const fileStream: NodeJS.ReadableStream = this.tfs.fileStream(fileUri)
		const progressStream = wrapReadableAsCountable(fileStream, onProgress)

		try {
			const response = await this.fetch(targetUrl, { method, headers, body: progressStream, signal: abortController.signal })

			let responseBody: Uint8Array
			if ((response.status === 200 || response.status === 201) && response.body != null) {
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
		} finally {
			this.tfs.closeFileStream(fileStream)
			this.activeRequests.delete(fileId)
		}
	}

	async abortUpload(fileId: string): Promise<void> {
		log.info(TAG, `Abort upload for fileId ${fileId}`)
		this.activeRequests.get(fileId)?.abort(new CancelledError("Upload canceled"))
	}

	// this is only used to write decrypted data into our tmp
	async writeTempDataFile(file: DataFile): Promise<string> {
		return await this.tfs.writeToDisk(file.data, "decrypted")
	}

	// This write data to app dir and return full path
	async writeToAppDir(fileConent: Uint8Array, fileName: string): Promise<void> {
		const fullPath = this.path.join(this.electron.app.getPath("userData"), fileName)
		this.assertPathWithinUserData(fullPath)
		this.fs.writeFileSync(fullPath, fileConent)
	}

	async readFromAppDir(fileName: string): Promise<Uint8Array> {
		const fullPath = this.path.join(this.electron.app.getPath("userData"), fileName)
		this.assertPathWithinUserData(fullPath)
		return this.fs.readFileSync(fullPath)
	}

	async deleteFromAppDir(fileName: string): Promise<void> {
		const userDataDir = this.electron.app.getPath("userData")

		const resolvedTarget = this.path.resolve(userDataDir, fileName)
		this.assertPathWithinUserData(resolvedTarget)

		try {
			await this.fs.promises.unlink(resolvedTarget)
		} catch (e) {
			// ignore the error if the file does not exist
		}
	}

	/** this is used to read unencrypted data from arbitrary locations */
	async readDataFile(fileUri: FileUri): Promise<DataFile | null> {
		const url = fileUrlFromString(fileUri)
		const name = path.basename(fileURLToPath(fileUri))
		try {
			const [data, mimeType] = await Promise.all([
				this.fs.promises.readFile(fileUri),
				// freestanding function doesn't have the checks
				getMimeTypeForFile(url),
			])
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

	async readDirectory(dirUrlString: string): Promise<DirectoryContents> {
		const dirPath = fileURLToPath(dirUrlString)
		const children = await this.fs.promises.readdir(dirUrlString, { withFileTypes: true })
		const files = children.filter((f) => f.isFile()).map((f) => pathToFileURL(this.path.join(dirPath, f.name)).toString())
		const folders = children.filter((f) => f.isDirectory()).map((f) => pathToFileURL(this.path.join(dirPath, f.name)).toString())
		const name = this.path.basename(dirPath)
		return {
			name,
			files: files,
			path: dirUrlString,
			folders: folders,
		}
	}
	async openFileForReading(fileUri: string): Promise<string> {
		return this.tfs.openFileForReading(fileUri)
	}

	async closeFile(streamUri: string): Promise<void> {
		this.tfs.closeFile(streamUri)
	}

	async readChunk(streamUri: string, maxChunkSize: number): Promise<string | null> {
		const stream = this.tfs.fileStream(streamUri)
		if (stream.closed) {
			return null
		}
		const buffer = await readStreamToBuffer(stream, maxChunkSize)
		return this.tfs.createInMemoryFile(buffer)
	}

	/**
	 * Select a non-colliding name in the configured downloadPath, preferably with the given file name
	 * public for testing
	 */
	private async pickSavePath(filename: string): Promise<URL> {
		const defaultDownloadPath = await this.conf.getVar(DesktopConfigKey.defaultDownloadPath)

		if (defaultDownloadPath != null) {
			const fileName = path.basename(filename)
			const destinationPath = path.join(defaultDownloadPath, nonClobberingFilename(await this.fs.promises.readdir(defaultDownloadPath), fileName))
			return pathToFileURL(destinationPath)
		} else {
			const { canceled, filePath } = await this.electron.dialog.showSaveDialog({
				defaultPath: path.join(this.electron.app.getPath("downloads"), filename),
			})

			if (canceled) {
				throw new CancelledError("Path selection cancelled")
			} else {
				return pathToFileURL(filePath)
			}
		}
	}

	/** public for testing */
	async showInFileExplorer(fileUrl: URL): Promise<void> {
		// See doc for _lastOpenedFileManagerAt on why we do this throttling.
		const lastOpenedFileManagerAt = this.lastOpenedFileManagerAt
		const fileManagerTimeout = await this.conf.getConst(BuildConfigKey.fileManagerTimeout)

		if (lastOpenedFileManagerAt == null || this.dateProvider.now() - lastOpenedFileManagerAt > fileManagerTimeout) {
			this.lastOpenedFileManagerAt = this.dateProvider.now()
			this.electron.shell.showItemInFolder(fileURLToPath(fileUrl))
		}
	}
	/** can be used with arbitrary paths, is run on the selected file locations before the files are read */
	private assertPathWithinUserData(unresolvedPath: string): void {
		const resolvedBase = this.electron.app.getPath("userData")
		const resolvedTarget = path.resolve(unresolvedPath)
		if (!resolvedTarget.startsWith(resolvedBase + this.path.sep)) {
			throw new ProgrammingError("Invalid file path: " + unresolvedPath)
		}
	}
}

export async function getMimeTypeForFile(url: URL): Promise<string> {
	const ext = path.extname(fileURLToPath(url)).slice(1).toLowerCase() // remove the dot and normalize
	const { extensionToMimeType } = await import("../flat-mimes.js")
	const candidates = extensionToMimeType[ext]
	// sometimes there are multiple options, but we'll take the first and reorder if issues arise.
	return candidates != null ? candidates[0] : "application/octet-stream"
}

function closeFileStream(stream: FsModule.WriteStream): Promise<void> {
	return newPromise((resolve) => {
		stream.on("close", resolve)
		stream.close()
	})
}

export async function readStreamToBuffer(stream: NodeJS.ReadableStream, upToBytes?: number): Promise<Uint8Array> {
	const CHUNK_SIZE = 1024 * 1024
	return newPromise((resolve, reject) => {
		// stream will give us data in whatever chunks it pleases so we need to assemble them manually
		const data: Buffer[] = []
		let readSize = 0
		stream.on("readable", () => {
			// read() will return null if there's no data immediately available
			// if there is less than chunkSize data left it will return all the remaining data and dispatch "end"
			// on the last chunk that we want to read there might be less than CHUNK_SIZE data available
			while (true) {
				const bytesToRead = upToBytes != null ? Math.min(upToBytes - readSize, CHUNK_SIZE) : CHUNK_SIZE
				const chunk = stream.read(bytesToRead) as Buffer | null
				if (chunk == null) break

				data.push(chunk)
				readSize += chunk.length
				// if we already read the amount of data that we wanted then we need to stop immediately
				if (upToBytes && readSize === upToBytes) {
					resolve(Buffer.concat(data))
					stream.removeAllListeners("readable")
					stream.removeAllListeners("end")
					stream.removeAllListeners("error")
					break
				}
			}
		})

		stream.on("end", () => {
			// there's no more data left in the stream
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

function bodyToReadable(body: ReadableStream<unknown>): stream.Readable {
	// https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542
	return stream.Readable.fromWeb(body)
}

/**
 * Make a new Readable stream that counts the data read from the upstream {@param upstream} and invokes
 * {@param onProgress} for every chunk read.
 */
function wrapReadableAsCountable(upstream: NodeJS.ReadableStream, onProgress: (bytes: number) => void): Readable {
	let writtenBytes = 0
	const progressStream: Transform = new Transform({
		transform(chunk, _encoding, callback) {
			writtenBytes += chunk.length
			onProgress(writtenBytes)
			callback(null, chunk)
		},
	})
	upstream.pipe(progressStream)
	return progressStream
}
