//@flow
import n from "../nodemocker"
import o from "ospec/ospec.js"

o.spec("DesktopCryptoFacadeTest", () => {
	n.startGroup({group: __filename})

	const fs = {
		readFile: () => Promise.resolve("uint8_somedata"),
		writeFile: (file, data) => data === "decrypted" ? Promise.resolve() : Promise.reject("decryption failed")
	}
	const crypto = {
		randomBytes: count => Buffer.alloc(count, 4)
	}
	const instanceMapper = {
		decryptAndMapToInstance: (model, obj, sk) => Promise.resolve(obj)
	}
	const cryptoUtils = {
		uint8ArrayToBitArray: uint8 => uint8 instanceof Uint8Array || uint8.startsWith("uint8") ? "bit_stuff" : "nonsense_bitarray"
	}
	const aes = {
		aes128Decrypt: (key, data) => key.startsWith("bit") && data.startsWith("uint8")
			? "decrypted"
			: "nonsense_aes128decryption",
		aes256Decrypt: (key, data) => key.startsWith("uint8") && data instanceof Uint8Array ? "uint8_stuff" : "nonsense_aes256decryption",
		aes256Encrypt: (key, data) => key.startsWith("uint8") && data instanceof Uint8Array ? "uint8_stuff" : "nonsense_aes256encryption"
	}
	const keyCryptoUtils = {
		decrypt256Key: (key, data) => key.startsWith("uint8") || data instanceof Uint8Array ? "bit_stuff" : "nonsense_256key"
	}
	const encoding = {
		base64ToUint8Array: b64 => b64.startsWith("b64") ? "uint8_stuff" : "nonsense_uint8array",
		uint8ArrayToBase64: uint8 => uint8.startsWith("uint8") ? "b64_stuff" : "nonsense_b64"
	}

	const bufferComp = (a, b) => a.length === b.length && a.includes(b)
	const uint8ArrayComp = (a, b) => a.length === b.length && Object.assign(a, b) === a

	const standardMocks = () => {
		return {
			fsMock: n.mock("fs-extra", fs).set(),
			cryptoMock: n.mock("crypto", crypto).set(),
			instanceMapperMock: n.mock("../api/worker/crypto/InstanceMapper", instanceMapper).set(),
			cryptoUtilsMock: n.mock("../api/worker/crypto/CryptoUtils", cryptoUtils).set(),
			aesMock: n.mock("../api/worker/crypto/Aes", aes).set(),
			keyCryptoUtilsMock: n.mock("../api/worker/crypto/KeyCryptoUtils", keyCryptoUtils).set(),
			encodingMock: n.mock("../api/common/utils/Encoding", encoding).set()
		}
	}

	const setupSubject = () => {
		const sm = standardMocks()
		const {DesktopCryptoFacade} = n.subject("../../src/desktop/DesktopCryptoFacade.js")
		const desktopCrypto = new DesktopCryptoFacade()
		return Object.assign({}, sm, {desktopCrypto})
	}

	o("aesDecryptFile", done => {
		const {desktopCrypto, fsMock, aesMock} = setupSubject()

		const file = "/some/path/to/file"

		desktopCrypto.aesDecryptFile("b64_somekey", file)
		             .then(file => {
			             o(file).equals("/some/path/to/file")
			             o(fsMock.readFile.callCount).equals(1)
			             o(fsMock.readFile.args).deepEquals([file])
			             o(fsMock.writeFile.callCount).equals(1)
			             o(fsMock.writeFile.args).deepEquals([file, "decrypted", {encoding: 'binary'}])

			             o(aesMock.aes128Decrypt.callCount).equals(1)
		             }).then(() => done())
	})

	o("aes256DecryptKeyToB64", () => {
		const {desktopCrypto, aesMock} = setupSubject()

		const key = desktopCrypto.aes256DecryptKeyToB64("uint8_somekey", "b64_encryptedKey")
		o(key).equals("b64_stuff")
		o(aesMock.aes256Decrypt.callCount).equals(1)
		o(aesMock.aes256Decrypt.args.length).equals(4)
		o(aesMock.aes256Decrypt.args[0]).equals("uint8_somekey")
		o(aesMock.aes256Decrypt.args[1].includes(Buffer.from("b64_encryptedKey", 'base64'))).equals(true)
	})

	o("aes256EncryptKeyToB64", () => {
		const {desktopCrypto, aesMock, cryptoMock} = setupSubject()

		const key = desktopCrypto.aes256EncryptKeyToB64("uint8_somekey", "b64_decryptedKey")
		o(key).equals("b64_stuff")
		o(cryptoMock.randomBytes.callCount).equals(1)
		o(cryptoMock.randomBytes.args[0]).equals(16)
		o(aesMock.aes256Encrypt.callCount).equals(1)
		o(aesMock.aes256Encrypt.args.length).equals(5)
		o(aesMock.aes256Encrypt.args[0]).equals("uint8_somekey")
		o(bufferComp(aesMock.aes256Encrypt.args[1], Buffer.from("b64_decryptedKey", 'base64'))).equals(true)
		o(bufferComp(aesMock.aes256Encrypt.args[2], Buffer.from("04040404040404040404040404040404", 'hex'))).equals(true)
	})

	o("decryptAndMapToInstance", done => {
		const {desktopCrypto, instanceMapperMock, keyCryptoUtilsMock} = setupSubject()

		desktopCrypto.decryptAndMapToInstance("somemodel", {a: "property_a", b: true, c: 42}, "b64_piSk", "b64_piSkEncSk")
		             .then(instance => {
			             o(instance).deepEquals({a: "property_a", b: true, c: 42})
			             o(keyCryptoUtilsMock.decrypt256Key.callCount).equals(1)
			             o(keyCryptoUtilsMock.decrypt256Key.args[0]).equals('bit_stuff')
			             o(uint8ArrayComp(keyCryptoUtilsMock.decrypt256Key.args[1], Uint8Array.from(Buffer.from('b64_piSkEncSk', 'base64')))).equals(true)
			             o(instanceMapperMock.decryptAndMapToInstance.callCount).equals(1)
			             o(instanceMapperMock.decryptAndMapToInstance.args).deepEquals([
				             'somemodel',
				             {a: 'property_a', b: true, c: 42},
				             'bit_stuff'
			             ])
		             }).then(() => done())
	})
})