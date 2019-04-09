// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"
import type {UserInfo} from "../../../src/desktop/ApplicationWindow"

o.spec("Desktop Window Manager Test", () => {
	o.beforeEach(n.enable)
	o.afterEach(n.disable)

	n.allow([
		'../api/Env'
	])

	const electron = {
		app: {
			once: (ev: string, cb: ()=>void) => n.spyify(electron.app)
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
				callbacks: [],
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
				getUserId: () => "userId",
				center: function () {},
				setBounds: function () {},
				show: function () {
					this.callbacks["focus"]()
				},
				setZoomFactor: function () {}
			},
			statics: {
				lastId: 0
			}
		})
	}

	const desktopDownloadManager = {
		DesktopDownloadManager: n.classify({
			prototype: {
				constructor: function () {}
			},
			statics: {}
		})
	}

	const conf = {
		removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
		on: (key: string) => n.spyify(conf),
		getDesktopConfig: (key: string) => {
			switch (key) {
				case 'lastBounds':
					return undefined
				default:
					throw new Error(`unexpected getDesktopConfig key ${key}`)
			}
		},
		get: (key: string) => {
			switch (key) {
				case 'checkUpdateSignature':
					return true
				case 'pubKeyUrl':
					return 'https://b.s'
				case 'pollingInterval':
					return 300
				default:
					throw new Error(`unexpected get key ${key}`)
			}
		}
	}

	const notifier = {
		resolveGroupedNotification: () => {}
	}

	const ipc = {}

	o("construction", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const desktopDownloadManagerMock = n.mock("./DesktopDownloadManager", desktopDownloadManager).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {getIcon: () => "this is an icon"}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock)
		wm.setIPC(ipcMock)
		o(desktopDownloadManagerMock.DesktopDownloadManager.mockedInstances.length).equals(1)
		o(desktopDownloadManagerMock.DesktopDownloadManager.args).deepEquals([confMock])
		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(0)
	})

	o("create one window with showWhenReady=false, no lastBounds", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const desktopDownloadManagerMock = n.mock("./DesktopDownloadManager", desktopDownloadManager).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {getIcon: () => "this is an icon"}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock)
		wm.setIPC(ipcMock)

		wm.newWindow(false)

		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(1)
		const win = applicationWindowMock.ApplicationWindow.mockedInstances[0]
		o(win.center.callCount).equals(1)
		o(win.setBounds.callCount).equals(0)
		o(win.show.callCount).equals(0)
		o(applicationWindowMock.ApplicationWindow.args).deepEquals([wm])
		o(wm.get(0)).equals(win)
	})

	o("create one window with showWhenReady=true, with lastBounds", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const desktopDownloadManagerMock = n.mock("./DesktopDownloadManager", desktopDownloadManager).set()

		// instances
		const testBounds = {rect: {height: 10, width: 10, x: 10, y: 10}, fullscreen: false}
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
		const desktopTrayMock = n.mock('__tray', {getIcon: () => "this is an icon", update: () => {}}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock)
		wm.setIPC(ipcMock)

		wm.newWindow(true)

		o(applicationWindowMock.ApplicationWindow.mockedInstances.length).equals(1)
		o(applicationWindowMock.ApplicationWindow.args).deepEquals([wm])
		const win = applicationWindowMock.ApplicationWindow.mockedInstances[0]
		win.callbacks["ready-to-show"]()
		o(win.center.callCount).equals(0)
		o(win.setBounds.callCount).equals(1)
		o(win.setBounds.args).deepEquals([testBounds])
		o(win.setZoomFactor.callCount).equals(1)
		o(win.setZoomFactor.args[0]).equals(1.0)
		o(win.show.callCount).equals(1)
		o(wm.get(1)).equals(win)

		o(desktopTrayMock.update.callCount).equals(1)
	})

	o("getLastFocused returns the last focused window", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const desktopDownloadManagerMock = n.mock("./DesktopDownloadManager", desktopDownloadManager).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {getIcon: () => "this is an icon", update: () => {}}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock)
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

	o("wm is saving bounds to file when closing", () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()

		// our modules
		const applicationWindowMock = n.mock("./ApplicationWindow", applicationWindow).set()
		const desktopDownloadManagerMock = n.mock("./DesktopDownloadManager", desktopDownloadManager).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const desktopTrayMock = n.mock('__tray', {getIcon: () => "this is an icon", update: () => {}}).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		const {WindowManager} = n.subject('../../src/desktop/DesktopWindowManager.js')
		const wm = new WindowManager(confMock, desktopTrayMock, notifierMock)
		wm.setIPC(ipcMock)

		const w = wm.newWindow(true)
	})
})

