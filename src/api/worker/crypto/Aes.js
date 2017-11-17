// @flow
import sjcl from "./lib/crypto-sjcl-1.0.7"
import {random} from "./Randomizer"
import {pad, unpad, uint8ArrayToBitArray, bitArrayToUint8Array} from "./CryptoUtils"
import {concat, arrayEquals} from "../../common/utils/ArrayUtils"
import {uint8ArrayToBase64} from "../../common/utils/Encoding"
import {CryptoError} from "../../common/error/CryptoError"
import {assertWorkerOrNode} from "../../Env"
import {hash} from "./Sha256"

assertWorkerOrNode()

export const ENABLE_MAC = true

export const IV_BYTE_LENGTH = 16
const TAG_BYTE_LENGTH = 16
const TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8

const KEY_LENGTH_BYTES_AES_256 = 32
const KEY_LENGTH_BITS_AES_256 = KEY_LENGTH_BYTES_AES_256 * 8
const KEY_LENGTH_BYTES_AES_128 = 16
const KEY_LENGTH_BITS_AES_128 = KEY_LENGTH_BYTES_AES_128 * 8
const MAC_ENABLED_PREFIX = 1

export function aes256RandomKey(): Aes256Key {
	return uint8ArrayToBitArray(random.generateRandomData(KEY_LENGTH_BYTES_AES_256))
}

/**
 * Encrypts bytes with AES in GCM mode.
 * @param key The key to use for the encryption.
 * @param bytes The plain text.
 * @param iv The initialization vector.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @param useMac Not used because gcm always contains a mac. Just exists for interface compatibility with AES 128
 * @return The encrypted text as words (sjcl internal structure)..
 */
export function aes256Encrypt(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean = true, useMac: boolean = true): Uint8Array {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_256)
	if (usePadding) {
		bytes = pad(bytes) // TODO (bdeterding) consider implementing padding for bit array.
	}
	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `)
	}
	let encryptedBits = sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(key), uint8ArrayToBitArray(bytes), uint8ArrayToBitArray(iv), [], TAG_BIT_LENGTH)
	return concat(iv, bitArrayToUint8Array(encryptedBits))
}

/**
 * Decrypts the given words with AES in GCM mode.
 * @param key The key to use for the decryption.
 * @param words The ciphertext encoded as words.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return The decrypted bytes.
 */
// TODO add mac validation for AES-256 before switching from AES-128
export function aes256Decrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean = true): Uint8Array {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_256)
	// take the iv from the front of the encrypted data
	let iv = encryptedBytes.slice(0, IV_BYTE_LENGTH)
	let ciphertext = encryptedBytes.slice(IV_BYTE_LENGTH)

	try {
		let decrypted = sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(key), uint8ArrayToBitArray(ciphertext), uint8ArrayToBitArray(iv), [], TAG_BIT_LENGTH)
		let decryptedBytes = new Uint8Array(bitArrayToUint8Array(decrypted)) // TODO (bdeterding) consider to implement padding for bit array
		if (usePadding) {
			decryptedBytes = unpad(decryptedBytes)
		}
		return decryptedBytes
	} catch (e) {
		throw new CryptoError("aes decryption failed", e)
	}
}


function verifyKeySize(key: Aes128Key|Aes256Key, bitLength: number) {
	if (sjcl.bitArray.bitLength(key) !== bitLength) {
		throw new CryptoError(`Illegal key length: ${sjcl.bitArray.bitLength(key)} (expected: ${bitLength})`)
	}
}


/************************ Legacy AES128 ************************/

export function aes128RandomKey(): Aes128Key {
	return uint8ArrayToBitArray(random.generateRandomData(KEY_LENGTH_BYTES_AES_128))
}

/**
 * Encrypts bytes with AES128 in CBC mode.
 * @param key The key to use for the encryption.
 * @param bytes The plain text.
 * @param iv The initialization vector.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return The encrypted bytes
 */
export function aes128Encrypt(key: Aes128Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_128)
	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `)
	}

	let subKeys = getSubKeys(key, useMac)

	let encryptedBits = sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(bytes), uint8ArrayToBitArray(iv), [], usePadding);

	let data = concat(iv, bitArrayToUint8Array(encryptedBits))

	if (useMac) {
		let hmac = new sjcl.misc.hmac(subKeys.mKey, sjcl.hash.sha256)
		let macBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(data)))
		data = concat(new Uint8Array([MAC_ENABLED_PREFIX]), data, macBytes)
	}
	return data
}

