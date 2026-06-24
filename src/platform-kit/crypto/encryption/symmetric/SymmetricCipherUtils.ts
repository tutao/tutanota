import { random } from "../../random/Randomizer.js"
import { CryptoError } from "@tutao/crypto/error"
import { base64ToBase64Url, base64ToUint8Array, hexToUint8Array, Nullable, uint8ArrayToArrayBuffer, uint8ArrayToBase64 } from "@tutao/utils"
import { sha256Hash } from "../../hashes/Sha256.js"
import sjcl from "../../internal/sjcl.js"
import { AesKeyLength, getKeyLengthInBytes, makeAesKey } from "./AesKeyLength.js"
import { KeyOrSubKey } from "./SymmetricKeyDeriver"
import { InitializationVectorVariant } from "./ParsedCiphertext"

export class InitializationVector {
	constructor(
		public readonly bytes: Uint8Array,
		public readonly variant: InitializationVectorVariant,
	) {}
}

export const FIXED_INITIALIZATION_VECTOR = new InitializationVector(hexToUint8Array("88888888888888888888888888888888"), InitializationVectorVariant.Fixed)
export const BLOCK_SIZE_BYTES = 16
export const INITIALIZATION_VECTOR_LENGTH_BYTES = BLOCK_SIZE_BYTES
export const KDF_NONCE_LENGTH_BYTES = 32
export const SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES = 1
export const SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES = 32

export type BitArray = number[]
export abstract class AesKey extends KeyOrSubKey {
	abstract readonly bits: BitArray
	abstract readonly keyLength: AesKeyLength
}

export class Aes256Key extends AesKey {
	keyLength: typeof AesKeyLength.Aes256 = AesKeyLength.Aes256

	/**
	 * The caller must ensure bits has the correct length.
	 */
	constructor(public readonly bits: BitArray) {
		super()
	}
}
export class Aes128Key extends AesKey {
	keyLength: typeof AesKeyLength.Aes128 = AesKeyLength.Aes128

	/**
	 * The caller must ensure bits has the correct length.
	 */
	constructor(public readonly bits: BitArray) {
		super()
	}
}

/**
 * Creates the auth verifier from the password key.
 * @param passwordKey The key.
 * @returns The auth verifier
 */
export function createAuthVerifier(passwordKey: AesKey): Uint8Array {
	return sha256Hash(keyToUint8Array(passwordKey))
}

export function createAuthVerifierAsBase64Url(passwordKey: AesKey): Base64Url {
	return base64ToBase64Url(uint8ArrayToBase64(createAuthVerifier(passwordKey)))
}

/**
 * Converts the given BitArray (SJCL) to an Uint8Array.
 * @param bits The BitArray.
 * @return The uint8array.
 */
export function bitArrayToUint8Array(bits: BitArray): Uint8Array {
	return new Uint8Array(sjcl.codec.arrayBuffer.fromBits(bits, false))
}

/**
 * Converts the given uint8array to a BitArray (SJCL).
 * @param uint8Array The uint8Array key.
 * @return The key.
 */
export function uint8ArrayToBitArray(uint8Array: Uint8Array): BitArray {
	return sjcl.codec.arrayBuffer.toBits(uint8ArrayToArrayBuffer(uint8Array))
}

export function keyToBase64(key: AesKey): Base64 {
	return uint8ArrayToBase64(keyToUint8Array(key))
}

/**
 * Converts the given base64 coded string to a key.
 * @param base64 The base64 coded string representation of the key.
 * @return The key.
 * @throws {CryptoError} If the conversion fails.
 */
export function base64ToKey(base64: Base64): AesKey
/**
 * Converts the given base64 coded string to a key.
 * @param base64 The base64 coded string representation of the key.
 * @param acceptedBitLength The accepted key length for the decoded key.
 * @return The key.
 * @throws {CryptoError} If the conversion fails.
 */
export function base64ToKey(base64: Base64, acceptedBitLength: typeof AesKeyLength.Aes128): Aes128Key
/**
 * Converts the given base64 coded string to a key.
 * @param base64 The base64 coded string representation of the key.
 * @param acceptedBitLength The accepted key length for the decoded key.
 * @return The key.
 * @throws {CryptoError} If the conversion fails.
 */
export function base64ToKey(base64: Base64, acceptedBitLength: typeof AesKeyLength.Aes256): Aes256Key
export function base64ToKey(base64: Base64, acceptedBitLength?: AesKeyLength): AesKey {
	try {
		return uint8ArrayToKey(base64ToUint8Array(base64), acceptedBitLength)
	} catch (e) {
		throw new CryptoError("hex to aes key failed", e as Error)
	}
}

export function uint8ArrayToKey(array: Uint8Array): AesKey
export function uint8ArrayToKey(array: Uint8Array, acceptedBitLengths: typeof AesKeyLength.Aes128): Aes128Key
export function uint8ArrayToKey(array: Uint8Array, acceptedBitLengths: typeof AesKeyLength.Aes256): Aes256Key
export function uint8ArrayToKey(array: Uint8Array, acceptedBitLength?: AesKeyLength): AesKey
export function uint8ArrayToKey(array: Uint8Array, acceptedBitLength?: AesKeyLength): AesKey {
	let key = uint8ArrayToBitArray(array)
	return makeAesKey(key, acceptedBitLength ? [acceptedBitLength] : undefined)
}

export function keyToUint8Array(key: AesKey): Uint8Array {
	return bitArrayToUint8Array(key.bits)
}

/**
 * Create a random 256-bit symmetric AES key.
 *
 * @return The key.
 */
export function aes256RandomKey(): Aes256Key {
	return new Aes256Key(uint8ArrayToBitArray(random.generateRandomData(getKeyLengthInBytes(AesKeyLength.Aes256))))
}

export type KdfNonce = Uint8Array & { readonly __brand: "KdfNonce" }

export function generateInitializationVector(): InitializationVector {
	return new InitializationVector(random.generateRandomData(INITIALIZATION_VECTOR_LENGTH_BYTES), InitializationVectorVariant.Random)
}

export function generateKdfNonce(): KdfNonce {
	return random.generateRandomData(KDF_NONCE_LENGTH_BYTES) as KdfNonce
}

export function validateInitializationVectorLength(initializationVector: Uint8Array): InitializationVector
export function validateInitializationVectorLength(initializationVector: Nullable<Uint8Array>): Nullable<InitializationVector>
export function validateInitializationVectorLength(initializationVector: Nullable<Uint8Array>): Nullable<InitializationVector> {
	if (initializationVector === null) {
		return null
	}
	if (initializationVector.length !== INITIALIZATION_VECTOR_LENGTH_BYTES) {
		throw new CryptoError(`invalid initialization vector length: ${initializationVector.length} bytes`)
	}
	return new InitializationVector(initializationVector, InitializationVectorVariant.Random)
}

export function validateKdfNonceLength(kdfNonce: Uint8Array): KdfNonce
export function validateKdfNonceLength(kdfNonce: Nullable<Uint8Array>): Nullable<KdfNonce>
export function validateKdfNonceLength(kdfNonce: Nullable<Uint8Array>): Nullable<KdfNonce> {
	if (kdfNonce === null) {
		return null
	}
	if (kdfNonce.length !== KDF_NONCE_LENGTH_BYTES) {
		throw new CryptoError(`invalid KDF nonce length: ${kdfNonce.length} bytes`)
	}
	return kdfNonce as KdfNonce
}
