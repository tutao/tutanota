import o from "ospec"
import n from '../../nodemocker'
import {CryptoError} from "../../../../src/api/common/error/CryptoError"
import {DesktopAlarmStorage} from "../../../../src/desktop/sse/DesktopAlarmStorage"
import type {DesktopConfig} from "../../../../src/desktop/config/DesktopConfig"
import {downcast} from "@tutao/tutanota-utils"
import type {DesktopCryptoFacade} from "../../../../src/desktop/DesktopCryptoFacade"
import type {DesktopDeviceKeyProvider} from "../../../../src/desktop/DeviceKeyProviderImpl"
import {makeDeviceKeyProvider} from "../../../api/TestUtils"
import {uint8ArrayToBitArray} from "@tutao/tutanota-crypto"

o.spec("DesktopAlarmStorageTest", function () {
	const electron = {}
	const crypto = {
		aes256DecryptKeyToB64: (pw, data) => {
			if (data !== "user3pw=") {
				throw new CryptoError("nope")
			}
			return "decryptedKey"
		},
		aes256EncryptKeyToB64: (pw, data) => "password"

	}
	const entityFunctions = {
		elementIdPart: (tuple) => tuple[1]
	}
	const wm = {}
	const cryptoUtils = {
		uint8ArrayToBitArray
	}
	const conf = {
		getVar: (key: string) => {
			switch (key) {
				case "pushEncSessionKeys":
					return {
						"user1": "user1pw=",
						"user2": "user2pw=",
						"twoId": "user3pw=",
						"fourId": "user4pw=",
					}
				default:
					throw new Error(`unexpected getVar key ${key}`)
			}
		},
		setVar: () => {}
	}
	const aes = {}

	const standardMocks = () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()
		// our modules
		const entityFunctionMock = n.mock("../EntityFunctions", entityFunctions).set()
		n.mock('../../api/common/EntityFunctions', entityFunctions).set()
		const aesMock = n.mock('../../api/worker/crypto/Aes', aes).set()
		const cryptoMock = downcast<DesktopCryptoFacade>(n.mock("../DesktopCryptoFacade", crypto).set())

		// instances
		const wmMock = n.mock('__wm', wm).set()
		const confMock: DesktopConfig = downcast(n.mock("__conf", conf).set())

		const secretStorageMock = {
			getPassword: o.spy(() => Promise.resolve("password")),
			setPassword: o.spy(() => Promise.resolve())
		}

		return {
			electronMock,
			cryptoMock,
			confMock,
			wmMock,
			aesMock,
			entityFunctionMock,
			secretStorageMock
		}
	}

	const deviceKeyProvider: DesktopDeviceKeyProvider = makeDeviceKeyProvider(new Uint8Array([1, 2, 3]))

	o("getPushIdentifierSessionKey with uncached sessionKey", async function () {
		const {confMock, cryptoMock} = standardMocks()

		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, deviceKeyProvider)
		const key1 = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "abc",
			pushIdentifier: ["oneId", "twoId"]
		})
		o(confMock.getVar.callCount).equals(1)
		o(key1).equals("decryptedKey")
	})

	o("getPushIdentifierSessionKey with cached sessionKey", async function () {
		const {cryptoMock} = standardMocks()
		const confMock = downcast<DesktopConfig>(n.mock("__conf", conf).with({
				// no keys in config
				getVar: key => {}
			}).set()
		)
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, deviceKeyProvider)
		await desktopStorage.storePushIdentifierSessionKey("fourId", "user4pw=")

		o(confMock.setVar.callCount).equals(1)
		o(confMock.setVar.args.length).equals(2)
		o(confMock.setVar.args[0]).equals("pushEncSessionKeys")
		o(confMock.setVar.args[1]).deepEquals({fourId: "password"})

		const key1 = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "def",
			pushIdentifier: ["threeId", "fourId"]
		})
		o(key1).equals("user4pw=")
	})

	o("getPushIdentifierSessionKey when sessionKey is unavailable", async function () {
		const {cryptoMock, confMock} = standardMocks()
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, deviceKeyProvider)
		const key1 = await desktopStorage.getPushIdentifierSessionKey({
			pushIdentifierSessionEncSessionKey: "def",
			pushIdentifier: ["fiveId", "sixId"]
		})
		o(key1).equals(null)
	})
})
