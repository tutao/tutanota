import o from "@tutao/otest"
import { AesCbcFacade, AuthenticationEnforcement, PaddingStandard } from "@tutao/crypto/aes-cbc-facade"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "@tutao/crypto/symmetric-cipher-version"
import { matchers, object, verify, when } from "testdouble"
import {
	AeadSubKeys,
	Aes128Key,
	Aes256Key,
	aes256RandomKey,
	AesCbcThenHmacSubKeys,
	FIXED_INITIALIZATION_VECTOR,
	InitializationVector,
	keyToUint8Array,
	MacTag,
	ParsedCiphertextAesCbcThenHmac,
	ParsedCiphertextUnusedReservedUnauthenticated,
	UnusedReservedUnauthenticatedSubKeys,
	validateInitializationVectorLength,
} from "../../../src/platform-kit/crypto"
import { _aes128RandomKey } from "./AesTest.js"
import { concat } from "../../../src/platform-kit/utils"
import { InitializationVectorVariant } from "../../../src/platform-kit/crypto/encryption/symmetric/ParsedCiphertext"
import { SymmetricCipherFacade } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"

o.spec("SymmetricCipherFacadeTest", function () {
	const customInitializationVector = object<InitializationVector>()

	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aeadFacade: AeadFacade
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let aes256Key: Aes256Key
	let plaintext: Uint8Array
	let aes128Key: Aes128Key
	let keyToEncrypt_128: Aes128Key
	let keyToEncrypt_256: Aes256Key
	let aes128SubKeys: AesCbcThenHmacSubKeys
	let aes256SubKeys: AesCbcThenHmacSubKeys
	let macTag: MacTag
	let initializationVector: InitializationVector
	o.beforeEach(function () {
		aesCbcFacade = object()
		aeadFacade = object()
		symmetricKeyDeriver = object()
		symmetricCipherFacade = new SymmetricCipherFacade(aesCbcFacade, aeadFacade, symmetricKeyDeriver)
		aes256Key = aes256RandomKey()
		aes128Key = _aes128RandomKey()
		aes128SubKeys = new AesCbcThenHmacSubKeys(_aes128RandomKey(), _aes128RandomKey())
		aes256SubKeys = new AesCbcThenHmacSubKeys(aes256RandomKey(), aes256RandomKey())
		when(symmetricKeyDeriver.deriveSubKeysAesCbc(aes128Key)).thenReturn(aes128SubKeys)
		when(symmetricKeyDeriver.deriveSubKeysAesCbc(aes256Key)).thenReturn(aes256SubKeys)
		plaintext = keyToUint8Array(aes256RandomKey()) // just 32 random bytes
		keyToEncrypt_128 = _aes128RandomKey()
		keyToEncrypt_256 = aes256RandomKey()
		macTag = new Uint8Array(32) as MacTag
		initializationVector = validateInitializationVectorLength(new Uint8Array(16))
	})
	o.spec("Encrypt/decrypt bytes", function () {
		o("encryptBytes", function () {
			symmetricCipherFacade.encryptBytes(aes256Key, plaintext)
			verify(
				aesCbcFacade.encrypt(
					aes256SubKeys,
					plaintext,
					matchers.argThat((arg) => arg instanceof Uint8Array),
					PaddingStandard.Pkcs5,
					SymmetricCipherVersion.AesCbcThenHmac,
					AuthenticationEnforcement.Strict,
				),
			)
		})
		o("encryptBytes with sub-keys", function () {
			symmetricCipherFacade.encryptBytes(aes256SubKeys, plaintext)
			verify(
				aesCbcFacade.encrypt(
					aes256SubKeys,
					plaintext,
					matchers.argThat((arg) => arg instanceof Uint8Array),
					PaddingStandard.Pkcs5,
					SymmetricCipherVersion.AesCbcThenHmac,
					AuthenticationEnforcement.Strict,
				),
			)
		})
		o("encryptBytesDeprecatedUnauthenticated", function () {
			const subKeys = new UnusedReservedUnauthenticatedSubKeys(aes256Key)
			symmetricCipherFacade.encryptBytesDeprecatedUnauthenticated(aes256Key, plaintext)
			verify(
				aesCbcFacade.encrypt(
					subKeys,
					plaintext,
					matchers.argThat((arg) => arg instanceof Uint8Array),
					PaddingStandard.Pkcs5,
					SymmetricCipherVersion.UnusedReservedUnauthenticated,
					AuthenticationEnforcement.Relaxed,
				),
			)
		})
		o("encryptBytesDeprecatedCustomInitializationVector", function () {
			symmetricCipherFacade.encryptBytesDeprecatedCustomInitializationVector(aes256Key, plaintext, customInitializationVector)
			verify(aesCbcFacade.encrypt(aes256SubKeys, plaintext, customInitializationVector, PaddingStandard.Pkcs5, SymmetricCipherVersion.AesCbcThenHmac))
		})
		o("encryptBytesDeprecatedUnauthenticatedCustomInitializationVector", function () {
			const subKeys = new UnusedReservedUnauthenticatedSubKeys(aes256Key)
			symmetricCipherFacade.encryptBytesDeprecatedUnauthenticatedCustomInitializationVector(aes256Key, plaintext, customInitializationVector)
			verify(
				aesCbcFacade.encrypt(
					subKeys,
					plaintext,
					customInitializationVector,
					PaddingStandard.Pkcs5,
					SymmetricCipherVersion.UnusedReservedUnauthenticated,
					AuthenticationEnforcement.Relaxed,
				),
			)
		})
		o("decryptBytes 128", function () {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = new Uint8Array([1, 2])
			const initializationVectorVariant = InitializationVectorVariant.Random
			const parsedCiphertext = new ParsedCiphertextAesCbcThenHmac(initializationVector, ciphertext, macTag, initializationVectorVariant)

			const versionedCiphertext = concat(
				symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
				initializationVector,
				parsedCiphertext.ciphertext,
				macTag,
			)
			when(aesCbcFacade.decrypt(aes128SubKeys, parsedCiphertext, PaddingStandard.Pkcs5, AuthenticationEnforcement.Strict)).thenReturn(plaintext)
			const decryptedBytes = symmetricCipherFacade.decryptBytes(aes128Key, versionedCiphertext)
			o(decryptedBytes).equals(plaintext)
		})
		o("decryptBytes 128 no mac", function () {
			const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(
				initializationVector,
				new Uint8Array([1, 2]),
				InitializationVectorVariant.Random,
			)
			const versionedCiphertext = concat(
				symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
				initializationVector,
				parsedCiphertext.ciphertext,
			)
			when(
				aesCbcFacade.decrypt(
					matchers.isA(UnusedReservedUnauthenticatedSubKeys),
					parsedCiphertext,
					PaddingStandard.Pkcs5,
					AuthenticationEnforcement.Strict,
				),
			).thenReturn(plaintext)
			const decryptedBytes = symmetricCipherFacade.decryptBytes(aes128Key, versionedCiphertext)
			o(decryptedBytes).equals(plaintext)
		})
		o("decryptBytes 256", function () {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = new Uint8Array([1, 2])
			const initializationVectorVariant = InitializationVectorVariant.Random
			const parsedCiphertext = new ParsedCiphertextAesCbcThenHmac(initializationVector, ciphertext, macTag, initializationVectorVariant)

			const versionedCiphertext = concat(
				symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
				initializationVector,
				parsedCiphertext.ciphertext,
				macTag,
			)
			when(aesCbcFacade.decrypt(aes256SubKeys, parsedCiphertext, PaddingStandard.Pkcs5, AuthenticationEnforcement.Strict)).thenReturn(plaintext)
			const decryptedBytes = symmetricCipherFacade.decryptBytes(aes256Key, versionedCiphertext)
			o(decryptedBytes).equals(plaintext)
		})
		o("decryptBytesDeprecatedUnauthenticated 256 no mac succeeds", async function () {
			const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(
				initializationVector,
				new Uint8Array([1, 2]),
				InitializationVectorVariant.Random,
			)
			const versionedCiphertext = concat(
				symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
				initializationVector,
				parsedCiphertext.ciphertext,
			)
			when(
				aesCbcFacade.decrypt(
					matchers.isA(UnusedReservedUnauthenticatedSubKeys),
					parsedCiphertext,
					PaddingStandard.Pkcs5,
					AuthenticationEnforcement.Relaxed,
				),
			).thenReturn(plaintext)
			const decryptedBytes = symmetricCipherFacade.decryptBytesDeprecatedUnauthenticated(aes256Key, versionedCiphertext)
			o(decryptedBytes).equals(plaintext)
		})
		o("encrypt bytes with Aead", () => {
			const subKeys: AeadSubKeys = object()
			const associatedData = Uint8Array.from("associatedData")
			const ciphertext = Uint8Array.from("ciphertext")
			when(aeadFacade.encrypt(subKeys, plaintext, associatedData)).thenReturn(ciphertext)
			const encryptedPlaintext = symmetricCipherFacade.encryptBytesWithAead(subKeys, plaintext, associatedData)
			o.check(encryptedPlaintext).deepEquals(ciphertext)
		})
	})
	o.spec("Encrypt/Decrypt key", function () {
		o("encryptKey 128", function () {
			const subKeys = new UnusedReservedUnauthenticatedSubKeys(aes128Key)
			symmetricCipherFacade.encryptKey(aes128Key, keyToEncrypt_128)
			verify(
				aesCbcFacade.encrypt(
					subKeys,
					keyToUint8Array(keyToEncrypt_128),
					InitializationVectorVariant.Fixed,
					PaddingStandard.None,
					SymmetricCipherVersion.UnusedReservedUnauthenticated,
					AuthenticationEnforcement.Strict,
				),
			)
		})
		o("decryptKey 128", function () {
			// we never encrypted keys with aes 128-bit keys as encryption key with a mac. so no additional test needed
			const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(
				FIXED_INITIALIZATION_VECTOR,
				new Uint8Array([1, 2]),
				InitializationVectorVariant.Fixed,
			)
			const versionedCiphertext = concat(symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion), parsedCiphertext.ciphertext)
			when(
				aesCbcFacade.decrypt(
					matchers.isA(UnusedReservedUnauthenticatedSubKeys),
					parsedCiphertext,
					PaddingStandard.None,
					AuthenticationEnforcement.Strict,
				),
			).thenReturn(keyToUint8Array(keyToEncrypt_128))
			const decryptedKey = symmetricCipherFacade.decryptKey(aes128Key, versionedCiphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_128)
		})
		o("encryptKey 256", function () {
			symmetricCipherFacade.encryptKey(aes256Key, keyToEncrypt_256)
			verify(
				aesCbcFacade.encrypt(
					aes256SubKeys,
					keyToUint8Array(keyToEncrypt_256),
					matchers.argThat((arg) => arg instanceof Uint8Array),
					PaddingStandard.None,
					SymmetricCipherVersion.AesCbcThenHmac,
					AuthenticationEnforcement.Strict,
				),
			)
		})
		o("decryptKey 256", function () {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = new Uint8Array([1, 2])
			const initializationVectorVariant = InitializationVectorVariant.Random
			const parsedCiphertext = new ParsedCiphertextAesCbcThenHmac(initializationVector, ciphertext, macTag, initializationVectorVariant)

			const versionedCiphertext = concat(symmetricCipherVersionToUint8Array(cipherVersion), initializationVector, ciphertext, macTag)
			when(aesCbcFacade.decrypt(aes256SubKeys, parsedCiphertext, PaddingStandard.None, AuthenticationEnforcement.Strict)).thenReturn(
				keyToUint8Array(keyToEncrypt_256),
			)
			const decryptedKey = symmetricCipherFacade.decryptKey(aes256Key, versionedCiphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
		o("decryptKeyDeprecatedUnauthenticated 256 no mac succeeds", function () {
			const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(
				initializationVector,
				new Uint8Array([1, 2]),
				InitializationVectorVariant.Random,
			)
			const versionedCiphertext = concat(
				symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
				initializationVector,
				parsedCiphertext.ciphertext,
			)

			when(
				aesCbcFacade.decrypt(
					matchers.isA(UnusedReservedUnauthenticatedSubKeys),
					parsedCiphertext,
					PaddingStandard.None,
					AuthenticationEnforcement.Relaxed,
				),
			).thenReturn(keyToUint8Array(keyToEncrypt_256))
			const decryptedKey = symmetricCipherFacade.decryptKeyDeprecatedUnauthenticated(aes256Key, versionedCiphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
		o("decryptKeyDeprecatedUnauthenticatedFixedInitializationVector 256 no mac and no initialization vector (fixed) succeeds", function () {
			const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(
				FIXED_INITIALIZATION_VECTOR,
				new Uint8Array([1, 2]),
				InitializationVectorVariant.Fixed,
			)
			when(
				aesCbcFacade.decrypt(
					matchers.isA(UnusedReservedUnauthenticatedSubKeys),
					parsedCiphertext,
					PaddingStandard.None,
					AuthenticationEnforcement.Relaxed,
				),
			).thenReturn(keyToUint8Array(keyToEncrypt_256))
			const decryptedKey = symmetricCipherFacade.decryptKeyDeprecatedUnauthenticatedFixedInitializationVector(aes256Key, parsedCiphertext.ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
	})
})
