import { uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { CryptoError } from "../misc/CryptoError.js"
import { Aes256Key, AesKey, IV_BYTE_LENGTH } from "./symmetric/SymmetricCipherUtils.js"
import { SYMMETRIC_CIPHER_FACADE } from "./symmetric/SymmetricCipherFacade.js"
import { getSymmetricCipherVersion } from "./symmetric/SymmetricCipherVersion"

/**
 * Encrypts bytes with AES128 or AES256 in CBC mode.
 * @param key The key to use for the encryption.
 * @param bytes The plain text.
 * @return The encrypted bytes
 */
export function aesEncrypt(key: AesKey, bytes: Uint8Array) {
	return SYMMETRIC_CIPHER_FACADE.encryptBytes(key, bytes)
}

/**
 * @deprecated use aesEncrypt instead
 */
export function aesEncryptConfigurationDatabaseItem(key: AesKey, bytes: Uint8Array, iv: Uint8Array): Uint8Array {
	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `)
	}
	return SYMMETRIC_CIPHER_FACADE.encryptBytesDeprecatedCustomIv(key, bytes, iv)
}

/**
 * Encrypts bytes with AES 256 in CBC mode without mac. This is legacy code and should be removed once the index has been migrated.
 * @deprecated
 */
export function aes256EncryptSearchIndexEntry(key: Aes256Key, bytes: Uint8Array): Uint8Array {
	return SYMMETRIC_CIPHER_FACADE.encryptBytesDeprecatedUnauthenticated(key, bytes)
}

/**
 *@deprecated
 */
export function aes256EncryptSearchIndexEntryWithIV(key: Aes256Key, bytes: Uint8Array, iv: Uint8Array): Uint8Array {
	if (iv.length !== IV_BYTE_LENGTH) {
		throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `)
	}
	return SYMMETRIC_CIPHER_FACADE.encryptBytesDeprecatedUnauthenticatedCustomIv(key, bytes, iv)
}

/**
 * Decrypts the given words with AES-128/256 in CBC mode (with HMAC-SHA-256 as mac). The mac is enforced for AES-256 but optional for AES-128.
 * @param key The key to use for the decryption.
 * @param encryptedBytes The ciphertext encoded as bytes.
 * @return The decrypted bytes.
 */
export function aesDecrypt(key: AesKey, encryptedBytes: Uint8Array): Uint8Array {
	return SYMMETRIC_CIPHER_FACADE.decryptBytes(key, encryptedBytes)
}

export function asyncDecryptBytes(key: AesKey, bytes: Uint8Array): Promise<Uint8Array> {
	return SYMMETRIC_CIPHER_FACADE.asyncDecryptBytes(key, bytes)
}

/**
 * Decrypts the given words with AES-128/256 in CBC mode. Does not enforce a mac.
 * We always must enforce macs. This only exists for backward compatibility in some exceptional cases like search index entry encryption.
 *
 * @param key The key to use for the decryption.
 * @param encryptedBytes The ciphertext encoded as bytes.
 * @return The decrypted bytes.
 * @deprecated
 */
export function aesDecryptUnauthenticated(key: Aes256Key, encryptedBytes: Uint8Array): Uint8Array {
	return SYMMETRIC_CIPHER_FACADE.decryptBytesDeprecatedUnauthenticated(key, encryptedBytes)
}
