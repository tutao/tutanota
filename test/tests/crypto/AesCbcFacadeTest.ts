import o, { assertThrows } from "@tutao/otest"
import { AesCbcFacade, AuthenticationEnforcement, PaddingStandard } from "@tutao/crypto/aes-cbc-facade"
import { AesCbcThenHmacSubKeys, SymmetricSubKeys, UnusedReservedUnauthenticatedSubKeys } from "@tutao/crypto/symmetric-key-deriver"
import { Aes128Key, Aes256Key, aes256RandomKey, INITIALIZATION_VECTOR_LENGTH_BYTES, validateInitializationVectorLength } from "../../../src/platform-kit/crypto"
import { _aes128RandomKey } from "./AesTest.js"
import { SymmetricCipherVersion } from "@tutao/crypto/symmetric-cipher-version"
import {
	InitializationVectorVariant,
	ParsedCiphertextAesCbc,
	parseVersionedCiphertext,
} from "../../../src/platform-kit/crypto/encryption/symmetric/ParsedCiphertext"
import { BLOCK_SIZE_BYTES, SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES } from "@tutao/crypto/symmetric-cipher-utils"
import { CryptoError } from "../../../src/platform-kit/crypto/error"

// This does not account for padding or the initialization vector, but only the version byte and the authentication tag.
const SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES = SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES

