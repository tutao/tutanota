import { AeadSubKeys } from "./SymmetricKeyDeriver.js"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength.js"
import { concat } from "@tutao/tutanota-utils"
import { bitArrayToUint8Array, generateIV, IV_BYTE_LENGTH, uint8ArrayToBitArray } from "./SymmetricCipherUtils.js"
import sjcl from "../../internal/sjcl.js"
import { blake3Mac, blake3MacVerify, DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES } from "../../hashes/Blake3.js"
import { MacTag } from "../../misc/Constants"
import { CryptoError } from "../../misc/CryptoError.js"

export const PADDING_BLOCK_SIZE: number = 4
export const PADDING_BYTE: number = 0x80
export const PADDING_ZERO_BYTE: number = 0x00

/**
 * This facade contains all methods for encryption/ decryption for Authenticated Encryption with Associated Data (AEAD).
 *
 * We use AES-CTR then BLAKE3, where the tag is computed over: version byte, nonce, ciphertext and associated data.
 * @deprecated DO NOT USE THIS YET - EXPORTED ONLY FOR COMPATIBILITY TESTS!
 */
export class AeadFacade {
	private pad(plaintext: Uint8Array): Uint8Array {
		const bytesToAppend = PADDING_BLOCK_SIZE - (plaintext.length % PADDING_BLOCK_SIZE)
		const paddedPlaintext = new Uint8Array(plaintext.length + bytesToAppend)
		paddedPlaintext.set(plaintext)
		paddedPlaintext.fill(PADDING_ZERO_BYTE, plaintext.length)
		paddedPlaintext[plaintext.length] = PADDING_BYTE
		return paddedPlaintext
	}

	private unpad(paddedPlaintext: Uint8Array): Uint8Array {
		let index = paddedPlaintext.length - 1
		let zeroByteCount = 0
		while (true) {
			if (index < 0) {
				throw new CryptoError("invalid padding")
			}
			const byte = paddedPlaintext[index]
			if (byte === PADDING_BYTE) {
				return paddedPlaintext.subarray(0, index)
			}
			if (byte !== PADDING_ZERO_BYTE) {
				throw new CryptoError("invalid padding")
			}
			zeroByteCount += 1
			if (zeroByteCount >= PADDING_BLOCK_SIZE) {
				throw new CryptoError("invalid padding")
			}
			index -= 1
		}
	}

	/**
	 * Encrypt with AEAD.
	 */
	encrypt(key: AeadSubKeys, plaintext: Uint8Array, associatedData: Uint8Array): Uint8Array {
		const paddedPlaintext = this.pad(plaintext)
		return this.encryptInternal(key, paddedPlaintext, associatedData)
	}

	/**
	 * Encrypt the plaintext with AEAD. It must already be padded.
	 * @private
	 */
	encryptInternal(key: AeadSubKeys, plaintext: Uint8Array, associatedData: Uint8Array): Uint8Array {
		this.validateKeyLength(key)

		const iv = generateIV()
		const aesCtrCiphertext = bitArrayToUint8Array(
			sjcl.mode.ctr.encrypt(new sjcl.cipher.aes(key.encryptionKey), uint8ArrayToBitArray(plaintext), uint8ArrayToBitArray(iv), []),
		)

		const unauthenticatedCiphertext = concat(iv, aesCtrCiphertext)
		const unauthenticatedCiphertextLength = bitArrayToUint8Array([unauthenticatedCiphertext.length])

		const tag = blake3Mac(key.authenticationKey, concat(unauthenticatedCiphertextLength, unauthenticatedCiphertext, associatedData))

		return concat(unauthenticatedCiphertext, tag)
	}

	/**
	 * Decrypt with AEAD.
	 */
	decrypt(key: AeadSubKeys, ciphertext: Uint8Array, associatedData: Uint8Array): Uint8Array {
		this.validateKeyLength(key)

		const ciphertextWithoutMac = ciphertext.subarray(0, ciphertext.length - DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES)
		const authenticationTag = ciphertext.subarray(ciphertext.length - DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES, ciphertext.length)
		const ciphertextWithoutMacLength = bitArrayToUint8Array([ciphertextWithoutMac.length])
		const authenticatedData = concat(ciphertextWithoutMacLength, ciphertextWithoutMac, associatedData)
		blake3MacVerify(key.authenticationKey, authenticatedData, authenticationTag as MacTag)

		const iv = ciphertextWithoutMac.subarray(0, IV_BYTE_LENGTH)
		const aesCtrCiphertext = ciphertextWithoutMac.subarray(IV_BYTE_LENGTH, ciphertextWithoutMac.length)

		const paddedPlaintext = bitArrayToUint8Array(
			sjcl.mode.ctr.decrypt(new sjcl.cipher.aes(key.encryptionKey), uint8ArrayToBitArray(aesCtrCiphertext), uint8ArrayToBitArray(iv), []),
		)
		return this.unpad(paddedPlaintext)
	}

	private validateKeyLength(key: AeadSubKeys) {
		getAndVerifyAesKeyLength(key.encryptionKey, [AesKeyLength.Aes256])
		getAndVerifyAesKeyLength(uint8ArrayToBitArray(key.authenticationKey), [AesKeyLength.Aes256])
	}
}
