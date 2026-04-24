import { AesKey, FIXED_IV, generateIV, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { AES_CBC_FACADE, AesCbcFacade } from "./AesCbcFacade.js"
import { getSymmetricCipherVersion, SymmetricAeadCipherVersion, SymmetricAesCipherVersion, SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { isKeyVersion, KeyVersion, Nullable, stringToUtf8Uint8Array } from "@tutao/utils"
import { AesKeyLength, getAndVerifyAesKeyLength } from "./AesKeyLength"
import { AEAD_FACADE, AeadFacade } from "./AeadFacade.js"
import { AeadSubKeys, AesSubKeys, SYMMETRIC_KEY_DERIVER, SymmetricKeyDeriver, SymmetricSubKeys } from "./SymmetricKeyDeriver.js"
import { DomainSeparator, UNIT_SEPARATOR_CHAR } from "../../misc/Constants.js"
import { CryptoError } from "../../error.js"

export const AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN: DomainSeparator = `attributeEncGK${UNIT_SEPARATOR_CHAR}`
export const AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN: DomainSeparator = `attributeEncSK${UNIT_SEPARATOR_CHAR}`

function createCache<K, S extends string | number | boolean, V>(serialize: (key: K) => S) {
	const map = new Map<S, V>()

	return {
		get(key: K): V | undefined {
			return map.get(serialize(key))
		},
		set(key: K, value: V): void {
			map.set(serialize(key), value)
		},
		has(key: K): boolean {
			return map.has(serialize(key))
		},
	}
}

type InstanceAesSubKeyCacheKey = {
	cipherVersion: SymmetricAesCipherVersion
	aesKey: AesKey
}

interface InstanceAesSubKeyCache {
	set: (instanceSubKeyCacheKey: InstanceAesSubKeyCacheKey, cachedKey: SymmetricSubKeys) => void
	get: (instanceSubKeyCacheKey: InstanceAesSubKeyCacheKey) => SymmetricSubKeys | undefined
	has: (instanceSubKeyCacheKey: InstanceAesSubKeyCacheKey) => boolean
}

type InstanceAeadSubKeyCacheKey = {
	cipherVersion: SymmetricAeadCipherVersion
	aesKey: AesKey
}

interface InstanceAeadSubKeyCache {
	set: (instanceSubKeyCacheKey: InstanceAeadSubKeyCacheKey, cachedKey: AeadSubKeys) => void
	get: (instanceSubKeyCacheKey: InstanceAeadSubKeyCacheKey) => AeadSubKeys | undefined
	has: (instanceSubKeyCacheKey: InstanceAeadSubKeyCacheKey) => boolean
}

function serializeInstanceSubKeyCacheKey(key: InstanceAesSubKeyCacheKey | InstanceAeadSubKeyCacheKey): string {
	return `${key.cipherVersion},[${key.aesKey.join(",")}]`
}

/**
 * Decrypts one attribute of one given instance.
 */
export interface ValueDecryptor {
	readonly requiredGroupKeyVersion: "none" | KeyVersion
	getValue(key?: Nullable<AesKey>): Uint8Array
}

class AesCbcDecryptor implements ValueDecryptor {
	readonly requiredGroupKeyVersion = "none" as const
	constructor(
		private readonly ciphertext: Uint8Array,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly cipherVersion: SymmetricAesCipherVersion,
		private readonly sessionKey: AesKey,
		private readonly instanceAesSubKeyCache: InstanceAesSubKeyCache,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}
	getValue(): Uint8Array {
		const instanceAesSubKeyCacheKey = {
			cipherVersion: this.cipherVersion,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceAesSubKeyCache.get(instanceAesSubKeyCacheKey)
		if (subKeys === undefined) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeys(this.sessionKey, this.cipherVersion)
			this.instanceAesSubKeyCache.set(instanceAesSubKeyCacheKey, subKeys)
		}
		return this.aesCbcFacade.decrypt(subKeys, this.ciphertext, true, true, this.cipherVersion)
	}
}

class AeadWithGroupKeyDecryptor implements ValueDecryptor {
	constructor(
		private readonly ciphertext: Uint8Array,
		private readonly aeadFacade: AeadFacade,
		readonly requiredGroupKeyVersion: KeyVersion,
		private readonly kdfNonce: Uint8Array,
		private readonly globalInstanceTypeId: string,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly associatedData: Uint8Array,
		private readonly instanceAeadSubKeyCache: InstanceAeadSubKeyCache,
	) {}

	getValue(key: Nullable<AesKey>): Uint8Array {
		if (key == null) {
			throw new CryptoError("AEAD decryption of failed because of a missing group key.")
		}
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithGroupKey,
			aesKey: key,
		}
		let subKeys = this.instanceAeadSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys === undefined) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadFromGroupKey(
				{ object: key, version: this.requiredGroupKeyVersion },
				this.kdfNonce,
				this.globalInstanceTypeId,
			)
			this.instanceAeadSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.ciphertext, this.associatedData)
	}
}

