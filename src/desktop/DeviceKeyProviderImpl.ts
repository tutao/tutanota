import type {SecretStorage} from "./sse/SecretStorage"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {log} from "./DesktopLog"
import {DeviceStorageUnavailableError} from "../api/common/error/DeviceStorageUnavailableError"
import type {Base64, DeferredObject} from "@tutao/tutanota-utils"
import {defer} from "@tutao/tutanota-utils"
import {base64ToKey, keyToBase64} from "@tutao/tutanota-crypto"
// exported for testing
export const SERVICE_NAME = "tutanota-vault"
export const ACCOUNT_NAME = "tuta"

export interface DesktopDeviceKeyProvider {
	getDeviceKey(): Promise<Aes256Key>
}

export class DeviceKeyProviderImpl implements DesktopDeviceKeyProvider {
	_secretStorage: SecretStorage
	_deviceKey: DeferredObject<Aes256Key>
	_keyResolved: boolean = false
	_crypto: DesktopCryptoFacade

	constructor(secretStorage: SecretStorage, crypto: DesktopCryptoFacade) {
		this._secretStorage = secretStorage
		this._crypto = crypto
		this._deviceKey = defer()
	}

	async getDeviceKey(): Promise<Aes256Key> {
		// we want to retrieve the key exactly once
		if (!this._keyResolved) {
			this._keyResolved = true

			this._resolveDeviceKey().then()
		}

		return this._deviceKey.promise
	}

	async _resolveDeviceKey(): Promise<void> {
		let storedKey: Base64 | null = null

		try {
			storedKey = await this._secretStorage.getPassword(SERVICE_NAME, ACCOUNT_NAME)
		} catch (e) {
			this._deviceKey.reject(new DeviceStorageUnavailableError("could not retrieve device key from device secret storage", e))
			return
		}

		if (storedKey) {
			this._deviceKey.resolve(base64ToKey(storedKey))
		} else {
			try {
				const newKey = await this._generateAndStoreDeviceKey()
				this._deviceKey.resolve(newKey)
			} catch (e) {
				this._deviceKey.reject(new DeviceStorageUnavailableError("could not create new device key", e))
			}
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