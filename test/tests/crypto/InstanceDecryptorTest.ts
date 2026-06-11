import o from "@tutao/otest"
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
	AeadWithGroupKeySubKeys,
	AeadWithSessionKeySubKeys,
	AesCbcThenHmacSubKeys,
	InstanceTypeId,
	SymmetricKeyDeriver,
} from "@tutao/crypto/symmetric-key-deriver"
import { SymmetricCipherFacade } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { AesCbcFacade } from "@tutao/crypto/aes-cbc-facade"
import {
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN,
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN,
	MacTag,
	SymmetricCipherVersion,
} from "../../../src/platform-kit/crypto"
import { ValueDecryptor } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/decryption/ValueDecryptor"
import { AeadFacade } from "@tutao/crypto/aead-facade"

o.spec("InstanceDecryptorTest", () => {
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aeadFacade: AeadFacade
	let aes256SubKeys: AesCbcThenHmacSubKeys
	let initializationVector: InitializationVector
	let macTag: MacTag
	let aeadGroupKey256SubKeys: AeadWithGroupKeySubKeys
	let instanceTypeId: InstanceTypeId

	o.beforeEach(function () {
		symmetricKeyDeriver = object()
		aesCbcFacade = object()
		aeadFacade = object()
		symmetricCipherFacade = new SymmetricCipherFacade(aesCbcFacade, aeadFacade, symmetricKeyDeriver)
		aes256SubKeys = { cipherVersion: SymmetricCipherVersion.AesCbcThenHmac, encryptionKey: aes256RandomKey(), authenticationKey: aes256RandomKey() }
		initializationVector = validateInitializationVectorLength(new Uint8Array(16))
		macTag = new Uint8Array(32) as MacTag
		aeadGroupKey256SubKeys = {
			cipherVersion: SymmetricCipherVersion.AeadWithGroupKey,
			groupKeyVersion: 0,
			encryptionKey: aes256RandomKey(),
			authenticationKey: aes256RandomKey(),
		}
		instanceTypeId = {
			app: AppNameEnum.Tutanota,
			id: 0,
			name: "name",
		}
	})

	o.test("Aes sub-keys get cached", () => {
		const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
		const differentAes256Key = aes256RandomKey()
		when(symmetricKeyDeriver.deriveSubKeysAesCbcHmac(differentAes256Key)).thenReturn(aes256SubKeys)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(differentAes256Key, null, instanceTypeId)
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector, ciphertext, macTag)
		const firstValueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, "") as ValueDecryptor
		verify(symmetricKeyDeriver.deriveSubKeysAesCbcHmac(differentAes256Key), { times: 0 })
		firstValueDecryptor.getValue(differentAes256Key)
		verify(symmetricKeyDeriver.deriveSubKeysAesCbcHmac(differentAes256Key), { times: 1 })
		o.check(instanceDecryptor["instanceAesSubKeyCache"].get({ cipherVersion: cipherVersion, aesKey: differentAes256Key })).equals(aes256SubKeys)
		const secondValueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, "") as ValueDecryptor
		secondValueDecryptor.getValue(differentAes256Key)
		verify(symmetricKeyDeriver.deriveSubKeysAesCbcHmac(differentAes256Key), { times: 1 })
	})

	o.test("Aead sub-keys get cached", () => {
		const differentAes256Key = aes256RandomKey()
		const groupKeyVersion = 42 as KeyVersion
		const versionedDifferentAes256Key = { object: differentAes256Key, version: groupKeyVersion }
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		when(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything())).thenReturn(aeadGroupKey256SubKeys)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, kdfNonce, instanceTypeId)
		const keyVersionLengthByte = 0
		const cipherVersion = SymmetricCipherVersion.AeadWithGroupKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion, keyVersionLengthByte, groupKeyVersion), initializationVector, ciphertext, macTag)
		const firstValueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, "") as ValueDecryptor
		verify(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything()), { times: 0 })
		firstValueDecryptor.getValue(differentAes256Key)
		verify(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything()), { times: 1 })
		o.check(instanceDecryptor["instanceAeadSubKeyCache"].get({ cipherVersion: cipherVersion, aesKey: differentAes256Key })).equals(aeadGroupKey256SubKeys)
		const secondValueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, "") as ValueDecryptor
		secondValueDecryptor.getValue(differentAes256Key)
		verify(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything()), { times: 1 })
	})

	o.test("Assembles correct associated data for AEAD with group key", () => {
		const differentAes256Key = aes256RandomKey()
		const groupKeyVersion = 42 as KeyVersion
		const versionedDifferentAes256Key = { object: differentAes256Key, version: groupKeyVersion }
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		when(symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(versionedDifferentAes256Key, kdfNonce, matchers.anything())).thenReturn(aeadGroupKey256SubKeys)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, kdfNonce, instanceTypeId)
		const keyVersionLengthByte = 0
		const cipherVersion = SymmetricCipherVersion.AeadWithGroupKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion, keyVersionLengthByte, groupKeyVersion), initializationVector, ciphertext, macTag)
		const fieldPath = "superCoolFieldPath"
		const valueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, fieldPath) as ValueDecryptor
		o.check(valueDecryptor["associatedData"]).deepEquals(stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN + fieldPath))
	})

	o.test("Assembles correct associated data for AEAD with session key", () => {
		const differentAes256Key = aes256RandomKey()
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const aeadSessionKey256SubKeys: AeadWithSessionKeySubKeys = {
			cipherVersion,
			encryptionKey: aes256RandomKey(),
			authenticationKey: aes256RandomKey(),
		}
		when(symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(differentAes256Key, matchers.anything())).thenReturn(aeadSessionKey256SubKeys)
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(differentAes256Key, null, instanceTypeId)
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector, ciphertext, macTag)
		const fieldPath = "superCoolFieldPath"
		const valueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, fieldPath) as ValueDecryptor
		o.check(valueDecryptor["associatedData"]).deepEquals(stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN + fieldPath))
	})
})
