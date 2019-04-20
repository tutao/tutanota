//@flow
import o from "ospec/ospec.js"
import {aes128Decrypt, aes128Encrypt, aes128RandomKey, aes256Decrypt, aes256Encrypt, aes256RandomKey, IV_BYTE_LENGTH} from "../../../src/api/worker/crypto/Aes"
import {random} from "../../../src/api/worker/crypto/Randomizer"
import {hexToUint8Array, stringToUtf8Uint8Array, uint8ArrayToHex, utf8Uint8ArrayToString} from "../../../src/api/common/utils/Encoding"
import {CryptoError} from "../../../src/api/common/error/CryptoError"
import {base64ToKey, bitArrayToUint8Array, keyToBase64, uint8ArrayToBitArray} from "../../../src/api/worker/crypto/CryptoUtils"
import {concat} from "../../../src/api/common/utils/ArrayUtils"


o.spec("aes", function () {


	o("encryption roundtrip 128 without mac", (done) => arrayRoundtrip(done, aes128Encrypt, aes128Decrypt, aes128RandomKey(), false))
	o("encryption roundtrip 128 with mac", (done) => arrayRoundtrip(done, aes128Encrypt, aes128Decrypt, aes128RandomKey(), true))
	o("encryption roundtrip 256 without mac", (done) => arrayRoundtrip(done, aes256Encrypt, aes256Decrypt, aes256RandomKey(), false))
	// o("encryption roundtrip 256 webcrypto", browser((done, timeout) => {
	// 	timeout(1000)
	// 	arrayRoundtrip(done, aes256EncryptFile, aes256DecryptFile, aes256RandomKey(), true)
	// }))
	function arrayRoundtrip(done, encrypt, decrypt, key, useMac: boolean) {
		function runArrayRoundtrip(key: Aes128Key | Aes256Key, plainText) {
			let encrypted = encrypt(key, plainText, random.generateRandomData(IV_BYTE_LENGTH), true, useMac)

			return Promise.resolve(encrypted).then(encrypted => {
				return (decrypt: any)(key, encrypted, true, useMac) // useMac is only used for aes256Decrypt
			}).then(decrypted => {
				o(Array.from(decrypted)).deepEquals(Array.from(plainText))
			})
		}

		Promise.all([
			runArrayRoundtrip(key, random.generateRandomData(0)),
			runArrayRoundtrip(key, random.generateRandomData(1)),
			runArrayRoundtrip(key, random.generateRandomData(15)),
			runArrayRoundtrip(key, random.generateRandomData(16)),
			runArrayRoundtrip(key, random.generateRandomData(17)),
			runArrayRoundtrip(key, random.generateRandomData(12345))
		]).then(() => done())
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

	o("encryptWithInvalidKey 128 without mac", done => encryptWithInvalidKey(done, aes128Encrypt, false))
	o("encryptWithInvalidKey 128 with mac", done => encryptWithInvalidKey(done, aes128Encrypt, true))
	o("encryptWithInvalidKey 256 without mac", done => encryptWithInvalidKey(done, aes256Encrypt, false))

	// o("encryptWithInvalidKey 256 webcrypto", done => encryptWithInvalidKey(done, aes256EncryptFile, true))
	function encryptWithInvalidKey(done, encrypt, useMac) {
		let key = _hexToKey("7878787878")
		try {
			encrypt(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac)
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message.startsWith("Illegal key length")).equals(true)
			done()
		}
	}


	o("decryptWithInvalidKey 128", done => decryptWithInvalidKey(done, aes128Decrypt))
	o("decryptWithInvalidKey 256 without hmac", done => decryptWithInvalidKey(done, aes256Decrypt))

	// o("decryptWithInvalidKey 256 webcrypto", done => decryptWithInvalidKey(done, aes256DecryptFile))
	function decryptWithInvalidKey(done, decrypt) {
		let key = _hexToKey("7878787878")
		try {
			(decrypt: any)(key, stringToUtf8Uint8Array("hello"), true, false) // useMac is only used for aes256Decrypt
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message.startsWith("Illegal key length")).equals(true)
			done()
		}
	}

	o("decryptInvalidData 128", done => decryptInvalidData(done, aes128RandomKey(), aes128Decrypt, "Invalid IV length in AES128Decrypt: 10 bytes, must be 16 bytes (128 bits)"))
	o("decryptInvalidData 256 without hmac", done => decryptInvalidData(done, aes256RandomKey(), aes256Decrypt, "Invalid IV length in AES256Decrypt: 10 bytes, must be 16 bytes (128 bits)"))

	function decryptInvalidData(done, key, decrypt, errorMessage) {
		try {
			(decrypt: any)(key, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), true, false) // useMac is only used for aes256Decrypt
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message).equals(errorMessage)
			done()
		}
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
		let encrypted = aes128Encrypt(key, stringToUtf8Uint8Array("hello"), iv, true, false)
		encrypted[0] = encrypted[0] + 1
		let decrypted = aes128Decrypt(key, encrypted, true)
		o(utf8Uint8ArrayToString(decrypted)).equals("kello") // => encrypted data has been manipulated (missing MAC)
	})

	o("decryptManipulatedData 128 with mac", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])
		let encrypted = aes128Encrypt(key, stringToUtf8Uint8Array("hello"), iv, true, true)
		encrypted[1] = encrypted[1] + 1
		try {
			aes128Decrypt(key, encrypted, true)
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message).equals("invalid mac")
		}
	})

	o("decryptManipulatedMac 128 with mac", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])
		let encrypted = aes128Encrypt(key, stringToUtf8Uint8Array("hello"), iv, true, true)
		encrypted[encrypted.length - 1] = encrypted[encrypted.length - 1] + 1
		try {
			aes128Decrypt(key, encrypted, true)
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message).equals("invalid mac")
		}
	})

	o("decryptMissingMac 128", function () {
		let key = [151050668, 1341212767, 316219065, 2150939763]
		let iv = new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102])
		let encrypted = aes128Encrypt(key, stringToUtf8Uint8Array("hello"), iv, true, false)
		encrypted = concat(new Uint8Array([1]), encrypted)
		try {
			aes128Decrypt(key, encrypted, true)
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message).equals("invalid mac")
		}
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

	// o("decryptManipulatedData 256 webcrypto", browser((done, timeout) => {
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

	o("decryptWithWrongKey 128 without mac", done => decryptWithWrongKey(done, aes128RandomKey(), aes128RandomKey(), aes128Encrypt, aes128Decrypt, false, "aes decryption failed> pkcs#5 padding corrupt"))
	o("decryptWithWrongKey 128 with mac", done => decryptWithWrongKey(done, aes128RandomKey(), aes128RandomKey(), aes128Encrypt, aes128Decrypt, true, "invalid mac"))
	o("decryptWithWrongKey 256 without mac", done => decryptWithWrongKey(done, aes256RandomKey(), aes256RandomKey(), aes256Encrypt, aes256Decrypt, false, "aes decryption failed> pkcs#5 padding corrupt"))

	function decryptWithWrongKey(done, key, key2, encrypt, decrypt, useMac, errorMessage) {
		try {
			let encrypted = encrypt(key, stringToUtf8Uint8Array("hello"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac);
			(decrypt: any)(key2, encrypted, true, useMac) // useMac is only used for aes256Decrypt
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message).equals(errorMessage)
			done()
		}
	}

	// o("decryptWithWrongKey 256 webcrypto", browser((done, timeout) => {
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

	o("ciphertextLengths 128 without mac", () => ciphertextLengths(aes128RandomKey(), aes128Encrypt, 32, 48, false))
	o("ciphertextLengths 128 with mac", () => ciphertextLengths(aes128RandomKey(), aes128Encrypt, 65, 81, true))
	o("ciphertextLengths 256 without mac", () => ciphertextLengths(aes256RandomKey(), aes256Encrypt, 32, 48, false))

	function ciphertextLengths(key, encrypt, length15BytePlainText, length16BytePlainText, useMac) {
		// check that 15 bytes fit into one block
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcde"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac).length).equals(length15BytePlainText)
		// check that 16 bytes need two blocks (because of one byte padding length info)
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcdef"), random.generateRandomData(IV_BYTE_LENGTH), true, useMac).length)
			.equals(length16BytePlainText)
	}

	// o("ciphertextLengths 256 webcrypto", browser(done => {
	// 	Promise.all([
	// 		aes256EncryptFile(aes256RandomKey(), stringToUtf8Uint8Array("1234567890abcde"), random.generateRandomData(IV_BYTE_LENGTH)).then(encrypted => o(encrypted.length).equals(48)), // check that 15 bytes fit into one block
	// 		aes256EncryptFile(aes256RandomKey(), stringToUtf8Uint8Array("1234567890abcdef"), random.generateRandomData(IV_BYTE_LENGTH)).then(encrypted => o(encrypted.length).equals(64)) // check that 16 bytes need two blocks (because of one byte padding length info)
	// 	]).then(() => done())
	// }))

})
