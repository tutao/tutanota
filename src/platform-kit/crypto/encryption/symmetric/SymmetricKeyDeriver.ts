import { Aes128Key, Aes256Key, AesKey, AesKeyLength, AesKeyOrSubKeys, getKeyLengthInBytes } from "./AesKey.js"
import { SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { KdfNonce, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"
import { blake3Kdf } from "../../hashes/Blake3.js"
import { concat, KeyVersion } from "@tutao/utils"
import {
	AEAD_GROUP_KEY_NONCE_DERIVATION_FOR_INSTANCE_KEY,
	AEAD_INSTANCE_KEY_DERIVATION,
	AEAD_SESSION_KEY_DERIVATION,
	VersionedAes256Key,
	VersionedKey,
} from "../../CryptoTypes"
import { ProgrammingError } from "@tutao/app-env"
import { CryptoError } from "@tutao/crypto/error"

export abstract class SymmetricSubKeys extends AesKeyOrSubKeys {
	public abstract readonly cipherVersion: SymmetricCipherVersion

	protected constructor(
		public readonly encryptionKey: AesKey,
		public readonly authenticationKey: AesKey | null = null,
	) {
		super()
	}
}

export abstract class AesCbcSubKeys extends SymmetricSubKeys {
	protected constructor(encryptionKey: AesKey, authenticationKey: AesKey | null = null) {
		super(encryptionKey, authenticationKey)
	}
}

export class UnusedReservedUnauthenticatedSubKeys extends AesCbcSubKeys {
	public override readonly cipherVersion: typeof SymmetricCipherVersion.UnusedReservedUnauthenticated = SymmetricCipherVersion.UnusedReservedUnauthenticated

	constructor(encryptionKey: AesKey) {
		super(encryptionKey)
	}
}

export class AesCbcThenHmacSubKeys extends AesCbcSubKeys {
	public override readonly cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac = SymmetricCipherVersion.AesCbcThenHmac

	constructor(
		encryptionKey: AesKey,
		public override readonly authenticationKey: AesKey,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export abstract class AeadSubKeys extends SymmetricSubKeys {
	protected constructor(
		public override readonly encryptionKey: Aes256Key,
		public override readonly authenticationKey: Aes256Key,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export class AeadWithInstanceKeySubKeys extends AeadSubKeys {
	public override readonly cipherVersion: typeof SymmetricCipherVersion.AeadWithInstanceKey = SymmetricCipherVersion.AeadWithInstanceKey

	constructor(
		public readonly groupKeyVersion: KeyVersion,
		encryptionKey: Aes256Key,
		authenticationKey: Aes256Key,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export class AeadWithSessionKeySubKeys extends AeadSubKeys {
	public override readonly cipherVersion: typeof SymmetricCipherVersion.AeadWithSessionKey = SymmetricCipherVersion.AeadWithSessionKey

	constructor(encryptionKey: Aes256Key, authenticationKey: Aes256Key) {
		super(encryptionKey, authenticationKey)
	}
}

const DEFAULT_LENGTH_PER_KEY_BYTES = getKeyLengthInBytes(AesKeyLength.Aes256)
const DEFAULT_TOTAL_KEY_LENGTH_BYTES = 2 * DEFAULT_LENGTH_PER_KEY_BYTES

export interface InstanceTypeId {
	app: string
	id: number
	name: string
}

/**
 * Derives keys for symmetric encryption schemes.
 */
export class SymmetricKeyDeriver {
	/**
	 * Derives encryption and authentication keys as needed for the symmetric cipher implementations
	 */
	deriveSubKeysAesCbc(key: AesKey, cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac): AesCbcThenHmacSubKeys
	deriveSubKeysAesCbc(key: AesKey, cipherVersion: typeof SymmetricCipherVersion.UnusedReservedUnauthenticated): UnusedReservedUnauthenticatedSubKeys
	deriveSubKeysAesCbc(key: AesKey, cipherVersion: SymmetricCipherVersion): AesCbcSubKeys
	deriveSubKeysAesCbc(key: AesKey, cipherVersion: SymmetricCipherVersion): AesCbcSubKeys {
		switch (cipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
				return new UnusedReservedUnauthenticatedSubKeys(key)
			case SymmetricCipherVersion.AesCbcThenHmac: {
				let hashedKey: Uint8Array
				if (key instanceof Aes128Key) {
					hashedKey = sha256Hash(keyToUint8Array(key))
				} else if (key instanceof Aes256Key) {
					hashedKey = sha512Hash(keyToUint8Array(key))
				} else {
					throw new ProgrammingError("invalid key type")
				}
				const keyLengthInBytes: number = getKeyLengthInBytes(key.keyLength)
				return new AesCbcThenHmacSubKeys(
					uint8ArrayToKey(hashedKey.subarray(0, keyLengthInBytes)),
					uint8ArrayToKey(hashedKey.subarray(keyLengthInBytes, hashedKey.length)),
				)
			}
			default:
				throw new CryptoError(`unexpected cipher version ${cipherVersion}`)
		}
	}

	/**
	 * Derive instance key for AEAD from groupKey and Kdf nonce.
	 */
	deriveInstanceKey(groupKey: VersionedKey, kdfNonce: KdfNonce): VersionedAes256Key {
		const context = `${AEAD_GROUP_KEY_NONCE_DERIVATION_FOR_INSTANCE_KEY}$`
		const inputKeyMaterial = concat(keyToUint8Array(groupKey.object), kdfNonce)
		const derivedBytes = blake3Kdf(inputKeyMaterial, context, DEFAULT_LENGTH_PER_KEY_BYTES)
		return { object: uint8ArrayToKey(derivedBytes, AesKeyLength.Aes256), version: groupKey.version }
	}

	/**
	 * Derive encryption and authentication keys for AEAD from instanceKey in the correct groupKey version for the instance type.
	 */
	deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey: VersionedAes256Key, instanceTypeId: InstanceTypeId): AeadWithInstanceKeySubKeys {
		const context = `${AEAD_INSTANCE_KEY_DERIVATION}${instanceTypeId.app}/${instanceTypeId.id}`
		const inputKeyMaterial = keyToUint8Array(instanceKey.object)
		return this.deriveAeadSubKeys(inputKeyMaterial, context, instanceKey.version)
	}

	/**
	 * Derive encryption and authentication keys for AEAD with instanceKey from kdf nonce and groupKey in the correct groupKey version for the instance type.
	 */
	deriveSubKeysAeadWithInstanceKeyFromGroupKey(groupKey: VersionedKey, kdfNonce: KdfNonce, instanceTypeId: InstanceTypeId): AeadWithInstanceKeySubKeys {
		const instanceKey = this.deriveInstanceKey(groupKey, kdfNonce)
		return this.deriveSubKeysAeadWithInstanceKeyFromInstanceKey(instanceKey, instanceTypeId)
	}

	/**
	 * Derive encryption and authentication keys for AEAD from the session key for the instance type.
	 */
	deriveSubKeysAeadWithSessionKey(sessionKey: AesKey, instanceTypeId: InstanceTypeId): AeadWithSessionKeySubKeys {
		const context = `${AEAD_SESSION_KEY_DERIVATION}${instanceTypeId.app}/${instanceTypeId.id}`
		const inputKeyMaterial = keyToUint8Array(sessionKey)
		return this.deriveAeadSubKeys(inputKeyMaterial, context)
	}

	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string): AeadWithSessionKeySubKeys
	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string, groupKeyVersion: KeyVersion): AeadWithInstanceKeySubKeys
	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string, groupKeyVersion?: KeyVersion): AeadSubKeys {
		const derivedBytes = blake3Kdf(inputKeyMaterial, context, DEFAULT_TOTAL_KEY_LENGTH_BYTES)

		const encryptionKey = uint8ArrayToKey(derivedBytes.subarray(0, DEFAULT_LENGTH_PER_KEY_BYTES), AesKeyLength.Aes256)
		const authenticationKey = uint8ArrayToKey(derivedBytes.subarray(DEFAULT_LENGTH_PER_KEY_BYTES, DEFAULT_TOTAL_KEY_LENGTH_BYTES), AesKeyLength.Aes256)
		if (groupKeyVersion == null) {
			return new AeadWithSessionKeySubKeys(encryptionKey, authenticationKey)
		} else {
			return new AeadWithInstanceKeySubKeys(groupKeyVersion, encryptionKey, authenticationKey)
		}
	}
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
