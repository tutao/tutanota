import { random } from "../../random/Randomizer.js"
import { AesKey, FIXED_IV, IV_BYTE_LENGTH, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { AES_CBC_FACADE, AesCbcFacade } from "./AesCbcFacade.js"
import { getSymmetricCipherVersion, SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { assert } from "@tutao/tutanota-utils"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength.js"
import { CryptoError } from "../../misc/CryptoError.js"

/**
 * This facade contains all methods for encryption/ decryption for symmetric encryption incl. AES-128 and AES-256 in CBC mode or AEAD.
 *
 * Depending on the symmetric cipher version it adds an HMAC tag (Encrypt-then-Mac), in which case two different keys for encryption and authentication are
 * derived from the provided secret key.
 *
 * In case of AEAD, there is additional associated data. Needed both for encryption and decryption, but it is not part of the created ciphertext.
 */
export class SymmetricCipherFacade {
	constructor(
		// private readonly aeadFacade: AeadFacade,
		private readonly aesCbcFacade: AesCbcFacade,
	) {}

	/**
	 * Encrypts a byte array with AES in CBC mode.
	 *
	 * @param key   The key to use for the encryption.
	 * @param bytes The data to encrypt.
	 * @return The encrypted bytes.
	 */
	encryptBytes(key: AesKey, bytes: Uint8Array): Uint8Array {
		return this.encrypt(key, bytes, true, SymmetricCipherVersion.AesCbcThenHmac)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode.
	 *
	 * Forces encryption without authentication. Only use in backward compatibility tests.
	 *
	 * @deprecated
	 */
	encryptBytesDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array): Uint8Array {
		return this.encrypt(key, bytes, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode with a custom IV.
	 *
	 * Forces encryption without authentication. The custom IV is prepended to the returned CBC ciphertext.
	 *
	 * @deprecated
	 */
	encryptValueDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array, iv: Uint8Array): Uint8Array {
		// TODO
		return this.aesCbcFacade.encrypt(key, bytes, true, iv, true, SymmetricCipherVersion.AesCbcThenHmac)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode with a custom IV.
	 *
	 * Forces encryption without authentication. The custom IV is prepended to the returned CBC ciphertext.
	 *
	 * @deprecated
	 */
	encryptDatabaseKeyDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array, iv: Uint8Array): Uint8Array {
		return this.aesCbcFacade.encrypt(key, bytes, true, iv, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, true)
	}

	/**
	 * Decrypts byte array with AES in CBC mode.
	 *
	 * @param key   The key to use for the decryption.
	 * @param bytes A byte array that was encrypted with the same key before.
	 * @return The decrypted bytes.
	 */
	public decryptBytes(key: AesKey, bytes: Uint8Array): Uint8Array {
		return this.decrypt(key, bytes, true)
	}

	/**
	 * Decrypts byte array without enforcing authentication.
	 *
	 * ONLY USE FOR LEGACY data!
	 *
	 * @deprecated
	 */
	public decryptBytesDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array): Uint8Array {
		return this.decrypt(key, bytes, true, true, true)
	}

	/**
	 * Decrypts a key without enforcing authentication.
	 *
	 * ONLY USE FOR LEGACY data!
	 *
	 * @deprecated
	 */
	public decryptKeyDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array): AesKey {
		return uint8ArrayToKey(this.decrypt(key, bytes, false, false, true))
	}

	/**
	 * Encrypts a hex coded key with AES in CBC mode.
	 *
	 * @param key          The key to use for the encryption.
	 * @param keyToEncrypt The key that shall be encrypted.
	 * @return The encrypted key.
	 */
	encryptKey(key: AesKey, keyToEncrypt: AesKey): Uint8Array {
		switch (getAndVerifyAesKeyLength(key)) {
			case AesKeyLength.Aes128:
				return this.encryptImpl(key, keyToUint8Array(keyToEncrypt), false, false, SymmetricCipherVersion.UnusedReservedUnauthenticated)
			case AesKeyLength.Aes256:
				// we never authenticate keys encrypted with a legacy AES-128 key, because we rotate all keys to 256 to ensure authentication
				return this.encrypt(key, keyToUint8Array(keyToEncrypt), false, SymmetricCipherVersion.AesCbcThenHmac)
		}
	}

	/**
	 * Decrypts a key with AES in CBC mode.
	 *
	 * @param key   The key to use for the decryption.
	 * @param bytes The key that shall be decrypted.
	 * @return The decrypted key.
	 */
	public decryptKey(key: AesKey, bytes: Uint8Array): AesKey {
		switch (getAndVerifyAesKeyLength(key)) {
			case AesKeyLength.Aes128:
				return uint8ArrayToKey(this.decrypt(key, bytes, false, false))
			case AesKeyLength.Aes256:
				return uint8ArrayToKey(this.decrypt(key, bytes, false))
		}
	}

	private encrypt(
		key: AesKey,
		plainText: Uint8Array,
		padding: boolean,
		cipherVersion: SymmetricCipherVersion,
		skipAuthentication: boolean = false,
	): Uint8Array {
		return this.encryptImpl(key, plainText, true, padding, cipherVersion, skipAuthentication)
	}

	private encryptImpl(
		key: AesKey,
		plainText: Uint8Array,
		hasRandomIv: boolean,
		padding: boolean,
		cipherVersion: SymmetricCipherVersion,
		skipAuthentication: boolean = false,
	): Uint8Array {
		const iv = hasRandomIv ? this.generateIV() : FIXED_IV
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac:
				return this.aesCbcFacade.encrypt(key, plainText, hasRandomIv, iv, padding, cipherVersion, skipAuthentication)
			case SymmetricCipherVersion.Aead:
				assert(hasRandomIv, "AEAD requires random IV")
				// we can only use this once all clients support it
				throw new Error("Not enabled")
		}
	}

	private decrypt(key: AesKey, cipherText: Uint8Array, padding: boolean, randomIv: boolean = true, skipAuthentication: boolean = false): Uint8Array {
		const cipherVersion = getSymmetricCipherVersion(cipherText)
		//TODO this is not necessary if we also enforce authentication during key derivation
		if (!skipAuthentication) {
			this.enforceAuthenticationWherePossible(cipherVersion, key)
		}
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac: {
				return this.aesCbcFacade.decrypt(key, cipherText, randomIv, padding, cipherVersion, skipAuthentication)
			}
			case SymmetricCipherVersion.Aead: {
				// use this as soon as we define what to use as associated data
				throw new Error("not yet enabled")
			}
		}
	}

	private enforceAuthenticationWherePossible(cipherVersion: SymmetricCipherVersion, key: AesKey) {
		if (cipherVersion === SymmetricCipherVersion.UnusedReservedUnauthenticated && getAndVerifyAesKeyLength(key) !== AesKeyLength.Aes128) {
			// if there is no version byte there also is no mac. so we throw here.
			// we cannot enforce for the legacy aes128 keys as there are untagged ciphertexts that we must remain compatibility with
			throw new CryptoError("mac is enforced but not present")
		}
	}

	private generateIV(): Uint8Array {
		return random.generateRandomData(IV_BYTE_LENGTH)
	}
}
export const SYMMETRIC_CIPHER_FACADE = new SymmetricCipherFacade(AES_CBC_FACADE)
