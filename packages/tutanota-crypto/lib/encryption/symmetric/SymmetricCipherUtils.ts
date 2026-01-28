import { random } from "../../random/Randomizer.js"
import { CryptoError } from "../../misc/CryptoError.js"
import { Base64, base64ToBase64Url, base64ToUint8Array, Base64Url, hexToUint8Array, uint8ArrayToArrayBuffer, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { sha256Hash } from "../../hashes/Sha256.js"
import sjcl from "../../internal/sjcl.js"
import { AesKeyLength, getAndVerifyAesKeyLength, getKeyLengthInBytes } from "./AesKeyLength.js"

export const FIXED_IV = hexToUint8Array("88888888888888888888888888888888")
export const BLOCK_SIZE_BYTES = 16
export const IV_BYTE_LENGTH = BLOCK_SIZE_BYTES
export const SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES = 1
export const SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES = 32
/**
 * Does not account for padding or the IV, but only the version byte and the authentication tag.
 */
export const SYMMETRIC_CIPHER_VERSION_AND_TAG_OVERHEAD_BYTES = SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES + SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES

export type BitArray = number[]
export type Aes256Key = BitArray
export type Aes128Key = BitArray
export type AesKey = Aes128Key | Aes256Key

/**
 * Creates the auth verifier from the password key.
 * @param passwordKey The key.
 * @returns The auth verifier
 */
export function createAuthVerifier(passwordKey: AesKey): Uint8Array {
	return sha256Hash(keyToUint8Array(passwordKey))
}

export function createAuthVerifierAsBase64Url(passwordKey: AesKey): Base64Url {
	return base64ToBase64Url(uint8ArrayToBase64(createAuthVerifier(passwordKey)))
}

/**
 * Converts the given BitArray (SJCL) to an Uint8Array.
 * @param bits The BitArray.
 * @return The uint8array.
 */
export function bitArrayToUint8Array(bits: BitArray): Uint8Array {
	return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(bits, false))
}

/**
 * Converts the given uint8array to a BitArray (SJCL).
 * @param uint8Array The uint8Array key.
 * @return The key.
 */
export function uint8ArrayToBitArray(uint8Array: Uint8Array): BitArray {
	return sjcl.codec.arrayBuffer.toBits(uint8ArrayToArrayBuffer(uint8Array))
}

export function keyToBase64(key: AesKey): Base64 {
	return uint8ArrayToBase64(keyToUint8Array(key))
}

/**
 * Converts the given base64 coded string to a key.
 * @param base64 The base64 coded string representation of the key.
 * @return The key.
 * @throws {CryptoError} If the conversion fails.
 */
export function base64ToKey(base64: Base64): AesKey {
	try {
		return uint8ArrayToKey(base64ToUint8Array(base64))
	} catch (e) {
		throw new CryptoError("hex to aes key failed", e as Error)
	}
}

export function uint8ArrayToKey(array: Uint8Array): AesKey {
	let key = uint8ArrayToBitArray(array)
	getAndVerifyAesKeyLength(key)
	return key
}

export function keyToUint8Array(key: BitArray): Uint8Array {
	return bitArrayToUint8Array(key)
}

/**
 * Create a random 256-bit symmetric AES key.
 *
 * @return The key.
 */
export function aes256RandomKey(): Aes256Key {
	return uint8ArrayToBitArray(random.generateRandomData(getKeyLengthInBytes(AesKeyLength.Aes256)))
}