/**
 * Decrypts the given words with AES128 in CBC mode.
 * @param key The key to use for the decryption.
 * @param words The ciphertext encoded as words.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return The decrypted bytes.
 */
export function aes128Decrypt(key: Aes128Key, encryptedBytes: Uint8Array, usePadding: boolean = true): Uint8Array {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_128)

	let useMac = encryptedBytes.length % 2 == 1
	let subKeys = getSubKeys(key, useMac)
	let cipherTextWithoutMac
	if (useMac) {
		cipherTextWithoutMac = encryptedBytes.subarray(1, encryptedBytes.length - 32)
		let providedMacBytes = encryptedBytes.subarray(encryptedBytes.length - 32)
		let hmac = new sjcl.misc.hmac(subKeys.mKey, sjcl.hash.sha256)
		let computedMacBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(cipherTextWithoutMac)))
		if (!arrayEquals(providedMacBytes, computedMacBytes)) {
			throw new CryptoError("invalid mac")
		}
	} else {
		cipherTextWithoutMac = encryptedBytes
	}

	// take the iv from the front of the encrypted data
	let iv = cipherTextWithoutMac.slice(0, IV_BYTE_LENGTH)
	let ciphertext = cipherTextWithoutMac.slice(IV_BYTE_LENGTH)
	try {
		let decrypted = sjcl.mode.cbc.decrypt(new sjcl.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(ciphertext), uint8ArrayToBitArray(iv), [], usePadding)
		let decryptedBytes = new Uint8Array(bitArrayToUint8Array(decrypted))
		return decryptedBytes
	} catch (e) {
		throw new CryptoError("aes decryption failed", e)
	}
}

function getSubKeys(key: Aes128Key, mac: boolean): {mKey:?Aes128Key, cKey:Aes128Key} {
	if (mac) {
		let hashedKey = hash(bitArrayToUint8Array(key));
		return {
			cKey: uint8ArrayToBitArray(hashedKey.subarray(0, 16)),
			mKey: uint8ArrayToBitArray(hashedKey.subarray(16, 32))
		}
	} else {
		return {
			cKey: key,
			mKey: null
		}
	}
}

/************************ Webcrypto AES256 ************************/


/**
 * Encrypts bytes with AES in GCM mode using the webcrypto API.
 * @param key The key to use for the encryption.
 * @param bytes The plain text.
 * @param iv The initialization vector.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @param useMac Not used because gcm always contains a mac. Just exists for interface compatibility with AES 128
 * @return The encrypted text as words (sjcl internal structure)..
 */
export function aes256EncryptFile(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean = true, useMac: boolean = true): Promise<Uint8Array> {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_256)
	if (usePadding) {
		bytes = pad(bytes) // TODO (bdeterding) consider implementing padding for bit array.
	}
	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `)
	}
	return importAesKey(key).then(cryptoKey => {
		return crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				iv: iv,
				tagLength: TAG_BIT_LENGTH
			},
			cryptoKey,
			bytes
		).then(function (encrypted) {
			return concat(iv, new Uint8Array(encrypted))
		})
	}).catch(e => {
		throw new CryptoError("aes encryption failed (webcrypto)", e)
	})
}

/**
 * Decrypts the given words with AES in GCM mode using the webcrypto API.
 * @param key The key to use for the decryption.
 * @param words The ciphertext encoded as words.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return The decrypted bytes.
 */
export function aes256DecryptFile(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean = true): Promise<Uint8Array> {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_256)
	// take the iv from the front of the encrypted data
	let iv = encryptedBytes.slice(0, IV_BYTE_LENGTH)
	let ciphertext = encryptedBytes.slice(IV_BYTE_LENGTH)

	return importAesKey(key).then(cryptoKey => {
		return crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: iv,
				tagLength: TAG_BIT_LENGTH
			},
			cryptoKey,
			ciphertext
		).then(function (decrypted) {
			let decryptedBytes = new Uint8Array(decrypted)
			if (usePadding) {
				decryptedBytes = unpad(decryptedBytes)
			}
			return decryptedBytes
		})
	}).catch(e => {
		throw new CryptoError("aes decryption failed (webcrypto)", e)
	})
}

function importAesKey(key: Aes128Key|Aes256Key): Promise<CryptoKey> {
	// convert native promise into bluebird promise
	var keyArray = bitArrayToUint8Array(key);
	return Promise.resolve(crypto.subtle.importKey(
		"raw",
		keyArray,
		keyArray.length === 128 ? "AES-CBC" : "AES-GCM",
		false,
		["encrypt", "decrypt"]
	))
}
