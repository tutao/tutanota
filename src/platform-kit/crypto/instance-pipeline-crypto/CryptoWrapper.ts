import { arrayEquals, stringToUtf8Uint8Array, Versioned } from "@tutao/utils"
import { CryptoError } from "@tutao/crypto/error"
import { keyToUint8Array, SymmetricCipherUtils, uint8ArrayToKey } from "../encryption/symmetric/SymmetricCipherUtils.js"
import { deriveX25519PublicKey, generateX25519KeyPair, X25519KeyPair, X25519PrivateKey, X25519PublicKey } from "../encryption/X25519.js"
import { bytesToEd25519PrivateKey, Ed25519PrivateKey, ed25519PrivateKeyToBytes, Ed25519PublicKey, ed25519PublicKeyToBytes } from "../encryption/Ed25519.js"
import {
	extractKyberPublicKeyFromKyberPrivateKey,
	KyberKeyPair,
	KyberPrivateKey,
	KyberPublicKey,
	kyberPublicKeyToBytes,
} from "../encryption/Liboqs/KyberKeyPair.js"
import { RsaKeyPair, RsaPublicKey, RsaX25519KeyPair } from "../encryption/RsaKeyPair.js"
import { AsymmetricKeyPair } from "../encryption/AsymmetricKeyPair.js"
import { sha256Hash } from "../hashes/Sha256.js"
import { Aes256Key, AesKey, AesKeyLength, getKeyLengthInBytes } from "../encryption/symmetric/AesKey.js"
import { hmacSha256, verifyHmacSha256 } from "../encryption/Hmac.js"
import { extractRawPublicRsaKeyFromPrivateRsaKey } from "../encryption/Rsa.js"
import * as cryptoUtils from "../CryptoUtils.js"
import { PQKeyPairs } from "../encryption/PQKeyPairs.js"
import { hkdf } from "../hashes/HKDF.js"
import { HkdfKeyDerivationDomains, MacTag, VersionedEncryptedKey, VersionedKey } from "../CryptoTypes"
import { EncryptedKeyPairs, EncryptedPqKeyPairs, EncryptedRsaKeyPairs, EncryptedRsaX25519KeyPairs } from "../encryption/EncryptedKeyPairs"
import { Aes } from "./Aes"
import { KeyEncryption } from "./KeyEncryption"

type IdentityKeyPair = { privateEd25519Key: Uint8Array<ArrayBuffer>; identityKeyVersion: NumberString }

/**
 * This class is useful to bundle all the crypto primitives and make the code testable without using the real crypto implementations.
 */
export class CryptoWrapper {
	constructor(
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
		private readonly aes: Aes,
		private readonly keyEncryption: KeyEncryption,
	) {}

	aes256RandomKey(): Aes256Key {
		return this.symmetricCipherUtils.aes256RandomKey()
	}

	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.aes.aesDecrypt(key, encryptedBytes)
	}

	aesEncrypt(key: AesKey, bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.aes.aesEncrypt(key, bytes)
	}

	decryptKey(encryptionKey: AesKey, key: Uint8Array<ArrayBuffer>): AesKey {
		return this.keyEncryption.decryptKey(encryptionKey, key)
	}

	encryptX25519Key(encryptionKey: AesKey, privateKey: X25519PrivateKey): Uint8Array<ArrayBuffer> {
		return this.keyEncryption.encryptX25519Key(encryptionKey, privateKey)
	}

	encryptEd25519Key(encryptionKey: VersionedKey, privateKey: Ed25519PrivateKey): VersionedEncryptedKey {
		return {
			encryptingKeyVersion: encryptionKey.version,
			key: this.aes.aesEncrypt(encryptionKey.object, ed25519PrivateKeyToBytes(privateKey)),
		}
	}

	decryptEd25519PrivateKey(encryptedIdentityKeyPair: IdentityKeyPair, decryptionKey: AesKey): Versioned<Ed25519PrivateKey> {
		return {
			object: bytesToEd25519PrivateKey(this.aes.aesDecrypt(decryptionKey, encryptedIdentityKeyPair.privateEd25519Key)),
			version: cryptoUtils.parseKeyVersion(encryptedIdentityKeyPair.identityKeyVersion),
		}
	}

	encryptKey(encryptingKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array<ArrayBuffer> {
		return this.keyEncryption.encryptKey(encryptingKey, keyToBeEncrypted)
	}

	encryptKeyWithVersionedKey(encryptingKey: VersionedKey, key: AesKey): VersionedEncryptedKey {
		return {
			encryptingKeyVersion: encryptingKey.version,
			key: this.keyEncryption.encryptKey(encryptingKey.object, key),
		}
	}

	generateEccKeyPair(): X25519KeyPair {
		return generateX25519KeyPair()
	}

	encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array<ArrayBuffer> {
		return this.keyEncryption.encryptKyberKey(encryptionKey, privateKey)
	}

	kyberPublicKeyToBytes(kyberPublicKey: KyberPublicKey): Uint8Array<ArrayBuffer> {
		return kyberPublicKeyToBytes(kyberPublicKey)
	}

	ed25519PublicKeyToBytes(ed25519PublicKey: Ed25519PublicKey): Uint8Array<ArrayBuffer> {
		return ed25519PublicKeyToBytes(ed25519PublicKey)
	}

	encryptBytes(sk: AesKey, value: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.aes.aesEncrypt(sk, value)
	}

	encryptString(sk: AesKey, value: string): Uint8Array<ArrayBuffer> {
		return this.aes.aesEncrypt(sk, stringToUtf8Uint8Array(value))
	}

	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedPqKeyPairs): PQKeyPairs
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaKeyPairs): RsaKeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaX25519KeyPairs): RsaX25519KeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair
	decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair {
		return this.keyEncryption.decryptKeyPair(encryptionKey, keyPair)
	}

	sha256Hash(data: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return sha256Hash(data)
	}

	deriveKeyWithHkdf({ key, salt, context }: { key: AesKey; salt: string; context: HkdfKeyDerivationDomains }): Aes256Key {
		return deriveKey({
			salt,
			key,
			info: context,
			length: getKeyLengthInBytes(AesKeyLength.Aes256),
		}) as Aes256Key
	}

	hmacSha256(key: AesKey, data: Uint8Array<ArrayBuffer>): MacTag {
		return hmacSha256(key, data)
	}

	verifyHmacSha256(key: AesKey, data: Uint8Array<ArrayBuffer>, tag: MacTag) {
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

	verifyRsaPublicKey(rsaKeyPair: RsaKeyPair): RsaPublicKey {
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

function deriveKey({ salt, key, info, length }: { salt: string; key: AesKey; info: string; length: number }) {
	return uint8ArrayToKey(hkdf(sha256Hash(stringToUtf8Uint8Array(salt)), keyToUint8Array(key), stringToUtf8Uint8Array(info), length))
}
