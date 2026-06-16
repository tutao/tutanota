import path from "node:path"
import { ElectronExports, FsExports } from "../ElectronExportTypes.js"
import { CryptoFunctions } from "../CryptoFns.js"
import { base64ToBase64Url, uint8ArrayToBase64, uint8ArrayToHex } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { FileNotFoundError } from "../../api/common/error/FileNotFoundError"
import { Readable } from "node:stream"
import fs from "node:fs"
import { size } from "../../../../ui/size"

type TmpSub = "reg" | "encrypted" | "decrypted"

/**
 * wrapper to access the tmp scratch file system used for downloading, uploading, encrypting and decrypting files before
 * putting them into the user's desired location.
 *
 * this currently randomizes file names before uploading files. ideally, we would prevent
 * file name collisions generally by always randomizing any file names written into this temp
 * location - the calling site has the actual file names and uses them for uploading and
 * putting files into the user's download folder.
 * */
export class TempFs {
	private readonly topLevelTempDir = "tutanota"
	/** we store all temporary files in a directory with a random name, so that the download location is not predictable */
	private readonly randomDirectoryName: string

	private inMemoryFiles = new Map<TmpFilename, Uint8Array>()
	private openStreams: Map<string, fs.ReadStream> = new Map()

	constructor(
		private readonly fs: FsExports,
		private readonly electron: ElectronExports,
		private readonly cryptoFunctions: CryptoFunctions,
	) {
		this.randomDirectoryName = base64ToBase64Url(uint8ArrayToBase64(cryptoFunctions.randomBytes(16)))
	}

	clear() {
		const topLvlTmpDir = path.join(this.electron.app.getPath("temp"), this.topLevelTempDir)
		try {
			const tmps = this.fs.readdirSync(topLvlTmpDir)
			for (const tmp of tmps) {
				const tmpSubPath = path.join(topLvlTmpDir, tmp)
				try {
					this.fs.rmSync(tmpSubPath, { recursive: true })
				} catch (e) {
					// ignore if the file was deleted between readdir and delete
					// or if it's not our tmp dir
					if (e.code !== "ENOENT" && e.code !== "EACCES") throw e
				}
			}
		} catch (e) {
			// the tmp dir doesn't exist, everything's fine
			if (e.code !== "ENOENT") throw e
		}
	}

	/**
	 * Get a path to the tutanota temporary directory
	 * the hierarchy is
	 * [electron tmp dir]
	 * [tutanota tmp]
	 *
	 * the directory will be created if it doesn't already exist
	 *
	 * a randomly named subdirectory will be included
	 *
	 * if `noRandomDirectory` then random directory will not be included in the path,
	 * and the whole directory will not be created
	 * @returns {string}
	 */
	getTutanotaTempPath(): string {
		const directory = path.join(this.electron.app.getPath("temp"), this.topLevelTempDir, this.randomDirectoryName)

		// only readable by owner (current user)
		this.fs.mkdirSync(directory, { recursive: true, mode: 0o700 })

		return path.join(directory)
	}

	async acquireSingleInstanceLock(): Promise<boolean> {
		const lockfilePath = this.getLockFilePath()
		// first, put down a file in temp that contains our version.
		// will overwrite if it already exists.
		// errors are ignored and we fall back to a version agnostic single instance lock.
		try {
			await this.fs.promises.writeFile(lockfilePath, this.electron.app.getVersion(), "utf8")
		} catch (e) {
			// ignored!
		}
		// try to get the lock, if there's already an instance running,
		// it will get a message about this.
		return this.electron.app.requestSingleInstanceLock()
	}

	private getLockFilePath() {
		// don't get temp dir path from DesktopDownloadManager because the path returned from there may be deleted at some point,
		// we want to put the lockfile in root tmp so it persists
		return path.join(this.electron.app.getPath("temp"), "tutanota_desktop_lockfile")
	}

	/**
	 * reads the lockfile and then writes the own version into the lockfile
	 * @returns {Promise<boolean>} whether the lock was overridden by another version since the last read
	 */
	async singleInstanceLockOverridden(): Promise<boolean> {
		const lockfilePath = this.getLockFilePath()
		const version = await this.fs.promises.readFile(lockfilePath, "utf8")
		try {
			await this.fs.promises.writeFile(lockfilePath, this.electron.app.getVersion(), "utf8")
			return version !== this.electron.app.getVersion()
		} catch (e) {
			return false
		}
	}

	/**
	 * Writes contents with a random file name into the tmp directory
	 * @param contents the contents of the file to write
	 * @param subfolder the subfolder of the tmp files to write to
	 * @param option the options for write file as encoding and file permissions
	 * @returns path to the written file
	 */
	async writeToDisk(contents: string | Uint8Array, subfolder: TmpSub, option?: { encoding: BufferEncoding; mode: number }): Promise<string> {
		const tmpPath = path.join(this.getTutanotaTempPath(), subfolder)
		await this.fs.promises.mkdir(tmpPath, { recursive: true })

		const filename = this.generateFilename()
		const filePath = path.join(tmpPath, filename)

		await this.fs.promises.writeFile(filePath, contents, option)

		return filePath
	}

	/** removes the given subfolder of our tmp directory with all its contents */
	async clearTmpSub(subFolder: string): Promise<void> {
		const tmpPath = path.join(this.getTutanotaTempPath(), subFolder)
		this.fs.rmSync(tmpPath, { force: true, recursive: true, maxRetries: 3 })
	}

