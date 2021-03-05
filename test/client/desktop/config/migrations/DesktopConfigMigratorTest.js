// @flow
import o from "ospec"

o.spec('desktop config migrator test', function () {
	let migrator
	o.before(async function () {
		migrator = (await import('../../../../../src/desktop/config/migrations/DesktopConfigMigrator')).default
	})
	o("migrations result in correct default config, client", function () {
		const oldConfig = {
			"heartbeatTimeoutInSeconds": 30,
			"defaultDownloadPath": null,
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
			"desktopConfigVersion": 1,
			"showAutoUpdateOption": true,
		}

		const requiredResult = {
			"heartbeatTimeoutInSeconds": 30,
			"defaultDownloadPath": null,
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
			"desktopConfigVersion": 2,
			"showAutoUpdateOption": true,
			"mailExportMode": "eml"
		}

		o(migrator("migrateClient", oldConfig, oldConfig)).deepEquals(requiredResult)
	})

	o("migrations result in correct default config, admin", function () {
		const oldConfig = {
			"runAsTrayApp": true
		}
		const requiredResult = {
			"runAsTrayApp": true,
			"desktopConfigVersion": 2,
			"showAutoUpdateOption": true,
			"mailExportMode": "eml"
		}

		o(migrator("migrateAdmin", oldConfig, oldConfig)).deepEquals(requiredResult)
	})
})
