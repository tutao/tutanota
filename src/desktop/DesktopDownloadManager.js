// @flow
import type {ElectronSession} from 'electron'
import type {DesktopConfig} from "./config/DesktopConfig"
import path from "path"
import {assertNotNull, downcast, noOp} from "@tutao/tutanota-utils"
import {lang} from "../misc/LanguageViewModel"
import type {DesktopNetworkClient} from "./DesktopNetworkClient"
import {FileOpenError} from "../api/common/error/FileOpenError"
import {log} from "./DesktopLog";
import {looksExecutable, nonClobberingFilename} from "./PathUtils"
import type {DesktopUtils} from "./DesktopUtils"
import {promises as fs} from "fs"
import type {DateProvider} from "../calendar/date/CalendarUtils"
import {CancelledError} from "../api/common/error/CancelledError"

const TAG = "[DownloadManager]"

export class DesktopDownloadManager {
	_conf: DesktopConfig;
	_net: DesktopNetworkClient;
	_dateProvider: DateProvider;
	/** We don't want to spam opening file manager all the time so we throttle it. This field is set to the last time we opened it. */
	_lastOpenedFileManagerAt: ?number;
	_desktopUtils: DesktopUtils;
	_fs: $Exports<"fs">;
	_electron: $Exports<"electron">

	constructor(
		conf: DesktopConfig,
		net: DesktopNetworkClient,
		desktopUtils: DesktopUtils,
		dateProvider: DateProvider,
		fs: $Exports<"fs">,
		electron: $Exports<"electron">
	) {
		this._conf = conf
		this._net = net
		this._dateProvider = dateProvider
		this._lastOpenedFileManagerAt = null
		this._desktopUtils = desktopUtils
		this._fs = fs
		this._electron = electron
	}

	manageDownloadsForSession(session: ElectronSession, dictUrl: string) {
		dictUrl = dictUrl + "/dictionaries/"
		log.debug(TAG, "getting dictionaries from:", dictUrl)
		session.setSpellCheckerDictionaryDownloadURL(dictUrl)
		session.removeAllListeners('spellcheck-dictionary-download-failure')
		       .on("spellcheck-dictionary-initialized", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-initialized", lcode))
		       .on("spellcheck-dictionary-download-begin", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-begin", lcode))
		       .on("spellcheck-dictionary-download-success", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-success", lcode))
		       .on("spellcheck-dictionary-download-failure", (ev, lcode) => log.debug(TAG, "spellcheck-dictionary-download-failure", lcode))
	}

	async downloadNative(sourceUrl: string, fileName: string, headers: {|v: string, accessToken: string|}): Promise<{statusCode: string, statusMessage: string, encryptedFileUri: string}> {
		return new Promise(async (resolve, reject) => {
			const downloadDirectory = await this.getTutanotaTempDirectory("download")
			const encryptedFileUri = path.join(downloadDirectory, fileName)
			const fileStream = this._fs.createWriteStream(encryptedFileUri, {emitClose: true})
			                       .on('finish', () => fileStream.close()) // .end() was called, contents is flushed -> release file desc
			let cleanup = e => {
				cleanup = noOp
				fileStream.removeAllListeners('close').on('close', () => { // file descriptor was released
					fileStream.removeAllListeners('close')
					// remove file if it was already created
					this._fs.promises.unlink(encryptedFileUri).catch(noOp).then(() => reject(e))
				}).end() // {end: true} doesn't work when response errors
			}
			this._net.request(sourceUrl, {method: "GET", timeout: 20000, headers})
			    .on('response', response => {
				    response.on('error', cleanup)
				    if (response.statusCode !== 200) {
					    // causes 'error' event
					    response.destroy(response.statusCode)
					    return
				    }
				    response.pipe(fileStream, {end: true}) // automatically .end() fileStream when dl is done
				    const result = {
					    statusCode: response.statusCode,
					    statusMessage: response.statusMessage,
					    encryptedFileUri
				    }
				    fileStream.on('close', () => resolve(result))
			    }).on('error', cleanup).end()
		})
	}

	open(itemPath: string): Promise<void> {
		const tryOpen = () => this._electron.shell
		                          .openPath(itemPath) // may resolve with "" or an error message
		                          .catch(() => 'failed to open path.')
		                          .then(errMsg => errMsg === ''
			                          ? Promise.resolve()
			                          : Promise.reject(new FileOpenError("Could not open " + itemPath + ", " + errMsg))
		                          )
		if (looksExecutable(itemPath)) {
			return this._electron.dialog.showMessageBox(null, {
				type: "warning",
				buttons: [lang.get("yes_label"), lang.get("no_label")],
				title: lang.get("executableOpen_label"),
				message: lang.get("executableOpen_msg"),
				defaultId: 1, // default button
			}).then(({response}) => {
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
		await this._fs.promises.mkdir(path.dirname(savePath), {recursive: true})
		await this._fs.promises.writeFile(savePath, data)

		// See doc for _lastOpenedFileManagerAt on why we do this throttling.
		const lastOpenedFileManagerAt = this._lastOpenedFileManagerAt
		const fileManagerTimeout = await this._conf.getConst("fileManagerTimeout")
		if (lastOpenedFileManagerAt == null || this._dateProvider.now() - lastOpenedFileManagerAt > fileManagerTimeout) {
			this._lastOpenedFileManagerAt = this._dateProvider.now()
			await this._electron.shell.openPath(path.dirname(savePath))
		}
	}

	async _pickSavePath(filename: string): Promise<string> {
		const defaultDownloadPath = await this._conf.getVar('defaultDownloadPath')
		if (defaultDownloadPath != null) {
			const fileName = path.basename(filename)
			return path.join(
				defaultDownloadPath,
				nonClobberingFilename(
					await this._fs.promises.readdir(defaultDownloadPath),
					fileName
				)
			)
		} else {
			const {canceled, filePath} = await this._electron.dialog.showSaveDialog(null,
				{defaultPath: path.join(this._electron.app.getPath('downloads'), filename)})
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
		await this._fs.promises.mkdir(dirPath, {recursive: true})
		return dirPath
	}

	deleteTutanotaTempDirectory() {
		// TODO Flow doesn't know about the options param, we should update it and then remove this downcast
		// Using sync version because this could get called on app shutdown and it may not complete if async
		downcast(this._fs.rmdirSync)(this._desktopUtils.getTutanotaTempPath(), {recursive: true})
	}
}