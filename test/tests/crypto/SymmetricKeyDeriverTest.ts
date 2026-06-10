import o from "@tutao/otest"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"
import {
	Aes128Key,
	Aes256Key,
	aes256RandomKey,
	AesKeyLength,
	getKeyLengthInBytes,
	keyToUint8Array,
	sha256Hash,
	sha512Hash,
	uint8ArrayToKey,
	VersionedKey,
} from "../../../src/platform-kit/crypto"
import { SymmetricCipherVersion } from "@tutao/crypto/symmetric-cipher-version"
import { _aes128RandomKey } from "./AesTest.js"
import { generateKdfNonce, KdfNonce } from "@tutao/crypto/symmetric-cipher-utils"
import { freshVersioned } from "../../../src/platform-kit/utils"
import { AppNameEnum } from "../../../src/platform-kit/meta"

o.spec("SymmetricKeyDeriverTest", function () {
	const symmetricKeyDeriver: SymmetricKeyDeriver = new SymmetricKeyDeriver()
	let aes256Key: Aes256Key
	let aes128Key: Aes128Key
	let versionedAes256Key: VersionedKey
	let versionedAes128Key: VersionedKey
	o.before(function () {
		aes256Key = aes256RandomKey()
		aes128Key = _aes128RandomKey()
		versionedAes256Key = freshVersioned(aes256Key)
		versionedAes128Key = freshVersioned(aes128Key)
	})
	o.spec("unusedReservedUnauthenticated", function () {
		o("aes 128", function () {
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const subKeys = symmetricKeyDeriver.deriveSubKeysAesCbc(aes128Key)
			o(subKeys.authenticationKey).equals(null)
			o(subKeys.encryptionKey).equals(aes128Key)
		})
		o("aes 256", function () {
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const subKeys = symmetricKeyDeriver.deriveSubKeysAesCbc(aes256Key)
			o(subKeys.authenticationKey).equals(null)
			o(subKeys.encryptionKey).equals(aes256Key)
		})
	})
	o.spec("aesCbcThenHmac", function () {
		o("aes 128", function () {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const subKeys = symmetricKeyDeriver.deriveSubKeysAesCbc(aes128Key)
			const hash = sha256Hash(keyToUint8Array(aes128Key))
			const expectedEncryptionKey = uint8ArrayToKey(hash.subarray(0, getKeyLengthInBytes(AesKeyLength.Aes128)))
			const expectedAuthenticationKey = uint8ArrayToKey(hash.subarray(getKeyLengthInBytes(AesKeyLength.Aes128), hash.length))
			o(subKeys.authenticationKey).deepEquals(expectedAuthenticationKey)
			o(subKeys.encryptionKey).deepEquals(expectedEncryptionKey)
		})
		o("aes 256", function () {
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const subKeys = symmetricKeyDeriver.deriveSubKeysAesCbc(aes256Key)
			const hash = sha512Hash(keyToUint8Array(aes256Key))
			const expectedEncryptionKey = uint8ArrayToKey(hash.subarray(0, getKeyLengthInBytes(AesKeyLength.Aes256)))
			const expectedAuthenticationKey = uint8ArrayToKey(hash.subarray(getKeyLengthInBytes(AesKeyLength.Aes256), hash.length))
			o(subKeys.authenticationKey).deepEquals(expectedAuthenticationKey)
			o(subKeys.encryptionKey).deepEquals(expectedEncryptionKey)
		})
	})

	o.spec("AEAD", function () {
		const instanceTypeId = {
			app: AppNameEnum.Tutanota,
			id: 97,
			name: "name",
		}
		let kdfNonce: KdfNonce
		o.beforeEach(function () {
			kdfNonce = generateKdfNonce()
		})

		o.test("derive from group key and nonce is reproducible", function () {
			const derivedKeys = symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedAes256Key, kdfNonce, instanceTypeId)
			const derivedKeysSecond = symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedAes256Key, kdfNonce, instanceTypeId)
			o.check(derivedKeys).deepEquals(derivedKeysSecond)
		})

		o.test("derive from group key and nonce is reproducible for legacy 128bit group key", function () {
			const derivedKeys = symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedAes128Key, kdfNonce, instanceTypeId)
			const derivedKeysSecond = symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedAes128Key, kdfNonce, instanceTypeId)
			o.check(derivedKeys).deepEquals(derivedKeysSecond)
		})

		o.test("derive from session key is reproducible", function () {
			const derivedKeys = symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(aes256Key, instanceTypeId)
			const derivedKeysSecond = symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(aes256Key, instanceTypeId)
			o.check(derivedKeys).deepEquals(derivedKeysSecond)
		})

		o.test("domain separation between key derivations", function () {
			const derivedKeysGroupKey = symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedAes256Key, kdfNonce, instanceTypeId)
			const derivedKeysSessionKey = symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(aes256Key, instanceTypeId)
			o.check(derivedKeysGroupKey.encryptionKey).notDeepEquals(derivedKeysSessionKey.encryptionKey)
			o.check(derivedKeysGroupKey.authenticationKey).notDeepEquals(derivedKeysSessionKey.authenticationKey)
		})
	})
})
