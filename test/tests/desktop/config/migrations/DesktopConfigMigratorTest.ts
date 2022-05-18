import o from "ospec"
import {DesktopConfigMigrator} from "../../../../../src/desktop/config/migrations/DesktopConfigMigrator.js"
import {DesktopCryptoFacade} from "../../../../../src/desktop/DesktopCryptoFacade.js"
import {downcast} from "@tutao/tutanota-utils"
import {makeKeyStoreFacade} from "../../../TestUtils.js"
import {DesktopKeyStoreFacade} from "../../../../../src/desktop/KeyStoreFacadeImpl.js";

o.spec('DesktopConfigMigrator', function () {
	let migrator
	let crypto: DesktopCryptoFacade
	let keyStoreFacade: DesktopKeyStoreFacade
	const key = new Uint8Array([1, 2, 3])

	o.before(function () {
		crypto = downcast({
			aesEncryptObject: (encryptionKey, object) => {
				return JSON.stringify(object)
			}
		})

		const electron = downcast({
			session: {
				defaultSession: {
					getSpellCheckerLanguages: () => ["de-DE"]
				}
			}
		})


		keyStoreFacade = makeKeyStoreFacade(key)
		migrator = new DesktopConfigMigrator(crypto, keyStoreFacade, electron)
	})
	o("migrations result in correct default config, client", async function () {
		const oldConfig = {
			"heartbeatTimeoutInSeconds": 30,
			"defaultDownloadPath": null,
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
			"desktopConfigVersion": 1,
			"showAutoUpdateOption": true,
			"pushIdentifier": {
				identifier: "some identifier",
				sseOrigin: "some orign",
				userIds: ["userId1", "userId2"]
			}
		}


		const requiredResult = {
			"heartbeatTimeoutInSeconds": 30,
			"defaultDownloadPath": null,
			"enableAutoUpdate": true,
			"runAsTrayApp": true,
			"desktopConfigVersion": 7,
			"showAutoUpdateOption": true,
			"spellcheck": "de-DE",
			"offlineStorageEnabled": false,
			"mailExportMode": "eml",
			"sseInfo": JSON.stringify(oldConfig.pushIdentifier),
			"lastBounds": {
				"rect": {"x": 200, "y": 200, "width": 1200, "height": 700},
				"fullscreen": false,
				"scale": 1
			}

		}

		o(await migrator.applyMigrations("migrateClient", oldConfig)).deepEquals(requiredResult)
	})

	o("migrations result in correct default config, admin", async function () {
		const oldConfig = {
			"runAsTrayApp": true
		}
		const requiredResult = {
			"runAsTrayApp": true,
			"desktopConfigVersion": 7,
			"showAutoUpdateOption": true,
			"mailExportMode": "eml",
			"spellcheck": "",
			"offlineStorageEnabled": false,
			"lastBounds": {
				"rect": {"x": 200, "y": 200, "width": 1200, "height": 700},
				"fullscreen": false,
				"scale": 1
			}
		}

		o(await migrator.applyMigrations("migrateAdmin", oldConfig)).deepEquals(requiredResult)
	})
})
