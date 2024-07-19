import { PersistedCredentials } from "../../native/common/generatedipc/PersistedCredentials.js"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { DeviceConfig, DeviceConfigCredentials } from "../DeviceConfig.js"
import { CredentialEncryptionMode } from "./CredentialEncryptionMode.js"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { base64ToUint8Array, mapNullable, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"

/**
 * This is a temporary stub that we will replace soon by some mechanism that will be able to utilize fingerprint/pin on mobile devices
 * for encryption of login data. Using this implementation does not mean we do not encrypt credentials currently since there is an
 * additional mechanism for credentials encryption using an access key stored server side. This is done in LoginFacade.
 */

export class WebCredentialsFacade implements NativeCredentialsFacade {
	constructor(private readonly deviceConfig: DeviceConfig) {}

	async clear(): Promise<void> {
		const allCredentials = this.deviceConfig.getCredentials()
		for (const credentials of allCredentials) {
			await this.deviceConfig.deleteByUserId(credentials.credentialInfo.userId)
		}
	}

	deleteByUserId(id: string): Promise<void> {
		return this.deviceConfig.deleteByUserId(id)
	}

	async getCredentialEncryptionMode(): Promise<CredentialEncryptionMode | null> {
		return null
	}

	async loadAll(): Promise<ReadonlyArray<PersistedCredentials>> {
		return this.deviceConfig.getCredentials().map(deviceConfigCredentialsToPersisted)
	}

	async loadByUserId(id: string): Promise<UnencryptedCredentials | null> {
		const deviceConfigCredentials = this.deviceConfig.getCredentialsByUserId(id)
		if (deviceConfigCredentials == null) return null
		return {
			credentialInfo: deviceConfigCredentials.credentialInfo,
			encryptedPassword: deviceConfigCredentials.encryptedPassword,
			encryptedPassphraseKey: mapNullable(deviceConfigCredentials.encryptedPassphraseKey, base64ToUint8Array),
			accessToken: deviceConfigCredentials.accessToken,
			databaseKey: null,
		}
	}

	async setCredentialEncryptionMode(_: CredentialEncryptionMode): Promise<void> {}

	async store(credentials: UnencryptedCredentials): Promise<void> {
		const deviceConfigCredentials: DeviceConfigCredentials = {
			credentialInfo: credentials.credentialInfo,
			encryptedPassphraseKey: mapNullable(credentials.encryptedPassphraseKey, uint8ArrayToBase64),
			accessToken: credentials.accessToken,
			databaseKey: null,
			encryptedPassword: credentials.encryptedPassword,
		}
		this.deviceConfig.storeCredentials(deviceConfigCredentials)
	}

	async storeEncrypted(credentials: PersistedCredentials): Promise<void> {
		this.deviceConfig.storeCredentials(persistedCredentialsToDeviceConfig(credentials))
	}

	async getSupportedEncryptionModes() {
		return []
	}

	migrateToNativeCredentials(
		credentials: ReadonlyArray<PersistedCredentials>,
		encryptionMode: CredentialEncryptionMode | null,
		credentialsKey: Uint8Array | null,
	): Promise<void> {
		throw new Error("Method not implemented.")
	}
}

function persistedCredentialsToDeviceConfig(persistentCredentials: PersistedCredentials): DeviceConfigCredentials {
	return {
		credentialInfo: persistentCredentials.credentialInfo,
		encryptedPassword: persistentCredentials.encryptedPassword,
		encryptedPassphraseKey: mapNullable(persistentCredentials.encryptedPassphraseKey, uint8ArrayToBase64),
		accessToken: utf8Uint8ArrayToString(persistentCredentials.accessToken),
		databaseKey: mapNullable(persistentCredentials.databaseKey, uint8ArrayToBase64),
	}
}

function deviceConfigCredentialsToPersisted(deviceConfigCredentials: DeviceConfigCredentials): PersistedCredentials {
	return {
		credentialInfo: deviceConfigCredentials.credentialInfo,
		encryptedPassword: deviceConfigCredentials.encryptedPassword,
		encryptedPassphraseKey: mapNullable(deviceConfigCredentials.encryptedPassphraseKey, base64ToUint8Array),
		accessToken: stringToUtf8Uint8Array(deviceConfigCredentials.accessToken),
		databaseKey: mapNullable(deviceConfigCredentials.databaseKey, base64ToUint8Array),
	}
}
