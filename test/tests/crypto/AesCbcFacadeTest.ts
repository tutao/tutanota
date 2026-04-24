import o, { assertThrows } from "@tutao/otest"
import { AesCbcFacade } from "@tutao/crypto/aes-cbc-facade"
import { SymmetricSubKeys } from "@tutao/crypto/symmetric-key-deriver"
import { Aes128Key, Aes256Key, aes256RandomKey, FIXED_IV } from "@tutao/crypto"
import { _aes128RandomKey } from "./AesTest.js"
import { SymmetricCipherVersion } from "@tutao/crypto/symmetric-cipher-version"
import { BLOCK_SIZE_BYTES, SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES } from "@tutao/crypto/symmetric-cipher-utils"
import { CryptoError } from "@tutao/crypto/error"

o.spec("AesCbcFacadeTest", function () {
	let aesCbcFacade: AesCbcFacade
	let iv = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
	let plainText = new Uint8Array([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
	let authentication256Key: Aes256Key
	let encryption256Key: Aes256Key
	let authentication128Key: Aes128Key
	let encryption128Key: Aes128Key
	let symmetricSubKeys128WithoutAuthenticationKey: SymmetricSubKeys
	let symmetricSubKeys256WithoutAuthenticationKey: SymmetricSubKeys
	let symmetricSubKeys128WithAuthenticationKey: SymmetricSubKeys
	let symmetricSubKeys256WithAuthenticationKey: SymmetricSubKeys

	o.beforeEach(function () {
		encryption128Key = _aes128RandomKey()
		authentication128Key = _aes128RandomKey()
		encryption256Key = aes256RandomKey()
		authentication256Key = aes256RandomKey()
		symmetricSubKeys128WithoutAuthenticationKey = {
			encryptionKey: encryption128Key,
			authenticationKey: null,
		}
		symmetricSubKeys256WithoutAuthenticationKey = {
			encryptionKey: encryption256Key,
			authenticationKey: null,
		}
		symmetricSubKeys128WithAuthenticationKey = {
			encryptionKey: encryption128Key,
			authenticationKey: authentication128Key,
		}
		symmetricSubKeys256WithAuthenticationKey = {
			encryptionKey: encryption256Key,
			authenticationKey: authentication256Key,
		}

		aesCbcFacade = new AesCbcFacade()
	})
	o("unexpected cipher version", async function () {
		const cipherVersion = SymmetricCipherVersion.AeadWithGroupKey
		let e = await assertThrows(Error, async () => aesCbcFacade.encrypt(symmetricSubKeys256WithAuthenticationKey, plainText, true, iv, true, cipherVersion))
		o(e.message).equals("unexpected cipher version " + cipherVersion)

		e = await assertThrows(Error, async () => aesCbcFacade.decrypt(symmetricSubKeys256WithAuthenticationKey, plainText, true, true, cipherVersion))
		o(e.message).equals("unexpected cipher version " + cipherVersion)
	})
	o.spec("roundtrip 128", function () {
		o("unauthenticated no iv no padding success", function () {
			const hasRandomIv = false
			const hasPadding = false
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys128WithoutAuthenticationKey,
				plainText,
				hasRandomIv,
				Uint8Array.from(FIXED_IV),
				hasPadding,
				cipherVersion,
			)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithoutAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion)
			o(decrypted).deepEquals(plainText)
			o(ciphertext.length).equals(BLOCK_SIZE_BYTES)
		})
		o("with iv and padding success", function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys128WithoutAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithoutAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				BLOCK_SIZE_BYTES // IV
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated no iv no padding success", function () {
			const hasRandomIv = false
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys128WithAuthenticationKey,
				plainText,
				hasRandomIv,
				Uint8Array.from(FIXED_IV),
				hasPadding,
				cipherVersion,
			)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES // IV
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated with iv and padding success", function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys128WithAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys128WithAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				BLOCK_SIZE_BYTES // IV
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated invalid mac", async function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys128WithAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			ciphertext[ciphertext.length - 1]++
			const e = await assertThrows(CryptoError, async () =>
				aesCbcFacade.decrypt(symmetricSubKeys128WithAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion),
			)
			o(e.message).equals("invalid mac")
		})
	})
	o.spec("roundtrip 256", function () {
		o("authenticated with iv no padding success", function () {
			const hasRandomIv = true
			const hasPadding = false
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys256WithAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES // IV
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated with iv and padding success", function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys256WithAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES +
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				BLOCK_SIZE_BYTES // IV
			o(ciphertext.length).equals(expectedLength)
		})
		o("authenticated invalid mac", async function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			ciphertext[ciphertext.length - 1]++
			const e = await assertThrows(CryptoError, async () =>
				aesCbcFacade.decrypt(symmetricSubKeys256WithAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion),
			)
			o(e.message).equals("invalid mac")
		})
		o("authentication is enforced for 256 bit keys - error thrown", async function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			await assertThrows(CryptoError, async () =>
				aesCbcFacade.encrypt(symmetricSubKeys256WithoutAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion, false),
			)
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithoutAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion, true)
			await assertThrows(CryptoError, async () =>
				aesCbcFacade.decrypt(symmetricSubKeys256WithoutAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion, false),
			)
		})
		o("skip authentication no iv no padding success", function () {
			const hasRandomIv = false
			const hasPadding = false
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(
				symmetricSubKeys256WithoutAuthenticationKey,
				plainText,
				hasRandomIv,
				Uint8Array.from(FIXED_IV),
				hasPadding,
				cipherVersion,
				true,
			)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys256WithoutAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion, true)
			o(decrypted).deepEquals(plainText)
			o(ciphertext.length).equals(BLOCK_SIZE_BYTES)
		})
		o("skip authentication with iv and padding success", function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(symmetricSubKeys256WithoutAuthenticationKey, plainText, hasRandomIv, iv, hasPadding, cipherVersion, true)
			const decrypted = aesCbcFacade.decrypt(symmetricSubKeys256WithoutAuthenticationKey, ciphertext, hasRandomIv, hasPadding, cipherVersion, true)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				BLOCK_SIZE_BYTES // IV
			o(ciphertext.length).equals(expectedLength)
		})
	})
})
