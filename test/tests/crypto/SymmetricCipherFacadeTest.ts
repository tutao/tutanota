import o from "@tutao/otest"
import { Aes128Key, Aes256Key, aes256RandomKey, AesKey, FIXED_IV, keyToUint8Array } from "@tutao/crypto"
import { AesCbcFacade } from "@tutao/crypto/aes-cbc-facade"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "@tutao/crypto/symmetric-cipher-version"
import { SymmetricCipherFacade, MissingSessionKey } from "@tutao/crypto/symmetric-cipher-facade"
import { matchers, object, verify, when } from "testdouble"
import {
	AeadFacade,
	AeadSubKeys,
	Aes128Key,
	Aes256Key,
	aes256RandomKey,
	FIXED_IV,
	IV_BYTE_LENGTH,
	keyToUint8Array,
	SymmetricKeyDeriver,
	SymmetricSubKeys,
} from "../lib/index.js"
import { _aes128RandomKey } from "./AesTest.js"
import { concat, stringToUtf8Uint8Array } from "@tutao/utils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "../lib/misc/CryptoError.js"

o.spec("SymmetricCipherFacade", function () {
	const customIv = object<Uint8Array>()

	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aeadFacade: AeadFacade
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let aes256Key: Aes256Key
	let plainText: Uint8Array
	let aes128Key: Aes128Key
	let keyToEncrypt_128: Aes128Key
	let keyToEncrypt_256: Aes256Key
	let aes128SubKeys: SymmetricSubKeys
	let aes256SubKeys: SymmetricSubKeys
	o.beforeEach(function () {
		aesCbcFacade = object()
		aeadFacade = object()
		symmetricKeyDeriver = object()
		symmetricCipherFacade = new SymmetricCipherFacade(aesCbcFacade, aeadFacade, symmetricKeyDeriver)
		aes256Key = aes256RandomKey()
		aes128Key = _aes128RandomKey()
		aes128SubKeys = { encryptionKey: _aes128RandomKey(), authenticationKey: _aes128RandomKey() }
		aes256SubKeys = { encryptionKey: aes256RandomKey(), authenticationKey: aes256RandomKey() }
		when(symmetricKeyDeriver.deriveSubKeys(aes128Key, matchers.anything())).thenReturn(aes128SubKeys)
		when(symmetricKeyDeriver.deriveSubKeys(aes256Key, matchers.anything())).thenReturn(aes256SubKeys)
		plainText = keyToUint8Array(aes256RandomKey()) // just 32 random bytes
		keyToEncrypt_128 = _aes128RandomKey()
		keyToEncrypt_256 = aes256RandomKey()
	})
	o.spec("Encrypt/decrypt bytes", function () {
		o("encryptBytes", function () {
			symmetricCipherFacade.encryptBytes(aes256Key, plainText)
			verify(aesCbcFacade.encrypt(aes256Key, plainText, true, matchers.anything(), true, SymmetricCipherVersion.AesCbcThenHmac, false))
		})
		o("encryptBytesDeprecatedUnauthenticated", function () {
			symmetricCipherFacade.encryptBytesDeprecatedUnauthenticated(aes256Key, plainText)
			verify(aesCbcFacade.encrypt(aes256Key, plainText, true, matchers.anything(), true, SymmetricCipherVersion.UnusedReservedUnauthenticated, true))
		})
		o("encryptBytesDeprecatedCustomIv", function () {
			symmetricCipherFacade.encryptBytesDeprecatedCustomIv(aes256Key, plainText, customIv)
			verify(aesCbcFacade.encrypt(aes256Key, plainText, true, customIv, true, SymmetricCipherVersion.AesCbcThenHmac))
		})
		o("encryptBytesDeprecatedUnauthenticatedCustomIv", function () {
			symmetricCipherFacade.encryptBytesDeprecatedUnauthenticatedCustomIv(aes256Key, plainText, customIv)
			verify(aesCbcFacade.encrypt(aes256Key, plainText, true, customIv, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, true))
		})
		o("decryptBytes 128", function () {
			const ciphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.AesCbcThenHmac), new Uint8Array([1, 2]))
			when(aesCbcFacade.decrypt(aes128SubKeys, ciphertext, true, true, SymmetricCipherVersion.AesCbcThenHmac, false)).thenReturn(plainText)
			const decryptedBytes = symmetricCipherFacade.decryptBytes(aes128Key, ciphertext)
			o(decryptedBytes).equals(plainText)
		})
		o("decryptBytes 128 no mac", function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes128SubKeys, ciphertext, true, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, false)).thenReturn(plainText)
			const decryptedBytes = symmetricCipherFacade.decryptBytes(aes128Key, ciphertext)
			o(decryptedBytes).equals(plainText)
		})
		o("decryptBytes 256", function () {
			const ciphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.AesCbcThenHmac), new Uint8Array([1, 2]))
			when(aesCbcFacade.decrypt(aes256SubKeys, ciphertext, true, true, SymmetricCipherVersion.AesCbcThenHmac, false)).thenReturn(plainText)
			const decryptedBytes = symmetricCipherFacade.decryptBytes(aes256Key, ciphertext)
			o(decryptedBytes).equals(plainText)
		})
		o("decryptBytesDeprecatedUnauthenticated 256 no mac succeeds", async function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes256SubKeys, ciphertext, true, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)).thenReturn(plainText)
			const decryptedBytes = symmetricCipherFacade.decryptBytesDeprecatedUnauthenticated(aes256Key, ciphertext)
			o(decryptedBytes).equals(plainText)
		})
	})
	o.spec("Encrypt/Decrypt key", function () {
		o("encryptKey 128", function () {
			symmetricCipherFacade.encryptKey(aes128Key, keyToEncrypt_128)
			verify(
				aesCbcFacade.encrypt(
					aes128Key,
					keyToUint8Array(keyToEncrypt_128),
					false,
					Uint8Array.from(FIXED_IV),
					false,
					SymmetricCipherVersion.UnusedReservedUnauthenticated,
					false,
				),
			)
		})
		o("decryptKey 128", function () {
			// we never encrypted keys with aes 128-bit keys as encryption key with a mac. so no additional test needed
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes128SubKeys, ciphertext, false, false, SymmetricCipherVersion.UnusedReservedUnauthenticated, false)).thenReturn(
				keyToUint8Array(keyToEncrypt_128),
			)
			const decryptedKey = symmetricCipherFacade.decryptKey(aes128Key, ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_128)
		})
		o("encryptKey 256", function () {
			symmetricCipherFacade.encryptKey(aes256Key, keyToEncrypt_256)
			verify(
				aesCbcFacade.encrypt(
					aes256Key,
					keyToUint8Array(keyToEncrypt_256),
					true,
					matchers.anything(),
					false,
					SymmetricCipherVersion.AesCbcThenHmac,
					false,
				),
			)
		})
		o("decryptKey 256", function () {
			const ciphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.AesCbcThenHmac), new Uint8Array([1, 2]))
			when(aesCbcFacade.decrypt(aes256SubKeys, ciphertext, true, false, SymmetricCipherVersion.AesCbcThenHmac, false)).thenReturn(
				keyToUint8Array(keyToEncrypt_256),
			)
			const decryptedKey = symmetricCipherFacade.decryptKey(aes256Key, ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
		o("decryptKeyDeprecatedUnauthenticated 256 no mac succeeds", function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes256SubKeys, ciphertext, true, false, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)).thenReturn(
				keyToUint8Array(keyToEncrypt_256),
			)
			const decryptedKey = symmetricCipherFacade.decryptKeyDeprecatedUnauthenticated(aes256Key, ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
		o("decryptKeyDeprecatedUnauthenticatedFixedIv 256 no mac and no iv (fixed) succeeds", function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes256SubKeys, ciphertext, false, false, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)).thenReturn(
				keyToUint8Array(keyToEncrypt_256),
			)
			const decryptedKey = symmetricCipherFacade.decryptKeyDeprecatedUnauthenticatedFixedIv(aes256Key, ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
	})
	o.spec("ValueDecryptor", () => {
		o.test("AesCbc with session key present", () => {
			for (const cipherVersion of [SymmetricCipherVersion.UnusedReservedUnauthenticated, SymmetricCipherVersion.AesCbcThenHmac]) {
				const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(aes256Key, null, "")
				const ciphertext = Uint8Array.of(cipherVersion)
				const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
				o.check(valueDecryptor.requiredGroupKeyVersion).equals("none")
				valueDecryptor.getValue(null)
				const plaintext = stringToUtf8Uint8Array("AesCbc with session key present plaintext")
				when(aesCbcFacade.decrypt(matchers.anything(), ciphertext, true, true, cipherVersion)).thenReturn(plaintext)
				o.check(valueDecryptor.getValue(aes256Key)).equals(plaintext)
			}
		})
		o.test("AesCbc with session key missing", () => {
			for (const cipherVersion of [SymmetricCipherVersion.UnusedReservedUnauthenticated, SymmetricCipherVersion.AesCbcThenHmac]) {
				const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, null, "")
				const ciphertext = Uint8Array.of(cipherVersion)
				const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "")
				o.check(valueDecryptor).equals(MissingSessionKey)
			}
		})
		o.test("AeadWithGroupKey", async () => {
			const kdfNonce = new Uint8Array(IV_BYTE_LENGTH)
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, kdfNonce, "")
			const keyVersionLengthByte = 0
			const groupKeyVersion = 0
			const ciphertext = Uint8Array.of(SymmetricCipherVersion.AeadWithGroupKey, keyVersionLengthByte, groupKeyVersion)
			const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
			o.check(valueDecryptor.requiredGroupKeyVersion).equals(groupKeyVersion)
			await assertThrows(CryptoError, async () => valueDecryptor.getValue(null))
			const plaintext = stringToUtf8Uint8Array("AeadWithGroupKey plaintext")
			when(aeadFacade.decrypt(matchers.anything(), ciphertext, matchers.anything())).thenReturn(plaintext)
			o.check(valueDecryptor.getValue(aes256Key)).equals(plaintext)
		})
		o.test("AeadWithSessionKey with session key present", () => {
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(aes256Key, null, "")
			const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
			const ciphertext = Uint8Array.of(cipherVersion)
			const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
			o.check(valueDecryptor.requiredGroupKeyVersion).equals("none")
			valueDecryptor.getValue(null)
			const plaintext = stringToUtf8Uint8Array("AeadWithSessionKey with session key present plaintext")
			when(aeadFacade.decrypt(matchers.anything(), ciphertext, matchers.anything())).thenReturn(plaintext)
			o.check(valueDecryptor.getValue(aes256Key)).equals(plaintext)
		})
		o.test("AeadWithSessionKey with session key missing", () => {
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, null, "")
			const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
			const ciphertext = Uint8Array.of(cipherVersion)
			const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "")
			o.check(valueDecryptor).equals(MissingSessionKey)
		})
	})
	o.spec("InstanceDecryptor", () => {
		o.test("Aes sub-keys get cached", () => {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const differentAes256Key = aes256RandomKey()
			when(symmetricKeyDeriver.deriveSubKeys(differentAes256Key, cipherVersion)).thenReturn(aes256SubKeys)
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(differentAes256Key, null, "")
			const ciphertext = Uint8Array.of(cipherVersion)
			const firstValueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
			verify(symmetricKeyDeriver.deriveSubKeys(differentAes256Key, cipherVersion), { times: 0 })
			firstValueDecryptor.getValue(differentAes256Key)
			verify(symmetricKeyDeriver.deriveSubKeys(differentAes256Key, cipherVersion), { times: 1 })
			o.check(instanceDecryptor["instanceAesSubKeyCache"].get({ cipherVersion: cipherVersion, aesKey: differentAes256Key })).equals(aes256SubKeys)
			const secondValueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
			secondValueDecryptor.getValue(differentAes256Key)
			verify(symmetricKeyDeriver.deriveSubKeys(differentAes256Key, cipherVersion), { times: 1 })
		})
		o.test("Aead sub-keys get cached", () => {
			const differentAes256Key = aes256RandomKey()
			const kdfNonce = new Uint8Array(IV_BYTE_LENGTH)
			when(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(differentAes256Key, kdfNonce, matchers.anything())).thenReturn(aes256SubKeys as AeadSubKeys)
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, kdfNonce, "")
			const keyVersionLengthByte = 0
			const groupKeyVersion = 42
			const cipherVersion = SymmetricCipherVersion.AeadWithGroupKey
			const ciphertext = Uint8Array.of(cipherVersion, keyVersionLengthByte, groupKeyVersion)
			const firstValueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
			verify(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(differentAes256Key, kdfNonce, matchers.anything()), { times: 0 })
			firstValueDecryptor.getValue(differentAes256Key)
			verify(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(differentAes256Key, kdfNonce, matchers.anything()), { times: 1 })
			o.check(instanceDecryptor["instanceAeadSubKeyCache"].get({ cipherVersion: cipherVersion, aesKey: differentAes256Key })).equals(
				aes256SubKeys as AeadSubKeys,
			)
			const secondValueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
			secondValueDecryptor.getValue(differentAes256Key)
			verify(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(differentAes256Key, kdfNonce, matchers.anything()), { times: 1 })
		})
	})
})
