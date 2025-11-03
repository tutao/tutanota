import o from "@tutao/otest"
import {
	aesDecrypt,
	aesEncrypt,
	AsymmetricKeyPair,
	bitArrayToUint8Array,
	bytesToEd25519PrivateKey,
	bytesToEd25519PublicKey,
	bytesToEd25519Signature,
	bytesToKyberPrivateKey,
	bytesToKyberPublicKey,
	decapsulateKyber,
	decryptKey,
	Ed25519PrivateKey,
	ed25519PrivateKeyToBytes,
	ed25519PublicKeyToBytes,
	ed25519SignatureToBytes,
	encapsulateKyber,
	encryptKey,
	generateKeyFromPassphraseArgon2id,
	generateKeyFromPassphraseBcrypt,
	hexToRsaPrivateKey,
	hexToRsaPublicKey,
	hkdf,
	hmacSha256,
	IV_BYTE_LENGTH,
	KeyLength,
	KeyPairType,
	kyberPrivateKeyToBytes,
	kyberPublicKeyToBytes,
	LibOQSExports,
	MacTag,
	PQKeyPairs,
	PQPublicKeys,
	PublicKey,
	random,
	Randomizer,
	rsaDecrypt,
	rsaEncrypt,
	uint8ArrayToBitArray,
	verifyHmacSha256,
	x25519Decapsulate,
	x25519Encapsulate,
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
	Versioned,
} from "@tutao/tutanota-utils"
import testData from "./CompatibilityTestData.json"
import { uncompress } from "../../../../../src/common/api/worker/Compression.js"
import { matchers, object, when } from "testdouble"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade.js"
import { loadArgon2WASM, loadLibOQSWASM } from "../WASMTestUtils.js"
import { Ed25519Facade, WASMEd25519Facade } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { PublicKeySignatureFacade } from "../../../../../src/common/api/worker/facades/PublicKeySignatureFacade"
import { checkKeyVersionConstraints } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"

const originalRandom = random.generateRandomData

const liboqs = await loadLibOQSWASM()
const liboqsFallback = (await (await import("liboqs.wasm")).loadWasm({ forceFallback: true })) as LibOQSExports
const argon2 = await (await import("argon2.wasm")).loadWasm({ forceFallback: true })

