// @flow
import o from "ospec"
import n from "../nodemocker"
import {defer, downcast} from "../../../src/api/common/utils/Utils"
import {ApplicationWindow} from "../../../src/desktop/ApplicationWindow"

const U2F_EXTENSION_ID = "kmendfapggjehodndflmmgagdbamhnfd" // check u2f-api.js

o.spec("ApplicationWindow Test", function () {
	const electronLocalshortcut = {
		callbacks: {},
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
		getIcon: () => 'this is a wm icon'
	}

	const conf = {
		getConst: key => {
			switch (key) {
				case 'desktophtml':
					return key
				default:
					throw new Error("unknown conf.getConst key: " + key)
			}
		},
		getVar: key => {
			throw new Error("unknown conf.getVar key: " + key)
		}
	}

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

						this.webContents = n.spyify({
							callbacks: {},
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
							}
						})
					},
					removeMenu: function () {

					},
					setMenuBarVisibility: function () {
					},
					setMinimumSize: function (x: number, y: number) {

					},
					loadURL: function () {
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
				},
				statics: {
					lastId: 0
				}
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
		const confMock = n.mock("_conf", conf).set()

		// instances
		const wmMock = n.mock('__wm', wm).set()

		return {
			electronMock,
			electronLocalshortcutMock,
			desktopTrayMock,
			langMock,
			wmMock,
			confMock,
		}
	}

	o("construction", function () {
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

		o(electronMock.BrowserWindow.mockedInstances.length).equals(1)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		o(bwInstance.loadURL.callCount).equals(1)
		o(bwInstance.loadURL.args[0]).equals('file:///path/to/app/desktophtml')
		o(bwInstance.opts).deepEquals({
			icon: "this is a wm icon",
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
				spellcheck: false,
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
			'new-window',
			'will-attach-webview',
			'did-start-navigation',
			'before-input-event',
			'did-finish-load',
			'did-fail-load',
			'remote-require',
			'remote-get-global',
			'remote-get-builtin',
			'remote-get-current-web-contents',
			'remote-get-current-window',
			'zoom-changed',
			'update-target-url'
		])("webContents registered callbacks dont match")

		// noAutoLogin=true
		const w2 = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock, true)
		const bwInstance2 = electronMock.BrowserWindow.mockedInstances[1]
		o(bwInstance2.loadURL.callCount).equals(1)
		o(bwInstance2.loadURL.args[0]).equals('file:///path/to/app/desktophtml?noAutoLogin=true')
		o(wmMock.ipc.addWindow.args[0]).equals(w2.id)
	})

	o("redirect to start page after failing to load a page due to 404", function () {
		const {wmMock, electronMock, confMock, electronLocalshortcutMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		downcast(w._browserWindow.webContents).callbacks['did-fail-load']({}, -6, 'ERR_FILE_NOT_FOUND')

		o(bwInstance.loadURL.callCount).equals(2)
		o(bwInstance.loadURL.args[0]).equals('file:///path/to/app/desktophtml?noAutoLogin=true')

		downcast(w._browserWindow.webContents).callbacks['did-fail-load']({}, -6, 'ERR_SOME_OTHER_ONE')
		o(bwInstance.loadURL.callCount).equals(2)
	})

	o("shortcut creation, linux", function () {
		n.setPlatform("linux")
		const {electronLocalshortcutMock, wmMock, confMock, electronMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

		downcast(w._browserWindow.webContents).callbacks['did-finish-load']()

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'Control+F',
			'Control+P',
			'F12',
			'F5',
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
		const {electronLocalshortcutMock, wmMock, confMock, electronMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

		downcast(w._browserWindow.webContents).callbacks['did-finish-load']()

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'Control+F',
			'Control+P',
			'F12',
			'F5',
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
		const {electronLocalshortcutMock, wmMock, confMock, electronMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

		downcast(w._browserWindow.webContents).callbacks['did-finish-load']()

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'Command+F',
			'Command+P',
			'F12',
			'F5',
			'Command+0',
			'Command+Control+F',
		])
	})

	o("shortcuts are used, linux & win", async function () {
		n.setPlatform('linux')
		const {electronMock, electronLocalshortcutMock, wmMock, confMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

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

		electronLocalshortcutMock.callbacks["F5"]()
		o(bwInstance.loadURL.callCount).equals(2)
		o(bwInstance.loadURL.args[0]).equals('file:///path/to/app/desktophtml')

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
		const {electronMock, electronLocalshortcutMock, wmMock, confMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

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
		const {electronMock, electronLocalshortcutMock, wmMock, confMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

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

		electronLocalshortcutMock.callbacks["F5"]()
		o(bwInstance.loadURL.callCount).equals(2)
		o(bwInstance.loadURL.args[0]).equals('file:///path/to/app/desktophtml')

		electronLocalshortcutMock.callbacks["Command+Control+F"]()
		o(bwInstance.setFullScreen.callCount).equals(1)
		o(bwInstance.isFullScreen.callCount).equals(1)
		o(bwInstance.setFullScreen.args[0]).equals(true)
	})

	o.spec("url rewriting", function () {
		let bwInstance
		let e

		o.beforeEach(function () {
			const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()
			e = {preventDefault: o.spy()}

			const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
			w.on('did-start-navigation', () => {})
			bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		})

		o("external url", function () {
			bwInstance.webContents.callbacks['did-start-navigation'](e, "http://evil.com", true)
			o(bwInstance.emit.callCount).equals(1)
			o(bwInstance.emit.args).deepEquals(["did-start-navigation"])
			o(e.preventDefault.callCount).equals(1)
			o(bwInstance.loadURL.callCount).equals(2) // initial + navigation
			o(bwInstance.loadURL.args[0]).equals("file:///path/to/app/desktophtml")
		})

		o("u2f", function () {
			bwInstance.webContents.callbacks['did-start-navigation'](e, `chrome-extension://${U2F_EXTENSION_ID}`, true)
			o(e.preventDefault.callCount).equals(1)
			o(bwInstance.loadURL.callCount).equals(2)
		})

		o("redirect to login with noAutologin", function () {
			bwInstance.webContents.callbacks['did-start-navigation'](e, "file:///path/to/app/desktophtml?r=%2Flogin%3FnoAutoLogin%3Dtrue", true)
			o(e.preventDefault.callCount).equals(1)("Prevent default is called")
			o(bwInstance.loadURL.callCount).equals(2)("Load URL is called one more time after initial")
			o(bwInstance.loadURL.args[0]).equals("file:///path/to/app/desktophtml?noAutoLogin=true")
		})

		o("login with noAutoLogin, inPlace", function () {
			bwInstance.webContents.callbacks['did-start-navigation'](e, "file:///path/to/app/desktophtml/login?noAutoLogin=true", true)
			o(e.preventDefault.callCount).equals(0)
			o(bwInstance.loadURL.callCount).equals(1)
		})

		o("login with noAutologin, not inPlace", function () {
			bwInstance.webContents.callbacks['did-start-navigation'](e, "file:///path/to/app/desktophtml/login?noAutoLogin=true", false)
			o(e.preventDefault.callCount).equals(0)
			o(bwInstance.loadURL.callCount).equals(1) // nothing happened
		})
	})

	o("attaching webView is denied", function () {
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
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

	o.spec("new-window is redirected to openExternal", function () {
		let electronMock
		let bwInstance

		o.beforeEach(function () {
			const sm = standardMocks()
			electronMock = sm.electronMock
			let {wmMock, confMock, electronLocalshortcutMock} = sm


			new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
			bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		})

		o("not url is not redirected", function () {
			const url = 'ba/\\.nanas'
			const e = {preventDefault: o.spy()}
			bwInstance.webContents.callbacks['new-window'](e, url)

			o(electronMock.shell.openExternal.callCount).equals(0)
			// o(electronMock.shell.openExternal.args[0]).equals(url)
			o(e.preventDefault.callCount).equals(1)
		})

		o("url without protocol is not redirected", function () {
			const url = 'dies.ist.ne/url'
			const e = {preventDefault: o.spy()}
			bwInstance.webContents.callbacks['new-window'](e, url)

			o(electronMock.shell.openExternal.callCount).equals(0)
			o(e.preventDefault.callCount).equals(1)
		})

		o("http url is redirected", function () {
			const url = "http://example.com"
			const e = {preventDefault: o.spy()}
			bwInstance.webContents.callbacks['new-window'](e, url)

			o(electronMock.shell.openExternal.callCount).equals(1)
			o(electronMock.shell.openExternal.args[0]).equals(url)
			o(e.preventDefault.callCount).equals(1)
		})

		o("file url is not opened nor redirected", function () {
			const url = "file:///etc/shadow"
			const e = {preventDefault: o.spy()}
			bwInstance.webContents.callbacks['new-window'](e, url)

			o(electronMock.shell.openExternal.callCount).equals(0)
			o(e.preventDefault.callCount).equals(1)
		})
	})

	o("sendMessageToWebContents checks if webContents is there", async function () {
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
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
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()
		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
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
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
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
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)

		o(w.getBounds()).deepEquals({
			rect: {height: 0, width: 0, x: 0, y: 0},
			fullscreen: false,
			scale: 1
		})

		w.setBounds({rect: {width: 1, height: 1, x: 1, y: 1}, fullscreen: false, scale: 2})
		o(w.getBounds()).deepEquals({rect: {width: 1, height: 1, x: 1, y: 1}, fullscreen: false, scale: 2})

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
				scale: 0.5
			})
			done()
		}, 250)
	})

	o("findInPage, setSearchOverlayState & stopFindInPage", function () {
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
		const wcMock = electronMock.BrowserWindow.mockedInstances[0].webContents

		w.stopFindInPage()
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')

		w.findInPage(['searchTerm', {findNext: false, forward: false, also: "options"}])
		o(wcMock.findInPage.callCount).equals(1)
		o(wcMock.findInPage.args[0]).equals('searchTerm')
		o(wcMock.findInPage.args[1]).deepEquals({findNext: false, forward: false, also: "options"})
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')

		// enter keys get caught
		wcMock.callbacks['before-input-event']({}, {
			type: 'keyDown',
			key: 'Enter',
		})
		o(wcMock.findInPage.callCount).equals(2)
		o(wcMock.findInPage.args[1]).deepEquals({findNext: false, forward: true, also: "options"})

		// don't react to key when search overlay is unfocused
		w.setSearchOverlayState(false, true)
		wcMock.callbacks['before-input-event']({}, {
			type: 'keyDown',
			key: 'Enter',
		})
		o(wcMock.findInPage.callCount).equals(2)

		// empty search term shouldn't be searched
		w.findInPage(['', {findNext: false, forward: false, also: "options2"}])
		o(wcMock.findInPage.callCount).equals(2)
		o(wcMock.findInPage.args[0]).equals('searchTerm')
		o(wcMock.findInPage.args[1]).deepEquals({findNext: false, forward: true, also: "options"})
		o(wcMock.stopFindInPage.callCount).equals(2)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')
	})

	o("getPath returns correct substring", function () {
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
		const wcMock = electronMock.BrowserWindow.mockedInstances[0].webContents

		o(w.getPath()).equals("/meh/more")
		wcMock.getURL = () => "desktophtml"
		o(w.getPath()).equals('')
		wcMock.getURL = () => "desktophtml/meh/more"
		downcast(w)._startFile = ''
		o(w.getPath()).equals("desktophtml/meh/more")
	})

	o("show", function () {
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()

		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
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
		const {electronMock, wmMock, confMock, electronLocalshortcutMock} = standardMocks()


		const w = new ApplicationWindow(wmMock, confMock, electronMock, electronLocalshortcutMock)
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
