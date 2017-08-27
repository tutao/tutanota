// @flow
import sjcl from "./lib/crypto-sjcl-1.0.7"
import {assertWorkerOrNode} from "../../Env"

assertWorkerOrNode()

const sha1 = new sjcl.hash.sha1()

export const HASH_LENGTH = 32

/**
 * Create the hash of the given data.
 * @param uint8Array The bytes.
 * @return The hash.
 */
export function sha1hash(uint8Array: Uint8Array): Uint8Array {
	try {
		sha1.update(sjcl.codec.arrayBuffer.toBits(uint8Array.buffer))
		return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sha1.finalize(), false))
	} finally {
		sha1.reset()
	}
}