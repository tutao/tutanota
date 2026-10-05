import o, { throwsErrorWithMessage } from "@tutao/otest"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "../../../src/platform-kit/utils"
import {
	Aes,
	Aes128Key,
	Aes256Key,
	AesCbcFacade,
	AesKey,
	AesKeyLength,
	base64ToKey,
	getKeyLengthInBytes,
	InitializationVector,
	keyToBase64,
	random,
	SymmetricCipherFacade,
	SymmetricCipherUtils,
	uint8ArrayToKey,
} from "../../../src/platform-kit/crypto"
import { validateInitializationVectorLength } from "@tutao/crypto/symmetric-cipher-utils"
import { CryptoError } from "../../../src/platform-kit/crypto/error"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"

o.spec("aes", function () {
	let symmetricCipherUtils: SymmetricCipherUtils
	let aes: Aes

	const initializationVector = validateInitializationVectorLength(
		new Uint8Array([233, 159, 225, 105, 170, 223, 70, 218, 139, 107, 71, 91, 179, 231, 239, 102]),
	)

	o.beforeEach(function () {
		symmetricCipherUtils = new SymmetricCipherUtils(random)
		aes = new Aes(new SymmetricCipherFacade(new AesCbcFacade(), new AeadFacade(symmetricCipherUtils), new SymmetricKeyDeriver(), symmetricCipherUtils))
	})

	o("encryption roundtrip 128 without mac", () => arrayRoundtrip(aes.aesEncrypt, aes.aesDecrypt, _aes128RandomKey()))
	o("encryption roundtrip 128 with mac", () => arrayRoundtrip(aes.aesEncrypt, aes.aesDecrypt, _aes128RandomKey()))
	o("encrypted roundtrip 256 with mac", () => arrayRoundtrip(aes.aesEncrypt, aes.aesDecrypt, symmetricCipherUtils.aes256RandomKey()))
	o("encrypted roundtrip 256 searchIndexEntry", () =>
		arrayRoundtrip(aes.aes256EncryptSearchIndexEntry, aes.aesDecryptUnauthenticated, symmetricCipherUtils.aes256RandomKey()),
	)
	o("encrypted roundtrip 256 searchIndexEntryWithIV", () =>
		arrayRoundtrip(
			aes.aes256EncryptSearchIndexEntryWithInitializationVector,
			aes.aesDecryptUnauthenticated,
			symmetricCipherUtils.aes256RandomKey(),
			initializationVector,
		),
	)
	o("encrypted roundtrip 256 ConfigurationDatabaseItem", () =>
		arrayRoundtrip(aes.aesEncryptConfigurationDatabaseItem, aes.aesDecrypt, symmetricCipherUtils.aes256RandomKey(), initializationVector),
	)

	async function arrayRoundtrip(encrypt, decrypt, key, initializationVector?: InitializationVector) {
		function runArrayRoundtrip(key: AesKey, plainText) {
			let encrypted = encrypt(key, plainText, initializationVector)
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
	o("generateRandomKeyAndBase64Conversion 256", () => randomKeyBase64Conversion(symmetricCipherUtils.aes256RandomKey, 44))

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

	o("decryptInvalidData 128", () => decryptInvalidData(_aes128RandomKey(), aes.aesDecrypt, "aes decryption failed> initialization vector must be 128 bits"))
	o("decryptInvalidData 256 without hmac", () =>
		decryptInvalidData(
			symmetricCipherUtils.aes256RandomKey(),
			aes.aesDecryptUnauthenticated,
			"aes decryption failed> initialization vector must be 128 bits",
		),
	)

	function decryptInvalidData(key, decrypt, errorMessage) {
		// useMac is only used for aes256Decrypt
		o.check(() => decrypt(key, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]), true, false)).satisfies(throwsErrorWithMessage(CryptoError, errorMessage))
	}

	o("decryptManipulatedData 128 without mac", function () {
		const key = new Aes256Key([151050668, 1341212767, 316219065, 2150939763, 151050668, 1341212767, 316219065, 2150939763])
		let encrypted = aes.aes256EncryptSearchIndexEntryWithInitializationVector(key, stringToUtf8Uint8Array("hello"), initializationVector)
		encrypted[0] = encrypted[0] + 1
		let decrypted = aes.aesDecryptUnauthenticated(key, encrypted)
		o(utf8Uint8ArrayToString(decrypted)).equals("kello") // => encrypted data has been manipulated (missing MAC)
	})
	o("decryptManipulatedData 128 with mac", function () {
		let key = new Aes128Key([151050668, 1341212767, 316219065, 2150939763])
		let encrypted = aes.aesEncrypt(key, stringToUtf8Uint8Array("hello"))
		encrypted[1] = encrypted[1] + 1

		o.check(() => aes.aesDecrypt(key, encrypted)).satisfies(throwsErrorWithMessage(CryptoError, "invalid mac"))
		try {
			aes.aesDecrypt(key, encrypted)
		} catch (e) {
			const error = e as Error
			o(error instanceof CryptoError).equals(true)
			o(error.message).equals("invalid mac")
		}
	})
	o("decryptManipulatedMac 128 with mac", function () {
		let key = new Aes128Key([151050668, 1341212767, 316219065, 2150939763])
		let encrypted = aes.aesEncrypt(key, stringToUtf8Uint8Array("hello"))
		encrypted[encrypted.length - 1] = encrypted[encrypted.length - 1] + 1

		o.check(() => aes.aesDecrypt(key, encrypted)).satisfies(throwsErrorWithMessage(CryptoError, "invalid mac"))
	})

	o("decryptManipulatedData 256", function () {
		let key = symmetricCipherUtils.aes256RandomKey()
		try {
			let encrypted = aes.aesEncrypt(key, stringToUtf8Uint8Array("hello"))
			encrypted[1] = encrypted[1] + 4
			aes.aesDecrypt(key, encrypted)
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			o(e.message).equals("invalid mac")
		}
	})

	o("decryptWithWrongKey 128 without mac", () =>
		decryptWithWrongKey(
			_aes128RandomKey(),
			_aes128RandomKey(),
			aes.aes256EncryptSearchIndexEntry,
			aes.aesDecrypt,
			"aes decryption failed> pkcs#5 padding corrupt",
		),
	)
	o("decryptWithWrongKey 128 with mac", () => decryptWithWrongKey(_aes128RandomKey(), _aes128RandomKey(), aes.aesEncrypt, aes.aesDecrypt, "invalid mac"))
	o("decryptWithWrongKey 256 with mac", () =>
		decryptWithWrongKey(symmetricCipherUtils.aes256RandomKey(), symmetricCipherUtils.aes256RandomKey(), aes.aesEncrypt, aes.aesDecrypt, "invalid mac"),
	)

	function decryptWithWrongKey(key, key2, encrypt, decrypt, errorMessage) {
		const encrypted = encrypt(key, stringToUtf8Uint8Array("hello"))
		o.check(() => decrypt(key2, encrypted)).satisfies(throwsErrorWithMessage(CryptoError, errorMessage))
	}

	o("ciphertextLengths 128 with mac", () => ciphertextLengths(_aes128RandomKey(), aes.aesEncrypt, 65, 81))
	o("ciphertextLengths 256 with mac", () => ciphertextLengths(symmetricCipherUtils.aes256RandomKey(), aes.aesEncrypt, 65, 81))

	function ciphertextLengths(key, encrypt, length15BytePlainText, length16BytePlainText) {
		// check that 15 bytes fit into one block
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcde")).length).equals(length15BytePlainText)
		// check that 16 bytes need two blocks (because of one byte padding length info)
		o(encrypt(key, stringToUtf8Uint8Array("1234567890abcdef")).length).equals(length16BytePlainText)
	}
})

export function _aes128RandomKey(): Aes128Key {
	return uint8ArrayToKey(random.generateRandomData(getKeyLengthInBytes(AesKeyLength.Aes128)), AesKeyLength.Aes128)
}
