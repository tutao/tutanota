/* Facade to interact with encryption mechanisms using device capabilities. You can use this facade if you need to encrypt data from the
 *  main thread - the facade will delegate all the actual encryption operations to the native thread.
 * */
import {aes256Decrypt, aes256Encrypt, aes256RandomKey, bitArrayToUint8Array, generateIV, uint8ArrayToBitArray} from "@tutao/tutanota-crypto"
export interface DeviceEncryptionFacade {
    /**
     * Generates an encryption key.
     */
    generateKey(): Promise<Uint8Array>

    /**
     * Encrypts {param data} using {param deviceKey}.
     * @param deviceKey Key used for encryption - key might be encrypted and/or protected by device specific mechanisms.
     * @param data Data to encrypt.
     */
    encrypt(deviceKey: Uint8Array, data: Uint8Array): Promise<Uint8Array>

    /**
     * Decrypts {param encryptedData} using {param deviceKey}.
     * @param deviceKey Key used for encryption - key might be encrypted and/or protected by device specific mechanisms.
     * @param encryptedData Data to be decrypted.
     */
    decrypt(deviceKey: Uint8Array, encryptedData: Uint8Array): Promise<Uint8Array>
}
export class DeviceEncryptionFacadeImpl implements DeviceEncryptionFacade {
    async generateKey(): Promise<Uint8Array> {
        return bitArrayToUint8Array(aes256RandomKey())
    }

    async encrypt(deviceKey: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
        return aes256Encrypt(uint8ArrayToBitArray(deviceKey), data, generateIV())
    }

    async decrypt(deviceKey: Uint8Array, encryptedData: Uint8Array): Promise<Uint8Array> {
        return aes256Decrypt(uint8ArrayToBitArray(deviceKey), encryptedData)
    }
}