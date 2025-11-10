import sjcl from "../internal/sjcl.js"
import { bitArrayToUint8Array, uint8ArrayToBitArray } from "../encryption/symmetric/SymmetricCipherUtils.js"
import { SHA256_HASH_LENGTH_BYTES } from "./Sha256.js"

/**
 * Derives a key of a defined length from salt, inputKeyMaterial and info.
 *@param  salt – the salt to use, may be null for a salt for hashLen zeros
 * @return the derived salt
 */
export function hkdf(salt: Uint8Array | null, inputKeyMaterial: Uint8Array, info: Uint8Array, lengthInBytes: number): Uint8Array {
	if (salt == null) {
		salt = new Uint8Array(SHA256_HASH_LENGTH_BYTES).fill(0)
	}
	const saltHmac = new sjcl.misc.hmac(uint8ArrayToBitArray(salt), sjcl.hash.sha256)
	const key = saltHmac.mac(uint8ArrayToBitArray(inputKeyMaterial))
	const hashLen = sjcl.bitArray.bitLength(key)

	const loops = Math.ceil((lengthInBytes * 8) / hashLen)
	if (loops > 255) {
		throw new sjcl.exception.invalid("key bit length is too large for hkdf")
	}

	const inputKeyMaterialHmac = new sjcl.misc.hmac(key, sjcl.hash.sha256)
	let curOut = []
	let ret: Array<number> = []
	for (let i = 1; i <= loops; i++) {
		inputKeyMaterialHmac.update(curOut)
		inputKeyMaterialHmac.update(uint8ArrayToBitArray(info))
		inputKeyMaterialHmac.update([sjcl.bitArray.partial(8, i)])
		curOut = inputKeyMaterialHmac.digest()
		ret = sjcl.bitArray.concat(ret, curOut)
	}
	return bitArrayToUint8Array(sjcl.bitArray.clamp(ret, lengthInBytes * 8))
}
