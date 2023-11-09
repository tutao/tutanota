import o from "@tutao/otest"
import type { Hex } from "@tutao/tutanota-utils"
import { concat, hexToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, uint8ArrayToHex, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import {
	aes128RandomKey,
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	getAesSubKeys,
	IV_BYTE_LENGTH,
	KEY_LENGTH_BITS_AES_256,
	MAC_ENABLED_PREFIX,
	unauthenticatedAesDecrypt,
	verifyKeySize,
} from "../lib/encryption/Aes.js"
import { base64ToKey, bitArrayToUint8Array, keyToBase64, uint8ArrayToBitArray } from "../lib/misc/Utils.js"
import { CryptoError } from "../lib/misc/CryptoError.js"
import { random } from "../lib/random/Randomizer.js"
import { assertThrows, throwsErrorWithMessage } from "@tutao/tutanota-test-utils"
import sjcl from "../lib/internal/sjcl.js"

o.spec("aes", function () {
	o("encryption roundtrip 128 without mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, aes128RandomKey(), false))
	o("encryption roundtrip 128 with mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, aes128RandomKey(), true))
	o("encryption roundtrip 256 without mac throws", async () => {
		await assertThrows(CryptoError, async () => await arrayRoundtrip(aesEncrypt, aesDecrypt, aes256RandomKey(), false))
	})
	o("encrypted roundtrip 256 with mac", () => arrayRoundtrip(aesEncrypt, aesDecrypt, aes256RandomKey(), true))
	o("encrypted roundtrip 256 with legacy encrypted data", () => arrayRoundtrip(aes256EncryptLegacy, unauthenticatedAesDecrypt, aes256RandomKey(), false))

	// o("encryption roundtrip 256 webcrypto", browser(function (done, timeout) {
	// 	timeout(1000)
	// 	arrayRoundtrip(done, aes256EncryptFile, aes256DecryptFile, aes256RandomKey(), true)
	// }))
	async function arrayRoundtrip(encrypt, decrypt, key, useMac: boolean) {
		function runArrayRoundtrip(key: AesKey, plainText) {
			let encrypted = encrypt(key, plainText, random.generateRandomData(IV_BYTE_LENGTH), true, useMac)
			return Promise.resolve(encrypted)
				.then((encrypted) => {
					return (decrypt as any)(key, encrypted, true, useMac) // useMac is only used for aes256Decrypt
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

	o("generateRandomKeyAndBase64Conversion 128", () => randomKeyBase64Conversion(aes128RandomKey, 24))
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
		return uint8ArrayToBitArray(hexToUint8Array(hex))
	}

	function _keyToHex(key: Aes256Key): Hex {
		return uint8ArrayToHex(bitArrayToUint8Array(key))
	}

	o("encryptWithInvalidKey 128 without mac", () => encryptWithInvalidKey(aesEncrypt, false))
	o("encryptWithInvalidKey 128 with mac", () => encryptWithInvalidKey(aesEncrypt, true))
	o("encryptWithInvalidKey 256 without mac", () => encryptWithInvalidKey(aesEncrypt, false))

	// o("encryptWithInvalidKey 256 webcrypto", done => encryptWithInvalidKey(done, aes256EncryptFile, true))
	function encryptWithInvalidKey(encrypt, useMac) {
		let key = _hexToKey("7878787878")

		o.check(() => encrypt(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac)).satisfies(
			throwsErrorWithMessage(CryptoError, "Illegal key length"),
		)
	}

	o("decryptWithInvalidKey 128", () => decryptWithInvalidKey(aesDecrypt))
	o("decryptWithInvalidKey 256 without hmac", () => decryptWithInvalidKey(aesDecrypt))

	// o("decryptWithInvalidKey 256 webcrypto", done => decryptWithInvalidKey(done, aes256DecryptFile))
	function decryptWithInvalidKey(decrypt) {
		let key = _hexToKey("7878787878")

		// useMac is only used for aes256Decrypt
		o(() => decrypt(key, stringToUtf8Uint8Array("hello"), true, false)).satisfies(throwsErrorWithMessage(CryptoError, "Illegal key length"))
	}

	o("decryptInvalidData 128", () =>
		decryptInvalidData(aes128RandomKey(), aesDecrypt, "Invalid IV length in aesDecrypt: 10 bytes, must be 16 bytes (128 bits)"),
	)
	o("decryptInvalidData 256 without hmac", () =>
		decryptInvalidData(aes256RandomKey(), unauthenticatedAesDecrypt, "Invalid IV length in aesDecrypt: 10 bytes, must be 16 bytes (128 bits)"),
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
		let iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])
		let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"), iv, true, false)
		encrypted[0] = encrypted[0] + 1
		let decrypted = aesDecrypt(key, encrypted, true)
		o(utf8Uint8ArrayToString(decrypted)).equals("kello") // => encrypted data has been manipulated (missing MAC)
	})
	o("decryptManipulatedData 128 with mac", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])
		let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"), iv, true, true)
		encrypted[1] = encrypted[1] + 1

		o.check(() => aesDecrypt(key, encrypted, true)).satisfies(throwsErrorWithMessage(CryptoError, "invalid mac"))
		try {
			aesDecrypt(key, encrypted, true)
		} catch (e) {
			const error = e as Error
			o(error instanceof CryptoError).equals(true)
			o(error.message).equals("invalid mac")
		}
	})
	o("decryptManipulatedMac 128 with mac", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])
		let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"), iv, true, true)
		encrypted[encrypted.length - 1] = encrypted[encrypted.length - 1] + 1

		o.check(() => aesDecrypt(key, encrypted, true)).satisfies(throwsErrorWithMessage(CryptoError, "invalid mac"))
	})
	o("decryptMissingMac 128", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])
		let encrypted = aesEncrypt(key, stringToUtf8Uint8Array("hello"), iv, true, false)
		encrypted = concat(new Uint8Array([1]), encrypted)

		o.check(() => aesDecrypt(key, encrypted, true)).satisfies(throwsErrorWithMessage(CryptoError, "invalid mac"))
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
	o("decryptWithWrongKey 128 without mac", () =>
		decryptWithWrongKey(aes128RandomKey(), aes128RandomKey(), aesEncrypt, aesDecrypt, false, "aes decryption failed> pkcs#5 padding corrupt"),
	)
	o("decryptWithWrongKey 128 with mac", () => decryptWithWrongKey(aes128RandomKey(), aes128RandomKey(), aesEncrypt, aesDecrypt, true, "invalid mac"))
	o("decryptWithWrongKey 256 with mac", () => decryptWithWrongKey(aes256RandomKey(), aes256RandomKey(), aesEncrypt, aesDecrypt, true, "invalid mac"))

	function decryptWithWrongKey(key, key2, encrypt, decrypt, useMac, errorMessage) {
		const encrypted = encrypt(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac)
		// useMac is only used for aes256Decrypt
		o.check(() => decrypt(key2, encrypted, true, useMac)).satisfies(throwsErrorWithMessage(CryptoError, errorMessage))
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
	o("ciphertextLengths 128 without mac", () => ciphertextLengths(aes128RandomKey(), aesEncrypt, 32, 48, false))
	o("ciphertextLengths 128 with mac", () => ciphertextLengths(aes128RandomKey(), aesEncrypt, 65, 81, true))
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
})

// visibleForTesting
export function aes256EncryptLegacy(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean = true, useMac: boolean = true): Uint8Array {
	verifyKeySize(key, [KEY_LENGTH_BITS_AES_256])

	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `)
	}

	let subKeys = getAesSubKeys(key, useMac)
	let encryptedBits = sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(bytes), uint8ArrayToBitArray(iv), [], usePadding)
	let data = concat(iv, bitArrayToUint8Array(encryptedBits))

	if (useMac) {
		let hmac = new sjcl.misc.hmac(subKeys.mKey, sjcl.hash.sha256)
		let macBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(data)))
		data = concat(new Uint8Array([MAC_ENABLED_PREFIX]), data, macBytes)
	}

	return data
}
