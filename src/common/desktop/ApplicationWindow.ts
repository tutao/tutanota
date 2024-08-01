import type { BrowserWindow, ContextMenuParams, NativeImage, Result } from "electron"
import type { WindowBounds, WindowManager } from "./DesktopWindowManager"
import url from "node:url"
import type { lazy } from "@tutao/tutanota-utils"
import { capitalizeFirstLetter, noOp, typedEntries, typedKeys } from "@tutao/tutanota-utils"
import { Keys } from "../api/common/TutanotaConstants"
import type { Key } from "../misc/KeyManager"
import path from "node:path"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { log } from "./DesktopLog"
import { parseUrlOrNull } from "./PathUtils"
import type { LocalShortcutManager } from "./electron-localshortcut/LocalShortcut"
import { DesktopThemeFacade } from "./DesktopThemeFacade"
import { CancelledError } from "../api/common/error/CancelledError"
import { DesktopFacade } from "../native/common/generatedipc/DesktopFacade.js"
import { CommonNativeFacade } from "../native/common/generatedipc/CommonNativeFacade.js"
import { RemoteBridge } from "./ipc/RemoteBridge.js"
import { InterWindowEventFacadeSendDispatcher } from "../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { handleProtocols } from "./net/ProtocolProxy.js"
import { PerWindowSqlCipherFacade } from "./db/PerWindowSqlCipherFacade.js"
import HandlerDetails = Electron.HandlerDetails

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

const VIRTUAL_APP_URL_BASE = "asset://app"
const VIRTUAL_APP_URL = VIRTUAL_APP_URL_BASE + "/index-desktop.html"

export class ApplicationWindow {
	private _desktopFacade!: DesktopFacade
	private _commonNativeFacade!: CommonNativeFacade
	private _interWindowEventSender!: InterWindowEventFacadeSendDispatcher
	private _sqlCipherFacade!: PerWindowSqlCipherFacade

	_browserWindow!: BrowserWindow

	/** User logged in in this window. Reset from WindowManager. */
	private userId: Id | null = null
	private setBoundsTimeout: ReturnType<typeof setTimeout> | null = null
	private findingInPage: boolean = false
	private skipNextSearchBarBlur: boolean = false
	private lastSearchRequest: [string, { forward: boolean; matchCase: boolean }] | null = null
	private lastSearchPromiseReject: (err: Error | null) => void
	private shortcuts: Array<LocalShortcut>
	id!: number

