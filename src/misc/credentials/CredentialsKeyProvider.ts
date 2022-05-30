import type {CredentialsStorage} from "./CredentialsProvider.js"
import type {DeviceEncryptionFacade} from "../../api/worker/facades/DeviceEncryptionFacade"
import {base64ToUint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {CredentialEncryptionMode} from "./CredentialEncryptionMode"
import {NativeCredentialsFacade} from "../../native/common/generatedipc/NativeCredentialsFacade.js"

/**
 * Interface for obtaining the key that is used to encrypt credentials. Any access to that key should always be done using this interface
 * rather than directly accessing device storage.
 */
export class CredentialsKeyProvider {

	constructor(
		private readonly nativeCredentials: NativeCredentialsFacade,
		private readonly credentialsStorage: CredentialsStorage,
		private readonly deviceEncryptionFacade: DeviceEncryptionFacade
	) {
	}

	/**
	 * Return the key that is used for encrypting credentials on the device. If no key exists on the device, a new key will be created
	 * and also stored in the device's credentials storage.
	 */
	async getCredentialsKey(): Promise<Uint8Array> {
		const encryptedCredentialsKey = this.credentialsStorage.getCredentialsEncryptionKey()

		if (encryptedCredentialsKey) {
			const credentialsKey = await this.nativeCredentials.decryptUsingKeychain(
				encryptedCredentialsKey,
				this.getEncryptionMode()
			)
			return credentialsKey
		} else {
			const credentialsKey = await this.deviceEncryptionFacade.generateKey()
			const encryptedCredentialsKey = await this.nativeCredentials.encryptUsingKeychain(
				credentialsKey,
				this.getEncryptionMode()
			)

			this.credentialsStorage.setCredentialsEncryptionKey(encryptedCredentialsKey)

			return credentialsKey
		}
	}

	private getEncryptionMode(): CredentialEncryptionMode {
		const encryptionMode = this.credentialsStorage.getCredentialEncryptionMode()

		if (!encryptionMode) {
			throw new Error("Encryption mode not set")
		}

		return encryptionMode
	}
}