// @ flow
import type {ElectronSession} from 'electron'
import {app, dialog, shell} from "electron"
import type {DesktopConfigHandler} from "./config/DesktopConfigHandler"
import path from "path"
import DesktopUtils from "./DesktopUtils"
import fs from "fs-extra"
import {noOp} from "../api/common/utils/Utils"
import {lang} from "../misc/LanguageViewModel"
import type {DesktopNetworkClient} from "./DesktopNetworkClient"
import {FileOpenError} from "../api/common/error/FileOpenError"
import {EventEmitter} from 'events'

export class DesktopDownloadManager {
	_conf: DesktopConfigHandler;
	_net: DesktopNetworkClient;
	_fileManagersOpen: number;

	constructor(conf: DesktopConfigHandler, net: DesktopNetworkClient) {
		this._conf = conf
		this._net = net
		this._fileManagersOpen = 0
	}

	manageDownloadsForSession(session: ElectronSession) {
		session.removeAllListeners('will-download').on('will-download', (ev, item) => this._handleDownloadItem(ev, item))
	}

	downloadNative(sourceUrl: string, fileName: string, headers: {v: string, accessToken: string}): Promise<{statusCode: string, statusMessage: string, encryptedFileUri: string}> {
		return new Promise((resolve, reject) => {
			fs.mkdirp(app.getPath('temp') + '/tuta/')
			const encryptedFileUri = path.join(app.getPath('temp'), '/tuta/', fileName)
			this._net.request(sourceUrl, {
				method: "GET",
				headers,
				timeout: 20000
			}).on('response', res => {
				let fileStream = fs.createWriteStream(encryptedFileUri)
				res.pipe(fileStream)
				fileStream.on('finish', () => {
					fileStream.close(() => resolve({
						statusCode: res.statusCode,
						statusMessage: res.statusMessage,
						encryptedFileUri
					}))
				})
			}).on('error', e => {
				fs.unlink(encryptedFileUri)
				reject(e)
			}).end()
		})
	}

	open(itemPath: string): Promise<void> {
		const tryOpen = () => {
			if (shell.openItem(itemPath)) {
				return Promise.resolve()
			} else {
				return Promise.reject(new FileOpenError("Could not open " + itemPath))
			}
		}
		if (DesktopUtils.looksExecutable(itemPath)) {
			return dialog.showMessageBox(null, {
				type: "warning",
				buttons: [lang.get("yes_label"), lang.get("no_label")],
				title: lang.get("executableOpen_label"),
				message: lang.get("executableOpen_msg")
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
			if (!canceled) return fs.writeFile(filePath, data)
			return Promise.reject('canceled')
		}

		const downloadItem = new EventEmitter()
		downloadItem["savePath"] = null
		downloadItem["getFilename"] = () => filename
		this._handleDownloadItem("saveBlob", downloadItem)
		const writePromise = downloadItem.savePath
			? write({canceled: false, filePath: downloadItem.savePath})
			: dialog.showSaveDialog(win.browserWindow, {defaultPath: path.join(app.getPath('downloads'), filename)})
			        .then(write)
		return writePromise.then(() => downloadItem.emit('done', undefined, 'completed'))
		                   .catch(e => downloadItem.emit('done', e, 'cancelled'))
	}


	_handleDownloadItem(ev: Event, item: DownloadItem): void {
		const defaultDownloadPath = this._conf.getDesktopConfig('defaultDownloadPath')
		// if the last dl ended more than 30s ago, open dl dir in file manager
		let fileManagerLock = noOp
		if (defaultDownloadPath && fs.existsSync(defaultDownloadPath)) {
			try {
				const fileName = path.basename(item.getFilename())
				const savePath = path.join(
					defaultDownloadPath,
					DesktopUtils.nonClobberingFilename(
						fs.readdirSync(defaultDownloadPath),
						fileName
					)
				)
				// touch file so it is already in the dir the next time sth gets dl'd
				DesktopUtils.touch(savePath)
				item.savePath = savePath

				if (this._fileManagersOpen === 0) {
					this._fileManagersOpen = this._fileManagersOpen + 1
					fileManagerLock = () => {
						shell.openItem(path.dirname(savePath))
						setTimeout(() => this._fileManagersOpen = this._fileManagersOpen - 1, this._conf.get("fileManagerTimeout"))
					}
				}
			} catch (e) {
				console.error("error while downloading", e)
				showDownloadErrorMessageBox(e.message, item.getFilename())
			}
		}

		item.on('done', (event, state) => {
			if (state === 'completed') {
				console.log("download complete:", item.getFilename())
				fileManagerLock()
			}
			if (state === 'interrupted') {
				console.error("download interrupted", event)
				showDownloadErrorMessageBox('download interrupted', item.getFilename())
			}
			if (state === 'cancelled') {
				console.log("download cancelled", item.getFilename())
			}
		})
	}
}

function showDownloadErrorMessageBox(message: string, filename: string) {
	dialog.showMessageBox(null, {
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
