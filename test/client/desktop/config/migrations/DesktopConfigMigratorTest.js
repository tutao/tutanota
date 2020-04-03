// @flow
import o from "ospec/ospec.js"
import n from "../../../nodemocker"

o.spec('desktop config migrator test', function () {

	o("migrations result in correct default config, client", function () {
		const migrator = n.subject('../../src/desktop/config/migrations/DesktopConfigMigrator.js').default
		const configPath = "../../../../../../buildSrc/electron-package-json-template.js"
		const oldConfig = require(configPath)(
			"", "0.0.0", "", "", "", false, false
		)["tutao-config"]["defaultDesktopConfig"]
		const requiredResult = {
			"heartbeatTimeoutInSeconds": 30,
			"defaultDownloadPath": null,
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
			"desktopConfigVersion": 1,
			"showAutoUpdateOption": true,
		}

		o(migrator("migrateClient", oldConfig, oldConfig)).deepEquals(requiredResult)
	})

	o("migrations result in correct default config, admin", function () {
		const migrator = n.subject('../../src/desktop/config/migrations/DesktopConfigMigrator.js').default
		const oldConfig = {
			"runAsTrayApp": true
		}
		const requiredResult = {
			"runAsTrayApp": true,
			"desktopConfigVersion": 1,
			"showAutoUpdateOption": true,
		}

		o(migrator("migrateAdmin", oldConfig, oldConfig)).deepEquals(requiredResult)
	})
})
