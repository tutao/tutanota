import type {BrowserWindow, ContextMenuParams, NativeImage, Result,} from "electron"
import type {NativeInterfaceFactory, WindowBounds, WindowManager} from "./DesktopWindowManager"
import type {IPC} from "./IPC"
import url from "url"
import type {lazy} from "@tutao/tutanota-utils"
import {assertNotNull, capitalizeFirstLetter, noOp, typedEntries, typedKeys} from "@tutao/tutanota-utils"
import {Keys} from "../api/common/TutanotaConstants"
import type {Key} from "../misc/KeyManager"
import path from "path"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {log} from "./DesktopLog"
import {parseUrlOrNull} from "./PathUtils"
import type {LocalShortcutManager} from "./electron-localshortcut/LocalShortcut"
import {DesktopThemeFacade} from "./DesktopThemeFacade"
import {CancelledError} from "../api/common/error/CancelledError"
import {ElectronExports} from "./ElectronExportTypes";
import {OfflineDbFacade} from "./db/OfflineDbFacade"
import HandlerDetails = Electron.HandlerDetails
import {DesktopFacade} from "../native/common/generatedipc/DesktopFacade.js"
import {CommonNativeFacade} from "../native/common/generatedipc/CommonNativeFacade.js"
import {DesktopFacadeSendDispatcher} from "../native/common/generatedipc/DesktopFacadeSendDispatcher.js"
import {CommonNativeFacadeSendDispatcher} from "../native/common/generatedipc/CommonNativeFacadeSendDispatcher.js"

const MINIMUM_WINDOW_SIZE: number = 350
export type UserInfo = {
	userId: string
	mailAddress?: string
}
type LocalShortcut = {
	key: Key
	// undefined == false
	ctrl?: boolean
	// undefined == false
	alt?: boolean
	// undefined == false
	shift?: boolean
	// undefined == false
	meta?: boolean
	enabled?: lazy<boolean>
	// must return true, if preventDefault should not be invoked
	exec(): boolean | void
	help: TranslationKey
}
const TAG = "[ApplicationWindow]"

export class ApplicationWindow {
	private readonly _ipc: IPC
	private readonly _startFileURLString: string
	private readonly _electron: ElectronExports
	private readonly _localShortcut: LocalShortcutManager
	private readonly _themeFacade: DesktopThemeFacade
	private readonly _startFileURL: URL
	_browserWindow!: BrowserWindow

	/** User logged in in this window. Reset from WindowManager. */
	private _userInfo: UserInfo | null
	private userId: Id | null = null
	private _setBoundsTimeout: ReturnType<typeof setTimeout> | null = null
	private _findingInPage: boolean = false
	private _skipNextSearchBarBlur: boolean = false
	private _lastSearchRequest: [string, {forward: boolean, matchCase: boolean}] | null = null
	private _lastSearchPromiseReject: (arg0: Error | null) => void
	private _shortcuts: Array<LocalShortcut>
	private readonly desktopFacade: DesktopFacade
	private readonly commonNativeFacade: CommonNativeFacade
	id!: number

