// @flow
import {ipc} from './IPC.js'
import type {ElectronPermission} from 'electron'
import {app, BrowserWindow, nativeImage, WebContents} from 'electron'
import * as localShortcut from 'electron-localshortcut'
import open from './open.js'
import DesktopUtils from './DesktopUtils.js'
import path from 'path'
import u2f from '../misc/u2f-api.js'

export class MainWindow {
	_rewroteURL: boolean;
	_startFile: string;
	_browserWindow: BrowserWindow;
	_forceQuit: boolean;
	_currentZoomFactor: number;

	constructor() {
		this._forceQuit = false
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
		this._currentZoomFactor = 1
		this._rewroteURL = false
		let normalizedPath = path.join(__dirname, "..", "..", "desktop.html")
		this._startFile = DesktopUtils.pathToFileURL(normalizedPath)
		console.log("startFile: ", this._startFile)
		let trayIcon
		if (process.platform === 'darwin') {
			trayIcon = nativeImage.createFromPath(path.join((process: any).resourcesPath, 'icons/logo-solo-red.icns'))
		} else if (process.platform === 'win32') {
			trayIcon = nativeImage.createFromPath(path.join((process: any).resourcesPath, 'icons/logo-solo-red.png.ico'))
		} else {
			trayIcon = nativeImage.createFromPath(path.join((process: any).resourcesPath, 'icons/logo-solo-red-small.png'))
		}
		this._browserWindow = new BrowserWindow({
			// electron process global has additional properties
			//icon: path.join((process: any).resourcesPath, 'icons/desktop-icon-small.png'),
			icon: trayIcon,
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
				// can't use contextIsolation because this will isolate
				// the preload script from the web app
				// contextIsolation: true,
				webSecurity: true,
				preload: path.join(__dirname, 'preload.js')
			}
		})

		ipc.init(this)

		this._browserWindow.once('ready-to-show', () => {
			this._browserWindow.show()
			ipc.send('ready-to-show')
		})

		// user clicked 'x' button
		if (process.platform !== "darwin") {
			this._browserWindow.on('close', (ev) => {
				ipc.send('close-editor')
			})
		} else {
			app.on('before-quit', () => {
				this._forceQuit = true
			})
			this._browserWindow.on('close', (ev) => {
				//prevents the window from being killed by MacOS
				ipc.send('close-editor')
				if (!this._forceQuit) {
					this._browserWindow.hide()
					ev.preventDefault()
				}
			})
		}


		this._browserWindow.webContents.session.setPermissionRequestHandler(this._permissionRequestHandler)

		this._browserWindow.webContents
		    .on('new-window', (e, url) => {
			    // we never open any new windows except for links in mails etc.
			    // so open them in the browser, not in electron
			    open(url)
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

		localShortcut.register('CommandOrControl+F', () => this._openFindInPage())
		localShortcut.register('CommandOrControl+P', () => this._printMail())
		localShortcut.register('F11', () => this._toggleMaximize())
		localShortcut.register('F12', () => this._toggleDevTools())
		localShortcut.register('F5', () => this._browserWindow.loadURL(this._startFile))
		localShortcut.register('Command+W', () => this._browserWindow.hide())
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

	changeZoomFactor(amount: number) {
		let newFactor = ((this._currentZoomFactor * 100) + amount) / 100
		if (newFactor > 3) {
			newFactor = 3
		} else if (newFactor < 0.5) {
			newFactor = 0.5
		}
		this._browserWindow.webContents.setZoomFactor(newFactor)
		this._currentZoomFactor = newFactor
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
		ipc.sendRequest('print', [])
	}

	_openFindInPage(): void {
		ipc.sendRequest('openFindInPage', [])
	}

	_refresh(): void {
		this._browserWindow.webContents.reloadIgnoringCache()
	}
}