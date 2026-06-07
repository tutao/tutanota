import o, { assertThrows } from "@tutao/otest"
import {
	BLOCK_SIZE_BYTES,
	FIXED_INITIALIZATION_VECTOR,
	generateInitializationVector,
	INITIALIZATION_VECTOR_LENGTH_BYTES,
	SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES,
} from "@tutao/crypto/symmetric-cipher-utils"
import {
	InitializationVectorVariant,
	ParsedCiphertextAeadWithGroupKey,
	ParsedCiphertextAeadWithSessionKey,
	ParsedCiphertextAesCbcThenHmac,
	ParsedCiphertextUnusedReservedUnauthenticated,
	parseVersionedCiphertext,
} from "../../../src/platform-kit/crypto/encryption/symmetric/ParsedCiphertext"
import { concat, KeyVersion } from "../../../src/platform-kit/utils"
import { CryptoError } from "../../../src/platform-kit/crypto/error"
import { SymmetricCipherVersion } from "@tutao/crypto/symmetric-cipher-version"
import { MacTag, random } from "../../../src/platform-kit/crypto"

o.spec("ParsedCiphertextTest", () => {
	o.spec("happy path", () => {
		o.test("can parse UnusedReservedUnauthenticated with fixed initialization vector", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = random.generateRandomData(BLOCK_SIZE_BYTES)

			const versionedCiphertext = concat(Uint8Array.of(symmetricCipherVersion), ciphertext)
			const parsedCiphertext = parseVersionedCiphertext(
				versionedCiphertext,
				InitializationVectorVariant.Fixed,
			) as ParsedCiphertextUnusedReservedUnauthenticated
			o.check(parsedCiphertext.cipherVersion).equals(symmetricCipherVersion)
			o.check(parsedCiphertext.initializationVector).deepEquals(FIXED_INITIALIZATION_VECTOR)
			o.check(parsedCiphertext.ciphertext).deepEquals(ciphertext)
			const parsedCiphertextNoVersionByte = parseVersionedCiphertext(
				ciphertext,
				InitializationVectorVariant.Fixed,
			) as ParsedCiphertextUnusedReservedUnauthenticated
			o.check(parsedCiphertextNoVersionByte).deepEquals(parsedCiphertext)
		})

		o.test("can parse UnusedReservedUnauthenticated with random initialization vector", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const initializationVector = generateInitializationVector()
			const ciphertext = random.generateRandomData(BLOCK_SIZE_BYTES)

			const versionedCiphertext = concat(Uint8Array.of(symmetricCipherVersion), initializationVector.bytes, ciphertext)
			const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextUnusedReservedUnauthenticated
			o.check(parsedCiphertext.cipherVersion).equals(symmetricCipherVersion)
			o.check(parsedCiphertext.initializationVector).deepEquals(initializationVector)
			o.check(parsedCiphertext.ciphertext).deepEquals(ciphertext)
			const parsedCiphertextNoVersionByte = parseVersionedCiphertext(
				concat(initializationVector.bytes, ciphertext),
			) as ParsedCiphertextUnusedReservedUnauthenticated
			o.check(parsedCiphertextNoVersionByte).deepEquals(parsedCiphertext)
		})

		o.test("can parse AesCbcThenHmac with fixed initialization vector", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = random.generateRandomData(BLOCK_SIZE_BYTES)
			const macTag = random.generateRandomData(SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES) as MacTag

			const versionedCiphertext = concat(Uint8Array.of(symmetricCipherVersion), ciphertext, macTag)
			const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext, InitializationVectorVariant.Fixed) as ParsedCiphertextAesCbcThenHmac
			o.check(parsedCiphertext.cipherVersion).equals(symmetricCipherVersion)
			o.check(parsedCiphertext.initializationVector).deepEquals(FIXED_INITIALIZATION_VECTOR)
			o.check(parsedCiphertext.ciphertext).deepEquals(ciphertext)
			o.check(parsedCiphertext.macTag).deepEquals(macTag)
		})

		o.test("can parse AesCbcThenHmac with random initialization vector", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const initializationVector = generateInitializationVector()
			const ciphertext = random.generateRandomData(BLOCK_SIZE_BYTES)
			const macTag = random.generateRandomData(SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES) as MacTag

			const versionedCiphertext = concat(Uint8Array.of(symmetricCipherVersion), initializationVector.bytes, ciphertext, macTag)
			const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAesCbcThenHmac
			o.check(parsedCiphertext.cipherVersion).equals(symmetricCipherVersion)
			o.check(parsedCiphertext.initializationVector).deepEquals(initializationVector)
			o.check(parsedCiphertext.ciphertext).deepEquals(ciphertext)
			o.check(parsedCiphertext.macTag).deepEquals(macTag)
		})

		o.test("can parse AEAD with session key", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.AeadWithSessionKey
			const initializationVector = generateInitializationVector()
			const ciphertext = Uint8Array.of(0, 1, 2, 3)
			const macTag = random.generateRandomData(SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES) as MacTag

			const versionedCiphertext = concat(Uint8Array.of(symmetricCipherVersion), initializationVector.bytes, ciphertext, macTag)
			const e = await assertThrows(CryptoError, async () => parseVersionedCiphertext(versionedCiphertext, InitializationVectorVariant.Fixed))
			o.check(e.message).equals("AEAD requires a random initialization vector")
			const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAeadWithSessionKey
			o.check(parsedCiphertext.cipherVersion).equals(symmetricCipherVersion)
			o.check(parsedCiphertext.initializationVector).deepEquals(initializationVector)
			o.check(parsedCiphertext.ciphertext).deepEquals(ciphertext)
			o.check(parsedCiphertext.macTag).deepEquals(macTag)
		})

		o.test("can parse AEAD with group key", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.AeadWithGroupKey
			const groupKeyVersionLength = 0
			const groupKeyVersion: KeyVersion = 42
			const initializationVector = generateInitializationVector()
			const ciphertext = Uint8Array.of(0, 1, 2, 3)
			const macTag = random.generateRandomData(SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES) as MacTag

			const versionedCiphertext = concat(
				Uint8Array.of(symmetricCipherVersion, groupKeyVersionLength, groupKeyVersion),
				initializationVector.bytes,
				ciphertext,
				macTag,
			)
			const e = await assertThrows(CryptoError, async () => parseVersionedCiphertext(versionedCiphertext, InitializationVectorVariant.Fixed))
			o.check(e.message).equals("AEAD requires a random initialization vector")
			const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAeadWithGroupKey
			o.check(parsedCiphertext.cipherVersion).equals(symmetricCipherVersion)
			o.check(parsedCiphertext.groupKeyVersion).equals(groupKeyVersion)
			o.check(parsedCiphertext.initializationVector).deepEquals(initializationVector)
			o.check(parsedCiphertext.ciphertext).deepEquals(ciphertext)
			o.check(parsedCiphertext.macTag).deepEquals(macTag)
		})
	})
	o.spec("errors", () => {
		o.test("ensures there are enough bytes for the initialization vector", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			// subtract an even number of bytes in order to keep the parity
			const initializationVector = random.generateRandomData(INITIALIZATION_VECTOR_LENGTH_BYTES - 2)
			// empty ciphertext
			const versionedCiphertext = concat(Uint8Array.of(symmetricCipherVersion), initializationVector)
			const e = await assertThrows(CryptoError, async () => parseVersionedCiphertext(versionedCiphertext))
			o.check(e.message).equals("aes decryption failed> initialization vector must be 128 bits")
		})

		o.test("ensures there are enough bytes for the authentication tag", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			// subtract an even number of bytes in order to keep the parity
			const macTag = random.generateRandomData(SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES - 2)
			// empty initialization vector and ciphertext
			const versionedCiphertext = concat(Uint8Array.of(symmetricCipherVersion), macTag)
			const e = await assertThrows(CryptoError, async () => parseVersionedCiphertext(versionedCiphertext))
			o.check(e.message).equals("aes decryption failed> message authentication code must be 256 bits")
		})

		o.test("ensures there are enough bytes for the group key version", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.AeadWithGroupKey
			// empty initialization vector, ciphertext and mac tag
			const versionedCiphertext = Uint8Array.of(symmetricCipherVersion)
			const e = await assertThrows(CryptoError, async () => parseVersionedCiphertext(versionedCiphertext))
			o.check(e.message).equals("aes decryption failed> group key version (including length) must be 16 bits")
		})

		o.test("only supports 0-byte for key version length", async () => {
			const symmetricCipherVersion = SymmetricCipherVersion.AeadWithGroupKey
			const groupKeyVersionLength = 1
			const groupKeyVersion = 42
			// empty initialization vector, ciphertext and mac tag
			const versionedCiphertext = Uint8Array.of(symmetricCipherVersion, groupKeyVersionLength, groupKeyVersion)
			const e = await assertThrows(CryptoError, async () => parseVersionedCiphertext(versionedCiphertext))
			o.check(e.message).equals("aes decryption failed> currently only one byte is supported for group key versions")
		})
	})
})
