import o from "@tutao/otest"
import { DesktopConfig } from "../../../../src/common/desktop/config/DesktopConfig.js"
import { DesktopConfigMigrator } from "../../../../src/common/desktop/config/migrations/DesktopConfigMigrator.js"
import { noOp } from "@tutao/tutanota-utils"
import { DesktopKeyStoreFacade } from "../../../../src/common/desktop/DesktopKeyStoreFacade.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { DesktopConfigKey } from "../../../../src/common/desktop/config/ConfigKeys.js"
import { ConfigFile } from "../../../../src/common/desktop/config/ConfigFile.js"
import { function as fn, matchers, object, verify, when } from "testdouble"

o.spec("DesktopConfigTest", function () {
	let desktopConfig: DesktopConfig
	let configMigrator: DesktopConfigMigrator
	let keyStoreFacade: DesktopKeyStoreFacade
	let desktopCrypto: DesktopNativeCryptoFacade
	let desktopConfigFile: ConfigFile

	o.beforeEach(async function () {
		const buildConfigFile: ConfigFile = object()
		when(buildConfigFile.readJSON()).thenResolve({
			"tutao-config": {
				defaultDesktopConfig: {},
				configMigrationFunction: "",
			},
		})
		when(buildConfigFile.writeJSON(matchers.anything())).thenResolve(undefined)
		when(buildConfigFile.ensurePresence(matchers.anything())).thenResolve(undefined)

		desktopConfigFile = object()
		when(desktopConfigFile.readJSON()).thenResolve({
			"tutao-config": {
				defaultDesktopConfig: {},
				configMigrationFunction: "",
			},
		})
		when(desktopConfigFile.writeJSON(matchers.anything())).thenResolve(undefined)
		when(desktopConfigFile.ensurePresence(matchers.anything())).thenResolve(undefined)

		configMigrator = object()
		const configCaptor = matchers.captor()
		when(configMigrator.applyMigrations(matchers.anything(), configCaptor.capture())).thenDo(() => Promise.resolve(configCaptor.value))

		keyStoreFacade = object()
		when(keyStoreFacade.getDeviceKey()).thenResolve([1, 2, 3])
		when(keyStoreFacade.getKeyChainKey()).thenResolve([4, 5, 6])

		desktopCrypto = object()
		when(desktopCrypto.aesDecryptObject(matchers.anything(), matchers.anything())).thenReturn("decrypted")
		when(desktopCrypto.aesEncryptObject(matchers.anything(), matchers.anything())).thenReturn("encrypted")

		desktopConfig = new DesktopConfig(configMigrator, keyStoreFacade, desktopCrypto)
		await desktopConfig.init(buildConfigFile, desktopConfigFile)
	})

	o("setVar updates config value", async function () {
		const cb1 = fn<(a: any) => void>()
		desktopConfig.on(DesktopConfigKey.lastBounds, cb1)
		await desktopConfig.setVar(DesktopConfigKey.lastBounds, "change")
		verify(cb1("change"), { times: 1 })
		// writeJSON is called twice, because it is called once in the init
		verify(desktopConfigFile.writeJSON(matchers.argThat((a) => a.lastBounds === "change")), { times: 2 })
	})

	o("setVar updates correct config value", async function () {
		const cb1 = fn<(a: any) => void>()
		const cb2 = fn<(a: any) => void>()
		desktopConfig.on(DesktopConfigKey.lastBounds, cb1)
		desktopConfig.on(DesktopConfigKey.spellcheck, cb2)

		o(await desktopConfig.getVar(DesktopConfigKey.lastBounds)).equals(undefined)
		o(await desktopConfig.getVar(DesktopConfigKey.spellcheck)).equals(undefined)

		await desktopConfig.setVar(DesktopConfigKey.lastBounds, "change")

		o(await desktopConfig.getVar(DesktopConfigKey.lastBounds)).equals("change")
		o(await desktopConfig.getVar(DesktopConfigKey.spellcheck)).equals(undefined)
		verify(cb1("change"), { times: 1 })
		verify(cb2(matchers.anything()), { times: 0 })
		// writeJSON is called twice, because it is called once in the init
		verify(desktopConfigFile.writeJSON(matchers.argThat((a) => a.lastBounds === "change")), { times: 2 })
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
		o(desktopConfig.onValueSetListeners[DesktopConfigKey.lastBounds][0]).deepEquals({ cb: cb1, once: false })
	})

	o("once listeners are only called once", async function () {
		const onceCb = fn<(a: any) => void>()
		desktopConfig.once(DesktopConfigKey.runAsTrayApp, onceCb)
		verify(onceCb(matchers.anything()), { times: 0 })
		await desktopConfig.setVar(DesktopConfigKey.runAsTrayApp, true)
		verify(onceCb(matchers.anything()), { times: 1 })
		await desktopConfig.setVar(DesktopConfigKey.runAsTrayApp, false)
		verify(onceCb(matchers.anything()), { times: 1 })
	})

	o("on listeners are called multiple times", async function () {
		const onCb = fn<(a: any) => void>()
		desktopConfig.on(DesktopConfigKey.runAsTrayApp, onCb)
		verify(onCb(matchers.anything()), { times: 0 })
		await desktopConfig.setVar(DesktopConfigKey.runAsTrayApp, true)
		verify(onCb(matchers.anything()), { times: 1 })
		await desktopConfig.setVar(DesktopConfigKey.runAsTrayApp, false)
		verify(onCb(matchers.anything()), { times: 2 })
	})
})
