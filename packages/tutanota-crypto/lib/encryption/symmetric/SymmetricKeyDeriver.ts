import { AesKeyLength, getAndVerifyAesKeyLength, getKeyLengthAsBytes } from "./AesKeyLength.js"
import { SymmetricCipherVersion, symmetricCipherVersionToUint8Array } from "./SymmetricCipherVersion.js"
import { Aes256Key, AesKey, keyToUint8Array, uint8ArrayToKey } from "./SymmetricCipherUtils.js"
import { sha256Hash } from "../../hashes/Sha256.js"
import { sha512Hash } from "../../hashes/Sha512.js"
import { concat } from "@tutao/tutanota-utils"
import { hkdf } from "../../hashes/HKDF.js"

/**
 * @private visible for tests
 * */
export const AEAD_KEY_DERIVATION_INFO = "AEAD key splitting"

export type SubKeys = {
	encryptionKey: AesKey
	authenticationKey: AesKey | null
}
export class SymmetricKeyDeriver {
	/**
	 * Derives encryption and authentication keys as needed for the symmetric cipher implementations
	 */
	deriveSubKeys(key: AesKey, symmetricCipherVersion: SymmetricCipherVersion): SubKeys {
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
				return {
					encryptionKey: uint8ArrayToKey(hashedKey.subarray(0, getKeyLengthAsBytes(keyLength))),
					authenticationKey: uint8ArrayToKey(hashedKey.subarray(getKeyLengthAsBytes(keyLength), hashedKey.length)),
				}
			}
			case SymmetricCipherVersion.Aead: {
				//(EK , AK ) ← HKDF (K , null, "AEAD key splitting"||VAEAD , 2 ∗ 256)
				const infoWithCipherVersion = concat(Uint8Array.from(AEAD_KEY_DERIVATION_INFO), symmetricCipherVersionToUint8Array(symmetricCipherVersion))
				const outputKeyLength = 2 * getKeyLengthAsBytes(AesKeyLength.Aes256)
				const derivedKeys = hkdf(null, keyBytes, infoWithCipherVersion, outputKeyLength)
				const encryptionKey: Aes256Key = uint8ArrayToKey(derivedKeys.subarray(0, getKeyLengthAsBytes(AesKeyLength.Aes256)))
				const authenticationKey: Aes256Key = uint8ArrayToKey(derivedKeys.subarray(getKeyLengthAsBytes(AesKeyLength.Aes256), outputKeyLength))
				return { encryptionKey, authenticationKey }
			}
			default:
				throw new Error(`unexpected cipher version ${symmetricCipherVersion}`)
		}
	}
}

export const SYMMETRIC_KEY_DERIVER = new SymmetricKeyDeriver()
