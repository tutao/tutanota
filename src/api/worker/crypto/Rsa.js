// @flow
import {
	base64ToHex,
	base64ToUint8Array,
	hexToUint8Array,
	int8ArrayToBase64,
	uint8ArrayToBase64,
	uint8ArrayToHex
} from "../../common/utils/Encoding"
import {arrayEquals, concat} from "../../common/utils/ArrayUtils"
import {hash} from "./Sha256"
import {random} from "./Randomizer"
import {CryptoError} from "../../common/error/CryptoError"
import {assertWorkerOrNode, Mode} from "../../Env"
import JSBN from "./lib/crypto-jsbn-2012-08-09_1"
import {rsaApp} from "../../../native/RsaApp" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
const RSAKey = JSBN.RSAKey
const parseBigInt = JSBN.parseBigInt
const BigInteger = JSBN.BigInteger

assertWorkerOrNode()

const keyLengthInBits = 2048
const publicExponent = 65537

/**
 * Returns the newly generated key
 * @param keyLength
 * @return resolves to the the generated keypair
 */
export function generateRsaKey(): Promise<RsaKeyPair> {
	if (env.mode === Mode.App) {
		return rsaApp.generateRsaKey(random.generateRandomData(512))
	} else {
		return Promise.resolve(generateRsaKeySync())
	}
}

export function generateRsaKeySync(): RsaKeyPair {
	try {
		let rsa = new RSAKey()
		rsa.generate(keyLengthInBits, publicExponent.toString(16)) // must be hex for JSBN
		return {
			publicKey: {
				version: 0,
				keyLength: keyLengthInBits,
				modulus: uint8ArrayToBase64(new Uint8Array(rsa.n.toByteArray())),
				publicExponent: publicExponent
			},
			privateKey: {
				version: 0,
				keyLength: keyLengthInBits,
				modulus: uint8ArrayToBase64(new Uint8Array(rsa.n.toByteArray())),
				privateExponent: uint8ArrayToBase64(new Uint8Array(rsa.d.toByteArray())),
				primeP: uint8ArrayToBase64(new Uint8Array(rsa.p.toByteArray())),
				primeQ: uint8ArrayToBase64(new Uint8Array(rsa.q.toByteArray())),
				primeExponentP: uint8ArrayToBase64(new Uint8Array(rsa.dmp1.toByteArray())),
				primeExponentQ: uint8ArrayToBase64(new Uint8Array(rsa.dmq1.toByteArray())),
				crtCoefficient: uint8ArrayToBase64(new Uint8Array(rsa.coeff.toByteArray()))
			}
		}
	} catch (e) {
		throw new CryptoError("failed RSA key generation", e)
	}
}

/**
 * Encrypt bytes with the provided publicKey
 * @param publicKey
 * @param bytes
 * @return returns the encrypted bytes.
 */
export function rsaEncrypt(publicKey: PublicKey, bytes: Uint8Array): Promise<Uint8Array> {
	let seed = random.generateRandomData(32)
	if (env.mode === Mode.App) {
		return rsaApp.rsaEncrypt(publicKey, bytes, seed)
	} else {
		try {
			return Promise.resolve(rsaEncryptSync(publicKey, bytes, seed))
		} catch (e) {
			return Promise.reject(e)
		}
	}
}

export function rsaEncryptSync(publicKey: PublicKey, bytes: Uint8Array, seed: Uint8Array): Uint8Array {
	try {
		let rsa = new RSAKey()
		//FIXME remove double conversion
		rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(publicKey.modulus))) // BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
		rsa.e = publicKey.publicExponent
		let paddedBytes = oaepPad(bytes, publicKey.keyLength, seed)
		let paddedHex = _bytesToHex(paddedBytes)

		let bigInt = parseBigInt(paddedHex, 16)
		let encrypted = rsa.doPublic(bigInt)

		//FIXME remove hex conversion

		let encryptedHex = encrypted.toString(16)
		if ((encryptedHex.length % 2) === 1) {
			encryptedHex = "0" + encryptedHex
		}

		return hexToUint8Array(encryptedHex)
	} catch (e) {
		throw new CryptoError("failed RSA encryption", e)
	}
}

