// @ts-ignore[untyped-import]
import sjcl from "../internal/sjcl.js"
import {
    base64ToBase64Url,
    base64ToUint8Array,
    concat,
    hexToUint8Array,
    uint8ArrayToArrayBuffer,
    uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import type {Base64, Base64Url} from "@tutao/tutanota-utils"
import {CryptoError} from "./CryptoError.js"
import {sha256Hash} from "../hashes/Sha256.js"
import {Aes128Key, Aes256Key } from "../encryption/Aes.js"

export type BitArray = number[]

const PADDING_BLOCK_LENGTH = 16 // same for aes128 and aes256 as the block size is always 16 byte

export function padAes(bytes: Uint8Array): Uint8Array {
    let paddingLength = PADDING_BLOCK_LENGTH - (bytes.byteLength % PADDING_BLOCK_LENGTH)
    let padding = new Uint8Array(paddingLength)
    padding.fill(paddingLength)
    return concat(bytes, padding)
}
export function unpadAes(bytes: Uint8Array): Uint8Array {
    let paddingLength = bytes[bytes.byteLength - 1]

    if (paddingLength === 0 || paddingLength > bytes.byteLength || paddingLength > PADDING_BLOCK_LENGTH) {
        throw new CryptoError("invalid padding: " + paddingLength)
    }

    let length = bytes.byteLength - paddingLength
    let result = new Uint8Array(length)
    result.set(bytes.subarray(0, length))
    return result
}

/**
 * Creates the auth verifier from the password key.
 * @param passwordKey The key.
 * @returns The auth verifier
 */
export function createAuthVerifier(passwordKey: Aes128Key | Aes256Key): Uint8Array {
    // FIXME Compatibility Test
    return sha256Hash(bitArrayToUint8Array(passwordKey))
}
export function createAuthVerifierAsBase64Url(passwordKey: Aes128Key | Aes256Key): Base64Url {
    return base64ToBase64Url(uint8ArrayToBase64(createAuthVerifier(passwordKey)))
}

/**
 * Provides the information if a key is 128 or 256 bit length.
 * @param key The key.
 * @returns True if the key length is 128, false if the key length is 256 bit.
 * @throws If the key is not 128 bit and not 256 bit.
 */
export function checkIs128BitKey(key: Aes128Key | Aes256Key): boolean {
    let bitLength = sjcl.bitArray.bitLength(key)

    if (bitLength === 128) {
        return true
    } else if (bitLength === 256) {
        return false
    } else {
        throw new CryptoError("invalid key bit length: " + bitLength)
    }
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

/**
 * Converts the given key to a base64 coded string.
 * @param key The key.
 * @return The base64 coded string representation of the key.
 */
export function keyToBase64(key: BitArray): Base64 {
    return sjcl.codec.base64.fromBits(key)
}

/**
 * Converts the given base64 coded string to a key.
 * @param base64 The base64 coded string representation of the key.
 * @return The key.
 * @throws {CryptoError} If the conversion fails.
 */
export function base64ToKey(base64: Base64): BitArray {
    try {
        return sjcl.codec.base64.toBits(base64)
    } catch (e) {
        throw new CryptoError("hex to aes key failed", e as Error)
    }
}
// TODO test
export function uint8ArrayToKey(array: Uint8Array): BitArray {
    return base64ToKey(uint8ArrayToBase64(array))
}
export function keyToUint8Array(key: BitArray): Uint8Array {
    return base64ToUint8Array(keyToBase64(key))
}
export const fixedIv: Uint8Array = hexToUint8Array("88888888888888888888888888888888")