// @flow
import o from "ospec/ospec.js"
import n from '../../nodemocker'
import {CryptoError} from "../../../../src/api/common/error/CryptoError"
import {uint8ArrayToBitArray} from "../../../../src/api/worker/crypto/CryptoUtils"

o.spec("DesktopAlarmStorageTest", () => {
	n.startGroup({
		group: __filename, allowables: [
			"./TutanotaError",
			"../error/CryptoError",
			"../../api/common/utils/Encoding",
			"../../api/common/error/CryptoError",
			"./StringUtils",
			"./EntityConstants",
			"./Utils",
			"../../api/common/utils/Utils",
			"./utils/Utils",
			"../TutanotaConstants",
			"./utils/ArrayUtils",
			"./MapUtils",
		]
	})

	const electron = {}
	const keytar = {
		findPassword: () => Promise.resolve("password")
	}
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
		getDesktopConfig: (key: string) => {
			switch (key) {
				case "pushEncSessionKeys":
					return {
						"user1": "user1pw=",
						"user2": "user2pw=",
						"twoId": "user3pw=",
						"fourId": "user4pw=",
					}
				default:
					throw new Error(`unexpected getDesktopConfig key ${key}`)
			}
		},
		setDesktopConfig: () => {}
	}
	const aes = {}

	const standardMocks = () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()
		const keytarMock = n.mock("keytar", keytar).set()

		// our modules
		const entityFunctionMock = n.mock("../EntityFunctions", entityFunctions).set()
		n.mock('../../api/common/EntityFunctions', entityFunctions).set()
		const aesMock = n.mock('../../api/worker/crypto/Aes', aes).set()
		const cryptoMock = n.mock("../DesktopCryptoFacade", crypto).set()
		const cryptoUtilsMock = n.mock("../../api/worker/crypto/CryptoUtils", cryptoUtils).set()

		// instances
		const wmMock = n.mock('__wm', wm).set()
		const confMock = n.mock("__conf", conf).set()

		return {
			electronMock,
			keytarMock,
			cryptoMock,
			confMock,
			wmMock,
			aesMock,
			entityFunctionMock
		}
	}

	o("init", () => {
		const {confMock, cryptoMock} = standardMocks()

		const {DesktopAlarmStorage} = n.subject('../../src/desktop/sse/DesktopAlarmStorage.js')
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock)
		desktopStorage.init().then()
	})

	o("resolvePushIdentifierSessionKey with uncached sessionKey", done => {
		const {confMock, cryptoMock} = standardMocks()

		const {DesktopAlarmStorage} = n.subject('../../src/desktop/sse/DesktopAlarmStorage.js')
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock)
		desktopStorage.init().then(() => desktopStorage.resolvePushIdentifierSessionKey([
				{pushIdentifierSessionEncSessionKey: "abc", pushIdentifier: ["oneId", "twoId"]},
				{pushIdentifierSessionEncSessionKey: "def", pushIdentifier: ["threeId", "fourId"]}
			])
		).then(() => {
			o(cryptoMock.aes256DecryptKeyToB64.callCount).equals(2)
		}).then(() => done())
	})

	o("resolvePushIdentifierSessionKey with cached sessionKey", done => {
		const {cryptoMock} = standardMocks()
		const confMock = n.mock("__conf", conf).with({
			getDesktopConfig: key => {}
		}).set()

		const {DesktopAlarmStorage} = n.subject('../../src/desktop/sse/DesktopAlarmStorage.js')
		const desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock)
		desktopStorage.init().then(() => {
			return desktopStorage.storePushIdentifierSessionKey("fourId", "user4pw=")
		}).then(() => desktopStorage.resolvePushIdentifierSessionKey([
				{pushIdentifierSessionEncSessionKey: "abc", pushIdentifier: ["oneId", "twoId"]},
				{pushIdentifierSessionEncSessionKey: "def", pushIdentifier: ["threeId", "fourId"]}
			])
		).then(() => {
			o(cryptoMock.aes256DecryptKeyToB64.callCount).equals(0)
			o(confMock.setDesktopConfig.callCount).equals(1)
			o(confMock.setDesktopConfig.args.length).equals(2)
			o(confMock.setDesktopConfig.args[0]).equals("pushEncSessionKeys")
			o(confMock.setDesktopConfig.args[1]).deepEquals({fourId: "password"})
		}).then(() => done())
	})
})
