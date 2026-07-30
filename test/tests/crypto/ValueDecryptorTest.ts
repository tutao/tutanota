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
import { AeadWithInstanceKeySubKeys, AeadWithSessionKeySubKeys, AesCbcThenHmacSubKeys, SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"
import { SymmetricCipherFacade } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { AssociatedData, KeyDerivationContext, MacTag, OwnerKeyProvider, VersionedAes256Key, VersionedKey } from "../../../src/platform-kit/crypto"
import { AppName, AppNameEnum } from "../../../src/platform-kit/meta"
import { concat, stringToUtf8Uint8Array } from "../../../src/platform-kit/utils"
import { CryptoError, SessionKeyNotFoundError } from "../../../src/platform-kit/crypto/error"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { Aes256Key } from "../../../src/platform-kit/crypto/encryption/symmetric/AesKey"
import { ValueAssociatedData } from "../../../src/platform-kit/instance-pipeline/ValueAssociatedData"
import { ValuePath } from "../../../src/platform-kit/instance-pipeline/EncryptionContextPath"
import { makeKeyDerivationContext } from "../../../src/platform-kit/instance-pipeline/InstanceTypeContext"

o.spec("ValueDecryptorTest", function () {
	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aeadFacade: AeadFacade
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let aes256Key: Aes256Key
	let macTag: MacTag
	let initializationVector: InitializationVector
	let app: AppName
	let keyDerivationContext: KeyDerivationContext
	let emptyAssociatedData: AssociatedData
	let ownerKeyProvider: OwnerKeyProvider

	o.beforeEach(function () {
		aesCbcFacade = object()
		aeadFacade = object()
		symmetricKeyDeriver = object()
		symmetricCipherFacade = new SymmetricCipherFacade(aesCbcFacade, aeadFacade, symmetricKeyDeriver)
		aes256Key = aes256RandomKey()
		macTag = new Uint8Array(32) as MacTag
		initializationVector = validateInitializationVectorLength(new Uint8Array(16))
		app = AppNameEnum.Tutanota
		keyDerivationContext = makeKeyDerivationContext({
			app,
			id: 0,
			name: "name",
		})
		emptyAssociatedData = new ValueAssociatedData(ValuePath.fromPatchPath(app, ""))
		ownerKeyProvider = async () => aes256Key
	})

	o.test("UnusedReservedUnauthenticated, unauthenticated with session key present", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, aes256Key, null, null, null)
		const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(initializationVector, new Uint8Array([1, 2]))
		const ciphertext = concat(symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion), initializationVector.bytes, parsedCiphertext.ciphertext)
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(ciphertext, emptyAssociatedData)
		valueDecryptor.getValue()
		const plaintext = stringToUtf8Uint8Array("AesCbc with session key present plaintext")

		when(aesCbcFacade.decrypt(matchers.anything(), parsedCiphertext, PaddingStandard.Pkcs5)).thenReturn(plaintext)
		o.check(valueDecryptor.getValue()).equals(plaintext)
	})

	o.test("AesCbcThenHmac, with session key present", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, aes256Key, null, null, null)
		const ciphertextRaw = new Uint8Array([1, 2])
		const parsedCiphertext = new ParsedCiphertextAesCbcThenHmac(initializationVector, ciphertextRaw, macTag)

		const ciphertext = concat(
			symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
			initializationVector.bytes,
			parsedCiphertext.ciphertext,
			macTag,
		)
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(ciphertext, emptyAssociatedData)
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
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, null, null, null, null)
			const ciphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, macTag)
			const e = await assertThrows(SessionKeyNotFoundError, async () => {
				await instanceDecryptor.getValueDecryptor(ciphertext, emptyAssociatedData)
			})
			o.check(e.message).equals("Missing session key")
		}
	})

	o.test("AeadWithInstanceKey from group key", async function () {
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, null, kdfNonce, ownerKeyProvider, null)
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
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, emptyAssociatedData)
		const plaintext = stringToUtf8Uint8Array("AeadWithInstanceKey plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		const versionedGroupKey: VersionedKey = { object: aes256Key, version: groupKeyVersion }
		const subKeys: AeadWithInstanceKeySubKeys = object()
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedGroupKey, kdfNonce, keyDerivationContext)).thenReturn(subKeys)
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey(versionedGroupKey, kdfNonce, keyDerivationContext), {
			times: 1,
		})
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(
			symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromGroupKey({ object: aes256Key, version: groupKeyVersion }, kdfNonce, keyDerivationContext),
			{
				times: 1,
			},
		)
	})

	o.test("AeadWithInstanceKey no ownerKeyProvider", async function () {
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, null, kdfNonce, null, null)
		const keyVersionLengthByte = 0
		const groupKeyVersion = 0
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(
			Uint8Array.of(SymmetricCipherVersion.AeadWithInstanceKey, keyVersionLengthByte, groupKeyVersion),
			initializationVector.bytes,
			ciphertext,
			macTag,
		)
		await assertThrows(CryptoError, async () => await instanceDecryptor.getValueDecryptor(versionedCiphertext, emptyAssociatedData))
	})

	o.test("AeadWithInstanceKey from instance key", async function () {
		const groupKeyVersion = 0
		const instanceKey: VersionedAes256Key = { object: aes256RandomKey(), version: groupKeyVersion }
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, null, null, null, instanceKey)
		const keyVersionLengthByte = 0
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(
			Uint8Array.of(SymmetricCipherVersion.AeadWithInstanceKey, keyVersionLengthByte, groupKeyVersion),
			initializationVector.bytes,
			ciphertext,
			macTag,
		)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, emptyAssociatedData)
		const plaintext = stringToUtf8Uint8Array("AeadWithInstanceKey plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		const subKeys: AeadWithInstanceKeySubKeys = object()
		when(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, keyDerivationContext)).thenReturn(subKeys)
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, keyDerivationContext), { times: 1 })
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, keyDerivationContext), { times: 1 })
	})

	o.test("AeadWithSessionKey with session key present", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, aes256Key, null, null, null)
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const valueDecryptor = await instanceDecryptor.getValueDecryptor(versionedCiphertext, emptyAssociatedData)
		const plaintext = stringToUtf8Uint8Array("AeadWithSessionKey with session key present plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		const subKeys: AeadWithSessionKeySubKeys = object()
		when(symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(aes256Key, keyDerivationContext)).thenReturn(subKeys)
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(aes256Key, keyDerivationContext), { times: 1 })
		o.check(valueDecryptor.getValue()).equals(plaintext)
		verify(symmetricKeyDeriver.deriveSubKeysAeadWithSessionKey(aes256Key, keyDerivationContext), { times: 1 })
	})

	o.test("AeadWithSessionKey with session key missing", async function () {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(keyDerivationContext, null, null, null, null)
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const e = await assertThrows(SessionKeyNotFoundError, async () => {
			await instanceDecryptor.getValueDecryptor(versionedCiphertext, emptyAssociatedData)
		})
		o.check(e.message).equals("Missing session key")
	})
})
