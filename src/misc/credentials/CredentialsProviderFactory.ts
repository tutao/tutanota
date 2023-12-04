import type { CredentialsAndDatabaseKey, CredentialsEncryption, PersistentCredentials } from "./CredentialsProvider.js"
import { CredentialsProvider } from "./CredentialsProvider.js"
import { deviceConfig } from "../DeviceConfig"
import { isAdminClient, isBrowser, isDesktop } from "../../api/common/Env"
import type { DeviceEncryptionFacade } from "../../api/worker/facades/DeviceEncryptionFacade"
import { CredentialsKeyProvider } from "./CredentialsKeyProvider"
import { NativeCredentialsEncryption } from "./NativeCredentialsEncryption"
import type { NativeInterface } from "../../native/common/NativeInterface"
import { assertNotNull } from "@tutao/tutanota-utils"
import { DatabaseKeyFactory } from "./DatabaseKeyFactory"
import { DefaultCredentialsKeyMigrator, StubCredentialsKeyMigrator } from "./CredentialsKeyMigrator.js"
import { InterWindowEventFacadeSendDispatcher } from "../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"

export function usingKeychainAuthenticationWithOptions(): boolean {
	return !isBrowser() && !isAdminClient()
}

/**
 * Factory method for credentials provider that will return an instance injected with the implementations appropriate for the platform.
 * @param deviceEncryptionFacade
 * @param nativeApp: If {@code usingKeychainAuthentication} would return true, this _must not_ be null
 * @param sqlCipherFacade
 * @param interWindowEventSender
 */
export async function createCredentialsProvider(
	deviceEncryptionFacade: DeviceEncryptionFacade,
	nativeApp: NativeInterface | null,
	sqlCipherFacade: SqlCipherFacade,
	interWindowEventSender: InterWindowEventFacadeSendDispatcher | null,
): Promise<CredentialsProvider> {
	if (usingKeychainAuthenticationWithOptions()) {
		const { NativeCredentialsFacadeSendDispatcher } = await import("../../native/common/generatedipc/NativeCredentialsFacadeSendDispatcher.js")
		const nativeCredentials = new NativeCredentialsFacadeSendDispatcher(assertNotNull(nativeApp))
		const credentialsKeyProvider = new CredentialsKeyProvider(nativeCredentials, deviceConfig, deviceEncryptionFacade)
		const credentialsEncryption = new NativeCredentialsEncryption(credentialsKeyProvider, deviceEncryptionFacade, nativeCredentials)
		const credentialsKeyMigrator = new DefaultCredentialsKeyMigrator(nativeCredentials)
		return new CredentialsProvider(
			credentialsEncryption,
			deviceConfig,
			credentialsKeyMigrator,
			new DatabaseKeyFactory(deviceEncryptionFacade),
			sqlCipherFacade,
			isDesktop() ? interWindowEventSender : null,
		)
	} else {
		return new CredentialsProvider(
			new NoopCredentialsEncryption(),
			deviceConfig,
			new StubCredentialsKeyMigrator(),
			new DatabaseKeyFactory(deviceEncryptionFacade),
			null,
			null,
		)
	}
}

/**
 * This is a temporary stub that we will replace soon by some mechanism that will be able to utilize fingerprint/pin on mobile devices
 * for encryption of login data. Using this implementation does not mean we do not encrypt credentials currently since there is an
 * additional mechanism for credentials encryption using an access key stored server side. This is done in LoginFacade.
 */

class NoopCredentialsEncryption implements CredentialsEncryption {
	async encrypt({ credentials, databaseKey }: CredentialsAndDatabaseKey): Promise<PersistentCredentials> {
		const { encryptedPassword } = credentials

		if (encryptedPassword == null) {
			throw new Error("Trying to encrypt non-persistent credentials")
		}

		return {
			credentialInfo: {
				login: credentials.login,
				userId: credentials.userId,
				type: credentials.type,
			},
			encryptedPassword,
			accessToken: credentials.accessToken,
			databaseKey: null,
		}
	}

	async decrypt(encryptedCredentials: PersistentCredentials): Promise<CredentialsAndDatabaseKey> {
		return {
			credentials: {
				login: encryptedCredentials.credentialInfo.login,
				encryptedPassword: encryptedCredentials.encryptedPassword,
				accessToken: encryptedCredentials.accessToken,
				userId: encryptedCredentials.credentialInfo.userId,
				type: encryptedCredentials.credentialInfo.type,
			},
			databaseKey: null,
		}
	}

	async getSupportedEncryptionModes() {
		return []
	}
}
