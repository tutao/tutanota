import { blake3 } from "../internal/noble-hashes-2.0.1.js"
import { Aes256Key, keyToUint8Array } from "../encryption/symmetric/SymmetricCipherUtils.js"
import sjcl from "../internal/sjcl.js"
import { CryptoError } from "../misc/CryptoError.js"
import { MacTag } from "../misc/Constants.js"

const DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES = 32

/**
 * Compute a 32 byte BLAKE3 hash.
 */
export function blake3Hash(data: Uint8Array) {
	return blake3(data, { dkLen: DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES })
}

/**
 * Create a 32 byte BLAKE3 tag over the given data using the given key.
 */
export function blake3Mac(key: Aes256Key, data: Uint8Array): MacTag {
	const keyBytes = keyToUint8Array(key)
	return blake3(data, { dkLen: DEFAULT_BLAKE3_OUTPUT_LENGTH_BYTES, key: keyBytes }) as MacTag
}

/**
 * Verify a BLAKE3 tag against the given data and key.
 * @throws CryptoError if the tag does not match the data and key.
 */
export function blake3MacVerify(key: Aes256Key, data: Uint8Array, tag: MacTag) {
	const computedTag = blake3Mac(key, data)
	if (!sjcl.bitArray.equal(computedTag, tag)) {
		throw new CryptoError("invalid mac")
	}
}

/**
 * Derive key bytes from the given input key material and context
 * @param inputKeyMaterial Input Key Material
 * @param context
 * @param desiredLengthBytes
 */
export function blake3Kdf(inputKeyMaterial: Uint8Array, context: Uint8Array, desiredLengthBytes: number): Uint8Array {
	return blake3(inputKeyMaterial, { dkLen: desiredLengthBytes, context })
}
