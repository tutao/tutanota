// @flow
import o from "ospec"
import {DesktopConfigMigrator} from "../../../../../src/desktop/config/migrations/DesktopConfigMigrator"
import {DesktopCryptoFacade} from "../../../../../src/desktop/DesktopCryptoFacade"
import {downcast} from "../../../../../src/api/common/utils/Utils"
import type {DesktopDeviceKeyProvider} from "../../../../../src/desktop/DeviceKeyProviderImpl"
import {makeDeviceKeyProvider} from "../../../../api/TestUtils"

o.spec('desktop config migrator test', function () {
	let migrator
	let crypto: DesktopCryptoFacade
	let deviceKeyProvider: DesktopDeviceKeyProvider
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


		deviceKeyProvider = makeDeviceKeyProvider(key)
		migrator = new DesktopConfigMigrator(crypto, deviceKeyProvider, electron)
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
			"desktopConfigVersion": 5,
			"showAutoUpdateOption": true,
			"spellcheck": "de-DE",
			"mailExportMode": "eml",
			"sseInfo": JSON.stringify(oldConfig.pushIdentifier),
		}

		o(await migrator.applyMigrations("migrateClient", oldConfig)).deepEquals(requiredResult)
	})

	o("migrations result in correct default config, admin", async function () {
		const oldConfig = {
			"runAsTrayApp": true
		}
		const requiredResult = {
			"runAsTrayApp": true,
			"desktopConfigVersion": 5,
			"showAutoUpdateOption": true,
			"mailExportMode": "eml",
			"spellcheck": "",
		}

		o(await migrator.applyMigrations("migrateAdmin", oldConfig)).deepEquals(requiredResult)
	})
})
