import o, { assertThrows } from "@tutao/otest"
import { AeadWithSessionKeySubKeys, PADDING_BYTE, SymmetricCipherVersion } from "../../../src/platform-kit/crypto"
import { AeadSubKeys } from "@tutao/crypto/symmetric-key-deriver"
import { aes256RandomKey, INITIALIZATION_VECTOR_LENGTH_BYTES, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES } from "@tutao/crypto/symmetric-cipher-utils"
import { CryptoError } from "../../../src/platform-kit/crypto/error"
import { concat } from "../../../src/platform-kit/utils"
import { DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES } from "@tutao/crypto/blake3"
import { ParsedCiphertextAead, parseVersionedCiphertext } from "../../../src/platform-kit/crypto/encryption/symmetric/ParsedCiphertext"
import { AeadFacade } from "@tutao/crypto/aead-facade"

o.spec("AeadFacadeTest", function () {
	let aeadFacade: AeadFacade
	let keys: AeadSubKeys
	const associatedData = Uint8Array.from([9, 8, 7, 6])
	const plaintext = Uint8Array.from([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
	const cipherVersion = SymmetricCipherVersion.AeadWithSessionKey
	o.beforeEach(function () {
		aeadFacade = new AeadFacade()
		const encryptionKey = aes256RandomKey()
		const authenticationKey = aes256RandomKey()
		keys = new AeadWithSessionKeySubKeys(encryptionKey, authenticationKey)
	})
	o("encrypt roundtrip success", function () {
		const versionedCiphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const decrypted = aeadFacade.decrypt(keys, parsedCiphertext, associatedData)
		o(plaintext).deepEquals(decrypted)
	})

	o("decrypt_canonicalization_safe", async function () {
		// we make sure that data is treated differently depending on whether it is part of the associated data or the ciphertext. this ensures a canonical form.
		const versionedCiphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		const wrongVersionedCiphertext = versionedCiphertext.subarray(0, versionedCiphertext.length - 4)
		const wrongAssociatedData = concat(versionedCiphertext.subarray(versionedCiphertext.length - 4), associatedData)
		o(concat(versionedCiphertext, associatedData)).deepEquals(concat(wrongVersionedCiphertext, wrongAssociatedData))
		const parsedWrongCiphertext = parseVersionedCiphertext(wrongVersionedCiphertext) as ParsedCiphertextAead
		const e = await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, parsedWrongCiphertext, wrongAssociatedData))
		o(e.message).equals("invalid mac")
	})

	o("encrypt_empty_associated_data", async function () {
		const emptyAd = new Uint8Array()
		const versionedCiphertext = aeadFacade.encrypt(keys, plaintext, emptyAd)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const decrypted = aeadFacade.decrypt(keys, parsedCiphertext, emptyAd)
		o(plaintext).deepEquals(decrypted)
	})

	o("encrypt_empty_plaintext", async function () {
		const emptyPlaintext = new Uint8Array()
		const versionedCiphertext = aeadFacade.encrypt(keys, emptyPlaintext, associatedData)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const decrypted = aeadFacade.decrypt(keys, parsedCiphertext, associatedData)
		o(emptyPlaintext).deepEquals(decrypted)
	})

	o("decrypt_with_invalid_associated_data", async function () {
		const wrongAd = Uint8Array.from([2, 3, 4])
		const versionedCiphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const e = await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, parsedCiphertext, wrongAd))
		o(e.message).equals("invalid mac")
	})

	o("decrypt_wrong_mac", async function () {
		const versionedCiphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		versionedCiphertext[versionedCiphertext.length - 1]++
		const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
		const e = await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, parsedCiphertext, associatedData))
		o(e.message).equals("invalid mac")
	})

	o("encrypt_adds_padding", async function () {
		const overhead = SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + INITIALIZATION_VECTOR_LENGTH_BYTES + DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES
		o(aeadFacade.encrypt(keys, Uint8Array.from(""), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("1"), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("22"), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("333"), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("4444"), associatedData).length).equals(8 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("55555"), associatedData).length).equals(8 + overhead)
	})

	o.spec("decrypt_detects_wrong_padding", function () {
		let testDecryptionWithInvalidPadding: (plaintext: Uint8Array) => Promise<void>

		o.before(() => {
			testDecryptionWithInvalidPadding = async function (plaintext: Uint8Array) {
				const versionedCiphertext = aeadFacade.encryptInternal(keys, plaintext, associatedData)
				const parsedCiphertext = parseVersionedCiphertext(versionedCiphertext) as ParsedCiphertextAead
				const e = await assertThrows(CryptoError, async () => {
					aeadFacade.decrypt(keys, parsedCiphertext, associatedData)
				})
				o(e.message).equals("invalid padding")
			}
		})

		o.test("empty_plaintext", async function () {
			await testDecryptionWithInvalidPadding(Uint8Array.from(""))
		})
		o.test("plaintext_without_padding", async function () {
			await testDecryptionWithInvalidPadding(Uint8Array.from("no padding"))
		})
		o.test("plaintext_padded_without_padding_byte", async function () {
			await testDecryptionWithInvalidPadding(Uint8Array.from([1, 2, 0, 0]))
		})
		o.test("plaintext_padded_with_more_than_4_bytes", async function () {
			await testDecryptionWithInvalidPadding(Uint8Array.from([1, 2, 3, PADDING_BYTE, 0, 0, 0, 0]))
		})
	})
})
