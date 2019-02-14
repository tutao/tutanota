// @flow
import {ipc} from './IPC.js'
import type {ElectronPermission, Rectangle} from 'electron'
import {BrowserWindow, dialog, Menu, screen, shell, WebContents} from 'electron'
import * as localShortcut from 'electron-localshortcut'
import DesktopUtils from './DesktopUtils.js'
import path from 'path'
import u2f from '../misc/u2f-api.js'
import {tray} from './DesktopTray.js'
import {conf} from './DesktopConfigHandler.js'
import {lang} from './DesktopLocalizationProvider.js'
import fs from 'fs'
import {noOp} from "../api/common/utils/Utils"

type WindowBounds = {
	rect: Rectangle,
	fullscreen: ?boolean,
}

const windows: ApplicationWindow[] = []
let fileManagersOpen: number = 0

export class ApplicationWindow {
	_rewroteURL: boolean;
	_startFile: string;
	_browserWindow: BrowserWindow;
	id: number;

	constructor(showWhenReady: boolean) {
		this._createBrowserWindow(showWhenReady)
		this._browserWindow.loadURL(this._startFile)
		Menu.setApplicationMenu(null)
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

	_createBrowserWindow(showWhenReady: boolean) {
		this._rewroteURL = false
		let normalizedPath = path.join(__dirname, "..", "..", "desktop.html")
		this._startFile = DesktopUtils.pathToFileURL(normalizedPath)
		console.log("startFile: ", this._startFile)
		const startingBounds: WindowBounds = getStartingBounds()
		this._browserWindow = new BrowserWindow({
			icon: tray.getIcon(),
			show: false,
			width: startingBounds.fullscreen ? undefined : startingBounds.rect.width,
			height: startingBounds.fullscreen ? undefined : startingBounds.rect.height,
			x: startingBounds.fullscreen ? undefined : startingBounds.rect.x,
			y: startingBounds.fullscreen ? undefined : startingBounds.rect.y,
			fullscreen: startingBounds.fullscreen,
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
			this._browserWindow.webContents.setZoomFactor(1.0)
			tray.update()
			if (showWhenReady) {
				this._browserWindow.show()
			}
		})

		this._browserWindow.on('close', ev => {
			const lastBounds = this._browserWindow.getBounds()
			if (isContainedIn(screen.getDisplayMatching(lastBounds).bounds, lastBounds)) {
				conf.setDesktopConfig('lastBounds', {
					fullscreen: this._browserWindow.isFullScreen(),
					rect: this._browserWindow.getBounds()
				})
			}
		}).on('closed', ev => {
			windows.splice(windows.indexOf(this), 1)
			ipc.removeWindow(this.id)
			tray.update()
		}).on('focus', ev => {
			localShortcut.enableAll(this._browserWindow)
			windows.splice(windows.indexOf(this), 1)
			windows.push(this)
		}).on('blur', ev => {
			localShortcut.disableAll(this._browserWindow)
		}).on('minimize', ev => {
			if (conf.getDesktopConfig('runAsTrayApp')) {
				this._browserWindow.hide()
				ev.preventDefault()
			}
		}).on('page-title-updated', ev => tray.update())

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
		    .on('context-menu', (e, params) => {
			    this._browserWindow.webContents.send('context-menu', [{linkURL: params.linkURL}])
		    })

		/**
		 * we need two conditions for the context menu to work on every window
		 * 1. the preload script must have run already on this window
		 * 2. the first web app instance must have sent the translations to the node thread
		 * dom-ready is after preload and after the index.html was loaded into the webContents,
		 * but may be before any javascript ran
		 */
		this._browserWindow.webContents.once('dom-ready', () => {
			lang.initialized.promise.then(() => this._browserWindow.webContents.send('setup-context-menu', []))
			    .catch(noOp) //sometimes bowserWindow or webContents are not there anymore
		})

		this._browserWindow.webContents.session
		    .removeAllListeners('will-download') // all webContents use the same session
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

		localShortcut.register(this._browserWindow, 'CommandOrControl+F', () => this._openFindInPage())
		localShortcut.register(this._browserWindow, 'CommandOrControl+P', () => this._printMail())
		localShortcut.register(this._browserWindow, 'F11', () => this._toggleMaximize())
		localShortcut.register(this._browserWindow, 'F12', () => this._toggleDevTools())
		localShortcut.register(this._browserWindow, 'F5', () => this._browserWindow.loadURL(this._startFile))
		localShortcut.register(this._browserWindow, 'CommandOrControl+W', () => this._browserWindow.close())
		localShortcut.register(this._browserWindow, 'CommandOrControl+H', () => this._browserWindow.hide())
		localShortcut.register(this._browserWindow, 'CommandOrControl+N', () => new ApplicationWindow(true))
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

	static getLastFocused(show: boolean): ApplicationWindow {
		const w = windows[windows.length - 1]
		if (w && show) {
			w.show()
			return w
		} else {
			return new ApplicationWindow(show)
		}
	}
}

function getStartingBounds(): WindowBounds {
	const defaultBounds = {
		rect: {
			width: 1280,
			height: 800,
			x: undefined,
			y: undefined
		},
		fullscreen: undefined
	}
	const lastBounds: WindowBounds = conf.getDesktopConfig("lastBounds")
	if (!lastBounds || !isContainedIn(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
		return (defaultBounds: any)
	} else {
		return lastBounds
	}
}

function isContainedIn(closestRect: Rectangle, lastBounds: Rectangle): boolean {
	return lastBounds.x >= closestRect.x - 10
		&& lastBounds.y >= closestRect.y - 10
		&& lastBounds.width + lastBounds.x <= closestRect.width + 10
		&& lastBounds.height + lastBounds.y <= closestRect.height + 10
}