import o from "@tutao/otest"
import {
	aesDecrypt,
	aesEncrypt,
	bitArrayToUint8Array,
	decapsulateKyber,
	decryptKey,
	encapsulateKyber,
	encryptKey,
	generateKeyFromPassphraseArgon2id,
	generateKeyFromPassphraseBcrypt,
	hexToKyberPrivateKey,
	hexToKyberPublicKey,
	hexToPrivateKey,
	hexToPublicKey,
	KeyLength,
	kyberPrivateKeyToHex,
	kyberPublicKeyToHex,
	random,
	Randomizer,
	rsaDecrypt,
	rsaEncrypt,
	uint8ArrayToBitArray,
	x25519decapsulate,
	x25519encapsulate,
	x25519hexToPrivateKey,
	x25519hexToPublicKey,
} from "@tutao/tutanota-crypto"
import {
	base64ToUint8Array,
	hexToUint8Array,
	neverNull,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	uint8ArrayToHex,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import testData from "./CompatibilityTestData.json"
import { uncompress } from "../../../../../src/api/worker/Compression.js"
import { matchers, object, when } from "testdouble"
import { loadWasmModuleFromFile } from "../../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"

const originalRandom = random.generateRandomData

o.spec("crypto compatibility", function () {
	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})
	o("rsa encryption", () => {
		for (const td of testData.rsaEncryptionTests) {
			random.generateRandomData = (number) => hexToUint8Array(td.seed)

			let publicKey = hexToPublicKey(td.publicKey)
			let encryptedData = rsaEncrypt(publicKey, hexToUint8Array(td.input), hexToUint8Array(td.seed))
			o(uint8ArrayToHex(encryptedData)).equals(td.result)
			let privateKey = hexToPrivateKey(td.privateKey)
			let data = rsaDecrypt(privateKey, encryptedData)
			o(uint8ArrayToHex(data)).equals(td.input)
		}
	})
	o("kyber", async () => {
		const liboqs = await loadWasmModuleFromFile("../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm")

		for (const td of testData.kyberEncryptionTests) {
			const publicKey = hexToKyberPublicKey(td.publicKey)
			const privateKey = hexToKyberPrivateKey(td.privateKey)
			o(kyberPublicKeyToHex(publicKey)).deepEquals(td.publicKey)
			o(kyberPrivateKeyToHex(privateKey)).deepEquals(td.privateKey)

			const seed = hexToUint8Array(td.seed)

			const randomizer = object<Randomizer>()
			when(randomizer.generateRandomData(matchers.anything())).thenReturn(seed)

			const encapsulation = encapsulateKyber(liboqs, publicKey, randomizer)
			o(encapsulation.sharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
			o(encapsulation.ciphertext).deepEquals(hexToUint8Array(td.cipherText))

			const decapsulatedSharedSecret = decapsulateKyber(liboqs, privateKey, hexToUint8Array(td.cipherText))
			o(decapsulatedSharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
		}
	})
	o("aes 256", function () {
		for (const td of testData.aes256Tests) {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			// encrypt data
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true)
			o(uint8ArrayToBase64(encryptedBytes)).equals(td.cipherTextBase64)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, encryptedBytes, true))
			o(decryptedBytes).equals(td.plainTextBase64)
			// encrypt 128 key
			const keyToEncrypt128 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt128))
			const encryptedKey128 = aesEncrypt(key, bitArrayToUint8Array(keyToEncrypt128), base64ToUint8Array(td.ivBase64), false)
			o(uint8ArrayToBase64(encryptedKey128)).equals(td.encryptedKey128)
			const decryptedKey128 = decryptKey(key, encryptedKey128)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey128))).equals(td.keyToEncrypt128)
			// encrypt 256 key
			const keyToEncrypt256 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt256))
			const encryptedKey256 = aesEncrypt(key, bitArrayToUint8Array(keyToEncrypt256), base64ToUint8Array(td.ivBase64), false)
			o(uint8ArrayToBase64(encryptedKey256)).equals(td.encryptedKey256)
			const decryptedKey256 = decryptKey(key, encryptedKey256)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey256))).equals(td.keyToEncrypt256)
		}
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

	o("aes128 128 bit key encryption", function () {
		for (const td of testData.aes128Tests) {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			const keyToEncrypt128 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt128))
			const encryptedKey128 = encryptKey(key, keyToEncrypt128)
			o(uint8ArrayToBase64(encryptedKey128)).equals(td.encryptedKey128)
			const decryptedKey128 = decryptKey(key, encryptedKey128)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey128))).equals(td.keyToEncrypt128)
		}
	})

	o("aes128 256 bit key encryption", function () {
		for (const td of testData.aes128Tests) {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			const keyToEncrypt256 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt256))
			const encryptedKey256 = encryptKey(key, keyToEncrypt256)
			o(uint8ArrayToBase64(encryptedKey256)).equals(td.encryptedKey256)
			const decryptedKey256 = decryptKey(key, encryptedKey256)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey256))).equals(td.keyToEncrypt256)
		}
	})

	o("aes 128", function () {
		for (const td of testData.aes128Tests) {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true, false)
			o(uint8ArrayToBase64(encryptedBytes)).equals(td.cipherTextBase64)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, encryptedBytes))
			o(decryptedBytes).equals(td.plainTextBase64)
		}
	})
	o("aes 128 mac", function () {
		for (const td of testData.aes128MacTests) {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true, true)
			o(uint8ArrayToBase64(encryptedBytes)).equals(td.cipherTextBase64)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, encryptedBytes))
			o(decryptedBytes).equals(td.plainTextBase64)
		}
	})
	o("unicodeEncoding", function () {
		for (const td of testData.encodingTests) {
			let encoded = stringToUtf8Uint8Array(td.string)
			o(uint8ArrayToBase64(encoded)).equals(neverNull(td.encodedString))
			let decoded = utf8Uint8ArrayToString(encoded)
			o(decoded).equals(td.string)
		}
	})
	o("bcrypt 128", function () {
		for (const td of testData.bcrypt128Tests) {
			let key = generateKeyFromPassphraseBcrypt(td.password, hexToUint8Array(td.saltHex), KeyLength.b128)
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).equals(td.keyHex)
		}
	})
	o("bcrypt 256", function () {
		for (const td of testData.bcrypt256Tests) {
			let key = generateKeyFromPassphraseBcrypt(td.password, hexToUint8Array(td.saltHex), KeyLength.b256)
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).equals(td.keyHex)
		}
	})
	o("argon2id", async function () {
		const argon2 = await loadWasmModuleFromFile("../packages/tutanota-crypto/lib/hashes/Argon2id/argon2.wasm")

		for (let td of testData.argon2idTests) {
			let key = generateKeyFromPassphraseArgon2id(argon2, td.password, hexToUint8Array(td.saltHex))
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).equals(td.keyHex)
		}
	})
	o("compression", function () {
		for (const td of testData.compressionTests) {
			o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(td.compressedBase64TextJava)))).equals(td.uncompressedText)
			o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(td.compressedBase64TextJavaScript)))).equals(td.uncompressedText)
		}
	})
	o("x25519", function () {
		for (const td of testData.x25519Tests) {
			const alicePrivateKeyBytes = x25519hexToPrivateKey(td.alicePrivateKeyHex)
			const alicePublicKeyBytes = x25519hexToPublicKey(td.alicePublicKeyHex)
			const aliceKeyPair = { priv: alicePrivateKeyBytes, pub: alicePublicKeyBytes }
			const ephemeralPrivateKeyBytes = x25519hexToPrivateKey(td.ephemeralPrivateKeyHex)
			const ephemeralPublicKeyBytes = x25519hexToPublicKey(td.ephemeralPublicKeyHex)
			const ephemeralKeyPair = { priv: ephemeralPrivateKeyBytes, pub: ephemeralPublicKeyBytes }
			const bobPrivateKeyBytes = x25519hexToPrivateKey(td.bobPrivateKeyHex)
			const bobPublicKeyBytes = x25519hexToPublicKey(td.bobPublicKeyHex)
			const bobKeyPair = { priv: bobPrivateKeyBytes, pub: bobPublicKeyBytes }

			const aliceToBob = x25519encapsulate(aliceKeyPair.priv, ephemeralKeyPair.priv, bobKeyPair.pub)
			const bobToAlice = x25519decapsulate(aliceKeyPair.pub, ephemeralKeyPair.pub, bobKeyPair.priv)
			o(aliceToBob).deepEquals(bobToAlice)
			o(td.ephemeralSharedSecretHex).equals(uint8ArrayToHex(aliceToBob.ephemeralSharedSecret))
			o(td.authSharedSecretHex).equals(uint8ArrayToHex(aliceToBob.authSharedSecret))
		}
	})
	/**
	 * Creates the Javascript compatibility test data for compression. See CompatibilityTest.writeCompressionTestData() in Java for
	 * instructions how to update the test data.
	 */
	// o("createCompressionTestData", function () {
	// 	console.log("List<String> javaScriptCompressed = List.of(")
	// 	console.log(compatibilityTestData.compressionTests.map(td => {
	// 		let compressed = uint8ArrayToBase64(compress(stringToUtf8Uint8Array(td.uncompressedText)))
	// 		return "\t\t\"" + compressed + "\""
	// 	}).join(",\n"))
	// 	console.log(");")
	// })
})
