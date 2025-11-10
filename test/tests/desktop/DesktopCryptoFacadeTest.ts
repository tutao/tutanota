import n from "../nodemocker.js"
import o from "@tutao/otest"
import { DesktopNativeCryptoFacade } from "../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import type { CryptoFunctions } from "../../../src/common/desktop/CryptoFns.js"
import { aes256RandomKey, AesKeyLength, Argon2IDExports, getKeyLengthInBytes, random, uint8ArrayToBitArray, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { matchers, object, verify, when } from "testdouble"
import { TempFs } from "../../../src/common/desktop/files/TempFs.js"

o.spec("DesktopCryptoFacadeTest", () => {
	const data = Buffer.from([42])
	const aes128Key = uint8ArrayToBitArray(random.generateRandomData(getKeyLengthInBytes(AesKeyLength.Aes128)))
	const aes256Key = aes256RandomKey()
	const aes256DecryptedKey = aes256RandomKey()
	const aes256EncryptedKey = new Uint8Array([2, 5, 6, 1])
	const encryptedUint8 = stringToUtf8Uint8Array("encrypted")
	const decryptedUint8 = stringToUtf8Uint8Array("decrypted")
	const someKey = new Uint8Array([1, 2])
	const instanceMapper = {
		decryptAndMapToInstance: (model, obj, sk) => Promise.resolve(obj),
	}
	const encoding = {
		base64ToUint8Array: (b64) => (b64.startsWith("b64") ? "uint8_stuff" : "nonsense_uint8array"),
		uint8ArrayToBase64: (uint8) => (uint8.startsWith("uint8") ? "b64_stuff" : "nonsense_b64"),
	}

	const bufferComp = (a, b) => a.length === b.length && a.includes(b)

	const uint8ArrayComp = (a, b) => a.length === b.length && Object.assign(a, b) === a

	const standardMocks = () => {
		return {
			cryptoMock: n.mock("crypto", crypto).set(),
			instanceMapperMock: n.mock("../api/worker/crypto/InstanceMapper", instanceMapper).set(),
			encodingMock: n.mock("../api/common/utils/Encoding", encoding).set(),
		}
	}

	const setupSubject = () => {
		const cryptoFnsMock: CryptoFunctions = object()
		when(cryptoFnsMock.aesEncrypt(aes128Key, matchers.anything())).thenReturn(decryptedUint8)
		when(cryptoFnsMock.encryptKey(aes256Key, aes256DecryptedKey)).thenReturn(aes256EncryptedKey)

		when(cryptoFnsMock.aesDecrypt(aes128Key, matchers.anything())).thenReturn(decryptedUint8)
		when(cryptoFnsMock.decryptKey(aes256Key, aes256EncryptedKey)).thenReturn(aes256DecryptedKey)

		when(cryptoFnsMock.decryptKeyUnauthenticatedWithDeviceKeyChain(aes256Key, aes256EncryptedKey)).thenReturn(aes256DecryptedKey)

		when(cryptoFnsMock.decryptKey(aes128Key, aes256EncryptedKey)).thenReturn(aes256DecryptedKey)
		when(cryptoFnsMock.bytesToKey(someKey)).thenReturn(aes128Key)
		when(cryptoFnsMock.randomBytes(matchers.anything())).thenReturn(Buffer.alloc(10, 4))
		when(cryptoFnsMock.aes256RandomKey()).thenReturn(uint8ArrayToKey(Buffer.alloc(32, 1)))

		const fsPromises: typeof import("fs").promises = object()
		when(fsPromises.readFile(matchers.anything())).thenResolve(data)
		when(fsPromises.mkdir(matchers.anything())).thenResolve()
		when(fsPromises.writeFile(matchers.anything(), decryptedUint8)).thenResolve()
		when(fsPromises.readdir(matchers.anything())).thenResolve([])
		const fsMock: typeof import("fs") = object()
		fsMock.promises = fsPromises

		const sm = standardMocks()
		const tfs = object<TempFs>()
		when(tfs.getTutanotaTempPath()).thenReturn("/some/other/path/to")
		when(tfs.ensureEncryptedDir()).thenResolve("/some/other/path/to/encrypted")
		when(tfs.ensureUnencrytpedDir()).thenResolve("/some/other/path/to/decrypted")

		const argon2: Promise<Argon2IDExports> = Promise.resolve(object())
		const desktopCrypto = new DesktopNativeCryptoFacade(fsMock, cryptoFnsMock, tfs, argon2)
		return Object.assign({}, sm, {
			fsMock,
			cryptoFnsMock,
			desktopCrypto,
		})
	}
	o("aesEncryptFile", async function () {
		const { desktopCrypto, fsMock } = setupSubject()
		const { uri } = await desktopCrypto.aesEncryptFile(someKey, "/some/path/to/encrypted/file.pdf")
		o(uri).equals("/some/other/path/to/encrypted/file.pdf")
		verify(fsMock.promises.writeFile(matchers.anything(), matchers.anything()), { times: 1 })
	})
	o("aesDecryptFile", async function () {
		const { desktopCrypto, fsMock } = setupSubject()
		const file = await desktopCrypto.aesDecryptFile(someKey, "/some/path/to/file.pdf")
		o(file).equals("/some/other/path/to/decrypted/file.pdf")
		verify(fsMock.promises.writeFile(matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })
	})
	o("unauthenticatedAes256DecryptKey", function () {
		const { desktopCrypto } = setupSubject()
		const key = desktopCrypto.decryptKeyUnauthenticatedWithDeviceKeyChain(aes256Key, aes256EncryptedKey)
		o(Array.from(key)).deepEquals(Array.from(aes256DecryptedKey))
	})
	o("aes256EncryptKey", function () {
		const { desktopCrypto, cryptoFnsMock } = setupSubject()
		desktopCrypto.aes256EncryptKey(aes256Key, aes256DecryptedKey)
		verify(cryptoFnsMock.encryptKey(aes256Key, aes256DecryptedKey), { times: 1 })
	})
})
