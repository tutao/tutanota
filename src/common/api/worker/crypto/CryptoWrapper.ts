import {
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	AsymmetricKeyPair,
	decryptKey,
	decryptKeyPair,
	ENABLE_MAC,
	EncryptedKeyPairs,
	EncryptedPqKeyPairs,
	EncryptedRsaKeyPairs,
	EncryptedRsaX25519KeyPairs,
	encryptKey,
	encryptKyberKey,
	encryptX25519Key,
	generateX25519KeyPair,
	hkdf,
	HkdfKeyDerivationDomains,
	hmacSha256,
	IV_BYTE_LENGTH,
	KEY_LENGTH_BYTES_AES_256,
	keyToUint8Array,
	KyberPrivateKey,
	KyberPublicKey,
	kyberPublicKeyToBytes,
	MacTag,
	type PQKeyPairs,
	random,
	type RsaKeyPair,
	type RsaX25519KeyPair,
	sha256Hash,
	uint8ArrayToKey,
	verifyHmacSha256,
	X25519KeyPair,
	X25519PrivateKey,
} from "@tutao/tutanota-crypto"
import { stringToUtf8Uint8Array, Versioned } from "@tutao/tutanota-utils"
import { KeyVersion } from "@tutao/tutanota-utils/dist/Utils.js"
import { Ed25519PrivateKey } from "../facades/Ed25519Facade"

/**
 * An AesKey (usually a group key) and its version.
 */
export type VersionedKey = Versioned<AesKey>
/**
 * A key that is encrypted with a given version of some other key.
 */
export type VersionedEncryptedKey = {
	encryptingKeyVersion: KeyVersion // the version of the encryption key NOT the encrypted key
	key: Uint8Array // encrypted key
}

/**
 * This class is useful to bundle all the crypto primitives and make the code testable without using the real crypto implementations.
 */
export class CryptoWrapper {
	aes256RandomKey(): Aes256Key {
		return aes256RandomKey()
	}

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array, usePadding: boolean): Uint8Array {
		return aesDecrypt(key, encryptedBytes, usePadding)
	}

	aesEncrypt(key: AesKey, bytes: Uint8Array, iv?: Uint8Array, usePadding?: boolean, useMac?: boolean): Uint8Array {
		return aesEncrypt(key, bytes, iv, usePadding, useMac)
	}

	decryptKey(encryptionKey: AesKey, key: Uint8Array): AesKey {
		return decryptKey(encryptionKey, key)
	}

	encryptX25519Key(encryptionKey: AesKey, privateKey: X25519PrivateKey): Uint8Array {
		return encryptX25519Key(encryptionKey, privateKey)
	}

	encryptEd25519Key(encryptionKey: VersionedKey, privateKey: Ed25519PrivateKey): VersionedEncryptedKey {
		return {
			encryptingKeyVersion: encryptionKey.version,
			key: aesEncrypt(encryptionKey.object, privateKey, undefined, true, true),
		}
	}

	encryptKey(encryptingKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array {
		return encryptKey(encryptingKey, keyToBeEncrypted)
	}

	encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey {
		return encryptKeyWithVersionedKey(encryptingKey, key)
	}

	generateEccKeyPair(): X25519KeyPair {
		return generateX25519KeyPair()
	}

	encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array {
		return encryptKyberKey(encryptionKey, privateKey)
	}

	kyberPublicKeyToBytes(kyberPublicKey: KyberPublicKey): Uint8Array {
		return kyberPublicKeyToBytes(kyberPublicKey)
	}

	encryptBytes(sk: AesKey, value: Uint8Array): Uint8Array {
		return encryptBytes(sk, value)
	}

	encryptString(sk: AesKey, value: string): Uint8Array {
		return encryptString(sk, value)
	}

	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedPqKeyPairs): PQKeyPairs
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaKeyPairs): RsaKeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaX25519KeyPairs): RsaX25519KeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair {
		return decryptKeyPair(encryptionKey, keyPair)
	}

	sha256Hash(data: Uint8Array): Uint8Array {
		return sha256Hash(data)
	}

	deriveKeyWithHkdf({ key, salt, context }: { key: AesKey; salt: string; context: HkdfKeyDerivationDomains }): Aes256Key {
		return deriveKey({
			salt,
			key,
			info: context,
			length: KEY_LENGTH_BYTES_AES_256,
		})
	}

	hmacSha256(key: AesKey, data: Uint8Array): MacTag {
		return hmacSha256(key, data)
	}

	verifyHmacSha256(key: AesKey, data: Uint8Array, tag: MacTag) {
		return verifyHmacSha256(key, data, tag)
	}
}

function deriveKey({ salt, key, info, length }: { salt: string; key: number[]; info: string; length: number }) {
	return uint8ArrayToKey(hkdf(sha256Hash(stringToUtf8Uint8Array(salt)), keyToUint8Array(key), stringToUtf8Uint8Array(info), length))
}

export function encryptBytes(sk: AesKey, value: Uint8Array): Uint8Array {
	return aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

export function encryptString(sk: AesKey, value: string): Uint8Array {
	return aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

/**
 * Encrypts the key with the encryptingKey and return the encrypted key and the version of the encryptingKey.
 * @param encryptingKey the encrypting key.
 * @param key the key to be encrypted.
 */
export function encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey {
	return {
		encryptingKeyVersion: encryptingKey.version,
		key: encryptKey(encryptingKey.object, key),
	}
}
