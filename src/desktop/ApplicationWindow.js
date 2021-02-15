// @flow
import type {BrowserWindow, ContextMenuParams, ElectronPermission, FindInPageResult, WebContents, WebContentsEvent} from 'electron'
// $FlowIgnore[untyped-import]
import u2f from '../misc/u2f-api.js'
import type {WindowBounds, WindowManager} from "./DesktopWindowManager"
import type {IPC} from "./IPC"
import url from "url"
import {capitalizeFirstLetter} from "../api/common/utils/StringUtils.js"
import {Keys} from "../api/common/TutanotaConstants"
import type {Key} from "../misc/KeyManager"
import type {DesktopConfig} from "./config/DesktopConfig"
import path from "path"
import {noOp} from "../api/common/utils/Utils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {log} from "./DesktopLog"
import {pathToFileURL} from "./PathUtils"
import type {LocalShortcutManager} from "./electron-localshortcut/LocalShortcut"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "../api/common/utils/Encoding"

const MINIMUM_WINDOW_SIZE: number = 350

export type UserInfo = {|
	userId: string,
	mailAddress?: string
|}

type LocalShortcut = {
	key: Key;
	ctrl?: boolean; // undefined == false
	alt?: boolean; // undefined == false
	shift?: boolean; // undefined == false
	meta?: boolean; // undefined == false
	enabled?: lazy<boolean>;

	exec(): ?boolean; // must return true, if preventDefault should not be invoked
	help: TranslationKey;
}


export class ApplicationWindow {
	_ipc: IPC;
	_startFile: string;
	_browserWindow: BrowserWindow;

	_userInfo: ?UserInfo;
	_setBoundsTimeout: TimeoutID;
	_findingInPage: boolean = false;
	_skipNextSearchBarBlur: boolean = false;
	_lastSearchRequest: ?[string, {forward: boolean, matchCase: boolean}] = null;
	_lastSearchPromiseReject: (?string) => void;
	_shortcuts: Array<LocalShortcut>;
	id: number;
	_electron: $Exports<"electron">;
	_localShortcut: LocalShortcutManager;

	constructor(wm: WindowManager, conf: DesktopConfig, electron: $Exports<"electron">, localShortcutManager: LocalShortcutManager,
	            noAutoLogin?: boolean) {
		this._userInfo = null
		this._ipc = wm.ipc
		this._electron = electron
		this._localShortcut = localShortcutManager
		this._startFile = pathToFileURL(path.join(this._electron.app.getAppPath(), conf.getConst("desktophtml")),)
		this._lastSearchPromiseReject = noOp

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

		log.debug("startFile: ", this._startFile)
		const preloadPath = path.join(this._electron.app.getAppPath(), "./desktop/preload.js")
		this._createBrowserWindow(wm, preloadPath)
		this._browserWindow.loadURL(
			noAutoLogin
				? this._startFile + "?noAutoLogin=true"
				: this._startFile
		)
		this._electron.Menu.setApplicationMenu(null)
	}

	//expose browserwindow api
	on: ((m: BrowserWindowEvent, f: (Event) => void) => BrowserWindow) = (m: BrowserWindowEvent, f: (Event)=>void) => this._browserWindow.on(m, f)
	once: ((m: BrowserWindowEvent, f: (Event) => void) => BrowserWindow) = (m: BrowserWindowEvent, f: (Event)=>void) => this._browserWindow.once(m, f)
	getTitle: (() => string) = () => this._browserWindow.webContents.getTitle()
	// windows that get their zoom factor set from the config file don't report that
	// zoom factor back when queried via webContents.zoomFactor.
	// we set it ourselves in the renderer thread the same way we handle mouse wheel zoom
	setZoomFactor: ((f: number) => void) = (f: number) => this._browserWindow.webContents.setZoomFactor(f)
	isFullScreen: (() => boolean) = () => this._browserWindow.isFullScreen()
	isMinimized: (() => boolean) = () => this._browserWindow.isMinimized()
	minimize: (() => void) = () => this._browserWindow.minimize()
	hide: (() => void) = () => this._browserWindow.hide()
	center: (() => void) = () => this._browserWindow.center()
	showInactive: (() => void) = () => this._browserWindow.showInactive()
	isFocused: (() => boolean) = () => this._browserWindow.isFocused()

