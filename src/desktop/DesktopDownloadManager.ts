import type {Session} from "electron"
import type {DesktopConfig} from "./config/DesktopConfig"
import path from "path"
import {assertNotNull, noOp} from "@tutao/tutanota-utils"
import {lang} from "../misc/LanguageViewModel"
import type {DesktopNetworkClient} from "./DesktopNetworkClient"
import {FileOpenError} from "../api/common/error/FileOpenError"
import {log} from "./DesktopLog"
import {looksExecutable, nonClobberingFilename} from "./PathUtils"
import type {DesktopUtils} from "./DesktopUtils"
import type * as FsModule from "fs"
import type {DateProvider} from "../calendar/date/CalendarUtils"
import {CancelledError} from "../api/common/error/CancelledError"
import {BuildConfigKey, DesktopConfigKey} from "./config/ConfigKeys";
import {WriteStream} from "fs-extra"

type FsExports = typeof FsModule
type ElectronExports = typeof Electron.CrossProcessExports

const TAG = "[DownloadManager]"
type DownloadNativeResult = {
	statusCode: string
	statusMessage: string
	encryptedFileUri: string
};

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

	async downloadNative(
		sourceUrl: string,
		fileName: string,
		headers: {
			v: string
			accessToken: string
		},
	): Promise<DownloadNativeResult> {
		return new Promise(async (resolve: (_: DownloadNativeResult) => void, reject) => {
			const downloadDirectory = await this.getTutanotaTempDirectory("download")
			const encryptedFileUri = path.join(downloadDirectory, fileName)

			const fileStream: WriteStream = this._fs
				.createWriteStream(encryptedFileUri, {
					emitClose: true,
				})
				.on("finish", () => fileStream.close())

			// .end() was called, contents is flushed -> release file desc
			let cleanup = (e: Error) => {
				cleanup = noOp
				fileStream
					.removeAllListeners("close")
					.on("close", () => {
						// file descriptor was released
						fileStream.removeAllListeners("close")

						// remove file if it was already created
						this._fs.promises
							.unlink(encryptedFileUri)
							.catch(noOp)
							.then(() => reject(e))
					})
					.end() // {end: true} doesn't work when response errors
			}

			this._net
				.request(sourceUrl, {
					method: "GET",
					timeout: 20000,
					headers,
				})
				.on("response", response => {
					response.on("error", cleanup)

					if (response.statusCode !== 200) {
						// causes 'error' event
						response.destroy(new Error('' + response.statusCode))
						return
					}

					response.pipe(fileStream, {
						end: true,
					}) // automatically .end() fileStream when dl is done

					const result: DownloadNativeResult = {
						statusCode: response.statusCode.toString(),
						statusMessage: response.statusMessage?.toString() ?? "",
						encryptedFileUri,
					}
					fileStream.on("close", () => resolve(result))
				})
				.on("error", cleanup)
				.end()
		})
	}

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

	async saveBlob(filename: string, data: Uint8Array): Promise<void> {
		const savePath = await this._pickSavePath(filename)
		await this._fs.promises.mkdir(path.dirname(savePath), {
			recursive: true,
		})
		await this._fs.promises.writeFile(savePath, data)
		// See doc for _lastOpenedFileManagerAt on why we do this throttling.
		const lastOpenedFileManagerAt = this._lastOpenedFileManagerAt
		const fileManagerTimeout = await this._conf.getConst(BuildConfigKey.fileManagerTimeout)

		if (lastOpenedFileManagerAt == null || this._dateProvider.now() - lastOpenedFileManagerAt > fileManagerTimeout) {
			this._lastOpenedFileManagerAt = this._dateProvider.now()
			await this._electron.shell.openPath(path.dirname(savePath))
		}
	}

	async _pickSavePath(filename: string): Promise<string> {
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
	 * @returns {Promise<string>}
	 * @param subdirs
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
}