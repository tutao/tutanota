import o from "@tutao/otest"
import { instance, matchers, object, verify, when } from "testdouble"
import { DesktopAlarmStorage } from "../../../../src/common/desktop/sse/DesktopAlarmStorage.js"
import { DesktopConfig } from "../../../../src/common/desktop/config/DesktopConfig.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import type { DesktopKeyStoreFacade } from "../../../../src/common/desktop/DesktopKeyStoreFacade.js"
import { makeKeyStoreFacade } from "../../TestUtils.js"
import { DesktopConfigKey } from "../../../../src/common/desktop/config/ConfigKeys.js"
import { assertNotNull, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { InstancePipeline } from "../../../../src/common/api/worker/crypto/InstancePipeline"
import { resolveClientTypeReference, resolveServerTypeReference } from "../../../../src/common/api/common/EntityFunctions"
import { uint8ArrayToBitArray } from "@tutao/tutanota-crypto"

o.spec("DesktopAlarmStorageTest", function () {
	let cryptoMock: DesktopNativeCryptoFacade
	let confMock: DesktopConfig

	const key1 = new Uint8Array([1])
	const key2 = new Uint8Array([2])
	const key3 = new Uint8Array([3])
	const key4 = new Uint8Array([4])
	const decryptedKey = new Uint8Array([0, 1])
	const encryptedKey = new Uint8Array([1, 0])
	const instancePipeline = new InstancePipeline(resolveClientTypeReference, resolveServerTypeReference)

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
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade, instancePipeline)

		const pushIdentifier: IdTuple = ["oneId", "twoId"]
		const key = await desktopStorage.getPushIdentifierSessionKey(pushIdentifier)

		verify(confMock.getVar(DesktopConfigKey.pushEncSessionKeys), { times: 1 })
		o(Array.from(assertNotNull(key))).deepEquals(uint8ArrayToBitArray(decryptedKey))
	})

	o("getPushIdentifierSessionKey with cached sessionKey", async function () {
		const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))
		when(confMock.getVar(matchers.anything())).thenResolve(null)
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade, instancePipeline)
		await desktopStorage.storePushIdentifierSessionKey("fourId", key4)

		verify(confMock.setVar(DesktopConfigKey.pushEncSessionKeys, { fourId: uint8ArrayToBase64(encryptedKey) }), { times: 1 })

		const pushIdentifier: IdTuple = ["threeId", "fourId"]
		const key = await desktopStorage.getPushIdentifierSessionKey(pushIdentifier)
		o(Array.from(assertNotNull(key))).deepEquals(uint8ArrayToBitArray(key4))
	})

	o("getPushIdentifierSessionKey when sessionKey is unavailable", async function () {
		const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade, instancePipeline)
		const pushIdentifier: IdTuple = ["fiveId", "sixId"]
		const key1 = await desktopStorage.getPushIdentifierSessionKey(pushIdentifier)
		o(key1).equals(null)
	})
})
