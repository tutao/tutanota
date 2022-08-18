import n from "../nodemocker.js"
import o from "ospec"
import {DesktopNativeCryptoFacade} from "../../../src/desktop/DesktopNativeCryptoFacade.js"
import type {Base64} from "@tutao/tutanota-utils"
import {arrayEquals, downcast, stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import type {CryptoFunctions} from "../../../src/desktop/CryptoFns.js"
import type {TypeModel} from "../../../src/api/common/EntityTypes.js"
import {keyToUint8Array, uint8ArrayToBitArray} from "@tutao/tutanota-crypto"
import {object, when} from "testdouble"
import {DesktopUtils} from "../../../src/desktop/DesktopUtils.js"

o.spec("DesktopCryptoFacadeTest", () => {
	const data = "uint8_somedata"
	const aes128Key = [1, 2, 8]
	const aes256Key = [2, 5, 6]
	const aes256DecryptedKey = new Uint8Array([2, 5, 6, 2])
	const aes256EncryptedKey = new Uint8Array([2, 5, 6, 1])
	const encryptedUint8 = stringToUtf8Uint8Array("encrypted")
	const decryptedUint8 = stringToUtf8Uint8Array("decrypted")
	const someKey = new Uint8Array([1, 2])
	const cryptoFns: CryptoFunctions = {
		aes128Encrypt(key: Aes128Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array {
			if (key === aes128Key) {
				return decryptedUint8
			} else {
				throw new Error("stub!")
			}
		},

		aes128Decrypt(key: Aes128Key, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array {
			if (key === aes128Key) {
				return decryptedUint8
			} else {
				throw new Error("stub!")
			}
		},

		aes256Encrypt(
			key: Aes256Key,
			bytes: Uint8Array,
			iv: Uint8Array,
			usePadding: boolean,
			useMac: boolean,
		): Uint8Array {
			if (key === aes256Key && arrayEquals(aes256DecryptedKey, bytes)) {
				return aes256EncryptedKey
			} else {
				throw new Error("stub!")
			}
		},

		aes256Decrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array {
			if (key === aes256Key && arrayEquals(encryptedBytes, aes256EncryptedKey)) {
				return aes256DecryptedKey
			} else {
				throw new Error("stub!")
			}
		},

		decrypt256Key(encryptionKey: Aes128Key, key: Uint8Array): Aes256Key {
			if (arrayEquals(encryptionKey, aes128Key) && arrayEquals(key, aes256EncryptedKey)) {
				return uint8ArrayToBitArray(aes256DecryptedKey)
			} else {
				throw new Error("stub!")
			}
		},

		bytesToKey(bytes: Uint8Array): BitArray {
			if (arrayEquals(bytes, someKey)) {
				return aes128Key
			} else {
				throw new Error("stub!")
			}
		},

		base64ToKey(base64: Base64): BitArray {
			throw new Error("stub!")
		},

		verifySignature(pem: string, arg0: Uint8Array, arg1: Uint8Array): boolean {
			throw new Error("stub!")
		},

		randomBytes(nbrOfBytes: number): Uint8Array {
			return Buffer.alloc(nbrOfBytes, 4)
		},

		decryptAndMapToInstance<T>(
			model: TypeModel,
			instance: Record<string, any>,
			sk: Aes128Key | null | undefined,
		): Promise<T> {
			return Promise.resolve(instance as T)
		},

		aes256RandomKey() {
			return uint8ArrayToBitArray(Buffer.alloc(32, 1))
		},
	}
	const fs = {
		promises: {
			readFile: () => Promise.resolve(data),
			mkdir: () => Promise.resolve(),
			writeFile: (file, data) =>
				data === decryptedUint8 ? Promise.resolve() : Promise.reject("decryption failed"),
		},
	}
	const instanceMapper = {
		decryptAndMapToInstance: (model, obj, sk) => Promise.resolve(obj),
	}
	const encoding = {
		base64ToUint8Array: b64 => (b64.startsWith("b64") ? "uint8_stuff" : "nonsense_uint8array"),
		uint8ArrayToBase64: uint8 => (uint8.startsWith("uint8") ? "b64_stuff" : "nonsense_b64"),
	}

	const bufferComp = (a, b) => a.length === b.length && a.includes(b)

	const uint8ArrayComp = (a, b) => a.length === b.length && Object.assign(a, b) === a

	const standardMocks = () => {
		return {
			fsMock: n.mock<typeof import("fs")>("fs-extra", fs).set(),
			cryptoMock: n.mock("crypto", crypto).set(),
			instanceMapperMock: n.mock("../api/worker/crypto/InstanceMapper", instanceMapper).set(),
			encodingMock: n.mock("../api/common/utils/Encoding", encoding).set(),
			cryptoFnsMock: n.mock<CryptoFunctions>("cryptoFns", cryptoFns).set(),
		}
	}

	const setupSubject = () => {
		const sm = standardMocks()
		const utils = object<DesktopUtils>()
		when(utils.getTutanotaTempPath()).thenReturn("/some/other/path/to")
		const desktopCrypto = new DesktopNativeCryptoFacade(sm.fsMock, sm.cryptoFnsMock, utils)
		return Object.assign({}, sm, {
			desktopCrypto,
		})
	}
	o("aesEncryptFile", async function () {
		const {desktopCrypto, fsMock} = setupSubject()
		const {uri} = await desktopCrypto.aesEncryptFile(someKey, "/some/path/to/encrypted/file.pdf")
		o(uri).equals("/some/other/path/to/encrypted/file.pdf")
		o(fsMock.promises.writeFile.callCount).equals(1)
	})
	o("aesDecryptFile", async function () {
		const {desktopCrypto, fsMock} = setupSubject()
		const file = await desktopCrypto.aesDecryptFile(someKey, "/some/path/to/file.pdf")
		o(file).equals("/some/other/path/to/decrypted/file.pdf")
		o(fsMock.promises.writeFile.callCount).equals(1)
	})
	o("aes256DecryptKey", function () {
		const {desktopCrypto} = setupSubject()
		const key = desktopCrypto.aes256DecryptKey(aes256Key, aes256EncryptedKey)
		o(Array.from(key)).deepEquals(Array.from(aes256DecryptedKey))
	})
	o("aes256EncryptKey", function () {
		const {desktopCrypto, cryptoFnsMock} = setupSubject()
		const key = desktopCrypto.aes256EncryptKey(aes256Key, aes256DecryptedKey)
		o(Array.from(key)).deepEquals(Array.from(aes256EncryptedKey))
		o(cryptoFnsMock.randomBytes.callCount).equals(1)
	})
	o("decryptAndMapToInstance", async function () {
		const {desktopCrypto, cryptoFnsMock} = setupSubject()
		const instance = await desktopCrypto.decryptAndMapToInstance(
			downcast("somemodel"),
			{
				a: "property_a",
				b: true,
				c: 42,
			},
			keyToUint8Array(aes128Key),
			aes256EncryptedKey,
		)
		o(instance as any).deepEquals({
			a: "property_a",
			b: true,
			c: 42,
		})
		o(cryptoFnsMock.decrypt256Key.callCount).equals(1)
		o(cryptoFnsMock.decrypt256Key.args[0]).deepEquals(aes128Key)
		o(uint8ArrayComp(cryptoFnsMock.decrypt256Key.args[1], aes256EncryptedKey)).equals(true)
		o(cryptoFnsMock.decryptAndMapToInstance.callCount).equals(1)
		o(cryptoFnsMock.decryptAndMapToInstance.args).deepEquals([
			"somemodel",
			{
				a: "property_a",
				b: true,
				c: 42,
			},
			uint8ArrayToBitArray(aes256DecryptedKey),
		])
	})
})