	constructor(
		wm: WindowManager,
		/** absolute path to web assets (html, js etc.) */
		private readonly absoluteAssetsPath: string,
		icon: NativeImage,
		private readonly electron: typeof Electron.CrossProcessExports,
		private readonly localShortcut: LocalShortcutManager,
		private readonly themeFacade: DesktopThemeFacade,
		private readonly remoteBridge: RemoteBridge,
		noAutoLogin?: boolean | null,
		preloadOverridePath?: string,
	) {
		this.lastSearchPromiseReject = noOp
		const isMac = process.platform === "darwin"
		this.shortcuts = (
			[
				{
					key: Keys.F,
					meta: isMac,
					ctrl: !isMac,
					exec: () => this.openFindInPage(),
					help: "searchPage_label",
				},
				{
					key: Keys.P,
					meta: isMac,
					ctrl: !isMac,
					exec: () => this.printMail(),
					help: "print_action",
				},
				{
					key: Keys.F12,
					exec: () => this.toggleDevTools(),
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
				{
					key: Keys.Q,
					ctrl: !isMac,
					meta: isMac,
					shift: !isMac,
					exec: () => this.electron.app.quit(),
					help: "quit_action",
				},
			] as Array<LocalShortcut>
		).concat(
			isMac
				? [
						{
							key: Keys.F,
							meta: true,
							ctrl: true,
							exec: () => this.toggleFullScreen(),
							help: "toggleFullScreen_action",
						},
				  ]
				: [
						{
							key: Keys.F11,
							exec: () => this.toggleFullScreen(),
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
							exec: () => this.tryGoBack(),
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
		log.debug(TAG, "webAssetsPath: ", this.absoluteAssetsPath)
		const preloadPath = preloadOverridePath ?? path.join(this.electron.app.getAppPath(), "./desktop/preload.js")

		this.createBrowserWindow(wm, {
			preloadPath,
			icon,
		})
		this.initFacades()

		this.loadInitialUrl(noAutoLogin ?? false)

		this.electron.Menu.setApplicationMenu(null)
	}

	get desktopFacade(): DesktopFacade {
		return this._desktopFacade
	}

	get commonNativeFacade(): CommonNativeFacade {
		return this._commonNativeFacade
	}

	get interWindowEventSender(): InterWindowEventFacadeSendDispatcher {
		return this._interWindowEventSender
	}

	private initFacades() {
		const sendingFacades = this.remoteBridge.createBridge(this)
		this._desktopFacade = sendingFacades.desktopFacade
		this._commonNativeFacade = sendingFacades.commonNativeFacade
		this._interWindowEventSender = sendingFacades.interWindowEventSender
		this._sqlCipherFacade = sendingFacades.sqlCipherFacade
	}

	private async loadInitialUrl(noAutoLogin: boolean) {
		const initialUrl = await this.getInitialUrl({
			noAutoLogin,
		})
		await this.updateBackgroundColor()

		this._browserWindow.loadURL(initialUrl)
	}

	async updateBackgroundColor() {
		const theme = await this.themeFacade.getCurrentThemeWithFallback()

		if (theme) {
			this._browserWindow.setBackgroundColor(theme.navigation_bg)
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

	private createBrowserWindow(
		wm: WindowManager,
		opts: {
			preloadPath: string
			icon: NativeImage
		},
	) {
		const { preloadPath, icon } = opts

		this._browserWindow = new this.electron.BrowserWindow({
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

		const session = this._browserWindow.webContents.session
		session.setPermissionRequestHandler((webContents, permission, callback: (_: boolean) => void) => callback(false))

		handleProtocols(session, this.absoluteAssetsPath)

		this._browserWindow.setMenuBarVisibility(false)

		this._browserWindow.removeMenu()

		this._browserWindow.setMinimumSize(MINIMUM_WINDOW_SIZE, MINIMUM_WINDOW_SIZE)

		this.id = this._browserWindow.id

		this._browserWindow
			.on("closed", async () => {
				await this.closeDb()
			})
			.on("focus", () => this.localShortcut.enableAll(this._browserWindow))
			.on("blur", (_: FocusEvent) => this.localShortcut.disableAll(this._browserWindow))

		this._browserWindow.webContents
			.on("will-attach-webview", (e) => e.preventDefault())
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
				if (this.lastSearchRequest && this.findingInPage && input.type === "keyDown" && input.key === "Enter") {
					this.skipNextSearchBarBlur = true
					const [searchTerm, options] = this.lastSearchRequest
					options.forward = true

					this._browserWindow.webContents
						.once("found-in-page", (ev, res) => {
							this._desktopFacade.applySearchResultToOverlay(res)
						})
						.findInPage(searchTerm, options)
				}
			})
			.on("did-finish-load", () => {
				// This also covers the case when window was reloaded.
				// the webContents needs to know on which channel to listen
				this.sendShortcutstoRender()
			})
			.on("did-fail-load", (evt, errorCode, errorDesc, validatedURL) => {
				log.debug(TAG, "failed to load resource: ", validatedURL, errorDesc)

				if (errorDesc === "ERR_FILE_NOT_FOUND") {
					this.getInitialUrl({
						noAutoLogin: true,
					})
						.then((initialUrl) => {
							log.debug(TAG, "redirecting to start page...", initialUrl)
							return this._browserWindow.loadURL(initialUrl)
						})
						.then(() => log.debug(TAG, "...redirected"))
				}
			})
			// @ts-ignore
			.on("remote-require", (e) => e.preventDefault())
			// @ts-ignore
			.on("remote-get-global", (e) => e.preventDefault())
			// @ts-ignore
			.on("remote-get-builtin", (e) => e.preventDefault())
			// @ts-ignore
			.on("remote-get-current-web-contents", (e) => e.preventDefault())
			// @ts-ignore
			.on("remote-get-current-window", (e) => e.preventDefault())
			.on("did-navigate", () => this._browserWindow.emit("did-navigate"))
			.on("did-navigate-in-page", () => this._browserWindow.emit("did-navigate"))
			.on("zoom-changed", (ev, direction: "in" | "out") => this._browserWindow.emit("zoom-changed", ev, direction))
			.on("update-target-url", (ev, url) => {
				this._desktopFacade.updateTargetUrl(url, VIRTUAL_APP_URL_BASE)
			})

		this._browserWindow.webContents.setWindowOpenHandler((details) => this.onNewWindow(details))

		// Shortcuts but be registered here, before "focus" or "blur" event fires, otherwise localShortcut fails
		this.reRegisterShortcuts()
	}

	async reload(queryParams: Record<string, string | boolean>) {
		await this.closeDb()
		// try to do this asap as to not get the window destroyed on us
		this.remoteBridge.unsubscribe(this._browserWindow.webContents.ipc)
		this.userId = null
		this.initFacades()
		const url = await this.getInitialUrl(queryParams)
		await this._browserWindow.loadURL(url)
	}

	private async closeDb() {
		if (this.userId) {
			log.debug(TAG, `closing offline db for userId ${this.userId}`)
			await this._sqlCipherFacade.closeDb()
		}
	}

	private onNewWindow(details: HandlerDetails): { action: "deny" } {
		const parsedUrl = parseUrlOrNull(details.url)

		if (parsedUrl == null) {
			log.warn(TAG, "Could not parse url for new-window, will not open")
		} else if (parsedUrl.protocol === "file:") {
			// this also works for raw file paths without protocol
			log.warn(TAG, "prevented file url from being opened by shell")
		} else if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
			this.electron.dialog
				.showMessageBox({
					type: "warning",
					buttons: [lang.get("yes_label"), lang.get("no_label")],
					title: lang.get("suspiciousLink_title"),
					message: lang.get("suspiciousLink_msg", { "{url}": parsedUrl.toString() }),
					defaultId: 1, // default button is "no"
				})
				.then(({ response }) => {
					if (response === 0) {
						this.doOpenLink(parsedUrl, details)
					}
				})
		} else {
			this.doOpenLink(parsedUrl, details)
		}

		return {
			action: "deny",
		}
	}

	private doOpenLink(parsedUrl: URL, details: Electron.HandlerDetails) {
		// we never open any new windows directly from the renderer
		// except for links in mails etc. so open them in the browser
		this.electron.shell.openExternal(parsedUrl.toString()).catch((e) => {
			log.warn("failed to open external url", details.url, e)
			this.electron.dialog.showMessageBox({
				title: lang.get("showURL_alt"),
				buttons: [lang.get("ok_action")],
				defaultId: 0,
				message: lang.get("couldNotOpenLink_msg", { "{link}": details.url }),
				type: "error",
			})
		})
	}

	private reRegisterShortcuts() {
		this.localShortcut.unregisterAll(this._browserWindow)

		for (const s of this.shortcuts) {
			// build the accelerator string localShortcut understands
			let shortcutString = ""
			shortcutString += s.meta ? "Command+" : ""
			shortcutString += s.ctrl ? "Control+" : ""
			shortcutString += s.alt ? "Alt+" : ""
			shortcutString += s.shift ? "Shift+" : ""
			shortcutString += capitalizeFirstLetter(typedKeys(Keys).filter((k) => s.key === Keys[k])[0])

			this.localShortcut.register(this._browserWindow, shortcutString, s.exec)
		}
	}

	private sendShortcutstoRender(): void {
		// delete exec since functions don't cross IPC anyway.
		// it will be replaced by () => true in the renderer thread
		const webShortcuts = this.shortcuts.map((s) =>
			Object.assign({}, s, {
				exec: null,
			}),
		)

		this._desktopFacade.addShortcuts(webShortcuts)
	}

	private tryGoBack(): void {
		const parsedUrl = url.parse(this._browserWindow.webContents.getURL())

		if (parsedUrl.pathname && !parsedUrl.pathname.endsWith("login")) {
			this._browserWindow.webContents.goBack()
		} else {
			log.debug(TAG, "Ignore back events on login page")
		}
	}

	async openMailBox(info: UserInfo, path?: string | null): Promise<void> {
		await this._commonNativeFacade.openMailBox(info.userId, info.mailAddress!, path ?? null)
		this.show()
	}

	// open at date?
	async openCalendar(info: UserInfo): Promise<void> {
		await this._commonNativeFacade.openCalendar(info.userId)
		this.show()
	}

	setContextMenuHandler(handler: (arg0: ContextMenuParams) => void) {
		const wc = this._browserWindow.webContents
		wc.on("context-menu", (e, params) => handler(params))
	}

	getUserId(): Id | null {
		return this.userId
	}

	setUserId(id: Id | null) {
		this.userId = id
	}

	findInPage(searchTerm: string, forward: boolean, matchCase: boolean, findNext: boolean): Promise<Result | null> {
		const options = { forward, matchCase, findNext }
		this.findingInPage = true

		if (searchTerm !== "") {
			this.lastSearchRequest = [searchTerm, options]

			this._browserWindow.webContents.findInPage(searchTerm, options)

			return new Promise((resolve: (_: Result) => void, reject) => {
				// if the last search request is still ongoing, this will reject that requests' promise
				// we obviously don't care about that requests' result since we are already handling a new one
				// if the last request is done, this is a noOp
				this.lastSearchPromiseReject(new CancelledError("search request was superseded"))

				// make sure we can cancel this promise if we get a new search request before this one is done.
				this.lastSearchPromiseReject = reject

				this._browserWindow.webContents // the last listener might not have fired yet
					.removeAllListeners("found-in-page")
					.once("found-in-page", (ev, res: Result) => {
						this.lastSearchPromiseReject = noOp
						resolve(res)
					})
			}).catch((e) => {
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
		this.findingInPage = false
		this.lastSearchRequest = null

		this._browserWindow.webContents.stopFindInPage("keepSelection")
	}

	/**
	 * make it known to the window if the search overlay is focused.
	 * used to check if enter events need to be caught to search the next result
	 * @param state whether the search bar is focused right now
	 * @param force ignores skipnextblur
	 */
	setSearchOverlayState(state: boolean, force: boolean) {
		if (!force && !state && this.skipNextSearchBarBlur) {
			this.skipNextSearchBarBlur = false
			return
		}

		this.findingInPage = state
	}

	private toggleDevTools(): void {
		const wc = this._browserWindow.webContents

		if (wc.isDevToolsOpened()) {
			wc.closeDevTools()
		} else {
			wc.openDevTools({
				mode: "undocked",
			})
		}
	}

	private toggleFullScreen(): void {
		this._browserWindow.setFullScreen(!this._browserWindow.isFullScreen())
	}

	private printMail() {
		this._desktopFacade.print()
	}

	private openFindInPage(): void {
		this._desktopFacade.openFindInPage()
	}

	setBounds(bounds: WindowBounds) {
		this._browserWindow.setFullScreen(bounds.fullscreen)

		this.setZoomFactor(bounds.scale)
		if (bounds.fullscreen) return

		this._browserWindow.setBounds(bounds.rect)

		if (process.platform !== "linux") return
		this.setBoundsTimeout && clearTimeout(this.setBoundsTimeout)
		this.setBoundsTimeout = setTimeout(() => {
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

	private async getInitialUrl(additionalQueryParams: Record<string, string | boolean>): Promise<string> {
		const url = new URL(VIRTUAL_APP_URL)

		for (const [key, value] of typedEntries(additionalQueryParams)) {
			url.searchParams.append(key, String(value))
		}

		url.searchParams.append("platformId", process.platform)
		const theme = await this.themeFacade.getCurrentThemeWithFallback()
		url.searchParams.append("theme", JSON.stringify(theme))
		return url.toString()
	}
}
