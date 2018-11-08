// @flow
import sjcl from "./lib/crypto-sjcl-1.0.7"
import {assertWorkerOrNode} from "../../Env"

assertWorkerOrNode()

const sha512 = new sjcl.hash.sha512()

export const HASH_LENGTH_BYTES = 64

/**
 * Create the hash of the given data.
 * @param uint8Array The bytes.
 * @return The hash.
 */
export function hash(uint8Array: Uint8Array): Uint8Array {
	try {
		sha512.update(sjcl.codec.arrayBuffer.toBits(uint8Array.buffer))
		return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sha512.finalize(), false))
	} finally {
		sha512.reset()
	}
}