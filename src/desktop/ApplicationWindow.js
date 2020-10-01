// @flow
import type {ContextMenuParams, DragInfo, ElectronPermission, FindInPageResult} from 'electron'
import {app, BrowserWindow, Menu, shell, WebContents} from 'electron'
import * as localShortcut from 'electron-localshortcut'
import DesktopUtils from './DesktopUtils.js'
import u2f from '../misc/u2f-api.js'
import type {WindowBounds, WindowManager} from "./DesktopWindowManager"
import type {IPC} from "./IPC"
import url from "url"
import {capitalizeFirstLetter} from "../api/common/utils/StringUtils.js"
import {Keys} from "../api/common/TutanotaConstants"
import type {Shortcut} from "../misc/KeyManager"
import {DesktopConfig} from "./config/DesktopConfig"
import path from "path"

const MINIMUM_WINDOW_SIZE: number = 350

export type UserInfo = {|
	userId: string,
	mailAddress?: string
|}

export class ApplicationWindow {
	_ipc: IPC;
	_startFile: string;
	_browserWindow: BrowserWindow;

	_userInfo: ?UserInfo;
	_setBoundsTimeout: TimeoutID;
	_findingInPage = false;
	_skipNextSearchBarBlur = false;
	_lastSearchRequest = null;
	_shortcuts: Array<Shortcut>;
	id: number;

	constructor(wm: WindowManager, conf: DesktopConfig, noAutoLogin?: boolean) {
		this._userInfo = null
		this._ipc = wm.ipc
		this._startFile = DesktopUtils.pathToFileURL(path.join(app.getAppPath(), conf.getConst("desktophtml")),)

		const isMac = process.platform === 'darwin';
		this._shortcuts = [
			{key: Keys.F, meta: isMac, ctrl: !isMac, exec: () => this._openFindInPage(), help: "searchPage_label"},
			{key: Keys.P, meta: isMac, ctrl: !isMac, exec: () => this._printMail(), help: "print_action"},
			{key: Keys.F12, exec: () => this._toggleDevTools(), help: "toggleDevTools_action"},
			{key: Keys.F5, exec: () => {this._browserWindow.loadURL(this._startFile)}, help: "reloadPage_action"},
			{key: Keys["0"], meta: isMac, ctrl: !isMac, exec: () => {this.setZoomFactor(1)}, help: "resetZoomFactor_action"}
		].concat(isMac
			? [{key: Keys.F, meta: true, ctrl: true, exec: () => this._toggleFullScreen(), help: "toggleFullScreen_action"},]
			: [
				{key: Keys.F11, exec: () => this._toggleFullScreen(), help: "toggleFullScreen_action"},
				{key: Keys.RIGHT, alt: true, exec: () => this._browserWindow.webContents.goForward(), help: "pageForward_label"},
				{key: Keys.LEFT, alt: true, exec: () => this._tryGoBack(), help: "pageBackward_label"},
				{key: Keys.H, ctrl: true, exec: () => wm.minimize(), help: "hideWindows_action"},
				{key: Keys.N, ctrl: true, exec: () => {wm.newWindow(true)}, help: "openNewWindow_action"}
			])

		console.log("startFile: ", this._startFile)
		const preloadPath = path.join(app.getAppPath(), conf.getConst("preloadjs"))
		this._createBrowserWindow(wm, preloadPath)
		this._browserWindow.loadURL(
			noAutoLogin
				? this._startFile + "?noAutoLogin=true"
				: this._startFile
		)
		Menu.setApplicationMenu(null)
	}

	//expose browserwindow api
	on = (m: BrowserWindowEvent, f: (Event)=>void) => this._browserWindow.on(m, f)
	once = (m: BrowserWindowEvent, f: (Event)=>void) => this._browserWindow.once(m, f)
	getTitle = () => this._browserWindow.webContents.getTitle()
	// windows that get their zoom factor set from the config file don't report that
	// zoom factor back when queried via webContents.zoomFactor.
	// we set it ourselves in the renderer thread the same way we handle mouse wheel zoom
	setZoomFactor = (f: number) => this.sendMessageToWebContents('set-zoom-factor', f)
	isFullScreen = () => this._browserWindow.isFullScreen()
	isMinimized = () => this._browserWindow.isMinimized()
	minimize = () => this._browserWindow.minimize()
	hide = () => this._browserWindow.hide()
	center = () => this._browserWindow.center()
	showInactive = () => this._browserWindow.showInactive()
	isFocused = () => this._browserWindow.isFocused()
	startDrag = (i: DragInfo) => this._browserWindow.webContents.startDrag(i)

	get browserWindow() {
		return this._browserWindow
	}

