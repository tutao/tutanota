// @ flow
import type {ElectronSession} from 'electron'
import {dialog, shell} from "electron"
import type {DesktopConfigHandler} from "./DesktopConfigHandler"
import path from "path"
import DesktopUtils from "./DesktopUtils"
import fs from "fs"
import {noOp} from "../api/common/utils/Utils"
import {lang} from "./DesktopLocalizationProvider"

export class DesktopDownloadManager {
    _conf: DesktopConfigHandler;
    _fileManagersOpen: number;

    constructor(conf: DesktopConfigHandler) {
        this._conf = conf
        this._fileManagersOpen = 0
    }

    manageDownloadsForSession(session: ElectronSession) {
        session.removeAllListeners('will-download').on('will-download', (ev, item) => {
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
                    fs.closeSync(fs.openSync(savePath, 'w'))
                    item.setSavePath(savePath)

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