class AeadWithSessionKeyDecryptor implements ValueDecryptor {
	readonly requiredGroupKeyVersion = "none" as const
	constructor(
		private readonly ciphertext: Uint8Array,
		private readonly aeadFacade: AeadFacade,
		private readonly sessionKey: AesKey,
		private readonly globalInstanceTypeId: string,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
		private readonly associatedData: Uint8Array,
		private readonly instanceAeadSubKeyCache: InstanceAeadSubKeyCache,
	) {}
	getValue(): Uint8Array {
		const instanceAeadSubKeyCacheKey = {
			cipherVersion: SymmetricCipherVersion.AeadWithSessionKey,
			aesKey: this.sessionKey,
		}
		let subKeys = this.instanceAeadSubKeyCache.get(instanceAeadSubKeyCacheKey)
		if (subKeys === undefined) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeysAeadFromSessionKey(this.sessionKey, this.globalInstanceTypeId)
			this.instanceAeadSubKeyCache.set(instanceAeadSubKeyCacheKey, subKeys)
		}
		return this.aeadFacade.decrypt(subKeys, this.ciphertext, this.associatedData)
	}
}

export const MissingSessionKey = "missing session key" as const
export type MissingSessionKey = typeof MissingSessionKey

export class InstanceDecryptor {
	private readonly instanceAesSubKeyCache: InstanceAesSubKeyCache = createCache(serializeInstanceSubKeyCacheKey)
	private readonly instanceAeadSubKeyCache: InstanceAeadSubKeyCache = createCache(serializeInstanceSubKeyCacheKey)

