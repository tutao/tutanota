import {
	ParsedCiphertextAead,
	ParsedCiphertextAesCbcThenHmac,
	ParsedCiphertextUnusedReservedUnauthenticated,
	parseVersionedCiphertext,
} from "../../../src/platform-kit/crypto/encryption/symmetric/ParsedCiphertext"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "@tutao/crypto/symmetric-cipher-version"
import { AesCbcFacade, PaddingStandard } from "@tutao/crypto/aes-cbc-facade"
import { matchers, object, verify, when } from "testdouble"
import {
	aes256RandomKey,
	InitializationVector,
	KDF_NONCE_LENGTH_BYTES,
	validateInitializationVectorLength,
	validateKdfNonceLength,
} from "@tutao/crypto/symmetric-cipher-utils"
import o, { assertThrows } from "@tutao/otest"
import {
	AeadWithInstanceKeySubKeys,
	AeadWithSessionKeySubKeys,
	AesCbcThenHmacSubKeys,
	InstanceTypeId,
	SymmetricKeyDeriver,
} from "@tutao/crypto/symmetric-key-deriver"
import { SymmetricCipherFacade } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { MacTag, OwnerKeyProvider, VersionedAes256Key, VersionedKey } from "../../../src/platform-kit/crypto"
import { AppNameEnum } from "../../../src/platform-kit/meta"
import { concat, stringToUtf8Uint8Array } from "../../../src/platform-kit/utils"
import { CryptoError, SessionKeyNotFoundError } from "../../../src/platform-kit/crypto/error"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { Aes256Key } from "../../../src/platform-kit/crypto/encryption/symmetric/AesKey"

