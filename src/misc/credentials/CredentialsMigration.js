// @flow

import {DeviceConfig} from "../DeviceConfig"
import type {DeviceEncryptionFacade} from "../../api/worker/facades/DeviceEncryptionFacade"
import {CredentialEncryptionMode} from "./CredentialEncryptionMode"
import {base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {promiseMap} from "@tutao/tutanota-utils"
import type {NativeWrapper} from "../../native/common/NativeWrapper"
import {Request} from "../../api/common/WorkerProtocol"

/**
 * Performs the credentials migration needed when switching to the tutanota version in which credentials encryption using biometrics has
 * been introduced. This class bypasses CredentialsProvider and CredentialsEncryption which web-layer code should typically not do. We
 * are doing this here regardless since this code will become redundant once all customers have updated. In order for the higher level
 * components (CredentialsProvider, CredentialsEncryption), ... to be used for this use case, their interface would have to be changed quite
 * a bit, which seems undesired given this is throw-away code.
 */
export class CredentialsMigration {
	+_deviceConfig: DeviceConfig
	+_deviceEncryptionFacade: DeviceEncryptionFacade
	+_nativeApp: NativeWrapper

	constructor(deviceConfig: DeviceConfig, deviceEncryptionFacade: DeviceEncryptionFacade, nativeApp: NativeWrapper) {
		this._deviceConfig = deviceConfig
		this._deviceEncryptionFacade = deviceEncryptionFacade
		this._nativeApp = nativeApp
	}

	/**
	 * Migrates the credentials stored on the device to being encrypted using the device's secure storage mechanisms.
	 */
	async migrateCredentials(): Promise<void> {
		if (this._deviceConfig.getCredentialsEncryptionKey()) {
			return
		}
		const storedCredentials = this._deviceConfig.loadAll()
		if (storedCredentials.length === 0) {
			return
		}

		const encryptionKey = await this._deviceEncryptionFacade.generateKey()
		const encryptedCredentials = await promiseMap(storedCredentials, async (credentials) => {
			const encryptedAccessToken = await this._deviceEncryptionFacade.encrypt(encryptionKey, stringToUtf8Uint8Array(credentials.accessToken))
			return {
				...credentials,
				accessToken: uint8ArrayToBase64(encryptedAccessToken)
			}
		})
		const encryptedKeyB64 = await this._nativeApp.invokeNative(
			new Request("encryptUsingKeychain", [CredentialEncryptionMode.DEVICE_LOCK, uint8ArrayToBase64(encryptionKey)])
		)
		this._deviceConfig.setCredentialEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
		this._deviceConfig.setCredentialsEncryptionKey(base64ToUint8Array(encryptedKeyB64))
		for (let encryptedCredential of encryptedCredentials) {
			this._deviceConfig.store(encryptedCredential)
		}
	}
}
