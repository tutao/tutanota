import type {SecretStorage} from "./sse/SecretStorage"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {log} from "./DesktopLog"
import {DeviceStorageUnavailableError} from "../api/common/error/DeviceStorageUnavailableError"
import type {Base64, DeferredObject} from "@tutao/tutanota-utils"
import {defer} from "@tutao/tutanota-utils"
import {base64ToKey, keyToBase64} from "@tutao/tutanota-crypto"
// exported for testing
export const SERVICE_NAME = "tutanota-vault"

export enum KeyAccountName {
	DEVICE_KEY = "tuta",
	CREDENTIALS_KEY = "credentials-device-lock-key"
}

export interface DesktopDeviceKeyProvider {
	getDeviceKey(): Promise<Aes256Key>

	getCredentialsKey(): Promise<Aes256Key>
}

export class DeviceKeyProviderImpl implements DesktopDeviceKeyProvider {
	_secretStorage: SecretStorage
	_resolvedKeys: Record<string, DeferredObject<Aes256Key>>
	_crypto: DesktopCryptoFacade

	constructor(secretStorage: SecretStorage, crypto: DesktopCryptoFacade) {
		this._secretStorage = secretStorage
		this._crypto = crypto
		this._resolvedKeys = {}
	}

	/**
	 * get the key used to encrypt alarms and settings
	 */
	async getDeviceKey(): Promise<Aes256Key> {
		return this._resolveKey(KeyAccountName.DEVICE_KEY)
	}

	/**
	 * get the key used to encrypt saved credentials
	 */
	async getCredentialsKey(): Promise<Aes256Key> {
		return this._resolveKey(KeyAccountName.CREDENTIALS_KEY)
	}

	async _resolveKey(account: KeyAccountName): Promise<Aes256Key> {

		// make sure keys are resolved exactly once
		if (!this._resolvedKeys[account]) {
			const deferred = defer<BitArray>()
			this._resolvedKeys[account] = deferred
			let storedKey: Base64 | null = null

			try {
				storedKey = await this._secretStorage.getPassword(SERVICE_NAME, account)
			} catch (e) {
				deferred.reject(new DeviceStorageUnavailableError(`could not retrieve key ${account} from device secret storage`, e))
			}

			if (storedKey) {
				deferred.resolve(base64ToKey(storedKey))
			} else {
				try {
					const newKey = await this._generateAndStoreKey(account)
					deferred.resolve(newKey)
				} catch (e) {
					deferred.reject(new DeviceStorageUnavailableError(`could not create new ${account} key`, e))
				}
			}
		}

		return this._resolvedKeys[account].promise
	}

	async _generateAndStoreKey(account: KeyAccountName): Promise<Aes256Key> {
		log.warn(`key ${account} not found, generating a new one`)

		// save key entry in keychain
		const key: Aes256Key = this._crypto.generateDeviceKey()

		await this._secretStorage.setPassword(SERVICE_NAME, account, keyToBase64(key))
		return key
	}
}