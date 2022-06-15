import type {CredentialsStorage} from "./CredentialsProvider"
import type {DeviceEncryptionFacade} from "../../api/worker/facades/DeviceEncryptionFacade"
import {base64ToUint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {CredentialEncryptionMode} from "./CredentialEncryptionMode"
import {NativeCredentialsFacade} from "../../native/common/generatedipc/NativeCredentialsFacade.js"

/**
 * Interface for obtaining the key that is used to encrypt credentials. Any access to that key should always be done using this interface
 * rather than directly accessing device storage.
 */
export interface ICredentialsKeyProvider {
	/**
	 * Return the key that is used for encrypting credentials on the device. If no key exists on the device, a new key will be created
	 * and also stored in the device's credentials storage.
	 */
	getCredentialsKey(): Promise<Uint8Array>
}

export class CredentialsKeyProvider implements ICredentialsKeyProvider {

	constructor(
		private readonly nativeCredentials: NativeCredentialsFacade,
		private readonly credentialsStorage: CredentialsStorage,
		private readonly deviceEncryptionFacade: DeviceEncryptionFacade
	) {
	}

	async getCredentialsKey(): Promise<Uint8Array> {
		const encryptedCredentialsKey = this.credentialsStorage.getCredentialsEncryptionKey()

		if (encryptedCredentialsKey) {
			const base64CredentialsKey = await this.nativeCredentials.decryptUsingKeychain(
				uint8ArrayToBase64(encryptedCredentialsKey),
				this._getEncryptionMode()
			)
			return base64ToUint8Array(base64CredentialsKey)
		} else {
			const credentialsKey = await this.deviceEncryptionFacade.generateKey()
			const encryptedCredentialsKey = await this.nativeCredentials.encryptUsingKeychain(
				uint8ArrayToBase64(credentialsKey),
				this._getEncryptionMode()
			)

			this.credentialsStorage.setCredentialsEncryptionKey(base64ToUint8Array(encryptedCredentialsKey))

			return credentialsKey
		}
	}

	_getEncryptionMode(): CredentialEncryptionMode {
		const encryptionMode = this.credentialsStorage.getCredentialEncryptionMode()

		if (!encryptionMode) {
			throw new Error("Encryption mode not set")
		}

		return encryptionMode
	}
}