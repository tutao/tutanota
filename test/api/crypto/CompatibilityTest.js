import o from "ospec"
import {
	aes128Decrypt,
	aes128Encrypt,
	aes256Decrypt,
	aes256DecryptKey,
	aes256Encrypt,
	aes256EncryptKey,
	bitArrayToUint8Array,
	decryptKey,
	encryptKey,
	generateKeyFromPassphrase,
	hexToPrivateKey,
	hexToPublicKey,
	KeyLength,
	random,
	rsaDecryptSync,
	rsaEncryptSync,
	sign,
	uint8ArrayToBitArray,
	verifySignature
} from "@tutao/tutanota-crypto"
import {
	base64ToUint8Array,
	hexToUint8Array,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	uint8ArrayToHex,
	utf8Uint8ArrayToString
} from "@tutao/tutanota-utils"
import compatibilityTestData from "./CompatibilityTestData"
import {uncompress} from "../../../src/api/worker/Compression"


const originalRandom = random.generateRandomData


o.spec("crypto compatibility", function () {

	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})

	o("rsa encryption", () => {
		compatibilityTestData.rsaEncryptionTests.forEach(td => {
			random.generateRandomData = (number) => hexToUint8Array(td.seed)

			let publicKey = hexToPublicKey(td.publicKey)


			let encryptedData = rsaEncryptSync(publicKey, hexToUint8Array(td.input), hexToUint8Array(td.seed))
			o(uint8ArrayToHex(encryptedData)).equals(td.result)

			let privateKey = hexToPrivateKey(td.privateKey)
			let data = rsaDecryptSync(privateKey, encryptedData)
			o(uint8ArrayToHex(data)).equals(td.input)
		})
	})

	o("rsa signature", function () {
		compatibilityTestData.rsaSignatureTests.forEach(td => {
			random.generateRandomData = (number) => hexToUint8Array(td.seed)

			let privateKey = hexToPrivateKey(td.privateKey)
			let publicKey = hexToPublicKey(td.publicKey)


			let signature = sign(privateKey, hexToUint8Array(td.input))
			o(uint8ArrayToHex(signature)).equals(td.result)

			verifySignature(publicKey, hexToUint8Array(td.input), signature)
		})
	})

	o("aes 256", function () {
		compatibilityTestData.aes256Tests.forEach(td => {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))

			// encrypt data
			let encryptedBytes = aes256Encrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true, false)
			o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

			let decryptedBytes = uint8ArrayToBase64(aes256Decrypt(key, encryptedBytes, true, false))
			o(decryptedBytes).deepEquals(td.plainTextBase64)

			// encrypt 128 key
			const keyToEncrypt128 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt128))
			const encryptedKey128 = aes256EncryptKey(key, keyToEncrypt128)
			o(uint8ArrayToBase64(encryptedKey128)).deepEquals(td.encryptedKey128)

			const decryptedKey128 = aes256DecryptKey(key, encryptedKey128)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey128))).deepEquals(td.keyToEncrypt128)

			// encrypt 256 key
			const keyToEncrypt256 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt256))
			const encryptedKey256 = aes256EncryptKey(key, keyToEncrypt256)
			o(uint8ArrayToBase64(encryptedKey256)).deepEquals(td.encryptedKey256)

			const decryptedKey256 = aes256DecryptKey(key, encryptedKey256)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey256))).deepEquals(td.keyToEncrypt256)
		})
	})

	/*
	o("aes 256 webcrypto", browser(function (done, timeout) {
		timeout(2000)
		Promise.all(
			compatibilityTestData.aes256Tests.map(td => {
				let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
				return aes256EncryptFile(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true).then(encryptedBytes => {
					o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

					return aes256Decrypt(key, encryptedBytes)
				}).then(decryptedBytes => {
					let decrypted = uint8ArrayToBase64(decryptedBytes)
					o(decrypted).deepEquals(td.plainTextBase64)
				})
			})
		).then(() => done())
	}))
	*/


	o("aes 128", function () {
		compatibilityTestData.aes128Tests.forEach(td => {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aes128Encrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true, false)
			o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

			let decryptedBytes = uint8ArrayToBase64(aes128Decrypt(key, encryptedBytes))
			o(decryptedBytes).deepEquals(td.plainTextBase64)

			// encrypt 128 key
			const keyToEncrypt128 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt128))
			const encryptedKey128 = encryptKey(key, keyToEncrypt128)
			o(uint8ArrayToBase64(encryptedKey128)).deepEquals(td.encryptedKey128)

			const decryptedKey128 = decryptKey(key, encryptedKey128)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey128))).deepEquals(td.keyToEncrypt128)

			// encrypt 256 key
			const keyToEncrypt256 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt256))
			const encryptedKey256 = encryptKey(key, keyToEncrypt256)
			o(uint8ArrayToBase64(encryptedKey256)).deepEquals(td.encryptedKey256)

			const decryptedKey256 = decryptKey(key, encryptedKey256)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey256))).deepEquals(td.keyToEncrypt256)
		})
	})

	o("aes 128 mac", function () {
		compatibilityTestData.aes128MacTests.forEach(td => {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aes128Encrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true, true)
			o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

			let decryptedBytes = uint8ArrayToBase64(aes128Decrypt(key, encryptedBytes))
			o(decryptedBytes).deepEquals(td.plainTextBase64)
		})
	})

	o("unicodeEncoding", function () {
		compatibilityTestData.encodingTests.forEach(td => {
			let encoded = stringToUtf8Uint8Array(td.string)
			o(uint8ArrayToBase64(encoded)).deepEquals(td.encodedString)
			let decoded = utf8Uint8ArrayToString(encoded)
			o(decoded).equals(td.string)
		})
	})

	o("bcrypt 128", function () {
		compatibilityTestData.bcrypt128Tests.forEach(td => {
			let key = generateKeyFromPassphrase(td.password, hexToUint8Array(td.saltHex), KeyLength.b128)
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).deepEquals(td.keyHex)
		})
	})

	o("bcrypt 256", function () {
		compatibilityTestData.bcrypt256Tests.forEach(td => {
			let key = generateKeyFromPassphrase(td.password, hexToUint8Array(td.saltHex), KeyLength.b256)
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).deepEquals(td.keyHex)
		})
	})

	o("compression", function () {
		compatibilityTestData.compressionTests.forEach(td => {
			o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(td.compressedBase64TextJava)))).equals(td.uncompressedText)
			o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(td.compressedBase64TextJavaScript)))).equals(td.uncompressedText)
		})
	})

	/**
	 * Creates the Javascript compatibility test data for compression. See CompatibilityTest.writeCompressionTestData() in Java for
	 * instructions how to update the test data.
	 */
	// o.only("createCompressionTestData", function () {
	// 	console.log("List<String> javaScriptCompressed = List.of(")
	// 	console.log(compatibilityTestData.compressionTests.map(td => {
	// 		let compressed = uint8ArrayToBase64(compress(stringToUtf8Uint8Array(td.uncompressedText)))
	// 		return "\t\t\"" + compressed + "\""
	// 	}).join(",\n"))
	// 	console.log(");")
	// })
})
