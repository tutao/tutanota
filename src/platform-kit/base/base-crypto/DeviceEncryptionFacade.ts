import { aes256RandomKey, keyToUint8Array, uint8ArrayToKey } from "@tutao/crypto"
import { aesDecrypt, aesEncrypt } from "../../instance-pipeline/instance-pipeline-crypto/Aes"

export class DeviceEncryptionFacade {
	/**
	 * Generates an encryption key.
	 */
	async generateKey(): Promise<Uint8Array> {
		return keyToUint8Array(aes256RandomKey())
	}

	/**
	 * Encrypts {@param data} using {@param deviceKey}.
	 * @param deviceKey Key used for encryption
	 * @param data Data to encrypt.
	 */
	async encrypt(deviceKey: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
		return aesEncrypt(uint8ArrayToKey(deviceKey), data)
	}

	/**
	 * Decrypts {@param encryptedData} using {@param deviceKey}.
	 * @param deviceKey Key used for encryption
	 * @param encryptedData Data to be decrypted.
	 */
	async decrypt(deviceKey: Uint8Array, encryptedData: Uint8Array): Promise<Uint8Array> {
		return aesDecrypt(uint8ArrayToKey(deviceKey), encryptedData)
	}
}
