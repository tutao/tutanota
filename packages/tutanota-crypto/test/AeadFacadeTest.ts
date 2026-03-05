import o from "@tutao/otest"
import { AeadFacade } from "../lib/encryption/symmetric/AeadFacade.js"
import { AeadSubKeys } from "../lib/encryption/symmetric/SymmetricKeyDeriver.js"
import { aes256RandomKey, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES } from "../lib/encryption/symmetric/SymmetricCipherUtils.js"
import { _aes128RandomKey } from "./AesTest.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "../lib/misc/CryptoError.js"
import { concat } from "@tutao/tutanota-utils"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "../lib/encryption/symmetric/SymmetricCipherVersion.js"

o.spec("AeadFacadeTest", function () {
	let aeadFacade: AeadFacade
	let keys: AeadSubKeys
	const associatedData = Uint8Array.from([9, 8, 7, 6])
	const plainText = Uint8Array.from([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
	o.beforeEach(function () {
		aeadFacade = new AeadFacade()
		const encryptionKey = aes256RandomKey()
		const authenticationKey = aes256RandomKey()
		keys = { encryptionKey, authenticationKey }
	})
	o("encrypt roundtrip success", function () {
		const ciphertext = aeadFacade.encrypt(keys, plainText, associatedData)
		const decrypted = aeadFacade.decrypt(keys, ciphertext, associatedData)
		o(plainText).deepEquals(decrypted)
	})

	o("encrypt_wrong_key_length", async function () {
		const subKeys = { encryptionKey: _aes128RandomKey(), authenticationKey: keys.authenticationKey }
		await assertThrows(CryptoError, async () => aeadFacade.encrypt(subKeys, plainText, associatedData))
	})

	o("decrypt_wrong_key_length", async function () {
		const subKeys = { encryptionKey: _aes128RandomKey(), authenticationKey: keys.authenticationKey }
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(subKeys, plainText, associatedData))
	})

	o("decrypt_canonicalization_safe", async function () {
		// we make sure that data is treated differently depending on whether it is part of the associated data or the ciphertext. this ensures a canoncial form.
		const ciphertext = aeadFacade.encrypt(keys, plainText, associatedData)
		const wrongCiphertext = ciphertext.subarray(0, ciphertext.length - 1)
		const wrongAssociatedData = concat(Uint8Array.from([ciphertext[ciphertext.length - 1]]), associatedData)
		o(concat(ciphertext, associatedData)).deepEquals(concat(wrongCiphertext, wrongAssociatedData))
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, wrongCiphertext, wrongAssociatedData))
	})

	o("encrypt_empty_associated_data", async function () {
		const emptyAd = new Uint8Array()
		const ciphertext = aeadFacade.encrypt(keys, plainText, emptyAd)
		const decrypted = aeadFacade.decrypt(keys, ciphertext, emptyAd)
		o(plainText).deepEquals(decrypted)
	})

	o("encrypt_empty_plaintext", async function () {
		const emptyPlaintext = new Uint8Array()
		const ciphertext = aeadFacade.encrypt(keys, emptyPlaintext, associatedData)
		const decrypted = aeadFacade.decrypt(keys, ciphertext, associatedData)
		o(emptyPlaintext).deepEquals(decrypted)
	})

	o("decrypt_with_invalid_associated_data", async function () {
		const wrongAd = Uint8Array.from([2, 3, 4])
		const ciphertext = aeadFacade.encrypt(keys, plainText, associatedData)
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, ciphertext, wrongAd))
	})

	o("decrypt_missing_version_byte", async function () {
		const ciphertext = aeadFacade.encrypt(keys, plainText, associatedData)
		const cipherTextWithoutVersionByte = ciphertext.subarray(SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES, ciphertext.length)
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, cipherTextWithoutVersionByte, associatedData))
	})

	o("decrypt_wrong_version_byte", async function () {
		let ciphertext = aeadFacade.encrypt(keys, plainText, associatedData)
		ciphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.AesCbcThenHmac), ciphertext.subarray(1, ciphertext.length))
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, ciphertext, associatedData))
	})

	o("decrypt_wrong_mac", async function () {
		const ciphertext = aeadFacade.encrypt(keys, plainText, associatedData)
		ciphertext[ciphertext.length - 1]++
		await assertThrows(CryptoError, async () => aeadFacade.decrypt(keys, ciphertext, associatedData))
	})
})
