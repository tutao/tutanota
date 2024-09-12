import {
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	AsymmetricKeyPair,
	bytesToKyberPublicKey,
	decryptKey,
	decryptKeyPair,
	EccKeyPair,
	EccPrivateKey,
	ENABLE_MAC,
	encryptEccKey,
	EncryptedKeyPairs,
	EncryptedPqKeyPairs,
	EncryptedRsaEccKeyPairs,
	EncryptedRsaKeyPairs,
	encryptKey,
	encryptKyberKey,
	generateEccKeyPair,
	hkdf,
	HkdfKeyDerivationDomains,
	IV_BYTE_LENGTH,
	KEY_LENGTH_BYTES_AES_256,
	keyToUint8Array,
	KyberPrivateKey,
	KyberPublicKey,
	kyberPublicKeyToBytes,
	type PQKeyPairs,
	random,
	type RsaEccKeyPair,
	type RsaKeyPair,
	sha256Hash,
	uint8ArrayToKey,
} from "@tutao/tutanota-crypto"
import { stringToUtf8Uint8Array, Versioned } from "@tutao/tutanota-utils"

/**
 * An AesKey (usually a group key) and its version.
 */
export type VersionedKey = Versioned<AesKey>
/**
 * A key that is encrypted with a given version of some other key.
 */
export type VersionedEncryptedKey = {
	encryptingKeyVersion: number // the version of the encryption key NOT the encrypted key
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

	encryptEccKey(encryptionKey: AesKey, privateKey: EccPrivateKey): Uint8Array {
		return encryptEccKey(encryptionKey, privateKey)
	}

	encryptKey(encryptingKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array {
		return encryptKey(encryptingKey, keyToBeEncrypted)
	}

	encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey {
		return encryptKeyWithVersionedKey(encryptingKey, key)
	}

	generateEccKeyPair(): EccKeyPair {
		return generateEccKeyPair()
	}

	encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array {
		return encryptKyberKey(encryptionKey, privateKey)
	}

	kyberPublicKeyToBytes(kyberPublicKey: KyberPublicKey): Uint8Array {
		return kyberPublicKeyToBytes(kyberPublicKey)
	}

	bytesToKyberPublicKey(encodedPublicKey: Uint8Array): KyberPublicKey {
		return bytesToKyberPublicKey(encodedPublicKey)
	}

	encryptBytes(sk: AesKey, value: Uint8Array): Uint8Array {
		return encryptBytes(sk, value)
	}

	encryptString(sk: AesKey, value: string): Uint8Array {
		return encryptString(sk, value)
	}

	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedPqKeyPairs): PQKeyPairs
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaKeyPairs): RsaKeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaEccKeyPairs): RsaEccKeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair {
		return decryptKeyPair(encryptionKey, keyPair)
	}

	sha256Hash(data: Uint8Array): Uint8Array {
		return sha256Hash(data)
	}

	deriveKeyWithHkdf({ key, salt, context }: { key: AesKey; salt: string; context: HkdfKeyDerivationDomains }) {
		return deriveKey({
			salt,
			key,
			info: context,
			length: KEY_LENGTH_BYTES_AES_256,
		})
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
