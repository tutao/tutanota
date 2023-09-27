// @ts-ignore[untyped-import]
import { BigInteger, parseBigInt, RSAKey } from "../internal/crypto-jsbn-2012-08-09_1.js"
import type { Base64, Hex } from "@tutao/tutanota-utils"
import { base64ToHex, base64ToUint8Array, concat, int8ArrayToBase64, uint8ArrayToBase64, uint8ArrayToHex } from "@tutao/tutanota-utils"
import type { RsaPrivateKey, RsaPublicKey, RsaKeyPair } from "./RsaKeyPair.js"
import { CryptoError } from "../misc/CryptoError.js"
import { sha256Hash } from "../hashes/Sha256.js"

const RSA_KEY_LENGTH_BITS = 2048
const RSA_PUBLIC_EXPONENT = 65537

export function generateRsaKey(): RsaKeyPair {
	// jsbn is seeded inside, see SecureRandom.js
	try {
		let rsa = new RSAKey()
		rsa.generate(RSA_KEY_LENGTH_BITS, RSA_PUBLIC_EXPONENT.toString(16)) // must be hex for JSBN

		return {
			publicKey: {
				version: 0,
				keyLength: RSA_KEY_LENGTH_BITS,
				modulus: uint8ArrayToBase64(new Uint8Array(rsa.n.toByteArray())),
				publicExponent: RSA_PUBLIC_EXPONENT,
			},
			privateKey: {
				version: 0,
				keyLength: RSA_KEY_LENGTH_BITS,
				modulus: uint8ArrayToBase64(new Uint8Array(rsa.n.toByteArray())),
				privateExponent: uint8ArrayToBase64(new Uint8Array(rsa.d.toByteArray())),
				primeP: uint8ArrayToBase64(new Uint8Array(rsa.p.toByteArray())),
				primeQ: uint8ArrayToBase64(new Uint8Array(rsa.q.toByteArray())),
				primeExponentP: uint8ArrayToBase64(new Uint8Array(rsa.dmp1.toByteArray())),
				primeExponentQ: uint8ArrayToBase64(new Uint8Array(rsa.dmq1.toByteArray())),
				crtCoefficient: uint8ArrayToBase64(new Uint8Array(rsa.coeff.toByteArray())),
			},
		}
	} catch (e) {
		throw new CryptoError("failed RSA key generation", e as Error)
	}
}

export function rsaEncrypt(publicKey: RsaPublicKey, bytes: Uint8Array, seed: Uint8Array): Uint8Array {
	const rsa = new RSAKey()
	// we have double conversion from bytes to hex to big int because there is no direct conversion from bytes to big int
	// BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
	rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(publicKey.modulus)))
	rsa.e = publicKey.publicExponent
	const paddedBytes = oaepPad(bytes, publicKey.keyLength, seed)
	const paddedHex = uint8ArrayToHex(paddedBytes)
	const bigInt = parseBigInt(paddedHex, 16)
	let encrypted

	try {
		// toByteArray() produces Array so we convert it to buffer.
		encrypted = new Uint8Array(rsa.doPublic(bigInt).toByteArray())
	} catch (e) {
		throw new CryptoError("failed RSA encryption", e as Error)
	}

	// the encrypted value might have leading zeros or needs to be padded with zeros
	return _padAndUnpadLeadingZeros(publicKey.keyLength / 8, encrypted)
}

export function rsaDecrypt(privateKey: RsaPrivateKey, bytes: Uint8Array): Uint8Array {
	try {
		const rsa = new RSAKey()
		// we have double conversion from bytes to hex to big int because there is no direct conversion from bytes to big int
		// BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
		rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.modulus)))
		rsa.d = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.privateExponent)))
		rsa.p = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeP)))
		rsa.q = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeQ)))
		rsa.dmp1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentP)))
		rsa.dmq1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentQ)))
		rsa.coeff = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.crtCoefficient)))
		const hex = uint8ArrayToHex(bytes)
		const bigInt = parseBigInt(hex, 16)
		const decrypted = new Uint8Array(rsa.doPrivate(bigInt).toByteArray())

		// the decrypted value might have leading zeros or needs to be padded with zeros
		const paddedDecrypted = _padAndUnpadLeadingZeros(privateKey.keyLength / 8 - 1, decrypted)

		return oaepUnpad(paddedDecrypted, privateKey.keyLength)
	} catch (e) {
		throw new CryptoError("failed RSA decryption", e as Error)
	}
}

