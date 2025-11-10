import o from "@tutao/otest"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import {
	aes256EncryptSearchIndexEntry,
	aes256EncryptSearchIndexEntryWithIV,
	aesDecrypt,
	aesDecryptUnauthenticated,
	aesEncrypt,
	aesEncryptConfigurationDatabaseItem,
} from "../lib/encryption/Aes.js"
import { CryptoError } from "../lib/misc/CryptoError.js"
import { random } from "../lib/random/Randomizer.js"
import { assertThrows, throwsErrorWithMessage } from "@tutao/tutanota-test-utils"
import { Aes128Key, aes256RandomKey, AesKey, AesKeyLength, base64ToKey, keyToBase64 } from "../lib/index.js"
import { BLOCK_SIZE_BYTES, uint8ArrayToBitArray } from "../lib/encryption/symmetric/SymmetricCipherUtils.js"
import { getKeyLengthInBytes } from "../lib/encryption/symmetric/AesKeyLength.js"

o.spec("aes", function () {
	const iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])

	o("encryption roundtrip 128 without mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, _aes128RandomKey()))
	o("encryption roundtrip 128 with mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, _aes128RandomKey()))
	o("encrypted roundtrip 256 with mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, aes256RandomKey()))
	o("encrypted roundtrip 256 searchIndexEntry", () => arrayRoundtrip(aes256EncryptSearchIndexEntry, aesDecryptUnauthenticated, aes256RandomKey()))
	o("encrypted roundtrip 256 searchIndexEntryWithIV", () =>
		arrayRoundtrip(aes256EncryptSearchIndexEntryWithIV, aesDecryptUnauthenticated, aes256RandomKey(), iv),
	)
	o("encrypted roundtrip 256 ConfigurationDatabaseItem", () => arrayRoundtrip(aesEncryptConfigurationDatabaseItem, aesDecrypt, aes256RandomKey(), iv))
	async function arrayRoundtrip(encrypt, decrypt, key, iv?: Uint8Array) {
		function runArrayRoundtrip(key: AesKey, plainText) {
			let encrypted = encrypt(key, plainText, iv)
			return Promise.resolve(encrypted)
				.then((encrypted) => {
					return (decrypt as any)(key, encrypted)
				})
				.then((decrypted) => {
					o(Array.from(decrypted)).deepEquals(Array.from(plainText))
				})
		}

		await runArrayRoundtrip(key, random.generateRandomData(0))
		await runArrayRoundtrip(key, random.generateRandomData(1))
		await runArrayRoundtrip(key, random.generateRandomData(15))
		await runArrayRoundtrip(key, random.generateRandomData(16))
		await runArrayRoundtrip(key, random.generateRandomData(17))
		await runArrayRoundtrip(key, random.generateRandomData(12345))
	}

	o("generateRandomKeyAndBase64Conversion 128", () => randomKeyBase64Conversion(_aes128RandomKey, 24))
	o("generateRandomKeyAndBase64Conversion 256", () => randomKeyBase64Conversion(aes256RandomKey, 44))

	function randomKeyBase64Conversion(randomKey, length) {
		let key1Base64 = keyToBase64(randomKey())
		let key2Base64 = keyToBase64(randomKey())
		let key3Base64 = keyToBase64(randomKey())
		// make sure the keys are different
		o(key1Base64).notEquals(key2Base64)
		o(key1Base64).notEquals(key3Base64)
		// test the key length to be 128 bit
		o(key1Base64.length).equals(length)
		o(key2Base64.length).equals(length)
		o(key3Base64.length).equals(length)
		// test conversion
		o(keyToBase64(base64ToKey(key1Base64))).equals(key1Base64)
		o(keyToBase64(base64ToKey(key2Base64))).equals(key2Base64)
		o(keyToBase64(base64ToKey(key3Base64))).equals(key3Base64)
	}

	o("encryptWithInvalidKey", async function () {
		let key = new Array<number>(2)
		const e = await assertThrows(CryptoError, async () => aesEncrypt(key, stringToUtf8Uint8Array("hello")))
		o(e.message.startsWith("Illegal key length")).equals(true)
	})

	o("decryptWithInvalidKey", async function () {
		let key = new Array<number>(2).fill(0)
		const e = await assertThrows(CryptoError, async () => aesDecrypt(key, new Uint8Array(BLOCK_SIZE_BYTES)))
		o(e.message.startsWith("Illegal key length")).equals(true)
	})

	o("decryptInvalidData 128", () => decryptInvalidData(_aes128RandomKey(), aesDecrypt, "aes decryption failed> cbc iv must be 128 bits"))
	o("decryptInvalidData 256 without hmac", () =>
		decryptInvalidData(aes256RandomKey(), aesDecryptUnauthenticated, "aes decryption failed> cbc iv must be 128 bits"),
	)

	function decryptInvalidData(key, decrypt, errorMessage) {
		// useMac is only used for aes256Decrypt
		o.check(() => decrypt(key, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), true, false)).satisfies(throwsErrorWithMessage(CryptoError, errorMessage))
	}

	o("decryptManipulatedData 128 without mac", function () {
		const key = [151050668, 1341212767, 316219065, 2150939763]
		let encrypted = aes256EncryptSearchIndexEntryWithIV(key, stringToUtf8Uint8Array("hello"), iv)
		encrypted[0] = encrypted[0] + 1
		let decrypted = aesDecryptUnauthenticated(key, encrypted)
		o(utf8Uint8ArrayToString(decrypted)).equals("kello") // => encrypted data has been manipulated (missing MAC)
	})
	o("decryptManipulatedData 128 with mac", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"))
		encrypted[1] = encrypted[1] + 1

		o.check(() => aesDecrypt(key, encrypted)).satisfies(throwsErrorWithMessage(CryptoError, "invalid mac"))
		try {
			aesDecrypt(key, encrypted)
		} catch (e) {
			const error = e as Error
			o(error instanceof CryptoError).equals(true)
			o(error.message).equals("invalid mac")
		}
	})
	o("decryptManipulatedMac 128 with mac", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"))
		encrypted[encrypted.length - 1] = encrypted[encrypted.length - 1] + 1

		o.check(() => aesDecrypt(key, encrypted)).satisfies(throwsErrorWithMessage(CryptoError, "invalid mac"))
	})

	o("decryptManipulatedData 256", function () {
		let key = aes256RandomKey()
		try {
			let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"))
			encrypted[1] = encrypted[1] + 4
			aesDecrypt(key, encrypted)
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message).equals("invalid mac")
		}
	})

	o("decryptWithWrongKey 128 without mac", () =>
		decryptWithWrongKey(_aes128RandomKey(), _aes128RandomKey(), aes256EncryptSearchIndexEntry, aesDecrypt, "aes decryption failed> pkcs#5 padding corrupt"),
	)
	o("decryptWithWrongKey 128 with mac", () => decryptWithWrongKey(_aes128RandomKey(), _aes128RandomKey(), aesEncrypt, aesDecrypt, "invalid mac"))
	o("decryptWithWrongKey 256 with mac", () => decryptWithWrongKey(aes256RandomKey(), aes256RandomKey(), aesEncrypt, aesDecrypt, "invalid mac"))

	function decryptWithWrongKey(key, key2, encrypt, decrypt, errorMessage) {
		const encrypted = encrypt(key, stringToUtf8Uint8Array("hello"))
		o.check(() => decrypt(key2, encrypted)).satisfies(throwsErrorWithMessage(CryptoError, errorMessage))
	}

	o("ciphertextLengths 128 with mac", () => ciphertextLengths(_aes128RandomKey(), aesEncrypt, 65, 81))
	o("ciphertextLengths 256 with mac", () => ciphertextLengths(aes256RandomKey(), aesEncrypt, 65, 81))

	function ciphertextLengths(key, encrypt, length15BytePlainText, length16BytePlainText) {
		// check that 15 bytes fit into one block
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcde")).length).equals(length15BytePlainText)
		// check that 16 bytes need two blocks (because of one byte padding length info)
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcdef")).length).equals(length16BytePlainText)
	}
})

export function _aes128RandomKey(): Aes128Key {
	return uint8ArrayToBitArray(random.generateRandomData(getKeyLengthInBytes(AesKeyLength.Aes128)))
}
