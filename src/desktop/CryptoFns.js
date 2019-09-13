//@flow

/**
 * This is a wrapper for commonly used crypto functions, easier to inject/swap implementations and test.
 */
import {aes128Decrypt, aes256Decrypt, aes256Encrypt} from "../api/worker/crypto/Aes"
import {decrypt256Key} from "../api/worker/crypto/KeyCryptoUtils"
import {base64ToKey} from "../api/worker/crypto/CryptoUtils"
import forge from "node-forge"
import crypto from "crypto"
import {decryptAndMapToInstance} from "../api/worker/crypto/InstanceMapper"

export interface CryptoFunctions {
	aes128Decrypt(key: Aes128Key, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array;

	aes256Encrypt(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array;

	aes256Decrypt(key: Aes256Key, encryptedBytes: Uint8Array, usePadding: boolean, useMac: boolean): Uint8Array;

	decrypt256Key(encryptionKey: Aes128Key, key: Uint8Array): Aes256Key;

	base64ToKey(base64: Base64): BitArray;

	publicKeyFromPem(pem: string): {verify: (string, string) => boolean};

	randomBytes(bytes: number): Uint8Array;

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

	randomBytes(bytes: number): Uint8Array {
		return crypto.randomBytes(bytes)
	},

	decryptAndMapToInstance<T>(model: TypeModel, instance: Object, sk: ?Aes128Key): Promise<T> {
		return decryptAndMapToInstance(model, instance, sk)
	}
}