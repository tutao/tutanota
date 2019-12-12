// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"
import type {UserInfo} from "../../../src/desktop/ApplicationWindow"
import {downcast, noOp} from "../../../src/api/common/utils/Utils"

o.spec("Desktop Window Manager Test", () => {
	n.startGroup({
		group: __filename, allowables: [
			'../api/Env'
		]
	})

	const electron = {
		app: {
			callbacks: [],
			once: function (ev: string, cb: ()=>void) {
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
				on: function (ev: string, cb: ()=>void) {
					this.callbacks[ev] = cb
					return this
				},
				once: function (ev: string, cb: ()=>void) {
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
				}
			},
			statics: {
				lastId: 0
			}
		})
	}

	const dl = {}

	const conf = {
		removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
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
		update: () => {}
	}

	const ipc = {}

	o("construction", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {getIcon: () => "this is an icon"}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)
		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(0)
		o(wm.getIcon()).equals('this is a static icon')
	})

	o("create one window with showWhenReady=false, no lastBounds", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', desktopTray).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		wm.newWindow(false)

		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(1)
		const win = applicationWindowMock.ApplicationWindow.mockedInstances[0]
		win.callbacks["ready-to-show"]()
		o(win.center.callCount).equals(1)
		o(win.setBounds.callCount).equals(0)
		o(win.show.callCount).equals(0)
		o(applicationWindowMock.ApplicationWindow.args).deepEquals([
			wm, "/app/path/src/desktop/preload.js", "/app/path/desktop.html", undefined
		])
		o(wm.get(0)).equals(win)
	})

	o("create one window with showWhenReady=true, with lastBounds", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

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
		const desktopTrayMock = n.mock('__tray', {
			getIcon: () => "this is an icon", update: () => {
			}
		}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		wm.newWindow(true)

		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(1)
		o(applicationWindowMock.ApplicationWindow.args).deepEquals([
			wm, "/app/path/src/desktop/preload.js", "/app/path/desktop.html", undefined
		])
		const win = applicationWindowMock.ApplicationWindow.mockedInstances[0]
		win.callbacks["ready-to-show"]()
		o(win.center.callCount).equals(0)
		o(win.setBounds.callCount).equals(1)
		o(win.setBounds.args).deepEquals([testBounds])
		o(win.setZoomFactor.callCount).equals(0)
		o(win.show.callCount).equals(1)
		o(wm.get(1)).equals(win)

		o(desktopTrayMock.update.callCount).equals(1)
	})

	o("create window with noAutoLogin", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {
			getIcon: () => "this is an icon", update: () => {
			}
		}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

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
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {
			getIcon: () => "this is an icon", update: () => {
			}
		}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

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
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {
			getIcon: () => "this is an icon", update: () => {
			}
		}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

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

	o("recreate window", done => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {
			getIcon: () => "this is an icon", update: () => {
			}
		}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		const w1 = wm.newWindow(true)
		const w2 = wm.newWindow(true)
		const w3 = wm.newWindow(true)
		const w4 = wm.newWindow(true)
		const applyBrowserWindow = w => {
			w._browserWindow = {
				destroy: () => w.callbacks['closed'](),
			}
			w.callbacks['ready-to-show']()
		}
		applyBrowserWindow(w1)
		applyBrowserWindow(w2)
		applyBrowserWindow(w3)
		applyBrowserWindow(w4)

		w2.getUserInfo = () => null

		w3.getUserInfo = () => null
		w3.isFocused = () => true

		w4.getUserInfo = () => null
		w4.isMinimized = () => true

		wm.recreateWindow(w1)
		wm.recreateWindow(w2)
		wm.recreateWindow(w3)
		wm.recreateWindow(w4)

		o(wm.getAll().length).equals(4)
		const newW1 = wm.getAll()[3]
		const newW2 = wm.getAll()[2]
		const newW3 = wm.getAll()[1]
		const newW4 = wm.getAll()[0]

		setTimeout(() => {
			o(newW1.openMailBox.callCount).equals(1)
			o(newW1.openMailBox.args[0]).deepEquals({userId: "userId", mailAddress: "mailAddress"})
			o(newW1.openMailBox.args[1]).equals("this/path")
			o(newW1.setBounds.callCount).equals(1)
			o(newW1.setBounds.args[0]).deepEquals({
				rect: {x: 0, y: 0, width: 0, height: 0},
				fullscreen: false
			})
			o(newW1.showInactive.callCount).equals(1)
			o(newW1.minimize.callCount).equals(0)
			o(newW1.show.callCount).equals(0)

			o(newW2.openMailBox.callCount).equals(0)
			o(newW2.showInactive.callCount).equals(1)
			o(newW2.minimize.callCount).equals(0)
			o(newW2.show.callCount).equals(0)

			o(newW3.openMailBox.callCount).equals(0)
			o(newW3.showInactive.callCount).equals(0)
			o(newW3.minimize.callCount).equals(0)
			o(newW3.show.callCount).equals(1)

			o(newW4.openMailBox.callCount).equals(0)
			o(newW4.showInactive.callCount).equals(1)
			o(newW4.minimize.callCount).equals(1)
			o(newW4.show.callCount).equals(0)
			done()
		}, 10)
	})

	o("retain logged in windows", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const dlMock = n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {
			getIcon: () => "this is an icon", update: () => {
			}
		}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock, dlMock)
		wm.setIPC(ipcMock)

		const w = wm.newWindow(true)
		w.callbacks['ready-to-show']()
		const e = {preventDefault: o.spy()}

		// first, before before-quit
		w.callbacks['close'](e)
		o(w.hide.callCount).equals(1)
		o(e.preventDefault.callCount).equals(1)
		o(confMock.setDesktopConfig.callCount).equals(1)

		//now, after
		downcast(electronMock.app.callbacks)['before-quit']()
		w.callbacks['close'](e)
		o(w.hide.callCount).equals(1)
		o(e.preventDefault.callCount).equals(1)
		o(confMock.setDesktopConfig.callCount).equals(2)
	})

	o("hide() hides all windows", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		n.mock("__dl", dl).set()
		n.mock("./DesktopTray", desktopTray).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', desktopTray).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()
		const dlMock = n.mock("__dl", dl).set()

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

