import sjcl from "../internal/sjcl.js"
import { random } from "../random/Randomizer.js"
import { BitArray, bitArrayToUint8Array, uint8ArrayToBitArray } from "../misc/Utils.js"
import { arrayEquals, concat, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { sha256Hash } from "../hashes/Sha256.js"
import { CryptoError } from "../misc/CryptoError.js"
import { sha512Hash } from "../hashes/Sha512.js"

export const ENABLE_MAC = true
export const IV_BYTE_LENGTH = 16
export const KEY_LENGTH_BYTES_AES_256 = 32
const KEY_LENGTH_BITS_AES_256 = KEY_LENGTH_BYTES_AES_256 * 8
export const KEY_LENGTH_BYTES_AES_128 = 16
const KEY_LENGTH_BITS_AES_128 = KEY_LENGTH_BYTES_AES_128 * 8
const MAC_ENABLED_PREFIX = 1
const MAC_LENGTH_BYTES = 32

export type Aes256Key = BitArray
export type Aes128Key = BitArray

/**
 * @return the key length in bytes
 */
export function getKeyLengthBytes(key: Aes128Key | Aes256Key): number {
	// stored as an array of 32-bit (4 byte) integers
	return key.length * 4
}

export function aes256RandomKey(): Aes256Key {
	return uint8ArrayToBitArray(random.generateRandomData(KEY_LENGTH_BYTES_AES_256))
}

export function generateIV(): Uint8Array {
	return random.generateRandomData(IV_BYTE_LENGTH)
}

/**
 * Encrypts bytes with AES 256 in CBC mode.
 * @param key The key to use for the encryption.
 * @param bytes The plain text.
 * @param iv The initialization vector.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @param useMac If true, a 256 bit HMAC is appended to the encrypted data.
 * @return The encrypted text as words (sjcl internal structure)..
 */
export function aes256Encrypt(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean = true, useMac: boolean = true): Uint8Array {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_256)

	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `)
	}

	let subKeys = getAes256SubKeys(key, useMac)
	let encryptedBits = sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(bytes), uint8ArrayToBitArray(iv), [], usePadding)
	let data = concat(iv, bitArrayToUint8Array(encryptedBits))

	if (useMac) {
		let hmac = new sjcl.misc.hmac(subKeys.mKey, sjcl.hash.sha256)
		let macBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(data)))
		data = concat(new Uint8Array([MAC_ENABLED_PREFIX]), data, macBytes)
	}

	return data
}

/**
 * Decrypts the given words with AES 256 in CBC mode.
 * @param key The key to use for the decryption.
 * @param encryptedBytes The ciphertext.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return The decrypted bytes.
 */
export function aes256Decrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean = true): Uint8Array {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_256)
	const useMac = encryptedBytes.length % 2 === 1
	const subKeys = getAes256SubKeys(key, useMac)
	let cipherTextWithoutMac

	if (useMac) {
		cipherTextWithoutMac = encryptedBytes.subarray(1, encryptedBytes.length - MAC_LENGTH_BYTES)
		const providedMacBytes = encryptedBytes.subarray(encryptedBytes.length - MAC_LENGTH_BYTES)
		const hmac = new sjcl.misc.hmac(subKeys.mKey, sjcl.hash.sha256)
		const computedMacBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(cipherTextWithoutMac)))

		if (!arrayEquals(providedMacBytes, computedMacBytes)) {
			throw new CryptoError("invalid mac")
		}
	} else {
		cipherTextWithoutMac = encryptedBytes
	}

	// take the iv from the front of the encrypted data
	const iv = cipherTextWithoutMac.slice(0, IV_BYTE_LENGTH)

	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Invalid IV length in AES256Decrypt: ${iv.length} bytes, must be 16 bytes (128 bits)`)
	}

	const ciphertext = cipherTextWithoutMac.slice(IV_BYTE_LENGTH)

	try {
		const decrypted = sjcl.mode.cbc.decrypt(new sjcl.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(ciphertext), uint8ArrayToBitArray(iv), [], usePadding)
		return new Uint8Array(bitArrayToUint8Array(decrypted))
	} catch (e) {
		throw new CryptoError("aes decryption failed", e as Error)
	}
}

function verifyKeySize(key: Aes128Key | Aes256Key, bitLength: number) {
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

	let subKeys = getAes128SubKeys(key, useMac)
	let encryptedBits = sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(bytes), uint8ArrayToBitArray(iv), [], usePadding)
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
 * @param encryptedBytes The ciphertext encoded as bytes.
 * @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
 * @return The decrypted bytes.
 */
export function aes128Decrypt(key: Aes128Key, encryptedBytes: Uint8Array, usePadding: boolean = true): Uint8Array {
	verifyKeySize(key, KEY_LENGTH_BITS_AES_128)
	let useMac = encryptedBytes.length % 2 === 1
	let subKeys = getAes128SubKeys(key, useMac)
	let cipherTextWithoutMac

	if (useMac) {
		cipherTextWithoutMac = encryptedBytes.subarray(1, encryptedBytes.length - MAC_LENGTH_BYTES)
		let providedMacBytes = encryptedBytes.subarray(encryptedBytes.length - MAC_LENGTH_BYTES)
		let hmac = new sjcl.misc.hmac(subKeys.mKey, sjcl.hash.sha256)
		let computedMacBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(cipherTextWithoutMac)))

		if (!arrayEquals(providedMacBytes, computedMacBytes)) {
			throw new CryptoError("invalid mac")
		}
	} else {
		cipherTextWithoutMac = encryptedBytes
	}

	// take the iv from the front of the encrypted data
	const iv = cipherTextWithoutMac.slice(0, IV_BYTE_LENGTH)

	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Invalid IV length in AES128Decrypt: ${iv.length} bytes, must be 16 bytes (128 bits)`)
	}

	let ciphertext = cipherTextWithoutMac.slice(IV_BYTE_LENGTH)

	try {
		let decrypted = sjcl.mode.cbc.decrypt(new sjcl.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(ciphertext), uint8ArrayToBitArray(iv), [], usePadding)
		return new Uint8Array(bitArrayToUint8Array(decrypted))
	} catch (e) {
		throw new CryptoError("aes decryption failed", e as Error)
	}
}

function getAes128SubKeys(
	key: Aes128Key,
	mac: boolean,
): {
	mKey: Aes128Key | null | undefined
	cKey: Aes128Key
} {
	if (mac) {
		let hashedKey = sha256Hash(bitArrayToUint8Array(key))
		return {
			cKey: uint8ArrayToBitArray(hashedKey.subarray(0, KEY_LENGTH_BYTES_AES_128)),
			mKey: uint8ArrayToBitArray(hashedKey.subarray(KEY_LENGTH_BYTES_AES_128, KEY_LENGTH_BYTES_AES_128 * 2)),
		}
	} else {
		return {
			cKey: key,
			mKey: null,
		}
	}
}

function getAes256SubKeys(
	key: Aes256Key,
	mac: boolean,
): {
	mKey: Aes256Key | null | undefined
	cKey: Aes256Key
} {
	if (mac) {
		let hashedKey = sha512Hash(bitArrayToUint8Array(key))
		return {
			cKey: uint8ArrayToBitArray(hashedKey.subarray(0, KEY_LENGTH_BYTES_AES_256)),
			mKey: uint8ArrayToBitArray(hashedKey.subarray(KEY_LENGTH_BYTES_AES_256, KEY_LENGTH_BYTES_AES_256 * 2)),
		}
	} else {
		return {
			cKey: key,
			mKey: null,
		}
	}
}
