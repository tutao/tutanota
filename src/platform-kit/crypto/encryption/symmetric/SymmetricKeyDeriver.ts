import { AesKeyLength, getKeyLengthInBytes } from "./AesKeyLength.js"
import { SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { Aes128Key, Aes256Key, AesKey, KdfNonce, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"
import { blake3Kdf } from "../../hashes/Blake3.js"
import { concat, KeyVersion } from "@tutao/utils"
import { AEAD_GROUP_KEY_NONCE_DERIVATION, AEAD_SESSION_KEY_DERIVATION, VersionedKey } from "../../CryptoTypes"
import { ProgrammingError } from "@tutao/app-env"
import { CryptoError } from "@tutao/crypto/error"

export abstract class KeyOrSubKey {}
export abstract class SymmetricSubKeys extends KeyOrSubKey {
	abstract readonly cipherVersion: SymmetricCipherVersion

	constructor(
		public readonly encryptionKey: AesKey,
		public readonly authenticationKey: AesKey | null = null,
	) {
		super()
	}
}

export abstract class AesCbcSubKeys extends SymmetricSubKeys {
	constructor(encryptionKey: AesKey, authenticationKey: AesKey | null = null) {
		super(encryptionKey, authenticationKey)
	}
}

export class UnusedReservedUnauthenticatedSubKeys extends AesCbcSubKeys {
	override readonly cipherVersion: typeof SymmetricCipherVersion.UnusedReservedUnauthenticated = SymmetricCipherVersion.UnusedReservedUnauthenticated

	constructor(encryptionKey: AesKey) {
		super(encryptionKey)
	}
}

export class AesCbcThenHmacSubKeys extends AesCbcSubKeys {
	override readonly cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac = SymmetricCipherVersion.AesCbcThenHmac

	constructor(
		encryptionKey: AesKey,
		override readonly authenticationKey: AesKey,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export abstract class AeadSubKeys extends SymmetricSubKeys {
	constructor(
		override readonly encryptionKey: Aes256Key,
		override readonly authenticationKey: Aes256Key,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export class AeadWithGroupKeySubKeys extends AeadSubKeys {
	override readonly cipherVersion: typeof SymmetricCipherVersion.AeadWithGroupKey = SymmetricCipherVersion.AeadWithGroupKey

	constructor(
		public readonly groupKeyVersion: KeyVersion,
		encryptionKey: Aes256Key,
		authenticationKey: Aes256Key,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export class AeadWithSessionKeySubKeys extends AeadSubKeys {
	override cipherVersion: typeof SymmetricCipherVersion.AeadWithSessionKey = SymmetricCipherVersion.AeadWithSessionKey

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
	 * Derive encryption and authentication keys for AEAD from groupKey in the correct version and kdfNonce for the instance type.
	 */
	deriveSubKeysAeadFromGroupKey(groupKey: VersionedKey, kdfNonce: KdfNonce, instanceTypeId: InstanceTypeId): AeadWithGroupKeySubKeys {
		const context = `${AEAD_GROUP_KEY_NONCE_DERIVATION}${instanceTypeId.app}/${instanceTypeId.id}`
		const inputKeyMaterial = concat(keyToUint8Array(groupKey.object), kdfNonce)
		return this.deriveAeadSubKeys(inputKeyMaterial, context, groupKey.version)
	}

	/**
	 * Derive encryption and authentication keys for AEAD from the session key for the instance type.
	 */
	deriveSubKeysAeadFromSessionKey(sessionKey: AesKey, instanceTypeId: InstanceTypeId): AeadWithSessionKeySubKeys {
		const context = `${AEAD_SESSION_KEY_DERIVATION}${instanceTypeId.app}/${instanceTypeId.id}`
		const inputKeyMaterial = keyToUint8Array(sessionKey)
		return this.deriveAeadSubKeys(inputKeyMaterial, context)
	}

	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string): AeadWithSessionKeySubKeys
	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string, groupKeyVersion: KeyVersion): AeadWithGroupKeySubKeys
	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string, groupKeyVersion?: KeyVersion): AeadSubKeys {
		const derivedBytes = blake3Kdf(inputKeyMaterial, context, DEFAULT_TOTAL_KEY_LENGTH_BYTES)

		const encryptionKey = uint8ArrayToKey(derivedBytes.subarray(0, DEFAULT_LENGTH_PER_KEY_BYTES), AesKeyLength.Aes256)
		const authenticationKey = uint8ArrayToKey(derivedBytes.subarray(DEFAULT_LENGTH_PER_KEY_BYTES, DEFAULT_TOTAL_KEY_LENGTH_BYTES), AesKeyLength.Aes256)
		if (groupKeyVersion == null) {
			return new AeadWithSessionKeySubKeys(encryptionKey, authenticationKey)
		} else {
			return new AeadWithGroupKeySubKeys(groupKeyVersion, encryptionKey, authenticationKey)
		}
	}
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
