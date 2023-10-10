// @ts-ignore[untyped-import]
import sjcl from "../internal/sjcl.js"

const sha256 = new sjcl.hash.sha256()
export const SHA256_HASH_LENGTH_BYTES = 32

/**
 * Create the hash of the given data.
 * @param uint8Array The bytes.
 * @return The hash.
 */
export function sha256Hash(uint8Array: Uint8Array): Uint8Array {
	try {
		sha256.update(sjcl.codec.arrayBuffer.toBits(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength))
		return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sha256.finalize(), false))
	} finally {
		sha256.reset()
	}
}