	get browserWindow(): BrowserWindow {
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
		this._browserWindow = new this._electron.BrowserWindow({
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
				contextIsolation: true,
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
		    .on('focus', () => this._localShortcut.enableAll(this._browserWindow))
		    .on('blur', ev => this._localShortcut.disableAll(this._browserWindow))

		this._browserWindow.webContents
		    .on('new-window', (e, url) => {
			    // we never open any new windows directly from the renderer
			    // except for links in mails etc. so open them in the browser
			    this._electron.shell.openExternal(url)
			    e.preventDefault()
		    })
		    .on('will-attach-webview', e => e.preventDefault())
		    .on('did-start-navigation', (e, url, isInPlace) => {
			    this._browserWindow.emit('did-start-navigation')
			    if (!isInPlace) { // reload
				    this._ipc.removeWindow(this.id)
				    this._ipc.addWindow(this.id)
			    }
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
				    this._browserWindow.webContents.once('found-in-page', (ev: WebContentsEvent, res: FindInPageResult) => {
					    this._ipc.sendRequest(this.id, 'applySearchResultToOverlay', [res])
				    }).findInPage(searchTerm, options)
			    }
		    })
		    .on('did-finish-load', () => {
			    // This also covers the case when window was reloaded.
			    // the webContents needs to know on which channel to listen
			    // Wait for IPC to be initialized so that render process can process our messages.
			    this._ipc.initialized(this.id).then(() => this._sendShortcutstoRender())
		    })
		    .on('did-fail-load', (evt, errorCode, errorDesc) => {
			    log.debug("failed to load resource: ", errorDesc)
			    if (errorDesc === 'ERR_FILE_NOT_FOUND') {
				    log.debug("redirecting to start page...")
				    this._browserWindow.loadURL(this._startFile + "?noAutoLogin=true")
				        .then(() => log.debug("...redirected"))
			    }
		    })
		    .on('zoom-changed', (ev : WebContentsEvent, direction: "in" | "out") => {
			    const wc = ev.sender
			    let newFactor = ((wc.getZoomFactor() * 100) + (direction === "out" ? -10 : 10)) / 100
			    if (newFactor > 3) {
				    newFactor = 3
			    } else if (newFactor < 0.5) {
				    newFactor = 0.5
			    }
			    wc.setZoomFactor(newFactor)
		    })
		    .on('update-target-url', (ev, url) => {
			    this._ipc.sendRequest(this.id, 'updateTargetUrl', [url])
		    })

		// Shortcuts but be registered here, before "focus" or "blur" event fires, otherwise localShortcut fails
		this._reRegisterShortcuts()
	}

	_reRegisterShortcuts() {
		this._localShortcut.unregisterAll(this._browserWindow)
		this._shortcuts.forEach(s => {
			// build the accelerator string localShortcut understands
			let shortcutString = ""
			shortcutString += s.meta ? "Command+" : ""
			shortcutString += s.ctrl ? "Control+" : ""
			shortcutString += s.alt ? "Alt+" : ""
			shortcutString += s.shift ? "Shift+" : ""
			shortcutString += capitalizeFirstLetter(Object.keys(Keys).filter(k => s.key === Keys[k])[0])
			this._localShortcut.register(this._browserWindow, shortcutString, s.exec)
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
			log.debug("Ignore back events on login page")
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

	async sendMessageToWebContents(args: any) : Promise<void> {
		if (!this._browserWindow || this._browserWindow.isDestroyed()) {
			log.warn(`BrowserWindow unavailable, not sending message:\n${args}`)
			return
		}
		if (!this._browserWindow.webContents || this._browserWindow.webContents.isDestroyed()) {
			log.warn(`WebContents unavailable, not sending message:\n${args}`)
			return
		}
		// need to wait for the nativeApp to register itself
		return this._ipc.initialized(this.id).then(() => {
			const messageContents = uint8ArrayToBase64(stringToUtf8Uint8Array(JSON.stringify(args)))
			this._browserWindow.webContents.executeJavaScript("tutao.nativeApp.handleMessageFromNative('" + messageContents + "')")
		})
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
		console.log("findInPage")
		this._findingInPage = true
		const [searchTerm, options] = args
		if (searchTerm !== '') {
			this._lastSearchRequest = [searchTerm, options]
			this._browserWindow.webContents.findInPage(searchTerm, options)
			return new Promise((resolve, reject) => {
				this._lastSearchPromiseReject("outdated request")
				this._lastSearchPromiseReject = reject
				this._browserWindow.webContents
					// the last listener might not have fired yet
					.removeAllListeners('found-in-page')
					.once('found-in-page', (ev: WebContentsEvent, res: FindInPageResult) => {
						this._lastSearchPromiseReject = noOp
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

	_permissionRequestHandler(webContents: WebContents, permission: ElectronPermission, callback: (boolean) => void): void {
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
