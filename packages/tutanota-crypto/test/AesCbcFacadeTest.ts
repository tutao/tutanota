import o from "@tutao/otest"
import { AesCbcFacade } from "../lib/encryption/symmetric/AesCbcFacade.js"
import { SymmetricKeyDeriver } from "../lib/encryption/symmetric/SymmetricKeyDeriver.js"
import { aes256RandomKey, FIXED_IV } from "../lib/index.js"
import { _aes128RandomKey } from "./AesTest.js"
import { object, when } from "testdouble"
import { SymmetricCipherVersion } from "../lib/encryption/symmetric/SymmetricCipherVersion.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { BLOCK_SIZE_BYTES, SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES } from "../lib/encryption/symmetric/SymmetricCipherUtils.js"
import { CryptoError } from "../lib/misc/CryptoError.js"

o.spec("AesCbcFacadeTest", function () {
	let aesCbcFacade: AesCbcFacade
	let symmetricKeyDeriver: SymmetricKeyDeriver
	let aesKey_256
	let aesKey_128
	let iv = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
	let plainText = new Uint8Array([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
	let authentication256Key
	let encryption256Key
	let authentication128Key
	let encryption128Key

	o.before(function () {
		aesKey_256 = aes256RandomKey()
		aesKey_128 = _aes128RandomKey()
		encryption128Key = _aes128RandomKey()
		authentication128Key = _aes128RandomKey()
		encryption256Key = aes256RandomKey()
		authentication256Key = aes256RandomKey()
		symmetricKeyDeriver = object()
		when(symmetricKeyDeriver.deriveSubKeys(aesKey_128, SymmetricCipherVersion.UnusedReservedUnauthenticated)).thenReturn({
			encryptionKey: aesKey_128,
			authenticationKey: null,
		})
		when(symmetricKeyDeriver.deriveSubKeys(aesKey_256, SymmetricCipherVersion.UnusedReservedUnauthenticated)).thenReturn({
			encryptionKey: aesKey_256,
			authenticationKey: null,
		})
		when(symmetricKeyDeriver.deriveSubKeys(aesKey_128, SymmetricCipherVersion.AesCbcThenHmac)).thenReturn({
			encryptionKey: aesKey_128,
			authenticationKey: authentication128Key,
		})
		when(symmetricKeyDeriver.deriveSubKeys(aesKey_256, SymmetricCipherVersion.AesCbcThenHmac)).thenReturn({
			encryptionKey: aesKey_256,
			authenticationKey: authentication256Key,
		})

		aesCbcFacade = new AesCbcFacade(symmetricKeyDeriver)
	})
	o("unexpected cipher version", async function () {
		const cipherVersion = SymmetricCipherVersion.Aead
		when(symmetricKeyDeriver.deriveSubKeys(aesKey_256, cipherVersion)).thenReturn({
			encryptionKey: aesKey_256,
			authenticationKey: authentication256Key,
		})
		let e = await assertThrows(Error, async () => aesCbcFacade.encrypt(aesKey_256, plainText, true, iv, true, cipherVersion))
		o(e.message).equals("unexpected cipher version " + cipherVersion)

		e = await assertThrows(Error, async () => aesCbcFacade.decrypt(aesKey_256, plainText, true, true, cipherVersion))
		o(e.message).equals("unexpected cipher version " + cipherVersion)
	})
	o.spec("roundtrip 128", function () {
		o("unauthenticated no iv no padding success", function () {
			const hasRandomIv = false
			const hasPadding = false
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(aesKey_128, plainText, hasRandomIv, Uint8Array.from(FIXED_IV), hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(aesKey_128, ciphertext, hasRandomIv, hasPadding, cipherVersion)
			o(decrypted).deepEquals(plainText)
			const expectedLength = BLOCK_SIZE_BYTES // ciphertext
			o(ciphertext.length).equals(expectedLength)
		})
		o("with iv and padding success", function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(aesKey_128, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(aesKey_128, ciphertext, hasRandomIv, hasPadding, cipherVersion)
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
			const ciphertext = aesCbcFacade.encrypt(aesKey_128, plainText, hasRandomIv, Uint8Array.from(FIXED_IV), hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(aesKey_128, ciphertext, hasRandomIv, hasPadding, cipherVersion)
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
			const ciphertext = aesCbcFacade.encrypt(aesKey_128, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(aesKey_128, ciphertext, hasRandomIv, hasPadding, cipherVersion)
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
			const ciphertext = aesCbcFacade.encrypt(aesKey_128, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			ciphertext[ciphertext.length - 1]++
			const e = await assertThrows(CryptoError, async () => aesCbcFacade.decrypt(aesKey_128, ciphertext, hasRandomIv, hasPadding, cipherVersion))
			o(e.message).equals("invalid mac")
		})
	})
	o.spec("roundtrip 256", function () {
		o("authenticated with iv no padding success", function () {
			const hasRandomIv = true
			const hasPadding = false
			const cipherVersion = SymmetricCipherVersion.AesCbcThenHmac
			const ciphertext = aesCbcFacade.encrypt(aesKey_256, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(aesKey_256, ciphertext, hasRandomIv, hasPadding, cipherVersion)
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
			const ciphertext = aesCbcFacade.encrypt(aesKey_256, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			const decrypted = aesCbcFacade.decrypt(aesKey_256, ciphertext, hasRandomIv, hasPadding, cipherVersion)
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
			const ciphertext = aesCbcFacade.encrypt(aesKey_256, plainText, hasRandomIv, iv, hasPadding, cipherVersion)
			ciphertext[ciphertext.length - 1]++
			const e = await assertThrows(CryptoError, async () => aesCbcFacade.decrypt(aesKey_256, ciphertext, hasRandomIv, hasPadding, cipherVersion))
			o(e.message).equals("invalid mac")
		})
		o("authentication is enforced for 256 bit keys - error thrown", async function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			await assertThrows(CryptoError, async () => aesCbcFacade.encrypt(aesKey_256, plainText, hasRandomIv, iv, hasPadding, cipherVersion, false))
			const ciphertext = aesCbcFacade.encrypt(aesKey_256, plainText, hasRandomIv, iv, hasPadding, cipherVersion, true)
			await assertThrows(CryptoError, async () => aesCbcFacade.decrypt(aesKey_256, ciphertext, hasRandomIv, hasPadding, cipherVersion, false))
		})
		o("skip authentication no iv no padding success", function () {
			const hasRandomIv = false
			const hasPadding = false
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(aesKey_256, plainText, hasRandomIv, Uint8Array.from(FIXED_IV), hasPadding, cipherVersion, true)
			const decrypted = aesCbcFacade.decrypt(aesKey_256, ciphertext, hasRandomIv, hasPadding, cipherVersion, true)
			o(decrypted).deepEquals(plainText)
			const expectedLength = BLOCK_SIZE_BYTES
			o(ciphertext.length).equals(expectedLength)
		})
		o("skip authentication with iv and padding success", function () {
			const hasRandomIv = true
			const hasPadding = true
			const cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
			const ciphertext = aesCbcFacade.encrypt(aesKey_256, plainText, hasRandomIv, iv, hasPadding, cipherVersion, true)
			const decrypted = aesCbcFacade.decrypt(aesKey_256, ciphertext, hasRandomIv, hasPadding, cipherVersion, true)
			o(decrypted).deepEquals(plainText)
			const expectedLength =
				BLOCK_SIZE_BYTES + // ciphertext
				BLOCK_SIZE_BYTES + // padding
				BLOCK_SIZE_BYTES // IV
			o(ciphertext.length).equals(expectedLength)
		})
	})
})
