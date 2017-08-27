//@flow
import sjcl from "./lib/crypto-sjcl-1.0.7"
import {uint8ArrayToBitArray, bitArrayToUint8Array} from "./CryptoUtils"
import {hexToUint8Array} from "../../common/utils/Encoding"
import {random} from "./Randomizer"

export let DIGITS = 6;
const DIGITS_POWER
	// 0   1   2    3    4      5       6        7         8
	= [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000]

const base32 = sjcl.codec.base32

export class TotpVerifier {
	_digits: number;

	constructor(digits: number = DIGITS) {
		this._digits = digits
	}

	generateSecret(): {key: Uint8Array, readableKey: Base32} {
		let key = random.generateRandomData(16)
		let readableKey = this.readableKey(key)
		return {key, readableKey}
	}

	/**
	 * This method generates a TOTP value for the given
	 * set of parameters.
	 *
	 * @param time : a value that reflects a time
	 * @param key  :  the shared secret. It is generated if it does not exist
	 * @return: the key and a numeric String in base 10 that includes truncationDigits digits
	 */
	generateTotp(time: number, key: Uint8Array): number {
		// Using the counter
		// First 8 bytes are for the movingFactor
		// Compliant with base RFC 4226 (HOTP)
		let timeHex = time.toString(16);
		while (timeHex.length < 16)
			timeHex = "0" + timeHex;

		let msg = hexToUint8Array(timeHex);
		let hash = this.hmac_sha(key, msg);

		let offset = hash[hash.length - 1] & 0xf;

		let binary = ((hash[offset] & 0x7f) << 24) |
			((hash[offset + 1] & 0xff) << 16) |
			((hash[offset + 2] & 0xff) << 8) |
			(hash[offset + 3] & 0xff);

		let code = binary % DIGITS_POWER[this._digits];
		return code
	}

	hmac_sha(key: Uint8Array, text: Uint8Array): Uint8Array {
		let hmac = new sjcl.misc.hmac(uint8ArrayToBitArray(key), sjcl.hash.sha1)
		return bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(text)))
	}

	readableKey(key: Uint8Array): Base32 {
		return base32.fromBits(uint8ArrayToBitArray(key)).toLowerCase().replace(/(.{4})/g, "$1 ").replace(/=/g, "").trim()
	}
}