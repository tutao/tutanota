import { AesKeyLength, getAndVerifyAesKeyLength, getKeyLengthInBytes } from "./AesKeyLength.js"
import { SymmetricAeadCipherVersionMaybeWithGroupKeyVersion, SymmetricAesCbcCipherVersion, SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { Aes256Key, AesKey, KdfNonce, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"
import { blake3Kdf } from "../../hashes/Blake3.js"
import { concat, KeyVersion } from "@tutao/utils"
import { CryptoError } from "../../error.js"
import { AEAD_GROUP_KEY_NONCE_DERIVATION, AEAD_SESSION_KEY_DERIVATION, VersionedKey } from "../../CryptoTypes"

export type UnusedReservedUnauthenticatedSubKeys = {
	cipherVersion: typeof SymmetricCipherVersion.UnusedReservedUnauthenticated
	encryptionKey: AesKey
	authenticationKey: null
}

export type AesCbcThenHmacSubKeys = {
	cipherVersion: typeof SymmetricCipherVersion.AesCbcThenHmac
	encryptionKey: AesKey
	authenticationKey: AesKey
}

export type AesCbcSubKeys = UnusedReservedUnauthenticatedSubKeys | AesCbcThenHmacSubKeys

export type AeadWithGroupKeySubKeys = {
	cipherVersion: typeof SymmetricCipherVersion.AeadWithGroupKey
	groupKeyVersion: KeyVersion
	encryptionKey: Aes256Key
	authenticationKey: Aes256Key
}

export type AeadWithSessionKeySubKeys = {
	cipherVersion: typeof SymmetricCipherVersion.AeadWithSessionKey
	encryptionKey: Aes256Key
	authenticationKey: Aes256Key
}

export type AeadSubKeys = AeadWithGroupKeySubKeys | AeadWithSessionKeySubKeys

export type SymmetricSubKeys = AesCbcSubKeys | AeadSubKeys

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
	deriveSubKeys(key: AesKey, symmetricCipherVersion: SymmetricAesCbcCipherVersion): AesCbcSubKeys {
		const keyLength = getAndVerifyAesKeyLength(key)
		switch (symmetricCipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
				return { cipherVersion: symmetricCipherVersion, encryptionKey: key, authenticationKey: null }
			case SymmetricCipherVersion.AesCbcThenHmac: {
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
				return {
					cipherVersion: symmetricCipherVersion,
					encryptionKey: uint8ArrayToKey(hashedKey.subarray(0, keyLengthInBytes)),
					authenticationKey: uint8ArrayToKey(hashedKey.subarray(keyLengthInBytes, hashedKey.length)),
				}
			}
			default:
				throw new CryptoError(`unexpected cipher version ${symmetricCipherVersion}`)
		}
	}

	private handleSpecialCase(instanceTypeId: InstanceTypeId): InstanceTypeId {
		if (instanceTypeId.app === "tutanota" && instanceTypeId.id === 1290) {
			return {
				app: "tutanota",
				id: 1298,
				name: "MailDetailsDraft",
			}
		}
		return instanceTypeId
	}

	/**
	 * Derive encryption and authentication keys for AEAD from groupKey in the correct version and kdfNonce for the instance type.
	 */
	deriveSubKeysAeadFromGroupKey(groupKey: VersionedKey, kdfNonce: KdfNonce, instanceTypeId: InstanceTypeId): AeadSubKeys {
		const instanceTypeIdWithSpecialHandlingApplied = this.handleSpecialCase(instanceTypeId)
		const context = `${AEAD_GROUP_KEY_NONCE_DERIVATION}${instanceTypeIdWithSpecialHandlingApplied.app}/${instanceTypeIdWithSpecialHandlingApplied.id}`
		const inputKeyMaterial = concat(keyToUint8Array(groupKey.object), kdfNonce)
		return this.deriveAeadSubKeys(inputKeyMaterial, context, { cipherVersion: SymmetricCipherVersion.AeadWithGroupKey, groupKeyVersion: groupKey.version })
	}

	/**
	 * Derive encryption and authentication keys for AEAD from the session key for the instance type.
	 */
	deriveSubKeysAeadFromSessionKey(sessionKey: AesKey, instanceTypeId: InstanceTypeId): AeadSubKeys {
		const instanceTypeIdWithSpecialHandlingApplied = this.handleSpecialCase(instanceTypeId)
		const context = `${AEAD_SESSION_KEY_DERIVATION}${instanceTypeIdWithSpecialHandlingApplied.app}/${instanceTypeIdWithSpecialHandlingApplied.id}`
		const inputKeyMaterial = keyToUint8Array(sessionKey)
		return this.deriveAeadSubKeys(inputKeyMaterial, context, { cipherVersion: SymmetricCipherVersion.AeadWithSessionKey })
	}

	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string, cipherVersion: SymmetricAeadCipherVersionMaybeWithGroupKeyVersion): AeadSubKeys {
		const derivedBytes = blake3Kdf(inputKeyMaterial, context, DEFAULT_TOTAL_KEY_LENGTH_BYTES)

		const encryptionKey = uint8ArrayToKey(derivedBytes.subarray(0, DEFAULT_LENGTH_PER_KEY_BYTES), AesKeyLength.Aes256)
		const authenticationKey = uint8ArrayToKey(derivedBytes.subarray(DEFAULT_LENGTH_PER_KEY_BYTES, DEFAULT_TOTAL_KEY_LENGTH_BYTES), AesKeyLength.Aes256)

		if (cipherVersion.cipherVersion === SymmetricCipherVersion.AeadWithGroupKey) {
			return {
				cipherVersion: cipherVersion.cipherVersion,
				groupKeyVersion: cipherVersion.groupKeyVersion,
				encryptionKey,
				authenticationKey,
				context,
			} as any
		} else {
			return {
				cipherVersion: cipherVersion.cipherVersion,
				encryptionKey,
				authenticationKey,
				context,
			} as any
		}
	}
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
