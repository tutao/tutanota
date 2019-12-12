// @ flow
import type {ElectronSession} from 'electron'
import {app, dialog, shell} from "electron"
import type {DesktopConfigHandler} from "./DesktopConfigHandler"
import path from "path"
import DesktopUtils from "./DesktopUtils"
import fs from "fs-extra"
import {noOp} from "../api/common/utils/Utils"
import {lang} from "../misc/LanguageViewModel"
import type {DesktopNetworkClient} from "./DesktopNetworkClient"

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
			this._net.request(sourceUrl, {
				method: "GET",
				headers,
				timeout: 20000
			}).on('response', res => {
				let resData = Buffer.alloc(0, 0, 'binary')
				resData.fill(0)
				res
					.on('data', data => {
						resData = Buffer.concat([resData, data])
					})
					.on('end', () => {
						const encryptedFileUri = path.join(app.getPath('temp'), '/tuta/', fileName)
						console.warn('writing to ', encryptedFileUri)
						fs.mkdirp(app.getPath('temp') + '/tuta/')
						  .then(() => fs.writeFile(encryptedFileUri, resData, {encoding: 'binary'}))
						  .then(() => resolve({
							  statusCode: res.statusCode,
							  statusMessage: res.statusMessage,
							  encryptedFileUri
						  }))
					})
					.on('error', e => reject(e))
			}).end()
		})
	}

	_handleDownloadItem(ev: Event, item: DownloadItem): void {
		if (this._conf.getDesktopConfig('defaultDownloadPath')) {
			try {
				const fileName = path.basename(item.getFilename())
				const savePath = path.join(
					this._conf.getDesktopConfig('defaultDownloadPath'),
					DesktopUtils.nonClobberingFilename(
						fs.readdirSync(this._conf.getDesktopConfig('defaultDownloadPath')),
						fileName
					)
				)
				// touch file so it is already in the dir the next time sth gets dl'd
				DesktopUtils.touch(savePath)
				item.savePath = savePath

				// if the last dl ended more than 30s ago, open dl dir in file manager
				let fileManagerLock = noOp
				if (this._fileManagersOpen === 0) {
					this._fileManagersOpen = this._fileManagersOpen + 1
					fileManagerLock = () => {
						shell.openItem(path.dirname(savePath))
						setTimeout(() => this._fileManagersOpen = this._fileManagersOpen - 1, this._conf.get("fileManagerTimeout"))
					}
				}

				item.on('done', (event, state) => {
					if (state === 'completed') {
						fileManagerLock()
					}
					if (state === 'interrupted') {
						showDownloadErrorMessageBox('download interrupted', item.getFilename())
					}
				})

			} catch (e) {
				showDownloadErrorMessageBox(e.message, item.getFilename())
			}
		} else {
			// if we do nothing, user will be prompted for destination
		}
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
