import { aesDecrypt, aes256RandomKey, bitArrayToUint8Array, CryptoError, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { CryptoError as TutanotaCryptoError } from "../../common/error/CryptoError.js"
import { aesEncrypt } from "@tutao/tutanota-crypto/dist/encryption/Aes.js"

export class DeviceEncryptionFacade {
	/**
	 * Generates an encryption key.
	 */
	async generateKey(): Promise<Uint8Array> {
		return bitArrayToUint8Array(aes256RandomKey())
	}

	/**
	 * Encrypts {@param data} using {@param deviceKey}.
	 * @param deviceKey Key used for encryption
	 * @param data Data to encrypt.
	 */
	async encrypt(deviceKey: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
		return aesEncrypt(uint8ArrayToBitArray(deviceKey), data)
	}

	/**
	 * Decrypts {@param encryptedData} using {@param deviceKey}.
	 * @param deviceKey Key used for encryption
	 * @param encryptedData Data to be decrypted.
	 */
	async decrypt(deviceKey: Uint8Array, encryptedData: Uint8Array): Promise<Uint8Array> {
		try {
			return aesDecrypt(uint8ArrayToBitArray(deviceKey), encryptedData)
		} catch (e) {
			// CryptoError from tutanota-crypto is not mapped correctly across the worker bridge
			// so we map it to the CryptoError we can actually catch on the other side
			if (e instanceof CryptoError) {
				throw new TutanotaCryptoError("Decrypting credentials failed", e)
			} else {
				throw e
			}
		}
	}
}
