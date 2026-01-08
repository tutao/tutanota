/**
 * This is a wrapper for commonly used crypto functions, easier to inject/swap implementations and test.
 */
import crypto from "node:crypto"
import type { Base64 } from "@tutao/tutanota-utils"
import {
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	base64ToKey,
	decryptKey,
	encryptKey,
	random,
	uint8ArrayToKey,
	unauthenticatedAesDecrypt,
	unauthenticatedDecryptKey,
} from "@tutao/tutanota-crypto"

// the prng throws if it doesn't have enough entropy
// it may be called very early, so we need to seed it
// we do it here because it's the first place in the dep. chain that knows it's
// in node but the last one that knows the prng implementation
const seed = () => {
	const entropy = crypto.randomBytes(128)
	random
		.addEntropy([
			{
				source: "random",
				entropy: 128 * 8,
				data: Array.from(entropy),
			},
		])
		.then()
}

seed()

export interface CryptoFunctions {
	aesEncrypt(key: AesKey, bytes: Uint8Array): Uint8Array

	encryptKey(key: AesKey, bytes: AesKey): Uint8Array

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array): Uint8Array

	/**
	 * @deprecated
	 */
	unauthenticatedAesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array): Uint8Array
	/**
	 * @deprecated
	 */
	unauthenticatedDecryptKey(key: Aes256Key, encryptedBytes: Uint8Array): AesKey

	decryptKey(encryptionKey: AesKey, key: Uint8Array): AesKey

	bytesToKey(bytes: Uint8Array): AesKey

	base64ToKey(base64: Base64): AesKey

	verifySignature(pubKeyPem: string, data: Uint8Array, signature: Uint8Array): boolean

	randomBytes(nbrOfBytes: number): Uint8Array

	aes256RandomKey(): Aes256Key
}

export const cryptoFns: CryptoFunctions = {
	aesEncrypt(key: AesKey, bytes: Uint8Array): Uint8Array {
		return aesEncrypt(key, bytes)
	},
	encryptKey(key: AesKey, bytes: AesKey): Uint8Array {
		return encryptKey(key, bytes)
	},

	aesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array): Uint8Array {
		return aesDecrypt(key, encryptedBytes)
	},

	/**
	 * @deprecated
	 */
	unauthenticatedAesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array): Uint8Array {
		return unauthenticatedAesDecrypt(key, encryptedBytes)
	},

	/**
	 * @deprecated
	 */
	unauthenticatedDecryptKey(key: Aes256Key, encryptedBytes: Uint8Array): AesKey {
		return unauthenticatedDecryptKey(key, encryptedBytes)
	},

	decryptKey(encryptionKey: AesKey, key: Uint8Array): AesKey {
		return decryptKey(encryptionKey, key)
	},

	bytesToKey(bytes: Uint8Array): AesKey {
		return uint8ArrayToKey(bytes)
	},

	base64ToKey(base64: Base64): AesKey {
		return base64ToKey(base64)
	},

	/**
	 * verify a signature of some data with a given PEM-encoded spki public key
	 */
	verifySignature(pem: string, data: Uint8Array, signature: Uint8Array): boolean {
		return crypto.verify("SHA512", data, pem, signature)
	},

	randomBytes(nbrOfBytes: number): Uint8Array {
		try {
			// may fail if the entropy pools are exhausted
			return random.generateRandomData(nbrOfBytes)
		} catch (e) {
			seed()
			return random.generateRandomData(nbrOfBytes)
		}
	},

	aes256RandomKey(): Aes256Key {
		return aes256RandomKey()
	},
}
