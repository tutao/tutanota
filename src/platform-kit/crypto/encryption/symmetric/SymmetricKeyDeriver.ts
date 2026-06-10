import { AesKeyLength, getAndVerifyAesKeyLength, getKeyLengthInBytes } from "./AesKeyLength.js"
import { SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { Aes256Key, AesKey, KdfNonce, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"
import { blake3Kdf } from "../../hashes/Blake3.js"
import { concat, KeyVersion } from "@tutao/utils"
import { AEAD_GROUP_KEY_NONCE_DERIVATION, AEAD_SESSION_KEY_DERIVATION, VersionedKey } from "../../CryptoTypes"

export abstract class SymmetricSubKeys {
	abstract readonly cipherVersion: SymmetricCipherVersion

	constructor(
		public readonly encryptionKey: AesKey,
		public readonly authenticationKey: AesKey | null = null,
	) {}
}

export abstract class AesCbcSubKeys extends SymmetricSubKeys {
	constructor(encryptionKey: AesKey, authenticationKey: AesKey | null = null) {
		super(encryptionKey, authenticationKey)
	}
}

export class UnusedReservedUnauthenticatedSubKeys extends AesCbcSubKeys {
	override readonly cipherVersion = SymmetricCipherVersion.UnusedReservedUnauthenticated

	constructor(encryptionKey: AesKey) {
		super(encryptionKey)
	}
}

export class AesCbcThenHmacSubKeys extends AesCbcSubKeys {
	override readonly cipherVersion = SymmetricCipherVersion.AesCbcThenHmac

	constructor(
		encryptionKey: AesKey,
		override readonly authenticationKey: AesKey,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export abstract class AeadSubKeys extends SymmetricSubKeys {
	constructor(
		encryptionKey: AesKey,
		override readonly authenticationKey: AesKey,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export class AeadWithGroupKeySubKeys extends AeadSubKeys {
	override readonly cipherVersion = SymmetricCipherVersion.AeadWithGroupKey

	constructor(
		public readonly groupKeyVersion: KeyVersion,
		encryptionKey: Aes256Key,
		override readonly authenticationKey: Aes256Key,
	) {
		super(encryptionKey, authenticationKey)
	}
}

export class AeadWithSessionKeySubKeys extends AeadSubKeys {
	override cipherVersion = SymmetricCipherVersion.AeadWithSessionKey

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
	deriveSubKeysAesCbc(key: AesKey): AesCbcSubKeys {
		const keyLength = getAndVerifyAesKeyLength(key)
		let hashedKey: Uint8Array
		switch (keyLength) {
			case AesKeyLength.Aes128:
				hashedKey = sha256Hash(keyToUint8Array(key))
				break
			case AesKeyLength.Aes256:
				hashedKey = sha512Hash(keyToUint8Array(key))
				break
		}
		const keyLengthInBytes = getKeyLengthInBytes(keyLength)
		return new AesCbcThenHmacSubKeys(
			uint8ArrayToKey(hashedKey.subarray(0, keyLengthInBytes)),
			uint8ArrayToKey(hashedKey.subarray(keyLengthInBytes, hashedKey.length)),
		)
	}

	/**
	 * Derive encryption and authentication keys for AEAD from groupKey in the correct version and kdfNonce for the instance type.
	 */
	deriveSubKeysAeadFromGroupKey(groupKey: VersionedKey, kdfNonce: KdfNonce, instanceTypeId: InstanceTypeId): AeadSubKeys {
		const context = `${AEAD_GROUP_KEY_NONCE_DERIVATION}${instanceTypeId.app}/${instanceTypeId.id}`
		const inputKeyMaterial = concat(keyToUint8Array(groupKey.object), kdfNonce)
		const keys = this.deriveAeadSubKeys(inputKeyMaterial, context)
		return new AeadWithGroupKeySubKeys(groupKey.version, keys.encryptionKey, keys.authenticationKey)
	}

	/**
	 * Derive encryption and authentication keys for AEAD from the session key for the instance type.
	 */
	deriveSubKeysAeadFromSessionKey(sessionKey: AesKey, instanceTypeId: InstanceTypeId): AeadSubKeys {
		const context = `${AEAD_SESSION_KEY_DERIVATION}${instanceTypeId.app}/${instanceTypeId.id}`
		const inputKeyMaterial = keyToUint8Array(sessionKey)
		const keys = this.deriveAeadSubKeys(inputKeyMaterial, context)
		return new AeadWithSessionKeySubKeys(keys.encryptionKey, keys.authenticationKey)
	}

	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array<ArrayBufferLike>, context: string): EncryptionAndAuthenticationKey {
		const derivedBytes = blake3Kdf(inputKeyMaterial, context, DEFAULT_TOTAL_KEY_LENGTH_BYTES)

		const encryptionKey = uint8ArrayToKey(derivedBytes.subarray(0, DEFAULT_LENGTH_PER_KEY_BYTES), AesKeyLength.Aes256)
		const authenticationKey = uint8ArrayToKey(derivedBytes.subarray(DEFAULT_LENGTH_PER_KEY_BYTES, DEFAULT_TOTAL_KEY_LENGTH_BYTES), AesKeyLength.Aes256)
		return { encryptionKey, authenticationKey }
	}
}

type EncryptionAndAuthenticationKey = {
	encryptionKey: Aes256Key
	authenticationKey: Aes256Key
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
