// @flow

import {aes256Decrypt, aes256Encrypt, aes256RandomKey, generateIV} from "../crypto/Aes"
import {bitArrayToUint8Array, uint8ArrayToBitArray} from "../crypto/CryptoUtils"

export interface DeviceEncryptionFacade {
	generateKey(): Promise<Uint8Array>;

	encrypt(deviceKey: Uint8Array, data: Uint8Array): Promise<Uint8Array>;

	decrypt(deviceKey: Uint8Array, encryptedData: Uint8Array): Promise<Uint8Array>;
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
