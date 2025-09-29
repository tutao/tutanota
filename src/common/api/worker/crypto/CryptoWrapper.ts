import {
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	AsymmetricKeyPair,
	bytesToEd25519PrivateKey,
	decryptKey,
	decryptKeyPair,
	deriveX25519PublicKey,
	Ed25519PrivateKey,
	ed25519PrivateKeyToBytes,
	Ed25519PublicKey,
	ed25519PublicKeyToBytes,
	ENABLE_MAC,
	EncryptedKeyPairs,
	EncryptedPqKeyPairs,
	EncryptedRsaKeyPairs,
	EncryptedRsaX25519KeyPairs,
	encryptKey,
	encryptKyberKey,
	encryptX25519Key,
	extractKyberPublicKeyFromKyberPrivateKey,
	extractRawPublicRsaKeyFromPrivateRsaKey,
	generateX25519KeyPair,
	hkdf,
	HkdfKeyDerivationDomains,
	hmacSha256,
	IV_BYTE_LENGTH,
	KEY_LENGTH_BYTES_AES_256,
	keyToUint8Array,
	KyberKeyPair,
	KyberPrivateKey,
	KyberPublicKey,
	kyberPublicKeyToBytes,
	MacTag,
	type PQKeyPairs,
	random,
	RawRsaPublicKey,
	type RsaKeyPair,
	type RsaX25519KeyPair,
	sha256Hash,
	uint8ArrayToKey,
	verifyHmacSha256,
	X25519KeyPair,
	X25519PrivateKey,
	X25519PublicKey,
} from "@tutao/tutanota-crypto"
import { arrayEquals, stringToUtf8Uint8Array, Versioned } from "@tutao/tutanota-utils"
import { KeyVersion } from "@tutao/tutanota-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { IdentityKeyPair } from "../../entities/sys/TypeRefs"
import { parseKeyVersion } from "../facades/KeyLoaderFacade"

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
			key: aesEncrypt(encryptionKey.object, ed25519PrivateKeyToBytes(privateKey), undefined, true, true),
		}
	}

	decryptEd25519PrivateKey(encryptedIdentityKeyPair: IdentityKeyPair, decryptionKey: AesKey): Versioned<Ed25519PrivateKey> {
		return {
			object: bytesToEd25519PrivateKey(aesDecrypt(decryptionKey, encryptedIdentityKeyPair.privateEd25519Key)),
			version: parseKeyVersion(encryptedIdentityKeyPair.identityKeyVersion),
		}
	}

	encryptKey(encryptingKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array {
		return encryptKey(encryptingKey, keyToBeEncrypted)
	}

	encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey {
		return _encryptKeyWithVersionedKey(encryptingKey, key)
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

	ed25519PublicKeyToBytes(ed25519PublicKey: Ed25519PublicKey): Uint8Array {
		return ed25519PublicKeyToBytes(ed25519PublicKey)
	}

	encryptBytes(sk: AesKey, value: Uint8Array): Uint8Array {
		return _encryptBytes(sk, value)
	}

	encryptString(sk: AesKey, value: string): Uint8Array {
		return _encryptString(sk, value)
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

	verifyPublicX25519Key(x25519KeyPair: X25519KeyPair): X25519PublicKey {
		const extractedPubKey = deriveX25519PublicKey(x25519KeyPair.privateKey)
		if (!arrayEquals(extractedPubKey, x25519KeyPair.publicKey)) {
			throw new CryptoError("Extracted public key does not match the provided public key")
		}
		return x25519KeyPair.publicKey
	}

	verifyKyberPublicKey(kyberKeyPair: KyberKeyPair): KyberPublicKey {
		const extractedPubKey = extractKyberPublicKeyFromKyberPrivateKey(kyberKeyPair.privateKey)
		if (!arrayEquals(extractedPubKey.raw, kyberKeyPair.publicKey.raw)) {
			throw new CryptoError("Extracted public key does not match the provided public key")
		}
		return kyberKeyPair.publicKey
	}

	verifyRsaPublicKey(rsaKeyPair: RsaKeyPair): RawRsaPublicKey {
		const providedPublicKey = rsaKeyPair.publicKey
		const extractedPubKey = extractRawPublicRsaKeyFromPrivateRsaKey(rsaKeyPair.privateKey)
		if (
			extractedPubKey.keyLength !== providedPublicKey.keyLength ||
			extractedPubKey.publicExponent !== providedPublicKey.publicExponent ||
			extractedPubKey.version !== providedPublicKey.version ||
			extractedPubKey.modulus !== providedPublicKey.modulus
		) {
			throw new CryptoError("Extracted public key does not match the provided public key")
		}
		return providedPublicKey
	}
}

function deriveKey({ salt, key, info, length }: { salt: string; key: number[]; info: string; length: number }) {
	return uint8ArrayToKey(hkdf(sha256Hash(stringToUtf8Uint8Array(salt)), keyToUint8Array(key), stringToUtf8Uint8Array(info), length))
}

/**
 @deprecated use the CryptoWrapper instance instead. This function will be hidden in the future
 */
export function _encryptBytes(sk: AesKey, value: Uint8Array): Uint8Array {
	return aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

/**
 @deprecated use the CryptoWrapper instance instead. This function will be hidden in the future
 */
export function _encryptString(sk: AesKey, value: string): Uint8Array {
	return aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

/**
 * Encrypts the key with the encryptingKey and return the encrypted key and the version of the encryptingKey.
 * @deprecated use the CryptoWrapper instance instead. This function will be hidden in the future
 * @param encryptingKey the encrypting key.
 * @param key the key to be encrypted.
 */
export function _encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey {
	return {
		encryptingKeyVersion: encryptingKey.version,
		key: encryptKey(encryptingKey.object, key),
	}
}