/**
 * Decrypt bytes with the provided privateKey
 * @param privateKey
 * @param bytes
 * @return returns the decrypted bytes.
 */
export function rsaDecrypt(privateKey: PrivateKey, bytes: Uint8Array): Promise<Uint8Array> {
	if (env.mode === Mode.App) {
		return rsaApp.rsaDecrypt(privateKey, bytes)
	} else {
		try {
			return Promise.resolve(rsaDecryptSync(privateKey, bytes))
		} catch (e) {
			return Promise.reject(e)
		}
	}
}

export function rsaDecryptSync(privateKey: PrivateKey, bytes: Uint8Array): Uint8Array {
	try {
		let rsa = new RSAKey()
		//FIXME remove double conversion
		// BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
		rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.modulus)))
		rsa.d = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.privateExponent)))
		rsa.p = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeP)))
		rsa.q = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeQ)))
		rsa.dmp1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentP)))
		rsa.dmq1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentQ)))
		rsa.coeff = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.crtCoefficient)))

		//FIXME remove hex conversion
		let hex = _bytesToHex(bytes)
		let bigInt = parseBigInt(hex, 16)
		let paddedBigInt = rsa.doPrivate(bigInt)
		let decryptedHex = paddedBigInt.toString(16)
		// fill the hex string to have a padded block of exactly (keylength / 8 - 1 bytes) for the unpad function
		// two possible reasons for smaller string:
		// - one "0" of the byte might be missing because toString(16) does not consider this
		// - the bigint value might be smaller than (keylength / 8 - 1) bytes
		let expectedPaddedHexLength = (privateKey.keyLength / 8 - 1) * 2
		let fill = Array(expectedPaddedHexLength - decryptedHex.length + 1).join("0") // creates the missing zeros
		decryptedHex = fill + decryptedHex
		let paddedBytes = hexToUint8Array(decryptedHex)
		return oaepUnpad(paddedBytes, privateKey.keyLength)
	} catch (e) {
		throw new CryptoError("failed RSA decryption", e)
	}
}

/**
 * Sign bytes with the provided privateKey
 * @see http://world.std.com/~dtd/sign_encrypt/sign_encrypt7.html
 * @param privateKey
 * @param bytes
 * @return returns the signature.
 */
export function sign(privateKey: PrivateKey, bytes: Uint8Array): Uint8Array {
	try {
		let rsa = new RSAKey()
		// BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
		rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.modulus)))
		rsa.d = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.privateExponent)))
		rsa.p = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeP)))
		rsa.q = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeQ)))
		rsa.dmp1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentP)))
		rsa.dmq1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentQ)))
		rsa.coeff = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.crtCoefficient)))

		var salt = random.generateRandomData(32);
		let paddedBytes = encode(bytes, privateKey.keyLength, salt)
		let paddedHex = _bytesToHex(paddedBytes)

		let bigInt = parseBigInt(paddedHex, 16)
		let signed = rsa.doPrivate(bigInt)

		let signedHex = signed.toString(16)
		if ((signedHex.length % 2) === 1) {
			signedHex = "0" + signedHex
		}

		return hexToUint8Array(signedHex)
	} catch (e) {
		throw new CryptoError("failed RSA sign", e)
	}
}


/**
 * Verify the signature.
 * @param publicKey
 * @param bytes
 * @param signature
 * @throws CryptoError if the signature is not valid
 */
export function verifySignature(publicKey: PublicKey, bytes: Uint8Array, signature: Uint8Array) {
	try {
		let rsa = new RSAKey()
		rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(publicKey.modulus))) // BigInteger of JSBN uses a signed byte array and we convert to it by using Int8Array
		rsa.e = publicKey.publicExponent

		let signatureHex = _bytesToHex(signature)
		let bigInt = parseBigInt(signatureHex, 16)
		let padded = rsa.doPublic(bigInt)

		let paddedHex = padded.toString(16)
		if ((paddedHex.length % 2) === 1) {
			paddedHex = "0" + paddedHex
		}
		let paddedBytes = hexToUint8Array(paddedHex)
		_verify(bytes, paddedBytes, publicKey.keyLength - 1)
	} catch (e) {
		throw new CryptoError("failed RSA verify sign", e)
	}
}


