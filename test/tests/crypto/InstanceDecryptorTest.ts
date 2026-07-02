import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import {
	aes256RandomKey,
	InitializationVector,
	KDF_NONCE_LENGTH_BYTES,
	validateInitializationVectorLength,
	validateKdfNonceLength,
} from "@tutao/crypto/symmetric-cipher-utils"
import { AppNameEnum } from "../../../src/platform-kit/meta"
import { concat, KeyVersion, stringToUtf8Uint8Array } from "../../../src/platform-kit/utils"
import {
	AeadWithInstanceKeySubKeys,
	AeadWithSessionKeySubKeys,
	AesCbcThenHmacSubKeys,
	InstanceTypeId,
	SymmetricKeyDeriver,
} from "@tutao/crypto/symmetric-key-deriver"
import { SymmetricCipherFacade } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { AesCbcFacade } from "@tutao/crypto/aes-cbc-facade"
import {
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN,
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN,
	Aes256Key,
	MacTag,
	OwnerKeyProvider,
	SymmetricCipherVersion,
} from "../../../src/platform-kit/crypto"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { CryptoError } from "../../../src/platform-kit/crypto/error"

o.spec("InstanceDecryptorTest", function () {
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aeadFacade: AeadFacade
	let aes256SubKeys: AesCbcThenHmacSubKeys
	let initializationVector: InitializationVector
	let macTag: MacTag
	let aeadGroupKey256SubKeys: AeadWithInstanceKeySubKeys
	let instanceTypeId: InstanceTypeId
	let ownerKey: Aes256Key
	let ownerKeyProvider: OwnerKeyProvider

	o.beforeEach(function () {
		symmetricKeyDeriver = object()
		aesCbcFacade = object()
		aeadFacade = object()
		symmetricCipherFacade = new SymmetricCipherFacade(aesCbcFacade, aeadFacade, symmetricKeyDeriver)
		aes256SubKeys = { cipherVersion: SymmetricCipherVersion.AesCbcThenHmac, encryptionKey: aes256RandomKey(), authenticationKey: aes256RandomKey() }
		initializationVector = validateInitializationVectorLength(new Uint8Array(16))
		macTag = new Uint8Array(32) as MacTag
		aeadGroupKey256SubKeys = {
			cipherVersion: SymmetricCipherVersion.AeadWithInstanceKey,
			groupKeyVersion: 0,
			encryptionKey: aes256RandomKey(),
			authenticationKey: aes256RandomKey(),
		}
		instanceTypeId = {
			app: AppNameEnum.Tutanota,
			id: 0,
			name: "name",
		}
		ownerKey = aes256RandomKey()
		ownerKeyProvider = async () => ownerKey
	})

	o.test("instanceDecryptor cannot attempt decryption if it has no means to get the keys", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, null, ownerKeyProvider, null)
		o.check(instanceDecryptor.canAttemptDecryption()).equals(false)
	})

	o.test("AEAD with instance key from group key decryption requires an ownerKeyProvider", async () => {
		const groupKeyVersion = 42 as KeyVersion
		const versionedDifferentAes256Key = { object: ownerKey, version: groupKeyVersion }
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything())).thenReturn(
			aeadGroupKey256SubKeys,
		)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, kdfNonce, null, null)
		const keyVersionLengthByte = 0
		const cipherVersion = SymmetricCipherVersion.AeadWithInstanceKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion, keyVersionLengthByte, groupKeyVersion), initializationVector.bytes, ciphertext, macTag)
		o.check(instanceDecryptor.canAttemptDecryption()).equals(false)
		await assertThrows(CryptoError, async () => await instanceDecryptor.getValueDecryptor(versionedCiphertext, ""))
	})

	o.test("Aes sub-keys get cached", async function () {
		const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
		const differentAes256Key = aes256RandomKey()
		when(symmetricKeyDeriver.deriveSubKeysAesCbc(differentAes256Key, cipherVersion)).thenReturn(aes256SubKeys)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, differentAes256Key, null, null, null)
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const firstValueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		verify(symmetricKeyDeriver.deriveSubKeysAesCbc(differentAes256Key, matchers.anything()), { times: 0 })
		firstValueDecryptor.getValue()
		verify(symmetricKeyDeriver.deriveSubKeysAesCbc(differentAes256Key, cipherVersion), { times: 1 })
		o.check(instanceDecryptor["instanceAesSubKeyCache"].get({ cipherVersion: cipherVersion, aesKey: differentAes256Key })).equals(aes256SubKeys)
		const secondValueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		secondValueDecryptor.getValue()
		verify(symmetricKeyDeriver.deriveSubKeysAesCbc(differentAes256Key, cipherVersion), { times: 1 })
		o.check(instanceDecryptor.canAttemptDecryption()).equals(true)
	})

	o.test("Aead sub-keys get cached", async function () {
		const groupKeyVersion = 42 as KeyVersion
		const versionedDifferentAes256Key = { object: ownerKey, version: groupKeyVersion }
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything())).thenReturn(
			aeadGroupKey256SubKeys,
		)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, kdfNonce, ownerKeyProvider, null)
		const keyVersionLengthByte = 0
		const cipherVersion = SymmetricCipherVersion.AeadWithInstanceKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion, keyVersionLengthByte, groupKeyVersion), initializationVector.bytes, ciphertext, macTag)
		const firstValueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything()), { times: 0 })
		firstValueDecryptor.getValue()
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything()), { times: 1 })
		o.check(instanceDecryptor["instanceAeadSubKeyCache"].get({ cipherVersion: cipherVersion, aesKey: ownerKey })).equals(aeadGroupKey256SubKeys)
		const secondValueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		secondValueDecryptor.getValue()
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything()), { times: 1 })
		o.check(instanceDecryptor.canAttemptDecryption()).equals(true)
	})

	o.test("Assembles correct associated data for AEAD with instance key from group key", async function () {
		const groupKeyVersion = 42 as KeyVersion
		const versionedDifferentAes256Key = { object: ownerKey, version: groupKeyVersion }
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything())).thenReturn(
			aeadGroupKey256SubKeys,
		)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, kdfNonce, ownerKeyProvider, null)
		const keyVersionLengthByte = 0
		const cipherVersion = SymmetricCipherVersion.AeadWithInstanceKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion, keyVersionLengthByte, groupKeyVersion), initializationVector.bytes, ciphertext, macTag)
		const fieldPath = "superCoolFieldPath"
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, fieldPath)
		o.check(valueDecryptor["associatedData"]).deepEquals(stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN + fieldPath))
		o.check(instanceDecryptor.canAttemptDecryption()).equals(true)
	})

	o.test("Assembles correct associated data for AEAD with instance key from instance key", async function () {
		const groupKeyVersion = 42 as KeyVersion
		const instanceKey = { object: aes256RandomKey(), version: groupKeyVersion }
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, matchers.anything())).thenReturn(aeadGroupKey256SubKeys)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, null, null, instanceKey)
		const keyVersionLengthByte = 0
		const cipherVersion = SymmetricCipherVersion.AeadWithInstanceKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion, keyVersionLengthByte, groupKeyVersion), initializationVector.bytes, ciphertext, macTag)
		const fieldPath = "superCoolFieldPath"
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, fieldPath)
		o.check(valueDecryptor["associatedData"]).deepEquals(stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN + fieldPath))
		o.check(instanceDecryptor.canAttemptDecryption()).equals(true)
	})

	o.test("Assembles correct associated data for AEAD with session key", async function () {
		const differentAes256Key = aes256RandomKey()
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const aeadSessionKey256SubKeys: AeadWithSessionKeySubKeys = {
			cipherVersion,
			encryptionKey: aes256RandomKey(),
			authenticationKey: aes256RandomKey(),
		}
		when(symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(differentAes256Key, matchers.anything())).thenReturn(aeadSessionKey256SubKeys)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, differentAes256Key, null, null, null)
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const fieldPath = "superCoolFieldPath"
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, fieldPath)
		o.check(valueDecryptor["associatedData"]).deepEquals(stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN + fieldPath))
		o.check(instanceDecryptor.canAttemptDecryption()).equals(true)
	})
})
