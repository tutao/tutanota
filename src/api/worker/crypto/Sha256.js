// @flow
import sjcl from "./lib/crypto-sjcl-1.3.0_1"
import {assertWorkerOrNode} from "../../Env"

assertWorkerOrNode()

const sha256 = new sjcl.hash.sha256()

export const HASH_LENGTH = 32

/**
 * Create the hash of the given data.
 * @param uint8Array The bytes.
 * @return The hash.
 */
export function hash(uint8Array: Uint8Array): Uint8Array {
	sha256.reset()
	sha256.update(sjcl.codec.arrayBuffer.toBits(uint8Array.buffer))
	return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sha256.finalize(), false))
}