o.spec("AesCbcFacadeTest", function () {
	let aesCbcFacade: AesCbcFacade
	let initializationVector = validateInitializationVectorLength(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]))
	let plainText = new Uint8Array([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
	let authentication256Key: Aes256Key
	let encryption256Key: Aes256Key
	let authentication128Key: Aes128Key
	let encryption128Key: Aes128Key
	let symmetricSubKeys128WithoutAuthenticationKey: UnusedReservedUnauthenticatedSubKeys
	let symmetricSubKeys256WithoutAuthenticationKey: UnusedReservedUnauthenticatedSubKeys
	let symmetricSubKeys128WithAuthenticationKey: AesCbcThenHmacSubKeys
	let symmetricSubKeys256WithAuthenticationKey: AesCbcThenHmacSubKeys

	o.beforeEach(function () {
		encryption128Key = _aes128RandomKey()
		authentication128Key = _aes128RandomKey()
		encryption256Key = aes256RandomKey()
		authentication256Key = aes256RandomKey()
		symmetricSubKeys128WithoutAuthenticationKey = new UnusedReservedUnauthenticatedSubKeys(encryption128Key)
		symmetricSubKeys256WithoutAuthenticationKey = new UnusedReservedUnauthenticatedSubKeys(encryption256Key)
		symmetricSubKeys128WithAuthenticationKey = new AesCbcThenHmacSubKeys(encryption128Key, authentication128Key)
		symmetricSubKeys256WithAuthenticationKey = new AesCbcThenHmacSubKeys(encryption256Key, authentication256Key)
		aesCbcFacade = new AesCbcFacade()
	})
	o.spec("roundtrip 128", function () {
		o("unauthenticated no initialization vector no padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Fixed
			const paddingStandard = PaddingStandard.None
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys128WithoutAuthenticationKey,
				plainText,
				initializationVectorVariant,
				paddingStandard,
				cipherVersion,
			)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithoutAuthenticationKey, parsedCiphertext, paddingStandard)
			o(decrypted).deepEquals(plainText)
			o(ciphertext.length).equals(BLOCK_SIZE_BYTES)
		})
		o("with initialization vector and padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys128WithoutAuthenticationKey,
				plainText,
				initializationVector,
				paddingStandard,
				cipherVersion,
			)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithoutAuthenticationKey, parsedCiphertext, paddingStandard)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				INITIALIZATION_VECTOR_LENGTH_BYTES // initialization vector
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated no initialization vector no padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Fixed
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys128WithAuthenticationKey,
				plainText,
				initializationVectorVariant,
				paddingStandard,
				cipherVersion,
			)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithAuthenticationKey, parsedCiphertext, paddingStandard)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				INITIALIZATION_VECTOR_LENGTH_BYTES // initialization vector
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated with initialization vector and padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys128WithAuthenticationKey, plainText, initializationVector, paddingStandard, cipherVersion)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithAuthenticationKey, parsedCiphertext, paddingStandard)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				INITIALIZATION_VECTOR_LENGTH_BYTES // initialization vector
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated invalid mac", async function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys128WithAuthenticationKey, plainText, initializationVector, paddingStandard, cipherVersion)
			ciphertext[ciphertext.length - 1]++
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const e = await assertThrows(CryptoError, async () =>
				aesCbcFacade.decrypt(symmetricSubKeys128WithAuthenticationKey, parsedCiphertext, paddingStandard),
			)
			o(e.message).equals("invalid mac")
		})
	})
	o.spec("roundtrip 256", function () {
		o("authenticated with initialization vector no padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.None
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithAuthenticationKey, plainText, initializationVector, paddingStandard, cipherVersion)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys256WithAuthenticationKey, parsedCiphertext, paddingStandard)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				INITIALIZATION_VECTOR_LENGTH_BYTES // initialization vector
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated with initialization vector and padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithAuthenticationKey, plainText, initializationVector, paddingStandard, cipherVersion)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys256WithAuthenticationKey, parsedCiphertext, paddingStandard)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				INITIALIZATION_VECTOR_LENGTH_BYTES // initialization vector
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated invalid mac", async function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithAuthenticationKey, plainText, initializationVector, paddingStandard, cipherVersion)
			ciphertext[ciphertext.length - 1]++
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const e = await assertThrows(CryptoError, async () =>
				aesCbcFacade.decrypt(symmetricSubKeys256WithAuthenticationKey, parsedCiphertext, paddingStandard),
			)
			o(e.message).equals("invalid mac")
		})
		o("authentication is enforced for 256 bit keys - error thrown", async function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			await assertThrows(CryptoError, async () =>
				aesCbcFacade.encrypt(
					symmetricSubKeys256WithoutAuthenticationKey,
					plainText,
					initializationVector,
					paddingStandard,
					cipherVersion,
					AuthenticationEnforcement.Strict,
				),
			)
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys256WithoutAuthenticationKey,
				plainText,
				initializationVector,
				paddingStandard,
				cipherVersion,
				AuthenticationEnforcement.Relaxed,
			)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			await assertThrows(CryptoError, async () => aesCbcFacade.decrypt(symmetricSubKeys256WithoutAuthenticationKey, parsedCiphertext, paddingStandard))
		})
		o("skip authentication no initialization vector no padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Fixed
			const paddingStandard = PaddingStandard.None
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys256WithoutAuthenticationKey,
				plainText,
				initializationVectorVariant,
				paddingStandard,
				cipherVersion,
				AuthenticationEnforcement.Relaxed,
			)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(
				symmetricSubKeys256WithoutAuthenticationKey,
				parsedCiphertext,
				paddingStandard,
				AuthenticationEnforcement.Relaxed,
			)
			o(decrypted).deepEquals(plainText)
			o(ciphertext.length).equals(BLOCK_SIZE_BYTES)
		})
		o("skip authentication with initialization vector and padding success", function () {
			const initializationVectorVariant = InitializationVectorVariant.Random
			const paddingStandard = PaddingStandard.Pkcs5
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys256WithoutAuthenticationKey,
				plainText,
				initializationVector,
				paddingStandard,
				cipherVersion,
				AuthenticationEnforcement.Relaxed,
			)
			const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant) as ParsedCiphertextAesCbc
			const decrypted = aesCbcFacade.decrypt(
				symmetricSubKeys256WithoutAuthenticationKey,
				parsedCiphertext,
				paddingStandard,
				AuthenticationEnforcement.Relaxed,
			)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				INITIALIZATION_VECTOR_LENGTH_BYTES // initialization vector
			o(ciphertext.length).equals(expectedLength)
		})
	})
})
