// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("ApplicationWindow Test", () => {
	o.beforeEach(n.enable)
	o.afterEach(n.disable)

	n.allow([
		'../api/Env'
	])

	const electron = {
		BrowserWindow: n.classify({
			prototype: {
				callbacks: {},
				devToolsOpened: false,
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
						session: {
							setPermissionRequestHandler: () => {}
						}
					})
				},
				setMenuBarVisibility: function () {},
				loadURL: function () {},
				close: function () {},
				hide: function () {},
				setFullScreen: function () {},
				isFullScreen: function () {return false}
			},
			statics: {
				lastId: 0
			}
		}),
		Menu: {
			setApplicationMenu: () => {}
		}
	}
	const electronLocalshortcut = {
		callbacks: {},
		register: function (bw, key, cb) {
			this.callbacks[key] = cb
		}
	}
	const lang = {}

	const desktopUtils = {
		pathToFileURL: (p: string): string => p
	}
	const wm = {
		ipc: {
			addWindow: () => {},
			sendRequest: () => {}
		},
		dl: {
			manageDownloadsForSession: () => {}
		},
		newWindow: () => {},
		getIcon: () => 'this is a wm icon'
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
		const langMock = n.mock("./DesktopLocalizationProvider.js", lang).set()
		const u2fMock = n.mock("../misc/u2f-api.js").set()

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
			'CommandOrControl+W',
			'CommandOrControl+H',
			'CommandOrControl+N',
			'F11'
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
			'CommandOrControl+W',
			'CommandOrControl+H',
			'CommandOrControl+N',
			'F11'
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
			'CommandOrControl+W',
			'CommandOrControl+H',
			'CommandOrControl+N',
			'Command+Control+F'
		])
	})

	o("shortcuts are used", () => {
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

		electronLocalshortcutMock.callbacks["CommandOrControl+W"]()
		o(bwInstance.close.callCount).equals(1)

		electronLocalshortcutMock.callbacks["CommandOrControl+H"]()
		o(bwInstance.hide.callCount).equals(1)

		electronLocalshortcutMock.callbacks["CommandOrControl+N"]()
		o(wmMock.newWindow.callCount).equals(1)
		o(wmMock.newWindow.args[0]).equals(true)

		electronLocalshortcutMock.callbacks["F11"]()
		o(bwInstance.setFullScreen.callCount).equals(1)
		o(bwInstance.isFullScreen.callCount).equals(1)
		o(bwInstance.setFullScreen.args[0]).equals(true)
	})

})
