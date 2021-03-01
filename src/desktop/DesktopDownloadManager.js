// @flow
import type {ElectronSession} from 'electron'
import type {DesktopConfig} from "./config/DesktopConfig"
import path from "path"
import {assertNotNull, noOp} from "../api/common/utils/Utils"
import {lang} from "../misc/LanguageViewModel"
import type {DesktopNetworkClient} from "./DesktopNetworkClient"
import {FileOpenError} from "../api/common/error/FileOpenError"
import type {ApplicationWindow} from "./ApplicationWindow"
import {EventEmitter} from 'events'
import {log} from "./DesktopLog";
import {looksExecutable, nonClobberingFilename} from "./PathUtils"
import type {DesktopUtils} from "./DesktopUtils"
import type {DownloadItem} from "electron"
import {promises as fs} from "fs"
import type {App} from "electron"


export class DesktopDownloadManager {
	_conf: DesktopConfig;
	_net: DesktopNetworkClient;
	_fileManagersOpen: number;
	_desktopUtils: DesktopUtils;
	_fs: $Exports<"fs">;
	_electron: $Exports<"electron">

	constructor(conf: DesktopConfig, net: DesktopNetworkClient, desktopUtils: DesktopUtils, fs: $Exports<"fs">, electron: $Exports<"electron">) {
		this._conf = conf
		this._net = net
		this._fileManagersOpen = 0
		this._desktopUtils = desktopUtils
		this._fs = fs
		this._electron = electron
	}

	manageDownloadsForSession(session: ElectronSession) {
		session.removeAllListeners('will-download').on('will-download', (ev, item) => this._handleDownloadItem(item))
	}

	async downloadNative(sourceUrl: string, fileName: string, headers: {v: string, accessToken: string}): Promise<{statusCode: string, statusMessage: string, encryptedFileUri: string}> {
		return new Promise(async (resolve, reject) => {
			const downloadDirectory = await getTutanotaTempDirectory(this._electron.app, "download")
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

	saveBlob(filename: string, data: Uint8Array, win: ApplicationWindow): Promise<void> {
		const write = ({canceled, filePath}): Promise<void> => {
			if (!canceled) return this._fs.promises.writeFile(assertNotNull(filePath), data)
			return Promise.reject('canceled')
		}

		const downloadItem: DownloadItem = new EventEmitter()
		downloadItem.getFilename = () => filename

		this._handleDownloadItem(downloadItem)
		const writePromise = downloadItem.savePath
			? write({canceled: false, filePath: downloadItem.savePath})
			: this._electron.dialog.showSaveDialog(win.browserWindow, {defaultPath: path.join(this._electron.app.getPath('downloads'), filename)})
			      .then(write)
		return writePromise.then(() => downloadItem.emit('done', undefined, 'completed'))
		                   .catch(e => {downloadItem.emit('done', e, 'cancelled')})
	}


	_handleDownloadItem(item: DownloadItem): void {
		const defaultDownloadPath = this._conf.getVar('defaultDownloadPath')
		// if the lasBBt dl ended more than 30s ago, open dl dir in file manager
		let fileManagerLock = noOp
		if (defaultDownloadPath && this._fs.existsSync(defaultDownloadPath)) {
			try {
				const fileName = path.basename(item.getFilename())
				const savePath = path.join(
					defaultDownloadPath,
					nonClobberingFilename(
						this._fs.readdirSync(defaultDownloadPath),
						fileName
					)
				)
				// touch file so it is already in the dir the next time sth gets dl'd
				this._desktopUtils.touch(savePath)
				item.savePath = savePath

				if (this._fileManagersOpen === 0) {
					this._fileManagersOpen = this._fileManagersOpen + 1
					fileManagerLock = () => this._electron.shell
					                            .openPath(path.dirname(savePath))
					                            .then(() => {
						                            setTimeout(() => this._fileManagersOpen = this._fileManagersOpen
							                            - 1, this._conf.getConst("fileManagerTimeout"))
					                            }).catch(noOp)

				}
			} catch (e) {
				console.error("error while downloading", e)
				showDownloadErrorMessageBox(this._electron, e.message, item.getFilename())
			}
		}

		item.on('done', (event, state) => {
			if (state === 'completed') {
				fileManagerLock()
			}
			if (state === 'interrupted') {
				console.error("download interrupted", event)
				showDownloadErrorMessageBox(this._electron, 'download interrupted', item.getFilename())
			}
			if (state === 'cancelled') {
				log.debug("download cancelled", item.getFilename())
			}
		})
	}
}

function showDownloadErrorMessageBox(electron: $Exports<"electron">, message: string, filename: string) {
	electron.dialog.showMessageBox(null, {
		type: 'error',
		buttons: [lang.get('ok_action')],
		defaultId: 0,
		title: lang.get('download_action'),
		message: lang.get('couldNotAttachFile_msg')
			+ '\n'
			+ filename
			+ '\n'
			+ message
	})
}

/**
 * Get a directory under tutanota's temporary directory, will create it if it doesn't exist
 * @returns {Promise<string>}
 * @param app
 * @param subdirs
 */
export async function getTutanotaTempDirectory(app: App, ...subdirs: string[]): Promise<string> {
	const dirPath = getTutanotaTempPath(app, ...subdirs)
	await fs.mkdir(dirPath, {recursive: true})
	return dirPath
}

/**
 * Get a path to a directory under tutanota's temporary directory. Will not create if it doesn't exist
 * @param app
 * @param subdirs
 * @returns {string}
 */
export function getTutanotaTempPath(app: App, ...subdirs: string[]): string {
	return path.join(app.getPath("temp"), 'tutanota', ...subdirs)
}