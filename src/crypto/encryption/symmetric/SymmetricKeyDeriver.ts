import { AesKeyLength, getAndVerifyAesKeyLength, getKeyLengthInBytes } from "./AesKeyLength.js"
import {
	SymmetricAeadCipherVersionMaybeWithGroupKeyVersion,
	SymmetricAesCipherVersion,
	SymmetricCipherVersion,
	SymmetricCipherVersionAeadWithGroupKey,
	SymmetricCipherVersionAeadWithSessionKey,
} from "./SymmetricCipherVersion.js"
import { Aes256Key, AesKey, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"
import { blake3Kdf } from "../../hashes/Blake3.js"
import { concat } from "@tutao/utils"
import { CryptoError } from "../../error.js"
import { DomainSeparator, UNIT_SEPARATOR_CHAR } from "../../misc/Constants.js"
import { VersionedKey } from "../../CryptoWrapper"

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

export type AesSubKeys = UnusedReservedUnauthenticatedSubKeys | AesCbcThenHmacSubKeys

export type AeadWithGroupKeySubKeys = {
	cipherVersion: SymmetricCipherVersionAeadWithGroupKey
	encryptionKey: Aes256Key
	authenticationKey: Aes256Key
}
export type AeadWithSessionKeySubKeys = {
	cipherVersion: SymmetricCipherVersionAeadWithSessionKey
	encryptionKey: Aes256Key
	authenticationKey: Aes256Key
}

export type AeadSubKeys = AeadWithGroupKeySubKeys | AeadWithSessionKeySubKeys

export type SymmetricSubKeys = AesSubKeys | AeadSubKeys

const DEFAULT_LENGTH_PER_KEY_BYTES = getKeyLengthInBytes(AesKeyLength.Aes256)
const DEFAULT_TOTAL_KEY_LENGTH_BYTES = 2 * DEFAULT_LENGTH_PER_KEY_BYTES
const AEAD_GROUP_KEY_NONCE_DERIVATION: DomainSeparator = `GK and nonce instanceMessageKey${UNIT_SEPARATOR_CHAR}`
const AEAD_SESSION_KEY_DERIVATION: DomainSeparator = `SK instanceSessionKey${UNIT_SEPARATOR_CHAR}`

/**
 * Derives keys for symmetric encryption schemes.
 *
 * @deprecated DO NOT USE THIS MANUALLY - EXPORTED ONLY FOR COMPATIBILITY TESTS!
 */
export class SymmetricKeyDeriver {
	/**
	 * Derives encryption and authentication keys as needed for the symmetric cipher implementations
	 */
	deriveSubKeys(key: AesKey, symmetricCipherVersion: SymmetricAesCipherVersion): AesSubKeys {
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

	/**
	 * Derive encryption and authentication keys for AEAD from groupKey in the correct version and kdfNonce for the instance type.
	 */
	deriveSubKeysAeadFromGroupKey(groupKey: VersionedKey, kdfNonce: Uint8Array, globalInstanceTypeId: string): AeadSubKeys {
		const context = AEAD_GROUP_KEY_NONCE_DERIVATION + globalInstanceTypeId
		const inputKeyMaterial = concat(keyToUint8Array(groupKey.object), kdfNonce)
		return this.deriveAeadSubKeys(inputKeyMaterial, context, { cipherVersion: SymmetricCipherVersion.AeadWithGroupKey, groupKeyVersion: groupKey.version })
	}

	/**
	 * Derive encryption and authentication keys for AEAD from the session key for the instance type.
	 */
	deriveSubKeysAeadFromSessionKey(sessionKey: AesKey, globalInstanceTypeId: string): AeadSubKeys {
		const context = AEAD_SESSION_KEY_DERIVATION + globalInstanceTypeId
		const inputKeyMaterial = keyToUint8Array(sessionKey)
		return this.deriveAeadSubKeys(inputKeyMaterial, context, { cipherVersion: SymmetricCipherVersion.AeadWithSessionKey })
	}

	private deriveAeadSubKeys(inputKeyMaterial: Uint8Array, context: string, cipherVersion: SymmetricAeadCipherVersionMaybeWithGroupKeyVersion): AeadSubKeys {
		const derivedBytes = blake3Kdf(inputKeyMaterial, context, DEFAULT_TOTAL_KEY_LENGTH_BYTES)

		const encryptionKey = uint8ArrayToKey(derivedBytes.subarray(0, DEFAULT_LENGTH_PER_KEY_BYTES))
		const authenticationKey = uint8ArrayToKey(derivedBytes.subarray(DEFAULT_LENGTH_PER_KEY_BYTES, DEFAULT_TOTAL_KEY_LENGTH_BYTES))

		if (cipherVersion.cipherVersion === SymmetricCipherVersion.AeadWithGroupKey) {
			return {
				cipherVersion,
				encryptionKey,
				authenticationKey,
			}
		} else {
			return {
				cipherVersion,
				encryptionKey,
				authenticationKey,
			}
		}
	}
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
