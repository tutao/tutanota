import { arrayEquals, KeyVersion, stringToUtf8Uint8Array, Versioned } from "@tutao/utils"
import { CryptoError } from "./error.js"
import { aes256RandomKey, AesKey, keyToUint8Array, uint8ArrayToKey } from "./encryption/symmetric/SymmetricCipherUtils.js"
import { Aes256Key, Ed25519PrivateKey, Ed25519PublicKey } from "@tutao/crypto-primitives"
import { aesDecrypt, aesEncrypt } from "./encryption/Aes.js"
import {
	decryptKey,
	decryptKeyPair,
	EncryptedKeyPairs,
	EncryptedPqKeyPairs,
	EncryptedRsaKeyPairs,
	EncryptedRsaX25519KeyPairs,
	encryptKey,
	encryptKyberKey,
	encryptX25519Key,
} from "./encryption/KeyEncryption.js"
import { deriveX25519PublicKey, generateX25519KeyPair, X25519KeyPair, X25519PrivateKey, X25519PublicKey } from "./encryption/X25519.js"
import { bytesToEd25519PrivateKey, ed25519PrivateKeyToBytes, ed25519PublicKeyToBytes } from "./encryption/Ed25519.js"
import {
	extractKyberPublicKeyFromKyberPrivateKey,
	KyberKeyPair,
	KyberPrivateKey,
	KyberPublicKey,
	kyberPublicKeyToBytes,
} from "./encryption/Liboqs/KyberKeyPair.js"
import { RawRsaPublicKey, RsaKeyPair, RsaX25519KeyPair } from "./encryption/RsaKeyPair.js"
import { AsymmetricKeyPair } from "./encryption/AsymmetricKeyPair.js"
import { sha256Hash } from "./hashes/Sha256.js"
import { HkdfKeyDerivationDomains } from "./misc/Constants.js"
import { AesKeyLength, getKeyLengthInBytes } from "./encryption/symmetric/AesKeyLength.js"
import { hmacSha256, MacTag, verifyHmacSha256 } from "./encryption/Hmac.js"
import { extractRawPublicRsaKeyFromPrivateRsaKey } from "./encryption/Rsa.js"
import * as cryptoUtils from "./CryptoUtils.js"
import { PQKeyPairs } from "./encryption/PQKeyPairs.js"
import { hkdf } from "./hashes/HKDF.js"

type IdentityKeyPair = { privateEd25519Key: Uint8Array; identityKeyVersion: NumberString }

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

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array): Uint8Array {
		return aesDecrypt(key, encryptedBytes)
	}

	aesEncrypt(key: AesKey, bytes: Uint8Array): Uint8Array {
		return aesEncrypt(key, bytes)
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
			key: aesEncrypt(encryptionKey.object, ed25519PrivateKeyToBytes(privateKey)),
		}
	}

	decryptEd25519PrivateKey(encryptedIdentityKeyPair: IdentityKeyPair, decryptionKey: AesKey): Versioned<Ed25519PrivateKey> {
		return {
			object: bytesToEd25519PrivateKey(aesDecrypt(decryptionKey, encryptedIdentityKeyPair.privateEd25519Key)),
			version: cryptoUtils.parseKeyVersion(encryptedIdentityKeyPair.identityKeyVersion),
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
			length: getKeyLengthInBytes(AesKeyLength.Aes256),
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
	return aesEncrypt(sk, value)
}

/**
 @deprecated use the CryptoWrapper instance instead. This function will be hidden in the future
 */
export function _encryptString(sk: AesKey, value: string): Uint8Array {
	return aesEncrypt(sk, stringToUtf8Uint8Array(value))
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