/**
 * Adds leading 0's to the given byte array until targeByteLength bytes are reached. Removes leading 0's if byteArray is longer than targetByteLength.
 */
export function _padAndUnpadLeadingZeros(targetByteLength: number, byteArray: Uint8Array): Uint8Array {
	const result = new Uint8Array(targetByteLength)

	// JSBN produces results which are not always exact length.
	// The byteArray might have leading 0 that make it larger than the actual result array length.
	// Here we cut them off
	// byteArray [0, 0, 1, 1, 1]
	// target       [0, 0, 0, 0]
	// result       [0, 1, 1, 1]
	if (byteArray.length > result.length) {
		const lastExtraByte = byteArray[byteArray.length - result.length - 1]

		if (lastExtraByte !== 0) {
			throw new CryptoError(`leading byte is not 0 but ${lastExtraByte}, encrypted length: ${byteArray.length}`)
		}

		byteArray = byteArray.slice(byteArray.length - result.length)
	}

	// If the byteArray is not as long as the result array we add leading 0's
	// byteArray     [1, 1, 1]
	// target     [0, 0, 0, 0]
	// result     [0, 1, 1, 1]
	result.set(byteArray, result.length - byteArray.length)
	return result
}

/********************************* OAEP *********************************/

/**
 * Optimal Asymmetric Encryption Padding (OAEP) / RSA padding
 * @see https://tools.ietf.org/html/rfc3447#section-7.1
 *
 * @param value The byte array to encode.
 * @param keyLength The length of the RSA key in bit.
 * @param seed An array of 32 random bytes.
 * @return The padded byte array.
 */
export function oaepPad(value: Uint8Array, keyLength: number, seed: Uint8Array): Uint8Array {
	let hashLength = 32 // bytes sha256

	if (seed.length !== hashLength) {
		throw new CryptoError("invalid seed length: " + seed.length + ". expected: " + hashLength + " bytes!")
	}

	if (value.length > keyLength / 8 - hashLength - 1) {
		throw new CryptoError("invalid value length: " + value.length + ". expected: max. " + (keyLength / 8 - hashLength - 1))
	}

	let block = _getPSBlock(value, keyLength)

	let dbMask = mgf1(seed, block.length - hashLength)

	for (let i = hashLength; i < block.length; i++) {
		block[i] ^= dbMask[i - hashLength]
	}

	// same as invoking sha256 directly because only one block is hashed
	let seedMask = mgf1(block.slice(hashLength, block.length), hashLength)

	for (let i = 0; i < seedMask.length; i++) {
		block[i] = seed[i] ^ seedMask[i]
	}

	return block
}

/**
 * @param value The byte array to unpad.
 * @param keyLength The length of the RSA key in bit.
 * @return The unpadded byte array.
 */
export function oaepUnpad(value: Uint8Array, keyLength: number): Uint8Array {
	let hashLength = 32 // bytes sha256

	if (value.length !== keyLength / 8 - 1) {
		throw new CryptoError("invalid value length: " + value.length + ". expected: " + (keyLength / 8 - 1) + " bytes!")
	}

	let seedMask = mgf1(value.slice(hashLength, value.length), hashLength)
	let seed = new Uint8Array(hashLength)

	for (let i = 0; i < seedMask.length; i++) {
		seed[i] = value[i] ^ seedMask[i]
	}

	let dbMask = mgf1(seed, value.length - hashLength)

	for (let i = hashLength; i < value.length; i++) {
		value[i] ^= dbMask[i - hashLength]
	}

	// check that the zeros and the one is there
	for (var index = 2 * hashLength; index < value.length; index++) {
		if (value[index] === 1) {
			// found the 0x01
			break
		} else if (value[index] !== 0 || index === value.length) {
			throw new CryptoError("invalid padding")
		}
	}

	return value.slice(index + 1, value.length)
}

/**
 * Provides a block of keyLength / 8 - 1 bytes with the following format:
 * [ zeros ] [ label hash ] [ zeros ] [ 1 ] [ value ]
 *    32           32    keyLen-2*32-2  1  value.length
 * The label is the hash of an empty string like defined in PKCS#1 v2.1
 */