	show() {
		if (!this._browserWindow) {
			return
		}
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
		} else if (!this._browserWindow.isFocused()) {
			this._browserWindow.focus()
		}
	}

	_createBrowserWindow(wm: WindowManager, preloadPath: string) {
		this._browserWindow = new BrowserWindow({
			icon: wm.getIcon(),
			show: false,
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
				enableRemoteModule: false,
				preload: preloadPath,
				spellcheck: false
			}
		})
		this._browserWindow.setMenuBarVisibility(false)
		this._browserWindow.removeMenu()
		this._browserWindow.setMinimumSize(MINIMUM_WINDOW_SIZE, MINIMUM_WINDOW_SIZE)
		this.id = this._browserWindow.id
		this._ipc.addWindow(this.id)

		this._browserWindow.webContents.session.setPermissionRequestHandler(this._permissionRequestHandler)
		wm.dl.manageDownloadsForSession(this._browserWindow.webContents.session)

		this._browserWindow
		    .on('closed', () => {
			    this.setUserInfo(null)
			    this._ipc.removeWindow(this.id)
		    })
		    .on('focus', () => localShortcut.enableAll(this._browserWindow))
		    .on('blur', ev => localShortcut.disableAll(this._browserWindow))

		this._browserWindow.webContents
		    .on('new-window', (e, url) => {
			    // we never open any new windows directly from the renderer
			    // except for links in mails etc. so open them in the browser
			    shell.openExternal(url)
			    e.preventDefault()
		    })
		    .on('will-attach-webview', e => e.preventDefault())
		    .on('did-start-navigation', (e, url, isInPlace) => {
			    this._browserWindow.emit('did-start-navigation')
			    const newURL = this._rewriteURL(url, isInPlace)
			    if (newURL !== url) {
				    e.preventDefault()
				    this._browserWindow.loadURL(newURL)
			    }
		    })
		    .on('before-input-event', (ev, input) => {
			    if (this._lastSearchRequest && this._findingInPage && input.type === "keyDown" && input.key === "Enter") {
				    this._skipNextSearchBarBlur = true;
				    const [searchTerm, options] = this._lastSearchRequest
				    options.forward = true
				    this._browserWindow.webContents.once('found-in-page', (ev: Event, res: FindInPageResult) => {
					    this._ipc.sendRequest(this.id, 'applySearchResultToOverlay', [res])
				    }).findInPage(searchTerm, options)
			    }
		    })
		    .on('did-fail-load', (evt, errorCode, errorDesc) => {
			    console.log("failed to load resource: ", errorDesc)
			    if (errorDesc === 'ERR_FILE_NOT_FOUND') {
				    console.log("redirecting to start page...")
				    this._browserWindow.loadURL(this._startFile + "?noAutoLogin=true")
				        .then(() => {
					        console.log("...redirected")
				        })
			    }
		    })
		    .on('did-finish-load', () => {
			    // This also covers the case when window was reloaded.
			    // Wait for IPC to be initialized so that render process can process our messages.
			    this._ipc.initialized(this.id).then(() => this._sendShortcutstoRender())
		    })

		this._browserWindow.webContents.on('dom-ready', () => {
			this.sendMessageToWebContents('initialize-ipc', [app.getVersion(), this.id])
		})

		// Shortcuts but be registered here, before "focus" or "blur" event fires, otherwise localShortcut fails
		this._reRegisterShortcuts()
	}

	_reRegisterShortcuts() {
		localShortcut.unregisterAll(this._browserWindow)
		this._shortcuts.forEach(s => {
			// build the accelerator string localShortcut understands
			let shortcutString = ""
			shortcutString += s.meta ? "Command+" : ""
			shortcutString += s.ctrl ? "Control+" : ""
			shortcutString += s.alt ? "Alt+" : ""
			shortcutString += s.shift ? "Shift+" : ""
			shortcutString += capitalizeFirstLetter(Object.keys(Keys).filter(k => s.key === Keys[k])[0])
			localShortcut.register(this._browserWindow, shortcutString, s.exec)
		})
	}

	_sendShortcutstoRender(): void {
		// delete exec since functions don't cross IPC anyway.
		// it will be replaced by () => true in the renderer thread.
		const webShortcuts = this._shortcuts.map(s => Object.assign({}, s, {exec: null}))
		this._ipc.sendRequest(this.id, 'addShortcuts', webShortcuts)
	}

	_tryGoBack(): void {
		const parsedUrl = url.parse(this._browserWindow.webContents.getURL())
		if (parsedUrl.pathname && !parsedUrl.pathname.endsWith("login")) {
			this._browserWindow.webContents.goBack()
		} else {
			console.log("Ignore back events on login page")
		}
	}

	openMailBox(info: UserInfo, path?: ?string): Promise<void> {
		return this._ipc.initialized(this.id).then(() =>
			this._ipc.sendRequest(this.id, 'openMailbox', [info.userId, info.mailAddress, path])
		).then(() => this.show())
	}

	// open at date?
	openCalendar(info: UserInfo): Promise<void> {
		return this._ipc.initialized(this.id).then(() =>
			this._ipc.sendRequest(this.id, 'openCalendar', [info.userId])
		).then(() => this.show())
	}

	setContextMenuHandler(handler: (ContextMenuParams)=>void) {
		const wc = this.browserWindow.webContents
		wc.on('context-menu', (e, params) => handler(params))
	}

	sendMessageToWebContents(message: WebContentsMessage | number, args: any) {
		if (!this._browserWindow || this._browserWindow.isDestroyed()) {
			console.warn(`BrowserWindow unavailable, not sending message ${message}:\n${args}`)
			return
		}
		if (!this._browserWindow.webContents || this._browserWindow.webContents.isDestroyed()) {
			console.warn(`WebContents unavailable, not sending message ${message}:\n${args}`)
			return
		}
		this._browserWindow.webContents.send(message.toString(), args)
	}

	setUserInfo(info: ?UserInfo) {
		this._userInfo = info
	}

	getUserInfo(): ?UserInfo {
		return this._userInfo
	}

	getUserId(): ?string {
		return this._userInfo ? this._userInfo.userId : null
	}

	getPath(): string {
		return this._browserWindow.webContents.getURL().substring(this._startFile.length)
	}

	// filesystem paths work differently than URLs
	_rewriteURL(url: string, isInPlace: boolean): string {
		if (
			!url.startsWith(this._startFile) &&
			!url.startsWith(`chrome-extension://${u2f.EXTENSION_ID}`)
		) {
			return this._startFile
		}
		if (url === this._startFile + '?r=%2Flogin%3FnoAutoLogin%3Dtrue' && isInPlace) {
			// after logout, don't try to login automatically.
			// this fails if ?noAutoLogin=true is set directly from the web app for some reason
			return this._startFile + '?noAutoLogin=true'
		}
		return url
	}

	findInPage(args: Array<any>): Promise<FindInPageResult> {
		this._findingInPage = true
		const [searchTerm, options] = args
		if (searchTerm !== '') {
			this._lastSearchRequest = [searchTerm, options]
			this._browserWindow.webContents.findInPage(searchTerm, options)
			return new Promise((resolve) => {
				this._browserWindow.webContents.once('found-in-page', (ev: Event, res: FindInPageResult) => {
					resolve(res)
				})
			})
		} else {
			this.stopFindInPage()
			return Promise.resolve({
				requestId: -1,
				activeMatchOrdinal: 0,
				matches: 0,
				selectionArea: {height: 0, width: 0, x: 0, y: 0},
				finalUpdate: true
			})
		}
	}

	stopFindInPage() {
		this._findingInPage = false
		this._lastSearchRequest = null
		this._browserWindow.webContents.stopFindInPage('keepSelection')
	}

	/**
	 * make it known to the window if the search overlay is focused.
	 * used to check if enter events need to be caught to search the next result
	 * @param state whether the search bar is focused right now
	 * @param force ignores skipnextblur
	 */
	setSearchOverlayState(state: boolean, force: boolean) {
		if (!force && !state && this._skipNextSearchBarBlur) {
			this._skipNextSearchBarBlur = false;
			return
		}
		this._findingInPage = state
	}

	_permissionRequestHandler(webContents: WebContents, permission: ElectronPermission, callback: (boolean) => void) {
		return callback(false)
	}

	_toggleDevTools(): void {
		const wc = this._browserWindow.webContents
		if (wc.isDevToolsOpened()) {
			wc.closeDevTools()
		} else {
			wc.openDevTools({mode: 'undocked'})
		}
	}

	_toggleFullScreen(): void {
		this._browserWindow.setFullScreen(!this._browserWindow.isFullScreen())
	}

	_printMail() {
		this._ipc.sendRequest(this.id, 'print', [])
	}

	_openFindInPage(): void {
		this._ipc.sendRequest(this.id, 'openFindInPage', [])
	}

	isVisible(): boolean {
		return this._browserWindow.isVisible() && !this._browserWindow.isMinimized()
	}

	// browserWindow.hide() was called (or it was created with showWhenReady = false)
	isHidden(): boolean {
		return !this._browserWindow.isVisible() && !this._browserWindow.isMinimized()
	}

	setBounds(bounds: WindowBounds) {
		this._browserWindow.setFullScreen(bounds.fullscreen)
		this.setZoomFactor(bounds.scale)
		if (bounds.fullscreen) return
		this._browserWindow.setBounds(bounds.rect)
		if (process.platform !== 'linux') return
		clearTimeout(this._setBoundsTimeout)
		this._setBoundsTimeout = setTimeout(() => {
			if (this._browserWindow.isDestroyed()) {
				return
			}
			const newRect = this._browserWindow.getBounds()
			if (bounds.rect.y !== newRect.y) {
				// window was moved by some bug/OS interaction, so we move it back twice the distance.
				// should end up right where we want it. https://github.com/electron/electron/issues/10388
				this._browserWindow.setPosition(newRect.x, newRect.y + 2 * (bounds.rect.y - newRect.y))
			}
		}, 200)
	}

	getBounds(): WindowBounds {
		return {
			fullscreen: this._browserWindow.isFullScreen(),
			rect: this._browserWindow.getBounds(),
			scale: this._browserWindow.webContents.zoomFactor
		}
	}
}
