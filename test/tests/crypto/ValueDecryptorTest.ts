import {
	InitializationVectorVariant,
	ParsedCiphertextAead,
	ParsedCiphertextAesCbc,
	ParsedCiphertextAesCbcThenHmac,
	ParsedCiphertextUnusedReservedUnauthenticated,
	parseVersionedCiphertext,
} from "../../../src/platform-kit/crypto/encryption/symmetric/ParsedCiphertext"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "@tutao/crypto/symmetric-cipher-version"
import { AesCbcFacade, PaddingStandard } from "@tutao/crypto/aes-cbc-facade"
import { matchers, object, when } from "testdouble"
import {
	Aes256Key,
	aes256RandomKey,
	InitializationVector,
	KDF_NONCE_LENGTH_BYTES,
	validateInitializationVectorLength,
	validateKdfNonceLength,
} from "@tutao/crypto/symmetric-cipher-utils"
import o, { assertThrows } from "@tutao/otest"
import { InstanceTypeId, SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"
import { SymmetricCipherFacade } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { MacTag } from "../../../src/platform-kit/crypto"
import { AppNameEnum } from "../../../src/platform-kit/meta"
import { concat, stringToUtf8Uint8Array } from "../../../src/platform-kit/utils"
import { ValueDecryptor } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/decryption/ValueDecryptor"
import { CryptoError, SessionKeyNotFoundError } from "../../../src/platform-kit/crypto/error"
import { AeadFacade } from "@tutao/crypto/aead-facade"

o.spec("ValueDecryptorTest", () => {
	let symmetricCipherFacade: SymmetricCipherFacade
	let aesCbcFacade: AesCbcFacade
	let aeadFacade: AeadFacade
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let aes256Key: Aes256Key
	let macTag: MacTag
	let initializationVector: InitializationVector
	let instanceTypeId: InstanceTypeId

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
	})

	o.test("UnusedReservedUnauthenticated, unauthenticated with session key present", () => {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(aes256Key, null, instanceTypeId)
		const parsedCiphertext = new ParsedCiphertextUnusedReservedUnauthenticated(
			initializationVector,
			new Uint8Array([1, 2]),
			InitializationVectorVariant.Random,
		)
		const ciphertext = concat(symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion), initializationVector.bytes, parsedCiphertext.ciphertext)
		const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
		o.check(valueDecryptor.requiredGroupKeyVersion).equals("none")
		valueDecryptor.getValue(null)
		const plaintext = stringToUtf8Uint8Array("AesCbc with session key present plaintext")

		when(aesCbcFacade.decrypt(matchers.anything(), parsedCiphertext, PaddingStandard.Pkcs5)).thenReturn(plaintext)
		o.check(valueDecryptor.getValue(aes256Key)).equals(plaintext)
	})

	o.test("AesCbcThenHmac, with session key present", () => {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(aes256Key, null, instanceTypeId)
		const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
		const ciphertextRaw = new Uint8Array([1, 2])
		const initializationVectorVariant = InitializationVectorVariant.Random
		const parsedCiphertext = new ParsedCiphertextAesCbcThenHmac(initializationVector, ciphertextRaw, macTag, initializationVectorVariant)

		const ciphertext = concat(
			symmetricCipherVersionToUint8Array(parsedCiphertext.cipherVersion),
			initializationVector.bytes,
			parsedCiphertext.ciphertext,
			macTag,
		)
		const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, "") as ValueDecryptor
		o.check(valueDecryptor.requiredGroupKeyVersion).equals("none")
		valueDecryptor.getValue(null)
		const plaintext = stringToUtf8Uint8Array("AesCbc with session key present plaintext")

		when(aesCbcFacade.decrypt(matchers.anything(), parsedCiphertext, PaddingStandard.Pkcs5)).thenReturn(plaintext)
		o.check(valueDecryptor.getValue(aes256Key)).equals(plaintext)
	})

	o.test("AesCbc with session key missing", async () => {
		for (const cipherVersion of [SymmetricCipherVersion.UnusedReservedUnauthenticated, SymmetricCipherVersion.AesCbcThenHmac]) {
			const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, null, instanceTypeId)
			const ciphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, macTag)
			const e = await assertThrows(SessionKeyNotFoundError, async () => {
				instanceDecryptor.getValueDecryptor(ciphertext, "")
			})
			o.check(e.message).equals("Missing session key")
		}
	})

	o.test("AeadWithGroupKey", async () => {
		const kdfNonce = validateKdfNonceLength(new Uint8Array(KDF_NONCE_LENGTH_BYTES))
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, kdfNonce, instanceTypeId)
		const keyVersionLengthByte = 0
		const groupKeyVersion = 0
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(
			Uint8Array.of(SymmetricCipherVersion.AeadWithGroupKey, keyVersionLengthByte, groupKeyVersion),
			initializationVector.bytes,
			ciphertext,
			macTag,
		)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const valueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, "") as ValueDecryptor
		o.check(valueDecryptor.requiredGroupKeyVersion).equals(groupKeyVersion)
		await assertThrows(CryptoError, async () => valueDecryptor.getValue(null))
		const plaintext = stringToUtf8Uint8Array("AeadWithGroupKey plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		o.check(valueDecryptor.getValue(aes256Key)).equals(plaintext)
	})

	o.test("AeadWithSessionKey with session key present", () => {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(aes256Key, null, instanceTypeId)
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const valueDecryptor = instanceDecryptor.getValueDecryptor(versionedCiphertext, "") as ValueDecryptor
		o.check(valueDecryptor.requiredGroupKeyVersion).equals("none")
		const plaintext = stringToUtf8Uint8Array("AeadWithSessionKey with session key present plaintext")
		when(aeadFacade.decrypt(matchers.anything(), parsedCiphertext, matchers.anything())).thenReturn(plaintext)
		o.check(valueDecryptor.getValue(null)).equals(plaintext)
	})

	o.test("AeadWithSessionKey with session key missing", async () => {
		const instanceDecryptor = symmetricCipherFacade.getInstanceDecryptor(null, null, instanceTypeId)
		const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
		const ciphertext = new Uint8Array()
		const versionedCiphertext = concat(Uint8Array.of(cipherVersion), initializationVector.bytes, ciphertext, macTag)
		const e = await assertThrows(SessionKeyNotFoundError, async () => {
			instanceDecryptor.getValueDecryptor(versionedCiphertext, "")
		})
		o.check(e.message).equals("Missing session key")
	})
})
