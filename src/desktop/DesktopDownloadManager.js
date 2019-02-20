// @ flow
import type {ElectronSession} from 'electron'
import {dialog, shell} from "electron"
import {conf} from "./DesktopConfigHandler"
import path from "path"
import DesktopUtils from "./DesktopUtils"
import fs from "fs"
import {noOp} from "../api/common/utils/Utils"
import {lang} from "./DesktopLocalizationProvider"

let fileManagersOpen: number = 0

export function manageDownloadsForSession(session: ElectronSession) {
	session.removeAllListeners('will-download').on('will-download', (ev, item) => {
		if (conf.getDesktopConfig('defaultDownloadPath')) {
			try {
				const fileName = path.basename(item.getFilename())
				const savePath = path.join(
					conf.getDesktopConfig('defaultDownloadPath'),
					DesktopUtils.nonClobberingFileName(
						fs.readdirSync(conf.getDesktopConfig('defaultDownloadPath')),
						fileName
					)
				)
				// touch file so it is already in the dir the next time sth gets dl'd
				fs.closeSync(fs.openSync(savePath, 'w'))
				item.setSavePath(savePath)

				// if the last dl ended more than 30s ago, open dl dir in file manager
				let fileManagerLock = noOp
				if (fileManagersOpen === 0) {
					fileManagersOpen = fileManagersOpen + 1
					fileManagerLock = () => {
						shell.openItem(path.dirname(savePath))
						setTimeout(() => fileManagersOpen = fileManagersOpen - 1, 30000)
					}
				}

				item.on('done', (event, state) => {
					if (state === 'completed') {
						fileManagerLock()
					}
					if (state === 'interrupted') {
						throw new Error('download interrupted')
					}
				})

			} catch (e) {
				dialog.showMessageBox(null, {
					type: 'error',
					buttons: [lang.get('ok_action')],
					defaultId: 0,
					title: lang.get('download_action'),
					message: lang.get('couldNotAttachFile_msg')
						+ '\n'
						+ item.getFilename()
						+ '\n'
						+ e.message
				})
			}
		} else {
			// if we do nothing, user will be prompted for destination
		}
	})
}