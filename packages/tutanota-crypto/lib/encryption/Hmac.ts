import { AesKey } from "./Aes.js"
import sjcl from "../internal/sjcl.js"
import { bitArrayToUint8Array, uint8ArrayToBitArray } from "../misc/Utils.js"
import { CryptoError } from "../misc/CryptoError.js"
import { constantTimeUint8ArrayEquals } from "../misc/ConstantTime.js"

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
	return doubleHmacVerification(key, data, tag)
}

/**
 * Verify an HMAC tag using constant-time comparison, as far as this can be trusted in Javascript.
 */
function constantTimeHmacVerification(key: AesKey, data: Uint8Array, tag: MacTag) {
	const computedTag = hmacSha256(key, data)
	if (!constantTimeUint8ArrayEquals(computedTag, tag)) {
		throw new CryptoError("invalid mac")
	}
}

/**
 * Verify an HMAC tag using the Double HMAC Verification technique to protect against timing-attacks
 *
 * @link https://web.archive.org/web/20160203044316/https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2011/february/double-hmac-verification/
 */
function doubleHmacVerification(key: AesKey, data: Uint8Array, tag: MacTag) {
	const hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256)

	const computedTag = hmac.encrypt(uint8ArrayToBitArray(data))
	const receivedTag = uint8ArrayToBitArray(tag)

	const secondComputedTag = hmac.encrypt(computedTag)
	const secondReceivedTag = hmac.encrypt(receivedTag)

	if (!sjcl.bitArray.equal(secondComputedTag, secondReceivedTag)) throw new CryptoError("invalid mac")
}
