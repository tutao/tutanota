import sjcl from "../internal/sjcl.js";
import { bitArrayToUint8Array, uint8ArrayToBitArray } from "../misc/Utils.js";
/**
 * Derives a key of a defined length from salt, inputKeyMaterial and info.
 * @return the derived salt
 */
export function hkdf(salt, inputKeyMaterial, info, lengthInBytes) {
    const saltHmac = new sjcl.misc.hmac(uint8ArrayToBitArray(salt), sjcl.hash.sha256);
    const key = saltHmac.mac(uint8ArrayToBitArray(inputKeyMaterial));
    const hashLen = sjcl.bitArray.bitLength(key);
    const loops = Math.ceil((lengthInBytes * 8) / hashLen);
    if (loops > 255) {
        throw new sjcl.exception.invalid("key bit length is too large for hkdf");
    }
    const inputKeyMaterialHmac = new sjcl.misc.hmac(key, sjcl.hash.sha256);
    let curOut = [];
    let ret = [];
    for (let i = 1; i <= loops; i++) {
        inputKeyMaterialHmac.update(curOut);
        inputKeyMaterialHmac.update(uint8ArrayToBitArray(info));
        inputKeyMaterialHmac.update([sjcl.bitArray.partial(8, i)]);
        curOut = inputKeyMaterialHmac.digest();
        ret = sjcl.bitArray.concat(ret, curOut);
    }
    return bitArrayToUint8Array(sjcl.bitArray.clamp(ret, lengthInBytes * 8));
}
