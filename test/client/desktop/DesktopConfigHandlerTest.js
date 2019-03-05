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
		}
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

	o.only("package.json & userConf", () => {
		const packageJsonMock = n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).get()
		const fsExtraMock = n.mock('fs-extra', fsExtra).get()
		const electronMock = n.mock('electron', electron).get()

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

	o.only("package.json & no userConf", () => {
		n.mock(path.resolve(__dirname, '../../../package.json'), packageJson).get()
		n.mock('electron', electron).get()
		const fsExtraMock = n.mock('fs-extra', fsExtra)
		                     .with({existsSync: () => false})
		                     .get()


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

	o.only("package.json unavailable", () => {
		n.mock(path.resolve(__dirname, '../../../package.json'), undefined).get()
		n.mock('fs-extra', fsExtra).get()
		n.mock('electron', electron).get()

		const {DesktopConfigHandler} = n.subject('../../src/desktop/DesktopConfigHandler.js')
		const conf = new DesktopConfigHandler()

		// exit program
		o(process.exit.callCount).equals(1)
		o(process.exit.args[0]).equals(1)
	})
})
