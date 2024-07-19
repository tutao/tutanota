import { DeviceConfig, DeviceConfigCredentials } from "../DeviceConfig.js"
import type { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { PersistedCredentials } from "../../native/common/generatedipc/PersistedCredentials.js"
import { base64ToUint8Array, mapNullable } from "@tutao/tutanota-utils"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade.js"
import { CredentialEncryptionMode } from "./CredentialEncryptionMode.js"
import { AppLockMethod } from "../../native/common/generatedipc/AppLockMethod.js"

function credentialEncryptionModeToAppLockMethod(mode: CredentialEncryptionMode): AppLockMethod {
	switch (mode) {
		case CredentialEncryptionMode.APP_PASSWORD:
		case CredentialEncryptionMode.DEVICE_LOCK:
			return AppLockMethod.None
		case CredentialEncryptionMode.BIOMETRICS:
			return AppLockMethod.Biometrics
		case CredentialEncryptionMode.SYSTEM_PASSWORD:
			return AppLockMethod.SystemPassOrBiometrics
	}
}

export class CredentialFormatMigrator {
	constructor(
		private readonly deviceConfig: DeviceConfig,
		private readonly nativeCredentialFacade: NativeCredentialsFacade | null,
		private readonly mobileSystemFacade: MobileSystemFacade | null,
	) {}

	async migrate(): Promise<void> {
		try {
			await this.migrateToNativeCredentials()
		} catch (e) {
			console.error(e)
			await Dialog.message(
				() => "Could not migrate credentials",
				`${e.name} ${e.message}
${e.stack}`,
			).then(() => this.migrate())
		}
	}

	/**
	 * Migrate existing credentials to native db if the migration haven't happened once. Also generate database key if missing.
	 */
	private async migrateToNativeCredentials() {
		if (this.nativeCredentialFacade != null && !this.deviceConfig.getIsCredentialsMigratedToNative()) {
			console.log("Migrating credentials to native")
			const allPersistedCredentials = this.deviceConfig.getCredentials().map(deviceConfigCredentialsToPersisted)
			const encryptionMode = await this.deviceConfig.getCredentialEncryptionMode()
			const credentialsKey = await this.deviceConfig.getCredentialsEncryptionKey()
			if (encryptionMode != null && credentialsKey != null) {
				if (this.mobileSystemFacade != null) {
					await this.mobileSystemFacade.setAppLockMethod(credentialEncryptionModeToAppLockMethod(encryptionMode))
				}
				console.log("migrating credentials", allPersistedCredentials)
				await this.nativeCredentialFacade.migrateToNativeCredentials(allPersistedCredentials, encryptionMode, credentialsKey)
			} else {
				console.log("Skipping migration as encryption data is not there")
			}
			console.log("Stored credentials in native")

			await this.deviceConfig.clearCredentialsData()

			console.log("Cleared credentials in deviceConfig")

			this.deviceConfig.setIsCredentialsMigratedToNative(true)
		}
	}
}

function deviceConfigCredentialsToPersisted(deviceConfigCredentials: DeviceConfigCredentials): PersistedCredentials {
	return {
		credentialInfo: deviceConfigCredentials.credentialInfo,
		encryptedPassword: deviceConfigCredentials.encryptedPassword,
		encryptedPassphraseKey: mapNullable(deviceConfigCredentials.encryptedPassphraseKey, base64ToUint8Array),
		accessToken: base64ToUint8Array(deviceConfigCredentials.accessToken),
		databaseKey: mapNullable(deviceConfigCredentials.databaseKey, base64ToUint8Array),
	}
}
