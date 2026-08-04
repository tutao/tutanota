/**
 * This is a wrapper for commonly used crypto functions, easier to inject/swap implementations and test.
 */
import crypto from "node:crypto"
import {
	Aes256Key,
	aes256RandomKey,
	AesKey,
	base64ToKey,
	decryptKey,
	decryptKeyUnauthenticatedWithDeviceKeyChain,
	encryptKey,
	EntropySource,
	random,
	uint8ArrayToKey,
} from "@tutao/crypto"
import { aesDecrypt, aesDecryptUnauthenticated, aesEncrypt } from "../../../platform-kit/crypto/instance-pipeline-crypto/Aes"

import { EntropyDataChunk } from "../../../platform-kit/crypto/random/EntropyDataChunk"

// the prng throws if it doesn't have enough entropy
// it may be called very early, so we need to seed it
// we do it here because it's the first place in the dep. chain that knows it's
// in node but the last one that knows the prng implementation
const seed = () => {
	const entropy = Array.from(crypto.randomBytes(128))
	random.addEntropy(entropy.map((b) => new EntropyDataChunk(EntropySource.Random, 128 * 8, b))).then()
}

seed()

export interface CryptoFunctions {
	aesEncrypt(key: AesKey, bytes: Uint8Array): Uint8Array<ArrayBuffer>

	encryptKey(key: AesKey, bytes: AesKey): Uint8Array<ArrayBuffer>

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>
	/**
	 * @deprecated
	 */
	unauthenticatedAesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>
	/**
	 * @deprecated
	 */
	decryptKeyUnauthenticatedWithDeviceKeyChain(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): AesKey

	decryptKey(encryptionKey: AesKey, key: Uint8Array<ArrayBuffer>): AesKey

	bytesToKey(bytes: Uint8Array<ArrayBuffer>): AesKey

	base64ToKey(base64: Base64): AesKey

	verifySignature(pubKeyPem: string, data: Uint8Array<ArrayBuffer>, signature: Uint8Array<ArrayBuffer>): boolean

	randomBytes(nbrOfBytes: number): Uint8Array<ArrayBuffer>

	aes256RandomKey(): Aes256Key
}

export const cryptoFns: CryptoFunctions = {
	aesEncrypt(key: AesKey, bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return aesEncrypt(key, bytes)
	},
	encryptKey(key: AesKey, bytes: AesKey): Uint8Array<ArrayBuffer> {
		return encryptKey(key, bytes)
	},

	aesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return aesDecrypt(key, encryptedBytes)
	},

	/**
	 * @deprecated
	 */
	unauthenticatedAesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return aesDecryptUnauthenticated(key, encryptedBytes)
	},

	/**
	 * @deprecated
	 */
	decryptKeyUnauthenticatedWithDeviceKeyChain(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): AesKey {
		return decryptKeyUnauthenticatedWithDeviceKeyChain(key, encryptedBytes)
	},

	decryptKey(encryptionKey: AesKey, key: Uint8Array<ArrayBuffer>): AesKey {
		return decryptKey(encryptionKey, key)
	},

	bytesToKey(bytes: Uint8Array<ArrayBuffer>): AesKey {
		return uint8ArrayToKey(bytes)
	},

	base64ToKey(base64: Base64): AesKey {
		return base64ToKey(base64)
	},

	/**
	 * verify a signature of some data with a given PEM-encoded spki public key
	 */
	verifySignature(pem: string, data: Uint8Array, signature: Uint8Array<ArrayBuffer>): boolean {
		return crypto.verify("SHA512", data, pem, signature)
	},

	randomBytes(nbrOfBytes: number): Uint8Array<ArrayBuffer> {
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
