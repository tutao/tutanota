import o, { assertThrows } from "@tutao/otest"
import { AeadFacade, PADDING_BYTE } from "@tutao/crypto"
import { AeadSubKeys } from "@tutao/crypto/symmetric-key-deriver"
import { aes256RandomKey, IV_BYTE_LENGTH } from "@tutao/crypto/symmetric-cipher-utils"
import { _aes128RandomKey } from "./AesTest.js"
import { CryptoError } from "@tutao/crypto/error"
import { concat } from "@tutao/utils"
import { DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES } from "@tutao/crypto/blake3"

o.spec("AeadFacadeTest", function () {
	let aeadFacade: AeadFacade
	let keys: AeadSubKeys
	const associatedData = Uint8Array.from([9, 8, 7, 6])
	const plaintext = Uint8Array.from([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
	o.beforeEach(function () {
		aeadFacade = new AeadFacade()
		const encryptionKey = aes256RandomKey()
		const authenticationKey = aes256RandomKey()
		keys = { encryptionKey, authenticationKey }
	})
	o("encrypt roundtrip success", function () {
		const ciphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		const decrypted = aeadFacade.decrypt(keys, ciphertext, associatedData)
		o(plaintext).deepEquals(decrypted)
	})

	o("encrypt_wrong_key_length", async function () {
		const subKeys = { encryptionKey: _aes128RandomKey(), authenticationKey: keys.authenticationKey }
		await assertThrows(CryptoError, async () => aeadFacade.encrypt(subKeys, plaintext, associatedData))
	})

	o("decrypt_wrong_key_length", async function () {
		const subKeys = { encryptionKey: _aes128RandomKey(), authenticationKey: keys.authenticationKey }
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(subKeys, plaintext, associatedData))
	})

	o("decrypt_canonicalization_safe", async function () {
		// we make sure that data is treated differently depending on whether it is part of the associated data or the ciphertext. this ensures a canonical form.
		const ciphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		const wrongCiphertext = ciphertext.subarray(0, ciphertext.length - 1)
		const wrongAssociatedData = concat(Uint8Array.from([ciphertext[ciphertext.length - 1]]), associatedData)
		o(concat(ciphertext, associatedData)).deepEquals(concat(wrongCiphertext, wrongAssociatedData))
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, wrongCiphertext, wrongAssociatedData))
	})

	o("encrypt_empty_associated_data", async function () {
		const emptyAd = new Uint8Array()
		const ciphertext = aeadFacade.encrypt(keys, plaintext, emptyAd)
		const decrypted = aeadFacade.decrypt(keys, ciphertext, emptyAd)
		o(plaintext).deepEquals(decrypted)
	})

	o("encrypt_empty_plaintext", async function () {
		const emptyPlaintext = new Uint8Array()
		const ciphertext = aeadFacade.encrypt(keys, emptyPlaintext, associatedData)
		const decrypted = aeadFacade.decrypt(keys, ciphertext, associatedData)
		o(emptyPlaintext).deepEquals(decrypted)
	})

	o("decrypt_with_invalid_associated_data", async function () {
		const wrongAd = Uint8Array.from([2, 3, 4])
		const ciphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, ciphertext, wrongAd))
	})

	o("decrypt_wrong_mac", async function () {
		const ciphertext = aeadFacade.encrypt(keys, plaintext, associatedData)
		ciphertext[ciphertext.length - 1]++
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, ciphertext, associatedData))
	})

	o("encrypt_adds_padding", async function () {
		const overhead = DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES + IV_BYTE_LENGTH
		o(aeadFacade.encrypt(keys, Uint8Array.from(""), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("1"), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("22"), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("333"), associatedData).length).equals(4 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("4444"), associatedData).length).equals(8 + overhead)
		o(aeadFacade.encrypt(keys, Uint8Array.from("55555"), associatedData).length).equals(8 + overhead)
	})

	o("encrypt_adds_padding", async function () {
		await assertThrows(CryptoError, async () =>
			aeadFacade.decrypt(keys, aeadFacade.encryptInternal(keys, Uint8Array.from(""), associatedData), associatedData),
		)
		await assertThrows(CryptoError, async () =>
			aeadFacade.decrypt(keys, aeadFacade.encryptInternal(keys, Uint8Array.from("no padding"), associatedData), associatedData),
		)
		await assertThrows(CryptoError, async () =>
			aeadFacade.decrypt(keys, aeadFacade.encryptInternal(keys, Uint8Array.from([1, 2, 0, 0]), associatedData), associatedData),
		)
		await assertThrows(CryptoError, async () =>
			aeadFacade.decrypt(keys, aeadFacade.encryptInternal(keys, Uint8Array.from([1, 2, PADDING_BYTE, 0, 0, 0, 0]), associatedData), associatedData),
		)
	})
})
