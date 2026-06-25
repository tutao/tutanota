import { aesDecrypt, aesEncrypt } from "./Aes.js"
import { assertNotNull, hexToUint8Array, uint8ArrayToHex } from "@tutao/utils"
import { hexToRsaPrivateKey, hexToRsaPublicKey, rsaPrivateKeyToHex } from "../encryption/Rsa.js"
import { RsaKeyPair, RsaPrivateKey, RsaX25519KeyPair } from "../encryption/RsaKeyPair.js"
import { bytesToKyberPrivateKey, bytesToKyberPublicKey, KyberPrivateKey, kyberPrivateKeyToBytes } from "../encryption/Liboqs/KyberKeyPair.js"
import { X25519PrivateKey } from "../encryption/X25519.js"
import { AsymmetricKeyPair, KeyPairType } from "../encryption/AsymmetricKeyPair.js"
import type { PQKeyPairs } from "../encryption/PQKeyPairs.js"
import { Aes128Key, Aes256Key, AesKey } from "../encryption/symmetric/SymmetricCipherUtils.js"
import { AesKeyLength, assert256BitKey, getKeyLengthInBytes } from "../encryption/symmetric/AesKeyLength.js"
import { SYMMETRIC_CIPHER_FACADE } from "./SymmetricCipherFacade.js"
import { ProgrammingError } from "@tutao/app-env"
import { EncryptedKeyPairs, EncryptedPqKeyPairs, EncryptedRsaKeyPairs, EncryptedRsaX25519KeyPairs } from "../encryption/EncryptedKeyPairs"

export function encryptKey(encryptionKey: AesKey, keyToBeEncrypted: AesKey): Uint8Array {
	return SYMMETRIC_CIPHER_FACADE.encryptKey(encryptionKey, keyToBeEncrypted)
}

export function decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array): AesKey
export function decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array, acceptedBitLengths: typeof AesKeyLength.Aes256): Aes256Key
export function decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array, acceptedBitLengths: typeof AesKeyLength.Aes128): Aes128Key
export function decryptKey(encryptionKey: AesKey, keyToBeDecrypted: Uint8Array, acceptedBitLength?: AesKeyLength): AesKey {
	return SYMMETRIC_CIPHER_FACADE.decryptKey(encryptionKey, keyToBeDecrypted, acceptedBitLength)
}

/**
 * @deprecated
 */
export function decryptKeyUnauthenticatedWithDeviceKeyChain(key: Aes256Key, encryptedBytes: Uint8Array): AesKey {
	return SYMMETRIC_CIPHER_FACADE.decryptKeyDeprecatedUnauthenticated(key, encryptedBytes)
}

export function aes256DecryptWithRecoveryKey(encryptionKey: Aes256Key, keyToBeDecrypted: Uint8Array): AesKey {
	// legacy case: recovery code with fixed initialization vector and without mac
	if (keyToBeDecrypted.length === getKeyLengthInBytes(AesKeyLength.Aes128)) {
		return SYMMETRIC_CIPHER_FACADE.decryptKeyDeprecatedUnauthenticatedFixedInitializationVector(encryptionKey, keyToBeDecrypted)
	} else {
		return decryptKey(encryptionKey, keyToBeDecrypted)
	}
}

export function encryptRsaKey(encryptionKey: AesKey, privateKey: RsaPrivateKey): Uint8Array {
	return aesEncrypt(encryptionKey, hexToUint8Array(rsaPrivateKeyToHex(privateKey)))
}

export function encryptX25519Key(encryptionKey: AesKey, privateKey: X25519PrivateKey): Uint8Array {
	return aesEncrypt(encryptionKey, privateKey) // passing the initialization vector as undefined here is fine, as it will generate a new one for each encryption
}

export function encryptKyberKey(encryptionKey: AesKey, privateKey: KyberPrivateKey): Uint8Array {
	return aesEncrypt(encryptionKey, kyberPrivateKeyToBytes(privateKey)) // passing the initialization vector as undefined here is fine, as it will generate a new one for each encryption
}

export function decryptRsaKey(encryptionKey: AesKey, encryptedPrivateKey: Uint8Array): RsaPrivateKey {
	return hexToRsaPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, encryptedPrivateKey)))
}

export function decryptKeyPair(encryptionKey: AesKey, keyPair: EncryptedKeyPairs): AsymmetricKeyPair {
	if (keyPair instanceof EncryptedRsaKeyPairs) {
		return decryptRsaOrRsaX25519KeyPair(encryptionKey, keyPair)
	} else if (keyPair instanceof EncryptedPqKeyPairs) {
		return decryptPQKeyPair(assert256BitKey(encryptionKey), keyPair)
	} else {
		throw new ProgrammingError("unsupported keypair")
	}
}

function decryptRsaOrRsaX25519KeyPair(encryptionKey: AesKey, keyPair: EncryptedRsaKeyPairs): RsaKeyPair {
	const publicKey = hexToRsaPublicKey(uint8ArrayToHex(assertNotNull(keyPair.pubRsaKey)))
	const privateKey = hexToRsaPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, keyPair.symEncPrivRsaKey!)))
	if (keyPair instanceof EncryptedRsaX25519KeyPairs) {
		const publicEccKey = assertNotNull(keyPair.pubEccKey)
		const privateEccKey = aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey))
		return new RsaX25519KeyPair(publicKey, privateKey, publicEccKey, privateEccKey)
	} else {
		return new RsaKeyPair(publicKey, privateKey)
	}
}

function decryptPQKeyPair(encryptionKey: Aes256Key, keyPair: EncryptedPqKeyPairs): PQKeyPairs {
	const eccPublicKey = assertNotNull(keyPair.pubEccKey, "expected pub ecc key for PQ keypair")
	const eccPrivateKey = aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey, "expected priv ecc key for PQ keypair"))
	const kyberPublicKey = bytesToKyberPublicKey(assertNotNull(keyPair.pubKyberKey, "expected pub kyber key for PQ keypair"))
	const kyberPrivateKey = bytesToKyberPrivateKey(
		aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivKyberKey, "expected enc priv kyber key for PQ keypair")),
	)

	return {
		keyPairType: KeyPairType.TUTA_CRYPT,
		x25519KeyPair: {
			publicKey: eccPublicKey,
			privateKey: eccPrivateKey,
		},
		kyberKeyPair: {
			publicKey: kyberPublicKey,
			privateKey: kyberPrivateKey,
		},
	}
}
