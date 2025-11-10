import o from "@tutao/otest"
import { SymmetricCipherFacade } from "../lib/encryption/symmetric/SymmetricCipherFacade.js"
import { AesCbcFacade } from "../lib/encryption/symmetric/AesCbcFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { aes256RandomKey, FIXED_IV, keyToUint8Array } from "../lib/index.js"
import { _aes128RandomKey } from "./AesTest.js"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "../lib/encryption/symmetric/SymmetricCipherVersion.js"
import { concat } from "@tutao/tutanota-utils"

o.spec("SymmetricCipherFacade", function () {
	const customIv = object<Uint8Array>()

	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aes256Key
	let plainText
	let aes128Key
	let keyToEncrypt_128
	let keyToEncrypt_256
	o.before(function () {
		aesCbcFacade = object()
		symmetricCipherFacade = new SymmetricCipherFacade(aesCbcFacade)
		aes256Key = aes256RandomKey()
		aes128Key = _aes128RandomKey()
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
		o("decrypBytes 128", function () {
			const ciphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.AesCbcThenHmac), new Uint8Array([1, 2]))
			when(aesCbcFacade.decrypt(aes128Key, ciphertext, true, true, SymmetricCipherVersion.AesCbcThenHmac, false)).thenReturn(plainText)
			const decryptedByted = symmetricCipherFacade.decryptBytes(aes128Key, ciphertext)
			o(decryptedByted).equals(plainText)
		})
		o("decrypBytes 128 no mac", function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes128Key, ciphertext, true, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, false)).thenReturn(plainText)
			const decryptedByted = symmetricCipherFacade.decryptBytes(aes128Key, ciphertext)
			o(decryptedByted).equals(plainText)
		})
		o("decrypBytes 256", function () {
			const ciphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.AesCbcThenHmac), new Uint8Array([1, 2]))
			when(aesCbcFacade.decrypt(aes256Key, ciphertext, true, true, SymmetricCipherVersion.AesCbcThenHmac, false)).thenReturn(plainText)
			const decryptedBytes = symmetricCipherFacade.decryptBytes(aes256Key, ciphertext)
			o(decryptedBytes).equals(plainText)
		})
		o("decryptBytesDeprecatedUnauthenticated 256 no mac succeeds", async function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes256Key, ciphertext, true, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)).thenReturn(plainText)
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
			// we never encrypted keys with aes 128 bit keys as encryption key with a mac. so no additional test needed
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes128Key, ciphertext, false, false, SymmetricCipherVersion.UnusedReservedUnauthenticated, false)).thenReturn(
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
			when(aesCbcFacade.decrypt(aes256Key, ciphertext, true, false, SymmetricCipherVersion.AesCbcThenHmac, false)).thenReturn(
				keyToUint8Array(keyToEncrypt_256),
			)
			const decryptedKey = symmetricCipherFacade.decryptKey(aes256Key, ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
		o("decryptKeyDeprecatedUnauthenticated 256 no mac succeeds", function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes256Key, ciphertext, true, false, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)).thenReturn(
				keyToUint8Array(keyToEncrypt_256),
			)
			const decryptedKey = symmetricCipherFacade.decryptKeyDeprecatedUnauthenticated(aes256Key, ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
		o("decryptKeyDeprecatedUnauthenticatedFixedIv 256 no mac and no iv (fixed) succeeds", function () {
			const ciphertext = new Uint8Array([1, 2])
			when(aesCbcFacade.decrypt(aes256Key, ciphertext, false, false, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)).thenReturn(
				keyToUint8Array(keyToEncrypt_256),
			)
			const decryptedKey = symmetricCipherFacade.decryptKeyDeprecatedUnauthenticated(aes256Key, ciphertext)
			o(decryptedKey).deepEquals(keyToEncrypt_256)
		})
	})
})
