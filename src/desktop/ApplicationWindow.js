// @flow
import {ipc} from './IPC.js'
import type {ElectronPermission} from 'electron'
import {BrowserWindow, dialog, shell, WebContents} from 'electron'
import * as localShortcut from 'electron-localshortcut'
import DesktopUtils from './DesktopUtils.js'
import path from 'path'
import u2f from '../misc/u2f-api.js'
import {tray} from './DesktopTray.js'
import {conf} from './DesktopConfigHandler.js'
import {lang} from './DesktopLocalizationProvider.js'
import fs from 'fs'
import {noOp} from "../api/common/utils/Utils"


const windows: ApplicationWindow[] = []
let fileManagersOpen: number = 0

export class ApplicationWindow {
	_rewroteURL: boolean;
	_startFile: string;
	_browserWindow: BrowserWindow;
	id: number;

	constructor() {
		this._createBrowserWindow()
		this._browserWindow.loadURL(this._startFile)
	}

	show() {
		const contents = this._browserWindow.webContents
		const devToolsState = contents.isDevToolsOpened()
		this._browserWindow.show()
		if (this._browserWindow.isMinimized()) {
			this._browserWindow.restore()
			//TODO: there has to be a better way. fix for #691
			contents.toggleDevTools()
			if (devToolsState) {
				contents.openDevTools()
			} else {
				contents.closeDevTools()
			}
		} else {
			this._browserWindow.focus()
		}
	}

	_createBrowserWindow() {
		this._rewroteURL = false
		let normalizedPath = path.join(__dirname, "..", "..", "desktop.html")
		this._startFile = DesktopUtils.pathToFileURL(normalizedPath)
		console.log("startFile: ", this._startFile)
		this._browserWindow = new BrowserWindow({
			icon: tray.getIcon(),
			show: false,
			width: 1280,
			height: 800,
			autoHideMenuBar: true,
			webPreferences: {
				nodeIntegration: false,
				nodeIntegrationInWorker: false,
				// TODO: not a real os sandbox yet.
				// https://github.com/electron-userland/electron-builder/issues/2562
				// https://electronjs.org/docs/api/sandbox-option
				sandbox: true,
				// can't use contextIsolation because this will prevent
				// the preload script changes to the web app
				contextIsolation: false,
				webSecurity: true,
				preload: path.join(__dirname, 'preload.js')
			}
		})

		this.id = this._browserWindow.id
		windows.push(this)
		ipc.addWindow(this.id)

		this._browserWindow.once('ready-to-show', () => {
			this._browserWindow.webContents.setZoomFactor(1.0);
			this._browserWindow.show()
			tray.show()
		})

		this._browserWindow.on('closed', ev => {
			windows.splice(windows.indexOf(this), 1)
			ipc.removeWindow(this.id)
			tray.show()
		}).on('focus', ev => {
			localShortcut.enableAll(this._browserWindow)
			windows.splice(windows.indexOf(this), 1)
			windows.push(this)
		}).on('blur', ev => {
			localShortcut.disableAll(this._browserWindow)
		}).on('minimize', ev => {
			if (conf.getDesktopConfig('hideMinimizedWindows')) {
				this._browserWindow.hide()
				ev.preventDefault()
			}
		}).on('page-title-updated', ev => tray.show())

		this._browserWindow.webContents.session.setPermissionRequestHandler(this._permissionRequestHandler)

		this._browserWindow.webContents
		    .on('new-window', (e, url) => {
			    // we never open any new windows directly from the renderer
			    // except for links in mails etc. so open them in the browser
			    shell.openExternal(url)
			    e.preventDefault()
		    })
		    .on('will-attach-webview', (e: Event, webPreferences, params) => {
			    // should never be called, but if somehow a webview gets created
			    // we kill it
			    e.preventDefault()
		    })
		    .on('did-start-navigation', (e, url, isInPlace) => {
			    const newURL = this._rewriteURL(url, isInPlace)
			    if (newURL !== url) {
				    e.preventDefault()
				    this._browserWindow.loadURL(newURL)
			    }
		    })

		this._browserWindow.webContents.session
		    .on('will-download', (ev, item) => {
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

					    // if the last dl ended less than 30s ago, open dl dir in file manager
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

		localShortcut.register(this._browserWindow, 'CommandOrControl+F', () => this._openFindInPage())
		localShortcut.register(this._browserWindow, 'CommandOrControl+P', () => this._printMail())
		localShortcut.register(this._browserWindow, 'F11', () => this._toggleMaximize())
		localShortcut.register(this._browserWindow, 'F12', () => this._toggleDevTools())
		localShortcut.register(this._browserWindow, 'F5', () => this._browserWindow.loadURL(this._startFile))
		localShortcut.register(this._browserWindow, 'CommandOrControl+W', () => this._browserWindow.close())
		localShortcut.register(this._browserWindow, 'CommandOrControl+H', () => this._browserWindow.hide())
		localShortcut.register(this._browserWindow, 'CommandOrControl+N', () => new ApplicationWindow())
	}

	// filesystem paths work differently than URLs
	_rewriteURL(url: string, isInPlace: boolean): string {
		if (
			!url.startsWith(this._startFile) &&
			!url.startsWith(`chrome-extension://${u2f.EXTENSION_ID}`)
		) {
			return this._startFile
		}
		if (url === this._startFile + '/login?noAutoLogin=true' && isInPlace) {
			if (!this._rewroteURL) {
				this._rewroteURL = true
				return this._startFile + '?noAutoLogin=true'
			} else {
				this._rewroteURL = false
			}
		}
		return url
	}

	findInPage(args: Array<any>) {
		if (args[0] !== '') {
			this._browserWindow.webContents.findInPage(args[0], args[1])
		} else {
			this.stopFindInPage()
		}
	}

	stopFindInPage() {
		this._browserWindow.webContents.stopFindInPage('keepSelection')
	}

	getTitle(): string {
		return this._browserWindow.getTitle()
	}

	_permissionRequestHandler(webContents: WebContents, permission: ElectronPermission, callback: (boolean) => void) {
		const url = webContents.getURL()
		if (!(url.startsWith('file://') && (permission === 'notifications'))) {
			return callback(false)
		}
		return callback(true)
	}

	_toggleDevTools(): void {
		const wc = this._browserWindow.webContents
		if (wc.isDevToolsOpened()) {
			wc.closeDevTools()
		} else {
			wc.openDevTools({mode: 'undocked'})
		}
	}

	_toggleMaximize(): void {
		if (this._browserWindow.isMaximized()) {
			this._browserWindow.unmaximize()
		} else {
			this._browserWindow.maximize()
		}
	}

	_printMail() {
		ipc.sendRequest(this.id, 'print', [])
	}

	_openFindInPage(): void {
		ipc.sendRequest(this.id, 'openFindInPage', [])
	}

	static get(id: number): ?ApplicationWindow {
		const w = windows.find(w => w.id === id)
		return w
			? w
			: null
	}

	static getAll(): ApplicationWindow[] {
		return windows
	}

	static getLastFocused(): ApplicationWindow {
		const w = windows[windows.length - 1]
		return w
			? w
			: new ApplicationWindow()
	}
}