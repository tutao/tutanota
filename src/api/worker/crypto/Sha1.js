// @flow
// $FlowIgnore[untyped-import]
import sjcl from "./lib/sjcl"
import {assertWorkerOrNode} from "../../common/Env"

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