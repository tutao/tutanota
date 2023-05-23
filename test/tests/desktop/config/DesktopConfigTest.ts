import o from "ospec"
import { DesktopConfig } from "../../../../src/desktop/config/DesktopConfig.js"
import { DesktopConfigMigrator } from "../../../../src/desktop/config/migrations/DesktopConfigMigrator.js"
import { downcast, noOp } from "@tutao/tutanota-utils"
import { DesktopKeyStoreFacade } from "../../../../src/desktop/KeyStoreFacadeImpl.js"
import { DesktopNativeCryptoFacade } from "../../../../src/desktop/DesktopNativeCryptoFacade.js"
import { DesktopConfigKey } from "../../../../src/desktop/config/ConfigKeys.js"
import { ConfigFile } from "../../../../src/desktop/config/ConfigFile.js"

o.spec("DesktopConfigTest", function () {
	let desktopConfig: DesktopConfig
	let configMigrator: DesktopConfigMigrator
	let keyStoreFacade: DesktopKeyStoreFacade
	let desktopCrypto: DesktopNativeCryptoFacade
	let desktopConfigFile: ConfigFile

	o.beforeEach(async function () {
		const buildConfigFile: ConfigFile = downcast({
			readJSON: () => {
				return Promise.resolve({
					"tutao-config": {
						defaultDesktopConfig: "hello",
						configMigrationFunction: "",
					},
				})
			},
			writeJSON: (obj: any) => {
				return Promise.resolve()
			},
			ensurePresence: () => {
				return Promise.resolve()
			},
		})

		desktopConfigFile = downcast({
			readJSON: () => {
				return Promise.resolve({
					"tutao-config": {
						defaultDesktopConfig: "hello",
						configMigrationFunction: "",
					},
				})
			},
			writeJSON: o.spy((obj: any) => {
				return Promise.resolve()
			}),
			ensurePresence: () => {
				return Promise.resolve()
			},
		})

		configMigrator = downcast({
			applyMigrations: o.spy((migrationFunction, oldConfig) => {
				return oldConfig
			}),
		})

		keyStoreFacade = downcast({
			getDeviceKey: () => {
				return "test"
			},
			getCredentialsKey: () => {
				return "test"
			},
		})

		desktopCrypto = downcast({
			aesDecryptObject: o.spy((key, value) => {
				return "decrypted"
			}),
			aesEncryptObject: o.spy((key, value) => {
				return "encrypted"
			}),
		})

		desktopConfig = new DesktopConfig(configMigrator, keyStoreFacade, desktopCrypto)
		await desktopConfig.init(buildConfigFile, desktopConfigFile)
	})

	o("setVar updates config value", async function () {
		const cb1 = o.spy((value: any) => noOp())
		desktopConfig.on(DesktopConfigKey.lastBounds, cb1)

		o(await desktopConfig.getVar(DesktopConfigKey.lastBounds)).equals(undefined)

		await desktopConfig.setVar(DesktopConfigKey.lastBounds, "change")

		o(await desktopConfig.getVar(DesktopConfigKey.lastBounds)).equals("change")
		// writeJSON is called twice, because it is called once in the init
		o(desktopConfigFile.writeJSON.callCount).equals(2)
		o(cb1.callCount).equals(1)
	})

	o("setVar updates correct config value", async function () {
		const cb1 = o.spy((value: any) => noOp())
		const cb2 = o.spy((value: any) => noOp())
		desktopConfig.on(DesktopConfigKey.lastBounds, cb1)
		desktopConfig.on(DesktopConfigKey.spellcheck, cb2)

		o(await desktopConfig.getVar(DesktopConfigKey.lastBounds)).equals(undefined)
		o(await desktopConfig.getVar(DesktopConfigKey.spellcheck)).equals(undefined)

		await desktopConfig.setVar(DesktopConfigKey.lastBounds, "change")

		o(await desktopConfig.getVar(DesktopConfigKey.lastBounds)).equals("change")
		o(await desktopConfig.getVar(DesktopConfigKey.spellcheck)).equals(undefined)
		// writeJSON is called twice, because it is called once in the init
		o(desktopConfigFile.writeJSON.callCount).equals(2)
		o(cb1.callCount).equals(1)
		o(cb2.callCount).equals(0)
	})

	o("removeAllListeners creates empty OnValueSetListeners object", function () {
		desktopConfig.on(DesktopConfigKey.lastBounds, () => {})
		desktopConfig.on(DesktopConfigKey.spellcheck, () => {})

		desktopConfig.removeAllListeners()
		o(Object.keys(desktopConfig.onValueSetListeners).length).equals(0)
	})

	o("removeAllListeners removes all listeners from correct key", function () {
		desktopConfig.on(DesktopConfigKey.lastBounds, () => {})
		desktopConfig.on(DesktopConfigKey.spellcheck, () => {})

		desktopConfig.removeAllListeners(DesktopConfigKey.lastBounds)
		o(desktopConfig.onValueSetListeners[DesktopConfigKey.lastBounds].length).equals(0)
	})

	o("removeListener removes correct listener from correct key", function () {
		const cb1 = () => noOp()
		const cb2 = () => noOp()
		desktopConfig.on(DesktopConfigKey.lastBounds, cb1)
		desktopConfig.on(DesktopConfigKey.lastBounds, cb2)

		desktopConfig.removeListener(DesktopConfigKey.lastBounds, cb2)
		o(desktopConfig.onValueSetListeners[DesktopConfigKey.lastBounds].length).equals(1)
		o(desktopConfig.onValueSetListeners[DesktopConfigKey.lastBounds][0]).equals(cb1)
	})
})
