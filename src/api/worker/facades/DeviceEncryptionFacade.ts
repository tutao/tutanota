import { aes256RandomKey, aesDecrypt, aesEncrypt, bitArrayToUint8Array, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"

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
		return aesDecrypt(uint8ArrayToBitArray(deviceKey), encryptedData)
	}
}
