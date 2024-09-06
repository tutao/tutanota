/**
 * This is a wrapper for commonly used crypto functions, easier to inject/swap implementations and test.
 */
import crypto from "node:crypto"
import { InstanceMapper } from "../api/worker/crypto/InstanceMapper"
import type { TypeModel } from "../api/common/EntityTypes"
import type { Base64 } from "@tutao/tutanota-utils"
import {
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	base64ToKey,
	BitArray,
	decryptKey,
	random,
	uint8ArrayToKey,
	unauthenticatedAesDecrypt,
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
	aesEncrypt(key: AesKey, bytes: Uint8Array, iv?: Uint8Array, usePadding?: boolean, useMac?: boolean): Uint8Array

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array

	unauthenticatedAesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array

	decryptKey(encryptionKey: AesKey, key: Uint8Array): AesKey

	bytesToKey(bytes: Uint8Array): BitArray

	base64ToKey(base64: Base64): BitArray

	verifySignature(pubKeyPem: string, data: Uint8Array, signature: Uint8Array): boolean

	randomBytes(nbrOfBytes: number): Uint8Array

	aes256RandomKey(): Aes256Key

	decryptAndMapToInstance<T>(model: TypeModel, instance: Record<string, any>, sk: AesKey | null): Promise<T>
}

const mapper = new InstanceMapper()
export const cryptoFns: CryptoFunctions = {
	aesEncrypt(key: AesKey, bytes: Uint8Array, iv?: Uint8Array, usePadding?: boolean, useMac?: boolean): Uint8Array {
		return aesEncrypt(key, bytes, iv, usePadding, useMac)
	},

	aesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array {
		return aesDecrypt(key, encryptedBytes, usePadding)
	},

	unauthenticatedAesDecrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array {
		return unauthenticatedAesDecrypt(key, encryptedBytes, usePadding)
	},

	decryptKey(encryptionKey: AesKey, key: Uint8Array): AesKey {
		return decryptKey(encryptionKey, key)
	},

	bytesToKey(bytes: Uint8Array): BitArray {
		return uint8ArrayToKey(bytes)
	},

	base64ToKey(base64: Base64): BitArray {
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

	decryptAndMapToInstance<T>(model: TypeModel, instance: Record<string, any>, sk: AesKey | null): Promise<T> {
		return mapper.decryptAndMapToInstance(model, instance, sk)
	},
}