// TODO remove the following functions
function _uint8ArrayToByteArray(uint8Array) {
	return [].slice.call(uint8Array)
}

function _bytesToHex(bytes) {
	return uint8ArrayToHex(new Uint8Array(bytes))
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
	if (value.length > (keyLength / 8 - hashLength - 1)) {
		throw new CryptoError("invalid value length: " + value.length + ". expected: max. "
			+ (keyLength / 8 - hashLength - 1))
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
		throw new CryptoError("invalid value length: " + value.length + ". expected: " + (keyLength / 8 - 1)
			+ " bytes!")
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
export function _getPSBlock(value: Uint8Array, keyLength: number) {
	let hashLength = 32 // bytes sha256
	let blockLength = keyLength / 8 - 1 // the leading byte shall be 0 to make the resulting value in any case smaller than the modulus, so we just leave the byte off
	let block = new Uint8Array(blockLength)

	let defHash = hash(new Uint8Array([])) // empty label

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

	let messageHash = hash(message)

	//  M' = (0x)00 00 00 00 00 00 00 00 || mHash || _salt
	let message2 = concat(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]), messageHash, salt)

	let message2Hash = hash(message2)

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

	maskedDb[0] &= (0xff >> (8 * emLen - emBits))

	let em = concat(maskedDb, message2Hash, new Uint8Array([188])) // 0xbc
	_clear(maskedDb)

	return em
}

/**
 * @see https://tools.ietf.org/html/rfc3447#section-9.1.2
 * @param message The message to verify.
 * @param encodedMessage The encodedMessage to verify against (derived from signature).
 * @param keyLength The length of the RSA key in bit.
 * @throws CryptoError if the hashes do not match
 */
export function _verify(message: Uint8Array, encodedMessage: Uint8Array, keyLength: number) {
	let hashLength = 32 // bytes sha256
	let saltLength = hashLength
	let emLen = Math.ceil(keyLength / 8)
	let minEncodedLength = hashLength + saltLength + 2
	try {

		if (encodedMessage.length < minEncodedLength) {
			throw new Error("invalid length of encoded message: " + encodedMessage.length + ". expected: > "
				+ minEncodedLength + " bytes!")
		}
		if (encodedMessage[encodedMessage.length - 1] !== 188) {
			throw new Error("rightmost octet of EM must be 188 (0xbc) but was " + encodedMessage[encodedMessage.length
			- 1])
		}

		var maskedDB = encodedMessage.slice(0, emLen - hashLength - 1)
		var hashed = encodedMessage.slice(emLen - hashLength - 1, emLen - hashLength - 1 + hashLength)

		// If the leftmost 8emLen - emBits bits of the leftmost octet in maskedDB are not all equal to zero, output "inconsistent" and stop.
		if ((maskedDB[0] >> 8 - (8 * emLen - keyLength)) !== 0) {
			throw new Error("inconsistent leftmost octet in maskedDB.")
		}

		var dbMask = mgf1(hashed, emLen - hashLength - 1)

		var db = new Uint8Array(dbMask.length)
		for (let i = 0; i < dbMask.length; i++) {
			db[i] = maskedDB[i] ^ dbMask[i]
		}

		db[0] &= (0xff >> (8 * emLen - keyLength))

		for (let i = 0; i < emLen - hashLength - saltLength - 2; i++) {
			if (db[i] !== 0) {
				throw new Error("inconsistent leftmost octets of db.")
			}
		}

		if (db[emLen - hashLength - saltLength - 2] !== 1) {
			throw new Error("inconsistent octet value in db. Expected 1 (0x01) but was " + db[emLen - hashLength
			- saltLength - 1])
		}

		var salt = db.slice(db.length - saltLength)

		var messageHash = hash(message)
		var message2 = concat(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]), messageHash, salt)
		var message2Hash = hash(message2)

		if (!arrayEquals(hashed, message2Hash)) {
			throw new CryptoError("Hashes do not match")
		}
	} finally {
		_clear(message)
		_clear(encodedMessage)
		_clear(maskedDB)
		_clear(hashed)
		_clear(dbMask)
		_clear(db)
		_clear(salt)
		_clear(messageHash)
		_clear(message2)
		_clear(message2Hash)
	}
}