export function _getPSBlock(value: Uint8Array, keyLength: number): Uint8Array {
	let hashLength = 32 // bytes sha256

	let blockLength = keyLength / 8 - 1 // the leading byte shall be 0 to make the resulting value in any case smaller than the modulus, so we just leave the byte off

	let block = new Uint8Array(blockLength)
	let defHash = sha256Hash(new Uint8Array([])) // empty label

	let nbrOfZeros = block.length - (1 + value.length)

	for (let i = 0; i < block.length; i++) {
		if (i >= hashLength && i < 2 * hashLength) {
			block[i] = defHash[i - hashLength]
		} else if (i < nbrOfZeros) {
			block[i] = 0
		} else if (i === nbrOfZeros) {
			block[i] = 1
		} else {
			block[i] = value[i - nbrOfZeros - 1]
		}
	}

	return block
}

/********************************* PSS *********************************/

/**
 * @param message The byte array to encode.
 * @param keyLength The length of the RSA key in bit.
 * @param salt An array of random bytes.
 * @return The padded byte array.
 */
export function encode(message: Uint8Array, keyLength: number, salt: Uint8Array): Uint8Array {
	let hashLength = 32 // bytes sha256

	let emLen = Math.ceil(keyLength / 8)

	if (salt.length !== hashLength) {
		throw new Error("invalid _salt length: " + salt.length + ". expected: " + hashLength + " bytes!")
	}

	let length = hashLength + salt.length + 2

	if (emLen < length) {
		throw new Error("invalid hash/_salt length: " + length + ". expected: max. " + emLen)
	}

	let emBits = keyLength - 1
	let minEmBitsLength = 8 * hashLength + 8 * salt.length + 9

	if (emBits < minEmBitsLength) {
		throw new Error("invalid maximum emBits length. Was " + emBits + ", expected: " + minEmBitsLength)
	}

	let messageHash = sha256Hash(message)
	//  M' = (0x)00 00 00 00 00 00 00 00 || mHash || _salt
	let message2 = concat(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]), messageHash, salt)
	let message2Hash = sha256Hash(message2)
	let ps = new Uint8Array(emLen - salt.length - hashLength - 2)

	for (let i = 0; i < ps.length; i++) {
		ps[i] = 0
	}

	let db = concat(ps, new Uint8Array([1]), salt)

	_clear(ps)

	let expectedDbLength = emLen - hashLength - 1

	if (db.length !== expectedDbLength) {
		throw new Error("unexpected length of block: " + db.length + ". Expected: " + expectedDbLength)
	}

	let dbMask = mgf1(message2Hash, emLen - message2Hash.length - 1)
	let maskedDb = new Uint8Array(dbMask.length)

	for (let i = 0; i < dbMask.length; i++) {
		maskedDb[i] = db[i] ^ dbMask[i]
	}

	_clear(db)

	maskedDb[0] &= 0xff >> (8 * emLen - emBits)
	let em = concat(maskedDb, message2Hash, new Uint8Array([188])) // 0xbc

	_clear(maskedDb)

	return em
}

/**
 * clears an array to contain only zeros (0)
 */
function _clear(array: Uint8Array | null | undefined) {
	if (!array) {
		return
	}

	array.fill(0)
}

/********************************* RSA utils *********************************/

/**
 * @param seed An array of byte values.
 * @param length The length of the return value in bytes.
 */
export function mgf1(seed: Uint8Array, length: number): Uint8Array {
	let C: Uint8Array | null = null
	let counter = 0
	let T = new Uint8Array(0)

	do {
		C = i2osp(counter)
		T = concat(T, sha256Hash(concat(seed, C)))
	} while (++counter < Math.ceil(length / (256 / 8)))

	return T.slice(0, length)
}

/**
 * converts an integer to a 4 byte array
 */
export function i2osp(i: number): Uint8Array {
	return new Uint8Array([(i >> 24) & 255, (i >> 16) & 255, (i >> 8) & 255, (i >> 0) & 255])
}

/********************************* Key conversion *********************************/

/**
 * @param publicKey
 * @returns The public key in a persistable array format
 * @private
 */
function _publicKeyToArray(publicKey: RsaPublicKey): BigInteger[] {
	return [_base64ToBigInt(publicKey.modulus)]
}

