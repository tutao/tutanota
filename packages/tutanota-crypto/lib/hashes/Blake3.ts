import { blake3 } from "@noble/hashes/blake3.js"
import { AesKey, keyToUint8Array, uint8ArrayToBitArray } from "../encryption/symmetric/SymmetricCipherUtils.js"
import sjcl from "../internal/sjcl.js"
import { CryptoError } from "../misc/CryptoError.js"
import { MacTag } from "../misc/Constants.js"

const DEFAULT_BLAKE3_OUTPUT_LENGTH = 32

/**
 * Compute a 32 byte BLAKE3 hash.
 */
export function blake3Hash(data: Uint8Array) {
	return blake3(data, { dkLen: DEFAULT_BLAKE3_OUTPUT_LENGTH })
}

/**
 * Create a 32 byte BLAKE3 tag over the given data using the given key.
 */
export function blake3Mac(key: AesKey, data: Uint8Array): MacTag {
	const keyBytes = keyToUint8Array(key)
	return blake3(data, { dkLen: DEFAULT_BLAKE3_OUTPUT_LENGTH, key: keyBytes }) as MacTag
}

/**
 * Verify a BLAKE3 tag against the given data and key.
 * @throws CryptoError if the tag does not match the data and key.
 */
export function blake3MacVerify(key: AesKey, data: Uint8Array, tag: MacTag) {
	const computedTag = blake3Mac(key, data)
	if (!sjcl.bitArray.equal(computedTag, tag)) {
		throw new CryptoError("invalid mac")
	}
}

/**
 * Derive a key from the given input key material and context
 * @param inputKey Input Key Material
 * @param context
 * @param desiredLengthBytes defaults to 32 (256 bit)
 */
export function blake3Kdf(inputKey: AesKey, context: Uint8Array, desiredLengthBytes: number = DEFAULT_BLAKE3_OUTPUT_LENGTH): AesKey {
	const keyBytes = blake3(keyToUint8Array(inputKey), { dkLen: desiredLengthBytes, context })
	return uint8ArrayToBitArray(keyBytes)
}
