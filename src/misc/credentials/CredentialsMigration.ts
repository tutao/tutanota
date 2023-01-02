import { DeviceConfig } from "../DeviceConfig"
import type { DeviceEncryptionFacade } from "../../api/worker/facades/DeviceEncryptionFacade"
import { CredentialEncryptionMode } from "./CredentialEncryptionMode"
import { base64ToUint8Array, promiseMap, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import type { NativeInterface } from "../../native/common/NativeInterface"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"

/**
 * Performs the credentials migration needed when switching to the tutanota version in which credentials encryption using biometrics has
 * been introduced. This class bypasses CredentialsProvider and CredentialsEncryption which web-layer code should typically not do. We
 * are doing this here regardless since this code will become redundant once all customers have updated. In order for the higher level
 * components (CredentialsProvider, CredentialsEncryption), ... to be used for this use case, their interface would have to be changed quite
 * a bit, which seems undesired given this is throw-away code.
 */
export class CredentialsMigration {
	constructor(
		private readonly deviceConfig: DeviceConfig,
		private readonly deviceEncryptionFacade: DeviceEncryptionFacade,
		private readonly nativeCredentialsFacade: NativeCredentialsFacade,
	) {}

	/**
	 * Migrates the credentials stored on the device to being encrypted using the device's secure storage mechanisms.
	 */
	async migrateCredentials(): Promise<void> {
		if (this.deviceConfig.getCredentialsEncryptionKey()) {
			return
		}

		const storedCredentials = this.deviceConfig.loadAll()

		if (storedCredentials.length === 0) {
			return
		}

		const encryptionKey = await this.deviceEncryptionFacade.generateKey()
		const encryptedCredentials = await promiseMap(storedCredentials, async (credentials) => {
			const encryptedAccessToken = await this.deviceEncryptionFacade.encrypt(encryptionKey, stringToUtf8Uint8Array(credentials.accessToken))
			return { ...credentials, accessToken: uint8ArrayToBase64(encryptedAccessToken) }
		})
		const encryptedKey = await this.nativeCredentialsFacade.encryptUsingKeychain(encryptionKey, CredentialEncryptionMode.DEVICE_LOCK)

		this.deviceConfig.setCredentialEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)

		this.deviceConfig.setCredentialsEncryptionKey(encryptedKey)

		for (let encryptedCredential of encryptedCredentials) {
			this.deviceConfig.store(encryptedCredential)
		}
	}
}
