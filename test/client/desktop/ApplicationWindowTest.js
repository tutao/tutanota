// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("ApplicationWindow Test", () => {
	n.startGroup(__filename, [
		'../api/Env'
	], 300)

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
				on: function (ev: string, cb: ()=>void) {
					this.callbacks[ev] = cb
					return this
				},
				once: function (ev: string, cb: ()=>void) {
					this.callbacks[ev] = cb
					return this
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
						send: () => {
						},
						on: (ev: string, cb: ()=>void) => {
							this.webContents.callbacks[ev] = cb
							return this.webContents
						},
						once: (ev: string, cb: ()=>void) => {
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
						getURL: () => 'desktophtml/meh/more'
					})
				},
				removeMenu: function () {

				},
				setMenuBarVisibility: function () {
				},
				setMinimumSize: function (x: number, y: number) {

				},
				loadURL: function () {
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
		}
	}
	const electronLocalshortcut = {
		callbacks: {},
		register: function (bw, key, cb) {
			this.callbacks[key] = cb
		}
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

	const desktopUtils = {
		pathToFileURL: (p: string): string => p
	}
	const wm = {
		ipc: {
			addWindow: () => {
			},
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
		getIcon: () => 'this is a wm icon',
		recreateWindow: () => {
		}
	}

	const u2f = {
		EXTENSION_ID: "u2f-extension-id"
	}

	const standardMocks = () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()
		const electronLocalshortcutMock = n.mock("electron-localshortcut", electronLocalshortcut).set()

		// our modules
		const desktopUtilsMock = n.mock("./DesktopUtils.js", desktopUtils).set()
		const desktopTrayMock = n.mock("./DesktopTray.js", {DesktopTray: {getIcon: () => "this is an icon"}}).set()
		const langMock = n.mock("../misc/LanguageViewModel", lang).set()
		const u2fMock = n.mock("../misc/u2f-api.js", u2f).set()

		// instances
		const wmMock = n.mock('__wm', wm).set()

		return {
			electronMock,
			electronLocalshortcutMock,
			desktopUtilsMock,
			desktopTrayMock,
			langMock,
			u2fMock,
			wmMock
		}
	}

	o("construction", () => {
		// node modules
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

		o(electronMock.BrowserWindow.mockedInstances.length).equals(1)
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		o(bwInstance.loadURL.callCount).equals(1)
		o(bwInstance.loadURL.args[0]).equals('desktophtml')
		o(bwInstance.opts).deepEquals({
			icon: "this is a wm icon",
			show: false,
			autoHideMenuBar: true,
			webPreferences: {
				nodeIntegration: false,
				nodeIntegrationInWorker: false,
				sandbox: true,
				contextIsolation: false,
				webSecurity: true,
				preload: 'preloadjs'
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
			'context-menu',
			'crashed',
			'dom-ready'
		])

		// noAutoLogin=true
		const w2 = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml', true)
		const bwInstance2 = electronMock.BrowserWindow.mockedInstances[1]
		o(bwInstance2.loadURL.callCount).equals(1)
		o(bwInstance2.loadURL.args[0]).equals('desktophtml?noAutoLogin=true')
		o(wmMock.ipc.addWindow.args[0]).equals(w2.id)
	})

	o("shortcut creation, linux", () => {
		n.setPlatform("linux")
		const {electronLocalshortcutMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'CommandOrControl+F',
			'CommandOrControl+P',
			'F12',
			'F5',
			'CommandOrControl+N',
			'F11',
			'Alt+Right',
			'Alt+Left',
			'Control+H',
		])
	})

	o("shortcut creation, windows", () => {
		n.setPlatform('win32')
		const {electronLocalshortcutMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'CommandOrControl+F',
			'CommandOrControl+P',
			'F12',
			'F5',
			'CommandOrControl+N',
			'F11',
			'Alt+Right',
			'Alt+Left',
			'Control+H'
		])
	})

	o("shortcut creation, mac", () => {
		n.setPlatform('darwin')
		const {electronLocalshortcutMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

		o(Object.keys(electronLocalshortcutMock.callbacks)).deepEquals([
			'CommandOrControl+F',
			'CommandOrControl+P',
			'F12',
			'F5',
			'CommandOrControl+N',
			'Command+Control+F',
			'Command+Right',
			'Command+Left'
		])
	})

	o("shortcuts are used, linux", () => {
		n.setPlatform('linux')
		const {electronMock, electronLocalshortcutMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

		// call all the shortcut callbacks
		electronLocalshortcutMock.callbacks["CommandOrControl+F"]()
		o(wmMock.ipc.sendRequest.callCount).equals(1)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'openFindInPage', []])


		electronLocalshortcutMock.callbacks["CommandOrControl+P"]()
		o(wmMock.ipc.sendRequest.callCount).equals(2)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'print', []])

		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
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
		o(bwInstance.loadURL.args[0]).equals('desktophtml')

		electronLocalshortcutMock.callbacks["Control+H"]()
		o(wmMock.hide.callCount).equals(1)

		electronLocalshortcutMock.callbacks["CommandOrControl+N"]()
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

	o("shortcuts are used, mac", () => {
		n.setPlatform('darwin')
		const {electronMock, electronLocalshortcutMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

		// call all the shortcut callbacks
		electronLocalshortcutMock.callbacks["CommandOrControl+F"]()
		o(wmMock.ipc.sendRequest.callCount).equals(1)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'openFindInPage', []])


		electronLocalshortcutMock.callbacks["CommandOrControl+P"]()
		o(wmMock.ipc.sendRequest.callCount).equals(2)
		o(wmMock.ipc.sendRequest.args).deepEquals([w.id, 'print', []])

		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
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
		o(bwInstance.loadURL.args[0]).equals('desktophtml')

		electronLocalshortcutMock.callbacks["CommandOrControl+N"]()
		o(wmMock.newWindow.callCount).equals(1)
		o(wmMock.newWindow.args[0]).equals(true)

		electronLocalshortcutMock.callbacks["Command+Control+F"]()
		o(bwInstance.setFullScreen.callCount).equals(1)
		o(bwInstance.isFullScreen.callCount).equals(1)
		o(bwInstance.setFullScreen.args[0]).equals(true)

		electronLocalshortcutMock.callbacks["Command+Left"]()
		o(bwInstance.webContents.goBack.callCount).equals(1)

		electronLocalshortcutMock.callbacks["Command+Right"]()
		o(bwInstance.webContents.goForward.callCount).equals(1)
	})

	o("url rewriting", () => {
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		const e = {preventDefault: o.spy()}
		bwInstance.webContents.callbacks['did-start-navigation'](e, "evil.com", true)
		o(e.preventDefault.callCount).equals(1)
		o(bwInstance.loadURL.callCount).equals(2) // initial + navigation
		o(bwInstance.loadURL.args[0]).equals("desktophtml")

		bwInstance.webContents.callbacks['did-start-navigation'](e, 'chrome-extension://u2f-extension-id', true)
		o(e.preventDefault.callCount).equals(1)
		o(bwInstance.loadURL.callCount).equals(2) // nothing happened

		bwInstance.webContents.callbacks['did-start-navigation'](e, "desktophtml?r=%2Flogin%3FnoAutoLogin%3Dtrue", true)
		o(e.preventDefault.callCount).equals(2)
		o(bwInstance.loadURL.callCount).equals(3)
		o(bwInstance.loadURL.args[0]).equals("desktophtml?noAutoLogin=true")

		bwInstance.webContents.callbacks['did-start-navigation'](e, "desktophtml/login?noAutoLogin=true", true)
		o(e.preventDefault.callCount).equals(2)
		o(bwInstance.loadURL.callCount).equals(3)

		bwInstance.webContents.callbacks['did-start-navigation'](e, "desktophtml/login?noAutoLogin=true", false)
		o(e.preventDefault.callCount).equals(2)
		o(bwInstance.loadURL.callCount).equals(3) //nothing happened

	})

	o("attaching webView is denied", () => {
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
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

	o("try to recreate on crashed", () => {
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		bwInstance.webContents.callbacks['crashed']()
		o(wmMock.recreateWindow.callCount).equals(1)
		o(wmMock.recreateWindow.args[0]).equals(w)
	})

	o("new-window is redirected to openExternal", () => {
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		const e = {preventDefault: o.spy()}
		bwInstance.webContents.callbacks['new-window'](e, 'dies.ist.ne/url')

		o(electronMock.shell.openExternal.callCount).equals(1)
		o(electronMock.shell.openExternal.args[0]).equals('dies.ist.ne/url')
		o(e.preventDefault.callCount).equals(1)

		bwInstance.webContents.callbacks['new-window'](e, undefined)
		o(electronMock.shell.openExternal.callCount).equals(2)
		o(electronMock.shell.openExternal.args[0]).equals(undefined)
		o(e.preventDefault.callCount).equals(2)

		let f = () => {
		}
		bwInstance.webContents.callbacks['new-window'](e, f)
		o(electronMock.shell.openExternal.callCount).equals(3)
		o(electronMock.shell.openExternal.args[0]).equals(f)
		o(e.preventDefault.callCount).equals(3)

		f = []
		bwInstance.webContents.callbacks['new-window'](e, f)
		o(electronMock.shell.openExternal.callCount).equals(4)
		o(electronMock.shell.openExternal.args[0]).equals(f)
		o(e.preventDefault.callCount).equals(4)
	})

	o("sendMessageToWebContents checks if webContents is there", () => {
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		let args = {p: 'args'}
		w.sendMessageToWebContents('message', args)
		o(bwInstance.isDestroyed.callCount).equals(1)
		o(bwInstance.webContents.isDestroyed.callCount).equals(1)
		o(bwInstance.webContents.send.callCount).equals(1)
		o(bwInstance.webContents.send.args[0]).equals('message')
		o(bwInstance.webContents.send.args[1]).equals(args)

		args = undefined
		w.sendMessageToWebContents('message2', args)
		o(bwInstance.isDestroyed.callCount).equals(2)
		o(bwInstance.webContents.isDestroyed.callCount).equals(2)
		o(bwInstance.webContents.send.callCount).equals(2)
		o(bwInstance.webContents.send.args[0]).equals('message2')
		o(bwInstance.webContents.send.args[1]).equals(args)

		args = []
		w.sendMessageToWebContents(3, args)
		o(bwInstance.isDestroyed.callCount).equals(3)
		o(bwInstance.webContents.isDestroyed.callCount).equals(3)
		o(bwInstance.webContents.send.callCount).equals(3)
		o(bwInstance.webContents.send.args[0]).equals("3")
		o(bwInstance.webContents.send.args[1]).equals(args)

		let args2 = "hello"
		bwInstance.webContents.destroyed = true
		w.sendMessageToWebContents(3, args2)
		o(bwInstance.isDestroyed.callCount).equals(4)
		o(bwInstance.webContents.isDestroyed.callCount).equals(4)
		o(bwInstance.webContents.send.callCount).equals(3)
		o(bwInstance.webContents.send.args[0]).equals("3")
		o(bwInstance.webContents.send.args[1]).equals(args)

		bwInstance.destroyed = true
		w.sendMessageToWebContents(3, args2)
		o(bwInstance.isDestroyed.callCount).equals(5)
		o(bwInstance.webContents.isDestroyed.callCount).equals(4)
		o(bwInstance.webContents.send.callCount).equals(3)
		o(bwInstance.webContents.send.args[0]).equals("3")
		o(bwInstance.webContents.send.args[1]).equals(args)
	})

	o("context-menu is passed to webContents", () => {
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		const e = {preventDefault: o.spy()}
		bwInstance.webContents.callbacks['context-menu'](e, {linkURL: 'dies.ist.ne/url'})

		o(bwInstance.webContents.send.callCount).equals(1)
		o(bwInstance.webContents.send.args).deepEquals(['open-context-menu', [{linkURL: 'dies.ist.ne/url'}]])
		o(e.preventDefault.callCount).equals(0)
	})

	o("dom-ready causes context menu setup", done => {
		const {electronMock, wmMock, langMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]
		bwInstance.webContents.callbacks['dom-ready']()

		setTimeout(() => {
			o(bwInstance.webContents.send.callCount).equals(1)
			o(bwInstance.webContents.send.args[0]).equals('setup-context-menu')
			o(bwInstance.webContents.send.args[1]).deepEquals([])
			done()
		}, 10)
	})

	o("openMailbox sends mailbox info and shows window", done => {
		const {electronMock, wmMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
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

	o("setBounds and getBounds", done => {
		n.setPlatform('linux')
		const {electronMock, wmMock} = standardMocks()
		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

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

	o("findInPage & stopFindInPage", () => {
		const {electronMock, wmMock} = standardMocks()
		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const wcMock = electronMock.BrowserWindow.mockedInstances[0].webContents

		w.stopFindInPage()
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')
		w.findInPage(['searchTerm', 'options'])
		o(wcMock.findInPage.callCount).equals(1)
		o(wcMock.findInPage.args[0]).equals('searchTerm')
		o(wcMock.findInPage.args[1]).equals('options')
		o(wcMock.stopFindInPage.callCount).equals(1)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')
		w.findInPage(['', 'options2'])
		o(wcMock.findInPage.callCount).equals(1)
		o(wcMock.findInPage.args[0]).equals('searchTerm')
		o(wcMock.findInPage.args[1]).equals('options')
		o(wcMock.stopFindInPage.callCount).equals(2)
		o(wcMock.stopFindInPage.args[0]).equals('keepSelection')
	})

	o("getPath returns correct substring", () => {
		const {electronMock, wmMock} = standardMocks()
		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const wcMock = electronMock.BrowserWindow.mockedInstances[0].webContents

		o(w.getPath()).equals("/meh/more")
		wcMock.getURL = () => "desktophtml"
		o(w.getPath()).equals('')
		wcMock.getURL = () => "desktophtml/meh/more"
		w._startFile = ''
		o(w.getPath()).equals("desktophtml/meh/more")
	})

	o("show", () => {
		const {electronMock, wmMock} = standardMocks()
		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
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

	o("on, once, getTitle, setZoomFactor, isFullScreen, isMinimized, minimize, hide, center, showInactive, isFocused", () => {
		const {electronMock, wmMock, langMock} = standardMocks()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')
		const bwInstance = electronMock.BrowserWindow.mockedInstances[0]

		let f = () => {
		}
		w.on('one-event', f)
		o(bwInstance.on.callCount).equals(4) // initial + now
		o(bwInstance.on.args[0]).equals('one-event')
		o(bwInstance.on.args[1]).equals(f)

		w.once('two-event', f)
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
