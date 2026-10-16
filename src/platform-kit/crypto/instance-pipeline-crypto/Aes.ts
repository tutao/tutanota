import { InitializationVector } from "../encryption/symmetric/SymmetricCipherUtils.js"
import { Aes256Key, AesKey } from "../encryption/symmetric/AesKey"
import { SymmetricCipherFacade } from "./SymmetricCipherFacade"

export class Aes {
	constructor(private readonly symmetricCipherFacade: SymmetricCipherFacade) {}

	/**
	 * Encrypts bytes with AES128 or AES256 in CBC mode.
	 * @param key The key to use for the encryption.
	 * @param bytes The plain text.
	 * @return The encrypted bytes
	 */
	aesEncrypt(key: AesKey, bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.encryptBytes(key, bytes)
	}

	/**
	 * @deprecated use aesEncrypt instead
	 */
	aesEncryptConfigurationDatabaseItem(key: AesKey, bytes: Uint8Array<ArrayBuffer>, initializationVector: InitializationVector): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.encryptBytesDeprecatedCustomInitializationVector(key, bytes, initializationVector)
	}

	/**
	 * Encrypts bytes with AES 256 in CBC mode without mac. This is legacy code and should be removed once the index has been migrated.
	 * @deprecated
	 */
	aes256EncryptSearchIndexEntry(key: Aes256Key, bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.encryptBytesDeprecatedUnauthenticated(key, bytes)
	}

	/**
	 *@deprecated
	 */
	aes256EncryptSearchIndexEntryWithInitializationVector(
		key: Aes256Key,
		bytes: Uint8Array<ArrayBuffer>,
		initializationVector: InitializationVector,
	): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.encryptBytesDeprecatedUnauthenticatedCustomInitializationVector(key, bytes, initializationVector)
	}

	/**
	 * Decrypts the given words with AES-128/256 in CBC mode (with HMAC-SHA-256 as mac). The mac is enforced for AES-256 but optional for AES-128.
	 * @param key The key to use for the decryption.
	 * @param encryptedBytes The ciphertext encoded as bytes.
	 * @return The decrypted bytes.
	 */
	aesDecrypt(key: AesKey, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.decryptBytes(key, encryptedBytes)
	}

	asyncDecryptBytes(key: AesKey, bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
		return this.symmetricCipherFacade.asyncDecryptBytes(key, bytes)
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
	aesDecryptUnauthenticated(key: Aes256Key, encryptedBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
		return this.symmetricCipherFacade.decryptBytesDeprecatedUnauthenticated(key, encryptedBytes)
	}
}
