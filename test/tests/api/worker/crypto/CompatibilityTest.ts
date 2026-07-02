import o from "@tutao/otest"
import {
	AeadWithSessionKeySubKeys,
	AesKeyLength,
	AsymmetricKeyPair,
	bytesToEd25519PrivateKey,
	bytesToEd25519PublicKey,
	bytesToEd25519Signature,
	bytesToKyberPrivateKey,
	bytesToKyberPublicKey,
	cryptoUtils,
	decapsulateKyber,
	Ed25519PrivateKey,
	ed25519PrivateKeyToBytes,
	ed25519PublicKeyToBytes,
	ed25519SignatureToBytes,
	encapsulateKyber,
	generateKeyFromPassphraseArgon2id,
	generateKeyFromPassphraseBcrypt,
	hexToRsaPrivateKey,
	hexToRsaPublicKey,
	hkdf,
	hmacSha256,
	hmacSha256Async,
	INITIALIZATION_VECTOR_LENGTH_BYTES,
	InstanceTypeId,
	KeyLength,
	keyToUint8Array,
	kyberPrivateKeyToBytes,
	kyberPublicKeyToBytes,
	MacTag,
	pqKeyPairsToPublicKeys,
	PQPublicKeys,
	PublicKey,
	random,
	Randomizer,
	rsaDecrypt,
	rsaEncrypt,
	RsaKeyPair,
	RsaX25519KeyPair,
	RsaX25519PublicKey,
	SymmetricCipherVersion,
	uint8ArrayToKey,
	validateKdfNonceLength,
	verifyHmacSha256,
	verifyHmacSha256Async,
	x25519Decapsulate,
	x25519Encapsulate,
} from "../../../../../src/platform-kit/crypto"
import {
	base64ToUint8Array,
	byteArraysToBytes,
	bytesToByteArrays,
	filterInt,
	freshVersioned,
	hexToUint8Array,
	neverNull,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	uint8ArrayToHex,
	utf8Uint8ArrayToString,
	Versioned,
} from "../../../../../src/platform-kit/utils"
import testData from "./CompatibilityTestData.json"
import { uncompress } from "../../../../../src/platform-kit/instance-pipeline"
import { matchers, object, when } from "testdouble"
import { PQFacade } from "../../../../../src/platform-kit/base/base-crypto/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/platform-kit/base/base-crypto/KyberFacade.js"
import { Ed25519Facade, WASMEd25519Facade } from "../../../../../src/platform-kit/base/base-crypto/Ed25519Facade"
import { PublicKeySignatureFacade } from "../../../../../src/platform-kit/base/base-crypto/PublicKeySignatureFacade"
import { blake3Hash, blake3Kdf, blake3Mac, blake3MacVerify } from "@tutao/crypto/blake3"
import { PQKeyPairs } from "../../../../../src/platform-kit/crypto/encryption/PQKeyPairs.js"
import { loadArgon2WASM, loadLibOQSWASM } from "../../../crypto/WebAssemblyTestUtils"
import { ParsedCiphertextAead, parseVersionedCiphertext } from "../../../../../src/platform-kit/crypto/encryption/symmetric/ParsedCiphertext"
import { aesDecrypt, aesEncrypt, asyncDecryptBytes } from "../../../../../src/platform-kit/crypto/instance-pipeline-crypto/Aes"
import { decryptKey, encryptKey } from "../../../../../src/platform-kit/crypto/instance-pipeline-crypto/KeyEncryption"
import { CryptoWrapper } from "../../../../../src/platform-kit/crypto/instance-pipeline-crypto/CryptoWrapper"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"
import { AeadFacade } from "@tutao/crypto/aead-facade"

const originalRandom = random.generateRandomData

const libOQS = await loadLibOQSWASM()