	async ensureEncryptedDir(): Promise<string> {
		const downloadDirectory = this.getEncryptedTempDir()
		await this.fs.promises.mkdir(downloadDirectory, { recursive: true })
		return downloadDirectory
	}

	async ensureUnencrytpedDir(): Promise<string> {
		const downloadDirectory = this.getUnencryptedTempDir()
		await this.fs.promises.mkdir(downloadDirectory, { recursive: true })
		return downloadDirectory
	}

	assertInTmpDir(unresolvedPath: string) {
		const resolvedTarget = path.resolve(unresolvedPath)
		if (!resolvedTarget.startsWith(this.getTutanotaTempPath() + path.sep)) {
			throw new ProgrammingError("Invalid file path: " + unresolvedPath)
		}
	}

	private readInMemoryFile(uri: string): Uint8Array | null {
		const filename = this.uriToName(uri)
		return this.inMemoryFiles.get(filename) ?? null
	}

	createInMemoryFile(content: Uint8Array): `tuta-tmp:${string}` {
		const filename = this.generateFilename()
		this.inMemoryFiles.set(filename, content)
		return this.nameToUri(filename)
	}

	private deleteInMemoryFile(uri: string) {
		const filename = this.uriToName(uri)
		this.inMemoryFiles.delete(filename)
	}

	async deleteFile(uri: string) {
		if (uri.startsWith("tuta-tmp:")) {
			this.deleteInMemoryFile(uri)
		} else if (uri.startsWith("tuta-chunk:")) {
			// no-op
		} else {
			this.assertInTmpDir(uri)
			await this.fs.promises.unlink(uri)
		}
	}

	fileStream(uri: string): Readable {
		if (uri.startsWith("tuta-tmp:")) {
			const data = this.readInMemoryFile(uri)
			if (data == null) {
				throw new FileNotFoundError(uri)
			}
			return new TypedArrayReadableStream(data)
		} else if (uri.startsWith("tuta-stream:")) {
			const fileName = uri.slice("tuta-stream:".length)
			const stream = this.openStreams.get(fileName)
			if (stream == null) {
				throw new FileNotFoundError(uri)
			}
			return stream
		} else {
			this.assertInTmpDir(uri)
			return this.fs.createReadStream(uri)
		}
	}

	async getFileSize(uri: string): Promise<number> {
		if (uri.startsWith("tuta-tmp:")) {
			const data = this.readInMemoryFile(uri)
			if (data == null) {
				throw new FileNotFoundError(uri)
			}
			return data.length
		} else {
			// we only upload encrypted blobs so it should be safe
			return (await this.fs.promises.stat(uri)).size
		}
	}

	closeFileStream(stream: NodeJS.ReadableStream) {
		if (stream instanceof this.fs.ReadStream) {
			stream.close()
		} else {
			// no-op for TypedArrayReadableStream
		}
	}

	private nameToUri(filename: TmpFilename): `tuta-tmp:${string}` {
		return `tuta-tmp:${filename}`
	}

	private uriToName(possibleUri: string): TmpFilename {
		if (!possibleUri.startsWith("tuta-tmp:")) {
			throw new ProgrammingError(`Invalid tmp uri: ${possibleUri}`)
		} else {
			return possibleUri.slice(`tuta-tmp:`.length) as TmpFilename
		}
	}

	public openFileForReading(fileUri: string): string {
		const stream = this.fs.createReadStream(fileUri)
		const fileName = this.generateFilename()
		this.openStreams.set(fileName, stream)
		const uri = `tuta-stream:${fileName}`
		return uri
	}

	public closeFile(streamUri: string) {
		const stream = this.openStreams.get(streamUri)
		stream?.close()
		this.openStreams.delete(streamUri)
	}

	private generateFilename(): TmpFilename {
		return uint8ArrayToHex(this.cryptoFunctions.randomBytes(12)) as TmpFilename
	}

	private getEncryptedTempDir() {
		return path.join(this.getTutanotaTempPath(), "encrypted")
	}

	private getUnencryptedTempDir() {
		return path.join(this.getTutanotaTempPath(), "decrypted")
	}
}

type TmpFilename = string & { readonly __brand: unique symbol }

class TypedArrayReadableStream extends Readable {
	private position: number = 0

	constructor(private readonly array: Uint8Array) {
		super()
	}
	_read(size: number) {
		if (this.position >= this.array.length) {
			this.push(null)
		} else {
			const chunk = this.array.slice(this.position, this.position + size)
			this.position += size
			this.push(chunk)
		}
	}
}

class LimitedReadableStream extends Readable {
	private buffer: { buffer: Buffer; read: number } | null = null
	private readBytes: number = 0
	constructor(
		private readonly upstream: Readable,
		private readonly fileSize: number,
	) {
		super()
	}

	_read(size: number) {
		if (this.readBytes === this.fileSize) {
			if (this.buffer != null) {
				const leftToRead = this.buffer.buffer.length - this.buffer.read
				const newBuffer = Buffer.alloc(Math.min(size, leftToRead))
				this.buffer.buffer.copy(newBuffer, 0, this.buffer.read, newBuffer.length)
				return newBuffer
			} else {
				return null
			}
		}
		const readBuffer = this.upstream.read()
		if (readBuffer && readBuffer.length > size) {
			this.buffer = readBuffer
		}
	}
}
