// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"
import type {UserInfo} from "../../../src/desktop/ApplicationWindow"
import {noOp} from "../../../src/api/common/utils/Utils"

o.spec("Desktop Window Manager Test", () => {
	n.startGroup({
		group: __filename, allowables: [
			'../api/Env'
		]
	})

	const electron = {
		app: {
			callbacks: [],
			once: function (ev: string, cb: () => void) {
				this.callbacks[ev] = cb
				return n.spyify(electron.app)
			},
			getAppPath: () => "/app/path/",
			hide: () => {}
		},
		screen: {
			getDisplayMatching: () => {
				return {
					bounds: {
						height: 1000,
						width: 1000,
						x: 0,
						y: 0
					}
				}
			}
		}
	}

	const applicationWindow = {
		ApplicationWindow: n.classify({
			prototype: {
				callbacks: {},
				constructor: function () {
					this.id = applicationWindow.ApplicationWindow.lastId
					applicationWindow.ApplicationWindow.lastId = applicationWindow.ApplicationWindow.lastId + 1
				},
				openMailbox: function (info: UserInfo, path: string) {

				},
				on: function (ev: string, cb: () => void) {
					this.callbacks[ev] = cb
					return this
				},
				once: function (ev: string, cb: () => void) {
					this.callbacks[ev] = cb
					return this
				},
				getPath: function () {
					return "this/path"
				},
				getUserId: function () {
					return "userId"
				},
				getUserInfo: function () {
					return {userId: "userId", mailAddress: "mailAddress"}
				},
				isMinimized: function () {
					return false
				},
				isFocused: function () {
					return false
				},
				isHidden: function () {
					return false
				},
				getBounds: function () {
					return {rect: {x: 0, y: 0, width: 0, height: 0}, fullscreen: false}
				},
				center: function () {
				},
				setBounds: function () {
				},
				minimize: function () {
				},
				show: function () {
					this.callbacks["focus"]()
				},
				hide: function () {
				},
				setZoomFactor: function () {
				},
				openMailBox: function () {
					return Promise.resolve()
				},
				showInactive: function () {
				},
				setContextMenuHandler: function(){}
			},
			statics: {
				lastId: 0
			}
		})
	}

	const dl = {}

	const conf = {
		removeListener: (key: string, cb: () => void) => n.spyify(conf),
		on: (key: string) => n.spyify(conf),
		getDesktopConfig: (key: string) => {
			switch (key) {
				case 'lastBounds':
					return undefined
				case 'runAsTrayApp':
					return true
				default:
					throw new Error(`unexpected getDesktopConfig key ${key}`)
			}
		},
		setDesktopConfig: (key: string) => {
		},
		get: (key: string) => {
			switch (key) {
				case 'checkUpdateSignature':
					return true
				case 'pubKeyUrl':
					return 'https://b.s'
				case 'pollingInterval':
					return 300
				case 'preloadjs':
					return "./src/desktop/preload.js"
				case 'desktophtml':
					return "./desktop.html"
				case 'iconName':
					return 'iconName.name'
				default:
					throw new Error(`unexpected get key ${key}`)
			}
		}
	}

	const notifier = {
		resolveGroupedNotification: () => {
		}
	}

	const desktopTray = {
		getIcon: () => "this is an instance icon",
		DesktopTray: {
			getIcon: () => "this is a static icon"
		},
		update: () => {},
		clearBadge: ()=>{}
	}

	const ipc = {}

	const contextMenu = {
		DesktopContextMenu: n.classify({
			prototype: {},
			statics: {}
		})
	}

	const standardMocks = () => {
		const electronMock = n.mock('electron', electron).set()
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		const desktopTrayMock = n.mock("./tray/DesktopTray", desktopTray).set()
		const confMock = n.mock('__conf', conf).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()
		const contextMenuMock = n.mock("./DesktopContextMenu", contextMenu).set()
		return {
			electronMock,
			applicationWindowMock,
			dlMock,
			desktopTrayMock,
			confMock,
			notifierMock,
			ipcMock,
			contextMenuMock
		}
	}

	o("construction", () => {
		const {
			applicationWindowMock,
			dlMock,
			confMock,
			desktopTrayMock,
			notifierMock,
			ipcMock
		} = standardMocks()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)
		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(0)
		o(wm.getIcon()).equals('this is a static icon')
	})

	o("create one window with showWhenReady=false, no lastBounds", () => {
		const {
			applicationWindowMock,
			dlMock,
			confMock,
			desktopTrayMock,
			notifierMock,
			ipcMock
		} = standardMocks()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		wm.newWindow(false)

		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(1)
		const win = applicationWindowMock.ApplicationWindow.mockedInstances[0]
		o(Object.keys(win.callbacks)).deepEquals([
			'close',
			'closed',
			'focus',
			'did-start-navigation',
			'page-title-updated',
			'ready-to-show'
			])
		win.callbacks["ready-to-show"]()
		o(win.center.callCount).equals(1)
		o(win.setBounds.callCount).equals(0)
		o(win.show.callCount).equals(0)
		o(win.setContextMenuHandler.callCount).equals(1)
		o(applicationWindowMock.ApplicationWindow.args).deepEquals([
			wm, "/app/path/src/desktop/preload.js", "/app/path/desktop.html", undefined
		])
		o(wm.get(0)).equals(win)
	})

	o("create one window with showWhenReady=true, with lastBounds", () => {
		const {
			applicationWindowMock,
			dlMock,
			desktopTrayMock,
			notifierMock,
			ipcMock
		} = standardMocks()

		// instances
		const testBounds = {rect: {height: 10, width: 10, x: 10, y: 10}, fullscreen: false, scale: 1}
		const confMock = n.mock('__conf', conf)
		                  .with({
			                  getDesktopConfig: (key: string) => {
				                  switch (key) {
					                  case 'lastBounds':
						                  return testBounds
					                  default:
						                  throw new Error(`unexpected getDesktopConfig key ${key}`)
				                  }
			                  }
		                  })
		                  .set()


		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		wm.newWindow(true)

		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(1)
		o(applicationWindowMock.ApplicationWindow.args).deepEquals([
			wm, "/app/path/src/desktop/preload.js", "/app/path/desktop.html", undefined
		])
		const win = applicationWindowMock.ApplicationWindow.mockedInstances[0]
		o(Object.keys(win.callbacks)).deepEquals([
			'close',
			'closed',
			'focus',
			'did-start-navigation',
			'page-title-updated',
			'ready-to-show'
		])
		win.callbacks["ready-to-show"]()
		o(win.center.callCount).equals(0)
		o(win.setBounds.callCount).equals(1)
		o(win.setBounds.args).deepEquals([testBounds])
		o(win.setZoomFactor.callCount).equals(0)
		o(win.show.callCount).equals(1)
		o(desktopTrayMock.clearBadge.callCount).equals(1)
		o(wm.get(1)).equals(win)

		o(desktopTrayMock.update.callCount).equals(1)
	})

	o("create window with noAutoLogin", () => {
		const {
			applicationWindowMock,
			dlMock,
			confMock,
			desktopTrayMock,
			notifierMock,
			ipcMock
		} = standardMocks()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		wm.newWindow(true, true)
		o(applicationWindowMock.ApplicationWindow.callCount).equals(1)
		o(applicationWindowMock.ApplicationWindow.args[3]).equals(true)

		wm.newWindow(true, false)
		o(applicationWindowMock.ApplicationWindow.callCount).equals(2)
		o(applicationWindowMock.ApplicationWindow.args[3]).equals(false)

		wm.newWindow(true)
		o(applicationWindowMock.ApplicationWindow.callCount).equals(3)
		o(applicationWindowMock.ApplicationWindow.args[3]).equals(undefined)
	})

	o("getLastFocused returns the last focused window", () => {
		const {
			dlMock,
			confMock,
			desktopTrayMock,
			notifierMock,
			ipcMock
		} = standardMocks()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		const w1 = wm.newWindow(true)
		const w2 = wm.newWindow(true)
		const w3 = wm.newWindow(true)

		w1.callbacks['ready-to-show']()
		w2.callbacks['ready-to-show']()
		w3.callbacks['ready-to-show']()

		o(wm.getAll().map(w => w.id)).deepEquals([w1, w2, w3].map(w => w.id))
		o(wm.getLastFocused(false).id).equals(w3.id)

		wm.get(w2.id).show()

		o(wm.getAll().map(w => w.id)).deepEquals([w1, w3, w2].map(w => w.id))
		o(wm.getLastFocused(false).id).equals(w2.id)
		const w4 = wm.newWindow(false)
		w4.callbacks['ready-to-show']()
		o(wm.getLastFocused(false).id).equals(w2.id)
	})

	o("wm is saving bounds to file when closing window", () => {
		const {
			dlMock,
			confMock,
			desktopTrayMock,
			notifierMock,
			ipcMock
		} = standardMocks()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		const w = wm.newWindow(true)
		w.callbacks['ready-to-show']()
		w.callbacks['close']({preventDefault: noOp})

		o(confMock.setDesktopConfig.callCount).equals(1)
		o(confMock.setDesktopConfig.args[0]).equals("lastBounds")
		o(confMock.setDesktopConfig.args[1]).deepEquals({
			rect: {x: 0, y: 0, width: 0, height: 0},
			fullscreen: false
		})
	})

	o("hide() hides all windows", () => {
		const {
			electronMock,
			applicationWindowMock,
			dlMock,
			confMock,
			desktopTrayMock,
			notifierMock,
			ipcMock
		} = standardMocks()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		wm.newWindow(true)
		wm.newWindow(true)

		n.setPlatform("linux")
		wm.hide()
		o(applicationWindowMock.ApplicationWindow.mockedInstances[0].hide.callCount).equals(1)
		o(applicationWindowMock.ApplicationWindow.mockedInstances[1].hide.callCount).equals(1)
		o(electronMock.app.hide.callCount).equals(0)

		n.setPlatform("win32")
		wm.hide()
		o(applicationWindowMock.ApplicationWindow.mockedInstances[0].hide.callCount).equals(2)
		o(applicationWindowMock.ApplicationWindow.mockedInstances[1].hide.callCount).equals(2)
		o(electronMock.app.hide.callCount).equals(0)

		n.setPlatform("darwin")
		wm.hide()
		o(applicationWindowMock.ApplicationWindow.mockedInstances[0].hide.callCount).equals(2)
		o(applicationWindowMock.ApplicationWindow.mockedInstances[1].hide.callCount).equals(2)
		o(electronMock.app.hide.callCount).equals(1)
	})
})

