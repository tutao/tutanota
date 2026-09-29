import { Aes, keyToUint8Array, SymmetricCipherUtils, uint8ArrayToKey } from "@tutao/crypto"

export class DeviceEncryptionFacade {
	constructor(
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
		private readonly aes: Aes,
	) {}

	/**
	 * Generates an encryption key.
	 */
	async generateKey(): Promise<Uint8Array<ArrayBuffer>> {
		return keyToUint8Array(this.symmetricCipherUtils.aes256RandomKey())
	}

	/**
	 * Encrypts {@param data} using {@param deviceKey}.
	 * @param deviceKey Key used for encryption
	 * @param data Data to encrypt.
	 */
	async encrypt(deviceKey: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
		return this.aes.aesEncrypt(uint8ArrayToKey(deviceKey), data)
	}

	/**
	 * Decrypts {@param encryptedData} using {@param deviceKey}.
	 * @param deviceKey Key used for encryption
	 * @param encryptedData Data to be decrypted.
	 */
	async decrypt(deviceKey: Uint8Array<ArrayBuffer>, encryptedData: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
		return this.aes.aesDecrypt(uint8ArrayToKey(deviceKey), encryptedData)
	}
}