/**
 * @param privateKey
 * @returns The private key in a persistable array format
 * @private
 */
function _privateKeyToArray(privateKey: RsaPrivateKey): BigInteger[] {
	return [
		_base64ToBigInt(privateKey.modulus),
		_base64ToBigInt(privateKey.privateExponent),
		_base64ToBigInt(privateKey.primeP),
		_base64ToBigInt(privateKey.primeQ),
		_base64ToBigInt(privateKey.primeExponentP),
		_base64ToBigInt(privateKey.primeExponentQ),
		_base64ToBigInt(privateKey.crtCoefficient),
	]
}

function _arrayToPublicKey(publicKey: BigInteger[]): RsaPublicKey {
	return {
		version: 0,
		keyLength: RSA_KEY_LENGTH_BITS,
		modulus: int8ArrayToBase64(new Int8Array(publicKey[0].toByteArray())),
		publicExponent: RSA_PUBLIC_EXPONENT,
	}
}

function _arrayToPrivateKey(privateKey: BigInteger[]): RsaPrivateKey {
	return {
		version: 0,
		keyLength: RSA_KEY_LENGTH_BITS,
		modulus: int8ArrayToBase64(new Int8Array(privateKey[0].toByteArray())),
		privateExponent: int8ArrayToBase64(new Int8Array(privateKey[1].toByteArray())),
		primeP: int8ArrayToBase64(new Int8Array(privateKey[2].toByteArray())),
		primeQ: int8ArrayToBase64(new Int8Array(privateKey[3].toByteArray())),
		primeExponentP: int8ArrayToBase64(new Int8Array(privateKey[4].toByteArray())),
		primeExponentQ: int8ArrayToBase64(new Int8Array(privateKey[5].toByteArray())),
		crtCoefficient: int8ArrayToBase64(new Int8Array(privateKey[6].toByteArray())),
	}
}

function _base64ToBigInt(base64: Base64): BigInteger {
	return parseBigInt(base64ToHex(base64), 16)
}

/**
 * Provides the length of the given string as hex string of 4 characters length. Padding to 4 characters is done with '0'.
 * @param {string} string A string to get the length of.
 * @return {string} A hex string containing the length of string.
 */
function _hexLen(string: string): Hex {
	var hexLen = string.length.toString(16)

	while (hexLen.length < 4) {
		hexLen = "0" + hexLen
	}

	return hexLen
}

export function _keyArrayToHex(key: BigInteger[]): Hex {
	var hex = ""

	for (var i = 0; i < key.length; i++) {
		var param = key[i].toString(16)

		if (param.length % 2 === 1) {
			param = "0" + param
		}

		hex += _hexLen(param) + param
	}

	return hex
}

function _hexToKeyArray(hex: Hex): BigInteger[] {
	try {
		var key: BigInteger[] = []
		var pos = 0

		while (pos < hex.length) {
			var nextParamLen = parseInt(hex.substring(pos, pos + 4), 16)
			pos += 4
			key.push(parseBigInt(hex.substring(pos, pos + nextParamLen), 16))
			pos += nextParamLen
		}

		_validateKeyLength(key)

		return key
	} catch (e) {
		throw new CryptoError("hex to rsa key failed", e as Error)
	}
}

function _validateKeyLength(key: BigInteger[]) {
	if (key.length !== 1 && key.length !== 7) {
		throw new Error("invalid key params")
	}

	if (key[0].bitLength() < RSA_KEY_LENGTH_BITS - 1 || key[0].bitLength() > RSA_KEY_LENGTH_BITS) {
		throw new Error("invalid key length, expected: around " + RSA_KEY_LENGTH_BITS + ", but was: " + key[0].bitLength())
	}
}

export function privateKeyToHex(privateKey: RsaPrivateKey): Hex {
	return _keyArrayToHex(_privateKeyToArray(privateKey))
}

export function publicKeyToHex(publicKey: RsaPublicKey): Hex {
	return _keyArrayToHex(_publicKeyToArray(publicKey))
}

export function hexToPrivateKey(privateKeyHex: Hex): RsaPrivateKey {
	return _arrayToPrivateKey(_hexToKeyArray(privateKeyHex))
}

export function hexToPublicKey(publicKeyHex: Hex): RsaPublicKey {
	return _arrayToPublicKey(_hexToKeyArray(publicKeyHex))
}