o.spec("CompatibilityTest", function () {
	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})

	o("rsa encryption", () => {
		for (const td of testData.rsaEncryptionTests) {
			random.generateRandomData = (_number) => hexToUint8Array(td.seed)

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

			const encapsulation = encapsulateKyber(libOQS, publicKey, randomizer)
			// NOTE: We cannot do compatibility tests for encapsulation with this library, only decapsulation, since we cannot inject randomness.
			//
			// As such, we'll just test round-trip. Since we test decapsulation, if round-trip is correct, then encapsulation SHOULD be correct.
			const roundTripSharedSecret = decapsulateKyber(libOQS, privateKey, encapsulation.ciphertext)
			o(encapsulation.sharedSecret).deepEquals(roundTripSharedSecret)
			// o(encapsulation.sharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
			// o(encapsulation.ciphertext).deepEquals(hexToUint8Array(td.cipherText))

			const decapsulatedSharedSecret = decapsulateKyber(libOQS, privateKey, hexToUint8Array(td.cipherText))
			o(decapsulatedSharedSecret).deepEquals(hexToUint8Array(td.sharedSecret))
		}
	})
	o("aes 256", function () {
		for (const td of testData.aes256Tests) {
			random.generateRandomData = (_number) => hexToUint8Array(td.seed).slice(0, INITIALIZATION_VECTOR_LENGTH_BYTES)
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey))
			// encrypt data
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64))
			o(uint8ArrayToBase64(encryptedBytes)).equals(td.cipherTextBase64)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, encryptedBytes))
			o(decryptedBytes).equals(td.plainTextBase64)
			// encrypt 128 key
			const keyToEncrypt128 = uint8ArrayToKey(hexToUint8Array(td.keyToEncrypt128))
			const encryptedKey128 = encryptKey(key, keyToEncrypt128)
			o(uint8ArrayToBase64(encryptedKey128)).equals(td.encryptedKey128)
			const decryptedKey128 = decryptKey(key, encryptedKey128)
			o(uint8ArrayToHex(keyToUint8Array(decryptedKey128))).equals(td.keyToEncrypt128)
			// encrypt 256 key
			const keyToEncrypt256 = uint8ArrayToKey(hexToUint8Array(td.keyToEncrypt256))
			const encryptedKey256 = encryptKey(key, keyToEncrypt256)
			o(uint8ArrayToBase64(encryptedKey256)).equals(td.encryptedKey256)
			const decryptedKey256 = decryptKey(key, encryptedKey256)
			o(uint8ArrayToHex(keyToUint8Array(decryptedKey256))).equals(td.keyToEncrypt256)
		}
	})

	o.test("aes 256 async", async function () {
		for (const td of testData.aes256Tests) {
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey))

			let decryptedBytes = uint8ArrayToBase64(await asyncDecryptBytes(key, base64ToUint8Array(td.cipherTextBase64)))
			o.check(decryptedBytes).equals(td.plainTextBase64)
		}
	})
	o.test("aes 128 async", async function () {
		for (const td of testData.aes128Tests) {
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey))

			let decryptedBytes = uint8ArrayToBase64(await asyncDecryptBytes(key, base64ToUint8Array(td.cipherTextBase64)))
			o.check(decryptedBytes).equals(td.plainTextBase64)
		}
	})
	o.test("aes 128 async mac", async function () {
		for (const td of testData.aes128MacTests) {
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey))

			let decryptedBytes = uint8ArrayToBase64(await asyncDecryptBytes(key, base64ToUint8Array(td.cipherTextBase64)))
			o.check(decryptedBytes).equals(td.plainTextBase64)
		}
	})

	o("aes128 128 bit key encryption", function () {
		for (const td of testData.aes128Tests) {
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey))
			const keyToEncrypt128 = uint8ArrayToKey(hexToUint8Array(td.keyToEncrypt128))
			const encryptedKey128 = encryptKey(key, keyToEncrypt128)
			o(uint8ArrayToBase64(encryptedKey128)).equals(td.encryptedKey128)
			const decryptedKey128 = decryptKey(key, encryptedKey128)
			o(uint8ArrayToHex(keyToUint8Array(decryptedKey128))).equals(td.keyToEncrypt128)
		}
	})

	o("aes128 256 bit key encryption", function () {
		for (const td of testData.aes128Tests) {
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey))
			const keyToEncrypt256 = uint8ArrayToKey(hexToUint8Array(td.keyToEncrypt256))
			const encryptedKey256 = encryptKey(key, keyToEncrypt256)
			o(uint8ArrayToBase64(encryptedKey256)).equals(td.encryptedKey256)
			const decryptedKey256 = decryptKey(key, encryptedKey256)
			o(uint8ArrayToHex(keyToUint8Array(decryptedKey256))).equals(td.keyToEncrypt256)
		}
	})

	o("aes 128 no mac decryption", function () {
		// We don't test encryption because we don't encrypt like this anymore
		for (const td of testData.aes128Tests) {
			random.generateRandomData = (_number) => hexToUint8Array(td.seed).slice(0, INITIALIZATION_VECTOR_LENGTH_BYTES)
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey), AesKeyLength.Aes128)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, base64ToUint8Array(td.cipherTextBase64)))
			o(decryptedBytes).equals(td.plainTextBase64)
		}
	})

	o("aes 128 mac", function () {
		for (const td of testData.aes128MacTests) {
			random.generateRandomData = (_number) => hexToUint8Array(td.seed).slice(0, INITIALIZATION_VECTOR_LENGTH_BYTES)
			let key = uint8ArrayToKey(hexToUint8Array(td.hexKey))
			let encryptedBytes = aesEncrypt(key, base64ToUint8Array(td.plainTextBase64))
			o(uint8ArrayToBase64(encryptedBytes)).equals(td.cipherTextBase64)
			let decryptedBytes = uint8ArrayToBase64(aesDecrypt(key, encryptedBytes))
			o(decryptedBytes).equals(td.plainTextBase64)
		}
	})

	o("AEAD - CTR-Then-Blake3 with associated data", async function () {
		for (const td of testData.aeadTests) {
			random.generateRandomData = (IV_BYTE_LENGTH: number) => hexToUint8Array(td.seed).slice(0, IV_BYTE_LENGTH)
			const aeadFacade = new AeadFacade()
			const encryptionKey = uint8ArrayToKey(hexToUint8Array(td.encryptionKey), AesKeyLength.Aes256)
			const authenticationKey = uint8ArrayToKey(hexToUint8Array(td.authenticationKey), AesKeyLength.Aes256)
			const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
			const subKeys = new AeadWithSessionKeySubKeys(encryptionKey, authenticationKey)
			const plaintext = base64ToUint8Array(td.plaintextBase64)
			const associatedData = base64ToUint8Array(td.associatedData)
			const versionedCiphertext = base64ToUint8Array(td.ciphertextBase64)
			const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
			const plaintextKey = hexToUint8Array(td.plaintextKey)
			const versionedEncryptedKey = base64ToUint8Array(td.encryptedKey)
			const parsedEncryptedKey = parseVersionedCiphertext(versionedEncryptedKey) as ParsedCiphertextAead

			// encrypt data
			const encryptedBytes = aeadFacade.encrypt(subKeys, plaintext, associatedData)
			o(versionedCiphertext).deepEquals(encryptedBytes)
			const decryptedBytes = aeadFacade.decrypt(subKeys, parsedCiphertext, associatedData)
			o(plaintext).deepEquals(decryptedBytes)

			// encrypt key
			const reEncryptedKey = aeadFacade.encrypt(subKeys, plaintextKey, associatedData)
			o(versionedEncryptedKey).deepEquals(reEncryptedKey)
			const decryptedKey = aeadFacade.decrypt(subKeys, parsedEncryptedKey, associatedData)
			o(plaintextKey).deepEquals(decryptedKey)
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
			o(uint8ArrayToHex(keyToUint8Array(key))).equals(td.keyHex)
		}
	})
	o("bcrypt 256", function () {
		for (const td of testData.bcrypt256Tests) {
			let key = generateKeyFromPassphraseBcrypt(td.password, hexToUint8Array(td.saltHex), KeyLength.b256)
			o(uint8ArrayToHex(keyToUint8Array(key))).equals(td.keyHex)
		}
	})
	o("argon2id", async function () {
		const argon2 = await loadArgon2WASM()
		for (let td of testData.argon2idTests) {
			let key = await generateKeyFromPassphraseArgon2id(argon2, td.password, hexToUint8Array(td.saltHex))
			o(uint8ArrayToHex(keyToUint8Array(key))).equals(td.keyHex)
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
					throw new Error(" encoding error not thrown")
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
			const key = uint8ArrayToKey(hexToUint8Array(td.keyHex))
			const data = hexToUint8Array(td.dataHex)
			const hmacSha256Tag = hexToUint8Array(td.hmacSha256TagHex) as MacTag
			o(hmacSha256(key, data)).deepEquals(hmacSha256Tag)
			verifyHmacSha256(key, data, hmacSha256Tag)
		}
	})

	o.test("async-hmac-sha256", async function () {
		for (const td of testData.hmacSha256Tests) {
			const key = uint8ArrayToKey(hexToUint8Array(td.keyHex))
			const data = hexToUint8Array(td.dataHex)
			const hmacSha256Tag = hexToUint8Array(td.hmacSha256TagHex) as MacTag
			o.check(await hmacSha256Async(key, data)).deepEquals(hmacSha256Tag)
			await verifyHmacSha256Async(key, data, hmacSha256Tag)
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

			const pqPublicKeys = new PQPublicKeys(x25519KeyPair.publicKey, kyberKeyPair.publicKey)
			const pqKeyPairs = new PQKeyPairs(x25519KeyPair, kyberKeyPair)
			const pqFacade = new PQFacade(new WASMKyberFacade(libOQS))

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
			const keyPairVersion = cryptoUtils.checkKeyVersionConstraints(td.keyPairVersion)
			let encryptionPublicKey: PublicKey

			if (td.pubKyberKey) {
				let kyberPublicKey = bytesToKyberPublicKey(hexToUint8Array(td.pubKyberKey))
				let x25519PublicKey = hexToUint8Array(td.pubEccKey)
				const x25519KeyPair = { privateKey: hexToUint8Array(td.privateEccKey), publicKey: x25519PublicKey }
				const kyberKeyPair = { publicKey: kyberPublicKey, privateKey: bytesToKyberPrivateKey(hexToUint8Array(td.privateKyberKey)) }
				encryptionKeyPair = new PQKeyPairs(x25519KeyPair, kyberKeyPair)
				encryptionPublicKey = pqKeyPairsToPublicKeys(encryptionKeyPair as PQKeyPairs)
			} else {
				// we expect that an RSA key pair is present
				let rsaPublicKey = hexToRsaPublicKey(td.pubRsaKey)
				if (td.pubEccKey) {
					let publicEccKey = hexToUint8Array(td.pubEccKey)
					encryptionKeyPair = new RsaX25519KeyPair(
						rsaPublicKey,
						hexToRsaPrivateKey(td.privateRsaKey),
						publicEccKey,
						hexToUint8Array(td.privateEccKey),
					)
					encryptionPublicKey = new RsaX25519PublicKey(rsaPublicKey, publicEccKey)
				} else {
					encryptionKeyPair = new RsaKeyPair(rsaPublicKey, hexToRsaPrivateKey(td.privateRsaKey))
					encryptionPublicKey = rsaPublicKey
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
			const originalSignature = bytesToEd25519Signature(hexToUint8Array(td.signature))
			const message = hexToUint8Array(td.message)

			// make sure encoding and decoding round trips yield the same results again
			o(uint8ArrayToHex(ed25519PrivateKeyToBytes(alicePrivateKey.object))).deepEquals(td.alicePrivateKeyHex)
			o(uint8ArrayToHex(ed25519PublicKeyToBytes(alicePublicKey))).deepEquals(td.alicePublicKeyHex)
			o(uint8ArrayToHex(ed25519SignatureToBytes(originalSignature))).deepEquals(td.signature)

			const { encodedKeyPairForSigning } = publicKeySignatureFacade.serializePublicKeyForSigning(versionedPublicEncryptionKey)
			o(encodedKeyPairForSigning).deepEquals(message)

			const { signature: reproducedSignature } = await publicKeySignatureFacade.signPublicKey(versionedEncryptionKeyPair, alicePrivateKey)
			o(reproducedSignature).deepEquals(ed25519SignatureToBytes(originalSignature))

			o(await publicKeySignatureFacade.verifyPublicKeySignature(versionedPublicEncryptionKey, alicePublicKey, reproducedSignature)).equals(true)
		}
	})

	o.spec("blake3", function () {
		o("hash", function () {
			for (const td of testData.blake3Tests) {
				const data = hexToUint8Array(td.dataHex)
				const digest = hexToUint8Array(td.digestHex)
				o(blake3Hash(data)).deepEquals(digest)
			}
		})

		o("mac", function () {
			for (const td of testData.blake3Tests) {
				const key = hexToUint8Array(td.keyHex)
				const data = hexToUint8Array(td.dataHex)
				const tag = hexToUint8Array(td.tagHex) as MacTag
				o(blake3Mac(key, data)).deepEquals(tag)
				blake3MacVerify(key, data, tag)
			}
		})

		o("kdf", function () {
			for (const td of testData.blake3Tests) {
				const inputKeyMaterialHex = hexToUint8Array(td.keyHex)
				o(uint8ArrayToHex(blake3Kdf(inputKeyMaterialHex, td.context, td.lengthInBytes))).equals(td.kdfOutputHex)
			}
		})
	})

	o.spec("AEAD key derivation", function () {
		o.test("from session key, from group key 256 bits, from group key 128 bits", function () {
			for (const td of testData.aeadKeyDerivationTests) {
				const symmetricKeyDeriver = new SymmetricKeyDeriver()
				const kdfNonce = validateKdfNonceLength(hexToUint8Array(td.kdfNonceHex))
				const splitGlobalInstanceTypeId = td.globalInstanceTypeId.split("/")
				const instanceTypeId: InstanceTypeId = {
					app: splitGlobalInstanceTypeId[0],
					id: filterInt(splitGlobalInstanceTypeId[1]),
					name: "name",
				}
				const keysFrom256 = symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(
					freshVersioned(uint8ArrayToKey(hexToUint8Array(td.groupKey256Hex))),
					kdfNonce,
					instanceTypeId,
				)

				o.check(keysFrom256).deepEquals({
					cipherVersion: SymmetricCipherVersion.AeadWithInstanceKey,
					groupKeyVersion: 0,
					encryptionKey: uint8ArrayToKey(hexToUint8Array(td.encryptionKeyFrom256Hex), AesKeyLength.Aes256),
					authenticationKey: uint8ArrayToKey(hexToUint8Array(td.authenticationKeyFrom256Hex), AesKeyLength.Aes256),
				})

				const keysFrom128 = symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(
					freshVersioned(uint8ArrayToKey(hexToUint8Array(td.groupKey128Hex))),
					kdfNonce,
					instanceTypeId,
				)
				o.check(keysFrom128).deepEquals({
					cipherVersion: SymmetricCipherVersion.AeadWithInstanceKey,
					groupKeyVersion: 0,
					encryptionKey: uint8ArrayToKey(hexToUint8Array(td.encryptionKeyFrom128Hex), AesKeyLength.Aes256),
					authenticationKey: uint8ArrayToKey(hexToUint8Array(td.authenticationKeyFrom128Hex), AesKeyLength.Aes256),
				})

				const keysFromSessionKey = symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(
					uint8ArrayToKey(hexToUint8Array(td.sessionKeyHex)),
					instanceTypeId,
				)
				o.check(keysFromSessionKey).deepEquals({
					cipherVersion: SymmetricCipherVersion.AeadWithSessionKey,
					encryptionKey: uint8ArrayToKey(hexToUint8Array(td.encryptionKeyFromSessionKeyHex), AesKeyLength.Aes256),
					authenticationKey: uint8ArrayToKey(hexToUint8Array(td.authenticationKeyFromSessionKeyHex), AesKeyLength.Aes256),
				})
			}
		})
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
		const wasmBuffer = await readFile("../src/platform-kit/crypto/crypto-primitives/crypto_primitives_bg.wasm")
		return new WASMEd25519Facade(wasmBuffer)
	} else {
		return new WASMEd25519Facade()
	}
}