	constructor(
		wm: WindowManager,
		desktophtml: string,
		icon: NativeImage,
		electron: typeof Electron.CrossProcessExports,
		localShortcutManager: LocalShortcutManager,
		themeFacade: DesktopThemeFacade,
		private readonly offlineDbFacade: OfflineDbFacade,
		nativeInterfaceFactory: NativeInterfaceFactory,
		dictUrl: string,
		noAutoLogin?: boolean | null,
	) {
		this._themeFacade = themeFacade
		this._userInfo = null
		this._ipc = assertNotNull(wm.ipc)
		this._electron = electron
		this._localShortcut = localShortcutManager
		this._startFileURL = url.pathToFileURL(path.join(this._electron.app.getAppPath(), desktophtml))
		this._startFileURLString = this._startFileURL.toString()
		this._lastSearchPromiseReject = noOp
		const isMac = process.platform === "darwin"
		this._shortcuts = ([
			{
				key: Keys.F,
				meta: isMac,
				ctrl: !isMac,
				exec: () => this._openFindInPage(),
				help: "searchPage_label",
			},
			{
				key: Keys.P,
				meta: isMac,
				ctrl: !isMac,
				exec: () => this._printMail(),
				help: "print_action",
			},
			{
				key: Keys.F12,
				exec: () => this._toggleDevTools(),
				help: "toggleDevTools_action",
			},
			{
				key: Keys["0"],
				meta: isMac,
				ctrl: !isMac,
				exec: () => {
					wm.changeZoom(1)
				},
				help: "resetZoomFactor_action",
			},
		] as Array<LocalShortcut>).concat(isMac
			? [
				{
					key: Keys.F,
					meta: true,
					ctrl: true,
					exec: () => this._toggleFullScreen(),
					help: "toggleFullScreen_action",
				},
			]
			: [
				{
					key: Keys.F11,
					exec: () => this._toggleFullScreen(),
					help: "toggleFullScreen_action",
				},
				{
					key: Keys.RIGHT,
					alt: true,
					exec: () => this._browserWindow.webContents.goForward(),
					help: "pageForward_label",
				},
				{
					key: Keys.LEFT,
					alt: true,
					exec: () => this._tryGoBack(),
					help: "pageBackward_label",
				},
				{
					key: Keys.H,
					ctrl: true,
					exec: () => wm.minimize(),
					help: "hideWindows_action",
				},
				{
					key: Keys.N,
					ctrl: true,
					exec: () => {
						wm.newWindow(true)
					},
					help: "openNewWindow_action",
				},
			],
		)
		log.debug(TAG, "startFile: ", this._startFileURLString)
		const preloadPath = path.join(this._electron.app.getAppPath(), "./desktop/preload.js")

		this._createBrowserWindow(wm, {
			preloadPath,
			icon,
			dictUrl,
		})

		// remove once each window has its own ipc transport instance
		const interfaceFactory = nativeInterfaceFactory(this.id)
		this.desktopFacade = new DesktopFacadeSendDispatcher(interfaceFactory)
		this.commonNativeFacade = new CommonNativeFacadeSendDispatcher(interfaceFactory)

		this._loadInitialUrl(noAutoLogin ?? false)

		this._electron.Menu.setApplicationMenu(null)
	}

	async _loadInitialUrl(noAutoLogin: boolean) {
		const initialUrl = await this._getInitialUrl({
			noAutoLogin,
		})
		await this.updateBackgroundColor()

		this._browserWindow.loadURL(initialUrl)
	}

	async updateBackgroundColor() {
		const theme = await this._themeFacade.getCurrentThemeWithFallback()

		if (theme) {
			this._browserWindow.setBackgroundColor(theme.content_bg)
		}
	}

	//expose browserwindow api
	// on: (m, f: (arg0: Event) => void) => BrowserWindow = (m, f: (arg0: Event) => void) => this._browserWindow.on(m, f)
	on: typeof BrowserWindow.prototype.on = (...args) =>
		// @ts-ignore
		this._browserWindow.on(...args)
	once: typeof BrowserWindow.prototype.once = (...args) =>
		// @ts-ignore
		this._browserWindow.once(...args)
	getTitle: () => string = () => this._browserWindow.webContents.getTitle()
	// windows that get their zoom factor set from the config file don't report that
	// zoom factor back when queried via webContents.zoomFactor.
	// we set it ourselves in the renderer thread the same way we handle mouse wheel zoom
	setZoomFactor: (f: number) => void = (f: number) => this._browserWindow.webContents.setZoomFactor(f)
	isFullScreen: () => boolean = () => this._browserWindow.isFullScreen()
	isMinimized: () => boolean = () => this._browserWindow.isMinimized()
	minimize: () => void = () => this._browserWindow.minimize()
	hide: () => void = () => this._browserWindow.hide()
	center: () => void = () => this._browserWindow.center()
	showInactive: () => void = () => this._browserWindow.showInactive()
	focus: () => void = () => this._browserWindow.focus()
	isFocused: () => boolean = () => this._browserWindow.isFocused()

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

