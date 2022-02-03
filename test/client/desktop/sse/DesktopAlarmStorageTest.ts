import o from "ospec"
import {instance, matchers, verify, when} from "testdouble"
import {DesktopAlarmStorage} from "../../../../src/desktop/sse/DesktopAlarmStorage"
import {DesktopConfig} from "../../../../src/desktop/config/DesktopConfig"
import {DesktopCryptoFacade} from "../../../../src/desktop/DesktopCryptoFacade"
import type {DesktopKeyStoreFacade} from "../../../../src/desktop/KeyStoreFacadeImpl"
import {makeKeyStoreFacade} from "../../../api/TestUtils"
import {DesktopConfigKey} from "../../../../src/desktop/config/ConfigKeys"

o.spec("DesktopAlarmStorageTest", function () {

	let cryptoMock: DesktopCryptoFacade
	let confMock: DesktopConfig

	o.beforeEach(function () {
		cryptoMock = instance(DesktopCryptoFacade)
		when(cryptoMock.aes256DecryptKeyToB64(matchers.anything(), "user3pw=")).thenReturn("decryptedKey")
		when(cryptoMock.aes256EncryptKeyToB64(matchers.anything(), matchers.anything())).thenReturn("password")

		confMock = instance(DesktopConfig)
		when(confMock.getVar(DesktopConfigKey.pushEncSessionKeys)).thenResolve({
			"user1": "user1pw=",
			"user2": "user2pw=",
			"twoId": "user3pw=",
			"fourId": "user4pw=",
		})
	})

	const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))

	o("getPushIdentifierSessionKey with uncached sessionKey", async function () {
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade)
		const key1 = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "abc",
			pushIdentifier: ["oneId", "twoId"]
		})

		verify(confMock.getVar(DesktopConfigKey.pushEncSessionKeys), {times: 1})
		o(key1).equals("decryptedKey")
	})

	o("getPushIdentifierSessionKey with cached sessionKey", async function () {
		when(confMock.getVar(matchers.anything())).thenResolve(null)
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade)
		await desktopStorage.storePushIdentifierSessionKey("fourId", "user4pw=")

		verify(confMock.setVar(DesktopConfigKey.pushEncSessionKeys, {fourId: "password"}), {times: 1})

		const key1 = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "def",
			pushIdentifier: ["threeId", "fourId"]
		})
		o(key1).equals("user4pw=")
	})

	o("getPushIdentifierSessionKey when sessionKey is unavailable", async function () {
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade)
		const key1 = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "def",
			pushIdentifier: ["fiveId", "sixId"]
		})
		o(key1).equals(null)
	})
})
