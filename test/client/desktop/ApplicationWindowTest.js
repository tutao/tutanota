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
				on: function (ev: string, cb: ()=>void) {
					this.callbacks[ev] = cb
					return this
				},
				once: function (ev: string, cb: ()=>void) {
					this.callbacks[ev] = cb
					return this
				},
				constructor: function () {
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
						session: {
							setPermissionRequestHandler: () => {}
						}
					})
				},
				setMenuBarVisibility: function () {},
				loadURL: function () {}
			},
			statics: {}
		}),
		Menu: {
			setApplicationMenu: () => {}
		}
	}
	const electronLocalshortcut = {
		register: () => {}
	}
	const lang = {}

	const desktopUtils = {
		pathToFileURL: (p: string): string => p
	}
	const wm = {
		ipc: {
			addWindow: () => {}
		},
		dl: {
			manageDownloadsForSession: () => {}
		}
	}
	const u2f = {
		EXTENSION_ID: "u2f-extension-id"
	}

	o.only("construction", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()
		const electronLocalshortcutMock = n.mock("electron-localshortcut", electronLocalshortcut).set()

		// our modules
		const desktopUtilsMock = n.mock("./DesktopUtils.js", desktopUtils).set()
		const desktopTrayMock = n.mock("./DesktopTray.js", {DesktopTray: {getIcon: () => "this is an icon"}}).set()
		const langMock = n.mock("./DesktopLocalizationProvider.js", lang).set()
		const u2fMock = n.mock("../misc/u2f-api.js")

		// instances
		const wmMock = n.mock('__wm', wm).set()

		const {ApplicationWindow} = n.subject('../../src/desktop/ApplicationWindow.js')
		const w = new ApplicationWindow(wmMock, 'preloadjs', 'desktophtml')

		o(electronMock.BrowserWindow.mockedInstances.length).equals(1)
	})
})
