import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "./SymmetricCipherVersion.js"
import { AeadSubKeys } from "./SymmetricKeyDeriver.js"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength.js"
import { concat } from "@tutao/tutanota-utils"
import { bitArrayToUint8Array, generateIV, IV_BYTE_LENGTH, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES, uint8ArrayToBitArray } from "./SymmetricCipherUtils.js"
import sjcl from "../../internal/sjcl.js"
import { blake3Mac, blake3MacVerify, DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES } from "../../hashes/Blake3.js"
import { MacTag } from "../../misc/Constants"

/**
 * This facade contains all methods for encryption/ decryption for Authenticated Encryption with Associated Data (AEAD).
 *
 * We use AES-CTR then BLAKE3, where the tag is computed over: version byte, nonce, ciphertext and associated data.
 * @deprecated DO NOT USE THIS YET - EXPORTED ONLY FOR COMPATIBILITY TESTS!
 */
export class AeadFacade {
	encrypt(key: AeadSubKeys, plainText: Uint8Array, associatedData: Uint8Array): Uint8Array {
		this.validateKeyLength(key)

		const iv = generateIV()
		const aesCtrCiphertext = bitArrayToUint8Array(
			sjcl.mode.ctr.encrypt(new sjcl.cipher.aes(key.encryptionKey), uint8ArrayToBitArray(plainText), uint8ArrayToBitArray(iv), []),
		)

		const unauthenticatedCiphertext = concat(symmetricCipherVersionToUint8Array(SymmetricCipherVersion.Aead), iv, aesCtrCiphertext)
		const unauthenticatedCiphertextLength = bitArrayToUint8Array([unauthenticatedCiphertext.length])

		const tag = blake3Mac(key.authenticationKey, concat(unauthenticatedCiphertextLength, unauthenticatedCiphertext, associatedData))

		return concat(unauthenticatedCiphertext, tag)
	}

	decrypt(key: AeadSubKeys, cipherText: Uint8Array, associatedData: Uint8Array): Uint8Array {
		this.validateKeyLength(key)

		const cipherTextWithoutMac = cipherText.subarray(0, cipherText.length - DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES)
		const authenticationTag = cipherText.subarray(cipherText.length - DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES, cipherText.length)
		const cipherTextWithoutMacLength = bitArrayToUint8Array([cipherTextWithoutMac.length])
		const authenticatedData = concat(cipherTextWithoutMacLength, cipherTextWithoutMac, associatedData)
		blake3MacVerify(key.authenticationKey, authenticatedData, authenticationTag as MacTag)

		const iv = cipherTextWithoutMac.subarray(SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_BYTE_LENGTH)
		const aesCtrCiphertext = cipherTextWithoutMac.subarray(SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_BYTE_LENGTH, cipherTextWithoutMac.length)

		return bitArrayToUint8Array(
			sjcl.mode.ctr.decrypt(new sjcl.cipher.aes(key.encryptionKey), uint8ArrayToBitArray(aesCtrCiphertext), uint8ArrayToBitArray(iv), []),
		)
	}

	private validateKeyLength(key: AeadSubKeys) {
		// authentication key length is verified when computing the mac
		getAndVerifyAesKeyLength(key.encryptionKey, [AesKeyLength.Aes256])
		getAndVerifyAesKeyLength(key.authenticationKey, [AesKeyLength.Aes256])
	}
}
