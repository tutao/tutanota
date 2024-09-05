import o from "@tutao/otest"
import {
	aesDecrypt,
	aesEncrypt,
	bitArrayToUint8Array,
	bytesToKyberPrivateKey,
	bytesToKyberPublicKey,
	decapsulateKyber,
	decryptKey,
	eccDecapsulate,
	eccEncapsulate,
	encapsulateKyber,
	encryptKey,
	generateKeyFromPassphraseArgon2id,
	generateKeyFromPassphraseBcrypt,
	hexToRsaPrivateKey,
	hexToRsaPublicKey,
	hkdf,
	KeyLength,
	KeyPairType,
	kyberPrivateKeyToBytes,
	kyberPublicKeyToBytes,
	LibOQSExports,
	PQKeyPairs,
	PQPublicKeys,
	random,
	Randomizer,
	rsaDecrypt,
	rsaEncrypt,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import {
	base64ToUint8Array,
	byteArraysToBytes,
	bytesToByteArrays,
	hexToUint8Array,
	neverNull,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	uint8ArrayToHex,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import testData from "./CompatibilityTestData.json"
import { uncompress } from "../../../../../src/common/api/worker/Compression.js"
import { matchers, object, when } from "testdouble"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade.js"
import { loadArgon2WASM, loadLibOQSWASM } from "../WASMTestUtils.js"

const originalRandom = random.generateRandomData

const liboqs = await loadLibOQSWASM()

o.spec("crypto compatibility", function () {
	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})

	o("rsa encryption", () => {
		for (const td of testData.rsaEncryptionTests) {
			random.generateRandomData = (number) => hexToUint8Array(td.seed)

			let publicKey = hexToRsaPublicKey(td.publicKey)
			let encryptedData = rsaEncrypt(publicKey, hexToUint8Array(td.input), hexToUint8Array(td.seed))
			o(uint8ArrayToHex(encryptedData)).equals(td.result)
			let privateKey = hexToRsaPrivateKey(td.privateKey)
			let data = rsaDecrypt(privateKey, encryptedData)
			o(uint8ArrayToHex(data)).equals(td.input)
		}
	})
	o("kyber", async () => {
		for (const td of testData.kyberEncryptionTests) {
			const publicKey = bytesToKyberPublicKey(hexToUint8Array(td.publicKey))
			const privateKey = bytesToKyberPrivateKey(hexToUint8Array(td.privateKey))
			o(uint8ArrayToHex(kyberPublicKeyToBytes(publicKey))).deepEquals(td.publicKey)
			o(uint8ArrayToHex(kyberPrivateKeyToBytes(privateKey))).deepEquals(td.privateKey)

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
	o("kyber - fallback", async () => {
		for (const td of testData.kyberEncryptionTests) {
			const publicKey = bytesToKyberPublicKey(hexToUint8Array(td.publicKey))
			const privateKey = bytesToKyberPrivateKey(hexToUint8Array(td.privateKey))
			o(uint8ArrayToHex(kyberPublicKeyToBytes(publicKey))).deepEquals(td.publicKey)
			o(uint8ArrayToHex(kyberPrivateKeyToBytes(privateKey))).deepEquals(td.privateKey)

			const seed = hexToUint8Array(td.seed)

			const randomizer = object<Randomizer>()
			when(randomizer.generateRandomData(matchers.anything())).thenReturn(seed)
			const liboqsFallback = (await (await import("liboqs.wasm")).loadWasm({ forceFallback: true })) as LibOQSExports
			const encapsulation = encapsulateKyber(liboqsFallback, publicKey, randomizer)
			o(encapsulation.sharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
			o(encapsulation.ciphertext).deepEquals(hexToUint8Array(td.cipherText))

			const decapsulatedSharedSecret = decapsulateKyber(liboqsFallback, privateKey, hexToUint8Array(td.cipherText))
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
		const argon2 = await loadArgon2WASM()
		for (let td of testData.argon2idTests) {
			let key = await generateKeyFromPassphraseArgon2id(argon2, td.password, hexToUint8Array(td.saltHex))
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).equals(td.keyHex)
		}
	})
	o("argon2id - fallback", async function () {
		const argon2 = await (await import("argon2.wasm")).loadWasm({ forceFallback: true })
		for (let td of testData.argon2idTests) {
			let key = await generateKeyFromPassphraseArgon2id(argon2, td.password, hexToUint8Array(td.saltHex))
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
			const alicePrivateKeyBytes = hexToUint8Array(td.alicePrivateKeyHex)
			const alicePublicKeyBytes = hexToUint8Array(td.alicePublicKeyHex)
			const aliceKeyPair = { priv: alicePrivateKeyBytes, pub: alicePublicKeyBytes }
			const ephemeralPrivateKeyBytes = hexToUint8Array(td.ephemeralPrivateKeyHex)
			const ephemeralPublicKeyBytes = hexToUint8Array(td.ephemeralPublicKeyHex)
			const ephemeralKeyPair = { priv: ephemeralPrivateKeyBytes, pub: ephemeralPublicKeyBytes }
			const bobPrivateKeyBytes = hexToUint8Array(td.bobPrivateKeyHex)
			const bobPublicKeyBytes = hexToUint8Array(td.bobPublicKeyHex)
			const bobKeyPair = { priv: bobPrivateKeyBytes, pub: bobPublicKeyBytes }

			const aliceToBob = eccEncapsulate(aliceKeyPair.priv, ephemeralKeyPair.priv, bobKeyPair.pub)
			const bobToAlice = eccDecapsulate(aliceKeyPair.pub, ephemeralKeyPair.pub, bobKeyPair.priv)
			o(aliceToBob).deepEquals(bobToAlice)
			o(td.ephemeralSharedSecretHex).equals(uint8ArrayToHex(aliceToBob.ephemeralSharedSecret))
			o(td.authSharedSecretHex).equals(uint8ArrayToHex(aliceToBob.authSharedSecret))
		}
	})

	o("byteArrayEncoding", function () {
		for (const td of testData.byteArrayEncodingTests) {
			const byteArrays = td.byteArraysAsHex.map((byteArrayAsHex) => hexToUint8Array(byteArrayAsHex))
			if (td.encodedByteArrayAsHex) {
				o(td.encodedByteArrayAsHex).equals(uint8ArrayToHex(byteArraysToBytes(byteArrays)))

				const decodedByteArrays = bytesToByteArrays(hexToUint8Array(td.encodedByteArrayAsHex), td.byteArraysAsHex.length)
				for (let i = 0; i < td.byteArraysAsHex.length; i++) {
					o(td.byteArraysAsHex[i]).equals(uint8ArrayToHex(decodedByteArrays[i]))
				}
			} else {
				try {
					byteArraysToBytes(byteArrays)
					throw new Error(" encoding error no thrown")
				} catch (e) {
					o(td.encodingError).equals(e.message)
				}
			}
		}
	})

	o("hkdf", function () {
		for (const td of testData.hkdfTests) {
			const salt = hexToUint8Array(td.saltHex)
			const inputKeyMaterialHex = hexToUint8Array(td.inputKeyMaterialHex)
			const info = hexToUint8Array(td.infoHex)
			const lengthInBytes = td.lengthInBytes
			o(uint8ArrayToHex(hkdf(salt, inputKeyMaterialHex, info, lengthInBytes))).equals(td.hkdfHex)
		}
	})

	o("pqcrypt", async function () {
		for (const td of testData.pqcryptEncryptionTests) {
			random.generateRandomData = (number) => hexToUint8Array(td.seed).slice(0, number)

			const bucketKey = hexToUint8Array(td.bucketKey)

			const eccKeyPair = {
				publicKey: hexToUint8Array(td.publicX25519Key),
				privateKey: hexToUint8Array(td.privateX25519Key),
			}

			const ephemeralKeyPair = {
				publicKey: hexToUint8Array(td.epheremalPublicX25519Key),
				privateKey: hexToUint8Array(td.epheremalPrivateX25519Key),
			}

			const kyberKeyPair = {
				publicKey: bytesToKyberPublicKey(hexToUint8Array(td.publicKyberKey)),
				privateKey: bytesToKyberPrivateKey(hexToUint8Array(td.privateKyberKey)),
			}

			const pqPublicKeys: PQPublicKeys = {
				keyPairType: KeyPairType.TUTA_CRYPT,
				eccPublicKey: eccKeyPair.publicKey,
				kyberPublicKey: kyberKeyPair.publicKey,
			}
			const pqKeyPairs: PQKeyPairs = { keyPairType: KeyPairType.TUTA_CRYPT, eccKeyPair, kyberKeyPair }
			const pqFacade = new PQFacade(new WASMKyberFacade(liboqs))

			const encapsulation = await pqFacade.encapsulateAndEncode(eccKeyPair, ephemeralKeyPair, pqPublicKeys, bucketKey)
			o(encapsulation).deepEquals(hexToUint8Array(td.pqMessage))

			const decapsulation = await pqFacade.decapsulateEncoded(encapsulation, pqKeyPairs)
			o(decapsulation.decryptedSymKeyBytes).deepEquals(bucketKey)
			o(decapsulation.senderIdentityPubKey).deepEquals(eccKeyPair.publicKey)
		}
	})

	o("pqcrypt - kyber fallback", async function () {
		for (const td of testData.pqcryptEncryptionTests) {
			random.generateRandomData = (number) => hexToUint8Array(td.seed).slice(0, number)

			const bucketKey = hexToUint8Array(td.bucketKey)

			const eccKeyPair = {
				publicKey: hexToUint8Array(td.publicX25519Key),
				privateKey: hexToUint8Array(td.privateX25519Key),
			}

			const ephemeralKeyPair = {
				publicKey: hexToUint8Array(td.epheremalPublicX25519Key),
				privateKey: hexToUint8Array(td.epheremalPrivateX25519Key),
			}

			const kyberKeyPair = {
				publicKey: bytesToKyberPublicKey(hexToUint8Array(td.publicKyberKey)),
				privateKey: bytesToKyberPrivateKey(hexToUint8Array(td.privateKyberKey)),
			}

			const pqPublicKeys: PQPublicKeys = {
				keyPairType: KeyPairType.TUTA_CRYPT,
				eccPublicKey: eccKeyPair.publicKey,
				kyberPublicKey: kyberKeyPair.publicKey,
			}
			const pqKeyPairs: PQKeyPairs = { keyPairType: KeyPairType.TUTA_CRYPT, eccKeyPair, kyberKeyPair }
			const liboqsFallback = (await (await import("liboqs.wasm")).loadWasm({ forceFallback: true })) as LibOQSExports
			const pqFacade = new PQFacade(new WASMKyberFacade(liboqsFallback))

			const encapsulation = await pqFacade.encapsulateAndEncode(eccKeyPair, ephemeralKeyPair, pqPublicKeys, bucketKey)
			o(encapsulation).deepEquals(hexToUint8Array(td.pqMessage))

			const decapsulation = await pqFacade.decapsulateEncoded(encapsulation, pqKeyPairs)
			o(decapsulation.decryptedSymKeyBytes).deepEquals(bucketKey)
			o(decapsulation.senderIdentityPubKey).deepEquals(eccKeyPair.publicKey)
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
