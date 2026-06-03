import {
	AesKey,
	generateInitializationVector,
	InitializationVector,
	KdfNonce,
	keyToUint8Array,
	uint8ArrayToKey,
} from "../encryption/symmetric/SymmetricCipherUtils.js"
import { AES_CBC_FACADE, AesCbcFacade, AuthenticationEnforcement, PaddingStandard } from "../encryption/symmetric/AesCbcFacade.js"
import { SymmetricAesCbcCipherVersion, SymmetricCipherVersion } from "../encryption/symmetric/SymmetricCipherVersion.js"
import { Nullable } from "@tutao/utils"
import { AesKeyLength, getAndVerifyAesKeyLength } from "../encryption/symmetric/AesKeyLength"
import { AEAD_FACADE, AeadFacade } from "../encryption/symmetric/AeadFacade.js"
import { AeadSubKeys, AesCbcSubKeys, InstanceTypeId, SYMMETRIC_KEY_DERIVER, SymmetricKeyDeriver } from "../encryption/symmetric/SymmetricKeyDeriver.js"
import { SubKeyInfo, SubKeyProvider } from "./encryption/SubKeyProvider"
import { InstanceDecryptor } from "./decryption/InstanceDecryptor"
import { InitializationVectorSource, InitializationVectorVariant, parseVersionedCiphertext } from "../encryption/symmetric/ParsedCiphertext"

export enum SymmetricEncryptionScheme {
	AesCbc,
	Aead,
}

/**
 * This facade contains all methods for encryption/ decryption for symmetric encryption incl. AES-128 and AES-256 in CBC mode or AEAD.
 *
 * Depending on the symmetric cipher version it adds an HMAC tag (Encrypt-then-Mac), in which case two different keys for encryption and authentication are
 * derived from the provided secret key.
 *
 * In case of AEAD, there is additional associated data. Needed both for encryption and decryption, but it is not part of the created ciphertext.
 */
