// @flow
import type {NativeWrapper} from "../../native/common/NativeWrapper"
import type {CredentialsStorage} from "./CredentialsProvider"
import type {DeviceEncryptionFacade} from "../../api/worker/facades/DeviceEncryptionFacade"
import {Request} from "../../api/common/WorkerProtocol"
import {base64ToUint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {CredentialEncryptionModeEnum} from "./CredentialEncryptionMode"

/**
 * Interface for obtaining the key that is used to encrypt credentials. Any access to that key should always be done using this interface
 * rather than directly accessing device storage.
 */
export interface ICredentialsKeyProvider {
	/**
	 * Return the key that is used for encrypting credentials on the device. If no key exists on the device, a new key will be created
	 * and also stored in the device's credentials storage.
	 */
	getCredentialsKey(): Promise<Uint8Array>;
}

export class CredentialsKeyProvider implements ICredentialsKeyProvider {
	+_nativeApp: NativeWrapper
	+_credentialsStorage: CredentialsStorage
	+_deviceEncryptionFacade: DeviceEncryptionFacade

	constructor(nativeApp: NativeWrapper, _credentialsStorage: CredentialsStorage, deviceEncryptionFacade: DeviceEncryptionFacade) {
		this._nativeApp = nativeApp
		this._credentialsStorage = _credentialsStorage
		this._deviceEncryptionFacade = deviceEncryptionFacade
	}

	async getCredentialsKey(): Promise<Uint8Array> {
		const encryptedCredentialsKey = this._credentialsStorage.getCredentialsEncryptionKey()
		if (encryptedCredentialsKey) {
			const base64CredentialsKey = await this._nativeApp.invokeNative(
				new Request("decryptUsingKeychain", [this._getEncryptionMode(), uint8ArrayToBase64(encryptedCredentialsKey)])
			)
			return base64ToUint8Array(base64CredentialsKey)
		} else {
			const credentialsKey = await this._deviceEncryptionFacade.generateKey()
			const encryptedCredentialsKey = await this._nativeApp.invokeNative(new Request("encryptUsingKeychain", [
				this._getEncryptionMode(), uint8ArrayToBase64(credentialsKey)
			]))
			this._credentialsStorage.setCredentialsEncryptionKey(base64ToUint8Array(encryptedCredentialsKey))
			return credentialsKey
		}
	}


	_getEncryptionMode(): CredentialEncryptionModeEnum {
		const encryptionMode = this._credentialsStorage.getCredentialEncryptionMode()
		if (!encryptionMode) {
			throw new Error("Encryption mode not set")
		}
		return encryptionMode
	}
}
