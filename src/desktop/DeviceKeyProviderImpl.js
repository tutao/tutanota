//@flow

import {base64ToKey, keyToBase64} from "../api/worker/crypto/CryptoUtils"
import type {SecretStorage} from "./sse/SecretStorage"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {log} from "./DesktopLog"
import {DeviceStorageUnavailableError} from "../api/common/error/DeviceStorageUnavailableError"

// exported for testing
export const SERVICE_NAME = 'tutanota-vault'
export const ACCOUNT_NAME = 'tuta'

export interface DeviceKeyProvider {
	getDeviceKey(): Promise<Aes256Key>;
}

export class DeviceKeyProviderImpl implements DeviceKeyProvider {
	_secretStorage: SecretStorage;
	_deviceKey: Aes256Key
	_crypto: DesktopCryptoFacade

	constructor(secretStorage: SecretStorage, crypto: DesktopCryptoFacade) {
		this._secretStorage = secretStorage
		this._crypto = crypto
	}

	async getDeviceKey(): Promise<Aes256Key> {
		if (this._deviceKey) return this._deviceKey
		try {
			const storedKey = await this._secretStorage.getPassword(SERVICE_NAME, ACCOUNT_NAME)
			this._deviceKey = storedKey ? base64ToKey(storedKey) : await this._generateAndStoreDeviceKey()
			return this._deviceKey
		} catch (e) {
			throw new DeviceStorageUnavailableError("could not access device secret storage", e)
		}
	}

	async _generateAndStoreDeviceKey(): Promise<Aes256Key> {
		log.warn("device key not found, generating a new one")
		// save key entry in keychain
		const key: Aes256Key = this._crypto.generateDeviceKey()
		await this._secretStorage.setPassword(SERVICE_NAME, ACCOUNT_NAME, keyToBase64(key))
		return key
	}
}