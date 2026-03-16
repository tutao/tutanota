import { AesKeyLength, getAndVerifyAesKeyLength, getKeyLengthInBytes } from "./AesKeyLength.js"
import { SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { Aes256Key, AesKey, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"
import { blake3Kdf } from "../../hashes/Blake3.js"
import { concat } from "@tutao/tutanota-utils"

export type SymmetricSubKeys = {
	encryptionKey: AesKey
	authenticationKey: AesKey | null
}

export type AeadSubKeys = {
	encryptionKey: Aes256Key
	authenticationKey: Uint8Array
}

const DEFAULT_LENGTH_PER_KEY_BYTES = getKeyLengthInBytes(AesKeyLength.Aes256)
const DEFAULT_TOTAL_KEY_LENGTH_BYTES = 2 * DEFAULT_LENGTH_PER_KEY_BYTES
const UNIT_SEPARATOR_CHAR = String.fromCharCode(0x1f)
const AEAD_GROUP_KEY_NONCE_DERIVATION = "GK and nonce instanceMessageKey" + UNIT_SEPARATOR_CHAR
const AEAD_SESSION_KEY_DERIVATION = "SK instanceSessionKey" + UNIT_SEPARATOR_CHAR

/**
 * Derives keys for symmetric encryption schemes.
 *
 * @deprecated DO NOT USE THIS MANUALLY - EXPORTED ONLY FOR COMPATIBILITY TESTS!
 */
export class SymmetricKeyDeriver {
	/**
	 * Derives encryption and authentication keys as needed for the symmetric cipher implementations
	 */
	deriveSubKeys(key: AesKey, symmetricCipherVersion: SymmetricCipherVersion): SymmetricSubKeys {
		const keyLength = getAndVerifyAesKeyLength(key)
		const keyBytes = keyToUint8Array(key)
		switch (symmetricCipherVersion) {
			case SymmetricCipherVersion.UnusedReservedUnauthenticated:
				return { encryptionKey: key, authenticationKey: null }
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
					encryptionKey: uint8ArrayToKey(hashedKey.subarray(0, keyLengthInBytes)),
					authenticationKey: uint8ArrayToKey(hashedKey.subarray(keyLengthInBytes, hashedKey.length)),
				}
			}
			default:
				throw new Error(`unexpected cipher version ${symmetricCipherVersion}`)
		}
	}

	/**
	 * Derive encryption and authentication keys for AEAD from groupKey in the correct version and kdfNonce for the instance type.
	 */
	deriveSubKeysAeadFromGroupKey(groupKey: AesKey, kdfNonce: Uint8Array, globalInstanceTypeId: string): AeadSubKeys {
		const context = AEAD_GROUP_KEY_NONCE_DERIVATION + globalInstanceTypeId
		const inputKeyMaterial = concat(keyToUint8Array(groupKey), kdfNonce)
		return this.deriveAeadSubKeys(inputKeyMaterial, context)
	}

	/**
	 * Derive encryption and authentication keys for AEAD from the session key for the instance type.
	 */
	deriveSubKeysAeadFromSessionKey(sessionKey: AesKey, globalInstanceTypeId: string): AeadSubKeys {
		const context = AEAD_SESSION_KEY_DERIVATION + globalInstanceTypeId
		const inputKeyMaterial = keyToUint8Array(sessionKey)
		return this.deriveAeadSubKeys(inputKeyMaterial, context)
	}

	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string): AeadSubKeys {
		const derivedBytes = blake3Kdf(inputKeyMaterial, context, DEFAULT_TOTAL_KEY_LENGTH_BYTES)
		return {
			encryptionKey: uint8ArrayToKey(derivedBytes.subarray(0, DEFAULT_LENGTH_PER_KEY_BYTES)),
			authenticationKey: derivedBytes.subarray(DEFAULT_LENGTH_PER_KEY_BYTES, DEFAULT_TOTAL_KEY_LENGTH_BYTES),
		}
	}
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
