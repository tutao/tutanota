import { AesKeyLength, getAndVerifyAesKeyLength, getKeyLengthInBytes } from "./AesKeyLength.js"
import { SymmetricCipherVersion } from "./SymmetricCipherVersion.js"
import { Aes256Key, AesKey, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"

/**
 * @private visible for tests
 * */
export const AEAD_KEY_DERIVATION_INFO = "AEAD key splitting"

export type SymmetricSubKeys = {
	encryptionKey: AesKey
	authenticationKey: AesKey | null
}

export type AeadSubKeys = {
	encryptionKey: Aes256Key
	authenticationKey: Aes256Key
}

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
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
