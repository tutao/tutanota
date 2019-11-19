// @flow
import o from "ospec/ospec.js"
import n from '../../nodemocker'

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
	const keytar = {}
	const crypto = {}
	const entityFunctions = {}
	const wm = {}
	const conf = {}
	const aes = {}
	const cryptoUtils = {}

	const standardMocks = () => {
		// node modules
		const electronMock = n.mock("electron", electron).set()
		const keytarMock = n.mock("keytar", keytar).set()
		const cryptoMock = n.mock("crypto", crypto).set()

		// our modules
		const entityFunctionMock = n.mock("../EntityFunctions", entityFunctions).set()
		n.mock('../../api/common/EntityFunctions', entityFunctions).set()
		const aesMock = n.mock('../../api/worker/crypto/Aes', aes).set()
		const cryptoUtilsMock = n.mock('../../api/worker/crypto/CryptoUtils', cryptoUtils).set()

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
			cryptoUtilsMock,
			entityFunctionMock
		}
	}

	o("init", () => {
		const {confMock} = standardMocks()

		const {DesktopAlarmStorage} = n.subject('../../src/desktop/sse/DesktopAlarmStorage.js')
		const desktopStorage = new DesktopAlarmStorage(confMock)
	})
})
