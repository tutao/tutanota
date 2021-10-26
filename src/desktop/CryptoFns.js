//@flow

/**
 * This is a wrapper for commonly used crypto functions, easier to inject/swap implementations and test.
 */
import {aes128Decrypt, aes256Decrypt, aes256Encrypt, aes256RandomKey} from "../api/worker/crypto/Aes"
import {decrypt256Key} from "../api/worker/crypto/KeyCryptoUtils"
import {base64ToKey} from "../api/worker/crypto/CryptoUtils"
import forge from "node-forge"
import crypto from "crypto"
import {decryptAndMapToInstance} from "../api/worker/crypto/InstanceMapper"
import {EntropySrc} from "../api/common/TutanotaConstants"
import {random} from "../api/worker/crypto/Randomizer"
import type {TypeModel} from "../api/common/EntityTypes"
import type {Base64} from "@tutao/tutanota-utils/"

// the prng throws if it doesn't have enough entropy
// it may be called very early, so we need to seed it
// we do it here because it's the first place in the dep. chain that knows it's
// in node but the last one that knows the prng implementation
const seed = () => {
	const entropy = crypto.randomBytes(128)
	random.addEntropy([
		{
			source: EntropySrc.random,
			entropy: 128 * 8,
			data: Array.from(entropy)
		}
	]).then()
}
seed()

export interface CryptoFunctions {
	aes128Decrypt(key: Aes128Key, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array;

	aes256Encrypt(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array;

	aes256Decrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array;

	decrypt256Key(encryptionKey: Aes128Key, key: Uint8Array): Aes256Key;

	base64ToKey(base64: Base64): BitArray;

	publicKeyFromPem(pem: string): {verify: (string, string) => boolean};

	randomBytes(nbrOfBytes: number): Uint8Array;

	aes256RandomKey(): Aes256Key;

	decryptAndMapToInstance<T>(model: TypeModel, instance: Object, sk: ?Aes128Key): Promise<T>;
}

export const cryptoFns: CryptoFunctions = {
	aes128Decrypt(key: Aes128Key, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array {
		return aes128Decrypt(key, encryptedBytes, usePadding)
	},

	aes256Encrypt(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array {
		return aes256Encrypt(key, bytes, iv, usePadding, useMac)
	},

	aes256Decrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array {
		return aes256Decrypt(key, encryptedBytes, usePadding, useMac)
	},

	decrypt256Key(encryptionKey: Aes128Key, key: Uint8Array): Aes256Key {
		return decrypt256Key(encryptionKey, key)
	},

	base64ToKey(base64: Base64): BitArray {
		return base64ToKey(base64)
	},

	publicKeyFromPem(pem: string): {verify: (string, string) => boolean} {
		return forge.pki.publicKeyFromPem(pem)
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

	decryptAndMapToInstance<T>(model: TypeModel, instance: Object, sk: ?Aes128Key): Promise<T> {
		return decryptAndMapToInstance(model, instance, sk)
	}
}