o.spec("CompatibilityTest", function () {
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
			// NOTE: We cannot do compatibility tests for encapsulation with this library, only decapsulation, since we cannot inject randomness.
			//
			// As such, we'll just test round-trip. Since we test decapsulation, if round-trip is correct, then encapsulation SHOULD be correct.
			const roundTripSharedSecret = decapsulateKyber(liboqs, privateKey, encapsulation.ciphertext)
			o(encapsulation.sharedSecret).deepEquals(roundTripSharedSecret)
			// o(encapsulation.sharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
			// o(encapsulation.ciphertext).deepEquals(hexToUint8Array(td.cipherText))

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
			const encapsulation = encapsulateKyber(liboqsFallback, publicKey, randomizer)
			// NOTE: We cannot do compatibility tests for encapsulation with this library, only decapsulation, since we cannot inject randomness.
			//
			// As such, we'll just test round-trip. Since we test decapsulation, if round-trip is correct, then encapsulation SHOULD be correct.
			const roundTripSharedSecret = decapsulateKyber(liboqsFallback, privateKey, encapsulation.ciphertext)
			o(encapsulation.sharedSecret).deepEquals(roundTripSharedSecret)
			// o(encapsulation.sharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
			// o(encapsulation.ciphertext).deepEquals(hexToUint8Array(td.cipherText))

			const decapsulatedSharedSecret = decapsulateKyber(liboqsFallback, privateKey, hexToUint8Array(td.cipherText))
			o(decapsulatedSharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
		}
	})
	o("aes 256", function () {
		for (const td of testData.aes256Tests) {
			const iv = hexToUint8Array(td.seed).slice(0, IV_BYTE_LENGTH) // randomness injected
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			// encrypt data
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64), iv, true)
			o(uint8ArrayToBase64(encryptedBytes)).equals(td.cipherTextBase64)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, encryptedBytes, true))
			o(decryptedBytes).equals(td.plainTextBase64)
			// encrypt 128 key
			const keyToEncrypt128 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt128))
			const encryptedKey128 = aesEncrypt(key, bitArrayToUint8Array(keyToEncrypt128), iv, false)
			o(uint8ArrayToBase64(encryptedKey128)).equals(td.encryptedKey128)
			const decryptedKey128 = decryptKey(key, encryptedKey128)
			o(uint8ArrayToHex(bitArrayToUint8Array(decryptedKey128))).equals(td.keyToEncrypt128)
			// encrypt 256 key
			const keyToEncrypt256 = uint8ArrayToBitArray(hexToUint8Array(td.keyToEncrypt256))
			const encryptedKey256 = aesEncrypt(key, bitArrayToUint8Array(keyToEncrypt256), iv, false)
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
			const iv = hexToUint8Array(td.seed).slice(0, IV_BYTE_LENGTH) // randomness injected
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64), iv, true, false)
			o(uint8ArrayToBase64(encryptedBytes)).equals(td.cipherTextBase64)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, encryptedBytes))
			o(decryptedBytes).equals(td.plainTextBase64)
		}
	})
	o("aes 128 mac", function () {
		for (const td of testData.aes128MacTests) {
			const iv = hexToUint8Array(td.seed).slice(0, IV_BYTE_LENGTH) // randomness injected
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64), iv, true, true)
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

			const aliceToBob = x25519Encapsulate(aliceKeyPair.priv, ephemeralKeyPair.priv, bobKeyPair.pub)
			const bobToAlice = x25519Decapsulate(aliceKeyPair.pub, ephemeralKeyPair.pub, bobKeyPair.priv)
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

	o("hmac-sha256", function () {
		for (const td of testData.hmacSha256Tests) {
			const key = uint8ArrayToBitArray(hexToUint8Array(td.keyHex))
			const data = hexToUint8Array(td.dataHex)
			const hmacSha256Tag = hexToUint8Array(td.hmacSha256TagHex) as MacTag
			o(hmacSha256(key, data)).deepEquals(hmacSha256Tag)
			verifyHmacSha256(key, data, hmacSha256Tag)
		}
	})

	o("pqcrypt", async function () {
		for (const td of testData.pqcryptEncryptionTests) {
			random.generateRandomData = (number) => hexToUint8Array(td.seed).slice(0, number)

			const bucketKey = hexToUint8Array(td.bucketKey)

			const x25519KeyPair = {
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
				x25519PublicKey: x25519KeyPair.publicKey,
				kyberPublicKey: kyberKeyPair.publicKey,
			}
			const pqKeyPairs: PQKeyPairs = { keyPairType: KeyPairType.TUTA_CRYPT, x25519KeyPair, kyberKeyPair }
			const pqFacade = new PQFacade(new WASMKyberFacade(liboqs))

			const encapsulation = await pqFacade.encapsulateAndEncode(x25519KeyPair, ephemeralKeyPair, pqPublicKeys, bucketKey)
			// NOTE: We cannot do compatibility tests for encapsulation with this library, only decapsulation, since we cannot inject randomness.
			//
			// As such, we'll just test round-trip. Since we test decapsulation, if round-trip is correct, then encapsulation SHOULD be correct.
			// o(encapsulation).deepEquals(hexToUint8Array(td.pqMessage))

			const decapsulation = await pqFacade.decapsulateEncoded(encapsulation, pqKeyPairs)
			o(decapsulation.decryptedSymKeyBytes).deepEquals(bucketKey)
			o(decapsulation.senderIdentityPubKey).deepEquals(x25519KeyPair.publicKey)
		}
	})

	o("pqcrypt - kyber fallback", async function () {
		for (const td of testData.pqcryptEncryptionTests) {
			random.generateRandomData = (number) => hexToUint8Array(td.seed).slice(0, number)

			const bucketKey = hexToUint8Array(td.bucketKey)

			const x25519KeyPair = {
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
				x25519PublicKey: x25519KeyPair.publicKey,
				kyberPublicKey: kyberKeyPair.publicKey,
			}
			const pqKeyPairs: PQKeyPairs = { keyPairType: KeyPairType.TUTA_CRYPT, x25519KeyPair, kyberKeyPair }
			const pqFacade = new PQFacade(new WASMKyberFacade(liboqsFallback))

			const encapsulation = await pqFacade.encapsulateAndEncode(x25519KeyPair, ephemeralKeyPair, pqPublicKeys, bucketKey)
			// NOTE: We cannot do compatibility tests for encapsulation with this library, only decapsulation, since we cannot inject randomness.
			//
			// As such, we'll just test round-trip. Since we test decapsulation, if round-trip is correct, then encapsulation SHOULD be correct.
			// o(encapsulation).deepEquals(hexToUint8Array(td.pqMessage))

			const decapsulation = await pqFacade.decapsulateEncoded(encapsulation, pqKeyPairs)
			o(decapsulation.decryptedSymKeyBytes).deepEquals(bucketKey)
			o(decapsulation.senderIdentityPubKey).deepEquals(x25519KeyPair.publicKey)
		}
	})

	o("ed25519 - public key signature", async function () {
		for (const td of testData.ed25519Tests) {
			const ed25519Facade = await createEd25519Facade()
			const cryptoWrapper = new CryptoWrapper()
			const publicKeySignatureFacade = new PublicKeySignatureFacade(ed25519Facade, cryptoWrapper)

			let encryptionKeyPair: AsymmetricKeyPair
			const keyPairVersion = checkKeyVersionConstraints(td.keyPairVersion)
			let encryptionPublicKey: PublicKey

			if (td.pubKyberKey) {
				let keyPairType = KeyPairType.TUTA_CRYPT
				let kyberPublicKey = bytesToKyberPublicKey(hexToUint8Array(td.pubKyberKey))
				let x25519PublicKey = hexToUint8Array(td.pubEccKey)
				encryptionKeyPair = {
					keyPairType,
					kyberKeyPair: {
						publicKey: kyberPublicKey,
						privateKey: bytesToKyberPrivateKey(hexToUint8Array(td.privateKyberKey)),
					},
					x25519KeyPair: {
						privateKey: hexToUint8Array(td.privateEccKey),
						publicKey: x25519PublicKey,
					},
				}
				encryptionPublicKey = {
					keyPairType,
					kyberPublicKey,
					x25519PublicKey,
				}
			} else {
				// we expect that an rsa key pair are present
				let rsaPublicKey = hexToRsaPublicKey(td.pubRsaKey)
				if (td.pubEccKey) {
					let keyPairType = KeyPairType.RSA_AND_X25519
					let publicEccKey = hexToUint8Array(td.pubEccKey)
					encryptionKeyPair = {
						publicKey: rsaPublicKey,
						privateKey: hexToRsaPrivateKey(td.privateRsaKey),
						keyPairType,
						publicEccKey,
						privateEccKey: hexToUint8Array(td.privateEccKey),
					}
					encryptionPublicKey = {
						...rsaPublicKey,
						keyPairType,
						publicEccKey,
					}
				} else {
					let keyPairType = KeyPairType.RSA
					encryptionKeyPair = {
						publicKey: rsaPublicKey,
						privateKey: hexToRsaPrivateKey(td.privateRsaKey),
						keyPairType,
					}
					encryptionPublicKey = {
						...rsaPublicKey,
						keyPairType,
					}
				}
			}
			const versionedEncryptionKeyPair: Versioned<AsymmetricKeyPair> = {
				object: encryptionKeyPair,
				version: keyPairVersion,
			}
			const versionedPublicEncryptionKey: Versioned<PublicKey> = {
				object: encryptionPublicKey,
				version: keyPairVersion,
			}

			const alicePublicKeyBytes = hexToUint8Array(td.alicePublicKeyHex)
			const alicePublicKey = bytesToEd25519PublicKey(alicePublicKeyBytes)
			const alicePrivateKey: Versioned<Ed25519PrivateKey> = {
				object: bytesToEd25519PrivateKey(hexToUint8Array(td.alicePrivateKeyHex)),
				version: 0,
			}
			const signature = bytesToEd25519Signature(hexToUint8Array(td.signature))
			const message = hexToUint8Array(td.message)

			// make sure encoding and decoding round trips yield the same results again
			o(uint8ArrayToHex(ed25519PrivateKeyToBytes(alicePrivateKey.object))).deepEquals(td.alicePrivateKeyHex)
			o(uint8ArrayToHex(ed25519PublicKeyToBytes(alicePublicKey))).deepEquals(td.alicePublicKeyHex)
			o(uint8ArrayToHex(ed25519SignatureToBytes(signature))).deepEquals(td.signature)

			const { encodedKeyPairForSigning } = publicKeySignatureFacade.serializePublicKeyForSigning(versionedPublicEncryptionKey)
			o(encodedKeyPairForSigning).deepEquals(message)

			const { signature: reproducedSignature } = await publicKeySignatureFacade.signPublicKey(versionedEncryptionKeyPair, alicePrivateKey)
			o(reproducedSignature).deepEquals(signature)

			o(await publicKeySignatureFacade.verifyPublicKeySignature(versionedPublicEncryptionKey, alicePublicKey, reproducedSignature)).equals(true)
		}
	})

	/**
	 * Creates the Javascript compatibility test data for compression. See CompatibilityTest.writeCompressionTestData() in Java for
	 * instructions how to update the test data.
	 */
	// o("createCompressionTestData", function () {
	// 	console.log("List<String> javaScriptCompressed = List.of(")
	// 	console.log(
	// 		testData.compressionTests
	// 			.map((td) => {
	// 				let compressed = uint8ArrayToBase64(compress(stringToUtf8Uint8Array(td.uncompressedText)))
	// 				return '\t\t"' + compressed + '"'
	// 			})
	// 			.join(",\n"),
	// 	)
	// 	console.log(");")
	// })
})

async function createEd25519Facade(): Promise<Ed25519Facade> {
	if (typeof process !== "undefined") {
		const { readFile } = await import("node:fs/promises")
		const wasmBuffer = await readFile("build/crypto_primitives_bg.wasm")
		return new WASMEd25519Facade(wasmBuffer)
	} else {
		return new WASMEd25519Facade()
	}
}
