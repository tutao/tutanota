// @flow
// $FlowIgnore[untyped-import]
import sjcl from "../internal/sjcl"

const sha1 = new sjcl.hash.sha1()

const SHA1_HASH_LENGTH_BYTES = 20

/**
 * Create the hash of the given data.
 * @param uint8Array The bytes.
 * @return The hash.
 */
export function sha1Hash(uint8Array: Uint8Array): Uint8Array {
	try {
		sha1.update(sjcl.codec.arrayBuffer.toBits(uint8Array.buffer))
		return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sha1.finalize(), false))
	} finally {
		sha1.reset()
	}
}