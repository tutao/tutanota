import o from "@tutao/otest"
import { AEAD_KEY_DERIVATION_INFO, SymmetricKeyDeriver } from "../lib/encryption/symmetric/SymmetricKeyDeriver.js"
import { aes256RandomKey, keyToUint8Array, uint8ArrayToKey } from "../lib/encryption/symmetric/SymmetricCipherUtils.js"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "../lib/encryption/symmetric/SymmetricCipherVersion.js"
import { _aes128RandomKey } from "./AesTest.js"
import { AesKeyLength, getKeyLengthInBytes, hkdf, sha256Hash, sha512Hash } from "../lib/index.js"
import { concat } from "@tutao/tutanota-utils"

o.spec("SymmetricKeyDeriverTest", function () {
	const symmetricKeyDeriver: SymmetricKeyDeriver = new SymmetricKeyDeriver()
	let aes256Key
	let aes128Key
	o.before(function () {
		aes256Key = aes256RandomKey()
		aes128Key = _aes128RandomKey()
	})
	o.spec("unusedReservedUnauthenticated", function () {
		o("aes 128", function () {
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const subKeys = symmetricKeyDeriver.deriveSubKeys(aes128Key, cipherVersion)
			o(subKeys.authenticationKey).equals(null)
			o(subKeys.encryptionKey).equals(aes128Key)
		})
		o("aes 256", function () {
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const subKeys = symmetricKeyDeriver.deriveSubKeys(aes256Key, cipherVersion)
			o(subKeys.authenticationKey).equals(null)
			o(subKeys.encryptionKey).equals(aes256Key)
		})
	})
	o.spec("aesCbcThenHmac", function () {
		o("aes 128", function () {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const subKeys = symmetricKeyDeriver.deriveSubKeys(aes128Key, cipherVersion)
			const hash = sha256Hash(keyToUint8Array(aes128Key))
			const expectedEncryptionKey = uint8ArrayToKey(hash.subarray(0, getKeyLengthInBytes(AesKeyLength.Aes128)))
			const expectedAuthenticationKey = uint8ArrayToKey(hash.subarray(getKeyLengthInBytes(AesKeyLength.Aes128), hash.length))
			o(subKeys.authenticationKey).deepEquals(expectedAuthenticationKey)
			o(subKeys.encryptionKey).deepEquals(expectedEncryptionKey)
		})
		o("aes 256", function () {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const subKeys = symmetricKeyDeriver.deriveSubKeys(aes256Key, cipherVersion)
			const hash = sha512Hash(keyToUint8Array(aes256Key))
			const expectedEncryptionKey = uint8ArrayToKey(hash.subarray(0, getKeyLengthInBytes(AesKeyLength.Aes256)))
			const expectedAuthenticationKey = uint8ArrayToKey(hash.subarray(getKeyLengthInBytes(AesKeyLength.Aes256), hash.length))
			o(subKeys.authenticationKey).deepEquals(expectedAuthenticationKey)
			o(subKeys.encryptionKey).deepEquals(expectedEncryptionKey)
		})
	})
	o.spec("AEAD", function () {
		o("aead", function () {
			const cipherVersion = SymmetricCipherVersion.Aead
			const subKeys = symmetricKeyDeriver.deriveSubKeys(aes256Key, cipherVersion)
			const info = concat(Uint8Array.from(AEAD_KEY_DERIVATION_INFO), symmetricCipherVersionToUint8Array(cipherVersion))
			const derivedKeys = hkdf(null, keyToUint8Array(aes256Key), info, 2 * getKeyLengthInBytes(AesKeyLength.Aes256))
			const expectedEncryptionKey = uint8ArrayToKey(derivedKeys.subarray(0, getKeyLengthInBytes(AesKeyLength.Aes256)))
			const expectedAuthenticationKey = uint8ArrayToKey(derivedKeys.subarray(getKeyLengthInBytes(AesKeyLength.Aes256), derivedKeys.length))
			o(subKeys.authenticationKey).deepEquals(expectedAuthenticationKey)
			o(subKeys.encryptionKey).deepEquals(expectedEncryptionKey)
		})
	})
})