/**
 * clears an array to contain only zeros (0)
 */
function _clear(array: ?Uint8Array) {
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
	let C = null
	let counter = 0
	let T = new Uint8Array(0)

	do {
		C = i2osp(counter)
		T = concat(T, hash(concat(seed, C)))
	} while (++counter < Math.ceil(length / (256 / 8)))

	return T.slice(0, length)
}

/**
 * converts an integer to a 4 byte array
 */
export function i2osp(i: number): Uint8Array {
	return new Uint8Array([
		(i >> 24) & 255,
		(i >> 16) & 255,
		(i >> 8) & 255,
		(i >> 0) & 255
	])
}

/********************************* Key conversion *********************************/


/**
 * @param publicKey
 * @returns The public key in a persistable array format
 * @private
 */
function _publicKeyToArray(publicKey: PublicKey): BigInteger[] {
	return [_base64ToBigInt(publicKey.modulus)]
}

/**
 * @param privateKey
 * @returns The private key in a persistable array format
 * @private
 */
function _privateKeyToArray(privateKey: PrivateKey): BigInteger[] {
	return [
		_base64ToBigInt(privateKey.modulus),
		_base64ToBigInt(privateKey.privateExponent),
		_base64ToBigInt(privateKey.primeP),
		_base64ToBigInt(privateKey.primeQ),
		_base64ToBigInt(privateKey.primeExponentP),
		_base64ToBigInt(privateKey.primeExponentQ),
		_base64ToBigInt(privateKey.crtCoefficient)
	]
}

function _arrayToPublicKey(publicKey: BigInteger[]): PublicKey {
	var self = this
	return {
		version: 0,
		keyLength: keyLengthInBits,
		modulus: int8ArrayToBase64(new Int8Array(publicKey[0].toByteArray())),
		publicExponent: publicExponent
	}
}

function _arrayToPrivateKey(privateKey: BigInteger[]): PrivateKey {
	return {
		version: 0,
		keyLength: keyLengthInBits,
		modulus: int8ArrayToBase64(new Int8Array(privateKey[0].toByteArray())),
		privateExponent: int8ArrayToBase64(new Int8Array(privateKey[1].toByteArray())),
		primeP: int8ArrayToBase64(new Int8Array(privateKey[2].toByteArray())),
		primeQ: int8ArrayToBase64(new Int8Array(privateKey[3].toByteArray())),
		primeExponentP: int8ArrayToBase64(new Int8Array(privateKey[4].toByteArray())),
		primeExponentQ: int8ArrayToBase64(new Int8Array(privateKey[5].toByteArray())),
		crtCoefficient: int8ArrayToBase64(new Int8Array(privateKey[6].toByteArray()))
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
		if ((param.length % 2) === 1) {
			param = "0" + param
		}
		hex += _hexLen(param) + param
	}
	return hex
}

function _hexToKeyArray(hex: Hex): BigInteger[] {
	try {
		var key = []
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
		throw new CryptoError("hex to rsa key failed", e)
	}
}

function _validateKeyLength(key: BigInteger[]) {
	if (key.length !== 1 && key.length !== 7) {
		throw new Error("invalid key params")
	}
	if (key[0].bitLength() < keyLengthInBits - 1 || key[0].bitLength() > keyLengthInBits) {
		throw new Error("invalid key length, expected: around " + keyLengthInBits + ", but was: " + key[0].bitLength())
	}
}

export function privateKeyToHex(privateKey: PrivateKey): Hex {
	return _keyArrayToHex(_privateKeyToArray(privateKey))
}

export function publicKeyToHex(publicKey: PublicKey): Hex {
	return _keyArrayToHex(_publicKeyToArray(publicKey))
}

export function hexToPrivateKey(privateKeyHex: Hex): PrivateKey {
	return _arrayToPrivateKey(_hexToKeyArray(privateKeyHex))
}

export function hexToPublicKey(publicKeyHex: Hex): PublicKey {
	return _arrayToPublicKey(_hexToKeyArray(publicKeyHex))
}