	_createBrowserWindow(
		wm: WindowManager,
		opts: {
			preloadPath: string
			icon: NativeImage
			dictUrl: string
		},
	) {
		const {preloadPath, dictUrl, icon} = opts
		this._browserWindow = new this._electron.BrowserWindow({
			icon,
			show: false,
			autoHideMenuBar: true,
			webPreferences: {
				nodeIntegration: false,
				nodeIntegrationInWorker: false,
				nodeIntegrationInSubFrames: false,
				sandbox: true,
				contextIsolation: true,
				webSecurity: true,
				// @ts-ignore see: https://github.com/electron/electron/issues/30789
				enableRemoteModule: false,
				allowRunningInsecureContent: false,
				preload: preloadPath,
				webgl: false,
				plugins: false,
				experimentalFeatures: false,
				webviewTag: false,
				disableDialogs: true,
				navigateOnDragDrop: false,
				autoplayPolicy: "user-gesture-required",
				enableWebSQL: false,
				spellcheck: true,
			},
		})

		this._browserWindow.setMenuBarVisibility(false)

		this._browserWindow.removeMenu()

		this._browserWindow.setMinimumSize(MINIMUM_WINDOW_SIZE, MINIMUM_WINDOW_SIZE)

		this.id = this._browserWindow.id

		this._ipc.addWindow(this.id)

		this._browserWindow.webContents.session.setPermissionRequestHandler(
			(webContents, permission, callback: (_: boolean) => void) => callback(false),
		)

		wm.dl.manageDownloadsForSession(this._browserWindow.webContents.session, dictUrl)

		this._browserWindow
			.on("close", () => {
				this.closeDb()
			})
			.on("closed", () => {
				this.setUserInfo(null)

				this._ipc.removeWindow(this.id)
			})
			.on("focus", () => this._localShortcut.enableAll(this._browserWindow))
			.on("blur", (_: FocusEvent) => this._localShortcut.disableAll(this._browserWindow))

		this._browserWindow.webContents
			.on("will-attach-webview", e => e.preventDefault())
			.on("will-navigate", (e, url) => {
				// >Emitted when a user or the page wants to start navigation. It can happen when the window.location object is changed or
				// a user clicks a link in the page.
				// >This event will not emit when the navigation is started programmatically with APIs like webContents.loadURL and
				// webContents.back.
				// >It is also not emitted for in-page navigations, such as clicking anchor links or updating the window.location.hash.
				// https://www.electronjs.org/docs/api/web-contents#event-will-navigate
				//
				// Basically the only scenarios left for us are:
				// Clicking on a link without target="_blank"
				// Programmatically changing window.location to something else (we don't do this and it normally reloads the page)
				// In neither of those cases we want to navigate anywhere.
				log.debug(TAG, "will-navigate", url)
				e.preventDefault()
			})
			.on("before-input-event", (ev, input) => {
				if (this._lastSearchRequest && this._findingInPage && input.type === "keyDown" && input.key === "Enter") {
					this._skipNextSearchBarBlur = true
					const [searchTerm, options] = this._lastSearchRequest
					options.forward = true

					this._browserWindow.webContents
						.once("found-in-page", (ev, res) => {
							this.desktopFacade.applySearchResultToOverlay(res)
						})
						.findInPage(searchTerm, options)
				}
			})
			.on("did-finish-load", () => {
				// This also covers the case when window was reloaded.
				// the webContents needs to know on which channel to listen
				// Wait for IPC to be initialized so that render process can process our messages.
				this._ipc.initialized(this.id).then(() => this._sendShortcutstoRender())
			})
			.on("did-fail-load", (evt, errorCode, errorDesc, validatedURL) => {
				log.debug(TAG, "failed to load resource: ", validatedURL, errorDesc)

				if (errorDesc === "ERR_FILE_NOT_FOUND") {
					this._getInitialUrl({
						noAutoLogin: true,
					})
						.then(initialUrl => {
							log.debug(TAG, "redirecting to start page...", initialUrl)
							return this._browserWindow.loadURL(initialUrl)
						})
						.then(() => log.debug(TAG, "...redirected"))
				}
			})
			// @ts-ignore
			.on("remote-require", e => e.preventDefault())
			// @ts-ignore
			.on("remote-get-global", e => e.preventDefault())
			// @ts-ignore
			.on("remote-get-builtin", e => e.preventDefault())
			// @ts-ignore
			.on("remote-get-current-web-contents", e => e.preventDefault())
			// @ts-ignore
			.on("remote-get-current-window", e => e.preventDefault())
			.on("did-navigate", () => this._browserWindow.emit("did-navigate"))
			.on("did-navigate-in-page", () => this._browserWindow.emit("did-navigate"))
			.on("zoom-changed", (ev, direction: "in" | "out") => this._browserWindow.emit("zoom-changed", ev, direction))
			.on("update-target-url", (ev, url) => {
				this.desktopFacade.updateTargetUrl(url, this._startFileURLString)
			})

		this._browserWindow.webContents.setWindowOpenHandler(details => this._onNewWindow(details))

		// Shortcuts but be registered here, before "focus" or "blur" event fires, otherwise localShortcut fails
		this._reRegisterShortcuts()
	}