export class SymmetricCipherFacade {
	/** whether we can use SubtleCrypto for big chunks of data (we use JS impl for most encryption) */
	readonly subtleCryptoAvailable: boolean
	constructor(
		readonly aesCbcFacade: AesCbcFacade,
		readonly aeadFacade: AeadFacade,
		readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {
		this.subtleCryptoAvailable = crypto.subtle != null
		if (!this.subtleCryptoAvailable) {
			console.log("SubtleCrypto is not available, falling back to JS AES impl of decryption")
		}
	}

	/**
	 * Gets an instance decryptor which provides value decryptors to decrypt the values of a given instance.
	 *
	 * @param sessionKey		The session key of the instance. It can be null if no value is encrypted using it.
	 * @param kdfNonce			The KDF nonce of the instance. It can be null if no value is encrypted using the group key.
	 * @param instanceTypeId	The instance type ID of the instance being decrypted.
	 * @return					The instance decryptor.
	 */
	getInstanceDecryptor(sessionKey: Nullable<AesKey>, kdfNonce: Nullable<KdfNonce>, instanceTypeId: InstanceTypeId): InstanceDecryptor {
		return new InstanceDecryptor(sessionKey, kdfNonce, instanceTypeId, this.aesCbcFacade, this.aeadFacade, this.symmetricKeyDeriver)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode.
	 *
	 * @param key   The key or the sub-keys to use for the encryption.
	 * @param bytes The data to encrypt.
	 * @return The encrypted bytes.
	 */
	encryptBytes(key: AesKey | AesCbcSubKeys, bytes: Uint8Array): Uint8Array {
		return this.encrypt(key, bytes, PaddingStandard.Pkcs5, SymmetricCipherVersion.AesCbcThenHmac)
	}

	/**
	 * Encrypts a byte array with our AEAD scheme.
	 *
	 * @param subKeys			The sub-keys to use for the encryption.
	 * @param bytes				The data to encrypt.
	 * @param associatedData	The associated data to include in the authentication tag computation, to bind the ciphertext to its context.
	 * @return					The encrypted bytes.
	 */
	encryptBytesWithAead(subKeys: AeadSubKeys, bytes: Uint8Array, associatedData: Uint8Array): Uint8Array {
		return this.encryptWithAead(subKeys, bytes, associatedData)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode.
	 *
	 * Forces encryption without authentication. Only use in backward compatibility tests.
	 *
	 * @deprecated
	 */
	encryptBytesDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array): Uint8Array {
		return this.encrypt(
			key,
			bytes,
			PaddingStandard.Pkcs5,
			SymmetricCipherVersion.UnusedReservedUnauthenticated,
			InitializationVectorVariant.Random,
			AuthenticationEnforcement.Relaxed,
		)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode with a custom initialization vector.
	 *
	 * @deprecated use encryptBytes instead
	 */
	encryptBytesDeprecatedCustomInitializationVector(key: AesKey, bytes: Uint8Array, initializationVector: InitializationVector): Uint8Array {
		const cipherVersion: SymmetricAesCbcCipherVersion = SymmetricCipherVersion.AesCbcThenHmac
		const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		return this.aesCbcFacade.encrypt(subKeys, bytes, initializationVector, PaddingStandard.Pkcs5, cipherVersion)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode with a custom initialization vector.
	 *
	 * Forces encryption without authentication. The custom initialization vector is prepended to the returned CBC ciphertext.
	 *
	 * @deprecated use encryptBytes instead.
	 */
	encryptBytesDeprecatedUnauthenticatedCustomInitializationVector(key: AesKey, bytes: Uint8Array, initializationVector: InitializationVector): Uint8Array {
		const cipherVersion: SymmetricAesCbcCipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
		const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		return this.aesCbcFacade.encrypt(subKeys, bytes, initializationVector, PaddingStandard.Pkcs5, cipherVersion, AuthenticationEnforcement.Relaxed)
	}

	/**
	 * Decrypts a byte array with AES in CBC mode.
	 *
	 * @param key   The key to use for the decryption.
	 * @param bytes A byte array that was encrypted with the same key before.
	 * @return The decrypted bytes.
	 */
	decryptBytes(key: AesKey, bytes: Uint8Array): Uint8Array {
		return this.decrypt(key, bytes, PaddingStandard.Pkcs5)
	}

	/**
	 * Decrypts a byte array with AES in CBC mode, using SubtleCrypto if it is available.
	 *
	 * @param key   The key to use for the decryption.
	 * @param bytes A byte array that was encrypted with the same key before.
	 * @return The decrypted bytes.
	 */
	async asyncDecryptBytes(key: AesKey, bytes: Uint8Array): Promise<Uint8Array> {
		if (this.subtleCryptoAvailable) {
			return this.decryptAsync(key, bytes)
		} else {
			return this.decrypt(key, bytes, PaddingStandard.Pkcs5)
		}
	}

	/**
	 * Decrypts a byte array without enforcing authentication.
	 *
	 * ONLY USE FOR LEGACY data!
	 *
	 * @deprecated
	 */
	decryptBytesDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array): Uint8Array {
		return this.decrypt(key, bytes, PaddingStandard.Pkcs5, InitializationVectorVariant.Random, AuthenticationEnforcement.Relaxed)
	}

	/**
	 * Decrypts a key without enforcing authentication.
	 * Must include an initialization vector in the ciphertext.
	 *
	 * ONLY USE FOR LEGACY data!
	 *
	 * @deprecated
	 */
	decryptKeyDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array): AesKey {
		return uint8ArrayToKey(this.decrypt(key, bytes, PaddingStandard.None, InitializationVectorVariant.Random, AuthenticationEnforcement.Relaxed))
	}

	/**
	 * Decrypts a key without enforcing authentication.
	 * The fixed initialization vector will be used and must not be included in the ciphertext.
	 *
	 * ONLY USE FOR LEGACY data!
	 *
	 * @deprecated
	 */
	decryptKeyDeprecatedUnauthenticatedFixedInitializationVector(key: AesKey, bytes: Uint8Array): AesKey {
		return uint8ArrayToKey(this.decrypt(key, bytes, PaddingStandard.None, InitializationVectorVariant.Fixed, AuthenticationEnforcement.Relaxed))
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
				// we never authenticate keys encrypted with a legacy AES-128 key, because we rotate all keys to 256 to ensure authentication
				return this.encrypt(
					key,
					keyToUint8Array(keyToEncrypt),
					PaddingStandard.None,
					SymmetricCipherVersion.UnusedReservedUnauthenticated,
					InitializationVectorVariant.Fixed,
				)
			case AesKeyLength.Aes256:
				return this.encrypt(key, keyToUint8Array(keyToEncrypt), PaddingStandard.None, SymmetricCipherVersion.AesCbcThenHmac)
		}
	}

	/**
	 * Decrypts a key with AES in CBC mode.
	 *
	 * @param key   The key to use for the decryption.
	 * @param bytes The key that shall be decrypted.
	 * @param acceptedBitLength The accepted length of the key that shall be decrypted.
	 * @return The decrypted key.
	 */
	decryptKey(key: AesKey, bytes: Uint8Array, acceptedBitLength?: AesKeyLength): AesKey {
		switch (getAndVerifyAesKeyLength(key)) {
			case AesKeyLength.Aes128:
				return uint8ArrayToKey(this.decrypt(key, bytes, PaddingStandard.None, InitializationVectorVariant.Fixed), acceptedBitLength)
			case AesKeyLength.Aes256:
				return uint8ArrayToKey(this.decrypt(key, bytes, PaddingStandard.None), acceptedBitLength)
		}
	}

	encrypt(
		key: AesKey | AesCbcSubKeys,
		plaintext: Uint8Array,
		paddingStandard: PaddingStandard,
		cipherVersion: SymmetricAesCbcCipherVersion,
		initializationVectorVariant: InitializationVectorVariant = InitializationVectorVariant.Random,
		authenticationEnforcement: AuthenticationEnforcement = AuthenticationEnforcement.Strict,
	): Uint8Array {
		const initializationVector: InitializationVectorSource =
			initializationVectorVariant === InitializationVectorVariant.Random ? generateInitializationVector() : initializationVectorVariant
		let subKeys: AesCbcSubKeys
		if (Array.isArray(key)) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		} else {
			subKeys = key
		}
		return this.aesCbcFacade.encrypt(subKeys, plaintext, initializationVector, paddingStandard, cipherVersion, authenticationEnforcement)
	}

