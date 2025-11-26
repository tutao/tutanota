import o from "@tutao/otest"
import { Hex, hexToUint8Array, stringToBase64, stringToUtf8Uint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { aes256EncryptSearchIndexEntry, aesDecrypt, aesEncrypt, unauthenticatedAesDecrypt } from "../lib/encryption/Aes.js"
import { CryptoError } from "../lib/misc/CryptoError.js"
import { random } from "../lib/random/Randomizer.js"
import { assertThrows, throwsErrorWithMessage } from "@tutao/tutanota-test-utils"
import {
	Aes128Key,
	Aes256Key,
	aes256RandomKey,
	AesKey,
	AesKeyLength,
	base64ToKey,
	extractIvFromCipherText,
	IV_BYTE_LENGTH,
	keyToBase64,
	keyToUint8Array,
	uint8ArrayToKey,
} from "../lib/index.js"
import { uint8ArrayToBitArray } from "../lib/encryption/symmetric/SymmetricCipherUtils.js"
import { getKeyLengthAsBytes } from "../lib/encryption/symmetric/AesKeyLength.js"

o.spec("aes", function () {
	o("encryption roundtrip 128 without mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, _aes128RandomKey()))
	o("encryption roundtrip 128 with mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, _aes128RandomKey()))
	o("encrypted roundtrip 256 with mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, aes256RandomKey()))
	o("encrypted roundtrip 256 with legacy encrypted data", () => arrayRoundtrip(aes256EncryptSearchIndexEntry, unauthenticatedAesDecrypt, aes256RandomKey()))

	// o("encryption roundtrip 256 webcrypto", browser(function (done, timeout) {
	// 	timeout(1000)
	// 	arrayRoundtrip(done, aes256EncryptFile, aes256DecryptFile, aes256RandomKey(), true)
	// }))
	async function arrayRoundtrip(encrypt, decrypt, key) {
		function runArrayRoundtrip(key: AesKey, plainText) {
			let encrypted = encrypt(key, plainText)
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

	function _hexToKey(hex: Hex): Aes256Key {
		return uint8ArrayToKey(hexToUint8Array(hex))
	}

	function _keyToHex(key: Aes256Key): Hex {
		return uint8ArrayToHex(keyToUint8Array(key))
	}

	o("encryptWithInvalidKey", async function () {
		let key = new Array<number>(2)
		const e = await assertThrows(CryptoError, async () => aesEncrypt(key, stringToUtf8Uint8Array("hello")))
		o(e.message.startsWith("Illegal key length")).equals(true)
	})

	o("decryptWithInvalidKey", async function () {
		let key = new Array<number>(2).fill(0)
		const e = await assertThrows(CryptoError, async () => aesDecrypt(key, new Uint8Array(2)))
		o(e.message.startsWith("Illegal key length")).equals(true)
	})

	o("decryptInvalidData 128", () => decryptInvalidData(_aes128RandomKey(), aesDecrypt, "aes decryption failed> cbc iv must be 128 bits"))
	o("decryptInvalidData 256 without hmac", () =>
		decryptInvalidData(aes256RandomKey(), unauthenticatedAesDecrypt, "aes decryption failed> cbc iv must be 128 bits"),
	)

	function decryptInvalidData(key, decrypt, errorMessage) {
		// useMac is only used for aes256Decrypt
		o.check(() => decrypt(key, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), true, false)).satisfies(throwsErrorWithMessage(CryptoError, errorMessage))
	}

	// o("decryptInvalidData 256 webcrypto", browser(done => {
	// 	let key = aes256RandomKey()
	// 	aes256DecryptFile(key, stringToUtf8Uint8Array("hello")).catch(e => {
	// 		o(e instanceof CryptoError).equals(true)
	// 		o(e.message).equals("aes decryption failed (webcrypto)> The provided data is too small")
	// 		done()
	// 	})
	// }))
	o("decryptManipulatedData 128 without mac", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		//TODO use legacy function no mac
		// let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"))
		// encrypted[0] = encrypted[0] + 1
		// let decrypted = aesDecrypt(key, encrypted)
		// o(utf8Uint8ArrayToString(decrypted)).equals("kello") // => encrypted data has been manipulated (missing MAC)
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

	// TODO uncomment when aes 256 with hmac is implemented
	// o("decryptManipulatedData 256", function (done) {
	// 	let key = aes256RandomKey()
	// 	try {
	// 		let encrypted = aes256Encrypt(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH), true, true)
	// 		encrypted[0] = encrypted[0] + 4
	// 		aes256Decrypt(key, encrypted, true, true)
	// 	} catch (e) {
	// 		o(e instanceof CryptoError).equals(true)
	// 		o(e.message).equals("aes decryption failed> gcm: tag doesn\'t match")
	// 		done()
	// 	}
	// })
	// o("decryptManipulatedData 256 webcrypto", browser(function (done, timeout) {
	// 	timeout(2000)
	// 	let key = aes256RandomKey()
	// 	aes256EncryptFile(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH)).then(encrypted => {
	// 		encrypted[0] = encrypted[0] + 1
	// 		return aes256DecryptFile(key, encrypted)
	// 	}).catch(e => {
	// 		o(e instanceof CryptoError).equals(true)
	// 		o(e.message).equals("aes decryption failed (webcrypto)> ")
	// 		done()
	// 	})
	// }))
	//TODO
	// o("decryptWithWrongKey 128 without mac", () =>
	// 	decryptWithWrongKey(_aes128RandomKey(), _aes128RandomKey(), aesEncrypt, aesDecrypt, "aes decryption failed> pkcs#5 padding corrupt"),
	// )
	o("decryptWithWrongKey 128 with mac", () => decryptWithWrongKey(_aes128RandomKey(), _aes128RandomKey(), aesEncrypt, aesDecrypt, "invalid mac"))
	o("decryptWithWrongKey 256 with mac", () => decryptWithWrongKey(aes256RandomKey(), aes256RandomKey(), aesEncrypt, aesDecrypt, "invalid mac"))

	function decryptWithWrongKey(key, key2, encrypt, decrypt, errorMessage) {
		const encrypted = encrypt(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH), true)
		// useMac is only used for aes256Decrypt
		o.check(() => decrypt(key2, encrypted)).satisfies(throwsErrorWithMessage(CryptoError, errorMessage))
	}

	// o("decryptWithWrongKey 256 webcrypto", browser(function (done, timeout) {
	// 	timeout(2000)
	// 	let key = aes256RandomKey()
	// 	let key2 = aes256RandomKey()
	// 	aes256EncryptFile(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH)).then(encrypted => {
	// 		return aes256DecryptFile(key2, encrypted)
	// 	}).catch(e => {
	// 		o(e instanceof CryptoError).equals(true)
	// 		o(e.message).equals("aes decryption failed (webcrypto)> ")
	// 		done()
	// 	})
	// }))
	o("ciphertextLengths 128 with mac", () => ciphertextLengths(_aes128RandomKey(), aesEncrypt, 65, 81, true))
	o("ciphertextLengths 256 with mac", () => ciphertextLengths(aes256RandomKey(), aesEncrypt, 65, 81, true))

	function ciphertextLengths(key, encrypt, length15BytePlainText, length16BytePlainText, useMac) {
		// check that 15 bytes fit into one block
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcde"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac).length).equals(length15BytePlainText)
		// check that 16 bytes need two blocks (because of one byte padding length info)
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcdef"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac).length).equals(
			length16BytePlainText,
		)
	} // o("ciphertextLengths 256 webcrypto", browser(done => {
	// 	Promise.all([
	// 		aes256EncryptFile(aes256RandomKey(), stringToUtf8Uint8Array("1234567890abcde"), random.generateRandomData(IV_BYTE_LENGTH)).then(encrypted => o(encrypted.length).equals(48)), // check that 15 bytes fit into one block
	// 		aes256EncryptFile(aes256RandomKey(), stringToUtf8Uint8Array("1234567890abcdef"), random.generateRandomData(IV_BYTE_LENGTH)).then(encrypted => o(encrypted.length).equals(64)) // check that 16 bytes need two blocks (because of one byte padding length info)
	// 	]).then(() => done())
	// }))
	o.spec("extract ivs", function () {
		o("can extract IV from cipher text", function () {
			const sk = [4136869568, 4101282953, 2038999435, 962526794, 1053028316, 3236029410, 1618615449, 3232287205]
			const cipherText = "AV1kmZZfCms1pNvUtGrdhOlnDAr3zb2JWpmlpWEhgG5zqYK3g7PfRsi0vQAKLxXmrNRGp16SBKBa0gqXeFw9F6l7nbGs3U8uNLvs6Fi+9IWj"
			const expectedIv = new Uint8Array([93, 100, 153, 150, 95, 10, 107, 53, 164, 219, 212, 180, 106, 221, 132, 233])
			const extractedIv = extractIvFromCipherText(cipherText)
			o(Array.from(extractedIv)).deepEquals(Array.from(expectedIv))
		})

		o("checks that enough bytes are present", async function () {
			await assertThrows(CryptoError, async () => extractIvFromCipherText(""))
			await assertThrows(CryptoError, async () => extractIvFromCipherText(stringToBase64("012345678901234")))
		})
	})
})

export function _aes128RandomKey(): Aes128Key {
	return uint8ArrayToBitArray(random.generateRandomData(getKeyLengthAsBytes(AesKeyLength.Aes128)))
}
