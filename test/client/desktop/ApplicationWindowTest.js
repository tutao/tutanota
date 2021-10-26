// @flow
import o from "ospec"
import n from "../nodemocker"
import {defer, downcast} from "@tutao/tutanota-utils"
import {ApplicationWindow} from "../../../src/desktop/ApplicationWindow"
import type {NativeImage} from "electron"
import {ThemeManager} from "../../../src/desktop/ThemeManager"
import type {Theme, ThemeId} from "../../../src/gui/theme"
import {DesktopConfig} from "../../../src/desktop/config/DesktopConfig"
import {delay} from "@tutao/tutanota-utils"


const U2F_EXTENSION_ID = "kmendfapggjehodndflmmgagdbamhnfd" // check u2f-api.js

o.spec("ApplicationWindow Test", function () {
	const electronLocalshortcut = {
		callbacks: Object.create(null),
		register: function (bw, key, cb) {
			this.callbacks[key] = cb
		},
		unregisterAll: function (key) {}
	}
	const lang = {
		lang: {
			initialized: {
				promise: {
					then: (cb) => {
						setImmediate(() => cb())
					}
				}
			}
		}
	}
	const wm = {
		ipc: {
			addWindow: () => {
			},
			removeWindow: () => {},
			sendRequest: () => Promise.resolve(),
			initialized: () => Promise.resolve()
		},
		dl: {
			manageDownloadsForSession: () => {
			}
		},
		newWindow: () => {
		},
		hide: () => {},
		minimize: () => {},
		getIcon: () => icon
	}

	const themeManager = new class extends ThemeManager {
		constructor() {
			super(downcast<DesktopConfig>({}))
		}

		async getSelectedThemeId(): Promise<?ThemeId> {
			return "light"
		}

		async setSelectedThemeId(themeId: ThemeId) {
		}

		async getThemes(): Promise<Array<Theme>> {
			return []
		}

		async setThemes(themes: Array<Theme>) {
		}

		async getCurrentTheme(): Promise<?Theme> {
			return null
		}

		async getCurrentThemeWithFallback(): Promise<Theme> {
			let theme = await this.getCurrentTheme()
			if (theme == null) {
				theme = {
					themeId: "light-fallback",
					content_bg: "#ffffff",
					header_bg: "#ffffff",
				}
			}
			return downcast<Theme>(theme)
		}
	}

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
					bounds: {height: 0, width: 0, x: 0, y: 0},
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
						this.id = electron.BrowserWindow.lastId
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
							goBack: function () {
							},
							goForward: function () {
							},
							setZoomFactor: function (n: number) {
								this.zoomFactor = n
							},
							getZoomFactor: function () {
								return 1
							},
							toggleDevTools: function () {
								this.devToolsOpened = !this.devToolsOpened
							},
							getTitle: () => 'webContents Title',
							session: {
								setPermissionRequestHandler: () => {
								},
								setSpellCheckerDictionaryDownloadURL: () => {

								}
							},
							findInPage: () => {
							},
							stopFindInPage: () => {
							},
							getURL: () => 'file:///path/to/app/desktophtml/meh/more',
							removeAllListeners: (k) => {
								this.webContents.callbacks[k] = []
								return this
							},
							setWindowOpenHandler(handler) {
								this.windowOpenHandler = handler
							},
						})
					},
					removeMenu: function () {

					},
					setMenuBarVisibility: function () {
					},
					setMinimumSize: function (x: number, y: number) {

					},
					loadURL: function (...args) {
						this.__loadedUrl.resolve(args)
						return Promise.resolve()
					},
					close: function () {
					},
					show: function () {
					},
					hide: function () {
					},
					center: function () {
					},
					showInactive: function () {
					},
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
					minimize: function () {
					},
					focus: function () {
					},
					restore: function () {
					},
					getBounds: function () {
						return this.bounds
					},
					setBounds: function (bounds) {
						this.bounds = bounds
					},
					setPosition: function (x, y) {
						this.bounds.x = x;
						this.bounds.y = y
					},
					setBackgroundColor: function () {

					},
				},
				statics: {
					lastId: 0
				},
			}),
			shell: {
				openExternal: () => {
				},
			},
			Menu: {
				setApplicationMenu: () => {
				}
			},
			app: {
				getAppPath: () => "/path/to/app",
				getVersion: () => "app version"
			},
		}
		// node modules
		const electronMock = n.mock("electron", electron).set()
		const electronLocalshortcutMock = n.mock("electron-localshortcut", electronLocalshortcut).set()

		// our modules
		const desktopTrayMock = n.mock("./DesktopTray.js", {DesktopTray: {getIcon: () => "this is an icon"}}).set()
		const langMock = n.mock("../misc/LanguageViewModel", lang).set()

		// instances
		const wmMock = n.mock('__wm', wm).set()

		const themeManagerMock = n.mock('__themeManager', themeManager).set()

		return {
			electronMock,
			electronLocalshortcutMock,
			desktopTrayMock,
			langMock,
			wmMock,
			themeManagerMock
		}
	}

	o("construction", async function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		o(electronMock.BrowserWindow.mockedInstances.length).equals(1)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		// We load some things async before loading URL so we wait for it. __loadedUrl comes from our mock
		await bwInstance.__loadedUrl.promise
		o(bwInstance.loadURL.callCount).equals(1)
		const theme = await themeManager.getCurrentThemeWithFallback()
		const themeJson = JSON.stringify(theme)
		const query = new URLSearchParams({theme: themeJson})
		o(bwInstance.loadURL.args[0])
			.equals(`file:///path/to/app/desktophtml?${query.toString()}`)
		o(bwInstance.opts).deepEquals({
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
				preload: '/path/to/app/desktop/preload.js',
				spellcheck: true,
				webgl: false,
				plugins: false,
				experimentalFeatures: false,
				webviewTag: false,
				disableDialogs: true,
				navigateOnDragDrop: false,
				autoplayPolicy: 'user-gesture-required',
				enableWebSQL: false,
			}
		})
		o(bwInstance.setMenuBarVisibility.callCount).equals(1)
		o(bwInstance.setMenuBarVisibility.args[0]).equals(false)
		o(bwInstance.removeMenu.callCount).equals(1)

		o(wmMock.ipc.addWindow.callCount).equals(1)
		o(wmMock.ipc.addWindow.args[0]).equals(w.id)

		o(wmMock.dl.manageDownloadsForSession.callCount).equals(1)
		o(wmMock.dl.manageDownloadsForSession.args[0]).equals(bwInstance.webContents.session)

		o(Object.keys(bwInstance.callbacks)).deepEquals(['closed', 'focus', 'blur'])
		o(Object.keys(bwInstance.webContents.callbacks)).deepEquals([
			'will-attach-webview',
			'will-navigate',
			'before-input-event',
			'did-finish-load',
			'did-fail-load',
			'remote-require',
			'remote-get-global',
			'remote-get-builtin',
			'remote-get-current-web-contents',
			'remote-get-current-window',
			'did-navigate',
			'did-navigate-in-page',
			'zoom-changed',
			'update-target-url'
		])("webContents registered callbacks dont match")

	})

	o("construction, noAutoLogin", async function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()

		// noAutoLogin=true
		const w2 = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl", true)
		const bwInstance2 = electronMock.BrowserWindow.mockedInstances[0]
		await bwInstance2.__loadedUrl.promise
		o(bwInstance2.loadURL.callCount).equals(1)
		const themeJson = JSON.stringify(await themeManagerMock.getCurrentThemeWithFallback())
		const url = new URL(bwInstance2.loadURL.args[0])
		o(url.searchParams.get("noAutoLogin")).equals("true")
		o(url.searchParams.get("theme")).equals(themeJson)
		o(wmMock.ipc.addWindow.args[0]).equals(w2.id)
	})

	o("redirect to start page after failing to load a page due to 404", async function () {
		const {wmMock, electronMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		await bwInstance.__loadedUrl.promise
		bwInstance.__loadedUrl = defer()

		downcast(w._browserWindow.webContents).callbacks['did-fail-load']({}, -6, 'ERR_FILE_NOT_FOUND')

		await bwInstance.__loadedUrl.promise

		o(bwInstance.loadURL.callCount).equals(2)

		const themeJson = JSON.stringify(await themeManagerMock.getCurrentThemeWithFallback())
		const url = new URL(bwInstance.loadURL.args[0])
		o(url.searchParams.get("noAutoLogin")).equals('true')
		o(url.searchParams.get("theme")).equals(themeJson)

		downcast(w._browserWindow.webContents).callbacks['did-fail-load']({}, -6, 'ERR_SOME_OTHER_ONE')
		await delay(10)
		o(bwInstance.loadURL.callCount).equals(2)
	})

	o("shortcut creation, linux", function () {
		n.setPlatform("linux")
		const {electronLocalshortcutMock, wmMock, electronMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		downcast(w._browserWindow.webContents).callbacks['did-finish-load']()

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'Control+F',
			'Control+P',
			'F12',
			'Control+0',
			'F11',
			'Alt+Right',
			'Alt+Left',
			'Control+H',
			'Control+N',
		])
	})

	o("shortcut creation, windows", function () {
		n.setPlatform('win32')
		const {electronLocalshortcutMock, wmMock, electronMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		downcast(w._browserWindow.webContents).callbacks['did-finish-load']()

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'Control+F',
			'Control+P',
			'F12',
			'Control+0',
			'F11',
			'Alt+Right',
			'Alt+Left',
			'Control+H',
			'Control+N',
		])
	})

	o("shortcut creation, mac", function () {
		n.setPlatform('darwin')
		const {electronLocalshortcutMock, wmMock, electronMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		downcast(w._browserWindow.webContents).callbacks['did-finish-load']()

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'Command+F',
			'Command+P',
			'F12',
			'Command+0',
			'Command+Control+F',
		])
	})

	o("shortcuts are used, linux & win", async function () {
		n.setPlatform('linux')
		const {electronMock, electronLocalshortcutMock, wmMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		bwInstance.webContents.callbacks['did-finish-load']()
		// ApplicationWindow waits for IPC and this is a reliable way to also wait for it
		await wmMock.ipc.initialized()

		// call all the shortcut callbacks
		electronLocalshortcutMock.callbacks["Control+F"]()
		o(wmMock.ipc.sendRequest.callCount).equals(2)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'openFindInPage', []])


		electronLocalshortcutMock.callbacks["Control+P"]()
		o(wmMock.ipc.sendRequest.callCount).equals(3)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'print', []])

		electronLocalshortcutMock.callbacks["F12"]()
		o(bwInstance.webContents.isDevToolsOpened.callCount).equals(1)
		o(bwInstance.webContents.openDevTools.callCount).equals(1)
		o(bwInstance.webContents.closeDevTools.callCount).equals(0)

		bwInstance.webContents.devToolsOpened = true
		electronLocalshortcutMock.callbacks["F12"]()
		o(bwInstance.webContents.isDevToolsOpened.callCount).equals(2)
		o(bwInstance.webContents.openDevTools.callCount).equals(1)
		o(bwInstance.webContents.closeDevTools.callCount).equals(1)


		electronLocalshortcutMock.callbacks["Control+H"]()
		o(wmMock.minimize.callCount).equals(1)

		electronLocalshortcutMock.callbacks["Control+N"]()
		o(wmMock.newWindow.callCount).equals(1)
		o(wmMock.newWindow.args[0]).equals(true)

		electronLocalshortcutMock.callbacks["F11"]()
		o(bwInstance.setFullScreen.callCount).equals(1)
		o(bwInstance.isFullScreen.callCount).equals(1)
		o(bwInstance.setFullScreen.args[0]).equals(true)

		electronLocalshortcutMock.callbacks["Alt+Left"]()
		o(bwInstance.webContents.goBack.callCount).equals(1)

		electronLocalshortcutMock.callbacks["Alt+Right"]()
		o(bwInstance.webContents.goForward.callCount).equals(1)
	})

	o("shortcuts are set on window reload", async function () {
		n.setPlatform('linux')
		const {electronMock, electronLocalshortcutMock, wmMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		o(wmMock.ipc.sendRequest.callCount).equals(0)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		bwInstance.webContents.callbacks['did-finish-load']()
		o(wmMock.ipc.sendRequest.callCount).equals(0)
		// ApplicationWindow waits for IPC and this is a reliable way to also wait for it
		await wmMock.ipc.initialized()
		o(wmMock.ipc.sendRequest.callCount).equals(1)
		o(wmMock.ipc.sendRequest.calls[0].args[1]).equals("addShortcuts")

		// Simulating reload from here
		// Reset IPC
		const initialized = defer()
		wmMock.ipc.initialized = () => initialized.promise
		bwInstance.webContents.callbacks['did-finish-load']()
		// Still equals 1, ipc is not ready yet
		o(wmMock.ipc.sendRequest.callCount).equals(1)

		// Init IPC
		initialized.resolve()
		await initialized.promise

		// Shortcuts should be added again because page has been reloaded
		o(wmMock.ipc.sendRequest.callCount).equals(2)
		o(wmMock.ipc.sendRequest.calls[1].args[1]).equals("addShortcuts")
	})

	o("shortcuts are used, mac", async function () {
		n.setPlatform('darwin')
		const {electronMock, electronLocalshortcutMock, wmMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		bwInstance.webContents.callbacks['did-finish-load']()
		await wmMock.ipc.initialized()

		// call all the shortcut callbacks
		electronLocalshortcutMock.callbacks["Command+F"]()
		o(wmMock.ipc.sendRequest.callCount).equals(2)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'openFindInPage', []])


		electronLocalshortcutMock.callbacks["Command+P"]()
		o(wmMock.ipc.sendRequest.callCount).equals(3)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'print', []])

		electronLocalshortcutMock.callbacks["F12"]()
		o(bwInstance.webContents.isDevToolsOpened.callCount).equals(1)
		o(bwInstance.webContents.openDevTools.callCount).equals(1)
		o(bwInstance.webContents.closeDevTools.callCount).equals(0)

		bwInstance.webContents.devToolsOpened = true
		electronLocalshortcutMock.callbacks["F12"]()
		o(bwInstance.webContents.isDevToolsOpened.callCount).equals(2)
		o(bwInstance.webContents.openDevTools.callCount).equals(1)
		o(bwInstance.webContents.closeDevTools.callCount).equals(1)


		electronLocalshortcutMock.callbacks["Command+Control+F"]()
		o(bwInstance.setFullScreen.callCount).equals(1)
		o(bwInstance.isFullScreen.callCount).equals(1)
		o(bwInstance.setFullScreen.args[0]).equals(true)
	})

	o("will-navigate", function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()
		const e = {preventDefault: o.spy()}

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		bwInstance.webContents.callbacks['will-navigate'](e, "http://test.com")
		o(e.preventDefault.callCount).equals(1)("Prevent default is called")

	})

	o("attaching webView is denied", function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		const e = {preventDefault: o.spy()}
		bwInstance.webContents.callbacks['will-attach-webview'](e)
		o(e.preventDefault.callCount).equals(1)
		let threw = false
		try {
			bwInstance.webContents.callbacks['will-attach-webview']()
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
			let {wmMock, electronLocalshortcutMock, themeManagerMock} = sm


			new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
			bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		})

		o("not url is not redirected", function () {
			const url = 'ba/\\.nanas'

			const result = bwInstance.webContents.windowOpenHandler({
				url,
				frameName: "frameName",
				features: "",
				disposition: "default",
				referrer: {},
			})

			o(result).deepEquals({action: "deny"})
			o(electronMock.shell.openExternal.callCount).equals(0)
		})

		o("url without protocol is not redirected", function () {
			const url = 'dies.ist.ne/url'

			const result = bwInstance.webContents.windowOpenHandler({
				url,
				frameName: "frameName",
				features: "",
				disposition: "default",
				referrer: {},
			})

			o(result).deepEquals({action: "deny"})
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

			o(result).deepEquals({action: "deny"})
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

			o(result).deepEquals({action: "deny"})
			o(electronMock.shell.openExternal.callCount).equals(0)
		})
	})

	o("sendMessageToWebContents checks if webContents is there", async function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		let args = {p: 'args'}
		await w.sendMessageToWebContents(args)
		o(bwInstance.isDestroyed.callCount).equals(1)
		o(bwInstance.webContents.isDestroyed.callCount).equals(1)
		o(bwInstance.webContents.send.callCount).equals(1)

		args = undefined
		await w.sendMessageToWebContents(args)
		o(bwInstance.isDestroyed.callCount).equals(2)
		o(bwInstance.webContents.isDestroyed.callCount).equals(2)
		o(bwInstance.webContents.send.callCount).equals(2)

		args = []
		await w.sendMessageToWebContents(args)
		o(bwInstance.isDestroyed.callCount).equals(3)
		o(bwInstance.webContents.isDestroyed.callCount).equals(3)
		o(bwInstance.webContents.send.callCount).equals(3)

		let args2 = "hello"
		bwInstance.webContents.destroyed = true
		await w.sendMessageToWebContents(args2)
		o(bwInstance.isDestroyed.callCount).equals(4)
		o(bwInstance.webContents.isDestroyed.callCount).equals(4)
		o(bwInstance.webContents.send.callCount).equals(3)

		bwInstance.destroyed = true
		await w.sendMessageToWebContents(args2)
		o(bwInstance.isDestroyed.callCount).equals(5)
		o(bwInstance.webContents.isDestroyed.callCount).equals(4)
		o(bwInstance.webContents.send.callCount).equals(3)
	})

	o("context-menu is passed to handler", function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()
		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		const handlerMock = n.spyify(() => {})
		w.setContextMenuHandler(handlerMock)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		const e = {preventDefault: o.spy()}
		bwInstance.webContents.callbacks['context-menu'](e, {linkURL: 'dies.ist.ne/url', editFlags: "someflags"})

		o(bwInstance.webContents.send.callCount).equals(0)
		o(e.preventDefault.callCount).equals(0)

		o(handlerMock.callCount).equals(1)
		o(handlerMock.args).deepEquals([{linkURL: 'dies.ist.ne/url', editFlags: "someflags"}])
	})

	o("openMailbox sends mailbox info and shows window", function (done) {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		w.openMailBox({userId: "userId", mailAddress: "a@b.c"}, "path")

		setTimeout(() => {
			o(wmMock.ipc.initialized.callCount).equals(1)
			o(wmMock.ipc.initialized.args[0]).equals(w.id)
			o(wmMock.ipc.sendRequest.callCount).equals(1)
			o(wmMock.ipc.sendRequest.args[0]).equals(w.id)
			o(wmMock.ipc.sendRequest.args[1]).equals("openMailbox")
			o(wmMock.ipc.sendRequest.args[2]).deepEquals([
				"userId",
				"a@b.c",
				"path"
			])
			o(electronMock.BrowserWindow.mockedInstances[0].show.callCount).equals(1)

			done()
		}, 10)

	})

	o("setBounds and getBounds", function (done) {
		o.timeout(300)
		n.setPlatform('linux')
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")

		o(w.getBounds()).deepEquals({
			rect: {height: 0, width: 0, x: 0, y: 0},
			fullscreen: false,
			scale: 1
		})

		w.setBounds({rect: {width: 1, height: 1, x: 1, y: 1}, fullscreen: false, scale: 2})
		o(w.getBounds()).deepEquals({rect: {width: 1, height: 1, x: 1, y: 1}, fullscreen: false, scale: 1})

		w.setBounds({rect: {width: 0, height: 0, x: 0, y: 0}, fullscreen: true, scale: 1})
		o(w.getBounds()).deepEquals({rect: {width: 1, height: 1, x: 1, y: 1}, fullscreen: true, scale: 1})

		w.setBounds({rect: {width: 0, height: 0, x: 0, y: 0}, fullscreen: false, scale: 0.5})
		electronMock.BrowserWindow.mockedInstances[0].bounds = {width: 0, height: 0, x: 0, y: 10}
		setTimeout(() => {
			// this is needed because of linux DEs moving windows after the fact and us correcting it
			// see ApplicationWindow.js
			o(w.getBounds()).deepEquals({
				rect: {width: 0, height: 0, x: 0, y: -10},
				fullscreen: false,
				scale: 1
			})
			done()
		}, 250)
	})

	o("findInPage, setSearchOverlayState & stopFindInPage", function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		const wcMock = electronMock.BrowserWindow.mockedInstances[0].webContents

		w.stopFindInPage()
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')

		w.findInPage(['searchTerm', {findNext: false, forward: false, also: "options", matchCase: false}])
		o(wcMock.findInPage.callCount).equals(1)
		o(wcMock.findInPage.args[0]).equals('searchTerm')
		o(wcMock.findInPage.args[1]).deepEquals({findNext: false, forward: false, also: "options", matchCase: false})
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')

		// enter keys get caught
		wcMock.callbacks['before-input-event']({}, {
			type: 'keyDown',
			key: 'Enter',
		})
		o(wcMock.findInPage.callCount).equals(2)
		o(wcMock.findInPage.args[1]).deepEquals({findNext: false, forward: true, also: "options", matchCase: false})

		// don't react to key when search overlay is unfocused
		w.setSearchOverlayState(false, true)
		wcMock.callbacks['before-input-event']({}, {
			type: 'keyDown',
			key: 'Enter',
		})
		o(wcMock.findInPage.callCount).equals(2)

		// empty search term shouldn't be searched
		w.findInPage(['', {findNext: false, forward: false, also: "options2", matchCase: false}])
		o(wcMock.findInPage.callCount).equals(2)
		o(wcMock.findInPage.args[0]).equals('searchTerm')
		o(wcMock.findInPage.args[1]).deepEquals({findNext: false, forward: true, also: "options", matchCase: false})
		o(wcMock.stopFindInPage.callCount).equals(2)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')
	})

	o("getPath returns correct substring", function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		const wcMock = electronMock.BrowserWindow.mockedInstances[0].webContents

		o(w.getPath()).equals("/meh/more")
		wcMock.getURL = () => "desktophtml"
		o(w.getPath()).equals('')
		wcMock.getURL = () => "desktophtml/meh/more"
		downcast(w)._startFileURLString = ''
		o(w.getPath()).equals("desktophtml/meh/more")
	})

	o("show", function () {
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
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
		const {electronMock, wmMock, electronLocalshortcutMock, themeManagerMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, desktopHtml, icon, electronMock, electronLocalshortcutMock, themeManagerMock, "dictUrl")
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		let f = () => {
		}
		w.on(downcast('one-event'), f)
		o(bwInstance.on.callCount).equals(4) // initial + now
		o(bwInstance.on.args[0]).equals('one-event')
		o(bwInstance.on.args[1]).equals(f)

		w.once(downcast('two-event'), f)
		o(bwInstance.once.callCount).equals(1)
		o(bwInstance.once.args[0]).equals('two-event')
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
})