	encryptWithAead(subKeys: AeadSubKeys, plaintext: Uint8Array, associatedData: Uint8Array): Uint8Array {
		return this.aeadFacade.encrypt(subKeys, plaintext, associatedData)
	}

	decrypt(
		key: AesKey,
		cipherText: Uint8Array,
		paddingStandard: PaddingStandard,
		initializationVectorVariant: InitializationVectorVariant = InitializationVectorVariant.Random,
		authenticationEnforcement: AuthenticationEnforcement = AuthenticationEnforcement.Strict,
	): Uint8Array {
		const parsedCiphertext = parseVersionedCiphertext(cipherText, initializationVectorVariant)
		switch (parsedCiphertext.cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac: {
				const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, parsedCiphertext.cipherVersion)
				return this.aesCbcFacade.decrypt(subKeys, parsedCiphertext, paddingStandard, authenticationEnforcement)
			}
			case SymmetricCipherVersion.AeadWithGroupKey:
			case SymmetricCipherVersion.AeadWithSessionKey: {
				// use this as soon as we define what to use as associated data
				throw new Error("not yet enabled")
			}
		}
	}

	decryptAsync(
		key: AesKey,
		ciphertext: Uint8Array,
		initializationVectorVariant: InitializationVectorVariant = InitializationVectorVariant.Random,
		authenticationEnforcement: AuthenticationEnforcement = AuthenticationEnforcement.Strict,
	): Promise<Uint8Array> {
		const parsedCiphertext = parseVersionedCiphertext(ciphertext, initializationVectorVariant)
		switch (parsedCiphertext.cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac: {
				const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, parsedCiphertext.cipherVersion)
				return this.aesCbcFacade.decryptAsync(subKeys, parsedCiphertext, authenticationEnforcement)
			}
			case SymmetricCipherVersion.AeadWithGroupKey:
			case SymmetricCipherVersion.AeadWithSessionKey: {
				// use this as soon as we define what to use as associated data
				throw new Error("not yet enabled")
			}
		}
	}

	/**
	 * Gets a sub-key provider to be used for encryption.
	 *
	 * @param subKeyInfo		Necessary information to derive the sub-keys.
	 * @param instanceTypeId	The type ID of the instance to be encrypted using the sub-keys.
	 * @return 					The sub-key provider.
	 */
	getSubKeyProvider(subKeyInfo: SubKeyInfo, instanceTypeId: InstanceTypeId) {
		return new SubKeyProvider(subKeyInfo, this.symmetricKeyDeriver, instanceTypeId)
	}
}
export const SYMMETRIC_CIPHER_FACADE = new SymmetricCipherFacade(AES_CBC_FACADE, AEAD_FACADE, SYMMETRIC_KEY_DERIVER)
