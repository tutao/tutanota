import { AesKey } from "./Aes.js"
import sjcl from "../internal/sjcl.js"
import { bitArrayToUint8Array, uint8ArrayToBitArray } from "../misc/Utils.js"
import { arrayEquals } from "@tutao/tutanota-utils"
import { CryptoError } from "../misc/CryptoError.js"

export type MacTag = Uint8Array & { __brand: "macTag" }

/**
 * Create an HMAC-SHA-256 tag over the given data using the given key.
 */
export function hmacSha256(key: AesKey, data: Uint8Array): MacTag {
	const hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256)
	return bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(data))) as MacTag
}

/**
 * Verify an HMAC-SHA-256 tag against the given data and key.
 * @throws CryptoError if the tag does not match the data and key.
 */
export function verifyHmacSha256(key: AesKey, data: Uint8Array, tag: MacTag) {
	const computedTag = hmacSha256(key, data)
	if (!sjcl.bitArray.equal(computedTag, tag)) {
		throw new CryptoError("invalid mac")
	}
}
