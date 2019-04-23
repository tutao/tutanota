// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("DesktopTrayTest", () => {
	o.beforeEach(n.enable)
	o.afterEach(n.disable)

	n.allow([
		'path'
	])

	const electron = {
		nativeImage: {
			createFromPath: path => 'this is an icon'
		},
		app: {
			dock: {
				show: () => {},
				setMenu: () => {},
				isVisible: () => false,
			}
		},
		Tray: n.classify({
			prototype: {
				callbacks: [],
				on: function (ev: string, cb: ()=>void) {
					this.callbacks[ev] = cb
					return this
				},
				setContextMenu: function () {}
			},
			statics: {}
		}),
		Menu: n.classify({
			prototype: {
				append: function () {}
			},
			statics: {}
		}),
		MenuItem: n.classify({
			prototype: {},
			statics: {}
		})
	}

	const conf = {
		removeListener: (key: string, cb: ()=>void) => n.spyify(conf),
		on: (key: string) => n.spyify(conf),
		getDesktopConfig: (key: string) => {
			switch (key) {
				case 'runAsTrayApp':
					return false
				default:
					throw new Error(`unexpected getDesktopConfig key ${key}`)
			}
		},
		setDesktopConfig: (key: string) => {},
		get: (key: string) => {
			switch (key) {
				case 'iconName':
					return 'iconName.name'
				default:
					throw new Error(`unexpected get key ${key}`)
			}
		}
	}

	const wm = {
		getAll: () => [{getTitle: () => 'a'}, {getTitle: () => 'b'}, {getTitle: () => 'c'}]
	}

	const lang = {
		lang: {
			initialized: {
				promise: {
					then: cb => setImmediate(cb)
				}
			},
			get: (key: string) => {
				if (["openNewWindow_action", "quit_action"].includes(key)) {
					return key
				}
				throw new Error(`unexpected lang key ${key}`)
			}
		}
	}

	const notifier = {
		resolveGroupedNotification: () => {},
		hasNotificationsForWindow: () => false
	}

	o("update without tray", () => {
		//node modules
		const electronMock = n.mock("electron", electron).set()

		//our modules
		n.mock('./DesktopLocalizationProvider.js', lang).set()

		// instances
		const confMock = n.mock('__conf', conf).set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const wmMock = n.mock('__wm', wm).set()

		const {DesktopTray} = n.subject('../../src/desktop/DesktopTray.js')
		const tray = new DesktopTray(confMock, notifierMock)
		tray.setWindowManager(wmMock)

		tray.update()
		o(confMock.getDesktopConfig.callCount).equals(1)
		o(confMock.getDesktopConfig.args[0]).equals('runAsTrayApp')
	})

	o("update with tray, mac, 3 windows", done => {
		n.setPlatform("darwin")
		//node modules
		const electronMock = n.mock("electron", electron).set()

		//our modules
		n.mock('./DesktopLocalizationProvider.js', lang).set()

		// instances
		const confMock = n.mock('__conf', conf)
		                  .with({
			                  getDesktopConfig: (key: string) => {
				                  switch (key) {
					                  case 'runAsTrayApp':
						                  return true
					                  default:
						                  throw new Error(`unexpected getDesktopConfig key ${key}`)
				                  }
			                  }
		                  })
		                  .set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const wmMock = n.mock('__wm', wm).set()

		const {DesktopTray} = n.subject('../../src/desktop/DesktopTray.js')
		const tray = new DesktopTray(confMock, notifierMock)
		tray.setWindowManager(wmMock)

		tray.update()
		setTimeout(() => {
			o(electronMock.Menu.mockedInstances.length).equals(1)
			o(electronMock.MenuItem.mockedInstances.length).equals(5)
			o(electronMock.Menu.mockedInstances[0].append.callCount).equals(5)
			o(electronMock.app.dock.setMenu.callCount).equals(1)
			o(electronMock.Menu.mockedInstances.length).equals(1)
			o(electronMock.app.dock.setMenu.args[0]).equals(electronMock.Menu.mockedInstances[0])
			o(electronMock.app.dock.isVisible.callCount).equals(1)
			o(electronMock.app.dock.show.callCount).equals(1)
			done()
		}, 10)
	})

	o("update with tray, win, 3 windows", done => {
		n.setPlatform("win32")
		//node modules
		const electronMock = n.mock("electron", electron).set()

		//our modules
		n.mock('./DesktopLocalizationProvider.js', lang).set()

		// instances
		const confMock = n.mock('__conf', conf)
		                  .with({
			                  getDesktopConfig: (key: string) => {
				                  switch (key) {
					                  case 'runAsTrayApp':
						                  return true
					                  default:
						                  throw new Error(`unexpected getDesktopConfig key ${key}`)
				                  }
			                  }
		                  })
		                  .set()
		const notifierMock = n.mock('__notifier', notifier).set()
		const wmMock = n.mock('__wm', wm).set()

		const {DesktopTray} = n.subject('../../src/desktop/DesktopTray.js')
		const tray = new DesktopTray(confMock, notifierMock)
		tray.setWindowManager(wmMock)

		tray.update()
		setTimeout(() => {
			o(electronMock.Menu.mockedInstances.length).equals(1)
			o(electronMock.Menu.mockedInstances[0].append.callCount).equals(7)
			done()
		}, 10)
	})
})
