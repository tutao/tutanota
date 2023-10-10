// @ts-ignore[untyped-import]
import sjcl from "../internal/sjcl.js"
const sha512 = new sjcl.hash.sha512()
export const SHA512_HASH_LENGTH_BYTES = 64

/**
 * Create the hash of the given data.
 * @param uint8Array The bytes.
 * @return The hash.
 */
export function sha512Hash(uint8Array: Uint8Array): Uint8Array {
	try {
		sha512.update(sjcl.codec.arrayBuffer.toBits(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength))
		return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sha512.finalize(), false))
	} finally {
		sha512.reset()
	}
}
