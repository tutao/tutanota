// @flow
import bCrypt from "./lib/bCrypt"
import {random} from "./Randomizer"
import {hash} from "./Sha256"
import {stringToUtf8Uint8Array} from "../../common/utils/Encoding"
import {CryptoError} from "../../common/error/CryptoError"
import {assertWorkerOrNode} from "../../Env"
import {uint8ArrayToBitArray} from "./CryptoUtils"
import type {KeyLengthEnum} from "./CryptoConstants"
import {KeyLength} from "./CryptoConstants"

assertWorkerOrNode()


const logRounds = 8; // pbkdf2 number of iterations

/**
 * Create a 128 bit random _salt value.
 * return _salt 128 bit of random data, encoded as a hex string.
 */
export function generateRandomSalt(): Uint8Array {
	return random.generateRandomData(128 / 8)
}

/**
 * Create a 128 bit symmetric key from the given passphrase.
 * @param passphrase The passphrase to use for key generation as utf8 string.
 * @param salt 16 bytes of random data
 * @param keyLengthType Defines the length of the key that shall be generated.
 * @return resolved with the key
 */
export function generateKeyFromPassphrase(passphrase: string, salt: Uint8Array, keyLengthType: KeyLengthEnum): Aes128Key|Aes256Key {
	// hash the password first to avoid login with multiples of a password, i.e. "hello" and "hellohello" produce the same key if the same _salt is used
	let passphraseBytes = hash(stringToUtf8Uint8Array(passphrase))
	let bytes = crypt_raw(passphraseBytes, salt, logRounds)
	if (keyLengthType === KeyLength.b128) {
		return uint8ArrayToBitArray(bytes.slice(0, 16))
	} else {
		return uint8ArrayToBitArray(hash(bytes))
	}
}

function crypt_raw(passphraseBytes: Uint8Array, saltBytes: Uint8Array, logRounds: number): Uint8Array {
	try {
		return _signedBytesToUint8Array(new bCrypt().crypt_raw(_uint8ArrayToSignedBytes(passphraseBytes), _uint8ArrayToSignedBytes(saltBytes), logRounds))
	} catch (e) {
		throw new CryptoError(e)
	}
}

/**
 * Converts an array of signed byte values (-128 to 127) to an Uint8Array (values 0 to 255).
 * @param signedBytes The signed byte values.
 * @return The unsigned byte values.
 */
function _signedBytesToUint8Array(signedBytes: SignedBytes): Uint8Array {
	return new Uint8Array(new Int8Array(signedBytes));
};

/**
 * Converts an uint8Array (value 0 to 255) to an Array with unsigned bytes (-128 to 127).
 * @param unsignedBytes The unsigned byte values.
 * @return The signed byte values.
 */
function _uint8ArrayToSignedBytes(unsignedBytes: Uint8Array): SignedBytes {
	return Array.from(new Uint8Array(new Int8Array(unsignedBytes)))
};
