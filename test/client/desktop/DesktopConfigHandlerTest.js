// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"
import path from "path"
import {noOp} from "../../../src/api/common/utils/Utils"

o.spec('desktop config handler test', function () {

	o.beforeEach(n.enable)
	o.afterEach(n.disable)

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
		},
		dialog: {
			showMessageBox: noOp
		}
	}

	const packageJson = {
		"tutao-config": {
			"pubKeyUrl": "https://raw.githubusercontent.com/tutao/tutanota/electron-client/tutao-pub.pem",
			"pollingInterval": 10000,
			"checkUpdateSignature": true,
			"appUserModelId": "de.tutao.tutanota-mock",
			"initialSseConnectTimeoutInSeconds": 60,
			"maxSseConnectTimeoutInSeconds": 2400,
			"defaultDesktopConfig": {
				"heartbeatTimeoutInSeconds": 30,
				"defaultDownloadPath": null,
				"enableAutoUpdate": true,
				"runAsTrayApp": true,
			}
		}
	}

	o("package.json & userConf", () => {
		const packageJsonMock = n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		const fsExtraMock = n.mock('fs-extra', fsExtra).set()
		const electronMock = n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		// check if there is a user conf already (yes)
		o(fsExtraMock.existsSync.callCount).equals(1)
		o(fsExtraMock.existsSync.args[0]).equals("/mock-userData/conf.json")

		// read it
		o(fsExtraMock.readJSONSync.callCount).equals(1)
		o(fsExtraMock.readJSONSync.args[0]).equals("/mock-userData/conf.json")

		// make sure the userData folder exists
		o(fsExtraMock.mkdirp.callCount).equals(1)
		o(fsExtraMock.mkdirp.args[0]).equals("/mock-userData/")

		// write combined desktop config back
		o(fsExtraMock.writeJSONSync.callCount).equals(1)
		o(fsExtraMock.writeJSONSync.args[0]).equals("/mock-userData/conf.json")
		o(fsExtraMock.writeJSONSync.args[1]).deepEquals({
			"heartbeatTimeoutInSeconds": 240,
			"defaultDownloadPath": "/mock-Downloads/",
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
		})
	})

	o("package.json & no userConf", () => {
		n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		n.mock('electron', electron).set()
		const fsExtraMock = n.mock('fs-extra', fsExtra)
		                     .with({existsSync: () => false})
		                     .set()


		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		// check if there is a user conf already (no)
		o(fsExtraMock.existsSync.callCount).equals(1)
		o(fsExtraMock.existsSync.args[0]).equals("/mock-userData/conf.json")

		// do not read it
		o(fsExtraMock.readJSONSync.callCount).equals(0)

		// make sure the userData folder exists
		o(fsExtraMock.mkdirp.callCount).equals(1)
		o(fsExtraMock.mkdirp.args[0]).equals("/mock-userData/")

		// write default desktop config
		o(fsExtraMock.writeJSONSync.callCount).equals(1)
		o(fsExtraMock.writeJSONSync.args[0]).equals("/mock-userData/conf.json")
		o(fsExtraMock.writeJSONSync.args[1]).deepEquals({
			"heartbeatTimeoutInSeconds": 30,
			"defaultDownloadPath": null,
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
		})
	})

	o("package.json unavailable", () => {
		n.mock(path.resolve(__dirname, '../../../package.json'), undefined).set()
		n.mock('fs-extra', fsExtra).set()
		n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		// exit program
		o(process.exit.callCount).equals(1)
		o(process.exit.args[0]).equals(1)
	})

	o("get values from conf", () => {
		n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		n.mock('fs-extra', fsExtra).set()
		n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		o(conf.get("pollingInterval")).equals(10000)
		o(conf.getDesktopConfig("heartbeatTimeoutInSeconds")).equals(240)
		o(conf.get()).deepEquals({
			"pubKeyUrl": "https://raw.githubusercontent.com/tutao/tutanota/electron-client/tutao-pub.pem",
			"pollingInterval": 10000,
			"checkUpdateSignature": true,
			"appUserModelId": "de.tutao.tutanota-mock",
			"initialSseConnectTimeoutInSeconds": 60,
			"maxSseConnectTimeoutInSeconds": 2400,
			"defaultDesktopConfig": {
				"heartbeatTimeoutInSeconds": 240,
				"defaultDownloadPath": "/mock-Downloads/",
				"enableAutoUpdate": true,
				"runAsTrayApp": true,
			}
		})
		o(conf.getDesktopConfig()).deepEquals({
			"heartbeatTimeoutInSeconds": 240,
			"defaultDownloadPath": "/mock-Downloads/",
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
		})
	})

	o("change single value and update conf file", (done) => {
		const packageJsonMock = n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		const fsExtraMock = n.mock('fs-extra', fsExtra).set()
		const electronMock = n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		conf.setDesktopConfig("enableAutoUpdate", false).then(() => {
			const expectedConfig = {
				"heartbeatTimeoutInSeconds": 240,
				"defaultDownloadPath": "/mock-Downloads/",
				"enableAutoUpdate": false,
				"runAsTrayApp": true,
			}
			// value was changed in memory
			o(conf._desktopConfig).deepEquals(expectedConfig)

			//config was written to disk
			o(fsExtraMock.writeJson.callCount).equals(1)
			o(fsExtraMock.writeJson.args[0]).equals("/mock-userData/conf.json")
			o(fsExtraMock.writeJson.args[1]).deepEquals(expectedConfig)
			done()
		})
	})

	o("update entire conf", (done) => {
		const packageJsonMock = n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		const fsExtraMock = n.mock('fs-extra', fsExtra).set()
		const electronMock = n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		const expectedConfig = {
			"heartbeatTimeoutInSeconds": 30,
			"defaultDownloadPath": "helloWorld",
			"enableAutoUpdate": false,
			"runAsTrayApp": false,
		}

		conf.setDesktopConfig("any", expectedConfig).then(() => {
			// value was changed in memory
			o(conf._desktopConfig).deepEquals(expectedConfig)

			//config was written to disk
			o(fsExtraMock.writeJson.callCount).equals(1)
			o(fsExtraMock.writeJson.args[0]).equals("/mock-userData/conf.json")
			o(fsExtraMock.writeJson.args[1]).deepEquals(expectedConfig)
			done()
		})
	})

	o("set listener and change value", (done) => {
		n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		n.mock('fs-extra', fsExtra).set()
		n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		const downloadPathListener = o.spy(v => {})
		const heartbeatListener = o.spy(v => {})
		const anyListener = o.spy(v => {})

		conf.on("defaultDownloadPath", downloadPathListener)
		conf.on("heartBeatTimeoutInSeconds", heartbeatListener)
		conf.on("any", anyListener)

		conf.setDesktopConfig("defaultDownloadPath", "/mock-downloads/").then(() => {
			o(downloadPathListener.callCount).equals(1)
			o(downloadPathListener.args[0]).equals("/mock-downloads/")

			// this key was not changed
			o(heartbeatListener.callCount).equals(0)

			//this should be called for any changes
			o(anyListener.callCount).equals(1)
			o(anyListener.args[0]).deepEquals({
				"heartbeatTimeoutInSeconds": 240,
				"defaultDownloadPath": "/mock-downloads/",
				"enableAutoUpdate": true,
				"runAsTrayApp": true,
			})
			done()
		})
	})

	o("removeListener splices out the right listener", done => {
		n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		n.mock('fs-extra', fsExtra).set()
		n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		const listener1 = o.spy(v => {})
		const listener2 = o.spy(v => {})
		const listener3 = o.spy(v => {})
		const listener4 = o.spy(v => {})

		conf.on("defaultDownloadPath", listener1)
		conf.on("defaultDownloadPath", listener2)
		conf.on("defaultDownloadPath", listener3)
		conf.on("defaultDownloadPath", listener4)

		conf.removeListener("defaultDownloadPath", listener3)

		conf.setDesktopConfig("defaultDownloadPath", "/mock-downloads/").then(() => {
			o(listener1.callCount).equals(1)
			o(listener2.callCount).equals(1)
			o(listener3.callCount).equals(0)
			o(listener4.callCount).equals(1)
			done()
		})
	})

	o("set/remove listeners and change value", done => {
		n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		n.mock('fs-extra', fsExtra).set()
		n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		const listener1 = o.spy(v => {})
		const listener2 = o.spy(v => {})
		const listener3 = o.spy(v => {})

		conf.on("defaultDownloadPath", listener1)
		conf.removeListener("defaultDownloadPath", listener1)

		conf.on("defaultDownloadPath", listener2)
		conf.on("defaultDownloadPath", listener3)

		conf.setDesktopConfig("defaultDownloadPath", "/mock-downloads/").then(() => {
			o(listener1.callCount).equals(0)

			o(listener2.callCount).equals(1)
			o(listener2.args[0]).equals("/mock-downloads/")
			o(listener3.callCount).equals(1)
			o(listener3.args[0]).equals("/mock-downloads/")
			done()
		})
	})

	o("removeAllListeners removes all listeners", done => {
		n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).set()
		n.mock('fs-extra', fsExtra).set()
		n.mock('electron', electron).set()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		const listener1 = o.spy(v => {})
		const listener2 = o.spy(v => {})
		const listener3 = o.spy(v => {})

		conf.on("defaultDownloadPath", listener1)
		conf.on("heartbeatTimeoutInSeconds", listener2)
		conf.on("defaultDownloadPath", listener3)
		conf.removeAllListeners()

		conf.setDesktopConfig("defaultDownloadPath", "/mock-downloads/").then(() => {
			o(listener1.callCount).equals(0)
			o(listener2.callCount).equals(0)
			o(listener3.callCount).equals(0)
			done()
		})
	})
})
