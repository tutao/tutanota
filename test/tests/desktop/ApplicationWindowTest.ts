import o from "@tutao/otest"
import n from "../nodemocker.js"
import { defer, DeferredObject, delay, downcast } from "@tutao/tutanota-utils"
import { ApplicationWindow } from "../../../src/common/desktop/ApplicationWindow.js"
import type { NativeImage } from "electron"
import type { Theme, ThemeId } from "../../../src/common/gui/theme.js"
import { WindowManager } from "../../../src/common/desktop/DesktopWindowManager.js"
import { LocalShortcutManager } from "../../../src/common/desktop/electron-localshortcut/LocalShortcut.js"
import { matchers, object, when } from "testdouble"
import { spy, verify } from "@tutao/tutanota-test-utils"
import { ThemeFacade } from "../../../src/common/native/common/generatedipc/ThemeFacade.js"
import { DesktopThemeFacade } from "../../../src/common/desktop/DesktopThemeFacade.js"
import { RemoteBridge, SendingFacades } from "../../../src/common/desktop/ipc/RemoteBridge.js"
import Rectangle = Electron.Rectangle
import BrowserWindow = Electron.BrowserWindow

const { anything } = matchers

o.spec("ApplicationWindow Test", function () {
	const electronLocalshortcut = {
		callbacks: Object.create(null),
		register: function (bw, key, cb) {
			this.callbacks[key] = cb
		},
		unregisterAll: function (key) {},
	}
	const lang = {
		lang: {
			initialized: {
				promise: {
					then: (cb) => {
						setImmediate(() => cb())
					},
				},
			},
		},
	}
	const wm = {
		ipc: {
			addWindow: () => {},
			removeWindow: () => {},
			sendRequest: () => Promise.resolve(),
			initialized: () => Promise.resolve(),
		},
		dl: {
			manageDownloadsForSession: () => {},
		},
		newWindow: () => {},
		hide: () => {},
		minimize: () => {},
		getIcon: () => icon,
	} as const
	const themeFacadeInstance = new (class implements ThemeFacade {
		async getThemePreference(): Promise<ThemeId | null> {
			return "light"
		}

		async setThemePreference(themeId: ThemeId) {}

		async getThemes(): Promise<Array<Theme>> {
			return []
		}

		async setThemes(themes: Array<Theme>) {}

		async getCurrentTheme(): Promise<Theme | null> {
			return null
		}

		async prefersDark(): Promise<boolean> {
			return false
		}

		async getCurrentThemeWithFallback(): Promise<Theme> {
			let theme = await this.getCurrentTheme()

			if (theme == null) {
				theme = {
					themeId: "light-fallback",
					content_bg: "#ffffff",
					header_bg: "#ffffff",
				} as Theme
			}

			return theme
		}
	})()
	const desktopHtml = "desktophtml"
	const icon: NativeImage = downcast(Symbol("icon"))

	const standardMocks = () => {
		const electron = {
			BrowserWindow: n.classify({
				prototype: {
					callbacks: {},
					devToolsOpened: false,
					destroyed: false,
					focused: true,
					minimized: false,
					bounds: {
						height: 0,
						width: 0,
						x: 0,
						y: 0,
					},
					fullscreen: false,
					isDestroyed: function () {
						return this.destroyed
					},
					on: function (ev: string, cb: () => void) {
						this.callbacks[ev] = cb
						return this
					},
					once: function (ev: string, cb: () => void) {
						this.callbacks[ev] = cb
						return this
					},
					emit: function (ev: string) {
						this.callbacks[ev]()
					},
					constructor: function (opts) {
						this.opts = opts
						// @ts-ignore
						this.id = electron.BrowserWindow.lastId
						// @ts-ignore
						electron.BrowserWindow.lastId = electron.BrowserWindow.lastId + 1
						this.__loadedUrl = defer()
						this.webContents = n.spyify({
							callbacks: Object.create(null),
							destroyed: false,
							zoomFactor: 1.0,
							isDestroyed: () => {
								return this.webContents.destroyed
							},
							send: (msg, val) => {},
							on: (ev: string, cb: () => void) => {
								this.webContents.callbacks[ev] = cb
								return this.webContents
							},
							once: (ev: string, cb: () => void) => {
								this.webContents.callbacks[ev] = cb
								return this.webContents
							},
							isDevToolsOpened: function () {
								return this.devToolsOpened
							},
							openDevTools: function () {
								this.devToolsOpened = true
							},
							closeDevTools: function () {
								this.devToolsOpened = false
							},
							goBack: function () {},
							goForward: function () {},
							setZoomFactor: function (n: number) {
								this.zoomFactor = n
							},
							getZoomFactor: function () {
								return 1
							},
							toggleDevTools: function () {
								this.devToolsOpened = !this.devToolsOpened
							},
							getTitle: () => "webContents Title",
							session: {
								setPermissionRequestHandler: () => {},
								setSpellCheckerDictionaryDownloadURL: () => {},
								protocol: {
									handled: true,
									isProtocolHandled: function () {
										this.handled = !this.handled
										return this.handled
									},
									handle() {
										return true
									},
								},
								on() {
									return this
								},
								removeAllListeners() {
									return this
								},
							},
							findInPage: () => {},
							stopFindInPage: () => {},
							getURL: () => "file:///path/to/app/desktophtml/meh/more",
							removeAllListeners: (k) => {
								this.webContents.callbacks[k] = []
								return this
							},

							setWindowOpenHandler(handler) {
								this.windowOpenHandler = handler
							},
						})
					},
					removeMenu: function () {},
					setMenuBarVisibility: function () {},
					setMinimumSize: function (x: number, y: number) {},
					loadURL: function (...args) {
						this.__loadedUrl.resolve(args)

						return Promise.resolve()
					},
					close: function () {},
					show: function () {},
					hide: function () {},
					center: function () {},
					showInactive: function () {},
					isFocused: function () {
						return this.focused
					},
					setFullScreen: function (fullscreen) {
						this.fullscreen = fullscreen
					},
					isFullScreen: function () {
						return this.fullscreen
					},
					isMinimized: function () {
						return this.minimized
					},
					minimize: function () {},
					focus: function () {},
					restore: function () {},
					getBounds: function () {
						return this.bounds
					},
					setBounds: function (bounds) {
						this.bounds = bounds
					},
					setPosition: function (x, y) {
						this.bounds.x = x
						this.bounds.y = y
					},
					setBackgroundColor: function () {},
				},
				statics: {
					lastId: 0,
				},
			}),
			shell: {
				openExternal: () => Promise.resolve(),
			},
			Menu: {
				setApplicationMenu: () => {},
			},
			app: {
				getAppPath: () => "/path/to/app",
				getVersion: () => "app version",
			},
		} as const
		// node modules
		type WebContentsMock = Electron.WebContents & { callbacks: any[]; devToolsOpened: boolean; destroyed: boolean }
		type BrowserWindowInstanceMock = Electron.BrowserWindow & {
			webContents: WebContentsMock
			destroyed: boolean
			__loadedUrl: DeferredObject<string>
			bounds: Rectangle
			devToolsOpened: boolean
			minimized: boolean
			focused: boolean
		}
		type BrowserWindowMock = Class<Electron.BrowserWindow> & { mockedInstances: BrowserWindowInstanceMock[]; lastId: number }
		type ElectronMock = typeof import("electron") & { BrowserWindow: BrowserWindowMock }

		const electronMock = n.mock<ElectronMock>("electron", electron).set()
		const electronLocalshortcutMock = n.mock<typeof electronLocalshortcut & LocalShortcutManager>("electron-localshortcut", electronLocalshortcut).set()
		// our modules
		const desktopTrayMock = n
			.mock("./DesktopTray.js", {
				DesktopTray: {
					getIcon: () => "this is an icon",
				},
			})
			.set()
		const langMock = n.mock("../misc/LanguageViewModel", lang).set()
		// instances
		const wmMock = n.mock<WindowManager>("__wm", wm).set()
		const themeFacade = n.mock<DesktopThemeFacade>("__themeFacade", themeFacadeInstance).set()
		const remoteBridge = object<RemoteBridge>()
		const sendingFacades: SendingFacades = {
			interWindowEventSender: object(),
			desktopFacade: object(),
			commonNativeFacade: object(),
			sqlCipherFacade: object(),
		}
		when(remoteBridge.createBridge(anything())).thenReturn(sendingFacades)
		return {
			electronMock,
			electronLocalshortcutMock,
			desktopTrayMock,
			langMock,
			wmMock,
			themeFacade,
			remoteBridge,
			desktopFacade: sendingFacades.desktopFacade,
			interWindowEventSender: sendingFacades.interWindowEventSender,
			commonNativeFacade: sendingFacades.commonNativeFacade,
			sqlCipherFacade: sendingFacades.sqlCipherFacade,
		}
	}

	o("construction", async function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()
		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		o(electronMock.BrowserWindow.mockedInstances.length).equals(1)
		const bwInstance: BrowserWindow = electronMock.BrowserWindow.mockedInstances[0]
		// We load some things async before loading URL so we wait for it. __loadedUrl comes from our mock
		await (bwInstance as any).__loadedUrl.promise
		o(bwInstance.loadURL.callCount).equals(1)
		const theme = await themeFacade.getCurrentThemeWithFallback()
		const themeJson = JSON.stringify(theme)
		const query = new URLSearchParams({
			noAutoLogin: "false",
			platformId: process.platform,
			theme: themeJson,
		})
		o(bwInstance.loadURL.args[0]).equals(`asset://app/index-desktop.html?${query.toString()}`)
		o((bwInstance as any).opts).deepEquals({
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
				enableRemoteModule: false,
				allowRunningInsecureContent: false,
				preload: "/path/to/app/desktop/preload.js",
				spellcheck: true,
				webgl: false,
				plugins: false,
				experimentalFeatures: false,
				webviewTag: false,
				disableDialogs: true,
				navigateOnDragDrop: false,
				autoplayPolicy: "user-gesture-required",
				enableWebSQL: false,
			},
		})
		o(bwInstance.setMenuBarVisibility.callCount).equals(1)
		o(bwInstance.setMenuBarVisibility.args[0]).equals(false)
		o(bwInstance.removeMenu.callCount).equals(1)
		o(Object.keys((bwInstance.webContents as any).callbacks)).deepEquals([
			"will-attach-webview",
			"will-navigate",
			"before-input-event",
			"did-finish-load",
			"did-fail-load",
			"remote-require",
			"remote-get-global",
			"remote-get-builtin",
			"remote-get-current-web-contents",
			"remote-get-current-window",
			"did-navigate",
			"did-navigate-in-page",
			"zoom-changed",
			"update-target-url",
		])("webContents registered callbacks dont match")
		o(bwInstance.webContents.session.protocol.handle.callCount).equals(3)
	})
	o("construction, noAutoLogin", async function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()
		// noAutoLogin=true
		const w2 = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge, true)
		const bwInstance2 = electronMock.BrowserWindow.mockedInstances[0]
		await bwInstance2.__loadedUrl.promise
		o(bwInstance2.loadURL.callCount).equals(1)
		const themeJson = JSON.stringify(await themeFacade.getCurrentThemeWithFallback())
		const url = new URL(bwInstance2.loadURL.args[0])
		o(url.searchParams.get("noAutoLogin")).equals("true")
		o(url.searchParams.get("platformId")).equals(process.platform)
		o(url.searchParams.get("theme")).equals(themeJson)
	})

	o("redirect to start page after failing to load a page due to 404", async function () {
		const { wmMock, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()
		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		await bwInstance.__loadedUrl.promise
		bwInstance.__loadedUrl = defer()
		bwInstance.webContents.callbacks["did-fail-load"]({}, -6, "ERR_FILE_NOT_FOUND")
		await bwInstance.__loadedUrl.promise
		o(bwInstance.loadURL.callCount).equals(2)
		const themeJson = JSON.stringify(await themeFacade.getCurrentThemeWithFallback())
		const url = new URL(bwInstance.loadURL.args[0])
		o(url.searchParams.get("noAutoLogin")).equals("true")
		o(url.searchParams.get("theme")).equals(themeJson)
		downcast(w._browserWindow.webContents).callbacks["did-fail-load"]({}, -6, "ERR_SOME_OTHER_ONE")
		await delay(10)
		o(bwInstance.loadURL.callCount).equals(2)
	})

	o("shortcut creation, linux", function () {
		n.setPlatform("linux")
		const { electronLocalshortcutMock, wmMock, electronMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		downcast(w._browserWindow.webContents).callbacks["did-finish-load"]()
		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			"Control+F",
			"Control+P",
			"F12",
			"Control+0",
			"Control+Shift+Q",
			"F11",
			"Alt+Right",
			"Alt+Left",
			"Control+H",
			"Control+N",
		])
	})
	o("shortcut creation, windows", function () {
		n.setPlatform("win32")
		const { electronLocalshortcutMock, wmMock, electronMock, themeFacade, remoteBridge } = standardMocks()
		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		downcast(w._browserWindow.webContents).callbacks["did-finish-load"]()
		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			"Control+F",
			"Control+P",
			"F12",
			"Control+0",
			"Control+Shift+Q",
			"F11",
			"Alt+Right",
			"Alt+Left",
			"Control+H",
			"Control+N",
		])
	})
	o("shortcut creation, mac", function () {
		n.setPlatform("darwin")
		const { electronLocalshortcutMock, wmMock, electronMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		downcast(w._browserWindow.webContents).callbacks["did-finish-load"]()
		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals(["Command+F", "Command+P", "F12", "Command+0", "Command+Q", "Command+Control+F"])
	})

	function testShortcut(shortcuts: Array<string>, assertion: (sm: ReturnType<typeof standardMocks>) => void) {
		o("[" + shortcuts.join(" >> ") + "]", async function () {
			const sm = standardMocks()
			const { electronMock, electronLocalshortcutMock, wmMock, themeFacade, remoteBridge } = sm

			const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			;(bwInstance.webContents as any).callbacks["did-finish-load"]()
			// ApplicationWindow waits for IPC and this is a reliable way to also wait for it
			for (const shortcut of shortcuts) {
				electronLocalshortcutMock.callbacks[shortcut]()
			}
			assertion(sm)
		})
	}

	o.spec("shortcuts are used, linux & win", function () {
		o.beforeEach(() => n.setPlatform("linux"))
		testShortcut(["Control+F"], ({ desktopFacade }) => {
			verify(desktopFacade.openFindInPage())
		})
		testShortcut(["Control+P"], ({ desktopFacade }) => {
			verify(desktopFacade.print())
		})
		testShortcut(["F12"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.webContents.isDevToolsOpened.callCount).equals(1)
			o(bwInstance.webContents.openDevTools.callCount).equals(1)
			o(bwInstance.webContents.closeDevTools.callCount).equals(0)
			bwInstance.webContents.devToolsOpened = true
		})
		testShortcut(["F12", "F12"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.webContents.isDevToolsOpened.callCount).equals(2)
			o(bwInstance.webContents.openDevTools.callCount).equals(1)
			o(bwInstance.webContents.closeDevTools.callCount).equals(1)
		})

		testShortcut(["Control+H"], ({ wmMock }) => o(wmMock.minimize.callCount).equals(1))
		testShortcut(["Control+N"], ({ wmMock }) => {
			o(wmMock.newWindow.callCount).equals(1)
			o(wmMock.newWindow.args[0]).equals(true)
		})
		testShortcut(["F11"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.setFullScreen.callCount).equals(1)
			o(bwInstance.isFullScreen.callCount).equals(1)
			o(bwInstance.setFullScreen.args[0]).equals(true)
		})
		testShortcut(["Alt+Left"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.webContents.goBack.callCount).equals(1)
		})
		testShortcut(["Alt+Right"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.webContents.goForward.callCount).equals(1)
		})
	})

	o.spec("shortcuts are used, mac", function () {
		o.beforeEach(() => n.setPlatform("darwin"))
		testShortcut(["Command+F"], ({ desktopFacade }) => {
			verify(desktopFacade.openFindInPage())
		})
		testShortcut(["Command+P"], ({ desktopFacade }) => {
			verify(desktopFacade.print())
		})
		testShortcut(["F12"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.webContents.isDevToolsOpened.callCount).equals(1)
			o(bwInstance.webContents.openDevTools.callCount).equals(1)
			o(bwInstance.webContents.closeDevTools.callCount).equals(0)
			bwInstance.webContents.devToolsOpened = true
		})
		testShortcut(["F12", "F12"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.webContents.isDevToolsOpened.callCount).equals(2)
			o(bwInstance.webContents.openDevTools.callCount).equals(1)
			o(bwInstance.webContents.closeDevTools.callCount).equals(1)
		})
		testShortcut(["Command+Control+F"], ({ electronMock }) => {
			const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
			o(bwInstance.setFullScreen.callCount).equals(1)
			o(bwInstance.isFullScreen.callCount).equals(1)
			o(bwInstance.setFullScreen.args[0]).equals(true)
		})
	})

	o("shortcuts are set on window reload", async function () {
		n.setPlatform("linux")
		const { electronMock, electronLocalshortcutMock, wmMock, themeFacade, remoteBridge, desktopFacade } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		bwInstance.webContents.callbacks["did-finish-load"]()
		verify(desktopFacade.addShortcuts(anything()))
		// Simulating reload from here
		// Reset IPC
		const initialized = defer<void>()

		bwInstance.webContents.callbacks["did-finish-load"]()
		// Init IPC
		initialized.resolve()
		await initialized.promise
		// Shortcuts should be added again because page has been reloaded
		verify(desktopFacade.addShortcuts(anything()))
	})

	o("will-navigate", function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()

		const e = {
			preventDefault: spy(),
		}
		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		bwInstance.webContents.callbacks["will-navigate"](e, "http://test.com")
		o(e.preventDefault.callCount).equals(1)("Prevent default is called")
	})

	o("attaching webView is denied", function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		const e = {
			preventDefault: spy(),
		}
		bwInstance.webContents.callbacks["will-attach-webview"](e)
		o(e.preventDefault.callCount).equals(1)
		let threw = false

		try {
			bwInstance.webContents.callbacks["will-attach-webview"]()
		} catch (e) {
			threw = true
		}

		o(threw).equals(true)
	})

	o.spec("new window is redirected to openExternal", function () {
		let electronMock
		let bwInstance
		o.beforeEach(function () {
			const sm = standardMocks()
			electronMock = sm.electronMock
			let { wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = sm

			new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
			bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		})
		o("not url is not redirected", function () {
			const url = "ba/\\.nanas"
			const result = bwInstance.webContents.windowOpenHandler({
				url,
				frameName: "frameName",
				features: "",
				disposition: "default",
				referrer: {},
			})
			o(result).deepEquals({
				action: "deny",
			})
			o(electronMock.shell.openExternal.callCount).equals(0)
		})
		o("url without protocol is not redirected", function () {
			const url = "dies.ist.ne/url"
			const result = bwInstance.webContents.windowOpenHandler({
				url,
				frameName: "frameName",
				features: "",
				disposition: "default",
				referrer: {},
			})
			o(result).deepEquals({
				action: "deny",
			})
			o(electronMock.shell.openExternal.callCount).equals(0)
		})
		o("http url is redirected", function () {
			const url = "http://example.com"
			const result = bwInstance.webContents.windowOpenHandler({
				url,
				frameName: "frameName",
				features: "",
				disposition: "default",
				referrer: {},
			})
			o(result).deepEquals({
				action: "deny",
			})
			o(electronMock.shell.openExternal.callCount).equals(1)
			o(electronMock.shell.openExternal.args[0]).equals("http://example.com/")
		})
		o("file url is not opened nor redirected", function () {
			const url = "file:///etc/shadow"
			const result = bwInstance.webContents.windowOpenHandler({
				url,
				frameName: "frameName",
				features: "",
				disposition: "default",
				referrer: {},
			})
			o(result).deepEquals({
				action: "deny",
			})
			o(electronMock.shell.openExternal.callCount).equals(0)
		})
	})

	o("context-menu is passed to handler", function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const handlerMock = n.spyify(() => {})
		w.setContextMenuHandler(handlerMock)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		const e = {
			preventDefault: spy(),
		}
		bwInstance.webContents.callbacks["context-menu"](e, {
			linkURL: "dies.ist.ne/url",
			editFlags: "someflags",
		})
		o(bwInstance.webContents.send.callCount).equals(0)
		o(e.preventDefault.callCount).equals(0)
		o(handlerMock.callCount).equals(1)
		o(handlerMock.args).deepEquals([
			{
				linkURL: "dies.ist.ne/url",
				editFlags: "someflags",
			},
		])
	})
	o("openMailbox sends mailbox info and shows window", async function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge, commonNativeFacade } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		w.openMailBox(
			{
				userId: "userId",
				mailAddress: "a@b.c",
			},
			"path",
		)
		await delay(10)
		verify(commonNativeFacade.openMailBox("userId", "a@b.c", "path"))
		o(electronMock.BrowserWindow.mockedInstances[0].show.callCount).equals(1)
	})
	o("setBounds and getBounds", async function () {
		o.timeout(300)
		n.setPlatform("linux")
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		o(w.getBounds()).deepEquals({
			rect: {
				height: 0,
				width: 0,
				x: 0,
				y: 0,
			},
			fullscreen: false,
			scale: 1,
		})
		w.setBounds({
			rect: {
				width: 1,
				height: 1,
				x: 1,
				y: 1,
			},
			fullscreen: false,
			scale: 2,
		})
		o(w.getBounds()).deepEquals({
			rect: {
				width: 1,
				height: 1,
				x: 1,
				y: 1,
			},
			fullscreen: false,
			scale: 1,
		})
		w.setBounds({
			rect: {
				width: 0,
				height: 0,
				x: 0,
				y: 0,
			},
			fullscreen: true,
			scale: 1,
		})
		o(w.getBounds()).deepEquals({
			rect: {
				width: 1,
				height: 1,
				x: 1,
				y: 1,
			},
			fullscreen: true,
			scale: 1,
		})
		w.setBounds({
			rect: {
				width: 0,
				height: 0,
				x: 0,
				y: 0,
			},
			fullscreen: false,
			scale: 0.5,
		})
		electronMock.BrowserWindow.mockedInstances[0].bounds = {
			width: 0,
			height: 0,
			x: 0,
			y: 10,
		}
		await delay(250)
		// this is needed because of linux DEs moving windows after the fact and us correcting it
		// see ApplicationWindow.js
		o(w.getBounds()).deepEquals({
			rect: {
				width: 0,
				height: 0,
				x: 0,
				y: -10,
			},
			fullscreen: false,
			scale: 1,
		})
	})

	o("findInPage, setSearchOverlayState & stopFindInPage", function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const wcMock = electronMock.BrowserWindow.mockedInstances[0].webContents
		w.stopFindInPage()
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals("keepSelection")
		w.findInPage("searchTerm", false, false, true)
		o(wcMock.findInPage.callCount).equals(1)
		o(wcMock.findInPage.args[0]).equals("searchTerm")
		o(wcMock.findInPage.args[1]).deepEquals({
			forward: false,
			matchCase: false,
			findNext: true,
		})
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals("keepSelection")
		// enter keys get caught
		wcMock.callbacks["before-input-event"](
			{},
			{
				type: "keyDown",
				key: "Enter",
			},
		)
		o(wcMock.findInPage.callCount).equals(2)
		o(wcMock.findInPage.args[1]).deepEquals({
			forward: true,
			matchCase: false,
			findNext: true,
		})
		// don't react to key when search overlay is unfocused
		w.setSearchOverlayState(false, true)
		wcMock.callbacks["before-input-event"](
			{},
			{
				type: "keyDown",
				key: "Enter",
			},
		)
		o(wcMock.findInPage.callCount).equals(2)
		// empty search term shouldn't be searched
		w.findInPage("", false, false, true)
		o(wcMock.findInPage.callCount).equals(2)
		o(wcMock.findInPage.args[0]).equals("searchTerm")
		o(wcMock.findInPage.args[1]).deepEquals({
			forward: true,
			matchCase: false,
			findNext: true,
		})
		o(wcMock.stopFindInPage.callCount).equals(2)
		o(wcMock.stopFindInPage.args[0]).equals("keepSelection")
	})

	o("show", function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const bwMock = electronMock.BrowserWindow.mockedInstances[0]
		o(bwMock.devToolsOpened).equals(false)
		w.show()
		o(bwMock.devToolsOpened).equals(false)
		o(bwMock.show.callCount).equals(1)
		bwMock.devToolsOpened = true
		w.show()
		o(bwMock.devToolsOpened).equals(true)
		o(bwMock.show.callCount).equals(2)
		bwMock.devToolsOpened = false
		bwMock.minimized = true
		w.show()
		o(bwMock.devToolsOpened).equals(false)
		o(bwMock.restore.callCount).equals(1)
		bwMock.devToolsOpened = true
		w.show()
		o(bwMock.devToolsOpened).equals(true)
		o(bwMock.restore.callCount).equals(2)
		bwMock.focused = false
		w.show()
		o(bwMock.focus.callCount).equals(0)
		o(bwMock.restore.callCount).equals(3)
		bwMock.minimized = false
		w.show()
		o(bwMock.focus.callCount).equals(1)
		o(bwMock.restore.callCount).equals(3)
	})
	o("on, once, getTitle, setZoomFactor, isFullScreen, isMinimized, minimize, hide, center, showInactive, isFocused", function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		let f = () => {}

		w.on(downcast("one-event"), f)
		o(bwInstance.on.callCount).equals(4) // initial + now

		o(bwInstance.on.args[0]).equals("one-event")
		o(bwInstance.on.args[1]).equals(f)
		w.once(downcast("two-event"), f)
		o(bwInstance.once.callCount).equals(1)
		o(bwInstance.once.args[0]).equals("two-event")
		o(bwInstance.once.args[1]).equals(f)
		o(w.getTitle()).equals("webContents Title")
		o(bwInstance.webContents.getTitle.callCount).equals(1)
		o(bwInstance.webContents.getTitle.args).deepEquals([])
		w.setZoomFactor(42.42)
		o(bwInstance.webContents.zoomFactor).equals(42.42)
		o(w.isFullScreen()).equals(false)
		o(bwInstance.isFullScreen.callCount).equals(1)
		o(w.isMinimized()).equals(false)
		o(bwInstance.isMinimized.callCount).equals(1)
		w.minimize()
		o(bwInstance.minimize.callCount).equals(1)
		w.hide()
		o(bwInstance.hide.callCount).equals(1)
		w.center()
		o(bwInstance.center.callCount).equals(1)
		w.showInactive()
		o(bwInstance.showInactive.callCount).equals(1)
		o(w.isFocused()).equals(true)
		o(bwInstance.isFocused.callCount).equals(1)
	})

	o("when closing, database is closed", function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge, sqlCipherFacade } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const userId = "123"
		w.setUserId(userId)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		;(bwInstance as any).callbacks["closed"]()

		verify(sqlCipherFacade.closeDb())
	})

	o("when reloading, database is closed", async function () {
		const { electronMock, wmMock, electronLocalshortcutMock, themeFacade, remoteBridge, sqlCipherFacade } = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeFacade, remoteBridge)
		const userId = "123"
		w.setUserId(userId)

		await w.reload({})

		verify(sqlCipherFacade.closeDb())
	})
})
