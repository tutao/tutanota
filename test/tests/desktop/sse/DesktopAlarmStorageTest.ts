import o from "@tutao/otest"
import { instance, matchers, object, verify, when } from "testdouble"
import { DesktopAlarmStorage } from "../../../../src/common/desktop/sse/DesktopAlarmStorage.js"
import { DesktopConfig } from "../../../../src/common/desktop/config/DesktopConfig.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import type { DesktopKeyStoreFacade } from "../../../../src/common/desktop/DesktopKeyStoreFacade.js"
import { makeKeyStoreFacade } from "../../TestUtils.js"
import { DesktopConfigKey } from "../../../../src/common/desktop/config/ConfigKeys.js"
import { assertNotNull, uint8ArrayToBase64 } from "@tutao/tutanota-utils"

o.spec("DesktopAlarmStorageTest", function () {
	let cryptoMock: DesktopNativeCryptoFacade
	let confMock: DesktopConfig

	const key1 = new Uint8Array([1])
	const key2 = new Uint8Array([2])
	const key3 = new Uint8Array([3])
	const key4 = new Uint8Array([4])
	const decryptedKey = new Uint8Array([0, 1])
	const encryptedKey = new Uint8Array([1, 0])

	o.beforeEach(function () {
		cryptoMock = instance(DesktopNativeCryptoFacade)
		when(cryptoMock.unauthenticatedAes256DecryptKey(matchers.anything(), key3)).thenReturn(decryptedKey)
		when(cryptoMock.aes256EncryptKey(matchers.anything(), matchers.anything())).thenReturn(encryptedKey)

		confMock = object()
		when(confMock.getVar(DesktopConfigKey.pushEncSessionKeys)).thenResolve({
			user1: uint8ArrayToBase64(key1),
			user2: uint8ArrayToBase64(key2),
			twoId: uint8ArrayToBase64(key3),
			fourId: uint8ArrayToBase64(key4),
		})
	})

	o("getPushIdentifierSessionKey with uncached sessionKey", async function () {
		const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade)
		const key = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "abc",
			pushIdentifier: ["oneId", "twoId"],
		})

		verify(confMock.getVar(DesktopConfigKey.pushEncSessionKeys), { times: 1 })
		o(Array.from(assertNotNull(key))).deepEquals(Array.from(decryptedKey))
	})

	o("getPushIdentifierSessionKey with cached sessionKey", async function () {
		const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))
		when(confMock.getVar(matchers.anything())).thenResolve(null)
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade)
		await desktopStorage.storePushIdentifierSessionKey("fourId", key4)

		verify(confMock.setVar(DesktopConfigKey.pushEncSessionKeys, { fourId: uint8ArrayToBase64(encryptedKey) }), { times: 1 })

		const key = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "def",
			pushIdentifier: ["threeId", "fourId"],
		})
		o(Array.from(assertNotNull(key))).deepEquals(Array.from(key4))
	})

	o("getPushIdentifierSessionKey when sessionKey is unavailable", async function () {
		const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade)
		const key1 = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "def",
			pushIdentifier: ["fiveId", "sixId"],
		})
		o(key1).equals(null)
	})
})