	constructor(
		private readonly sessionKey: Nullable<AesKey>,
		private readonly nullableKdfNonce: Nullable<Uint8Array>,
		private readonly globalInstanceTypeId: string,
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly aeadFacade: AeadFacade,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {}

	getValueDecryptor(ciphertext: Uint8Array, fieldPath: string): ValueDecryptor | MissingSessionKey {
		const cipherVersion = getSymmetricCipherVersion(ciphertext)
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac: {
				if (this.sessionKey === null) {
					return MissingSessionKey
				}
				return new AesCbcDecryptor(ciphertext, this.aesCbcFacade, cipherVersion, this.sessionKey, this.instanceAesSubKeyCache, this.symmetricKeyDeriver)
			}
			case SymmetricCipherVersion.AeadWithGroupKey: {
				if (this.nullableKdfNonce === null) {
					throw new CryptoError("no kdf nonce for group key encrypted value")
				}
				const keyVersion = this.getGroupKeyVersion(ciphertext)
				const associatedData = stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN + fieldPath)
				return new AeadWithGroupKeyDecryptor(
					ciphertext,
					this.aeadFacade,
					keyVersion,
					this.nullableKdfNonce,
					this.globalInstanceTypeId,
					this.symmetricKeyDeriver,
					associatedData,
					this.instanceAeadSubKeyCache,
				)
			}
			case SymmetricCipherVersion.AeadWithSessionKey: {
				if (this.sessionKey === null) {
					return MissingSessionKey
				}
				const associatedData = stringToUtf8Uint8Array(AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN + fieldPath)
				return new AeadWithSessionKeyDecryptor(
					ciphertext,
					this.aeadFacade,
					this.sessionKey,
					this.globalInstanceTypeId,
					this.symmetricKeyDeriver,
					associatedData,
					this.instanceAeadSubKeyCache,
				)
			}
		}
	}

	private getGroupKeyVersion(ciphertext: Uint8Array): KeyVersion {
		const keyVersionLengthByte = ciphertext[1]
		if (keyVersionLengthByte !== 0) {
			throw new CryptoError("Currently only one byte is supported for group key versions")
		}
		const groupKeyVersion = ciphertext[2]
		if (isKeyVersion(groupKeyVersion)) {
			return groupKeyVersion
		} else {
			throw new CryptoError("Unsupported group key version number")
		}
	}
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
	private readonly subtleCryptoAvailable: boolean
	constructor(
		private readonly aesCbcFacade: AesCbcFacade,
		private readonly aeadFacade: AeadFacade,
		private readonly symmetricKeyDeriver: SymmetricKeyDeriver,
	) {
		this.subtleCryptoAvailable = crypto.subtle != null
		if (!this.subtleCryptoAvailable) {
			console.log("SubtleCrypto is not available, falling back to JS AES impl of decryption")
		}
	}

	getInstanceDecryptor(sessionKey: Nullable<AesKey>, kdfNonce: Nullable<Uint8Array>, instanceTypeId: string): InstanceDecryptor {
		return new InstanceDecryptor(sessionKey, kdfNonce, instanceTypeId, this.aesCbcFacade, this.aeadFacade, this.symmetricKeyDeriver)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode.
	 *
	 * @param key   The key to use for the encryption.
	 * @param bytes The data to encrypt.
	 * @return The encrypted bytes.
	 */
	encryptBytes(key: AesKey | AesSubKeys, bytes: Uint8Array): Uint8Array {
		return this.encrypt(key, bytes, true, SymmetricCipherVersion.AesCbcThenHmac)
	}

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
		return this.encrypt(key, bytes, true, SymmetricCipherVersion.UnusedReservedUnauthenticated, true, true)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode with a custom IV.
	 *
	 * @deprecated use encryptBytes instead
	 */
	encryptBytesDeprecatedCustomIv(key: AesKey, bytes: Uint8Array, iv: Uint8Array): Uint8Array {
		const cipherVersion: SymmetricAesCipherVersion = SymmetricCipherVersion.AesCbcThenHmac
		const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		return this.aesCbcFacade.encrypt(subKeys, bytes, true, iv, true, cipherVersion)
	}

	/**
	 * Encrypts a byte array with AES in CBC mode with a custom IV.
	 *
	 * Forces encryption without authentication. The custom IV is prepended to the returned CBC ciphertext.
	 *
	 * @deprecated use encryptBytes instead.
	 */
	encryptBytesDeprecatedUnauthenticatedCustomIv(key: AesKey, bytes: Uint8Array, iv: Uint8Array): Uint8Array {
		const cipherVersion: SymmetricAesCipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated
		const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		return this.aesCbcFacade.encrypt(subKeys, bytes, true, iv, true, cipherVersion, true)
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

	public async asyncDecryptBytes(key: AesKey, bytes: Uint8Array): Promise<Uint8Array> {
		if (this.subtleCryptoAvailable) {
			return this.decryptAsync(key, bytes)
		} else {
			return this.decrypt(key, bytes, true)
		}
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
	 * Must include an iv in the ciphertext.
	 *
	 * ONLY USE FOR LEGACY data!
	 *
	 * @deprecated
	 */
	public decryptKeyDeprecatedUnauthenticated(key: AesKey, bytes: Uint8Array): AesKey {
		return uint8ArrayToKey(this.decrypt(key, bytes, false, true, true))
	}

	/**
	 * Decrypts a key without enforcing authentication.
	 * The fixed IV will be used and must not be included in the ciphertext.
	 *
	 * ONLY USE FOR LEGACY data!
	 *
	 * @deprecated
	 */
	public decryptKeyDeprecatedUnauthenticatedFixedIv(key: AesKey, bytes: Uint8Array): AesKey {
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
				// we never authenticate keys encrypted with a legacy AES-128 key, because we rotate all keys to 256 to ensure authentication
				return this.encrypt(key, keyToUint8Array(keyToEncrypt), false, SymmetricCipherVersion.UnusedReservedUnauthenticated, false)
			case AesKeyLength.Aes256:
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
		key: AesKey | AesSubKeys,
		plaintext: Uint8Array,
		padding: boolean,
		cipherVersion: SymmetricAesCipherVersion,
		mustGenerateRandomIv: boolean = true,
		skipAuthenticationEnforcement: boolean = false,
	): Uint8Array {
		const iv = mustGenerateRandomIv ? generateIV() : FIXED_IV
		let subKeys: AesSubKeys
		if (Array.isArray(key)) {
			subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
		} else {
			subKeys = key
		}
		return this.aesCbcFacade.encrypt(subKeys, plaintext, mustGenerateRandomIv, iv, padding, cipherVersion, skipAuthenticationEnforcement)
	}

	private encryptWithAead(subKeys: AeadSubKeys, plaintext: Uint8Array, associatedData: Uint8Array): Uint8Array {
		return this.aeadFacade.encrypt(subKeys, plaintext, associatedData)
	}

	private decrypt(
		key: AesKey,
		cipherText: Uint8Array,
		padding: boolean,
		hasPrependedIv: boolean = true,
		skipAuthenticationEnforcement: boolean = false,
	): Uint8Array {
		const cipherVersion = getSymmetricCipherVersion(cipherText)
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac: {
				const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
				return this.aesCbcFacade.decrypt(subKeys, cipherText, hasPrependedIv, padding, cipherVersion, skipAuthenticationEnforcement)
			}
			case SymmetricCipherVersion.AeadWithGroupKey:
			case SymmetricCipherVersion.AeadWithSessionKey: {
				// use this as soon as we define what to use as associated data
				throw new Error("not yet enabled")
			}
		}
	}

	private decryptAsync(
		key: AesKey,
		cipherText: Uint8Array,
		hasPrependedIv: boolean = true,
		skipAuthenticationEnforcement: boolean = false,
	): Promise<Uint8Array> {
		const cipherVersion = getSymmetricCipherVersion(cipherText)
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
			case SymmetricCipherVersion.AesCbcThenHmac: {
				const subKeys = this.symmetricKeyDeriver.deriveSubKeys(key, cipherVersion)
				return this.aesCbcFacade.decryptAsync(subKeys, cipherText, hasPrependedIv, cipherVersion, skipAuthenticationEnforcement)
			}
			case SymmetricCipherVersion.AeadWithGroupKey:
			case SymmetricCipherVersion.AeadWithSessionKey: {
				// use this as soon as we define what to use as associated data
				throw new Error("not yet enabled")
			}
		}
	}
}
export const SYMMETRIC_CIPHER_FACADE = new SymmetricCipherFacade(AES_CBC_FACADE, AEAD_FACADE, SYMMETRIC_KEY_DERIVER)