	async reload(queryParams: Record<string, string | boolean>) {
		await this.closeDb()
		this._userInfo = null
		const url = await this._getInitialUrl(queryParams)
		await this._browserWindow.loadURL(url)
	}

	private async closeDb() {
		if (this.userId) {
			console.log(`closing offline db for ${this.userId}`)
			await this.offlineDbFacade.closeDatabaseForUser(this.userId)
		} else {
			console.error("couldn't close db for window, no userId is set!!!!")
		}
	}

	_onNewWindow(details: HandlerDetails): {action: "deny"} {
		const parsedUrl = parseUrlOrNull(details.url)

		if (parsedUrl == null) {
			log.warn("Could not parse url for new-window, will not open")
		} else if (parsedUrl.protocol === "file:") {
			// this also works for raw file paths without protocol
			log.warn("prevented file url from being opened by shell")
		} else {
			// we never open any new windows directly from the renderer
			// except for links in mails etc. so open them in the browser
			this._electron.shell.openExternal(parsedUrl.toString())
		}

		return {
			action: "deny",
		}
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
			shortcutString += capitalizeFirstLetter(typedKeys(Keys).filter(k => s.key === Keys[k])[0])

			this._localShortcut.register(this._browserWindow, shortcutString, s.exec)
		})
	}

	_sendShortcutstoRender(): void {
		// delete exec since functions don't cross IPC anyway.
		// it will be replaced by () => true in the renderer thread.
		const webShortcuts = this._shortcuts.map(s =>
			Object.assign({}, s, {
				exec: null,
			}),
		)

		this.desktopFacade.addShortcuts(webShortcuts)
	}

	_tryGoBack(): void {
		const parsedUrl = url.parse(this._browserWindow.webContents.getURL())

		if (parsedUrl.pathname && !parsedUrl.pathname.endsWith("login")) {
			this._browserWindow.webContents.goBack()
		} else {
			log.debug(TAG, "Ignore back events on login page")
		}
	}

	openMailBox(info: UserInfo, path?: string | null): Promise<void> {
		return this._ipc
				   .initialized(this.id)
				   .then(() => this.commonNativeFacade.openMailBox(info.userId, info.mailAddress!, path ?? null))
				   .then(() => this.show())
	}

	// open at date?
	openCalendar(info: UserInfo): Promise<void> {
		return this._ipc
				   .initialized(this.id)
				   .then(() => this.commonNativeFacade.openCalendar(info.userId))
				   .then(() => this.show())
	}

	setContextMenuHandler(handler: (arg0: ContextMenuParams) => void) {
		const wc = this._browserWindow.webContents
		wc.on("context-menu", (e, params) => handler(params))
	}

	async sendMessageToWebContents(msg: any): Promise<void> {
		if (!this._browserWindow || this._browserWindow.isDestroyed()) {
			log.warn(`BrowserWindow unavailable, not sending message:\n${msg && msg.type}`)
			return
		}

		if (!this._browserWindow.webContents || this._browserWindow.webContents.isDestroyed()) {
			log.warn(`WebContents unavailable, not sending message:\n${msg && msg.type}`)
			return
		}

		// need to wait for the nativeApp to register itself
		return this._ipc.initialized(this.id).then(() => this._browserWindow.webContents.send("to-renderer", msg))
	}

	setUserInfo(info: UserInfo | null) {
		this._userInfo = info
	}

	getUserInfo(): UserInfo | null {
		return this._userInfo
	}

	getUserId(): Id | null {
		return this.userId
	}

	setUserId(id: Id) {
		this.userId = id
	}

	getPath(): string {
		return this._browserWindow.webContents.getURL().substring(this._startFileURLString.length)
	}

	findInPage([searchTerm, options]: [string, {forward: boolean, matchCase: boolean}]): Promise<Result | null> {
		this._findingInPage = true

		if (searchTerm !== "") {
			this._lastSearchRequest = [searchTerm, options]

			this._browserWindow.webContents.findInPage(searchTerm, options)

			return new Promise((resolve: (_: Result) => void, reject) => {
				// if the last search request is still ongoing, this will reject that requests' promise
				// we obviously don't care about that requests' result since we are already handling a new one
				// if the last request is done, this is a noOp
				this._lastSearchPromiseReject(new CancelledError("search request was superseded"))

				// make sure we can cancel this promise if we get a new search request before this one is done.
				this._lastSearchPromiseReject = reject

				this._browserWindow.webContents // the last listener might not have fired yet
					.removeAllListeners("found-in-page")
					.once("found-in-page", (ev, res: Result) => {
						this._lastSearchPromiseReject = noOp
						resolve(res)
					})
			}).catch(e => {
				// findInPage might reject if requests come too quickly
				// if it's rejecting for another reason we'll have logs
				if (!(e instanceof CancelledError)) log.debug("findInPage reject: ", e)
				return null
			})
		} else {
			this.stopFindInPage()
			return Promise.resolve(null)
		}
	}

	stopFindInPage() {
		this._findingInPage = false
		this._lastSearchRequest = null

		this._browserWindow.webContents.stopFindInPage("keepSelection")
	}

	/**
	 * make it known to the window if the search overlay is focused.
	 * used to check if enter events need to be caught to search the next result
	 * @param state whether the search bar is focused right now
	 * @param force ignores skipnextblur
	 */
	setSearchOverlayState(state: boolean, force: boolean) {
		if (!force && !state && this._skipNextSearchBarBlur) {
			this._skipNextSearchBarBlur = false
			return
		}

		this._findingInPage = state
	}

	_toggleDevTools(): void {
		const wc = this._browserWindow.webContents

		if (wc.isDevToolsOpened()) {
			wc.closeDevTools()
		} else {
			wc.openDevTools({
				mode: "undocked",
			})
		}
	}

	_toggleFullScreen(): void {
		this._browserWindow.setFullScreen(!this._browserWindow.isFullScreen())
	}

	_printMail() {
		this.desktopFacade.print()
	}

	_openFindInPage(): void {
		this.desktopFacade.openFindInPage()
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

		if (process.platform !== "linux") return
		this._setBoundsTimeout && clearTimeout(this._setBoundsTimeout)
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
			scale: 1, // turns out we can't really trust wc.getZoomFactor
		}
	}

	async _getInitialUrl(additionalQueryParams: Record<string, string | boolean>): Promise<string> {
		const url = new URL(this._startFileURLString)

		for (const [key, value] of typedEntries(additionalQueryParams)) {
			url.searchParams.append(key, String(value))
		}

		url.searchParams.append("platformId", process.platform)
		const theme = await this._themeFacade.getCurrentThemeWithFallback()
		url.searchParams.append("theme", JSON.stringify(theme))
		return url.toString()
	}
}