o.spec("ValueDecryptorTest", function () {
	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aeadFacade: AeadFacade
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let aes256Key: Aes256Key
	let macTag: MacTag
	let initializationVector: InitializationVector
	let instanceTypeId: InstanceTypeId
	let ownerKeyProvider: OwnerKeyProvider

	o.beforeEach(function () {
		aesCbcFacade = object()
		aeadFacade = object()
		symmetricKeyDeriver = object()
		symmetricCipherFacade = new SymmetricCipherFacade(aesCbcFacade, aeadFacade, symmetricKeyDeriver)
		aes256Key = aes256RandomKey()
		macTag = new Uint8Array(32) as MacTag
		initializationVector = validateInitializationVectorLength(new Uint8Array(16))
		instanceTypeId = {
			app: AppNameEnum.Tutanota,
			id: 0,
			name: "name",
		}
		ownerKeyProvider = async () => aes256Key
	})

	o.test("UnusedReservedUnauthenticated, unauthenticated with session key present", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, aes256Key, null, null, null)
		const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(initializationVector, new Uint8Array([1, 2]))
		const ciphertext = concat(symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion), initializationVector.bytes, parsedCiphertext.ciphertext)
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(ciphertext, "")
		valueDecryptor.getValue()
		const plaintext = stringToUtf8Uint8Array("AesCbc with session key present plaintext")

		when(aesCbcFacade.decrypt(matchers.anything(), parsedCiphertext, PaddingStandard.Pkcs5)).thenReturn(plaintext)
		o.check(valueDecryptor.getValue()).equals(plaintext)
	})

	o.test("AesCbcThenHmac, with session key present", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, aes256Key, null, null, null)
		const ciphertextRaw = new Uint8Array([1, 2])
		const parsedCiphertext = new ParsedCiphertextAesCbcThenHmac(initializationVector, ciphertextRaw, macTag)

		const ciphertext = concat(
			symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
			initializationVector.bytes,
			parsedCiphertext.ciphertext,
			macTag,
		)
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(ciphertext, "")
		const plaintext = stringToUtf8Uint8Array("AesCbc with session key present plaintext")

		when(aesCbcFacade.decrypt(matchers.anything(), parsedCiphertext, PaddingStandard.Pkcs5)).thenReturn(plaintext)
		const subKeys: AesCbcThenHmacSubKeys = object()
		when(symmetricKeyDeriver.deriveSubKeysAesCbc(aes256Key, parsedCiphertext.cipherVersion)).thenReturn(subKeys)
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAesCbc(aes256Key, parsedCiphertext.cipherVersion), { times: 1 })
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAesCbc(aes256Key, parsedCiphertext.cipherVersion), { times: 1 })
	})

	o.test("AesCbc with session key missing", async function () {
		for (const cipherVersion of [SymmetricCipherVersion.UnusedReservedUnauthenticated, SymmetricCipherVersion.AesCbcThenHmac]) {
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, null, null, null)
			const ciphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, macTag)
			const e = await assertThrows(SessionKeyNotFoundError, async () => {
				await instanceDecryptor.getValueDecryptor(ciphertext, "")
			})
			o.check(e.message).equals("Missing session key")
		}
	})

	o.test("AeadWithInstanceKey from group key", async function () {
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, kdfNonce, ownerKeyProvider, null)
		const keyVersionLengthByte = 0
		const groupKeyVersion = 0
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(
			Uint8Array.of(SymmetricCipherVersion.AeadWithInstanceKey, keyVersionLengthByte, groupKeyVersion),
			initializationVector.bytes,
			ciphertext,
			macTag,
		)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		const plaintext = stringToUtf8Uint8Array("AeadWithInstanceKey plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		const versionedGroupKey: VersionedKey = { object: aes256Key, version: groupKeyVersion }
		const subKeys: AeadWithInstanceKeySubKeys = object()
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedGroupKey, kdfNonce, instanceTypeId)).thenReturn(subKeys)
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedGroupKey, kdfNonce, instanceTypeId), {
			times: 1,
		})
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey({ object: aes256Key, version: groupKeyVersion }, kdfNonce, instanceTypeId), {
			times: 1,
		})
	})

	o.test("AeadWithInstanceKey no ownerKeyProvider", async function () {
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, kdfNonce, null, null)
		const keyVersionLengthByte = 0
		const groupKeyVersion = 0
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(
			Uint8Array.of(SymmetricCipherVersion.AeadWithInstanceKey, keyVersionLengthByte, groupKeyVersion),
			initializationVector.bytes,
			ciphertext,
			macTag,
		)
		await assertThrows(CryptoError, async () => await instanceDecryptor.getValueDecryptor(versionedCiphertext, ""))
	})

	o.test("AeadWithInstanceKey from instance key", async function () {
		const groupKeyVersion = 0
		const instanceKey: VersionedAes256Key = { object: aes256RandomKey(), version: groupKeyVersion }
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, null, null, instanceKey)
		const keyVersionLengthByte = 0
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(
			Uint8Array.of(SymmetricCipherVersion.AeadWithInstanceKey, keyVersionLengthByte, groupKeyVersion),
			initializationVector.bytes,
			ciphertext,
			macTag,
		)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		const plaintext = stringToUtf8Uint8Array("AeadWithInstanceKey plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		const subKeys: AeadWithInstanceKeySubKeys = object()
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, instanceTypeId)).thenReturn(subKeys)
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, instanceTypeId), { times: 1 })
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, instanceTypeId), { times: 1 })
	})

	o.test("AeadWithSessionKey with session key present", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, aes256Key, null, null, null)
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		const plaintext = stringToUtf8Uint8Array("AeadWithSessionKey with session key present plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		const subKeys: AeadWithSessionKeySubKeys = object()
		when(symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(aes256Key, instanceTypeId)).thenReturn(subKeys)
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(aes256Key, instanceTypeId), { times: 1 })
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(aes256Key, instanceTypeId), { times: 1 })
	})

	o.test("AeadWithSessionKey with session key missing", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(instanceTypeId, null, null, null, null)
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const e = await assertThrows(SessionKeyNotFoundError, async () => {
			await instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		})
		o.check(e.message).equals("Missing session key")
	})
})
