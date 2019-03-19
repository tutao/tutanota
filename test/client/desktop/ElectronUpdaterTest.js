// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("ElectronUpdater Test", function () {
	o.beforeEach(n.enable)
	o.afterEach(n.disable)

	n.allow([
		'./utils/Utils', '../api/common/utils/Utils',
		'./DesktopLocalizationProvider.js',
		'./TutanotaError',
		'../api/common/error/RestError',
		'../api/common/error/UpdateError',
		'./DesktopNotifier',
		'../TutanotaConstants'
	])

	const fsExtra = {
		existsSync: (path: string) => true,
		mkdirp: (path: string) => {},
		writeJSONSync: (path: string, object: any) => {},
		readJSONSync: (path: string) => {
			return {
				"heartbeatTimeoutInSeconds": 240,
				"defaultDownloadPath": "/mock-Downloads/"
			}
		},
		writeJson: (path: string, obj: any, formatter: {spaces: number}, cb: ()=>void): void => cb(),
	}

	const electron = {
		app: {
			getPath: (path: string) => `/mock-${path}/`,
			getVersion: (): string => "3.45.0"
		},
		net: {
			request: (url: string) => {}
		}
	}

	const nodeForge = {}

	const electronUpdater = {
		autoUpdater: {
			logger: undefined,
			on: () => n.spyify(electronUpdater.autoUpdater)
		}
	}

	const desktopTray = {
		getIcon: () => {return {}}
	}

	o("construction & start", () => {
		//mock node modules
		const forgeMock = n.mock('node-forge', nodeForge).get()
		const electronMock = n.mock('electron', electron).get()
		const {autoUpdater} = n.mock('electron-updater', electronUpdater).get()

		//mock our modules
		const desktopTrayMock = n.mock('./DesktopTray', desktopTray).get()

		//mock instances
		const conf = n.spyify({
			removeListener: (key: string, cb: ()=>void) => conf,
			on: (key: string) => conf,
			getDesktopConfig: (key: string) => {
				switch (key) {
					case 'enableAutoUpdate':
						return true
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
						return 150
					default:
						throw new Error(`unexpected get key ${key}`)
				}
			}
		})
		const notifier = n.spyify({})

		const {ElectronUpdater} = n.subject('../../src/desktop/ElectronUpdater.js')
		const upd = new ElectronUpdater(conf, notifier)

		o(autoUpdater.on.callCount).equals(3)
		o(autoUpdater.logger).equals(null)

		//upd.start()
	})
})
